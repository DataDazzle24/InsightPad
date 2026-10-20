# Reavaliação do desenvolvedor — fonte recuperada

Esta análise compara a fonte recuperada `80f21c6` ao baseline `8f4bc91` e ao candidato reconciliado. Não é parecer independente de AG-03/AG-04, nem avaliação da implantação ativa. Os achados originais permanecem na CORE para decisão dos responsáveis.

| Achado | Evidência nesta fonte e pendência |
| --- | --- |
| SEC-2026-001 — escopo de filial | PostSale/SalesWorkspace incluem user_branches; testes SQL de negação por filial existem na fonte. StockWorkspace ainda exige revisão de escopo e guardas. Não encerrado globalmente. |
| SEC-2026-002 — revogação | PostSale recuperado verifica usuário, tenant, perfil e bloqueio. Novo teste executa SQL real com controle positivo e sete revogações: usuário inativo/excluído/bloqueado, tenant inativo/excluído e perfil inativo/excluído. ClaimDeviceSession/GetCurrentUser/Access ainda precisam de revisão específica. Resultado restrito ao PostSale. |
| SEC-2026-003 — sessão exclusiva | PostSale/SalesWorkspace não exigem prova de sessão de dispositivo; polling do cliente não substitui imposição no servidor. Permanece aberto. |
| SEC-2026-004 — vínculo merchant/tenant iFood | worker de negócio não mudou entre baseline e fonte recuperada. Ausência de prova de titularidade junto ao provedor permanece pendente; negar simples alteração de merchant não encerra esse risco. |
| SEC-2026-005 — senha legada | Auth_GS.js permanece inalterado; uso ativo do legado precisa de comprovação. Não atribuir esse achado ao Firebase Auth. |
| SEC-2026-006 — Vite | Candidato fixa Vite 8.2.4 nos locks frontend/functions. Fonte continha 8.2.1 e 8.2.2. Revisar aplicabilidade do GHSA-9jrq-w75r-8gcw; não inferir exploração na SPA publicada. |
| DES-2026-001 — caixa/atomicidade | Fonte inclui operações e testes SQL de venda, troco líquido e rollback; caixa individual preservado. Evidência local não comprova revisão ativa do backend. |
| DES-2026-002 — repetição/sincronização | Fonte inclui idempotência e fila persistente; testes de replay/fila executados. Validar o contrato no backend antes de eventual publicação. |
| DES-2026-003 — correção de venda | Fonte encaminha correção à transação durável e testa rollback. Código de negócio mantido. Parecer funcional independente pendente. |

## Correção dos próprios testes financeiros

Dois testes recuperados calculavam o filtro como dia UTC de JavaScript, mas o SQL calcula o dia na timezone do tenant (padrão America/Sao_Paulo). Entre 00h e 03h UTC, os registros de `now()` ficam no dia anterior do tenant e os testes retornavam zero. O candidato obtém a data da mesma timezone do tenant dentro da transação PGlite. Somente as duas linhas de fixture foram corrigidas; consultas e expectativas financeiras não mudaram. Antes da correção: 143/145 testes Functions passavam; após a correção e oito testes de revogação adicionais: 153/153 passaram.

## Limites

PGlite executa as consultas SQL reais sobre fixture local, sem reproduzir integralmente auth/Data Connect/índices/constraints do serviço. Nenhuma verificação local substitui QA em navegador, teste de contratos com a revisão ativa ou revisão independente de segurança. O workflow usa token contents:read, ações fixadas por SHA e não contém deploy, OIDC ou secrets de publicação. AG-03 deve verificar também a configuração pública obtida pela rede, a toolchain das ações e a compatibilidade do modal com os diálogos legados.
