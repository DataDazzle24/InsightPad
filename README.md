# P58 — publicação coordenada de Encomendas e Comandas em DEV

Candidato imutável: `bb2def3336171b440df8038c4112abd9f05b7172`, branch
`agent/encomendas-comandas-dev`, PR29. CI aprovado:44444333875/job135292677985,
29 etapas. Base:72f9b629337ae2c0e799863f3ef4ab01c8b71326/P57. A publicação foi
autorizada pelo pedido do bloco de publicação nesta conversa, após apresentação
do plano de schema/SQL/connector/Hosting. O pacote operacional fica em branch
separada; não muda o candidato testado, não faz merge e não publica PROD.

Executar somente no Cloud Shell de Arthur, projeto ativo `insightpad-dd-dev`,
operador `datadazzletecnologia@gmail.com`. O bootstrap confere hashes e usa Node22
existente. Instala29MiB de tooling isolado em /tmp por lockfile, sem scripts npm.
Não instala dependências globais nem exige instalação no computador do usuário.
Ferramentas de publicação: Cloud SQL Connector1.10.0, Google Auth10.6.2, pg8.16.3
e parser PostgreSQL WASM18.2.4; não são dependências do produto.

## Ordem executada

1. Reconfirma o CI congelado, conta/projeto, permissões oficiais, release P57,
   configuração pública real e as nove contenções iFood. Não espera um CI novo.
2. Confere instância/serviço reais, usuário IAM SQL já existente, role proprietária
   existente e propriedade das tabelas de guardas. Exige backup SUCCESSFUL de até
   24h e PITR existentes. Nenhum usuário, senha, grant, backup ou recurso é criado.
   A confirmação é por metadados; não é um ensaio de restauração.
3. Faz checkout isolado do SHA e build normal development com a configuração real.
   Reutiliza node_modules somente com manifests/lockfile iguais; senão npm ci.
   Mede espaço e mantém os limites de100 arquivos,10MiB brutos e5MiB de gzip único.
4. Consulta o diff oficial pela API de validação de schema, a mesma utilizada pela
   CLI Firebase15.34.0. Usa COMPATIBLE para conservar os objetos SQL nativos.
   O parser real PostgreSQL aceita somente CREATE das17 tabelas novas, índices e
   ADD de coluna/constraint nessas tabelas. Refusa DML, DROP, transações embutidas,
   mudança de tipo, relação legada ou outro schema. Não usa --force.
5. Aplica esse DDL em transação, seguido dos sete SQL versionados, cada arquivo em
   transação própria sob a role existente. As transações externas BEGIN/COMMIT dos
   arquivos são substituídas por uma única transação da conexão, com lock e prazos.
   Compara estrutura legada e roles/memberships/default ACLs; verifica privilégios
   herdados do usuário SQL existente do Data Connect. Sem concessões automáticas.
6. Valida novamente e publica apenas schema main e connector app pelas APIs
   oficiais. Preserva datasource/instância/banco. Não usa o setup da CLI que poderia
   criar usuários/grants. A leitura administrativa do catálogo e a recusa de EcRead
   sem usuário são conferidas antes do Hosting. Isso não é smoke Firebase de operador.
7. Publica o build normal no Hosting via transporte revisado de P57. Conserva o
   rewrite/tag, headers e configuração efetivamente servidos. Verifica inventário,
   hashes de gzip, arquivos Firebase reservados, todos os bytes públicos, MIME de
   JS/CSS, version.json e12 entradas HTTP. Reconfere backend, IAM/etags e contenções.

O uso direto da API oficial evita efeitos auxiliares de `dataconnect:sql:migrate`
identificados na fonte da CLI15.34.0 (`src/dataconnect/schemaMigration.ts` e
`src/gcp/cloudsql/connect.ts`). Esta é uma adaptação operacional; a ordem dos dados
continua DDL oficial → sete SQL → schema publicado → connector → Hosting. Nenhum
contrato de produto foi alterado para preparar este publicador.

## Limites e recuperação

Não executa Functions, IAM, login Firebase, seeds ou movimentações de dinheiro.
Aceite autenticado Firebase com os perfis reais, duas filiais, Caixa, estoque,
rateios/devoluções e impressão continua pendente após a publicação técnica.
Novas permissões das páginas não são concedidas automaticamente a usuários/roles.

O teto acumulado de planejamento US$5 é preservado, sem reserva fixa por release.
Cobrança real não é medida e esse teto não é uma trava de faturamento.

Journal privado persistente no HOME, salvo com fsync antes de cada intenção de
mutação. Lock local e advisory lock SQL impedem duplicação neste roteiro. Qualquer
recibo anterior com intenção de mutação bloqueia uma segunda publicação cega.
Timeout de API pode ter produzido efeito: conservar o recibo e consultar a operação
registrada. Não apagar recibos para tentar novamente.

Sem rollback automático após banco/connector: voltar só Hosting não desfaz reservas,
recebimentos ou vendas e pode ocultar ações de conciliação. Preservar ledger e guards;
seguir o plano `docs/encomendas-comandas/publicacao-e-reversao.md` do candidato.
Falha em SQL impede publicar schema/connector/Hosting posteriores. Falha posterior
registra o estado parcial, sem apagar histórico ou reverter publicação concorrente.

A publicação só termina com `publicationComplete:true`, bytes públicos verificados
e nove contenções reconfirmadas. Esse campo não significa aceite autenticado.
CORE não gravada; delta local no diretório privado da operação.

## Validação deste pacote

30 testes offline, incluindo orquestração completa simulada e bloqueio do frontend
após falha SQL. As duas chamadas de smoke administrativo/recusa foram testadas com
SQL Connect e PostgreSQL18 reais e isolados. Os sete corpos SQL foram analisados
pelo parser para confirmar ausência de COMMIT/BEGIN externo após a adaptação.
CI real do candidato foi reconfirmado por leitura das páginas públicas do GitHub.
Nenhuma mutação Google Cloud foi executada ao preparar este pacote.

Compartilhar somente o JSON entre `=== INICIO P58 ===` e `=== FIM P58 ===`.
Tokens, logs, snapshots e credenciais permanecem privados no Cloud Shell.
