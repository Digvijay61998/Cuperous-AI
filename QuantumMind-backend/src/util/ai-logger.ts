/**
 * Centralized helper for the AI request/response pipeline logging.
 *
 * Wraps NestJS's Logger to produce colored, correlated, secret-masked "banner"
 * style logs so a single AI request can be traced end-to-end (it shares a
 * request id with the Python AI service via the `x-request-id` header).
 *
 * Verbose logs (payloads, prompts) are gated behind debug mode:
 *   NODE_ENV=development  OR  LOG_LEVEL=debug  OR  AI_DEBUG_LOGS=true
 */
import { Logger } from "@nestjs/common";

const Color = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  grey: "\x1b[90m",
  bold: "\x1b[1m",
};

const BAR = "=".repeat(60);

const SENSITIVE_KEYS = [
  "authorization",
  "api_key",
  "apikey",
  "x-api-key",
  "openai_api_key",
  "password",
  "secret",
  "token",
  "cookie",
];

export function isDebugLogs(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    (process.env.LOG_LEVEL || "").toLowerCase() === "debug" ||
    (process.env.AI_DEBUG_LOGS || "").toLowerCase() === "true"
  );
}

/** Correlation id in the shared `ai-YYYYMMDD-xxxxxx` format. */
export function newRequestId(): string {
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(16).slice(2, 8);
  return `ai-${date}-${rand}`;
}

export function maskSecret(value: any): string {
  if (value === undefined || value === null) return String(value);
  const s = String(value);
  if (s.length <= 8) return "****";
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

/** Recursively mask sensitive keys so payloads/headers are safe to log. */
export function maskDeep(data: any): any {
  if (Array.isArray(data)) return data.map((d) => maskDeep(d));
  if (data && typeof data === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = SENSITIVE_KEYS.includes(k.toLowerCase())
        ? maskSecret(v)
        : maskDeep(v);
    }
    return out;
  }
  return data;
}

type Level = "info" | "success" | "warn" | "error";

function color(level: Level): string {
  switch (level) {
    case "success":
      return Color.green;
    case "warn":
      return Color.yellow;
    case "error":
      return Color.red;
    default:
      return Color.blue;
  }
}

/**
 * Log a boxed banner section. `fields` values are printed as-is (mask before
 * passing anything sensitive).
 */
export function banner(
  logger: Logger,
  title: string,
  fields: Record<string, any> = {},
  level: Level = "info"
): void {
  const lines = [BAR, title, BAR];
  for (const [k, v] of Object.entries(fields)) {
    const val =
      typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
    lines.push(`  ${k}: ${val}`);
  }
  lines.push(BAR);

  const msg = `${color(level)}${lines.join("\n")}${Color.reset}`;
  if (level === "error") logger.error(msg);
  else if (level === "warn") logger.warn(msg);
  else logger.log(msg);
}

/** Truncate long strings for readable logs. */
export function preview(value: any, max = 500): string {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (!s) return "(empty)";
  return s.length > max ? `${s.slice(0, max)}...(+${s.length - max} chars)` : s;
}
