/**
 * In-memory Mongo and CRM Prisma fakes for the Phase 7 specs. The name ends in
 * `testspec.ts`: excluded from the build (`**\/*spec.ts`) and not itself a
 * test (`.spec.ts`).
 */
import { Types } from "mongoose";

type Doc = Record<string, any>;

const get = (d: Doc, path: string) => path.split(".").reduce((v: any, k) => (v == null ? undefined : v[k]), d);
const eq = (a: any, b: any) => String(a) === String(b);

export function matches(d: Doc, q: Doc): boolean {
  return Object.entries(q || {}).every(([k, v]) => {
    if (k === "$or") return (v as Doc[]).some((s) => matches(d, s));
    if (k === "$and") return (v as Doc[]).every((s) => matches(d, s));
    if (k.endsWith(".0") && v && typeof v === "object" && "$exists" in v) {
      const arr = get(d, k.slice(0, -2));
      return (Array.isArray(arr) && arr.length > 0) === v.$exists;
    }
    const val = get(d, k);
    if (v && typeof v === "object" && !(v instanceof Date) && !Types.ObjectId.isValid(v as any) && !Array.isArray(v)) {
      return Object.entries(v).every(([op, arg]: [string, any]) => {
        switch (op) {
          case "$in":
            return arg.some((x: any) => eq(x, val));
          case "$nin":
            return !arg.some((x: any) => eq(x, val));
          case "$exists":
            return (val !== undefined && val !== null) === arg;
          case "$ne":
            return !eq(val, arg);
          case "$lt":
            return val != null && +new Date(val) < +new Date(arg);
          case "$lte":
            return val != null && +new Date(val) <= +new Date(arg);
          default:
            return false;
        }
      });
    }
    if (v === null) return val == null;
    return eq(val, v);
  });
}

function query<T>(produce: () => T, opts: { first?: boolean } = {}) {
  let sortSpec: Record<string, number> | null = null;
  let limitN: number | null = null;
  let skipN = 0;
  const run = (): any => {
    let v: any = runList();
    if (opts.first) return Array.isArray(v) ? v[0] ?? null : v;
    return v;
  };
  const runList = (): any => {
    let v: any = produce();
    if (Array.isArray(v)) {
      if (sortSpec) {
        const spec = Object.entries(sortSpec);
        v = [...v].sort((a, b) => {
          for (const [k, dir] of spec) {
            const x = +new Date(get(a, k) ?? 0) || 0;
            const y = +new Date(get(b, k) ?? 0) || 0;
            if (x !== y) return (x - y) * dir;
          }
          return 0;
        });
      }
      if (skipN) v = v.slice(skipN);
      if (limitN != null) v = v.slice(0, limitN);
    }
    return v;
  };
  const q: any = {
    select: () => q,
    sort: (s: Record<string, number>) => ((sortSpec = s), q),
    limit: (n: number) => ((limitN = n), q),
    skip: (n: number) => ((skipN = Number(n) || 0), q),
    populate: () => q,
    lean: async () => run(),
    catch: (fn: any) => Promise.resolve().then(run).catch(fn),
    then: (res: any, rej: any) => Promise.resolve().then(run).then(res, rej),
  };
  return q;
}

export function fakeModel(initial: Doc[] = []) {
  const docs: Doc[] = initial.map((d) => ({ ...d }));
  const apply = (d: Doc, u: Doc) => {
    if (u.$set || u.$unset || u.$inc) {
      Object.assign(d, u.$set || {});
      for (const k of Object.keys(u.$unset || {})) delete d[k];
      for (const [k, n] of Object.entries(u.$inc || {})) d[k] = (Number(d[k]) || 0) + (n as number);
    } else Object.assign(d, u);
  };
  const copy = (d?: Doc) => (d ? JSON.parse(JSON.stringify(d)) : null);
  return {
    docs,
    findById: (id: any) => query(() => copy(docs.find((d) => eq(d._id, id)))),
    findOne: (q: Doc) => query(() => docs.filter((d) => matches(d, q)).map(copy), { first: true }),
    find: (q: Doc) => query(() => docs.filter((d) => matches(d, q)).map(copy)),
    exists: async (q: Doc) => (docs.some((d) => matches(d, q)) ? { _id: "x" } : null),
    countDocuments: async (q: Doc) => docs.filter((d) => matches(d, q)).length,
    deleteMany: async (q: Doc) => {
      const before = docs.length;
      for (let i = docs.length - 1; i >= 0; i--) if (matches(docs[i], q)) docs.splice(i, 1);
      return { deletedCount: before - docs.length };
    },
    updateOne: async (q: Doc, u: Doc) => {
      const d = docs.find((x) => matches(x, q));
      if (d) apply(d, u);
      return { modifiedCount: d ? 1 : 0 };
    },
    findOneAndUpdate: (q: Doc, u: Doc, o: { new?: boolean } = {}) =>
      query(() => {
        const d = docs.find((x) => matches(x, q));
        if (!d) return null;
        const before = copy(d);
        apply(d, u);
        return o?.new === false ? before : copy(d);
      }),
    updateMany: async (q: Doc, u: Doc) => {
      const hit = docs.filter((x) => matches(x, q));
      for (const d of hit) apply(d, u);
      return { modifiedCount: hit.length };
    },
    create: async (d: Doc) => {
      const doc = { _id: new Types.ObjectId().toString(), createdAt: new Date(), ...d };
      docs.push(doc);
      return { ...copy(doc), toObject: () => copy(doc) };
    },
    distinct: async (field: string, q: Doc) => [
      ...new Set(docs.filter((d) => matches(d, q)).map((d) => String(get(d, field)))),
    ],
  };
}

export function fakeMongo(models: Record<string, any>) {
  return { models } as any;
}

/**
 * CRM Prisma fake: contacts + activities, `$transaction` serialised (as the
 * real row lock would), `$queryRaw` answering the profile FOR UPDATE select.
 */
export function fakeCrm(contacts: Doc[] = []) {
  const rows: Doc[] = contacts.map((c) => ({ profileVersion: 0, archivedAt: null, ...c }));
  const activities: Doc[] = [];
  let chain: Promise<unknown> = Promise.resolve();
  const contact = {
    findFirst: async ({ where }: any) => {
      const c = rows.find((r) => r.id === where.id && r.organizationId === where.organizationId && (where.archivedAt !== null || !r.archivedAt));
      return c ? JSON.parse(JSON.stringify(c)) : null;
    },
    update: async ({ where, data }: any) => {
      const c = rows.find((r) => r.id === where.id)!;
      for (const [k, v] of Object.entries<any>(data)) {
        if (v && typeof v === "object" && "increment" in v) c[k] = (c[k] || 0) + v.increment;
        else c[k] = JSON.parse(JSON.stringify(v));
      }
      return c;
    },
  };
  const tx = {
    contact,
    activity: { create: async ({ data }: any) => activities.push(data) },
    $queryRaw: async (_s: TemplateStringsArray, id: string, org: string) => {
      const c = rows.find((r) => r.id === id && r.organizationId === org && !r.archivedAt);
      return c ? [{ profile: JSON.parse(JSON.stringify(c.profile ?? null)), profileVersion: c.profileVersion }] : [];
    },
  };
  const db = {
    contact,
    $transaction: (fn: (t: any) => Promise<any>) => {
      const run = chain.then(() => fn(tx));
      chain = run.catch(() => undefined);
      return run;
    },
  };
  return { rows, activities, forOrg: () => db };
}

export const oid = () => new Types.ObjectId().toString();
