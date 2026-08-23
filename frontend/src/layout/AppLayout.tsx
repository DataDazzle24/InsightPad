import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { navigationModules } from "../config/navigation";
import { useTheme } from "../theme/theme-context";
import { smartMaskInput } from "../utils/inputMasks";

export function AppLayout() {
  const { profile, permissions, canAccess, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isPlatformAdmin =
    profile?.role.systemRole === true &&
    profile.role.name === "Administrador da Plataforma";

  const modules = useMemo(
    () => navigationModules.filter((module) => module.pageKeys.some(canAccess)),
    [canAccess],
  );
  const pageTitle = useMemo(() => {
    if (location.pathname === "/") return "Menu Principal";
    const permission = Object.values(permissions).find(
      ({ page }) => page.route === location.pathname,
    );
    return (
      permission?.page.displayName ??
      modules.find(({ to }) => to === location.pathname)?.label ??
      "Insight Pad"
    );
  }, [location.pathname, modules, permissions]);

  async function handleSignOut() {
    setLeaving(true);
    try {
      await signOut();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <main
      className="app-frame"
      onInputCapture={(event) => {
        if (event.target instanceof HTMLInputElement)
          smartMaskInput(event.target);
      }}
      onFocusCapture={(event)=>{if(event.target instanceof HTMLInputElement&&event.target.type==='number'&&Number(event.target.value)===0)event.target.select()}}
    >
      <header className="legacy-header">
        <Link
          className="legacy-header__brand"
          to="/"
          aria-label="Insight Pad — início"
        >
          <img src="/brand/insight-pad-logo-dark.png" alt="Insight Pad" />
        </Link>
        <div className="legacy-header__title">
          <span>{pageTitle}</span>
        </div>
        <nav className="legacy-header__nav" aria-label="Módulos do Insight Pad">
          {modules.map((module) => (
            <NavLink
              className="header-nav-item"
              key={module.label}
              to={module.to}
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                {module.icon}
              </span>
              <span className="header-nav-item__tooltip">{module.label}</span>
            </NavLink>
          ))}
          <NavLink className="header-nav-item" to="/" end>
            <span className="material-symbols-rounded" aria-hidden="true">
              home
            </span>
            <span className="header-nav-item__tooltip">Início</span>
          </NavLink>
        </nav>
        <button
          className="legacy-header__user"
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir painel do usuário"
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            person
          </span>
          <span>{profile?.name?.split(" ")[0]}</span>
        </button>
      </header>

      <button
        className={
          drawerOpen
            ? "drawer-backdrop drawer-backdrop--open"
            : "drawer-backdrop"
        }
        onClick={() => setDrawerOpen(false)}
        aria-label="Fechar painel"
      />
      <aside
        className={drawerOpen ? "user-drawer user-drawer--open" : "user-drawer"}
        aria-hidden={!drawerOpen}
      >
        <button
          className="user-drawer__close"
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Fechar"
        >
          <span className="material-symbols-rounded">close</span>
        </button>
        <div className="user-drawer__identity">
          <span className="material-symbols-rounded">account_circle</span>
          <div>
            <strong>{profile?.name}</strong>
            <small>{profile?.role.name}</small>
          </div>
        </div>
        <div className="user-drawer__company">
          <small>EMPRESA</small>
          <strong>
            {profile?.tenant.tradeName ?? profile?.tenant.legalName}
          </strong>
        </div>
        <div className="user-drawer__theme">
          <div>
            <span className="material-symbols-rounded">contrast</span>
            <span>
              <strong>Aparência</strong>
              <small>{theme === "dark" ? "Tema escuro" : "Tema claro"}</small>
            </span>
          </div>
          <button
            className="theme-switch"
            type="button"
            onClick={toggleTheme}
            aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
            aria-pressed={theme === "light"}
          >
            <span className="material-symbols-rounded">dark_mode</span>
            <i>
              <b />
            </i>
            <span className="material-symbols-rounded">light_mode</span>
          </button>
        </div>
        <nav className="user-drawer__actions">
          {isPlatformAdmin && (
            <Link
              to="/configuracoes/acessos"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-rounded">
                admin_panel_settings
              </span>
              Gestão de acessos e plataforma
            </Link>
          )}
        </nav>
        <footer className="user-drawer__footer-actions">
          <a
            href="https://wa.me/5521985795316"
            target="_blank"
            rel="noreferrer"
          >
            <span className="material-symbols-rounded">support_agent</span>Falar
            com o suporte
          </a>
          <button
            className="drawer-signout"
            type="button"
            onClick={() => void handleSignOut()}
            disabled={leaving}
          >
            <span className="material-symbols-rounded">logout</span>
            {leaving ? "Saindo..." : "Sair do sistema"}
          </button>
        </footer>
      </aside>

      <section className="app-stage">
        <Outlet />
      </section>
    </main>
  );
}
