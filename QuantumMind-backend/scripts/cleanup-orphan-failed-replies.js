/**
 * One-off cleanup: remove `failed` outbound rows whose message WAS in fact
 * delivered.
 *
 * WHY THESE EXIST
 * ---------------
 * The agent-reply intent was registered with `{ async: true }`. eventemitter2
 * wraps such a listener in a `setImmediate` shim and returns the Timeout object
 * rather than the handler's result, so `emitAsync` resolved to `[Timeout]`, the
 * inbox saw no `accepted` flag, and marked the reply `failed` — even though
 * WhatsApp had already sent it. The message arrived on the customer's phone and
 * echoed back as a second, `sent`/`read` row.
 *
 * The result is a pair per reply: one real row carrying the channel's id, and one
 * orphan stuck at `failed` with only a `pending:` placeholder. The dashboard
 * rendered both, which is the duplicate bubble with the red error icon.
 *
 * The code fix removes the cause. This removes the rows it already produced.
 *
 * SAFETY
 * ------
 * Only deletes a row when ALL of these hold:
 *   - direction is outbound
 *   - status is `failed`
 *   - its externalMessageId is a local `pending:` placeholder, so the channel
 *     never acknowledged it
 *   - a SIBLING row exists on the same thread with the same text, an outbound
 *     direction, and a real channel id — i.e. proof the message did go out
 *
 * A genuinely failed reply with no delivered twin is therefore LEFT ALONE, so an
 * agent can still see and retry it. Dry run by default.
 *
 * Usage:  node scripts/cleanup-orphan-failed-replies.js [--apply]
 */
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  'mongodb://127.0.0.1:27017/Cuprous';

(async () => {
  mongoose.set('strictQuery', false);
  await mongoose.connect(URI);
  const chats = mongoose.connection.db.collection('chats');

  const candidates = await chats
    .find({
      direction: 'outbound',
      status: 'failed',
      externalMessageId: { $regex: '^pending:' },
    })
    .project({ _id: 1, channelThread: 1, message: 1, chatId: 1 })
    .toArray();

  console.log(`${candidates.length} failed placeholder row(s) to examine.\n`);

  const orphans = [];
  for (const row of candidates) {
    // Proof of delivery: same thread, same text, outbound, real channel id.
    const delivered = await chats.findOne({
      _id: { $ne: row._id },
      channelThread: row.channelThread,
      message: row.message,
      direction: 'outbound',
      externalMessageId: { $exists: true, $not: { $regex: '^pending:' } },
    });

    if (delivered) {
      orphans.push(row);
      console.log(
        `  DUPLICATE  ${JSON.stringify((row.message || '').slice(0, 40))}  ` +
          `(delivered as ${delivered.externalMessageId}, status=${delivered.status})`,
      );
    } else {
      console.log(
        `  KEEP       ${JSON.stringify((row.message || '').slice(0, 40))}  ` +
          `(no delivered twin — a real failure, left for retry)`,
      );
    }
  }

  console.log(
    `\n${orphans.length} duplicate(s) to remove, ` +
      `${candidates.length - orphans.length} genuine failure(s) kept.`,
  );

  if (!orphans.length) {
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete the duplicates.');
    await mongoose.disconnect();
    return;
  }

  const ids = orphans.map((o) => o._id);
  const res = await chats.deleteMany({ _id: { $in: ids } });
  console.log(`\nDeleted ${res.deletedCount} row(s).`);

  // The rows were also pushed onto Conversation.chats; drop the dangling refs so
  // a conversation-scoped read does not resolve them to nothing.
  const conversations = mongoose.connection.db.collection('conversations');
  const pull = await conversations.updateMany(
    { chats: { $in: ids } },
    { $pull: { chats: { $in: ids } } },
  );
  console.log(`Cleaned references on ${pull.modifiedCount} conversation(s).`);

  await mongoose.disconnect();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
