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
  { label: 'Financeiro', icon: 'account_balance_wallet', to: '/modulos/financeiro', pageKeys: ['CONTAS_PAGAR', 'CONTAS_RECEBER'], description: 'Pagamentos, recebimentos e acompanhamento financeiro', accent: 'cyan' },
  { label: 'Cadastros', icon: 'app_registration', to: '/modulos/cadastros', pageKeys: ['CAD_CATEGORIA', 'CAD_SUBCATEGORIA', 'CAD_PRODUTO', 'CAD_CLIENTE', 'CAD_FORNECEDOR', 'CAD_FILIAL'], description: 'Base cadastral do seu negócio', accent: 'cyan' },
  { label: 'Dashboard', icon: 'monitoring', to: '/modulos/dashboards', pageKeys: ['RELATORIOS_OPERACIONAIS'], description: 'Relatórios e inteligência operacional', accent: 'green' },
  { label: 'Canais', icon: 'hub', to: '/integracoes/canais', pageKeys: ['CANAIS_VENDA'], description: 'iFood, Zé Delivery e novos canais de venda', accent: 'cyan' },
]

export const moduleMenus = {
  vendas: { title: 'Vendas', subtitle: 'Escolha uma opção para continuar', items: [
    { pageKey: 'CAIXA', label: 'Frente de Caixa', description: 'Registre suas vendas com agilidade', icon: 'point_of_sale' },
    { pageKey: 'GESTAO_VENDAS', label: 'Gestão de Vendas', description: 'Consulte e administre os registros', icon: 'receipt_long' },
  ]},
  financeiro: { title: 'Financeiro', subtitle: 'Organize pagamentos e recebimentos do seu negócio', items: [
    { pageKey: 'CONTAS_PAGAR', label: 'Contas a Pagar', description: 'Controle de compromissos financeiros', icon: 'payments' },
    { pageKey: 'CONTAS_RECEBER', label: 'Contas a Receber', description: 'Recebimentos e acompanhamento financeiro', icon: 'account_balance_wallet' },
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
