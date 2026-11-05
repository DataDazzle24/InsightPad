import type { ReactNode } from 'react';

export function AnalysisDetails({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <section className="catalog-modal dashboard-v3-modal" role="dialog" aria-modal="true" aria-label="Detalhes da análise">
    <header><h2>Detalhes da análise</h2><button type="button" aria-label="Fechar detalhes" onClick={onClose}>×</button></header>
    <div className="dashboard-v3-modal-body">{children}</div>
    <footer><button type="button" className="catalog-primary" onClick={onClose}>Entendi</button></footer>
  </section>;
}
