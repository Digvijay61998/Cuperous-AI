/**
 * Shared list/pagination/faceting helpers for CRM resources.
 *
 * Adapted from the reference CRM's trpc/list-input.ts, kept framework-agnostic
 * so contacts, companies and deals all filter, sort, paginate and facet the same
 * way. Every caller passes organizationId separately — these helpers never see
 * the tenant, they only shape the query.
 */

export type SortDirection = "asc" | "desc";

export interface ListResult<TRow> {
  rows: TRow[];
  total: number;
  facetCounts: Record<string, Record<string, number>>;
}

export interface PageInput {
  page?: number;
  pageSize?: number;
}

export function paginate(input: PageInput): { skip: number; take: number } {
  const page = Math.max(1, Number(input.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize) || 25));
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export interface OrderByColumns<TOrderBy> {
  [column: string]: (dir: SortDirection) => TOrderBy;
}

/**
 * Resolve a client-supplied sort key against an allow-list of sortable columns.
 * Unknown keys fall back, so a caller can never sort by an unindexed column.
 */
export function resolveOrderBy<TOrderBy>(
  sort: string | undefined,
  dir: SortDirection | undefined,
  columns: OrderByColumns<TOrderBy>,
  fallback: TOrderBy,
): TOrderBy {
  const column = sort ? columns[sort] : undefined;
  return column ? column(dir === "desc" ? "desc" : "asc") : fallback;
}

/** Normalise a query param that may arrive as undefined, a string, or an array. */
export function toArray(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [String(value)].filter(Boolean);
}

/** Coerce a query param to boolean (`"true"`/`"1"` are true). */
export function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

export const FACET_UNASSIGNED = "unassigned";

/**
 * A sentinel-aware split for filters that offer an "unassigned" option, e.g.
 * "contacts with no owner". Returns the real ids and whether the sentinel was
 * present.
 */
export function splitSentinel(values: string[], sentinel: string) {
  const ids = values.filter((value) => value !== sentinel);
  return { ids, includesSentinel: ids.length !== values.length };
}

/**
 * Fold Prisma groupBy rows into `{ value: count }`, mapping nulls to a sentinel
 * key (e.g. FACET_UNASSIGNED) so the UI can show "no owner (12)".
 */
export function countsByKey<
  TKey extends string,
  TGroup extends { _count: { _all: number } } & {
    [K in TKey]?: string | null;
  },
>(groups: TGroup[], key: TKey, nullKey?: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const group of groups) {
    const value = group[key] ?? nullKey;
    if (value == null) continue;
    counts[value] = (counts[value] ?? 0) + group._count._all;
  }
  return counts;
}

/** archived=false → only active rows; archived=true → only archived rows. */
export function archivedFilter(archived: boolean): { archivedAt: null | { not: null } } {
  return { archivedAt: archived ? { not: null } : null };
}
