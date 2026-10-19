# DEV publicado versus candidato combinado

Consulta de 19/10/2026 ao projeto `insightpad-dd-dev`. Escopo: recursos públicos do Hosting, catálogo autenticado de Data Connect consultado anteriormente e código do candidato. Não houve chamadas de negócio, recuperação real, alteração de dados ou deploy.

## Origem comprovada e lacuna de proveniência

O HTML de `https://insightpad-dd-dev.web.app/login` referencia `/assets/index-Dwd69zCm.js`, que referencia o chunk de PDV abaixo. Essas são evidências dos bytes servidos, não de um commit de origem.

| Recurso publicado | Bytes | SHA-256 |
| --- | ---: | --- |
| HTML `/login` | — | `a66bde68563728cd4aa1e7d80cdb74b6d9d28c69bb9fa5159f897d2790d0cdf7` |
| `index-Dwd69zCm.js` | 131754 | `d2a6037f13f20ccb177aa6ab403c19fd5033010de553306a67e44b1660754a39` |
| `PointOfSalePage-CjBve5dy.js` | 47573 | `9297e443278892cd2d7e6409a95022ba715e65730463e39fad4c3c19c3f0bf53` |

Não há `sourceMappingURL` nesses dois scripts nem SHA de build comprovado. A busca nas 39 revisões distintas das 41 branches atuais do GitHub não encontrou `PosPolicy`, `PosApproval` ou `RequestPosSaleApproval` nos arquivos de PDV/schema consultados. Após recuperar o histórico completo alcançável dessas referências (406 commits), a busca por alterações contendo `RequestPosCashApproval`, `SearchPosProducts`, `PosPolicy` ou `PosApproval` em todos os caminhos também não retornou ocorrências. Isso não exclui objetos sem referência, outras origens ou alterações em ambiente de desenvolvimento. O Codespace existente aparece na branch `agent/ifood-ui-polish`; sua listagem não prova o HEAD, conteúdo ou origem do Hosting. Não se iniciou computação nova para inspecioná-lo. A origem Git exata permanece sem comprovação. A baseline aprovada não deve ser rotulada como versão publicada.

## Comparação funcional e de contratos

| Capacidade | Publicado em DEV (evidência estática) | Candidato baseado na DEC-011 | Consequência |
| --- | --- | --- | --- |
| Política do PDV | `PosPolicy`, `UpdatePosPolicy`, limites de desconto/acréscimo, retirada e diferença de fechamento; obrigatoriedade de sessão | Sem política/contrato correspondente | Hosting substituiria controles e configuração existentes |
| Aprovação de venda | `RequestPosSaleApproval`, `PendingPosApprovals`, `ApprovePosSale`, `PosSaleApprovalStatus`; fila com pendência, rejeição/expiração e aprovação antes de postar | Checkout chama `PostSale` diretamente online; sem fluxo de aprovação | Perda funcional e risco de incompatibilidade com regras do backend |
| Aprovação de caixa | `RequestPosCashApproval`, `PosCashApprovalStatus`; retirada/fechamento acima da política exigem aprovação | Sem caminho equivalente | Não preserva controle por papel/limite |
| Idempotência de caixa | Chamadas `CloseCashSession` e `RegisterCashMovement` incluem `operationId`; payload preservado durante aprovação | Chamadas existentes não incluem `operationId` | Mesmo nome de operação não comprova contrato compatível |
| Fila de vendas | Publicado persiste antes de postar, marca aprovação pendente e consulta status; trava por tenant/usuário | Caminho online direto e fila offline, sem status de aprovação | Não preserva estados nem ordenação de envio |
| Busca no PDV | `SearchPosProducts`, `SearchPosCustomers`, `PosProductBranches` | Sem essas operações geradas | Estratégia de consulta diverge |

O catálogo consultado expõe 53 objetos (incluindo `PosPolicy` e `PosApproval`) e 143 operações, contra 51 objetos/133 operações na baseline. As dez operações adicionais são seis consultas (`SearchPosProducts`, `SearchPosCustomers`, `PosProductBranches`, `PendingPosApprovals`, `PosSaleApprovalStatus`, `PosCashApprovalStatus`) e quatro mutações (`UpdatePosPolicy`, `RequestPosSaleApproval`, `ApprovePosSale`, `RequestPosCashApproval`). A presença dos nomes restantes não comprova igualdade de documentos, parâmetros, autorização ou comportamento.

Essa análise confirma capacidades do cliente publicado e chamadas observáveis no código, não o enforcement do backend. IDs imutáveis de releases de Hosting/Functions/Data Connect, hash integral do schema ativo, documentos efetivos e correspondência com código-fonte continuam pendentes. A consulta ao GCP encontrou indisponibilidade de página; não substituir essa lacuna por uma inferência de versão.

## Parecer do desenvolvedor

**O candidato combinado é revisável, mas não preserva as capacidades publicadas de PDV e não está apto a deploy, inclusive somente Hosting.** CI verde valida o candidato, não essa compatibilidade. Não se transplantou código de negócio minificado nem se ampliou o escopo aprovado para reconstruir o PDV.

Próximo responsável: desenvolvedor/CTO devem recuperar a origem exata e um snapshot verificável dos contratos efetivos; AG-03 deve revisar compatibilidade e autorização; AG-04 deve validar o modal em navegador real com Auth mockado. O CTO decide a reconciliação da baseline e a liberação por componente após os pareceres na CORE. Nenhum merge em base ou deploy está autorizado por este documento.
