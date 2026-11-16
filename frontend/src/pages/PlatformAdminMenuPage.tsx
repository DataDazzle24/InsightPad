import { MenuCard } from "../components/MenuCard";

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
    <section className="legacy-module menus-submenu platform-module-menu">
      <header className="legacy-module__intro">
        <span className="eyebrow">DATA DAZZLE</span>
        <h1>Gestão da plataforma</h1>
        <p>Escolha uma área administrativa para continuar</p>
      </header>
      <div className="legacy-module__grid">
        {items.map((item) => (
          <MenuCard key={item.label} to={item.route} label={item.label} description={item.description} icon={item.icon} />
        ))}
      </div>
    </section>
  );
}
