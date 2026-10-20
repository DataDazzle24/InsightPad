# Compatibilidade com a fonte recuperada de DEV

A fonte de referência é `80f21c65a0ed3e07b0f9c29bebd07d2479b0735b`, conforme DEC-017. Reproduzir seu frontend não identifica revisões de Functions/Data Connect/schema publicadas.

| Capacidade/contrato | Evidência preservada no candidato |
| --- | --- |
| Políticas de preço, desconto e aprovação do PDV | PointOfSalePage, serviço POS, operações PostSale e guardas de aprovação mantidos byte a byte |
| Caixa individual e precisão monetária | Fluxos de abertura/fechamento e validações recuperadas mantidos |
| Venda, troco, estoque e correção atômica | SQL, schema e SDKs recuperados mantidos; testes PGlite reais da fonte executados |
| Sincronização durável, idempotência e reconciliação | Fila IndexedDB, normalização do recibo e serviços recuperados mantidos; testes da fila executados |
| Leituras por código, busca mista e campos controlados | Componentes, máscaras e correções recuperadas mantidos |
| Temas/contraste e cache de SPA | Todas as regras CSS recuperadas, exceto duas regras específicas do modal substituído, são preservadas; regras PDV permanecem |
| Firebase e ambiente de build | Guardas recuperadas mantidas; CI obtém apenas configuração pública do projeto DEV, valida projectId/authDomain e registra fingerprint sem valores |
| Dependências corrigidas na fonte | grpc-js 1.13.6 e brace-expansion 5.0.12 mantidos; Vite atualizado para 8.2.4 nos dois locks |

`scripts/verify-reconciliation.mjs` verifica ancestralidade e lista explícita de caminhos permitidos. Alterar páginas/serviços de negócio, operações, schema, SDKs, cache ou o hook legado faz o CI falhar. O CSS compartilhado recebe verificação adicional de retenção das regras originais. Esses controles não substituem testes funcionais nem comprovam compatibilidade com o backend ativo, cujas revisões imutáveis continuam pendentes de consulta autenticada.

Publicar somente Hosting também exigirá o parecer de compatibilidade: o novo bundle depende dos contratos recuperados de PDV, aprovação e caixa. Não há liberação de publicação neste PR. Nenhuma operação de deploy, migração, regeneração de SDK ou mudança de backend foi executada.

Inventário anterior de DEV: Hosting com identificador abreviado e 14 Functions v2 Node 22 em southamerica-east1; Data Connect serviço insightpad, connector app. Os IDs completos de Hosting, revisões de Functions, revisão do connector/schema e vínculo com commit continuam sem comprovação suficiente. Esses dados anteriores não são apresentados como nova verificação nesta etapa.
