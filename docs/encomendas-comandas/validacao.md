# Validação e limites da evidência

Branch: `agent/encomendas-comandas-dev`. Base limpa registrada:
`72f9b629337ae2c0e799863f3ef4ab01c8b71326` (P57). O SHA candidato é o commit
que contém esta integração, consultável com `git rev-parse HEAD`; não confundir a
base com o candidato. Nenhuma alteração foi mesclada ou publicada por esta tarefa.

## O que está integrado

Duas rotas protegidas, submenu de Vendas, listas/calendário/mosaico/históricos,
criação/edição e revisão, reservas integrais, preços/composições confirmados,
pagamentos e planos persistidos, conciliação, preparo, liberação/perda, transferência,
junção, venda única, cancelamento e devolução separada. D02/D05/D07 foram aprovadas
expressamente pelo usuário; a política não contém mais o bloqueio provisório.

`EcRead` e `EcCommand` são contratos reais do SDK gerado. O build normal não importa
o harness QA ou seus dados. O novo backend acrescenta17 tabelas,7 arquivos SQL e
funções/constraints; reutiliza as53 tabelas existentes sem reescrever seu schema.
Os leitores de disponibilidade do PDV/Estoque/canais incluem reservas EC, e um
guard compartilhado no PostgreSQL protege escritores antigos também.

O Registro distingue `ORDER`/`TAB`, mantém consulta e encaminha correção/cancelamento
para a origem. O dashboard ativo exclui a taxa de entrega da margem dos produtos,
conservando faturamento/repasse. A informação também aparece na impressão existente.
Nenhum custo de transporte foi inventado.

## Comandos e resultados locais

Node22.23.4, dependências por lockfile; sem nova dependência de produto.

| Verificação | Comando | Resultado observado |
|---|---|---|
| Contratos e SDKs | `dataconnect-emulator sdk generate --config_dir=dataconnect`; `node scripts/normalize-dataconnect-sdk.mjs` | Compilador3.4.23 fixado; frontend/React/admin regenerados |
| Frontend | `npm --prefix frontend run lint`; `npm --prefix frontend test`; `npm --prefix frontend run build -- --mode development` | Lint sem avisos;347 testes; tipos/build aprovados |
| QA anterior | `npm --prefix frontend run test:qa`; `npm --prefix frontend run build:qa` | Teste e build aprovados |
| Functions/contratos anteriores | `npm --prefix functions run lint`; `npm --prefix functions test`; `npm --prefix functions run build` | Tipos/build aprovados;204 testes aprovados |
| Banco/concorrência real isolados | `python3 scripts/ec/test_runtime.py` |47 casos aprovados; schema oficial e7 migrações aplicados2 vezes |
| Navegador com persistência | `node scripts/qa-browser/encomendas-comandas.mjs` |25 casos na rodada local; resultado/fingerprints em `encomendas-comandas/results.json` |
| Regressão visual anterior | `node scripts/qa-browser/run.mjs --full` |750 casos nos13 relatórios de resultados, sem falha/erro registrado |
| Preservação | `node scripts/verify-interface.mjs`; `node scripts/verify-reconciliation.mjs --working-tree`; `git diff --check` | Guardas preservadas e escopo nominal ampliado para EC; sem erro de whitespace |
| Scripts de suporte | `node --test scripts/version-manifest.test.mjs scripts/ci-dev-config.test.mjs scripts/verify-reconciliation.test.mjs scripts/qa-browser/evidence.test.mjs scripts/qa-browser/install-chromium.test.mjs` |34 testes aprovados |
| Sessão compilada | `python3 scripts/qa-browser/session-runtime.py` |23 cenários isolados aprovados |

O CI recebeu2 etapas adicionais (SQL isolado e navegador EC); mantém todos
os testes anteriores, sem deploy. Seu status deve ser consultado no SHA candidato;
os resultados locais acima não são uma afirmação de CI remoto aprovado. A primeira
execução44435899733 aprovou contratos, SDKs, frontend, backend e QA, mas encerrou
com124 no download das bibliotecas Ubuntu (limite180s). O limite apenas dessa
instalação passou a600s, com teste de regressão; browser180s/duas tentativas e todas
as verificações permanecem. Nenhuma publicação foi iniciada.

## Prova transacional

Os47 casos usam o compilador SQL Connect real e PostgreSQL18 em Docker descartável,
com rede desativada e identidades sintéticas. Reaplicar o SQL sobre documentos,
recebimentos, vendas, caixa, estoque e permissões existentes conservou os registros. Testam, entre outros: sinal60/restante140,
caixas/datas diferentes, perda/remessa/estorno, cancelamento sem reembolso automático,
reembolso idempotente, aprovação de outro gestor vinculada ao payload, divisão exata
igual/compartilhada/pessoa, alocação imutável, transferência parcial e de pessoa,
junção com preservação da origem, catálogo alterado, falta integral, duas requisições
pela última unidade, PDV/canal respeitando reservas, versão concorrente, tenant/filial
alheios, sessão revogada, `user.false` prevalecendo sobre role, caixa fechado,
rollback de falha injetada, dinheiro grande, fração inválida e paginação do calendário.

Os nomes de métodos `test_Txx_*` são identificadores dos testes implementados e
incluem casos suplementares. Não significam que todos os passos manuais T01–T40
da especificação já foram executados. A matriz rastreia a evidência concreta.

## Prova no navegador

Autenticação visual QA sintética; comandos/leituras encaminhados ao SQL Connect e
PostgreSQL locais. Não é Firebase Auth real nem backend implantado em DEV.
O transporte de teste respeita a CSP QA e não habilita conexões externas.

Capturas de Comandas, Encomendas, Calendário e filtros em claro/escuro:
320×568,390×844,768×1024,1280×800,1440×900,1920×1080,2560×1440.
Todos são viewports emulados em Chromium headless, não aparelhos físicos.
Conferidos: ausência de overflow horizontal do stage, último cartão/ação alcançável,
4 colunas em1280,6 em1920 e1 em320, Escape/retorno e Tab/Shift+Tab.
O zoom100/200 usa efetivamente `chrome.tabs.setZoom/getZoom`, com CSSzoom1 e
`visualViewport.scale=1`. Não foi executado zoom do sistema operacional.

Fluxos de navegador com persistência: abrir/adicionar/receber/fechar comanda,
ACK perdido depois do commit, falha de refresh com atualização somente de leitura,
encomenda200 com sinal60/restante140, cancelamento de venda e devolução com gestor
distinto pela operação existente `ApprovePosSale`, além de incerteza persistida
antes de reload e recuperada por RESULT sem reenviar a mutação. Rateios, saldo antes/depois de cada recebimento, devoluções agrupadas e autorizador
ficam visíveis nas consultas e no histórico. Os saldos são snapshots do recebimento;
não são recalculados pelo total atual. Campos históricos desconhecidos permanecem
nulos. O comprovante foi gerado como DOM e PDF headless; impressora física não foi testada.

Os artefatos privados locais ficam em `artifacts/browser-private/ec-runtime/` e
`artifacts/browser-private/encomendas-comandas/`. O relatório guarda fingerprint do
backend testado. A entrega de evidências deve incluir os resultados e as capturas
selecionadas; essas pastas são ignoradas pelo Git e não entram no produto.

## Adaptações e preservação

- A referência é portável, não patch de backend completo. Os dados vêm do produto;
  os exemplos do protótipo não viraram mocks do bundle normal.
- O mosaico recebeu regra explícita de6 colunas em1920, conciliando o auto-fill da
  folha de referência com o critério C1B. As demais medidas/tokens vêm do kit.
- O contexto real de sessão é validado tanto nos contratos GraphQL quanto nas
  funções. Escritas compartilham uma transação e usam versões/locks ordenados.
- Os testes de menu foram atualizados somente para as duas rotas novas na ordem
  aprovada. As antigas guardas verificam suas revisões históricas depois de o delta
  EC passar por guarda própria; nenhum teste anterior foi simplesmente removido.
- Shell, Home/MenuCard, PDV, sessão, fila de aprovação, Functions/provedor e demais
  telas protegidas conservam sua implementação. A fila existente mostra a saída
  como Sangria com descrição “Devolução [código]”; a confirmação ocorre no documento.
- O alias de saldo em `PosProductBranches` foi corrigido pontualmente ao integrar
  disponibilidade e tem prova SQL. `DailyProfitDashboard`, operação histórica não
  utilizada pela tela ativa, contém agregado inválido anterior e não foi reescrita.
- Os68 IDs e exclusões anteriores permanecem no manifesto. CORE não gravada.

## Pendências reais

Autorização e acesso para publicação coordenada schema/SQL/connector/Hosting DEV,
preflight fresco e backup restaurável, smokes autenticados
e aceite visual/funcional na URL servida. Comparação direta completa com o protótipo
ficou limitada: metadados da versão3/SHA24549a8 foram confirmados pelo conector,
mas o arquivo exportado não pôde ser baixado; PDF/TSX/CSS do kit foram utilizados.
Não foram testados dispositivo físico, zoom OS ou impressora física.

O resultado final do CI e o SHA correspondente devem ser conferidos em
https://github.com/DataDazzle24/InsightPad/pull/29/checks e no recibo externo da entrega.
Nenhuma pendência D02/D05/D07 permanece para nova confirmação. A publicação não
deve ser tratada como Hosting somente; seguir `publicacao-e-reversao.md`.
