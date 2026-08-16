export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select'

export interface ModuleField {
  key: string
  label: string
  type?: FieldType
  required?: boolean
  options?: string[]
  mobilePriority?: boolean
}

export interface ModuleDefinition {
  pageKey: string
  title: string
  description: string
  singular: string
  module: string
  fields: ModuleField[]
  quickFilters?: string[]
  primaryAction?: string
}

export const moduleDefinitions: Record<string, ModuleDefinition> = {
  CAIXA: {
    pageKey: 'CAIXA', title: 'Frente de caixa', singular: 'venda', module: 'Vendas',
    description: 'Registre vendas rapidamente por nome, código ou leitor de código de barras.',
    primaryAction: 'Iniciar venda',
    fields: [
      { key: 'branch', label: 'Filial', required: true, mobilePriority: true },
      { key: 'customer', label: 'Cliente', mobilePriority: true },
      { key: 'product', label: 'Produto / código de barras', required: true, mobilePriority: true },
      { key: 'quantity', label: 'Quantidade', type: 'number', required: true },
      { key: 'unitPrice', label: 'Valor unitário', type: 'number', required: true, mobilePriority: true },
      { key: 'discount', label: 'Desconto', type: 'number' },
      { key: 'surcharge', label: 'Acréscimo', type: 'number' },
      { key: 'paymentMethod', label: 'Forma de pagamento', required: true, options: ['Dinheiro', 'Pix', 'Cartão de débito', 'Cartão de crédito', 'Outros'] },
      { key: 'amountPaid', label: 'Valor recebido', type: 'number', required: true },
    ],
  },
  CAD_CATEGORIA: {
    pageKey: 'CAD_CATEGORIA', title: 'Categorias', singular: 'categoria', module: 'Cadastros',
    description: 'Organize os produtos em grupos fáceis de localizar.',
    fields: [{ key: 'name', label: 'Nome da categoria', required: true, mobilePriority: true }],
  },
  CAD_SUBCATEGORIA: {
    pageKey: 'CAD_SUBCATEGORIA', title: 'Subcategorias', singular: 'subcategoria', module: 'Cadastros',
    description: 'Detalhe as categorias para encontrar produtos com rapidez.',
    fields: [
      { key: 'category', label: 'Categoria', required: true, mobilePriority: true },
      { key: 'name', label: 'Nome da subcategoria', required: true, mobilePriority: true },
    ],
  },
  CAD_FILIAL: {
    pageKey: 'CAD_FILIAL', title: 'Filiais', singular: 'filial', module: 'Cadastros',
    description: 'Cadastre e mantenha os dados das unidades da empresa.',
    fields: [
      { key: 'name', label: 'Nome da filial', required: true, mobilePriority: true },
      { key: 'internalCode', label: 'Código interno' }, { key: 'postalCode', label: 'CEP' },
      { key: 'stateCode', label: 'UF' }, { key: 'city', label: 'Cidade', mobilePriority: true },
      { key: 'district', label: 'Bairro' }, { key: 'street', label: 'Endereço' },
      { key: 'streetNumber', label: 'Número' }, { key: 'addressComplement', label: 'Complemento' },
      { key: 'phone', label: 'Telefone', type: 'tel' },
    ],
  },
  CAD_CLIENTE: {
    pageKey: 'CAD_CLIENTE', title: 'Clientes', singular: 'cliente', module: 'Cadastros',
    description: 'Consulte contatos, preferências e histórico dos seus clientes.',
    fields: [
      { key: 'name', label: 'Nome', required: true, mobilePriority: true },
      { key: 'cpf', label: 'CPF' }, { key: 'cnpj', label: 'CNPJ' },
      { key: 'birthDate', label: 'Nascimento', type: 'date' }, { key: 'gender', label: 'Gênero' },
      { key: 'email', label: 'E-mail', type: 'email', mobilePriority: true },
      { key: 'phonePrimary', label: 'Telefone principal', type: 'tel', mobilePriority: true },
      { key: 'phoneSecondary', label: 'Telefone secundário', type: 'tel' },
      { key: 'postalCode', label: 'CEP' }, { key: 'stateCode', label: 'UF' },
      { key: 'city', label: 'Cidade' }, { key: 'district', label: 'Bairro' },
      { key: 'street', label: 'Endereço' }, { key: 'streetNumber', label: 'Número' },
      { key: 'addressComplement', label: 'Complemento' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  CAD_FORNECEDOR: {
    pageKey: 'CAD_FORNECEDOR', title: 'Fornecedores', singular: 'fornecedor', module: 'Cadastros',
    description: 'Centralize contatos, prazos e informações dos fornecedores.',
    fields: [
      { key: 'legalName', label: 'Razão social / Nome', required: true, mobilePriority: true },
      { key: 'tradeName', label: 'Nome fantasia', mobilePriority: true },
      { key: 'internalCode', label: 'Código interno' }, { key: 'cpf', label: 'CPF' },
      { key: 'cnpj', label: 'CNPJ' }, { key: 'contactName', label: 'Contato' },
      { key: 'phonePrimary', label: 'Telefone principal', type: 'tel', mobilePriority: true },
      { key: 'phoneSecondary', label: 'Telefone secundário', type: 'tel' },
      { key: 'email', label: 'E-mail', type: 'email' }, { key: 'segment', label: 'Segmento' },
      { key: 'paymentTerms', label: 'Condição de pagamento' },
      { key: 'averageDeliveryDays', label: 'Prazo médio de entrega', type: 'number' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  CAD_PRODUTO: {
    pageKey: 'CAD_PRODUTO', title: 'Produtos', singular: 'produto', module: 'Cadastros',
    description: 'Gerencie preços, códigos, classificação e limites de estoque.',
    fields: [
      { key: 'name', label: 'Nome do produto', required: true, mobilePriority: true },
      { key: 'internalCode', label: 'Código interno', mobilePriority: true },
      { key: 'ean', label: 'Código de barras', mobilePriority: true },
      { key: 'category', label: 'Categoria', required: true }, { key: 'subcategory', label: 'Subcategoria' },
      { key: 'supplier', label: 'Fornecedor' }, { key: 'brand', label: 'Marca' },
      { key: 'sizeType', label: 'Tipo de tamanho' }, { key: 'size', label: 'Tamanho' },
      { key: 'color', label: 'Cor' }, { key: 'salePrice', label: 'Preço de venda', type: 'number', mobilePriority: true },
      { key: 'costPrice', label: 'Preço de custo', type: 'number' },
      { key: 'minimumStock', label: 'Estoque mínimo', type: 'number' },
      { key: 'maximumStock', label: 'Estoque máximo', type: 'number' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  ESTOQUE: {
    pageKey: 'ESTOQUE', title: 'Estoque', singular: 'movimentação', module: 'Estoque',
    description: 'Acompanhe saldos, entradas, saídas e transferências entre filiais.',
    primaryAction: 'Nova movimentação', quickFilters: ['Todos', 'Entradas', 'Saídas', 'Estoque baixo'],
    fields: [
      { key: 'occurredAt', label: 'Data', type: 'date', required: true, mobilePriority: true },
      { key: 'branch', label: 'Filial', required: true }, { key: 'product', label: 'Produto', required: true, mobilePriority: true },
      { key: 'movementType', label: 'Tipo de movimentação', required: true, options: ['Entrada', 'Saída', 'Ajuste', 'Transferência'] },
      { key: 'quantity', label: 'Quantidade', type: 'number', required: true, mobilePriority: true },
      { key: 'unitCost', label: 'Custo unitário', type: 'number' }, { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  GESTAO_VENDAS: {
    pageKey: 'GESTAO_VENDAS', title: 'Registros de venda', singular: 'venda', module: 'Vendas',
    description: 'Consulte, filtre, corrija e cancele vendas realizadas.',
    primaryAction: 'Registrar venda', quickFilters: ['Hoje', 'Esta semana', 'Este mês', 'Canceladas'],
    fields: [
      { key: 'soldAt', label: 'Data da venda', type: 'date', required: true, mobilePriority: true },
      { key: 'branch', label: 'Filial', required: true }, { key: 'customer', label: 'Cliente', mobilePriority: true },
      { key: 'total', label: 'Total', type: 'number', required: true, mobilePriority: true },
      { key: 'paymentMethod', label: 'Forma de pagamento', required: true },
      { key: 'status', label: 'Status', options: ['Concluída', 'Cancelada'] },
    ],
  },
  CONTAS_PAGAR: {
    pageKey: 'CONTAS_PAGAR', title: 'Contas a pagar', singular: 'conta', module: 'Financeiro',
    description: 'Controle compromissos, vencimentos e pagamentos da empresa.',
    primaryAction: 'Nova conta', quickFilters: ['Em aberto', 'Vencidas', 'Pagas', 'Este mês'],
    fields: [
      { key: 'description', label: 'Descrição', required: true, mobilePriority: true },
      { key: 'supplier', label: 'Fornecedor' }, { key: 'branch', label: 'Filial', required: true },
      { key: 'dueDate', label: 'Vencimento', type: 'date', required: true, mobilePriority: true },
      { key: 'amount', label: 'Valor', type: 'number', required: true, mobilePriority: true },
      { key: 'status', label: 'Status', options: ['Em aberto', 'Pago', 'Vencido'] },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  CONTAS_RECEBER: {
    pageKey: 'CONTAS_RECEBER', title: 'Contas a receber', singular: 'recebimento', module: 'Financeiro',
    description: 'Acompanhe valores previstos, recebidos e atrasados.',
    primaryAction: 'Novo recebimento', quickFilters: ['Em aberto', 'Vencidas', 'Recebidas', 'Este mês'],
    fields: [
      { key: 'description', label: 'Descrição', required: true, mobilePriority: true },
      { key: 'customer', label: 'Cliente' }, { key: 'branch', label: 'Filial', required: true },
      { key: 'dueDate', label: 'Vencimento', type: 'date', required: true, mobilePriority: true },
      { key: 'amount', label: 'Valor', type: 'number', required: true, mobilePriority: true },
      { key: 'status', label: 'Status', options: ['Em aberto', 'Recebido', 'Vencido'] },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
  },
  GESTAO_ACESSOS: {
    pageKey: 'GESTAO_ACESSOS', title: 'Gestão de acessos', singular: 'usuário', module: 'Configurações',
    description: 'Defina quem pode visualizar e alterar cada parte do sistema.',
    primaryAction: 'Novo usuário',
    fields: [
      { key: 'name', label: 'Nome', required: true, mobilePriority: true },
      { key: 'email', label: 'E-mail', type: 'email', required: true, mobilePriority: true },
      { key: 'role', label: 'Perfil', required: true, options: ['Dono', 'Gerente', 'Operador', 'Financeiro', 'Estoquista'] },
      { key: 'branch', label: 'Filial' }, { key: 'status', label: 'Status', options: ['Ativo', 'Bloqueado'] },
    ],
  },
  RELATORIOS_OPERACIONAIS: {
    pageKey: 'RELATORIOS_OPERACIONAIS', title: 'Relatórios operacionais', singular: 'indicador', module: 'Dashboards',
    description: 'Visualize vendas, estoque, produtos e clientes em um único lugar.',
    quickFilters: ['Hoje', '7 dias', '30 dias', 'Este ano'], fields: [],
  },
}
