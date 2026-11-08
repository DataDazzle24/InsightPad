# P50R — Frente de Caixa v2, Hosting DEV existente

Artefato operacional imutável; não altera a branch nem o commit de produto.

- Produto: `9c50ee250c54ed9b2ab6a2b4656aedff1fb9a63a` / branch `agent/pdv-v2`.
- CI aprovado: https://github.com/DataDazzle24/InsightPad/actions/runs/42407535890 / job 128508366198.
- Baseline obrigatória: P49, fonte8efbd9d34e00b9d46a92f545d7d335368ce8f825, Hostingdc4de30734b6ae30.
- SHA256 do TXT: `7d7942e824ed7cd2ffedc58e663549a2ad18540b7769b140d1255066c3ba8cd8`.
- Autorização: pedido expresso nesta conversa para publicar DEV e fornecer comando para Cloud Shell.

O TXT extrai os dois scripts em pasta privada e confere hashes antes de executar. As fontes legíveis também estão neste commit. Execute na Cloud Shell já autenticada; não é necessário baixar ZIP.

Somente frontend normal em insightpad-dd-dev, entryfrontend/index.html, NODE_ENV=production, mode=development, QA=false. Reutiliza CI aprovado; não reexecuta as suítes do produto. Confere novamente projeto, operador, permissões, nove contenções, backend servido, release anterior e configuração. Preserva rewrites, pinagens, headers e conteúdo gerenciado Firebase. Não publica Functions, connector/schema/SQL, IAM, APIs, schedulers ou PROD; não reativa iFood. Sem Cloud Build.

Confere inventário/hashes, login/rotaPDV, versão e controles após publicação. Reversão automática somente da versão criada nesta operação, com preflight somente leitura, preservando publicação concorrente. Recibo anterior com mutação bloqueia republicação cega; lock local impede duas execuções simultâneas. Nenhuma limpeza de recursos/backups. Recibos e snapshots ficam no HOME. Checkout, cópia de dependências, cache npm, build e staging ficam em diretório privado novo no /tmp, com medição atual de capacidade. Mantém o lock P50 original e examina ambos os históricos P50/P50R antes de qualquer chamada de rede. O P50 anterior parou por espaço antes de qualquer mutação; não soma nova reserva ao mesmo envelopeUSD5.

38 testes offline do roteiro passaram. A distribuição não executa GCP nem comprova deploy. Envelope de planejamento anteriorUSD4.75+reservaHostingUSD0.25=USD5, tetoUSD5; cobrança real indisponível. Smokes autenticados, hardware e registro na CORE dependem do resultado real; nada disso é inferido por verificação HTTP. Devolva apenas JSONP50R, sem tokens/logs privados.
