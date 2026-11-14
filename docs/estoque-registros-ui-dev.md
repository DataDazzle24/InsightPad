# Estoque e Registros: integração visual DEV

Base de integração: `6e727a05fcd987b236ee11646c4c70e4bc88fcf5` (Cadastros).
Rotas: `/estoque` e `/vendas/registros`.

A folha `estoque-registros.css`, importada depois de `cadastros.css`, aplica a
proposta aprovada somente em tela e sob `.stock-page.work-stock` e
`.sales-page.work-sales`. O acabamento final dos itens, seletor fiscal e revisão
fica em `.stock-operation-modal--create`. Dados, chamadas SDK, mutações, guardas,
cálculos, exportadores, destinos de navegação e impressão são preservados.

`useWorkDialog` mantém foco, Tab/Shift+Tab, Escape e retorno ao acionador nas
duas rotas. Multisseleção consome Escape apenas nessas raízes; calendário usa
`workspaceUX` opcional, sem alterar os consumidores existentes ou Cadastros.
Avisos operacionais ficam no diálogo, preservando identificação e payload na
confirmação incerta.

## Adaptações de integração

O patch aplica e reverte literalmente na base de integração. A revisão em
navegador identificou que `.stock-kpis span` herdava fonte monoespaçada e
capitalização do CSS legado, exibindo texto em vez dos ícones. A folha local
restaura Material Symbols e `text-transform:none` somente nesses ícones.

A regressão integrada também preserva a cor destrutiva de `REVERSED`, equivalente
a `CANCELLED`. Nos filtros dessas duas rotas, o fechamento externo de listas e
calendário ocorre no clique completo: fechar no `pointerdown` movia o diálogo
centralizado entre pressionar e soltar Aplicar, consumindo a ação. Consumidores
fora do escopo continuam com a interação anterior. O caso fiscal verifica a
aplicação da data local e seu recorte UTC sem alterar as regras de negócio.
Escape respeita a trava de gravação dos diálogos de estoque: as provas de ACK
pendente de 15/60 segundos mantêm formulário, ID e payload até a confirmação.
A prova de cor segue o Transferir tonal aprovado, preservando contraste e foco.
O arquivo de evidências usa tar por fluxo diretamente para AES-GCM, com o mesmo
envelope autenticado e chave pública. O crescimento das capturas não depende do
antigo buffer de subprocesso de 100 MiB; nenhum tar em texto claro é persistido.

Os verificadores históricos continuam executando as garantias de Cadastros,
PDV, dashboards e shell. `verify-estoque-registros.mjs` verifica primeiro a
lista exata de arquivos autorizados, declarações de negócio, wiring de JSX,
interação compartilhada restrita e CSS de tela por rota. Só depois os controles
anteriores leem a visão histórica dos quatro arquivos aprovados. Nenhum contrato
anterior é removido. A asserção de rótulos de KPI ignora ícones `aria-hidden`.

## Validação reproduzível

- `npm --prefix frontend run lint`
- `npm --prefix frontend test`
- `npm --prefix frontend run build -- --mode development` com configuração
  pública real obtida por `node scripts/ci-dev-config.mjs`.
- `node scripts/verify-interface.mjs`
- `node scripts/verify-reconciliation.mjs --working-tree`
- `npm --prefix frontend run build:qa`
- `node scripts/qa-browser/run.mjs --estoque-registros` (também em `--full`).

A prova de navegador usa componentes reais com Auth/API sintéticos, bloqueia
rede externa e registra capturas e resultados em `artifacts/browser-private`.
Cobre temas claro/escuro, 1280×800, 1024×600, 390×844 e 320×568, zoom nativo
100%/200% por `chrome.tabs.setZoom/getZoom`, criação em quatro etapas, filtros,
camadas de Escape, foco, três tabelas/CSVs, perda de ACK e retry idêntico,
correção/estorno sintéticos e tabela de vendas com 16 colunas.

O CSS de impressão anterior oculta `.catalog-backdrop`, inclusive os detalhes de
venda. A prova registra esse comportamento em PDF; não declara impressão útil
nem aceite autenticado. Isso permanece pendência funcional separada.

Build QA não é publicável. CI, publicação Hosting, release, rollback e smokes
com autenticação devem corresponder ao candidato imutável, ser verificados no
DEV servido e ter evidência própria. PROD permanece fora do escopo; nenhuma alteração
de Functions, connector, schema, SQL ou IAM acompanha esta integração.
