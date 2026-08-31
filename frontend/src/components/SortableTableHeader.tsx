import type { TableSort } from "../utils/tableSorting";

export function SortableTableHeader({
  label,
  sortKey,
  sort,
  onChange,
}: {
  label: string;
  sortKey: string;
  sort: TableSort | null;
  onChange: (key: string) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        className={`catalog-sort${active ? " is-active" : ""}`}
        type="button"
        onClick={() => onChange(sortKey)}
        title={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <span className="material-symbols-rounded" aria-hidden="true">
          {active ? (sort.direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
        </span>
      </button>
    </th>
  );
}
