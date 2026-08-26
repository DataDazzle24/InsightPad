import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { navigationModules } from "../config/navigation";
import { appRoutes } from "../config/pages";
import { useTheme } from "../theme/theme-context";
import { smartMaskInput } from "../utils/inputMasks";
import { ChannelOrderNotifier } from "../components/ChannelOrderNotifier";

const drawerPageIcons: Record<string, string> = {
  CAIXA: "point_of_sale",
  GESTAO_VENDAS: "receipt_long",
  ESTOQUE: "inventory_2",
  CONTAS_PAGAR: "payments",
  CONTAS_RECEBER: "account_balance_wallet",
  CAD_CATEGORIA: "category",
  CAD_SUBCATEGORIA: "account_tree",
  CAD_PRODUTO: "sell",
  CAD_CLIENTE: "groups",
  CAD_FORNECEDOR: "local_shipping",
  CAD_FILIAL: "store",
  RELATORIOS_OPERACIONAIS: "monitoring",
  CANAIS_VENDA: "hub",
};

function WhatsAppIcon() {
  return (
    <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a9.75 9.75 0 0 0-8.45 14.63L2.2 21.8l5.29-1.29A9.76 9.76 0 1 0 12 2Zm0 17.75a7.94 7.94 0 0 1-4.05-1.1l-.31-.18-3.14.77.8-3.05-.2-.32A8 8 0 1 1 12 19.75Z"
      />
      <path
        fill="currentColor"
        d="M16.42 13.98c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-1.42-.71-2.35-1.27-3.29-2.88-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

export function AppLayout() {
  const { profile, permissions, canAccess, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isPlatformAdmin = profile?.role.systemRole === true;

  const modules = useMemo(
    () => navigationModules.filter((module) => module.pageKeys.some(canAccess)),
    [canAccess],
  );
  const availablePages = useMemo(
    () =>
      appRoutes.flatMap(({ pageKey, route }) => {
        const permission = permissions[pageKey];
        if (pageKey === "GESTAO_ACESSOS" || permission?.canAccess !== true)
          return [];
        return [
          {
            pageKey,
            route,
            label: permission.page.displayName,
            icon: drawerPageIcons[pageKey] ?? "description",
          },
        ];
      }),
    [permissions],
  );

  useEffect(() => {
    if (!drawerOpen) return;
    drawerCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        drawerTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);
  const pageTitle = useMemo(() => {
    if (location.pathname === "/") return "Menu Principal";
    if (location.pathname === "/integracoes/canais/pedidos") return "Pedidos";
    if (location.pathname === "/integracoes/canais/conexoes") return "Gestão de conexões";
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
          <img src="/brand/insight-pad-logo-compact.png" alt="Insight Pad" />
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
          ref={drawerTriggerRef}
          className="legacy-header__user"
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir painel do usuário"
          aria-controls="user-drawer"
          aria-expanded={drawerOpen}
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
        id="user-drawer"
        className={drawerOpen ? "user-drawer user-drawer--open" : "user-drawer"}
        aria-hidden={!drawerOpen}
        aria-label="Painel do usuário"
      >
        <button
          ref={drawerCloseRef}
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
        <div className="user-drawer__actions">
          <section className="user-drawer__pages" aria-labelledby="available-pages-title">
            <header>
              <strong id="available-pages-title">Páginas disponíveis</strong>
              <small>{availablePages.length}</small>
            </header>
            <nav aria-label="Páginas disponíveis para o usuário">
              {availablePages.map((page) => (
                <NavLink
                  key={page.pageKey}
                  to={page.route}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {page.icon}
                  </span>
                  {page.label}
                </NavLink>
              ))}
            </nav>
          </section>
          {isPlatformAdmin && (
            <Link
              className="user-drawer__platform-link"
              to="/configuracoes/acessos"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-rounded">
                admin_panel_settings
              </span>
              Gestão de acessos e plataforma
            </Link>
          )}
        </div>
        <footer className="user-drawer__footer-actions">
          {isPlatformAdmin && (
            <button
              className="drawer-client-area"
              type="button"
              disabled
              title="Área do cliente — disponível em breve"
            >
              <span className="material-symbols-rounded" aria-hidden="true">
                person
              </span>
              Área do cliente
            </button>
          )}
          <a
            className="drawer-support"
            href="https://wa.me/5521985795316"
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            Conversar com suporte
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
      <ChannelOrderNotifier />
    </main>
  );
}
