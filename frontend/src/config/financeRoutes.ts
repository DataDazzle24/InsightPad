export const financeDestinations = [
  {pageKey:'FIN_VISAO', route:'/financeiro/visao', label:'Visão financeira', description:'Saldos, vencimentos e o que precisa de atenção.', icon:'monitoring'},
  {pageKey:'CONTAS_PAGAR', route:'/financeiro/contas-a-pagar', label:'Contas a pagar', description:'Obrigações, pagamentos e próximos vencimentos.', icon:'payments'},
  {pageKey:'CONTAS_RECEBER', route:'/financeiro/contas-a-receber', label:'Contas a receber', description:'Recebimentos, parcelas e relacionamento com clientes.', icon:'request_quote'},
  {pageKey:'FIN_CONTAS', route:'/financeiro/contas-e-movimentacoes', label:'Contas e movimentações', description:'Acompanhe o saldo e os movimentos de cada conta.', icon:'account_balance'},
  {pageKey:'FIN_CONCILIACAO', route:'/financeiro/conciliacao', label:'Conciliação', description:'Confira extratos, vínculos e caixas operacionais.', icon:'checklist'},
  {pageKey:'FIN_FLUXO', route:'/financeiro/fluxo-de-caixa', label:'Fluxo de caixa', description:'Acompanhe o realizado e planeje os próximos dias.', icon:'timeline'},
  {pageKey:'FIN_RELATORIOS', route:'/financeiro/relatorios-e-fechamento', label:'Relatórios e fechamento', description:'Resultado por competência e conferência financeira.', icon:'assessment'},
  {pageKey:'FIN_CONFIGURACOES', route:'/financeiro/configuracoes', label:'Configurações financeiras', description:'Categorias, centros, condições e recorrências.', icon:'tune'},
] as const

export type FinancePageKey = typeof financeDestinations[number]['pageKey']
