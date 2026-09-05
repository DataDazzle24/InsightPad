import { Link } from "react-router-dom";

const items = [
  {
    label: "Empresas e ambientes",
    description: "Cadastre clientes, responsáveis e condições comerciais",
    icon: "domain",
    route: "/plataforma/empresas-ambientes",
  },
  {
    label: "Cobranças e baixas",
    description: "Acompanhe valores, vencimentos e recebimentos",
    icon: "request_quote",
    route: "/plataforma/cobrancas-baixas",
  },
  {
    label: "Gestão de usuários",
    description: "Administre usuários, perfis e permissões globais",
    icon: "manage_accounts",
    route: "/plataforma/gestao-usuarios/usuarios",
  },
] as const;

export function PlatformAdminMenuPage() {
  return (
    <section className="legacy-module platform-module-menu">
      <header className="legacy-module__intro">
        <span className="eyebrow">DATA DAZZLE</span>
        <h1>Gestão da plataforma</h1>
        <p>Escolha uma área administrativa para continuar</p>
      </header>
      <div className="legacy-module__grid">
        {items.map((item) => (
          <Link className="legacy-tile legacy-tile--submenu" key={item.label} to={item.route}>
            <span className="legacy-tile__bar" />
            <span className="material-symbols-rounded legacy-tile__icon" aria-hidden="true">{item.icon}</span>
            <span><strong>{item.label}</strong><small>{item.description}</small></span>
            <span className="material-symbols-rounded legacy-tile__arrow" aria-hidden="true">arrow_forward</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
