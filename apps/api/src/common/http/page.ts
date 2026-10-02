import type { CursorPageMeta } from '@shikkhacore/types';

/**
 * Return a Page from a controller to get `{ success: true, data: items, meta: { nextCursor, limit } }`.
 */
export class Page<T> {
  constructor(
    readonly items: T[],
    readonly meta: CursorPageMeta,
  ) {}

  /**
   * Builds a page from a query that fetched `limit + 1` rows: the extra row only signals
   * that another page exists and is dropped.
   */
  static fromOverfetch<Row, T>(
    rows: Row[],
    limit: number,
    toItem: (row: Row) => T,
    toCursor: (row: Row) => string,
  ): Page<T> {
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows.at(-1);
    return new Page(pageRows.map(toItem), {
      nextCursor: hasMore && last ? toCursor(last) : null,
      limit,
    });
  }
}
