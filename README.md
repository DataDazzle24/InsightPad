# Hosting DEV — Estoque e Registros

Após o CI aprovado, o bloco final executa diretamente o publicador, como no ciclo anterior. O helper opcional consulta o CI no máximo uma vez por minuto.

Operação restrita ao frontend de `insightpad-dd-dev`, candidato imutável
`68abdac1ca10e30e953c626ebefc58cd89216666`, base Cadastros `6e727a0`.

Adaptação do publicador controlado P51, com journal P52 próprio, checksums,
CI congelado no candidato, inspeção de configuração pública real, backend, nove
contenções iFood, serving config, versão atual e versão utilizável para rollback.
Não modifica Functions, connector, schema, SQL, IAM, schedulers ou serviços Run.

`python3 P52-executar.py`: faz primeiro o preflight somente leitura de acessos/base/contencões, aguarda até 30 minutos o CI do SHA exato e inicia o publicador apenas se aprovado.
`python3 P52-preflight.py`: leitura autenticada e recibo privado, sem deploy.
`python3 P52-publicar-estoque-registros.py`: ciclo autorizado Hosting DEV.
`python3 P52-publicador.test.py`: doze regressões offline, sem cloud.

A publicação verifica novamente a base servida antes de qualquer mutação e
interrompe se outra revisão estiver publicada. Clona isoladamente de uma fonte
existente, busca somente o SHA exato, reutiliza dependências compatíveis ou
instala pelo lockfile e compila a entrada normal com a configuração pública real.
Artefato limitado a 100 arquivos, 10 MiB brutos e 5 MiB de gzip único. São limites
operacionais; cobrança efetiva não é inferida. Teto acumulado USD5 não renovado.

Timeout pode ter efeito remoto. Preserve os recibos; qualquer journal P52 com
intenção de mutação impede uma nova publicação cega. Não apague journals.
Reentrada após intenção de mutação exige consultar o estado remoto pelo recibo.
A reversão automática limita-se à versão criada pela operação, se ainda live,
com preflight fresco e sem sobrescrever uma publicação concorrente.

Recibos/logs/snapshots ficam privados na Cloud Shell. Compartilhe somente o JSON
P52 sanitizado impresso ao final. O script não grava a CORE nem executa smokes
autenticados no produto. O pacote de código tem provas sintéticas separadas;
aceite humano e as verificações autenticadas permanecem explícitos.
