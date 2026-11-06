# P48 — pacote operacional de publicação Hosting DEV

Este commit distribui somente o roteiro já validado, sem alterar o candidato do produto.

Candidato frontend: a440615bd4b807b6b1484368c32d4149e20ba042
CI aprovado: https://github.com/DataDazzle24/InsightPad/actions/runs/42240531812
SHA256 do TXT: c1c1397190004f7dacde1b5acff4baee059621d5199e269bf806990ed918b699

Executar somente na Cloud Shell autenticada do projeto insightpad-dd-dev. O script confere novamente gates, identidade, estado remoto, nove contenções e compatibilidade antes de publicar somente Hosting DEV. Functions, Data Connect, SQL, IAM e PROD não são alvo. Não inclui credenciais nem dados de negócio.

Distribuir este pacote não comprova publicação. Devolver apenas o JSON P48 e guardar logs privados na Cloud Shell.

## Revisão operacional v2

Corrige a lista de versões do preflight para reconhecer o login b753891, a baseline que o publicador já exigia. O roteiro v1 rejeitava essa baseline antes de qualquer upload e não prova mudança concorrente. O preflight v2 registra a versão pública observada antes de qualquer rejeição e consulta com nonce.

Fontes extraídas em terminal-v2; recibos permanecem no mesmo diretório raiz e continuam impedindo republicação após qualquer tentativa de mutação anterior. Configuração, versão anterior a7f9d9526cc5fb29, backend, nove contenções, SHA/CI e limites de API permanecem obrigatórios. Vinte e quatro testes do roteiro passaram, incluindo regressão do defeito original, rejeição de candidatos/projetos desconhecidos, proteção de recibos e APIs. Não houve repetição das suítes do produto nem mudança do candidato aprovado.
