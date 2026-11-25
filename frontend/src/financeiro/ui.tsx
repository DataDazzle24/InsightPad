/**
 * Referência de transposição visual do protótipo FIN-UX-20261125-v2.
 * Componentes controlados, sem dados sintéticos e sem chamadas de serviço.
 * Adapte imports, router, permissões e componentes ao repositório DEV.
 * Este arquivo não é um patch verificado contra o InsightPad em DEV.
 */
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './styles.css';

export type FinanceTheme = 'dark' | 'light';
export type Tone = 'blue' | 'green' | 'amber' | 'red';
export type FinanceIconName = 'back' | 'download' | 'eraser' | 'filter' | 'plus' | 'close' | 'wallet' | 'receipt';
const paths: Record<FinanceIconName, string> = {
  back: 'M19 12H5m6 6-6-6 6-6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5',
  eraser: 'm4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 10H8l-4-4a3 3 0 0 1 0-4Z M9 8l9 9 M12 22h10',
  filter: 'M3 5h18l-7 8v5l-4 2v-7z',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  wallet: 'M4 5h15v15H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M22 10h-7v5h7z M17 12.5h.01',
  receipt: 'M5 3l3 2 4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2z M9 9h6m-6 4h6m-6 4h3',
};
export function FinanceIcon({ name, size = 18 }: { name: FinanceIconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
export function FinanceScope({ theme, children }: { theme: FinanceTheme; children: ReactNode }) {
  return <div data-finance-ui data-theme={theme}>{children}</div>;
}
export function FinanceIconButton({ label, icon, onClick, disabled = false, className = '' }: {
  label: string; icon: FinanceIconName; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return <button type="button" className={`btn icon-btn ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}><FinanceIcon name={icon} /></button>;
}
export interface FinanceTab { id: string; label: string }
export function FinanceHeader({ title, tabs, activeTab, onTab, onBack, actions }: {
  title: string; tabs: readonly FinanceTab[]; activeTab: string;
  onTab: (id: string) => void; onBack: () => void; actions: ReactNode;
}) {
  return <header className="module-header">
    <div className="module-heading">
      <FinanceIconButton label="Voltar para Financeiro" icon="back" onClick={onBack} className="module-back" />
      <div><span className="module-eyebrow">Financeiro</span><h1>{title}</h1></div>
    </div>
    {tabs.length > 1 && <nav className="module-views" aria-label={`Visões de ${title}`}>
      {tabs.map(tab => <button key={tab.id} type="button" className={activeTab === tab.id ? 'current' : undefined} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => onTab(tab.id)}>{tab.label}</button>)}
    </nav>}
    <div className="module-actions">{actions}</div>
  </header>;
}
export function FinanceActions({ onClear, onFilters, onExport, onPrint, canExport, children }: {
  onClear: () => void; onFilters: () => void; onExport: () => void;
  onPrint: () => void; canExport: boolean; children?: ReactNode;
}) {
  return <>
    <FinanceIconButton label="Limpar filtros" icon="eraser" onClick={onClear} />
    <FinanceIconButton label="Filtros" icon="filter" onClick={onFilters} />
    {canExport && <FinanceIconButton label="Exportar CSV" icon="download" onClick={onExport} />}
    {canExport && <FinanceIconButton label="Imprimir ou salvar PDF" icon="receipt" onClick={onPrint} />}
    {children}
  </>;
}
export interface FinanceMetric { id: string; label: string; formattedValue: string; tone?: Tone; onClick?: () => void }
export function FinanceMetrics({ items }: { items: readonly FinanceMetric[] }) {
  return <div className="finance-metrics">{items.map(item => {
    const className = `finance-metric ${item.tone ?? 'blue'}`;
    const content = <><span>{item.label}</span><strong>{item.formattedValue}</strong></>;
    return item.onClick ? <button key={item.id} type="button" className={className} onClick={item.onClick}>{content}</button> : <div key={item.id} className={className}>{content}</div>;
  })}</div>;
}
export function FinancePanel({ title, subtitle, actions, children }: {
  title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  return <section className="surface finance-panel"><div className="table-toolbar"><div className="surface-title"><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div><div className="table-actions">{actions}</div></div>{children}</section>;
}
export interface FinanceColumn<T> { id: string; title: string; numeric?: boolean; cell: (row: T) => ReactNode }
export function FinanceTable<T>({ label, columns, rows, rowKey, empty }: {
  label: string; columns: readonly FinanceColumn<T>[]; rows: readonly T[];
  rowKey: (row: T) => string; empty: ReactNode;
}) {
  if (!rows.length) return <div className="empty">{empty}</div>;
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={`${label} com rolagem`}>
    <table><thead><tr>{columns.map(c => <th key={c.id} scope="col" className={c.numeric ? 'numeric' : undefined}>{c.title}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(c => <td key={c.id} className={c.numeric ? 'numeric' : undefined}>{c.cell(row)}</td>)}</tr>)}</tbody></table>
  </div>;
}
/** Renderizar dentro de FinanceScope ou de um portal com FinanceScope próprio. */
export function FinanceDialog({ open, title, wide = false, busy = false, error, onClose, footer, children }: {
  open: boolean; title: string; wide?: boolean; busy?: boolean; error?: string;
  onClose: () => void; footer: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const first = dialog.querySelector<HTMLElement>('.dialog-body input:not([type="hidden"]), .dialog-body select, .dialog-body textarea, .dialog-head button');
    first?.focus();
    return () => { if (dialog.open) dialog.close(); trigger?.focus(); };
  }, [open]);
  return <dialog ref={ref} className={wide ? 'wide' : undefined} aria-labelledby={titleId} aria-busy={busy || undefined} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="dialog-shell">
      <header className="dialog-head"><div className="dialog-title-wrap"><span className="dialog-icon"><FinanceIcon name="wallet" size={21} /></span><div><span className="eyebrow">FINANCEIRO</span><h2 id={titleId}>{title}</h2></div></div><FinanceIconButton label="Fechar" icon="close" onClick={onClose} disabled={busy} /></header>
      <div className="dialog-body">{error && <div className="dialog-error" role="alert" tabIndex={-1}>{error}</div>}{children}</div>
      <footer className="dialog-foot">{footer}</footer>
    </div>
  </dialog>;
}
