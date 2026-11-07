import type { ReactNode } from 'react';

export function AnalysisDetails({ children, onClose, theme }: { children: ReactNode; onClose: () => void; theme: 'dark'|'light' }) {
  return <section className="catalog-modal dashboard-v3-modal" data-theme={theme} role="dialog" aria-modal="true" aria-label="Detalhes da análise">
    <header><h2>Detalhes da análise</h2><button type="button" aria-label="Fechar detalhes" onClick={onClose}>×</button></header>
    <div className="dashboard-v3-modal-body">{children}</div>
    <footer><button type="button" className="catalog-primary" onClick={onClose}>Entendi</button></footer>
  </section>;
}
