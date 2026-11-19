import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ModalDialog } from "../components/ModalDialog";
import type { Document } from "./types";
import { labels } from "./types";
import { balance, money } from "./money";
export const Icon = ({ name }: { name: string }) => (
  <span className="material-symbols-rounded" aria-hidden="true">
    {name}
  </span>
);
export function Header({
  title,
  views,
  view,
  onView,
  actions,
}: {
  title: string;
  views: { id: string; label: string; icon: string }[];
  view: string;
  onView: (view: string) => void;
  actions: ReactNode;
}) {
  return (
    <header className="module-header">
      <div className="module-heading">
        <Link
          className="btn icon-btn module-back"
          to="/modulos/vendas"
          aria-label="Voltar para Vendas"
        >
          <Icon name="arrow_back" />
        </Link>
        <div>
          <span className="module-eyebrow">Vendas</span>
          <h1>{title}</h1>
        </div>
      </div>
      <nav className="module-views" aria-label={`Visões de ${title}`}>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? "current" : ""}
            aria-current={view === v.id ? "page" : undefined}
            onClick={() => onView(v.id)}
          >
            <Icon name={v.icon} />
            {v.label}
          </button>
        ))}
      </nav>
      <div className="module-actions">{actions}</div>
    </header>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  footer,
  busy = false,
  wide = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  const titleId = useId();
  return (
    <ModalDialog
      labelledBy={titleId}
      className={`ec-dialog ${wide ? "wide" : ""}`}
      busy={busy}
      onRequestClose={onClose}
    >
      <header>
        <div>
          <span className="module-eyebrow">Vendas</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          type="button"
          className="btn icon-btn"
          onClick={onClose}
          disabled={busy}
          aria-label="Fechar diálogo"
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="ec-dialog-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </ModalDialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <span id={id}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement<Record<string, unknown>>(child) &&
        ["input", "select", "textarea"].includes(String(child.type))
          ? cloneElement(child, {
              "aria-labelledby": child.props["aria-label"] ? undefined : id,
            })
          : child,
      )}
    </div>
  );
}
export function Pill({ value, tone }: { value: string; tone?: string }) {
  return (
    <span
      className={`pill ${tone ?? (["READY", "RESERVED", "COMPLETED", "CLOSED"].includes(value) ? "green" : value === "CANCELLED" ? "red" : ["PREPARING", "WAITING"].includes(value) ? "amber" : "blue")}`}
    >
      {labels[value] ?? value}
    </span>
  );
}
export function Totals({ document: d }: { document: Document }) {
  return (
    <div className="ec-totals">
      <div>
        Total<strong>{money(d.total_cents)}</strong>
      </div>
      <div>
        Recebido<strong>{money(d.received_net_cents)}</strong>
      </div>
      <div>
        Saldo
        <strong>
          {d.status === "CANCELLED"
            ? "—"
            : money(balance(d.total_cents, d.received_net_cents))}
        </strong>
      </div>
    </div>
  );
}
export function Pager({
  total,
  offset,
  pageSize,
  onPage,
  label = "Paginação",
}: {
  label?: string;
  total: number;
  offset: number;
  pageSize: number;
  onPage: (offset: number) => void;
}) {
  return (
    <nav className="ec-pager" aria-label={label}>
      <span>
        {total ? offset + 1 : 0}–{Math.min(offset + pageSize, total)} de {total}
      </span>
      <button
        type="button"
        className="btn"
        disabled={offset === 0}
        onClick={() => onPage(Math.max(0, offset - pageSize))}
      >
        Anterior
      </button>
      <button
        type="button"
        className="btn"
        disabled={offset + pageSize >= total}
        onClick={() => onPage(offset + pageSize)}
      >
        Próxima
      </button>
    </nav>
  );
}
