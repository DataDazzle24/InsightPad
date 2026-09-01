import { useEffect, useId, useMemo, useRef, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
};

export function SearchableProductSelect({
  options,
  value,
  disabledIds = [],
  onChange,
}: {
  options: ProductOption[];
  value: string;
  disabledIds?: string[];
  onChange: (productId: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    listId = useId(),
    selected = options.find((option) => option.id === value),
    [term, setTerm] = useState(selected?.name ?? ""),
    [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setTerm(selected?.name ?? "");
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open, selected?.name]);

  const visible = useMemo(() => {
    const normalized = term.trim().toLocaleLowerCase("pt-BR");
    return options
      .filter(
        (option) =>
          (option.id === value || !disabledIds.includes(option.id)) &&
          (!normalized ||
            option.name.toLocaleLowerCase("pt-BR").includes(normalized)),
      )
      .slice(0, 80);
  }, [disabledIds, options, term, value]);

  return (
    <div className={`product-search-select${open ? " is-open" : ""}`} ref={root}>
      <div className="product-search-select__input">
        <span className="material-symbols-rounded" aria-hidden="true">search</span>
        <input
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label="Pesquisar produto simples"
          autoComplete="off"
          placeholder="Digite o nome do produto..."
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setTerm(selected?.name ?? "");
            }
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Limpar produto selecionado"
            onClick={() => {
              onChange("");
              setTerm("");
              setOpen(true);
            }}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="product-search-select__options" id={listId} role="listbox">
          {visible.length === 0 ? (
            <small>Nenhum produto simples encontrado.</small>
          ) : (
            visible.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={option.id === value ? "selected" : ""}
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setTerm(option.name);
                  setOpen(false);
                }}
              >
                <span>{option.name}</span>
                {option.id === value && (
                  <span className="material-symbols-rounded" aria-hidden="true">check</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
