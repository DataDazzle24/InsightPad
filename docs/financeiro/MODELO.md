# Modelo e contratos

A estrutura física segue a [ADR 001](ADR-001-titulos.md). Os nomes T01–T42
correspondem à engenharia recebida. Uma linha lógica pode ser representada
por estrutura existente, tabela própria ou consulta derivada.

| Referência | Estrutura física | Regra ou limite |
| --- | --- | --- |
| T01 | `financial_accounts`, `fin_account_cuts` | Conta e saldo de abertura comprovado. BRL e corte no fim do dia. |
| T02 | `fin_account_grants` | Usuário e filial, direitos de lançar, conciliar e ver saldo global independentes. |
| T03–T05 | `financial_categories`, `fin_category_details`, `fin_centers`, `fin_dre_maps`, `fin_dre_map_lines` | Categorias e centros separados. Mapa gerencial imutável com categorias de origem capturadas na publicação. |
| T06 | `customers`, `suppliers`, `users` | Referências tipadas por empresa, sem novo cadastro paralelo. |
| T07 | `payment_methods`, `fin_terms` | Condições cadastráveis. Parcelas usam âncora e periodicidade. |
| T08–T10 | `fin_documents`, `accounts_payable`, `accounts_receivable`, `fin_titles`, `fin_title_changes` | Um título original, referência tipada e alterações versionadas. |
| T11–T12 | `fin_classifications`, `fin_title_capacities`, `fin_principal_dimensions` | Rateios preservam ambas as margens. Classificações anteriores mantidas. |
| T13–T14 | `fin_economic_events`, `fin_sale_economics`, calendário de `fin_titles` | Competência separada de vencimento e efeito no caixa. Venda derivada da origem. |
| T15–T18 | `fin_settlements`, `fin_allocations`, `fin_principal_events` | Baixa aloca principal e ajustes. Perda/recuperação ficam em eventos próprios. |
| T19–T21 | `fin_journals`, `fin_journal_lines` | Débito e crédito fecham exatamente. Conta real ou código técnico. |
| T22–T23 | `fin_transfers`, `fin_reversals`, `fin_external_refunds` | Transferência e tarifa. Estorno contábil separado de devolução já realizada. |
| T24–T25 | `fin_import_batches`, `fin_bank_transactions` | Hash, identificação e possíveis duplicatas. Observação não cria dinheiro. |
| T26–T28 | `fin_matches`, `fin_match_edges`, `fin_unmatches` | Capacidade e sinal por linha. Desvínculo e estorno são decisões separadas. |
| T29–T30 | `fin_recurrences`, `fin_recurrence_versions`, `fin_occurrences` | Chave de ocorrência única. Simulação derivada da agenda e dos títulos. |
| T31 | `fin_credit_policies`, `fin_credit_authorizations`, `fin_title_state` | Exposição calculada sob lock. Limite e motivo de autorização distintos. |
| T32–T33 | `fin_agreements`, `fin_agreement_sources`, `fin_contacts` | Renegociação substitui dívida e contato pode ajustar previsão. |
| T34–T35 | `fin_period_guards`, `fin_closures` | Fechamento versionado e reabertura sem apagar fotografia. |
| T36 | `fin_operations`, `fin_operation_abandonments` | Intenção congelada, recibo terminal, cancelamento com guarda contra preparo tardio. |
| T37 | Identidade e permissões existentes, `fin_credit_authorizations` | Autorização de gestor registrada. As aprovações operacionais do Caixa continuam nas rotas de origem. |
| T38 | `audit_logs`, eventos de domínio | Ação, ator, referência e efeito auditado. |
| T39 | `fin_attachments` | Tabela prevista. A operação bloqueia até existir fluxo privado configurado e validado. |
| T40 | Geração explícita e idempotente de recorrência | Não existe job externo ou outbox publicado neste candidato. |
| T41 | `fin_origin_accounts`, `fin_legacy_title_inventory`, `fin_migration_issues` | Mapeamento com corte. Inventário e adoção verificada de títulos manuais elegíveis. |
| T42 | `fin_account_cuts`, `financial_accounts` | Posição de abertura registrada antes de habilitar lançamentos. |

Contagem de caixa e sócios usam `fin_cash_counts`, `fin_owner_movements`
e `fin_owner_natures`. Meio e condição de pagamento têm contratos separados.

`FinancialPrepare` admite intenção autenticada e retorna sua referência.
`FinancialExecute` revalida sessão, permissão, recursos, período e versão,
grava resultado e efeitos na mesma transação e permite consultar ou repetir
com a mesma identidade. `FinancialRead` fornece consultas com recorte de
empresa e filial e verifica `canExport` para exportações. Veja os acionadores
e as consultas em [mapa-integracao.tsv](mapa-integracao.tsv).

Centavos via wire são strings inteiras. O banco usa bigint para valores
individuais e numeric nos cálculos intermediários. Liquidação do principal
não equivale ao movimento financeiro. Abertura, vencimento, competência,
previsão, liquidação e dia da sessão têm funções distintas no domínio.
