import { Prisma } from "@prisma/client";

/**
 * True for a Postgres unique violation surfaced by Prisma (P2002).
 *
 * Covers the raw-SQL partial index `contact_org_lower_email_active_key`
 * (one active contact per org + lower(email)) as well as @@unique keys.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
