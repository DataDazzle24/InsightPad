# Integração iFood — runbook operacional

## Escopo

Este adaptador atende aplicativos iFood do tipo **Centralizado** e mantém uma
credencial por ambiente. Cada loja (`merchantId`) é vinculada globalmente a uma
única conexão Insight Pad, enquanto empresa e filial são sempre derivadas no
banco. Credenciais e tokens não são aceitos pelo frontend e não são persistidos
nas tabelas operacionais.

## Componentes

- `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET`: versões no Secret Manager.
- `ifoodWebhook`: entrada pública autenticada por HMAC SHA-256, resposta
  `202 Accepted` e tratamento separado do evento de presença `KEEPALIVE`.
- `reconcileIfood`: polling de contingência filtrado pelas lojas autorizadas,
  confirmação em lote dos eventos persistidos e drenagem das filas a cada minuto.
- Triggers Data Connect: acordam o worker quando autorização, sincronização,
  comando ou evento é criado.
- Data Connect Admin SDK: acesso do servidor com identidade IAM dedicada.
- Inbox/outbox PostgreSQL: idempotência, leases, tentativas e auditoria.
- `ifoodCancellationReasons`: função autenticada que consulta no servidor os
  motivos elegíveis do pedido; somente código e descrição voltam à interface.

## Cobertura funcional

| Fluxo | Estado | Observação |
| --- | --- | --- |
| OAuth, validação do `merchantId` e vínculo por filial | Implementado | Credencial centralizada no Secret Manager |
| Webhook assinado, `KEEPALIVE`, polling e acknowledgment | Implementado | Só confirma eventos persistidos ou duplicatas idênticas |
| Recebimento e consulta de pedidos | Implementado | Identidade do pedido e da loja é conferida no servidor |
| Aceite e preparo de restaurante | Implementado | Estado interno só muda após evento oficial |
| Recusa e cancelamento | Implementado | Motivo elegível é consultado no iFood e escolhido pelo usuário |
| Pronto para retirada e despacho | Implementado | Ação depende do responsável pela entrega |
| Vínculo de item já existente, preço e disponibilidade de restaurante | Implementado | Usa os contratos específicos `PATCH /items/price` e `PATCH /items/status` e consulta o lote quando o parceiro devolve `batchId` |
| Publicação inicial e atualização de produto Grocery | Implementado | Item API v1 com `reset=false`; POST no primeiro envio e PATCH nos seguintes |
| Preço, promoção, estoque, categoria e imagem Grocery | Implementado | Derivados do cadastro interno e enviados somente por HTTPS autenticado |
| Separação Grocery | Implementado | Confirmar/iniciar, finalizar, adicionar, substituir, alterar quantidade e remover item |
| Desativação de produto Grocery | Implementado | Remover o vínculo enfileira `active=false` antes de encerrar o acompanhamento |
| Conversão em venda e estoque | Implementado com bloqueios de integridade | A venda só é lançada após confirmação e com produtos e pagamentos reconciliados |
| Produtos compostos/combos | Implementado | A reserva e a baixa usam um snapshot imutável dos componentes existente no aceite |
| Preço exclusivo do iFood | Implementado | O vínculo pode acompanhar o cadastro ou manter preço promocional/base específico do canal |
| Pagamentos, descontos e subsídio iFood | Implementado | Separa valor online, valor na entrega, desconto do lojista e subsídio do parceiro |
| Taxas e repasse financeiro | Implementado quando o módulo do parceiro fornece os eventos | A classificação é explícita; descrições livres não são interpretadas como taxa |
| Alerta de novo pedido | Implementado | Aviso visual, som, notificação do navegador e confirmação durável por usuário/versão |

Restaurante e Mercado permanecem em fluxos separados. Um produto Grocery é
identificado por EAN ou código de balança; um item Restaurant é identificado
pelo UUID do item no Catálogo v2. Nenhum caminho Grocery usa endpoints de
restaurante e o reset global de catálogo permanece permanentemente desativado.

## Configuração no portal iFood

No aplicativo homologado, configure o webhook para:

`https://insightpad-dd-dev.web.app/api/ifood/webhook`

O webhook deve permanecer desativado até que a versão correta do novo segredo
esteja publicada em DEV. Depois da ativação, confirme no módulo **Canais de
venda > Operações** que os eventos chegam como `ACKNOWLEDGED`.

## Ativação de uma loja

1. Em **Canais de venda > Gestão de conexões**, crie uma conexão iFood ligada à
   filial correta.
2. Informe o `merchantId` em **ID oficial da loja**. Se a credencial tiver uma
   única loja, o adaptador também consegue identificá-la automaticamente.
3. Clique em **Autorizar**. O navegador apenas grava o pedido; a validação OAuth
   e a prova de acesso à loja ocorrem no servidor.
4. Acompanhe **Diagnóstico** e **Operações** até a conexão ficar `AUTHORIZED` e
   `ACTIVE`.
5. Em uma loja **Restaurant**, vincule o produto usando o UUID oficial de um
   item já existente no catálogo iFood.
6. Em uma loja **Grocery**, cadastre nome, preço, categoria e um EAN ou código
   de balança. A imagem é opcional, mas, quando informada, precisa ser uma URL
   pública HTTPS. Ao preparar o vínculo, o identificador é derivado do cadastro
   e não pode ser digitado livremente no modal de canais.
7. Execute **Publicar**. O primeiro envio usa POST da Item API com
   `reset=false`; os próximos usam PATCH e somente os campos acompanhados.
8. Confira o resultado em **Operações**. HTTP `202` sem confirmação posterior
   significa somente **Recebido pelo iFood**. Quando o parceiro fornece
   `batchId`, o adaptador consulta o lote e só mostra **Confirmado no iFood**
   depois da conclusão sem falhas de item.

## Operação de pedidos Grocery

1. Em **Pedidos integrados**, use **Iniciar separação**. O adaptador confirma o
   pedido e aciona `startSeparation` pela Picking API.
2. Nos detalhes do pedido, altere a quantidade, substitua ou remova um item. O
   botão **Adicionar item à separação** exige EAN/código de balança e quantidade.
3. Cada alteração é validada contra o item do próprio pedido, gravada na outbox
   e enviada pelo worker. A resposta síncrona `204` libera a próxima ação.
4. Use **Finalizar separação** somente após concluir as conferências. O pedido
   permanece em acompanhamento até os eventos posteriores do iFood concluírem
   o ciclo logístico.
5. Pedidos antigos sem `uniqueId` ficam somente para consulta; isso evita usar
   um SKU no lugar do identificador único da instância na sacola.

## Segurança

- Nunca copie segredo ou token para campos do sistema, logs, commits ou tickets.
- Rotacione imediatamente qualquer segredo exibido em captura de tela.
- A conta de serviço do adaptador recebe somente Data Connect Data Admin,
  escrita de logs, recebimento de eventos e acesso às duas versões de segredo.
- Eventos maiores que 256 KiB e webhooks sem assinatura válida são recusados.
- Respostas de negócio maiores que 2 MiB, respostas OAuth maiores que 64 KiB e
  conteúdo com UTF-8 inválido são interrompidos antes do processamento.
- Payloads brutos expiram; os metadados de auditoria permanecem.
- Uma loja iFood ativa não pode ser conectada a duas empresas Insight Pad.
- As funções autenticadas aceitam `ENFORCE_APP_CHECK=true` por ambiente. Só
  habilite a exigência depois de registrar e validar todos os clientes web no
  Firebase App Check; ativar antes disso bloquearia usuários legítimos.

## Release de produção

Produção possui configuração própria e deliberadamente separada de DEV:

- `.firebaserc.production` aponta exclusivamente para `insightpad-dd`;
- `firebase.production.json` fixa Data Connect, Functions Node 22, Hosting,
  rewrite do webhook, cache do shell e cabeçalhos de segurança;
- `frontend/.env.production.example` exige o aplicativo web e a chave pública
  do reCAPTCHA Enterprise registrados em produção;
- `functions/.env.insightpad-dd.example` exige a conta de serviço dedicada e
  `ENFORCE_APP_CHECK=true`.

Antes de qualquer promoção, copie os exemplos para os arquivos locais ignorados
pelo Git, preencha somente valores públicos no frontend e mantenha segredos no
Secret Manager. Execute `scripts/validate-ifood-production.sh` na branch
`release/production-v1`. O script é apenas um gate local: recusa configuração
DEV, runtime incorreto, árvore suja ou App Check ausente; executa todas as
suítes e o build de produção, mas não migra nem publica nada.

Depois do gate local, ainda são obrigatórios: revisão humana do diff SQL
aditivo, conferência de IAM/segredos, registro e enforcement do App Check no
console, criação das políticas de alerta abaixo e autorização explícita para o
deploy.

## Monitoramento e alertas

O scheduler registra a cada ciclo um `cycleId` e, a cada cinco minutos, um
snapshot agregado sem dados pessoais com `metricType=IFOOD_RECONCILIATION`.
Crie métricas baseadas em logs no Cloud Monitoring e alerte quando:

| Campo/filtro | Limite inicial | Ação |
| --- | ---: | --- |
| `metricType=IFOOD_RECONCILIATION_FAILURE` | 1 ocorrência | Investigar falha do ciclo e disponibilidade do parceiro |
| `unhealthyConnections` | maior que 0 por 10 min | Verificar OAuth, loja suspensa e última requisição |
| `eventBacklog` ou `commandBacklog` | maior que 0 por 10 min | Verificar leases, retries e latência do worker |
| `eventErrors`, `commandErrors` ou `syncErrors` | maior que 0 | Abrir **Histórico e problemas** e corrigir a causa antes de reenfileirar |
| `catalogReceiptsToVerify` | maior que 0 por 15 min | Confirmar o lote no iFood e não prometer publicação ao cliente |
| `commerceBlocked` | maior que 0 | Corrigir vínculo, pagamento ou caixa; não lançar venda parcial |
| `financialPending` | maior que 0 por 24 h | Executar conciliação e conferir taxa/repasse |

Mantenha também alertas nativos para erros de Functions, p95 do webhook acima
de 1 segundo, p99 acima de 1,8 segundo, instâncias no limite, falhas do
Scheduler e uso anormal de Secret Manager. Os limites devem ser recalibrados
depois das primeiras quatro semanas de operação, preservando o objetivo do
webhook responder `202` em menos de dois segundos.

## Validação mínima

1. Token OAuth criado sem erro no diagnóstico.
2. Loja autorizada e vinculada à filial correta.
3. Evento de pedido de teste recebido uma única vez.
4. Pedido e itens visíveis na fila de canais.
5. Aceite confirmado no iFood e no histórico interno.
6. Cancelamento usa um motivo elegível consultado no próprio pedido.
7. Pedido com entrega própria usa `dispatch`; entrega iFood e retirada usam
   `readyToPickup`.
8. `KEEPALIVE` válido recebe `202` sem criar pedido ou evento operacional.
9. Produto Grocery de teste aceito pela Item API com `reset=false`, preço,
   estoque, categoria e imagem opcional corretos.
10. Alteração de quantidade, substituição, remoção e adição de item confirmadas
    pela Picking API antes de finalizar a separação.
11. Remover um vínculo Grocery cria o comando de desativação do produto.
12. Nenhum token, segredo ou payload bruto aparece no navegador.
13. Um pedido sem produto vinculado permanece bloqueado e não gera venda nem
    movimentação parcial de estoque.
14. Um combo reserva e baixa exatamente os componentes existentes no instante
    do aceite, mesmo que a composição seja editada depois.
15. Pagamento ausente, moeda divergente ou soma incompatível bloqueia a venda
    para reconciliação, sem inventar uma forma de pagamento.
16. Desconto financiado pelo iFood não reduz a receita do lojista; desconto do
    estabelecimento reduz. Taxas só entram depois da conciliação financeira.
17. A mesma versão de um pedido alerta uma vez por usuário; uma atualização
    relevante do pedido torna o alerta visível novamente.
18. Horários que se sobrepõem, inclusive atravessando a meia-noite, são
    recusados antes de chegar ao parceiro.
19. Eventos operacionais repetidos não recriam a venda nem movimentam o estoque
    novamente; somente alteração efetiva de itens, valores ou pagamentos gera
    uma revisão comercial idempotente.

O EAN/código de balança não pode ser trocado enquanto houver vínculo Grocery
ativo. Remova primeiro o vínculo, aguarde a confirmação de `active=false`,
altere o identificador no cadastro e crie uma nova publicação. Esse fluxo evita
deixar o item antigo vendável no parceiro.

## Alteração de banco desta versão

Antes do deploy do Data Connect em DEV, `dataconnect:sql:diff` deve listar
somente alterações aditivas. Além das colunas de catálogo de versões anteriores
que ainda não existirem no ambiente, esta entrega adiciona:

- em `sales_channel_orders`: `payment_integrity_status`, `attention_type`,
  `attention_deadline_at`, `attention_data` e `commerce_source_hash`;
- em `sales_channel_order_items`: `stock_snapshot`;
- em `sales_channel_financial_entries`: `classification`;
- em `sales_channel_sync_jobs`: `checkpoint`;
- em `sales_channel_product_mappings`: identificador da operação, estado e
  prazos da confirmação assíncrona;
- em `accounts_receivable`: origem, referência externa, idempotência, valor
  bruto e taxa do parceiro;
- em `sales_channel_order_alert_acknowledgments`: confirmações independentes
  de recebimento e de início do preparo;
- índices compostos nas filas, pedidos, vínculos, reservas, conexões e eventos
  financeiros usados pelos workers e pelas telas operacionais.

Não execute uma migração `exact` se o diff trouxer remoção, truncamento ou
alteração destrutiva. O procedimento versionado em
`scripts/deploy-ifood-dev.sh` calcula o SHA-256 do diff SQL completo e só migra
quando o operador revisa esse conteúdo, informa o hash exato e confirma
literalmente `MIGRAR`. Isso evita que uma coluna inesperada seja aceita apenas
por coincidir com uma lista parcial.

Depois da migração compatível, gere novamente os dois SDKs do Data Connect e
publique Data Connect, Functions e Hosting na mesma janela. O Hosting possui
`pinTag` no webhook; por isso, Functions e Hosting precisam ser publicados
juntos para o endpoint apontar para a revisão nova.

## Resposta a incidentes

Em caso de suspeita de vazamento: desative o webhook no portal iFood, rotacione
o `clientSecret`, publique a nova versão do segredo, revise os logs por IDs de
requisição e só então reative o webhook. Não apague inbox, comandos ou histórico;
esses registros são necessários para reconciliação e auditoria.
