export interface NavigationItem {
  label: string
  icon: string
  to: string
  pageKeys: string[]
}

export interface NavigationModule extends NavigationItem {
  description: string
  accent: 'cyan' | 'green'
}

export const navigationModules: NavigationModule[] = [
  { label: 'Vendas', icon: 'point_of_sale', to: '/modulos/vendas', pageKeys: ['CAIXA', 'GESTAO_VENDAS'], description: 'Frente de caixa e gestão das vendas', accent: 'cyan' },
  { label: 'Estoque', icon: 'inventory_2', to: '/estoque', pageKeys: ['ESTOQUE'], description: 'Entradas, saídas e posição do estoque', accent: 'green' },
  { label: 'Contas a Pagar', icon: 'payments', to: '/financeiro/contas-a-pagar', pageKeys: ['CONTAS_PAGAR'], description: 'Controle de compromissos financeiros', accent: 'cyan' },
  { label: 'Contas a Receber', icon: 'account_balance_wallet', to: '/financeiro/contas-a-receber', pageKeys: ['CONTAS_RECEBER'], description: 'Recebimentos e acompanhamento financeiro', accent: 'green' },
  { label: 'Cadastros', icon: 'app_registration', to: '/modulos/cadastros', pageKeys: ['CAD_CATEGORIA', 'CAD_SUBCATEGORIA', 'CAD_PRODUTO', 'CAD_CLIENTE', 'CAD_FORNECEDOR', 'CAD_FILIAL'], description: 'Base cadastral do seu negócio', accent: 'cyan' },
  { label: 'Dashboard', icon: 'monitoring', to: '/modulos/dashboards', pageKeys: ['RELATORIOS_OPERACIONAIS'], description: 'Relatórios e inteligência operacional', accent: 'green' },
]

export const moduleMenus = {
  vendas: { title: 'Vendas', subtitle: 'Escolha uma opção para continuar', items: [
    { pageKey: 'CAIXA', label: 'Frente de Caixa', description: 'Registre suas vendas com agilidade', icon: 'point_of_sale' },
    { pageKey: 'GESTAO_VENDAS', label: 'Gestão de Vendas', description: 'Consulte e administre os registros', icon: 'receipt_long' },
  ]},
  cadastros: { title: 'Cadastros', subtitle: 'Mantenha as informações do negócio organizadas', items: [
    { pageKey: 'CAD_CATEGORIA', label: 'Categorias', description: 'Organize as famílias de produtos', icon: 'category' },
    { pageKey: 'CAD_SUBCATEGORIA', label: 'Subcategorias', description: 'Detalhe a classificação do catálogo', icon: 'account_tree' },
    { pageKey: 'CAD_PRODUTO', label: 'Produtos', description: 'Gerencie seu catálogo de produtos', icon: 'sell' },
    { pageKey: 'CAD_CLIENTE', label: 'Clientes', description: 'Centralize sua base de clientes', icon: 'groups' },
    { pageKey: 'CAD_FORNECEDOR', label: 'Fornecedores', description: 'Organize seus parceiros comerciais', icon: 'local_shipping' },
    { pageKey: 'CAD_FILIAL', label: 'Filiais', description: 'Configure unidades e pontos de operação', icon: 'store' },
  ]},
  dashboards: { title: 'Dashboard', subtitle: 'Transforme dados em decisões', items: [
    { pageKey: 'RELATORIOS_OPERACIONAIS', label: 'Faturamento e Lucro', description: 'Acompanhe o resultado diário do negócio', icon: 'query_stats' },
  ]},
} as const
