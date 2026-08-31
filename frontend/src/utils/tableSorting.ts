export type SortDirection = "asc" | "desc";

export type TableSort = {
  key: string;
  direction: SortDirection;
};

export function nextTableSort(current: TableSort | null, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

function normalized(value: unknown, key: string): string | number | boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" || typeof value === "boolean") return value;

  const text = String(value);
  if (/At$|Date$/i.test(key)) {
    const timestamp = Date.parse(text);
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  if (/Cents$|Count$|Stock$|Days$|quantity$/i.test(key)) {
    const number = Number(text.replace(",", "."));
    if (!Number.isNaN(number)) return number;
  }
  return text;
}

function compareValues(left: unknown, right: unknown, key: string): number {
  const a = normalized(left, key);
  const b = normalized(right, key);
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortTableRows<T extends { id: string; updatedAt?: unknown }>(
  rows: T[],
  sort: TableSort | null,
  resolve?: (row: T, key: string) => unknown,
): T[] {
  return [...rows].sort((left, right) => {
    if (sort) {
      const result = compareValues(
        resolve ? resolve(left, sort.key) : left[sort.key as keyof T],
        resolve ? resolve(right, sort.key) : right[sort.key as keyof T],
        sort.key,
      );
      if (result !== 0) return sort.direction === "asc" ? result : -result;
    }

    const updated = compareValues(right.updatedAt, left.updatedAt, "updatedAt");
    return updated || left.id.localeCompare(right.id);
  });
}
