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
| Vínculo de item já existente, preço e disponibilidade de restaurante | Implementado | Processamento paginado, concorrência limitada e checkpoint |
| Publicação inicial de item Grocery | Bloqueado | Requer o contrato oficial completo da Item API |
| Separação Grocery (iniciar, editar e finalizar) | Bloqueado | Requer o contrato oficial completo do módulo de separação |
| Quantidade de estoque Grocery, promoções e conciliação | Não implementado | Fora do contrato atualmente validado |

Os caminhos bloqueados são recusados antes de chamar endpoints de restaurante.
Isso evita enviar uma operação válida para o módulo errado e mantém o estado
interno coerente com o estado oficial do parceiro.

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
5. Vincule produtos usando o identificador oficial do item no catálogo iFood e
   habilite preço e/ou disponibilidade conforme a estratégia da loja. Esta etapa
   atende, por enquanto, apenas o catálogo de restaurante.
6. Execute **Sincronizar** e confira o resultado por produto antes de abrir a
   loja para pedidos reais.

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
9. Preço e disponibilidade de um produto de teste sincronizados.
10. Nenhum token, segredo ou payload bruto aparece no navegador.

## Alteração de banco desta versão

Antes do deploy do Data Connect em DEV, `dataconnect:sql:diff` deve listar
somente alterações aditivas:

- `sales_channel_connections.catalog_profile varchar(32) NOT NULL DEFAULT 'UNVERIFIED'`;
- `sales_channel_orders.partner_event_at timestamptz NULL`;
- `sales_channel_sync_jobs.cursor uuid NULL`.

Não execute uma migração `exact` se o diff trouxer remoção ou alteração
destrutiva. Depois da migração compatível, gere novamente os dois SDKs do Data
Connect e publique Data Connect, Functions e Hosting na mesma janela. O Hosting
possui `pinTag` no webhook; por isso, Functions e Hosting precisam ser
publicados juntos para o endpoint apontar para a revisão nova.

O procedimento completo e protegido está versionado em
`scripts/deploy-ifood-dev.sh`. Ele aceita somente branch `agent/*`, projeto
`insightpad-dd-dev`, árvore Git limpa, Node 22, conta de serviço dedicada e as
três alterações SQL acima. A migração exige a confirmação literal `MIGRAR`.

## Resposta a incidentes

Em caso de suspeita de vazamento: desative o webhook no portal iFood, rotacione
o `clientSecret`, publique a nova versão do segredo, revise os logs por IDs de
requisição e só então reative o webhook. Não apague inbox, comandos ou histórico;
esses registros são necessários para reconciliação e auditoria.
