/**
 * One-off repair: give every outbound channel row that has no `externalMessageId`
 * a unique `pending:` placeholder.
 *
 * WHY
 * ---
 * The unique index `(channelThread, externalMessageId)` is `sparse`, but a compound
 * sparse index only skips a document when EVERY indexed field is missing. A row
 * with a `channelThread` and no `externalMessageId` is therefore indexed as
 * `externalMessageId: null`, so only one such row can exist per thread.
 *
 * The observed effect: one reply left in `pending`/`failed` permanently blocked
 * every later reply on that thread with E11000, surfacing as
 * "500 Could not persist the reply".
 *
 * The code fix writes a unique placeholder going forward. This script clears rows
 * written before that fix so the affected threads work again.
 *
 * SAFE TO RE-RUN. It only touches rows that have a `channelThread`, no
 * `externalMessageId`, and an outbound direction — never an inbound message, and
 * never a row that already carries a channel id. Reports what it did and changes
 * nothing when there is nothing to change.
 *
 * Usage:  node scripts/backfill-pending-external-ids.js [--apply]
 *         (without --apply it only reports)
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

  const filter = {
    channelThread: { $exists: true, $ne: null },
    externalMessageId: { $exists: false },
    direction: 'outbound',
  };

  const rows = await chats
    .find(filter)
    .project({ _id: 1, chatId: 1, channelThread: 1, status: 1, message: 1 })
    .toArray();

  console.log(`Found ${rows.length} outbound row(s) occupying the null slot.\n`);
  for (const r of rows) {
    console.log(
      `  thread=${r.channelThread} status=${r.status ?? '-'} msg=${JSON.stringify(
        (r.message || '').slice(0, 50),
      )}`,
    );
  }

  if (!rows.length) {
    console.log('\nNothing to repair.');
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write the placeholders.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const r of rows) {
    // Prefer the correlation id so the placeholder matches what the code would
    // have written; fall back to the row's own _id, which is always unique.
    const token = r.chatId || r._id.toString();
    await chats.updateOne(
      { _id: r._id },
      { $set: { externalMessageId: `pending:${token}` } },
    );
    updated++;
  }

  console.log(`\nRepaired ${updated} row(s).`);

  const left = await chats.countDocuments(filter);
  console.log(`Remaining rows in the null slot: ${left}`);

  await mongoose.disconnect();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
