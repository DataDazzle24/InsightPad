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

## Etapa A da V1 — limites de compatibilidade e fallback

Referência incremental: `85e7fc6c4e4cb7bfbb2684078aebf5bf0730ae97`.
A alteração funcional subsequente limita-se à unidade BRL do CSV financeiro e
à seleção/ordem das linhas exportadas do saldo de estoque. Os valores persistidos
continuam em centavos; contratos, schema, SDKs, fila IndexedDB e política de sessão
não são alterados por essas correções. O harness QA não é um bundle publicável.

Antes de qualquer publicação especificamente autorizada, o manifesto deve ligar
SHA/tree, locks, schema/connector, ambos os SDKs, Functions e Hosting. O inventário
local preservado contém oito gatilhos Data Connect, dois agendamentos e quatro
entradas HTTP/callable. Isto não identifica revisões efetivamente servidas.
`firebase.json` preserva o rewrite `/api/ifood/webhook` → `ifoodWebhook`, região
`southamerica-east1`, `pinTag: true`, antes do fallback SPA `**` → `/index.html`.
A tag liga aquele rewrite à Function; não versiona todo o backend nem substitui
compatibilidade de schema, connector ou outros consumidores.

Fallback exige registrar previamente a versão Hosting anterior, seus bundles e
sua compatibilidade com o backend alvo. Retornar Hosting não reverte SQL,
Functions, filas ou operações já recebidas. Clientes/abas antigos e workers devem
continuar interpretando NULL legado e preservando operationId/payload e recibos;
qualquer incompatibilidade mantém a contenção e exige decisão do responsável.
Não apagar filas para obter aparente compatibilidade. Revisões servidas, drain de
workers, cliente antigo em execução e contratos autenticados são verificações B/C,
sem autorização nesta etapa. Os planos operacionais existentes permanecem válidos.

## Restore — modalidade estática sem ambiguidade de ID/NAME

O executor desta análise não dispõe de gcloud/help verificado. Portanto **nenhuma
linha CLI de restore é aprovada**. Em particular, não usar um backup NAME completo
onde a versão da CLI exige BACKUP_ID ou acrescentar flags ID-only por suposição.
A alternativa preparada é o fluxo Console, com estes pontos de parada explícitos:

1. No projeto/origem previstos no plano03, abrir Cloud SQL → instância de origem
   `insightpad-fdc` → Backups. Selecionar o backup aprovado e conferir origem,
   referência completa, horário e estado `SUCCESSFUL`; não selecionar por posição.
2. Na ação de restauração desse backup, usar exclusivamente a modalidade de
   **nova instância**, com destino `insightpad-dec026-restore` no projeto autorizado.
   Se a interface oferecer apenas restauração em instância existente, parar:
   não selecionar a origem e não improvisar criação ou flags nesta etapa.
3. Antes da futura confirmação operacional, confrontar no resumo os projetos,
   origem/backup e **novo destino**. Exigir verificação de ausência por GET404 real
   conforme o plano; 403/timeout não demonstram ausência. Sem janela, contenção,
   responsável, isolamento e custo especificamente aprovados, não confirmar.
4. Na futura execução autorizada, registrar operationID e targetLink/instância
   exata antes de aguardar. Timeout do cliente não cancela a operação remota;
   consultar seu estado antes de qualquer repetição. Somente o novo destino pode
   receber a restauração; jamais `insightpad-fdc` ou outro alvo existente.

Este roteiro resolve o uso indevido de ID/NAME por exclusão da CLI não verificada.
A disponibilidade da modalidade Console para o backup escolhido continua sendo
ponto de checagem do operador autorizado; esta análise não acessou o Console, não
atestou capacidade remota nem substituiu o ensaio de recuperação do plano03.
