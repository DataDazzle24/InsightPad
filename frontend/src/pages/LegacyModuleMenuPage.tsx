import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const menus = {
  vendas: [['CAIXA','/vendas/frente-de-caixa','shopping_cart','FRENTE DE CAIXA'],['GESTAO_VENDAS','/vendas/registros','▤','REGISTROS DE VENDA']],
  cadastros: [['CAD_CATEGORIA','/cadastros/categorias','♢','CATEGORIAS'],['CAD_SUBCATEGORIA','/cadastros/subcategorias','⌘','SUBCATEGORIAS'],['CAD_PRODUTO','/cadastros/produtos','▱','PRODUTOS'],['CAD_CLIENTE','/cadastros/clientes','▧','CLIENTES'],['CAD_FILIAL','/cadastros/filiais','▥','FILIAIS'],['CAD_FORNECEDOR','/cadastros/fornecedores','▰','FORNECEDORES']],
  dashboards: [['RELATORIOS_OPERACIONAIS','/dashboards/operacional','▥','RELATÓRIOS OPERACIONAIS']],
} as const

export function LegacyModuleMenuPage({ type }: { type: keyof typeof menus }) {
  const { permissions } = useAuth()
  return <section className="legacy-submenu">{menus[type].filter(([key]) => permissions[key]?.canAccess).map(([key,route,icon,label]) => <Link className="legacy-submenu__button" key={key} to={route}><i>{icon}</i><span>{label}</span></Link>)}</section>
}
