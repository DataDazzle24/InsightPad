import { useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useTheme } from "../theme/theme-context";
import { ModalDialog } from "../components/ModalDialog";

import "./LoginPage.visual.css";

function LoginIcon({ name }: { name: "mail" | "lock" | "arrow" | "eye" | "eyeOff" | "shield" | "sms" | "theme" }) {
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="m3 3 18 18M10 5a10 10 0 0 1 2 0c6.5 0 10 7 10 7a18 18 0 0 1-3 4M6 6a20 20 0 0 0-4 6s3.5 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
    sms: <><path d="M21 14a3 3 0 0 1-3 3H9l-6 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8Z"/><path d="M7 8h10M7 12h6"/></>,
    theme: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/></>,
  };
  return <svg className="login-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

type RecoveryMethod = "email" | "sms";

export function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const { status, error, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null),
    [submitting, setSubmitting] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false),
    [method, setMethod] = useState<RecoveryMethod>("email");
  const recoveryEmailRef = useRef<HTMLInputElement>(null);
  const recoverySubmittingRef = useRef(false);

  if (status === "authenticated") return <Navigate to="/" replace />;
  if (status === "unauthorized")
    return <Navigate to="/acesso-negado" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      /* mensagem segura no contexto */
    } finally {
      setSubmitting(false);
    }
  }
  function openRecovery() {
    setMessage(null);
    setMethod("email");
    setRecoveryOpen(true);
  }
  async function requestRecovery(event: FormEvent) {
    event.preventDefault();
    if (recoverySubmittingRef.current || submitting) return;
    setMessage(null);
    if (method === "sms") {
      setMessage(
        "A recuperação por SMS depende da ativação de um provedor seguro pelo administrador. Use o e-mail por enquanto.",
      );
      return;
    }
    if (!email.trim()) {
      setMessage("Informe seu e-mail antes de continuar.");
      return;
    }
    recoverySubmittingRef.current = true;
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage(
        "Se o e-mail estiver cadastrado, uma mensagem segura de recuperação será enviada.",
      );
      setRecoveryOpen(false);
    } catch {
      setMessage(
        "Se o e-mail estiver cadastrado, uma mensagem segura de recuperação será enviada.",
      );
      setRecoveryOpen(false);
    } finally {
      recoverySubmittingRef.current = false;
      setSubmitting(false);
    }
  }
  const busy = submitting || status === "loading";

  return (
    <main className="brand-login ip-ui ip-login-v2" data-theme={theme}>
      <div className="login-atmosphere" aria-hidden="true" />
      <button className="login-theme" type="button" onClick={toggleTheme}
        aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}>
        <LoginIcon name="theme" />
        {theme === "dark" ? "Tema claro" : "Tema escuro"}
      </button>
      <section className="brand-login__hero">
        <div className="login-logo-frame">
        <img
          className="brand-login__logo"
          src="/brand/insight-pad-interface.png"
          alt="Insight Pad"
        />
        </div>
        <footer>
          <span>Um produto</span>
          <img src="/brand/data-dazzle-logo-dark.png" alt="" />
          <strong>Data Dazzle</strong>
        </footer>
      </section>
      <section className="brand-login__access">
        <div className="login-hud">

          <header>
            <span className="login-card-icon"><LoginIcon name="lock" /></span>
            <h2>Bem-vindo de volta</h2>
          </header>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <div className="hud-input">
              <LoginIcon name="mail" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                disabled={busy}
                required
              />
            </div>
            <div className="password-label">
              <label htmlFor="password">Senha</label>
              <button type="button" onClick={openRecovery} disabled={busy}>
                Esqueci minha senha
              </button>
            </div>
            <div className="hud-input">
              <LoginIcon name="lock" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                disabled={busy}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
              >
                <LoginIcon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </div>
            <div className="form-feedback" aria-live="polite">
              {error && <p className="form-feedback--error">{error}</p>}
              {message && <p className="form-feedback--info">{message}</p>}
            </div>
            <button className="login-submit" type="submit" disabled={busy}>
              <span>{busy ? "Validando acesso..." : "Entrar"}</span>
              <LoginIcon name="arrow" />
            </button>
          </form>
          <footer>
            <LoginIcon name="shield" />
            Ambiente protegido pelo Firebase
          </footer>
        </div>
      </section>
      {recoveryOpen && (
        <ModalDialog
          className="recovery-backdrop"
          labelledBy="recovery-title"
          initialFocusRef={recoveryEmailRef}
          busy={busy}
          onRequestClose={() => setRecoveryOpen(false)}
        >
          <section
            className="recovery-modal"
          >
            <header>
              <div>
                <span className="eyebrow">CONTA PROTEGIDA</span>
                <h2 id="recovery-title">Recuperar acesso</h2>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryOpen(false)}
                aria-label="Fechar"
                disabled={busy}
              >
                ×
              </button>
            </header>
            <form onSubmit={requestRecovery}>
              <div className="recovery-body">
              <p>
                Escolha como deseja confirmar sua identidade. Por segurança, a
                resposta não informa se uma conta existe.
              </p>
              <div className="recovery-methods">
                <button
                  type="button"
                  disabled={busy}
                  className={method === "email" ? "active" : ""}
                  onClick={() => setMethod("email")}
                >
                  <LoginIcon name="mail" />
                  <b>E-mail</b>
                  <small>Link seguro do Firebase</small>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={method === "sms" ? "active" : ""}
                  onClick={() => setMethod("sms")}
                >
                  <LoginIcon name="sms" />
                  <b>SMS</b>
                  <small>Requer ativação administrativa</small>
                </button>
              </div>
              {method === "email" ? (
                <label>
                  E-mail cadastrado
                  <input
                    ref={recoveryEmailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={busy}
                  />
                </label>
              ) : (
                <div className="recovery-security-note">
                  <LoginIcon name="shield" />
                  <p>
                    O SMS será habilitado somente com telefone previamente
                    verificado, código temporário com expiração, limite de
                    tentativas e validação no servidor.
                  </p>
                </div>
              )}
              </div>
              <footer>
                <button
                  type="button"
                  className="catalog-modal-cancel"
                  onClick={() => setRecoveryOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  className="catalog-primary"
                  type="submit"
                  disabled={busy || method === "sms"}
                >
                  {method === "sms" ? "Indisponível" : "Enviar instruções"}
                </button>
              </footer>
            </form>
          </section>
        </ModalDialog>
      )}
    </main>
  );
}
