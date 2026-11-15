# Hosting DEV — Gestão da Plataforma

Publicador P54 restrito ao frontend de `insightpad-dd-dev`, candidato imutável
`9230247b8f6f3ddfa1868ed66a67ddf2eb276ed7`, sobre a base publicada de Canais
`7bc4aec60d5455c6a8e6c7cb95f537f196cac6e8`.

O operador autorizou a preparação do Bash de publicação nesta conversa, após o
aceite do envio dos quatro arquivos finais. Este pacote operacional não é uma
confirmação de publicação. O código do produto e seu SHA de CI permanecem intactos.

O bloco chama diretamente `P54-publicar-plataforma.py`. Não há helper de espera.
O CI congelado é `43718505062`, job `132825132708`, com as 27 etapas aprovadas para
esse candidato. A leitura real das duas páginas foi conferida na preparação;
o publicador confere novamente antes de qualquer chamada Google Cloud com efeito.

Adaptação do P53 executado em Canais: journal próprio, checksums, identidade,
permissões Hosting, base live, configuração pública real, backend servido, nove
contenções, serving config, headers, rewrites/pin e versão anterior utilizável.
Não altera Functions, Data Connect, schema, SQL, IAM, schedulers, Run ou PROD.
Cadastros, Estoque/Registros, Canais, PDV, login e assets anteriores são conferidos.

```bash
sha256sum -c SHA256SUMS
python3 P54-publicador.test.py     # 19 regressões offline, sem cloud
python3 P54-publicar-plataforma.py # preflight fresco e Hosting DEV autorizado
```

A versão pública deve corresponder à base Canais acima. Outra revisão legítima
interrompe a operação. Candidato já servido também interrompe antes de mutação.
As permissões são testadas, nunca concedidas. A autenticação é a conta existente
`datadazzletecnologia@gmail.com` no Cloud Shell; tokens não são impressos ou gravados.

A fonte é um checkout isolado em `/tmp`, com Node 22 e dependências reutilizadas
somente quando os manifests e lockfile coincidem. Se necessário, instalação pelo
lockfile no workspace temporário. O build normal usa configuração pública real
lida de DEV e exclui a entrada QA, fixtures, mocks e arquivos privados.

Limites operacionais: 100 arquivos públicos, 10 MiB brutos, 5 MiB de gzip único.
Teto acumulado USD 5 mantido; sem nova reserva fixa por release, sem infraestrutura
adicional ou Cloud Build. Gasto real não medido; limites de arquivos não são trava
absoluta de cobrança. Espaço real de HOME e /tmp é medido antes de cópia e mutação;
nenhum arquivo alheio é removido e os recibos ficam persistidos no HOME.

O journal registra intenção antes de mutações. Tentativa anterior com efeito
impede republicação cega, inclusive após interrupção/timeout. Não apagar recibos.
Reversão automática restaura somente a versão anterior se a operação atual ainda
for live, depois de novo preflight; publicação concorrente é preservada.

Após release, confere bytes e hashes servidos, versão live, cinco rotas Plataforma
(submenu e quatro vistas), rotas vizinhas, configuração, backend e nove contenções.
Não executa movimentações financeiras reais ou smokes autenticados de negócio.
O aceite autenticado da matriz continua pendente, inclusive integridade financeira
no cenário de confirmação perdida. Não reativar iFood para testar aparência.

Compartilhe somente o JSON entre `=== INICIO P54 ===` e `=== FIM P54 ===`.
Logs, snapshots e fonte ficam privados no Cloud Shell. O script prepara delta,
mas não escreve a CORE. A conclusão da publicação só será registrada após o recibo.
