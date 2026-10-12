#!/usr/bin/env node
/**
 * Pre-check for migration 20261008120000_crm_incident_profile.
 *
 * The migration adds a partial unique index allowing at most one ACTIVE
 * contact per (organizationId, lower(email)). If duplicates already exist the
 * index creation fails, so run this first:
 *
 *   npm run crm:dup-check
 *
 * Exit 0 = safe to migrate. Exit 1 = duplicates listed; resolve them (archive
 * or edit) in the CRM by hand. This script never changes data.
 *
 * Uses CRM_DATABASE_URL, like Prisma.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw`
      SELECT "organizationId", lower("email") AS email, count(*)::int AS n,
             array_agg("id" ORDER BY "createdAt") AS ids
      FROM "contact"
      WHERE "archivedAt" IS NULL AND "email" IS NOT NULL
      GROUP BY "organizationId", lower("email")
      HAVING count(*) > 1
      ORDER BY n DESC`;

    if (!rows.length) {
      console.log('OK: no duplicate active emails. Safe to run prisma migrate deploy.');
      return 0;
    }
    console.error(`FOUND ${rows.length} duplicate active email group(s):`);
    for (const r of rows) {
      console.error(`  org=${r.organizationId} email=${r.email} count=${r.n} ids=${r.ids.join(',')}`);
    }
    console.error(
      'Archive or edit all but one contact in each group (the earliest is listed first), then re-run.',
    );
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('crm-dup-check failed:', err.message);
    process.exit(2);
  });
