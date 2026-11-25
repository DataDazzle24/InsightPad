# Base conciliada do Financeiro

Inventário iniciado em 25/11/2026. Branch `agent/financeiro-integral-dev`, criada
de `dcb03f18a49bf267eb44a8fecbebeea641c9984a`, árvore inicialmente limpa.
`origin/main` (`97807dfd6723794eb9c46252cb191d561012798a`) é anterior às
publicações DEV e não foi usado como base. Nenhuma alteração remota do Financeiro
foi executada neste inventário.

## Contratos existentes comprovados no código

| Domínio | Estruturas e escritores | Consequência |
| --- | --- | --- |
| Pagar/receber | `FinancialAccount`, `FinancialCategory`, `AccountPayable`, `AccountReceivable` em `dataconnect/schema/schema.gql` | Preservar IDs, FKs, valores e interfaces legadas; não criar um segundo livro de títulos. |
| Interface | `App.tsx`, `config/pages.ts`, `config/navigation.ts` | CP e CR ainda chegam a `ModulePlaceholderPage`; menu tem dois destinos. Shell e autenticação são reais. |
| iFood | `SystemReconcileSalesChannelOrder` e `SystemUpsertSalesChannelFinancialEvents` em `mutations.gql` | Recebível líquido, bruto e taxa possuem semântica existente; atualizações de repasse não constituem novo recebimento. |
| PDV | `PostSale`, `CancelSale`, `sale_payments`, `cash_movements` | Venda econômica, pagamento e numerário são fatos distintos. Não recriar venda ao receber. |
| Encomendas/Comandas | Migrações `20261118-ec-*`, `ec_receipts`, `ec_refunds`, `ec_sale_receipt_links` | Sinal e parcial já persistem; conclusão conecta recibos à venda. Não lançar novamente ao concluir. |
| Caixa | `cash_sessions`, `cash_movements`, `pos_policies`, `pos_approvals` | Preservar caixa aberto, filial, titularidade e aprovador distinto existentes. |
| Segurança | `ec_actor`, `ec_can`, `ec_branch`, permissões individuais/perfil, sessão por dispositivo | Reutilizar identidade autenticada; negação por ausência de permissão. Não inferir gerente pelo nome. |
| Plataforma | P59 `platform_set_role_permission`, connector `app` | Permissões são habilitadas explicitamente; nenhuma concessão automática na migração. |
| Infraestrutura | Firebase SQL Connect, Cloud SQL PostgreSQL 18, Hosting DEV | Reutilizar; não provisionar serviço, usuário SQL, IAM ou recurso pago novo. |

Versões do lock atual: React 19, TypeScript 6, Vite 8, Firebase 12, CLI de
geração já adotada 15.34.0; execução com Node 22.23.4. O SDK deve ser gerado,
nunca editado à mão.

## Evidência remota e limites

O recibo P59 fornecido por Arthur registra connector `dcb03f1`, frontend
`bb2def3`, publicação concluída em 19/11/2026 e nove contenções preservadas.
Isso é evidência histórica do operador, não uma leitura fresca de DEV em 25/11.
Contagens reais, cortes, contas, saldos, integridade dos vínculos, proteção
recuperável e permissões efetivas deverão ser conferidos antes de ativação.
Nenhum saldo, conta, data de liquidação ou movimento histórico será inferido.

## Referências verificadas

Kit SHA256 `8280a738fdf11d88dda0cb6c283157b16ef34584b1ef64d0421f39e65508a6cc`;
139 arquivos do manifesto conferidos por tamanho e SHA256. Snapshot visual
`71318670ca3799064a8e90d2afe43f511d2dbb55` é referência de apresentação,
não commit do produto. Engenharia backend v3 prevalece sobre o modelo em memória
do protótipo. Decisões de Arthur em `DECISOES.md` prevalecem sobre propostas antigas.
