import { describe, expect, it } from "vitest";
import { nextTableSort, sortTableRows } from "./tableSorting";

const rows = [
  { id: "b", name: "Produto 10", updatedAt: "2026-08-30T10:00:00Z", count: 10 },
  { id: "a", name: "Produto 2", updatedAt: "2026-08-31T10:00:00Z", count: 2 },
];

describe("tableSorting", () => {
  it("alterna crescente, decrescente e ordem padrão", () => {
    const ascending = nextTableSort(null, "name");
    const descending = nextTableSort(ascending, "name");
    expect(ascending).toEqual({ key: "name", direction: "asc" });
    expect(descending).toEqual({ key: "name", direction: "desc" });
    expect(nextTableSort(descending, "name")).toBeNull();
  });

  it("usa a atualização mais recente como ordem padrão", () => {
    expect(sortTableRows(rows, null).map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("ordena textos naturalmente e números numericamente", () => {
    expect(sortTableRows(rows, { key: "name", direction: "asc" }).map((row) => row.id)).toEqual(["a", "b"]);
    expect(sortTableRows(rows, { key: "count", direction: "desc" }).map((row) => row.id)).toEqual(["b", "a"]);
  });
});
