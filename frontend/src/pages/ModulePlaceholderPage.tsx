import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

interface ModulePlaceholderPageProps { pageKey: string }

export function ModulePlaceholderPage({ pageKey }: ModulePlaceholderPageProps) {
  const { permissions } = useAuth()
  const permission = permissions[pageKey]

  return (
    <section className="operational-page">
      <div className="operational-page__panel">
        <span className="eyebrow">{permission?.page.module ?? 'Módulo'}</span>
        <span className="material-symbols-rounded operational-page__icon">construction</span>
        <h1>{permission?.page.displayName ?? 'Página em migração'}</h1>
        <p>O acesso e a navegação desta página já estão protegidos. As regras operacionais do Apps Script serão conectadas na próxima etapa da migração.</p>
        <div className="capability-list">
          <span data-active={permission?.canCreate}>Cadastrar</span>
          <span data-active={permission?.canUpdate}>Editar</span>
          <span data-active={permission?.canDelete}>Excluir</span>
          <span data-active={permission?.canExport}>Exportar</span>
          <span data-active={permission?.canManage}>Gerenciar</span>
        </div>
        <Link className="outline-button" to="/">Voltar ao menu principal</Link>
      </div>
    </section>
  )
}
