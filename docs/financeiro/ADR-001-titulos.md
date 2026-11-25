# ADR 001 — Evoluir CP/CR existentes (alternativa A)

Estado: escolhido para implementação, após o inventário `BASE_ATUAL.md`.

CP e CR existentes permanecem os títulos físicos e mantêm seus IDs. Uma ponte
tipada `fin_titles` contém exatamente uma FK para CP ou CR, com discriminação
PAY/RECEIVE, tenant, documento, versão e dados complementares. A ponte não guarda
uma segunda cópia independente do principal: a leitura deriva valor original do
título existente e o residual de eventos imutáveis de principal.

Documentos, parcelas, classificação, eventos econômicos, baixas, dinheiro,
observações bancárias e conciliação têm entidades próprias. Novos comandos
escrevem as estruturas na mesma transação e emitem recibo durável. Escritores
legados dos canais precisam ingressar pelo mesmo protocolo de compatibilidade,
sem alterar a integração externa. Lacunas históricas são isoladas, nunca
convertidas em liquidações presumidas.

Alternativa B (novo título canônico com projeções CP/CR) acrescentaria outro
conjunto de principal/estado e sincronização bidirecional sem necessidade atual.
Foi rejeitada para reduzir risco sobre os recebíveis iFood já existentes.

Locks devem seguir uma ordem única compatível com Caixa/EC/PDV. A validação de
concorrência em duas conexões reais e o ensaio de recuperação são requisitos de
ativação, não conclusões deste ADR. Migrações aditivas não apagam estruturas nem
novas transações durante reversão; preferir rollback de código compatível ou
roll-forward. A ativação aguarda reconciliação real e proteção recuperável DEV.
