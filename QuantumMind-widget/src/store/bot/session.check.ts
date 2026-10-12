// Assertion checks for session.ts (crm-incident-handover task 5.7).
// The widget has no test runner (Vite 3); run with:
//   npx tsc src/store/bot/session.ts src/store/bot/session.check.ts --outDir /tmp/jc-session --module commonjs --target es2019
//   node /tmp/jc-session/session.check.js
import {
  endedEventApplies,
  markSessionEnded,
  readSession,
  resumeRequest,
  sessionKey,
  SESSION_MAX_AGE_MS,
  showEndedWithoutConnecting,
  writeSession,
  KV,
} from "./session";

const assert = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
};
const eq = (a: unknown, b: unknown, msg: string) =>
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg}\n  got      ${JSON.stringify(a)}\n  expected ${JSON.stringify(b)}`);

const mem = (): KV & { data: Record<string, string> } => {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
};

const BOT = "6ac5d632ee43c8da8d311cb5";
const V = "64c0000000000000000000a1";
const C = "64c0000000000000000000c1";
const now = 1_700_000_000_000;

// round trip, per bot
{
  const s = mem();
  writeSession(s, BOT, { visitorId: V, conversationId: C }, now);
  eq(readSession(s, BOT, now), { visitorId: V, conversationId: C, ended: false, savedAt: now }, "round trip");
  eq(readSession(s, "other-bot", now), null, "sessions are per bot");
  assert(sessionKey(BOT) === `jarcube.session.${BOT}`, "key format");
}

// resume request shapes
{
  eq(resumeRequest(null), {}, "no session -> nothing");
  eq(resumeRequest({ visitorId: V, conversationId: C, savedAt: now }), { resume: { visitorId: V, conversationId: C } }, "resume both");
  eq(
    resumeRequest({ visitorId: V, conversationId: C, savedAt: now }, { startNew: true }),
    { resume: { visitorId: V }, newConversation: true },
    "start new chat keeps the visitor",
  );
  eq(
    resumeRequest({ visitorId: V, conversationId: C, ended: true, savedAt: now }),
    { resume: { visitorId: V }, newConversation: true },
    "ended conversation is never resumed",
  );
}

// ended marker keeps the visitor
{
  const s = mem();
  writeSession(s, BOT, { visitorId: V, conversationId: C }, now);
  markSessionEnded(s, BOT, now);
  eq(readSession(s, BOT, now)?.ended, true, "marked ended");
  eq(readSession(s, BOT, now)?.visitorId, V, "visitor kept");
}

// Ended_State on reload (R14.7) and Start new chat (R14.9)
{
  const ended = { visitorId: V, conversationId: C, ended: true, savedAt: now };
  const open = { visitorId: V, conversationId: C, savedAt: now };
  assert(showEndedWithoutConnecting(ended), "ended session shows the Ended_State without connecting");
  assert(!showEndedWithoutConnecting(ended, { startNew: true }), "Start new chat always asks the server");
  assert(!showEndedWithoutConnecting(open), "open session resumes");
  assert(!showEndedWithoutConnecting(null), "no session: first visit");
}

// a conversation-ended event only ends the conversation it names
{
  const s = { visitorId: V, conversationId: C, savedAt: now };
  assert(endedEventApplies(s, C), "same conversation");
  assert(!endedEventApplies(s, "64c0000000000000000000c2"), "late event for an older conversation is ignored");
  assert(endedEventApplies(s, undefined), "event without an id applies");
  assert(endedEventApplies(null, C), "no stored session: applies");
  assert(endedEventApplies({ visitorId: V, savedAt: now }, C), "stored session without a conversation: applies");
}

// junk and staleness are ignored, never thrown
{
  const s = mem();
  s.data[sessionKey(BOT)] = "{not json";
  eq(readSession(s, BOT, now), null, "malformed json");
  s.data[sessionKey(BOT)] = JSON.stringify({ visitorId: "../../etc", conversationId: C, savedAt: now });
  eq(readSession(s, BOT, now), null, "bad visitor id");
  s.data[sessionKey(BOT)] = JSON.stringify({ visitorId: V, conversationId: { $ne: 1 }, savedAt: now });
  eq(readSession(s, BOT, now)?.conversationId, undefined, "bad conversation id dropped");
  s.data[sessionKey(BOT)] = JSON.stringify({ visitorId: V, savedAt: now - SESSION_MAX_AGE_MS - 1 });
  eq(readSession(s, BOT, now), null, "stale session");
  const broken: KV = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceeded");
    },
    removeItem: () => undefined,
  };
  eq(readSession(broken, BOT, now), null, "storage disabled on read");
  writeSession(broken, BOT, { visitorId: V }, now); // must not throw
  writeSession(mem(), BOT, { visitorId: "nope" }, now); // invalid id: ignored
}

console.log("session.ts: all checks passed");
