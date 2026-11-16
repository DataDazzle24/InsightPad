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
