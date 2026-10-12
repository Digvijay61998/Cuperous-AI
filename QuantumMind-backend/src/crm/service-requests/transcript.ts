import { deriveSenderRole, SenderRole } from "src/inbox/inbox.mapper";

/** At most this many messages are kept with a request (R16.4). */
export const TRANSCRIPT_MAX = 500;
const TEXT_MAX = 4000;

export interface TranscriptLine {
  at: string | null;
  from: SenderRole | "unknown";
  name?: string;
  type: string;
  text: string;
}

/** A stored chat value as readable text; buttons / cards become their labels. */
export function chatText(message: unknown): string {
  if (message == null) return "";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.map(chatText).filter(Boolean).join(" ");
  if (typeof message === "object") {
    const m: any = message;
    const parts = [m.value, m.text, m.title, m.label, m.message].filter((x) => typeof x === "string" && x.trim());
    if (parts.length) return parts.join(" ");
    if (Array.isArray(m.buttons)) return m.buttons.map((b: any) => b?.title).filter(Boolean).join(" / ");
    try {
      return JSON.stringify(m);
    } catch {
      return "";
    }
  }
  return String(message);
}

/**
 * Chat rows -> the snapshot kept on the request, oldest first, last 500.
 * Secured answers (PIN, password) stay "[secure]" (R16.4).
 */
export function toTranscript(
  rows: { message?: unknown; sender?: any; direction?: string; type?: string; time?: any; createdAt?: any; secured?: boolean; authorName?: string }[],
  ctx: { botId?: any; visitorId?: any },
): TranscriptLine[] {
  const ordered = [...rows].sort((a, b) => stamp(a) - stamp(b)).slice(-TRANSCRIPT_MAX);
  return ordered.map((r) => {
    const t = stamp(r);
    return {
      at: t ? new Date(t).toISOString() : null,
      from: deriveSenderRole(r, ctx) ?? "unknown",
      ...(r.authorName ? { name: r.authorName } : {}),
      type: r.type || "text",
      text: r.secured ? "[secure]" : chatText(r.message).slice(0, TEXT_MAX),
    };
  });
}

function stamp(r: { time?: any; createdAt?: any }): number {
  const v = r.time ?? r.createdAt;
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}
