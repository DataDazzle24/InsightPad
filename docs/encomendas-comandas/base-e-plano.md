# Encomendas e Comandas — reconciliação e plano

Base: agent/ajustes-finos-pdv-dash-dev, SHA 72f9b629337ae2c0e799863f3ef4ab01c8b71326,
checkout limpo. Branch nova: agent/encomendas-comandas-dev. Refs remotas conferidas
em 18/11/2026; a linha de ajustes finos permanece nesse SHA. Não usar PR21 histórica.
DEV: último recibo confirmado P57, versão 07318b898d5f5729/release1794868621178000.
Leitura direta de version.json retornou403 neste executor; estado atual não inferido.
Não há publicação nova, migração remota ou merge nesta etapa.

Fontes: pedido integrado; complemento backend v1 (A/R/T/D); PDF/kit aprovado;
Sites versão3/SHA24549a8d0fda5fd672e453ad29add623fd16560e, confirmado via conector.
A exportação foi localizada pelo Sites, mas download não pôde ser autorizado/resolvido.
Não declarar reprodução integral de estados sem comparação. PDF/TSX/CSS disponíveis.

| Área | Código atual reutilizável | Integração |
|---|---|---|
| Router/menu/shell | App.tsx, config/pages.ts, config/navigation.ts, ModuleMenuPage, MenuCard | Duas rotas e ordem Vendas; sem redesenho global |
| Sessão/permissão | user_device_sessions, users/tenants/roles, user/role_page_permissions, AuthProvider | Mesma precedência, lease15min/12h, filial; nenhum grant genérico |
| Catálogo | products, product_components, promotions, customers, branches | IDs reais, preço/composição snapshot, expansão agregada |
| Estoque | stock_balances/movements, sales_channel_stock_reservations | Reservas EC aditivas e proteção no banco para todos os escritores |
| Caixa/aprovação | cash_sessions/movements, payment_methods, pos_policies/approvals | Receber no caixa de origem; vínculo na venda sem novo dinheiro |
| Venda/registros | Sale/SaleItem/SalePayment, PostSale/CancelSale, SalesManagementPage | Fechar uma vez, origem tipada e consulta ao documento |
| Dashboard | DashboardHubPage, queries.gql | Faturamento via venda final; recebimento por data do dinheiro |
| Diálogos | ModalDialog/useModalIsolation | Top layer/foco/retorno preservados |

D01: Tenant.timezone existente; sequência tenant/modalidade (código operacional,
sem natureza fiscal). D03: reserva EC sempre integral, sem usar allowNegativeStock
para inventar disponibilidade. D04: troca direta de filial bloqueada após dinheiro;
nenhuma política atual autoriza mover caixa entre filiais. D06: preço promocional
vigente e snapshots; alteração manual limitada à gestão e regras atuais, sem taxas
inventadas. D02/pesáveis, D05/retirada em preparo e D07/autorizações sensíveis foram
aprovadas expressamente em 18/11/2026 (horário do cliente). A política implementa
essa decisão sem dispensar limites e aprovação distinta do Caixa.

Ordem: dados/constraints e comandos SQL transacionais; contratos/SDKs; adaptador
com recuperação de confirmação incerta; interface e integrações; testes de domínio,
PostgreSQL isolado/concorrência, compilador SQL Connect, navegador e CI. Publicação
necessita autorização específica do conjunto de schema/connector/migração: as
publicações anteriores eram Hosting somente. Preparar plano concreto antes de pedir.

Rollback após haver dados mantém tabelas/ledger/leitor e contenções de reservas.
Não apagar documentos nem reverter Hosting como se desfizesse recebimentos.
CORE não gravada; entregar handoff local. Preservar 68 ajustes e suas exclusões.

Achados dirigidos durante a validação:
- PosProductBranches tinha sombra do alias de filial na subconsulta do saldo. A
  integração de disponibilidade corrige somente esse alias, com teste real.
- DailyProfitDashboard (operação histórica) tem agregados aninhados inválidos.
  O dashboard ativo usa FinancialIndicatorsDashboard; a operação histórica não
  foi reformulada neste escopo. A evidência T31 usa a consulta efetivamente ativa.
- As fixtures SQL agora incluem movimentos de abertura correspondentes ao saldo;
  a tela Estoque deriva o físico do livro de movimentos. Não confundir saldo
  inventado em fixture com estoque auditável.
