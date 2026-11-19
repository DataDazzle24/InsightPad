# Publicação coordenada DEV e reversão

Estado: não executada. Sem merge, deploy, migração remota, IAM ou recurso pago novo.
O pedido integrado, seção 10, diz: “não amplia, por si só, permissões remotas além
das autorizações vigentes”. As publicações P52–P57 eram Hosting; esta entrega muda
também schema, SQL nativo e connector. É necessária autorização específica dessa
publicação coordenada antes de executar as mutações remotas abaixo.

## Alvos e ordem

- Projeto e Hosting: `insightpad-dd-dev`.
- SQL Connect: serviço `insightpad`, `southamerica-east1`, schema `main`, connector `app`.
- Configuração declarada no repo: Cloud SQL `insightpad-fdc`, banco `fdcdb`.
  Conferir contra metadados reais antes de conectar: não inferir que o YAML está atualizado.
- Base local: `72f9b629337ae2c0e799863f3ef4ab01c8b71326`.
- Não usar `insightpad-dd` ou `release/production-v1` para qualquer etapa.

O candidato deve ser o SHA aprovado da branch `agent/encomendas-comandas-dev`, com
CI verde nesse SHA e árvore limpa. Não publicar a base histórica acima como candidato.

1. **Preflight somente leitura no Cloud Shell.** Conferir identidade e projeto,
   versões servidas de Hosting/schema/connector, configuração pública de cliente,
   banco e instância reais, acesso SQL por conexão já autorizada e permissões de
   schema/connector/Hosting/backup. Registrar inventários e políticas existentes.
   Repetir as nove contenções vigentes: adaptador iFood desabilitado, schedulers
   reconcile/purge pausados e seis funções HTTP/agenda sem exposição pública indevida.
   Preservar configurações/IAM/etags nominais e rewrite fixado; não “corrigir” acessos
   criando grants ou serviços. A falta de acesso é bloqueio, não autorização implícita.
2. **Proteção de dados.** Registrar backup/snapshot restaurável existente e seu
   estado, compatibilidade das tabelas legadas e contagens/hashes de referência.
   Exportar o DDL atual e versões anteriores. Confirmar janela sem novas escritas
   dos dois módulos durante a migração; não interromper PDV/Cadastros.
3. **Diff oficial de schema.** Com Firebase CLI fixada `15.34.0`, gerar/revisar o
   diff antes de migrar. O delta autorizado é a adição das 17 tabelas `ec_*` e
   índices correspondentes. Qualquer remoção/alteração de tabela legada interrompe
   a publicação. Não usar aceite global de operações destrutivas.
4. **Schema e SQL nativo.** Aplicar o schema aditivo oficial primeiro, sem publicar
   o connector novo ainda. Aplicar os sete SQL abaixo na ordem exata, por uma
   conexão Cloud SQL autenticada e verificada de DEV. O teste isolado usa a mesma
   ordem: schema compilado → DDL nativo → funções → connector. Cada SQL tem transação
   própria e é reexecutável. A camada de reservas só passa a proteger demanda EC
   depois de existirem reservas ativas; preservar as regras legadas fora disso.
5. **Connector.** Publicar somente `app` depois de conferir constraints, funções,
   triggers e versões. Os contratos anteriores conservam assinaturas. Validar
   leitura autorizada/negada antes de disponibilizar rotas e fazer smoke de escrita
   apenas com registros sintéticos no tenant de teste de DEV, nunca em dados reais.
6. **Frontend.** Ler a configuração pública real de DEV; build em modo development,
   manifesto com SHA, checagem de conteúdo e Hosting apenas. Preservar a configuração
   realmente servida, rewrite pinado e headers; não publicar Functions. Verificar
   os bytes servidos descomprimidos, tipos MIME JS/CSS, rotas e `version.json`.
   Não aceitar HTML de fallback como confirmação de um asset JavaScript.
7. **Aceite autenticado.** Executar os casos da matriz em DEV com perfis de consulta,
   operador e gestor, duas filiais, caixa aberto/fechado e aprovação distinta.
   Conferir uma encomenda com sinal, uma comanda compartilhada/transferida/juntada,
   perdas, cancelamento e devolução; confrontar ledger/caixa/estoque/venda/dashboard.
   Repetir contenções e comparar inventários pós-publicação. Só então atualizar
   disponibilidade efetiva na CORE/handoff e emitir recibo final.

## SQL revisável

Após autorização e preflight, numa conexão já verificada de DEV, este trecho
executa somente o SQL versionado. `PGSERVICE`/credenciais devem apontar para a
conexão de DEV validada; não preencher host/usuário por suposição. Não executar
o trecho isoladamente como se ele verificasse a identidade do ambiente.

```bash
set -euo pipefail
test "$(gcloud config get-value project 2>/dev/null)" = insightpad-dd-dev
test -n "${PGSERVICE:?Use o serviço de conexão DEV já conferido no preflight}"
test "$(psql -XAtq -v ON_ERROR_STOP=1 -c 'select current_database()')" = fdcdb
for ec_file in \
  20261118-encomendas-comandas.sql \
  20261118-ec-functions.sql \
  20261118-ec-ledger.sql \
  20261118-ec-allocation-parts.sql \
  20261118-ec-advanced.sql \
  20261118-ec-commands.sql \
  20261118-ec-queries.sql
do
  psql -X -v ON_ERROR_STOP=1 -f "dataconnect/migrations/$ec_file"
done
```

O bloco não faz a migração oficial de schema, publicação do connector, Hosting,
grants, backup ou testes financeiros. Esses passos precisam do recibo de preflight
e das versões reais; não fornecer um “firebase deploy” amplo para substituir o plano.
Nenhuma migração cria permissão de role/usuário: o cadastro das duas páginas não
concede acesso automaticamente. A atribuição deve usar o mecanismo autorizado.

## Reversão que preserva operações

Antes de haver dados EC: retirar exposição das rotas novas e voltar o frontend ao
artefato anterior pode suspender o recurso. Registrar também o connector compatível.
Manter DDL/funções aditivos até análise; não apagar dados nem executar DROP CASCADE.

Depois de haver documentos, recebimentos ou reservas: bloquear novas ações dos
dois módulos por permissões, conservar consulta/histórico e fazer correção em frente.
Manter tabelas, ledger, recibos, links e proteção de reservas em todos os escritores.
Retornar apenas o Hosting não desfaz recebimento, reserva, perda, venda ou devolução.
Nunca remover o trigger compartilhado enquanto houver reserva EC ativa. Uma versão
anterior de connector que omita as reservas só pode ser considerada após conciliação
formal; não ignorar demanda protegida para “liberar” PDV ou canais.

Se um SQL falhar, a transação daquele arquivo reverte. Não publicar connector ou
Hosting após falha parcial; comparar o estado aplicado com os manifests e concluir
ou corrigir a migração de forma revisável. Restauração de backup com perda de escritas
posteriores exige decisão específica, não é reversão automática deste pacote.
