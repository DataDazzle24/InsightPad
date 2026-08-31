import { useEffect } from "react";

export function useDismissibleDetails(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      document
        .querySelectorAll<HTMLDetailsElement>("details.filter-multiselect[open]")
        .forEach((details) => {
          if (!details.contains(target)) details.open = false;
        });
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [active]);
}
