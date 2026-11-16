# Hosting DEV — Barras globais

Publicador P55 restrito ao frontend `insightpad-dd-dev`, candidato imutável
`1fff0fe154ad473ee61437929b93a17843215a0a`, sobre a Plataforma já publicada,
base `9230247b8f6f3ddfa1868ed66a67ddf2eb276ed7` (recibo P54 recebido).

O usuário pediu o Bash de publicação das barras nesta conversa. Este pacote
prepara a operação; não é um recibo de publicação. Fonte do produto, branch
`agent/barras-globais-ui-dev`, PR #26 e SHA de CI permanecem intactos.

Executar diretamente `P55-publicar-barras-globais.py`, após verificar o manifesto
e os testes. Não há helper de espera nem repetição da suíte completa na Cloud Shell.
CI congelado `43758787206`, job `132948650622`, com 27 etapas aprovadas para esse
SHA. O transporte real de leitura do CI foi conferido na preparação e será repetido.

```bash
sha256sum -c SHA256SUMS
python3 P55-publicador.test.py       # 22 regressões offline, sem Google Cloud
python3 P55-publicar-barras-globais.py
```

Adaptação do publicador P54 já executado: journal e lock P55 próprios, checksum,
identidade, permissões Hosting, base live, configuração pública real, backend,
nove contenções, serving config, headers, rewrites/pin e versão anterior utilizável.
Transportes, whitelist de mutações, upload, redirects e limites são preservados.
Não altera Functions, connector, schema, SQL, IAM, schedulers, Run ou PROD.

O preflight autenticado exige a conta existente `datadazzletecnologia@gmail.com`.
As permissões são testadas, nunca concedidas. Tokens não são impressos ou gravados.
Uma base diferente de 9230247 interrompe a operação, preservando publicação
concorrente. Candidato já servido também interrompe antes de mutação.

Fonte e build ficam em checkout isolado de `/tmp`, com Node 22 e lockfile do
candidato. Reutiliza dependências somente quando manifests e lockfile coincidem;
se necessário, instalação pelo lockfile nesse workspace. Configuração pública
REAL de DEV lida pelo preflight. Build normal, sem entrada QA, fixtures ou segredos.
Confere marcadores das barras aprovadas, marca compacta e interfaces anteriores.

Limites operacionais mantidos: 100 arquivos, 10 MiB brutos, 5 MiB de gzip único.
Teto acumulado USD5, sem reserva fixa adicional por release. Gasto real não medido;
limites de tamanho não são trava absoluta de cobrança. Sem Cloud Build ou novo
recurso de infraestrutura. Mede espaço de HOME e /tmp antes de cópia/mutação;
nenhum arquivo alheio é removido. Recibos persistem no HOME privado.

O journal registra intenção antes de mutações; tentativa anterior com efeito
impede republicação cega, inclusive após timeout/interrupção. Não apagar recibos.
Reversão automática somente da versão criada por esta operação se ainda live,
com novo preflight; preserva uma publicação concorrente.

Após release, confere bytes e hashes servidos, versão live, home, módulos,
dashboard, cinco entradas da Plataforma, Cadastros, Estoque/Registros, Canais,
login e PDV. Reconfere backend, configuração, políticas/etags e nove contenções.
Verificação HTTP comprova a entrada servida, não autorização ou interação real.

Aceite autenticado B01–B06 continua pendente: três barras, temas, painel aberto
no resize, perfis, foco, sessão/suporte/saída, alertas, atalhos e impressão/exportação.
Não reativar iFood nem criar movimentações financeiras para demonstrar aparência.

Compartilhe somente o JSON entre `=== INICIO P55 ===` e `=== FIM P55 ===`.
Logs, snapshots e fonte permanecem privados no Cloud Shell. O script prepara delta,
mas não escreve a CORE. A publicação só será registrada depois do recibo confirmado.

## Incidente recebido — 16/11/2026, P55-20261116T120210Z-ac521d

A tentativa criou a versão `ab7824c420c92a5d`, release `1794830687960000`
às 09:04:47 BRT. A comparação pública falhou em
`/assets/CatalogPages-C1aHOskZ.js`. Reversão confirmada pela API para
`d0e096eb322b6f1e`, release `1794830729892000`, às 09:05:29 BRT.
`publicationComplete` não foi confirmado; `publicArtifactVerified=false`.
Restauração no navegador e causa da divergência ainda não comprovadas.

**Não repetir o publicador nem remover o journal.** `P55-diagnostico.py` faz
somente leituras: recibo/manifesto/build preservados, release live, inventários
anterior/candidato, version.json e o asset que divergiu. Não executa build,
upload, release, rollback, limpeza ou alteração do produto. Token somente em
memória para GETs na API Hosting DEV; nunca no domínio público ou na saída.
Quatro testes offline cobrem método GET, origem/caminhos, credenciais, projeto,
conta e comparação de inventários. O diagnóstico ainda precisa ser executado
no Cloud Shell do operador, pois o domínio DEV retorna bloqueio 403 no executor.
Compartilhar somente JSON entre os marcadores P55 DIAGNOSTICO.

## Retomada P55R — versão existente, sem novo build/upload

Diagnóstico recebido do operador: live `d0e096eb322b6f1e`, marcador público
`9230247`, rollbackStillLive=true. O asset ausente na versão anterior retorna
HTML (1163 bytes); isso após a reversão é esperado e não prova o conteúdo servido
na falha. Na versão candidata o asset está ACTIVE e seu hash gzip
`7f930856716d5da65d34dd145211d3af60619afa6ea8bad523e1dbb72a53e39d`
corresponde ao arquivo local. Apenas index.html e version.json compartilham
caminho com hash diferente entre versões; não há colisão nos nomes dos JS.
Causa da falha inicial ainda não comprovada; propagação é hipótese.

`P55-retomar.py` reutiliza somente `ab7824c420c92a5d` FINALIZED, após conferir
recibo original/reversão, CI exato, identidade/permissões/contenções, base live e
release de rollback exatas, fonte limpa, manifesto privado com hash fixo, 47
arquivos locais, inventário remoto e configuração idêntica à anterior. A classe
API da retomada proíbe criar/finalizar versão e fazer upload. Permite apenas GETs
e release DEV das duas versões fixas. Sem build, instalação ou novo upload.

Após uma única release, compara marcador e todos os arquivos por SHA256, com
até oito passes/120 segundos e cinco segundos entre divergências. Cada pass
registra hashes/bytes observados; só leituras são repetidas. Não dispensa nenhum
hash. Se não convergir, conserva evidência e tenta reverter somente se a release
live ainda for exatamente a criada nesta retomada. Resultado de POST incerto ou
release concorrente não autoriza repetição cega. Journal P55R privado e lock P55
originais são preservados. Tentativa P55R com mutação bloqueia reentrada.

Quinze regressões offline da retomada, 22 do publicador e quatro do diagnóstico
aprovadas. Executar somente `P55-retomar.py` no novo bootstrap, não o publicador
original. Retorno esperado: JSON entre INICIO P55R e FIM P55R. Preparação não é
publicação; aguardar recibo e manter aceite autenticado B01–B06 pendente.
