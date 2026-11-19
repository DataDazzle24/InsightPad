# P58 — publicação coordenada de Encomendas e Comandas em DEV

Candidato imutável: `bb2def3336171b440df8038c4112abd9f05b7172`, branch
`agent/encomendas-comandas-dev`, PR29. CI aprovado:44444333875/job135292677985,
29 etapas. Base:72f9b629337ae2c0e799863f3ef4ab01c8b71326/P57. A publicação foi
autorizada pelo pedido do bloco de publicação nesta conversa, após apresentação
do plano de schema/SQL/connector/Hosting. O pacote operacional fica em branch
separada; não muda o candidato testado, não faz merge e não publica PROD.

## Estado parcial confirmado e diagnóstico P58D — 19/11/2026

O recibo P58-20261119T125956Z-51173c confirmou officialDDLApplied:true e os sete
SQL concluídos. A validação posterior retornou erro400, mas o roteiro não salvou
seu corpo no recibo: a mensagem genérica “Ainda há divergência oficial de schema
após SQL” não permite determinar a causa técnica. Schema, connector e Hosting
permaneceram não publicados conforme os campos false do recibo. Não reaplicar
migrações, apagar journals ou tentar executar o publicador desde o início.

`python3 P58-diagnosticar-schema.py` consulta exclusivamente o estado parcial
desse recibo. Reutiliza o checkout original do candidato, confere os hashes dos
sete SQL, o preflight somente de leitura e a release/configuração Hosting anterior.
Consulta a validação oficial com validateOnly:true e registra o corpo do erro
sanitizado, inclusive detalhes/diffs. Não interpreta qualquer400 como um diff SQL.
Reconfirma que o recurso schema não mudou durante a consulta. O guard independente
recusa publicação, SQL, outros recursos e alvos fora de DEV. Não instala ferramentas
nem consulta preços/backup. O journal original permanece intacto.

11 testes offline passaram. O diagnóstico usa journal separado P58D e imprime
somente o JSON entre INICIO P58D/FIM P58D. diagnosticComplete:true significa que
a consulta terminou, sem significar publicação concluída. A saída é necessária
para preparar uma retomada específica a partir do banco já migrado.

## Orientação vigente — publicação direta em DEV, 19/11/2026

Após a falha de conexão durante a cotação, o usuário instruiu: “vamos seguir apenas
com a publicação do novo código com as novas funcionalidades e as adições e ajustes
em banco”. O recibo P58B de12:51 confirmou backupMutationAttempted:false e
remoteMutationAttempted:false. Não foi criado backup e não houve migração.

O novo bloco usa explicitamente `P58-executar.py --publish-without-backup`.
Esse modo dispensa somente o pré-requisito de backup recente; não consulta o
catálogo de preços, não inventaria/cria backup, não ativa PITR/backups automáticos
nem exige permissões de backup. O estado da configuração existente é registrado.
O recibo identifica backupRequirementWaived:true, backupVerified:false e o risco:
sem backup/PITR confirmado, não há recuperação garantida do banco. A decisão do
usuário substitui, para esta execução DEV, a exigência anterior de proteção de dados.
Não representa backup feito, restauração testada ou ausência de risco.

Mantém CI do mesmo SHA, identidade/instância, usuário e role SQL existentes,
proibição de grants, nove contenções, build, parser do diff aditivo, transações,
comparação da estrutura legada, schema/connector/Hosting e verificações públicas.
Estado parcial ou qualquer intenção anterior de mutação P58 continuam bloqueando
uma segunda execução cega. O modo padrão continua exigindo backup recente, e o
modo `--backup-and-publish` permanece separado; não há fallback entre modos.

Executa45 testes do publicador antes de iniciar. Foram executados também os28
testes do fluxo separado de backup, para confirmar sua compatibilidade. Nenhuma
mutação Google foi executada durante a preparação. O produto continua no mesmo SHA.
O teto acumulado US$5 não foi renovado; custo real não é medido por este roteiro.

Reversão: corrigir em frente e preservar tabelas, ledger e guards. Após dados EC,
rollback isolado de Hosting não reverte banco, reservas ou recebimentos; seguir
o procedimento de recuperação do candidato e diagnosticar o recibo antes de agir.
O aceite autenticado em DEV continua pendente após a publicação técnica.

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
   24h, reconfirmado por GET do ID na instância correta. PITR é registrado, sem ser
   habilitado ou exigido quando há backup recente válido. Nenhum usuário, senha,
   grant, backup ou recurso é criado no modo padrão. O modo explícito de backup
   descrito abaixo cria somente um backup pontual, com cotação e retenção verificadas.
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

38 testes offline, incluindo orquestração completa simulada e bloqueio do frontend
após falha SQL. As duas chamadas de smoke administrativo/recusa foram testadas com
SQL Connect e PostgreSQL18 reais e isolados. Os sete corpos SQL foram analisados
pelo parser para confirmar ausência de COMMIT/BEGIN externo após a adaptação.
CI real do candidato foi reconfirmado por leitura das páginas públicas do GitHub.
Nenhuma mutação Google Cloud foi executada ao preparar este pacote.

Compartilhar somente o JSON entre `=== INICIO P58 ===` e `=== FIM P58 ===`.
Tokens, logs, snapshots e credenciais permanecem privados no Cloud Shell.

## Correção do preflight de backup — 19/11/2026

A primeira execução recebida parou antes de qualquer mutação Google, após CI,
permissões e nove contenções aprovados. A mensagem juntava backup e PITR e não
identificava qual condição estava ausente. A exigência adicional de PITR foi
retirada: o plano exige um backup restaurável confirmado para a migração aditiva,
sem impor a contratação/ativação de recuperação contínua. Backup recente continua
obrigatório, mesmo quando PITR está habilitado.

O roteiro agora pagina o inventário, reconfirma por ID o backup SUCCESSFUL concluído
em até24h e registra o diagnóstico sanitizado mesmo ao bloquear. Aceita a ausência
do campo opcional instance porque a URI da API já fixa projeto/instância; recusa
campo conflitante. Não usa backups RUNNING, antigos ou com data inválida.
PITR ausente não é ocultado: o recibo registra o estado e não afirma recuperação
sem perda de dados. Restaurar um backup pode omitir escritas posteriores; nenhuma
restauração é automática. Ledger e guardas continuam preservados na recuperação.

Como a execução anterior marcou remoteMutationAttempted:false, é permitido iniciar
uma nova tentativa com preflight fresco. O bloqueio de repetição depois de qualquer
intenção de mutação foi mantido. O candidato do produto continua bb2def3.

## Modo explícito de backup e retomada

O recibo de19/11/2026T12:15 confirmou que não existe backup na instância DEV:
backupCount0, automaticBackupEnabledfalse e PITREnabledfalse. Nenhuma mutação de
schema/SQL/connector/Hosting havia ocorrido. Esse bloqueio é real e não foi removido.

O bootstrap aceita `--backup-and-publish` somente após o usuário revisar o bloco.
Esse modo executa38 testes do publicador e28 testes de backup antes de acessar as
APIs. Confere CI, nove contenções, identidade, permissões existentes e login/role
SQL, sem grants. Um backup recente existente é reutilizado quando possível.

Se precisar criar um backup:

- Verifica que a instância ainda usa backup STANDARD e disco de até10GiB.
- Consulta o Cloud Billing Catalog oficial em USD, para backup de PostgreSQL ou
  genérico Cloud SQL em southamerica-east1/global. Usa a maior tarifa aplicável e
  inclui oito dias no cálculo conservador de um backup com TTL pedido de sete dias.
  Só permite criação se a estimativa incremental de armazenamento for atéUS$0,50.
- Se tarifa, unidade, API ou permissão não puder ser confirmada, para antes de criar.
  Não habilita APIs, Backup and DR, PITR, backups automáticos ou novos usuários.
- Cria um único recurso de backup pela API oficial `backups.createBackup`, com
  `instance:insightpad-fdc`, `location:southamerica-east1` e `ttlDays:7`.
- Exige operação concluída, estadoSUCCESSFUL, vínculo ao backupRun da instância,
  GET de confirmação desse backupRun, expiração de sete dias e tamanho dentro da
  estimativa. Não faz fallback para backup de retenção indefinida.
- Só então executa o P58 normal, com preflight fresco e o mesmo candidato bb2def3.

A execução explícita desse bloco é a autorização do backup pontual e de seu possível
custo de armazenamento. US$0,50 é um limite da estimativa calculada, não uma trava
de cobrança nem reserva fixa por publicação. O teto acumulado deUS$5 não é renovado
ou aumentado; os gastos históricos reais não foram medidos por este pacote.
O tamanho chargeable é registrado quando a API o disponibiliza. Variação de preço,
tributação e cobrança real não são convertidas em falsa garantia de custo zero.

O backup expira em sete dias; isso não configura uma política contínua de proteção
de DEV. Não há exclusão manual, restauração ou modificação dos backups existentes.
Não há novo servidor, bucket ou instância. O recibo distingue o backup potencialmente
faturado dos passos de schema/SQL/connector/Hosting e do aceite autenticado pendente.

Journal P58B separado, fsync antes do único POST e lock. Resposta perdida não causa
novo POST: se a operação é conhecida, repete apenas leituras; sem operação conhecida,
para para diagnóstico. Após backup concluído, uma tentativa de publicação bloqueada
antes de mutar pode reutilizá-lo. Mutação prévia do P58 impede nova tentativa cega.

Referência técnica oficial: googleapis/google-api-go-client,
`sqladmin/v1beta4/sqladmin-gen.go`, recursos Backup (ttlDays/expiryTime/backupRun),
BackupsCreateBackupCall e Operation.BackupContext. Foram usados os campos documentados
da API, sem mudanças de configuração da instância para contornar falta de backup.
