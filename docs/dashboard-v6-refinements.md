# Dashboards — ajustes de 06/11/2026 (v6)

## Base e ordem das instruções

A base desta rodada é `a440615bd4b807b6b1484368c32d4149e20ba042`, publicada no DEV pelo recibo P48: release `1793982535522000`, Hosting `db8c31efcb005604`. Esse é o último recibo comprovado, não uma consulta atual à nuvem. Branch isolada: `agent/dashboard-refinements-v6`. O checkout anterior estava limpo e foi preservado em outro worktree. Não há reversão ampla, reset ou restauração integral de arquivos antigos.

O pacote `InsightPad_Codex_Ajustes_2026-11-06.zip` tem SHA256 `7118be58e399a1b5000d8b8a9d16fe00acfd4d761436dd7b3c230776981d0cd0`; as 24 entradas do manifesto foram conferidas. O PDF/Markdown e os exemplos são especificação e referência, não código já homologado no produto. Nenhum mock, dado ou shell do protótipo foi incorporado. As revisões finais v5/v6 prevalecem sobre os tamanhos iniciais da v4.

A instrução direta de Arthur desta rodada exige remover os elementos que estavam no rodapé, inclusive suas realocações. Ela substitui a decisão anterior de manter um controle compacto em todos os cabeçalhos. Preservar alertas operacionais significa manter os avisos de pedidos recebidos e suas guardas; não significa reinstalar o controle ocioso que o usuário mandou retirar.

## Correção seletiva fora dos dashboards

O histórico entre b753891 e a440615 identifica a introdução de `useChannelAlertTarget` e `channel-alert-placement.css`. Essa combinação inseria um span e o botão “Alertas de pedidos” nos cabeçalhos da home, módulos, estoque, vendas, PDV e cadastros. Foram removidos o hook, a folha de realocação, o portal, o slot dos dashboards, o botão ocioso e o modal de configuração pertencente a esse controle. A interface não reaparece em tooltip, cabeçalho, home ou outro painel.

`ChannelOrderNotifier` continua montado uma única vez. Sem pedido pendente, retorna null. Mantém a consulta, identidade da aba, leases, seleção do alerta atual, preferências já armazenadas, áudio, notificações já autorizadas no navegador, confirmação de leitura, controle de versão, estoque, catálogo, lembretes, aceitar/recusar e seus erros. O botão de som dentro de um pedido recebido já existia e permanece; não é uma realocação do controle do rodapé. A ação específica de solicitar permissão/testar notificações, oferecida pelo modal retirado, também foi removida com esse modal. Nenhuma preferência ou fila existente é apagada.

As únicas exclusões nas folhas compartilhadas são regras exclusivas do controle/modais retirados e suas reservas antigas. Não há nova paleta, fonte, dimensão ou navegação global. O guard compara `interface.css` integralmente com a440615 após essas exclusões pontuais e compara `catalog-standardization.css` com a fonte original após as exclusões explícitas. O notifier inteiro é comparado com b753891 após remover exatamente a interface aposentada: outros desvios são rejeitados.

A construção JSX das duas barras segue byte a byte igual à base. Home, login v2, PDV, estoque operacional, financeiro, cadastros e Conta e sistema não recebem redesenho. Rodapé global e sua assinatura permanecem ausentes; logomarcas independentes anteriores e rodapés funcionais de drawers, modais, tabelas e relatórios permanecem. Não foi identificada alteração global de fontes/cores fora da remoção de rodapé e dessa realocação no diff da implantação anterior; essas áreas são verificadas por preservação de fonte e comparação de geometria, sem declarar uma causa não demonstrada.

## Integração visual local

- `DashboardSurface`: topo interno com voltar/título, cinco vistas e ações em uma linha; duas linhas até 900px de viewport. Submenu sob a vista ativa, limitado à largura real disponível. Ações e handlers existentes preservados. Contexto vazio não reserva linha no desktop; seleção e combinação móvel continuam acessíveis.
- `dashboard-v6.css`: camada após a folha própria existente, exclusivamente `@media screen` e namespaces de dashboard/modal. Dark usa superfície #181E25, elevada #222B35, borda #394550 e secundário #BEC8D1. Light usa #FFFFFF/#E9EFF4/#BDCBD5/#4D5C68. As variáveis do AppLayout não mudam.
- KPIs: padding 10/14/9px, números de 21–28px e 22px em janelas baixas; nomes/explicações legíveis, sem retirar centavos. Até 560px úteis, faixa horizontal interna com colunas de até 172px/80%; valores extensos têm acesso por foco/rolagem, sem reticências como única informação. Os seis WebP são reutilizados com bytes intactos, opacidade .70/.44 e filtro aprovado. Arte ausente em mobile, impressão e cores forçadas.
- Área útil: quatro linhas nomeadas para topo, submenu, contexto e workspace evitam linha vazia quando não há contexto. O slot do AppLayout fornece a altura; não se soma 100vh à altura das barras. Até 960px úteis, o mesmo conjunto de painéis alterna pelo pager, sem nova consulta ou limpeza. As 13 subpáginas permanecem.
- `useDashboardMeasurements`: medição local do submenu e do total da rosca, com ResizeObserver, fontes e resize. O total tem fonte entre 12 e 21px, margem para arredondamento dos glifos e largura limitada ao anel; abaixo de 180px de diâmetro ou fonte necessária menor que 12px, aparece abaixo da rosca. Listas laterais quebram texto/valor. Observers, eventos e RAFs são removidos no unmount.
- Gráfico de linhas: conserva séries, domínios, valores, pontos e ações. O SVG usa o tamanho renderizado em pixels CSS em vez de reduzir toda a tipografia com um viewBox fixo. A área mantém ao menos 150px e o corpo com legenda 215px; rótulos do eixo se distribuem conforme a largura, com todos os valores preservados na lista acessível. A medição não altera filtros ou consultas.
- Heatmap: a superfície dark mais clara exigiu ajustar somente a opacidade máxima de .47 para .44; a primeira prova mediu 4,36 de contraste com o valor anterior. Sinal, ordenação e progressão de intensidade permanecem; o objetivo é manter texto ao menos 4,5 sobre a nova superfície.
- Modais: tema e tokens no próprio `.dashboard-v3-modal[data-theme]`, inclusive se portado para fora do AppLayout. Máximo de 700px/viewport menos24px; em mobile, viewport menos16px, campos em uma coluna, fonte16px e Aplicar na largura total. Busca/multisseleção ficam no corpo rolável; cabeçalho, ações, rascunho, Escape, isolamento e retorno de foco são preservados. Não há regra global em `.catalog-modal`/dialog.

A recuperação interna já existente para zoom ampliado em alturas abaixo de450px permanece restrita à rota. Os 11 recortes normais deste pedido começam em480px de altura. Nenhum zoom CSS, escala global ou mudança de zoom é introduzido no produto; a API de zoom aparece exclusivamente no ensaio isolado de navegador.

## Contratos e impressão preservados

Não há alterações de backend, Auth, Data Connect, schema, SDK, dependências, fórmulas, classes ABC, serialização monetária, guardas ou permissões. Os loaders e métodos financeiros protegidos seguem comparados com b753891. Modelos/adaptadores e o relatório completo seguem iguais à publicação a440615. Comparativos continuam usando apenas os dados suportados pelo contrato; não se inventam séries mensais ou produto×dia.

Curva ABC recorta apenas a própria tabela/CSV. KPIs gerais e PDF completo não mudam com esse recorte. Todas as colunas, linhas, unidades e totalizadores continuam acessíveis. Nenhuma camada nova de tela modifica regras de impressão. CSV/PDF, monotonicidade dos gráficos, centavos Int64 e exportação bloqueada permanecem no teste de impacto/CI.

## Validação e entrega operacional

A matriz de navegador cobre os dois temas e1920×1080,1440×900,1280×800,1366×768,1366×650,1024×600,1024×480,1072×677,1286×770,390×844 e320×568. Confere subpáginas, painéis individuais, última célula, controles, geometria do workspace, contraste, roscas, fontes, modais e ausência do rodapé/realocação. O ensaio de zoom usa chrome.tabs.getZoom/setZoom em perfil descartável; registra viewport emulado e zoom nativo separadamente. Há provas antes/depois das páginas atingidas e testes de desmontagem de observers/listeners/frames.

Este documento descreve critérios e implementação, não aprova automaticamente uma execução. O relatório externo do SHA congelado contém os comandos/resultados reais, falhas corrigidas, provas reaproveitadas, capturas e limitações. Evidências locais usam Auth/API em memória, sem chamadas externas nem operações reais de empresa. Não comprovam sessão autenticada no DEV, dispositivo físico, leitor de tela, áudio audível ou diálogo físico de impressão.

Publicação segue a autorização vigente, somente Hosting DEV e após CI do SHA exato. A baseline esperada é o recibo P48; toda versão/configuração/backend/contenção deve ser consultada novamente antes de gravar. Não repetir escrita de resultado incerto nem sobrescrever publicação concorrente. Reversão restrita à versão anterior de Hosting, com conferência da live e compatibilidade; backups e proteções não são limpos. Functions/iFood continuam adiados e contidos. O último envelope de planejamento é US$4,50, teto US$5; custo faturado desconhecido. Nova reserva deve ser explícita e caber nesse saldo.

CORE não gravada: não há ferramenta de escrita disponível. Acrescentar o delta desta rodada e os recibos/resultados de aceite ao histórico; não substituir registros anteriores. A publicação anterior P48 não é apagada nem tratada como inexistente.
