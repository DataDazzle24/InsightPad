import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

type RecoveryMethod = "email" | "sms";

export function LoginPage() {
  const { status, error, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null),
    [submitting, setSubmitting] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false),
    [method, setMethod] = useState<RecoveryMethod>("email");

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
      setSubmitting(false);
    }
  }
  const busy = submitting || status === "loading";

  return (
    <main className="brand-login">
      <section className="brand-login__hero">
        <img
          className="brand-login__logo"
          src="/brand/insight-pad-logo-dark.png"
          alt="Insight Pad"
        />
        <div className="brand-login__statement">
          <h1>
            DADOS PARA O PRESENTE.
            <br />
            <em>INSIGHTS PARA O FUTURO.</em>
          </h1>
        </div>
        <footer>
          <span>Um produto</span>
          <img src="/brand/data-dazzle-logo-dark.png" alt="Data Dazzle" />
        </footer>
      </section>
      <section className="brand-login__access">
        <div className="login-hud">
          <span className="login-hud__corner login-hud__corner--tl" />
          <span className="login-hud__corner login-hud__corner--br" />
          <img
            className="login-mobile-logo"
            src="/brand/insight-pad-logo-dark.png"
            alt="Insight Pad"
          />
          <header>
            <h2>Bem-vindo de volta</h2>
          </header>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <div className="hud-input">
              <span className="material-symbols-rounded">mail</span>
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
              <span className="material-symbols-rounded">lock</span>
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
                <span className="material-symbols-rounded">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <div className="form-feedback" aria-live="polite">
              {error && <p className="form-feedback--error">{error}</p>}
              {message && <p className="form-feedback--info">{message}</p>}
            </div>
            <button className="login-submit" type="submit" disabled={busy}>
              <span>{busy ? "Validando acesso..." : "Entrar"}</span>
              <span className="material-symbols-rounded">arrow_forward</span>
            </button>
          </form>
          <footer>
            <span className="status-dot" />
            Ambiente protegido pelo Firebase
          </footer>
        </div>
      </section>
      {recoveryOpen && (
        <div className="recovery-backdrop">
          <section
            className="recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
          >
            <header>
              <div>
                <span className="eyebrow">CONTA PROTEGIDA</span>
                <h2 id="recovery-title">Recuperar acesso</h2>
              </div>
              <button
                onClick={() => setRecoveryOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <form onSubmit={requestRecovery}>
              <p>
                Escolha como deseja confirmar sua identidade. Por segurança, a
                resposta não informa se uma conta existe.
              </p>
              <div className="recovery-methods">
                <button
                  type="button"
                  className={method === "email" ? "active" : ""}
                  onClick={() => setMethod("email")}
                >
                  <span className="material-symbols-rounded">mail</span>
                  <b>E-mail</b>
                  <small>Link seguro do Firebase</small>
                </button>
                <button
                  type="button"
                  className={method === "sms" ? "active" : ""}
                  onClick={() => setMethod("sms")}
                >
                  <span className="material-symbols-rounded">sms</span>
                  <b>SMS</b>
                  <small>Requer ativação administrativa</small>
                </button>
              </div>
              {method === "email" ? (
                <label>
                  E-mail cadastrado
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
              ) : (
                <div className="recovery-security-note">
                  <span className="material-symbols-rounded">
                    verified_user
                  </span>
                  <p>
                    O SMS será habilitado somente com telefone previamente
                    verificado, código temporário com expiração, limite de
                    tentativas e validação no servidor.
                  </p>
                </div>
              )}
              <footer>
                <button type="button" onClick={() => setRecoveryOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="catalog-primary"
                  disabled={busy || method === "sms"}
                >
                  {method === "sms" ? "Indisponível" : "Enviar instruções"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
