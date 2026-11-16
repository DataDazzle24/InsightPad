# P56 — Home e seis submenus, somente Hosting DEV

Pedido atual do usuário: fornecer o Bash para publicação. A restrição de não
deploy da tarefa de implementação foi sucedida por esse pedido expresso.
Nenhum merge é realizado. A preparação deste pacote não constitui publicação.

Candidato `fd8f10c8575982ace35613e58363adb0ea28522c`, branch
`agent/menus-ui-dev`, PR #27; base `1fff0fe154ad473ee61437929b93a17843215a0a`.
Último recibo confirmado P55R: versão `ab7824c420c92a5d`, release
`1794832427177000`, projeto `insightpad-dd-dev`/`102484114817`.
Uma release diferente interrompe a operação, preservando mudanças concorrentes.

CI congelado `43879128432`, job `133339974887`: 27 etapas aprovadas no SHA
exato. Leitura real reconferida ao preparar o pacote. Não aguarda CI nem executa
novamente a suíte completa no Cloud Shell. Executar os 31 testes offline do
publicador e depois `P56-publicar-menus.py`, somente após os checksums.

Adaptação do publicador P55 e da verificação pública P55R. Transportes Hosting,
whitelist de mutações, permissões e leitores das contenções preservados. Somente
frontend Hosting DEV: não altera Functions, schema, connector, SQL, IAM,
schedulers, Run ou PROD. Exige operador `datadazzletecnologia@gmail.com`, testa
as permissões sem concedê-las e confirma nove contenções/backend/serving config.

Build normal em checkout isolado de /tmp, Node22 existente, lockfile do candidato
e configuração pública real lida de DEV. Reutilização de dependências somente
com manifests/lockfile iguais; instalação pelo lockfile se necessário. Confere
os marcadores dos menus e dos módulos anteriores, exclui QA/mocks/segredos,
registra manifesto privado e hashes. Espaço de HOME e /tmp medido antes de
cópia/mutação. Nenhum arquivo alheio ou journal anterior é removido.

Limites operacionais: 100 arquivos, 10 MiB brutos e 5 MiB de gzip único. Build
normal local conferido: 47 arquivos, 6.208.463 bytes brutos, 4.330.185 gzip únicos.
O Cloud Shell fará um novo build, com novo marcador de data, dentro dos mesmos
limites. Teto acumulado USD5 mantido, sem reserva fixa adicional; gasto real não
medido. Não é trava absoluta de cobrança; sem Cloud Build ou novo serviço.

Após a única release, compara version.json e todos os arquivos por SHA256,
com até oito passes e prazo de120s para leituras; cinco segundos entre
respostas divergentes, nonces novos e evidência de tipo/hash/bytes/headers.
Somente leituras são repetidas. Todos os hashes são obrigatórios. Confere as
entradas HTTP dos sete menus e dos módulos anteriores, headers/cache, backend,
políticas/etags, configuração e reversão disponível. HTTP não comprova sessão
ou interação autenticada.

Journal P56 próprio e lock privado no HOME. Intenção é gravada antes de cada
mutação; tentativa anterior com mutação bloqueia reexecução cega. Não apagar
recibos para contornar esse bloqueio. Timeout pode ter produzido efeito remoto.
Reversão somente se a release live ainda for exatamente a criada nesta
operação e após preflight fresco; release concorrente ou resultado incerto
não autoriza rollback/repetição automática.

Compartilhar somente JSON entre `=== INICIO P56 ===` e `=== FIM P56 ===`.
Logs/snapshots/token permanecem privados no Cloud Shell. O publicador não escreve
a CORE; a publicação será registrada somente após o recibo confirmado.
Aceite humano/autenticado da Home/submenus e B01–B06 das barras permanece
pendente. Não criar movimentos financeiros reais para demonstrar aparência.
