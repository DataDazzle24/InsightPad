# P57 — Ajustes finos do PDV e dashboards, Hosting DEV

Pacote preparado em resposta ao pedido expresso de Bash para publicação em DEV.
A preparação não publica e não faz merge. O usuário executa o Bash na Cloud Shell.

Candidato: `72f9b629337ae2c0e799863f3ef4ab01c8b71326`, branch
`agent/ajustes-finos-pdv-dash-dev`, PR #28. Base servida esperada:
`fd8f10c8575982ace35613e58363adb0ea28522c`, recibo P56, versão
`3e12d2d1c8a295f8`, release `1794847044243000`, projeto
`insightpad-dd-dev` / `102484114817`. Release diferente interrompe a operação.

CI `43962429515`, job `133633266188`: 27 etapas concluídas com sucesso no SHA
exato, reconferidas nas páginas reais do GitHub. Não espera CI nem repete a suíte
completa no Cloud Shell. O bootstrap confere os hashes, executa os 34 testes
offline do publicador e chama `P57-publicar-ajustes-finos.py`.

Adaptação do publicador P56: preserva transportes, whitelist de mutações,
permissões, verificação pública limitada e rollback condicionado. Confere conta
`datadazzletecnologia@gmail.com`, projeto ativo, permissões existentes, nove
contenções iFood, contratos implantados, políticas/etags e serving config. Não
concede permissões. Publica somente frontend Hosting DEV. Não publica Functions,
connector, schema, migrações, IAM ou PROD e não altera schedulers ou Cloud Run.

Build normal isolado em /tmp, Node22 existente, lockfile do candidato e configuração
pública real lida de DEV. Reutiliza dependências apenas com manifests e lockfile
iguais; senão usa npm ci. Confere os marcadores dos ajustes e dos módulos
preservados e rejeita fixtures de QA. Não publica protótipos ou propostas.
FC11 usa CAIXA.canManage conforme decisão do usuário. FC12 e DB06 permanecem
somente descoberta/proposta: a correção proposta do retry offline e o mapa
demonstrativo não fazem parte deste candidato. O defeito preexistente de retry
identificado no relatório não foi corrigido nesta revisão.

Artefato normal local conferido: 47 arquivos, 6.225.511 bytes brutos e 4.334.149
bytes de gzip único, incluindo marcador de versão com data de referência.
O novo build terá seu próprio builtUTC. Limites: 100 arquivos, 10 MiB brutos,
5 MiB gzip único. Mede espaço em HOME e /tmp antes de cópias e mutações e não
remove arquivos alheios. Mantém teto de planejamento acumulado USD5, sem reserva
fixa adicional. Cobrança real não medida; estimativa não constitui trava de cobrança.

Antes da release, repete preflight e compara inventário remoto completo. Depois
da release, verifica todos os arquivos públicos por SHA256 e as entradas HTTP
de login, PDV, módulos, menus e dashboard. Até oito passes somente de leitura,
prazo de 120s e cinco segundos entre divergências; nenhuma mutação é repetida
cegamente. HTTP não comprova sessão ou interação autenticada. Revalida backend,
políticas, contenções e disponibilidade da versão anterior após a publicação.

Journal e lock P57 próprios no HOME. Qualquer recibo P57 com mutação anterior
bloqueia nova tentativa cega; não apagar recibos para contornar o bloqueio.
Intenção é persistida antes das mutações. Timeout pode ter produzido efeito.
Rollback automático somente após falha de verificação, preflight fresco e
confirmação de que a release atual ainda é exatamente a criada nesta operação.
Restaura apenas a versão Hosting P56; preserva publicação concorrente ou resultado
incerto. O recibo contém também o procedimento de reversão posterior.

Compartilhar somente o JSON entre `=== INICIO P57 ===` e `=== FIM P57 ===`.
Tokens, logs e snapshots permanecem privados na Cloud Shell. CORE não gravada;
o delta fica somente em arquivo local. Aceite humano autenticado dos ajustes,
perfis de Caixa, sessão, teclado, temas, impressão/exportação e regressão das
barras/menus permanece necessário em DEV. Não criar movimentos financeiros reais
para demonstrar aparência.
