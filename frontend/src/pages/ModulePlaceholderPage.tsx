import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

interface ModulePlaceholderPageProps {
  pageKey: string
}

export function ModulePlaceholderPage({ pageKey }: ModulePlaceholderPageProps) {
  const { permissions } = useAuth()
  const permission = permissions[pageKey]

  return (
    <section className="module-page">
      <span className="eyebrow">{permission?.page.module ?? 'Módulo'}</span>
      <h1>{permission?.page.displayName ?? 'Página em migração'}</h1>
      <p>
        O acesso já está protegido pelo PostgreSQL. As regras operacionais desta
        página serão migradas do Apps Script na etapa correspondente.
      </p>
      <div className="capability-list">
        <span data-active={permission?.canCreate}>Cadastrar</span>
        <span data-active={permission?.canUpdate}>Editar</span>
        <span data-active={permission?.canDelete}>Excluir</span>
        <span data-active={permission?.canExport}>Exportar</span>
        <span data-active={permission?.canManage}>Gerenciar</span>
      </div>
      <Link className="secondary-button module-page__back" to="/">Voltar à visão geral</Link>
    </section>
  )
}
