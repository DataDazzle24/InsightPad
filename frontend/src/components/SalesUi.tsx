import { useEffect, useMemo, useRef, useState } from "react";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";

export type Notice = { text: string; type: "success" | "error" | "info" };
export function AppToast({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, 7000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  const icon =
    notice.type === "success"
      ? "check_circle"
      : notice.type === "error"
        ? "error"
        : "info";
  return (
    <div
      aria-live="assertive"
      className={`master-toast master-toast--${notice.type}`}
      role="alert"
    >
      <span className="material-symbols-rounded">{icon}</span>
      <strong>{notice.text}</strong>
      <button aria-label="Fechar aviso" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
export function AppLoading({
  text = "Atualizando informações...",
}: {
  text?: string;
}) {
  return (
    <div className="catalog-loader">
      <div className="catalog-loader__mark">
        <span />
        <img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" />
      </div>
      <strong>{text}</strong>
    </div>
  );
}

export type SelectOption = { value: string; label: string };
export function SearchableMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [term, setTerm] = useState(""),
    [open, setOpen] = useState(false),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const visible = options.filter((option) =>
    option.label
      .toLocaleLowerCase("pt-BR")
      .includes(term.toLocaleLowerCase("pt-BR")),
  );
  return (
    <div className="filter-field" ref={root}>
      <span>{label}</span>
      <div className={`filter-multiselect${open ? " is-open" : ""}`}>
        <button
          type="button"
          className="filter-select-trigger"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          {value.length === 0
            ? "Todos os valores"
            : value.length === 1
              ? (options.find((option) => option.value === value[0])?.label ??
                "1 selecionado")
              : `${value.length} selecionados`}
        </button>
        {open && (
          <div className="filter-dropdown">
            <label className="filter-dropdown__search">
              <span className="material-symbols-rounded">search</span>
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Digite para filtrar..."
                autoFocus
              />
            </label>
            <div className="filter-dropdown__options">
              {visible.length === 0 ? (
                <small>Nenhum valor encontrado.</small>
              ) : (
                visible.map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={(event) =>
                        onChange(
                          event.target.checked
                            ? [...value, option.value]
                            : value.filter((item) => item !== option.value),
                        )
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function DateRangePicker({
  from,
  to,
  onChange,
  label = "Período da venda",
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false),
    [cursor, setCursor] = useState(() => new Date()),
    [draftFrom, setDraftFrom] = useState(from),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1),
      start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);
  function choose(value: string) {
    if (!draftFrom || to) {
      setDraftFrom(value);
      onChange(value, "");
      return;
    }
    if (value < draftFrom) {
      onChange(value, draftFrom);
      setDraftFrom(value);
    } else onChange(draftFrom, value);
  }
  return (
    <div className="filter-field date-range-field" ref={root}>
      <span>{label}</span>
      <button
        type="button"
        className="date-range-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="material-symbols-rounded">date_range</span>
        {from
          ? to
            ? `${new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} — ${new Date(`${to}T12:00:00`).toLocaleDateString("pt-BR")}`
            : `Início: ${new Date(`${from}T12:00:00`).toLocaleDateString("pt-BR")} · selecione o fim`
          : "Selecione o período"}
      </button>
      {open && (
        <div className="range-calendar">
          <header>
            <button
              type="button"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
                )
              }
            >
              ‹
            </button>
            <strong>
              {cursor.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
                )
              }
            >
              ›
            </button>
          </header>
          <div className="range-calendar__week">
            {"DSTQQSS".split("").map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>
          <div className="range-calendar__days">
            {days.map((day) => {
              const value = iso(day),
                outside = day.getMonth() !== cursor.getMonth(),
                selected = value === from || value === to,
                inRange = Boolean(from && to && value > from && value < to);
              return (
                <button
                  type="button"
                  key={value}
                  className={`${outside ? "outside " : ""}${selected ? "selected " : ""}${inRange ? "in-range" : ""}`}
                  onClick={() => choose(value)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <footer>
            <button
              type="button"
              onClick={() => {
                setDraftFrom("");
                onChange("", "");
              }}
            >
              Limpar
            </button>
            <button
              type="button"
              className="catalog-primary"
              onClick={() => setOpen(false)}
            >
              Concluir
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

type Detector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};
export function BarcodeScanner({
  onRead,
  onClose,
}: {
  onRead: (value: string) => void;
  onClose: () => void;
}) {
  useDialogAccessibility(true, onClose);
  const video = useRef<HTMLVideoElement>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let stream: MediaStream | undefined,
      timer = 0,
      stopped = false,
      controls: { stop: () => void } | undefined;
    async function start() {
      try {
        const DetectorCtor = (
          window as unknown as {
            BarcodeDetector?: new (options: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        if (DetectorCtor) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
          if (!video.current) return;
          video.current.srcObject = stream;
          await video.current.play();
          const detector = new DetectorCtor({
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
            ],
          });
          const scan = async () => {
            if (stopped || !video.current) return;
            try {
              const results = await detector.detect(video.current);
              if (results[0]?.rawValue) {
                navigator.vibrate?.(120);
                onRead(results[0].rawValue);
                return;
              }
            } catch {
              setError(
                "Não foi possível interpretar a imagem. Aponte para um código bem iluminado.",
              );
            }
            timer = window.setTimeout(scan, 250);
          };
          void scan();
          return;
        }
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (!video.current) return;
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video.current,
          (result) => {
            if (result && !stopped) {
              navigator.vibrate?.(120);
              onRead(result.getText());
            }
          },
        );
      } catch {
        setError(
          "Não foi possível acessar a câmera. Confirme a permissão e use uma conexão HTTPS.",
        );
      }
    }
    void start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onRead]);
  return (
    <div className="catalog-backdrop">
      <section
        className="catalog-modal barcode-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Leitor de código de barras"
      >
        <header>
          <div>
            <span className="eyebrow">Câmera</span>
            <h2>Escanear código</h2>
          </div>
          <button aria-label="Fechar leitor de código de barras" onClick={onClose}>×</button>
        </header>
        <div className="scanner-view">
          <video ref={video} playsInline muted />
          <div className="scanner-frame" />
        </div>
        {error ? (
          <p className="scanner-error">{error}</p>
        ) : (
          <p>
            Centralize o código de barras dentro da área destacada. Compatível
            com Chrome, Edge, Firefox e Safari modernos.
          </p>
        )}
        <footer>
          <button className="catalog-modal-cancel" onClick={onClose}>Cancelar</button>
        </footer>
      </section>
    </div>
  );
}
