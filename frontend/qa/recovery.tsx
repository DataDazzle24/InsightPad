import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../src/auth/auth-context';
import { ModalDialog } from '../src/components/ModalDialog';
import { LoginPage } from '../src/pages/LoginPage';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useTheme } from '../src/theme/theme-context';
import '../src/index.css';
import '../src/dev-adjustments.css';
import '../src/App.css';
import '../src/home-header-refinements.css';
import '../src/sidebar-refinements.css';
import '../src/catalog-standardization.css';
import './review.css';

export function Review() {
  const { theme, toggleTheme } = useTheme();
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success');
  const [delay, setDelay] = useState(15);
  const [requests, setRequests] = useState(0);
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  const outerFocus = useRef<HTMLButtonElement>(null);
  const innerFocus = useRef<HTMLButtonElement>(null);

  const auth: AuthContextValue = {
    firebaseUser: null, profile: null, permissions: {},
    status: 'unauthenticated', error: null, canAccess: () => false,
    signIn: async () => { throw new Error('Login real desativado neste harness.'); },
    signOut: async () => {},
    resetPassword: () => {
      setRequests(value => value + 1);
      return new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (outcome === 'success') resolve();
          else reject(new Error('Falha sintética de QA.'));
        }, delay * 1000);
      });
    },
  };

  return <>
    <AuthContext.Provider value={auth}><LoginPage /></AuthContext.Provider>
    <details className="qa-controls" open>
      <summary>QA local - Auth mockado, nenhum envio real</summary>
      <p>SHA: <code>{import.meta.env.VITE_QA_SOURCE_SHA}</code></p>
      <p>O LoginPage e o ModalDialog são os arquivos reais deste candidato. Firebase/AuthProvider não são carregados.</p>
      <label>Resultado sintético
        <select value={outcome} onChange={e => setOutcome(e.target.value as 'success' | 'failure')}>
          <option value="success">Sucesso</option><option value="failure">Falha</option>
        </select>
      </label>
      <label>Tempo pendente
        <select value={delay} onChange={e => setDelay(Number(e.target.value))}>
          <option value={1}>1 segundo</option><option value={15}>15 segundos</option><option value={60}>60 segundos</option>
        </select>
      </label>
      <p aria-live="polite">Requisições simuladas: {requests}</p>
      <button type="button" onClick={toggleTheme}>Tema: {theme}</button>
      <button type="button" onClick={() => setOuter(true)}>Ensaiar diálogos aninhados</button>
      <p>Escolha tema/resultado/tempo antes de abrir o modal. Use apenas e-mail fictício; não digite senha real. Recolha este painel para avaliar layout.</p>
    </details>
    {outer && <ModalDialog className="recovery-backdrop" labelledBy="qa-outer-title" initialFocusRef={outerFocus} onRequestClose={() => { setInner(false); setOuter(false); }}>
      <section className="recovery-modal qa-nested">
        <h2 id="qa-outer-title">Diálogo externo de QA</h2>
        <button type="button" ref={outerFocus} onClick={() => setInner(true)}>Abrir diálogo interno</button>
        <button type="button" onClick={() => setOuter(false)}>Fechar externo</button>
        {inner && <ModalDialog className="recovery-backdrop" labelledBy="qa-inner-title" initialFocusRef={innerFocus} onRequestClose={() => setInner(false)}>
          <section className="recovery-modal qa-nested">
            <h2 id="qa-inner-title">Diálogo interno de QA</h2>
            <button type="button" ref={innerFocus} onClick={() => setInner(false)}>Fechar interno</button>
          </section>
        </ModalDialog>}
      </section>
    </ModalDialog>}
  </>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><MemoryRouter><ThemeProvider><Review /></ThemeProvider></MemoryRouter></StrictMode>,
);
