# Hosting DEV — Canais de venda

Publicação restrita ao frontend de `insightpad-dd-dev`, candidato imutável
`7bc4aec60d5455c6a8e6c7cb95f537f196cac6e8`, sobre a base publicada de
Estoque/Registros `68abdac1ca10e30e953c626ebefc58cd89216666`.

O bloco de execução chama diretamente `P53-publicar-canais.py`, depois do CI
aprovado. Não há helper de espera. O publicador verifica o CI exato, sem repetir
suítes na Cloud Shell, e executa preflight fresco antes de qualquer mutação.

Adaptação do publicador P52 usado na publicação anterior: journal P53 próprio,
checksums, identidade, permissões de Hosting, versão live, configuração pública
real, backend, nove contenções, configuração de serviço e versão utilizável para
reversão. Não modifica Functions, connector, schema, SQL, IAM, schedulers ou Run.

```bash
sha256sum -c SHA256SUMS
python3 P53-publicador.test.py   # 12 regressões offline, sem cloud
python3 P53-preflight.py        # somente leitura autenticada
python3 P53-publicar-canais.py  # publicação Hosting DEV autorizada
```

A base pública precisa corresponder ao SHA de Estoque/Registros acima. Se outra
revisão legítima estiver live, o publicador para e preserva a alteração. Fonte,
dependências e build ficam em workspace temporário isolado; configuração real
de DEV é obtida pelo preflight. O build normal exclui QA, mocks e segredos.

Limites operacionais: 100 arquivos, 10 MiB brutos e 5 MiB de gzip único; não são
uma trava de cobrança. Teto acumulado USD 5 mantido, sem reserva adicional por
release; gasto real não medido. Nenhum recurso de infraestrutura é criado.

O recibo registra a intenção ANTES das chamadas com efeito. Qualquer recibo P53
com tentativa de mutação impede republicação cega. Timeout pode ter efeito
remoto: preserve recibos, logs e snapshots e consulte a release corrente antes
de decidir a recuperação. Não apague journals. Reversão automática somente da
versão criada pela operação, se ainda live, com preflight fresco.

O artefato servido e todas as rotas de Canais são conferidos após a release,
assim como as rotas vizinhas e as contenções. Compartilhe somente o JSON P53
sanitizado ao final. Snapshots, fonte, logs e tokens permanecem privados na
Cloud Shell. O script não escreve a CORE e não executa smokes autenticados do
produto ou operações reais do parceiro; essas etapas ficam registradas à parte.
