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
| Vínculo de item já existente, preço e disponibilidade de restaurante | Implementado | Usa `PATCH /catalog/v2.0/merchants/{merchantId}/items/{itemId}`; rotas depreciadas não são usadas |
| Publicação inicial e atualização de produto Grocery | Implementado | Item API v1 com `reset=false`; POST no primeiro envio e PATCH nos seguintes |
| Preço, promoção, estoque, categoria e imagem Grocery | Implementado | Derivados do cadastro interno e enviados somente por HTTPS autenticado |
| Separação Grocery | Implementado | Confirmar/iniciar, finalizar, adicionar, substituir, alterar quantidade e remover item |
| Desativação de produto Grocery | Implementado | Remover o vínculo enfileira `active=false` antes de encerrar o acompanhamento |

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
8. Confira o resultado em **Operações**. HTTP `202` significa que a ingestão foi
   aceita pelo iFood; a interface mostra esse estado como **Aceito pelo iFood**.

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
- Payloads brutos expiram; os metadados de auditoria permanecem.
- Uma loja iFood ativa não pode ser conectada a duas empresas Insight Pad.

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

O EAN/código de balança não pode ser trocado enquanto houver vínculo Grocery
ativo. Remova primeiro o vínculo, aguarde a confirmação de `active=false`,
altere o identificador no cadastro e crie uma nova publicação. Esse fluxo evita
deixar o item antigo vendável no parceiro.

## Alteração de banco desta versão

Antes do deploy do Data Connect em DEV, `dataconnect:sql:diff` deve listar
somente alterações aditivas já aprovadas (o diff pode conter apenas as que ainda
não existem no ambiente):

- `sales_channel_connections.catalog_profile varchar(32) NOT NULL DEFAULT 'UNVERIFIED'`;
- `sales_channel_orders.partner_event_at timestamptz NULL`;
- `sales_channel_sync_jobs.cursor uuid NULL`;
- `products.image_url varchar(1000) NULL`;
- `products.scale_code varchar(32) NULL`.

Não execute uma migração `exact` se o diff trouxer remoção ou alteração
destrutiva. Depois da migração compatível, gere novamente os dois SDKs do Data
Connect e publique Data Connect, Functions e Hosting na mesma janela. O Hosting
possui `pinTag` no webhook; por isso, Functions e Hosting precisam ser
publicados juntos para o endpoint apontar para a revisão nova.

O procedimento completo e protegido está versionado em
`scripts/deploy-ifood-dev.sh`. Ele aceita somente branch `agent/*`, projeto
`insightpad-dd-dev`, árvore Git limpa, Node 22, conta de serviço dedicada e
somente o subconjunto das cinco alterações SQL acima. A migração exige a
confirmação literal `MIGRAR`.

## Resposta a incidentes

Em caso de suspeita de vazamento: desative o webhook no portal iFood, rotacione
o `clientSecret`, publique a nova versão do segredo, revise os logs por IDs de
requisição e só então reative o webhook. Não apague inbox, comandos ou histórico;
esses registros são necessários para reconciliação e auditoria.
