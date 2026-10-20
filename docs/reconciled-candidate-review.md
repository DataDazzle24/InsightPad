# Candidato reconciliado — roteiro de revisão DEC-017

Branch: `agent/ip-2026-008-018-reconciled`, descendente da fonte recuperada `80f21c65a0ed3e07b0f9c29bebd07d2479b0735b`. O SHA exato de revisão é o head do novo PR registrado na CORE. PR #17 permanece referência histórica. Nenhuma liberação de merge ou deploy está implícita neste candidato.

## Validação do desenvolvedor

Node 22.23.3. Instalação limpa pelos dois lockfiles; quatro testes de scripts, 81 testes frontend e 153 testes Functions passaram. Lint frontend, tipos Functions, build frontend DEV, build Functions e build QA passaram. CI remoto e seus artefatos devem ser consultados pelo SHA exato no PR; o merge sintético do evento pull_request possui outro SHA e deve ser identificado separadamente.

O manifesto registra commit, árvore, estado dirty, ferramentas, fingerprints de locks/configuração/schema/operações/SDKs e builds. IDs de implantação e aprovação do CTO permanecem null. A configuração pública Firebase de DEV é obtida por consulta somente leitura e limitada a seis campos de cliente; apenas o fingerprint entra na evidência. Build local antes do commit fica dirty e não é evidência do SHA final; o artefato de CI limpo é a referência de revisão.

## AG-04 — navegador real, Auth mockado

Baixar o artefato recovery-qa do run push que corresponde exatamente ao head do PR e conferir `qa-source.json` (commit, auth mock). Alternativamente, em checkout limpo do mesmo SHA, usar Node 22:

```sh
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build:qa
node scripts/serve-recovery-qa.mjs
```

Abrir `http://127.0.0.1:4174/qa/recovery.html` no navegador da mesma máquina. O harness compila LoginPage/ModalDialog reais com AuthContext sintético; o build rejeita módulos Firebase/AuthProvider. CSP bloqueia conexões e submissões de formulário. Usar e-mail fictício; nenhuma recuperação real de senha.

Registrar navegador/versão, sistema, viewport, zoom, SHA, resultado esperado/observado e evidência de cada caso:

1. Abrir Recuperar acesso por teclado; foco inicial no e-mail. Tab e Shift+Tab circulam dentro do diálogo; fundo fica inerte e sem rolagem indevida.
2. Escape, botão Voltar e fechamento externo retornam foco ao acionador. Verificar reabertura e limpeza de estado.
3. Envio pendente por 15/60 segundos: controles e Escape seguem a guarda prevista, não duplicam requisições e não perdem o estado. Exercitar sucesso e falha sintéticos e contador de requisições.
4. Temas claro/escuro, foco visível, viewport 320/375 px e desktop, zoom real 200%/400%, teclado com conteúdo rolável e mensagens longas.
5. Exercitar diálogos aninhados no painel: somente o superior trata Escape/Tab; ao fechar interno, foco e inertização retornam corretamente ao externo; ao fechar externo, ao acionador.

O painel pode ser recolhido para avaliar layout. Registrar limites de qualquer simulação de viewport; redimensionamento não equivale a zoom real. Esta entrega não declara parecer de AG-04.

## AG-03 — segurança independente

Revisar o mesmo SHA: workflow/pins/permissões, dependências e advisory, obtenção da configuração pública, manifesto e separação entre build e implantação; portal/foco/inert/limpeza de listeners/guardas busy; compatibilidade com hook legado preservado e limitações descritas em reconciled-findings.md. Não encerrar achados globais com base no teste restrito de PostSale.

## Gates e próximo responsável

AG-03 e AG-04 devem registrar início, progresso, evidências, pendências e parecer na CORE, retornando em texto sobre o mesmo SHA. O CTO decide a versão e os componentes após os pareceres e a conferência dos contratos/revisões aplicáveis. Sem merge, deploy (inclusive Hosting), migração destrutiva ou gasto novo. O inventário de backend continua somente leitura e suas lacunas não são preenchidas pelo build do frontend.


---

# DEC-018 — preparação da entrega consolidada de 68 ajustes

Data de corte: 20/10/2026. Fonte dos pedidos: BASE CORE, 15_AJUSTES A2:L79; seleção exata coluna F = `Implementável após gates`. São 68 IDs únicos. A preparação usa o head imutável do PR #18 `888234283376bfa1145ac913031d827af2c40a74`; esse PR e sua branch permanecem preservados para revisão independente. Esta seção é documentação de escopo, não implementação ou aceite dos pedidos.

## Gate de entrada e estado real

A DEC-018 determina: “AG-03/04 revisar esse recorte enquanto AG-02 prepara matriz dos68 IDs e critérios reavaliados na fonte recuperada; implementação sobre candidato tecnicamente revisado.” Na consulta desta preparação, GitHub reviews do PR18 retornou vazio e a CORE não continha pareceres AG-03/04 sobre esse SHA. O CI verde é evidência de build/testes, não parecer independente. Por isso este commit prepara a matriz e não altera aplicação, SQL, schema, SDKs ou dependências. Não declara nenhum dos68 implementado, aprovado ou publicado. A revisão do candidato final também deverá ser independente e no seu SHA exato.

## Distribuição e recortes internos

| Módulo | IDs incluídos |
|---|---:|
| Frente de caixa | 5 |
| Dashboard | 13 |
| Estoque | 21 |
| Cadastro de produtos | 2 |
| Cadastro de categoria | 14 |
| Cadastro de subcategoria | 13 |

Ordem técnica proposta após revisão da base: (1) autorização/filial/revogação e contratos dos módulos afetados; (2) filtros, contagens, paginação, unicidade e canonização; (3) quantidades, datas e aviso de preço; (4) estoque ePDV; (5) dashboards, exportações e apresentação integrada. Os recortes são internos: Arthur recebe uma versão consolidada emDEV depois dos gates. A ordem de commits não substitui dependências nem cria entregas parciais ao proprietário.

## Registro separado de correções adicionais

| Registro | Relação com os68 e tratamento planejado | Estado |
|---|---|---|
| SEC-2026-001 | Autorização de filial em estoque/caixa/listagens/exportações afetadas. Testes positivos e negativos por perfil e filial. | Reavaliar/corrigir após gate; não encerrado |
| SEC-2026-002 | Revogação de usuário/tenant/perfil/bloqueio nas consultas e mutações afetadas; cobertura atualPostSale não prova todas. | Reavaliar/corrigir após gate; não encerrado |
| SEC-2026-003 | Sessão exclusiva nas operações críticas do escopo; contrato backend e propagação de sessão exigem revisão específica. | Aberto; não afirmar enforcement por polling |
| SEC-2026-004 | Possemerchant iFood: avaliar se algum recorte altera esse caminho. Não fazer integração externa ou validação de loja real para completar os68. | Aplicabilidade separada, não encerrado |
| SEC-2026-005 | Legado AppsScript: confirmar se faz parte do caminho ativo; nenhuma migração de senha implícita. | Aplicabilidade separada, não encerrado |
| SEC-2026-006 | Vite8.2.4 já está no candidatoPR18 e foi testado; parecer independente de Segurança permanece pendente. | Correção proposta prévia, não contar entre68 |
| DES-2026-001/002/003 | Preservar atomicidade, idempotência, correção e fila durável recuperadas; ampliar regressão ao integrar os pedidos. | Reavaliar integração; não inferir backend ativo |
| ADD-018-001 | Filtros/contagem/exportação devem compartilhar recorte no servidor, ordenação estável e isolamento. CSV neutraliza fórmulas; paginação não oculta históricos. | Planejado, nenhum commit de implementação |
| ADD-018-002 | Estados carregando/vazio/erro, foco, teclas, busy, diálogos aninhados, mobile/zoom/contraste nas superfícies alteradas. Reutilizar componentes existentes e preservar regras de negócio. | Planejado, QA real pendente |
| ADD-018-003 | Evitar resposta obsoleta, envio duplo e mudança de contexto durante operações; limparseleção de linhas que não pertencem à página/filial. | Planejado, evidência pendente |

Os registrosADD são trabalho de suporte aos pedidos; não elevam o total para além de68. Nenhum achado é encerrado por título de commit ou teste de outro caminho.

## Dez itens excluídos

- AJU-PDV-06 — Ajustar “compra / venda / compra” — trecho manuscrito a confirmar. (Aguardando esclarecimento).
- AJU-PDV-07 — Verificar o funcionamento offline. (Precisa de especificação).
- AJU-EST-17 — Fazer ajustes nos big numbers: Corrigir o filtro do valor de estoque, que atualmente não funciona. (Precisa de especificação).
- AJU-EST-21 — A edição deve alterar a linha existente, sem criar uma linha nova. (Precisa de especificação).
- AJU-EST-24 — Ao inativar um produto no cadastro, manter o rastreio dele no “[final da frase cortado no original]”. (Aguardando esclarecimento).
- AJU-EST-25 — Colocar filtros mais personalizados, revisando as compras. (Precisa de especificação).
- AJU-CAT-15 — Identificar nomes parecidos e mostrar qual é o nome encontrado. (Precisa de especificação).
- AJU-SUB-12 — Identificar nomes parecidos e mostrar qual é o nome encontrado. (Precisa de especificação).
- AJU-SUB-15 — Ao trocar o nome de uma categoria ou subcategoria, permitir que o usuário escolha entre migrar os produtos já vinculados e cortar os vínculos; exibir um alerta sobre o impacto da alteração. (Precisa de especificação).
- AJU-SUB-16 — Se uma categoria for inativada, colocar suas subcategorias com status “A VINCULAR” e indisponíveis para vínculo com produtos. Os produtos devem ficar temporariamente sem vínculo. (Precisa de especificação).

Não implementar por inferência: políticaoffline nova; semântica de edição de estoque; filtro de valor de estoque; trecho cortado/rastreio; filtros de compras não definidos; busca de nomes semelhantes; renomeação com migração/corte de vínculos; estadoA VINCULAR. Dependência nova bloqueia somente o item afetado e é encaminhada aoCTO. As21 demandas deEstoque incluídas não autorizam AJU-EST-21 nem as demais exclusões.

## Matriz por ID — critérios e evidências

Cada registro abaixo contém pedido original, critério daCORE, caminhos reavaliados, observação estática, testeplanejado e campos separados para commit de implementação, evidência executada, revisão e aceiteArthur. Arrays vazios e null significam pendência real. O commit deste documento é evidência depreparação, nunca commit de implementação dos68.

```json
{
  "decision": "DEC-018",
  "count": 68,
  "scopeClassification": "Implementável após gates",
  "items": [
    {
      "id": "AJU-PDV-01",
      "activity": "IP-2026-012",
      "module": "Frente de caixa",
      "request": "Passar o botão de voltar para o lado do relógio.",
      "acceptance": "Voltar fica ao lado do relógio em desktop e continua acessível a360px/zoom200%, sem perda do carrinho silenciosa.\nReferências: QA21–31/36/37; DES001–003/SEC001–003 para operações. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/PointOfSalePage.tsx",
        "frontend/src/components/CashSessionModal.tsx",
        "frontend/src/App.css"
      ],
      "reassessment": "Voltar ainda pertence a sales-header-actions; relógio está em pos-clock. Mover sem retirar guardas/filial/fila.",
      "plannedTestId": "T-AJU-PDV-01",
      "testPlan": "Voltar fica ao lado do relógio em desktop e continua acessível a360px/zoom200%, sem perda do carrinho silenciosa. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PDV-02",
      "activity": "IP-2026-012",
      "module": "Frente de caixa",
      "request": "Centralizar o status de Online ou Offline.",
      "acceptance": "Indicador permanece central no espaço disponível; queda/reconexão e pendências mantêm texto e anúncio.\nReferências: QA21–31/36/37; DES001–003/SEC001–003 para operações. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/PointOfSalePage.tsx",
        "frontend/src/components/CashSessionModal.tsx",
        "frontend/src/App.css"
      ],
      "reassessment": "Indicador usa navigator.onLine e inclui pendências; centralizar preservando distinção entre conexão e confirmação.",
      "plannedTestId": "T-AJU-PDV-02",
      "testPlan": "Indicador permanece central no espaço disponível; queda/reconexão e pendências mantêm texto e anúncio. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PDV-03",
      "activity": "IP-2026-012",
      "module": "Frente de caixa",
      "request": "Se o caixa estiver aberto, o botão deve ficar vermelho, com o texto para fechar o caixa. Se estiver fechado, deve ficar verde, com o texto para abrir o caixa.",
      "acceptance": "Caixa confirmado aberto oferece Fechar; fechado oferece Abrir; clique não executa fechamento sem contado e permissão.\nReferências: QA21–31/36/37; DES001–003/SEC001–003 para operações. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/PointOfSalePage.tsx",
        "frontend/src/components/CashSessionModal.tsx",
        "frontend/src/App.css"
      ],
      "reassessment": "Botão atual mostra Caixa aberto e abre CashSessionModal. Texto/cores devem conduzir ao fluxo de fechamento, nunca fechar diretamente.",
      "plannedTestId": "T-AJU-PDV-03",
      "testPlan": "Caixa confirmado aberto oferece Fechar; fechado oferece Abrir; clique não executa fechamento sem contado e permissão. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PDV-04",
      "activity": "IP-2026-012",
      "module": "Frente de caixa",
      "request": "No modal de caixa aberto, incluir botões com ícones: Cancelar; Sangria (amarelo); e Suprimento (verde).",
      "acceptance": "Cancelar não grava; sangria/suprimento alteram caixa uma vez com valor/motivo e autorização; teclado e cores conferidos.\nReferências: QA21–31/36/37; DES001–003/SEC001–003 para operações. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/PointOfSalePage.tsx",
        "frontend/src/components/CashSessionModal.tsx",
        "frontend/src/App.css"
      ],
      "reassessment": "Fonte recuperada já tem sangria/suprimento e aprovação por alçada; acrescentar apresentação e cancelar sem remover guardas nem ampliar direitos.",
      "plannedTestId": "T-AJU-PDV-04",
      "testPlan": "Cancelar não grava; sangria/suprimento alteram caixa uma vez com valor/motivo e autorização; teclado e cores conferidos. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PDV-05",
      "activity": "IP-2026-012",
      "module": "Frente de caixa",
      "request": "Corrigir o quadro de quantidade do carrinho, que fica preto no modo claro.",
      "acceptance": "Campo legível nos temas claro/escuro, normal/foco/erro/desabilitado e contraste medido, QA36/37.\nReferências: QA21–31/36/37; DES001–003/SEC001–003 para operações. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/PointOfSalePage.tsx",
        "frontend/src/components/CashSessionModal.tsx",
        "frontend/src/App.css"
      ],
      "reassessment": "Inspecionar regra do input do carrinho nos dois temas; correção limitada ao estilo, mantendo conversão/limite por tipo.",
      "plannedTestId": "T-AJU-PDV-05",
      "testPlan": "Campo legível nos temas claro/escuro, normal/foco/erro/desabilitado e contraste medido, QA36/37. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-01",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Colocar título, botão de voltar, navegação e botões de ação alinhados em um cabeçalho.",
      "acceptance": "Título, voltar, navegação e ações alinhados em1366/1920; reflow sem sobreposição nas demais larguras.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-01",
      "testPlan": "Título, voltar, navegação e ações alinhados em1366/1920; reflow sem sobreposição nas demais larguras. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-02",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Deixar a navegação apenas com ícones, exibindo os nomes ao passar o mouse.",
      "acceptance": "Cada ícone tem nome acessível, tooltip por teclado e toque operável sem depender de hover.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-02",
      "testPlan": "Cada ícone tem nome acessível, tooltip por teclado e toque operável sem depender de hover. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-03",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Reduzir o tamanho do quadro dos cards na página de venda e colocar os 6 números lado a lado.",
      "acceptance": "Seis indicadores lado a lado em1366/1920; nomes/valores íntegros e reflow a360px/200%.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-03",
      "testPlan": "Seis indicadores lado a lado em1366/1920; nomes/valores íntegros e reflow a360px/200%. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-04",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Separar um pouco as opções (dia/mês) das opções (Volume...).",
      "acceptance": "Trocar período não altera métrica; trocar métrica não altera período; foco e leitura identificam ambos.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-04",
      "testPlan": "Trocar período não altera métrica; trocar métrica não altera período; foco e leitura identificam ambos. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-05",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Incluir a opção de ano no gráfico de barras.",
      "acceptance": "Somatórios anuais batem com meses e SQL filtrado; testar virada de ano e período sem registros.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "DailyProfitDashboardPage usa group day|month. Ano requer agregação pela timezone e cobertura SQL; não somar médias/percentuais como valores aditivos.",
      "plannedTestId": "T-AJU-DASH-05",
      "testPlan": "Somatórios anuais batem com meses e SQL filtrado; testar virada de ano e período sem registros. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-06",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Deixar a tabela e o gráfico lado a lado.",
      "acceptance": "Tabela e gráfico lado a lado no desktop, legíveis sem esconder colunas; empilhamento nas larguras menores.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-06",
      "testPlan": "Tabela e gráfico lado a lado no desktop, legíveis sem esconder colunas; empilhamento nas larguras menores. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-07",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Adicionar efeito hover e cores nos botões de ação.",
      "acceptance": "Ações de filtro/exportar/fórmulas distinguíveis por texto, foco e estado; cores não são a única informação.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-07",
      "testPlan": "Ações de filtro/exportar/fórmulas distinguíveis por texto, foco e estado; cores não são a única informação. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-08",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Aplicar mapa de calor nas colunas da tabela.",
      "acceptance": "Zero, negativos, todos iguais e outlier não distorcem legenda; valor numérico permanece legível em cinza.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Mapa de calor deve preservar números, legenda e comparação com zero/negativos/constantes; não declarar contraste apenas por inspeção CSS.",
      "plannedTestId": "T-AJU-DASH-08",
      "testPlan": "Zero, negativos, todos iguais e outlier não distorcem legenda; valor numérico permanece legível em cinza. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-09",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Corrigir as demais páginas do dashboard, além da página de venda, que não funcionam.",
      "acceptance": "QA32/35/36: cada vista carrega fixture própria; falha numa consulta não derruba outras; valor confrontado com SQL-base.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Fonte recuperada já contém OperationalAnalyticsDashboard e vistas stock/customers/categories. Reproduzir cada vista e contrato antes de substituir; não presumir defeito da baseline antiga.",
      "plannedTestId": "T-AJU-DASH-09",
      "testPlan": "QA32/35/36: cada vista carrega fixture própria; falha numa consulta não derruba outras; valor confrontado com SQL-base. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-10",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Colocar o botão de limpar filtros fora do modal e padronizar os botões.",
      "acceptance": "Limpar refaz consulta sem filtros residuais, descarta seleção incompatível e devolve estado indicado na tela.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Reutilizar componentes e contratos recuperados; validar cada vista com dados sintéticos, período, filtros e estado de erro independente. Inspeção estática não comprova funcionamento.",
      "plannedTestId": "T-AJU-DASH-10",
      "testPlan": "Limpar refaz consulta sem filtros residuais, descarta seleção incompatível e devolve estado indicado na tela. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-11",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Incluir exportação CSV dentro do quadro da tabela.",
      "acceptance": "Exporta além da página atual com mesma ordem/filtros e totais; texto iniciado por =,+,-,@ neutralizado; sem tenant alheio.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "DailyProfitDashboardPage já tem csv(); expandir para recorte completo e csvSafe. Distinguir limite da operação de paginação visual.",
      "plannedTestId": "T-AJU-DASH-11",
      "testPlan": "Exporta além da página atual com mesma ordem/filtros e totais; texto iniciado por =,+,-,@ neutralizado; sem tenant alheio. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-12",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Incluir exportação PDF da página.",
      "acceptance": "PDF gerado mostra filtros/data, valores íntegros e tabelas paginadas; ação disponível após dados; sem dependência paga.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Preparar impressão/exportação com layout paginado e filtros. PDF final deve ser inspecionado; não declarar PDF pronto a partir de CSS.",
      "plannedTestId": "T-AJU-DASH-12",
      "testPlan": "PDF gerado mostra filtros/data, valores íntegros e tabelas paginadas; ação disponível após dados; sem dependência paga. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-DASH-13",
      "activity": "IP-2026-013",
      "module": "Dashboard",
      "request": "Deixar as páginas sem scroll vertical ou horizontal.",
      "acceptance": "Sem scroll desnecessário no desktop padrão; nenhuma informação ocultada a200% ou360px para cumprir ausência de scroll.\nReferências: QA16/32/33/36/37 e CA19/28/35/36. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/DashboardHubPage.tsx",
        "frontend/src/pages/DailyProfitDashboardPage.tsx",
        "frontend/src/pages/ChannelDashboardPage.tsx",
        "frontend/src/App.css",
        "dataconnect/app/queries.gql"
      ],
      "reassessment": "Remover rolagem desnecessária no desktop; manter acesso por reflow/rolagem em mobile e zoom. Não usar overflow:hidden para esconder conteúdo.",
      "plannedTestId": "T-AJU-DASH-13",
      "testPlan": "Sem scroll desnecessário no desktop padrão; nenhuma informação ocultada a200% ou360px para cumprir ausência de scroll. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-01",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Colocar o botão de voltar ao lado do título.",
      "acceptance": "Voltar ao lado do título, nome acessível e funcionamento por teclado sem gravação involuntária.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-01",
      "testPlan": "Voltar ao lado do título, nome acessível e funcionamento por teclado sem gravação involuntária. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-02",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Posicionar a navegação na parte superior, entre os botões e o título.",
      "acceptance": "Navegação mantém vista e filtros previstos; não cria duplo scroll nem sobreposição.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-02",
      "testPlan": "Navegação mantém vista e filtros previstos; não cria duplo scroll nem sobreposição. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-03",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Colocar o botão de editar em amarelo, ao lado do botão de estornar.",
      "acceptance": "Sem seleção ações indisponíveis; com movimento elegível ambas visíveis; movimento de venda orienta Registro de Vendas.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Preservar edição existente sem redefinir identidade/histórico: AJU-EST-21 está excluído. Reposicionar e colorir ações; novos conflitos seguem ao CTO por item.",
      "plannedTestId": "T-AJU-EST-03",
      "testPlan": "Sem seleção ações indisponíveis; com movimento elegível ambas visíveis; movimento de venda orienta Registro de Vendas. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-04",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Deixar os botões de Transferir e Nova Movimentação em azul.",
      "acceptance": "Ambas azuis, rótulos/ícones preservados, estados hover/foco/desabilitado legíveis em claro/escuro.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-04",
      "testPlan": "Ambas azuis, rótulos/ícones preservados, estados hover/foco/desabilitado legíveis em claro/escuro. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-05",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Aplicar paginação na tabela.",
      "acceptance": "QA20:501 movimentos/201 transferências, registro antigo localizado/exportável; mudar filtro volta à página1 e total é correto.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "StockWorkspace ainda limita movimentos a300; paginação apenas client-side não satisfaz. Planejar consulta paginada/contagem/exportação com autorização por filial.",
      "plannedTestId": "T-AJU-EST-05",
      "testPlan": "QA20:501 movimentos/201 transferências, registro antigo localizado/exportável; mudar filtro volta à página1 e total é correto. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-06",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Aplicar ordenação ao clicar no cabeçalho da tabela.",
      "acceptance": "Asc/desc por data, produto, quantidade e custo funciona em mais de uma página e announce de sort.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Ordenar no servidor antes de LIMIT/OFFSET, com desempate estável porID e aria-sort. Não ordenar só os300 carregados.",
      "plannedTestId": "T-AJU-EST-06",
      "testPlan": "Asc/desc por data, produto, quantidade e custo funciona em mais de uma página e announce de sort. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-07",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Permitir selecionar mais de uma linha com Shift para estornar.",
      "acceptance": "Shift seleciona intervalo de registros visíveis; reversão idempotente autorizada, sem atingir linhas invisíveis nem misturar filiais.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Seleção atual é Movement|null; intervalo deve conter somente IDs visíveis/elegíveis. Revisar atomicidade, autorização e replay de estorno; sem alterar regra de edição excluída.",
      "plannedTestId": "T-AJU-EST-07",
      "testPlan": "Shift seleciona intervalo de registros visíveis; reversão idempotente autorizada, sem atingir linhas invisíveis nem misturar filiais. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-08",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Deixar a opção Saldo por último na navegação.",
      "acceptance": "Saldo é último visualmente e na ordem de teclado; nenhum handler muda de vista por índice.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-08",
      "testPlan": "Saldo é último visualmente e na ordem de teclado; nenhum handler muda de vista por índice. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-09",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Se houver apenas uma filial cadastrada, deixar o botão Transferir cinza e desabilitado para clique.",
      "acceptance": "Uma filial: botão cinza sem ação. Duas autorizadas: habilitado. Segunda filial proibida não habilita transferência.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Habilitação depende de duas filiais autorizadas, não duas filiais globais. Conferir backend com SEC-2026-001.",
      "plannedTestId": "T-AJU-EST-09",
      "testPlan": "Uma filial: botão cinza sem ação. Duas autorizadas: habilitado. Segunda filial proibida não habilita transferência. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-10",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Corrigir a coluna Status: está escrita em inglês e não há cores para diferenciar cada status.",
      "acceptance": "POSTED/REVERSED/PENDING etc têm rótulos e cores consistentes, sem alterar estado persistido.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-10",
      "testPlan": "POSTED/REVERSED/PENDING etc têm rótulos e cores consistentes, sem alterar estado persistido. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-11",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Remover a coluna Operação.",
      "acceptance": "Colunas restantes alinhadas e ID ainda acessível no detalhe; rastreabilidade e seleção por ID preservadas.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-11",
      "testPlan": "Colunas restantes alinhadas e ID ainda acessível no detalhe; rastreabilidade e seleção por ID preservadas. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-12",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Permitir selecionar mais de um card como filtro.",
      "acceptance": "Selecionar Baixo+Sem saldo retorna união, filial limita resultado e clique duplo no card alterna seleção sem perder contexto.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Balance já distingue physical/reserved/available e status low/high/empty/ok. Compor seleção em união e aplicar filial como interseção; não redefinir filtro de valor excluído.",
      "plannedTestId": "T-AJU-EST-12",
      "testPlan": "Selecionar Baixo+Sem saldo retorna união, filial limita resultado e clique duplo no card alterna seleção sem perder contexto. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-13",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Corrigir a box de movimentação, que não está batendo com a hora do dia.",
      "acceptance": "19/10 23:30 local persiste instante correto e volta igual; filtro virada do dia não desloca data.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "iso() usa toISOString().slice(0,16) em datetime-local: UTC apresentado como hora local. Corrigir entrada/serialização sem alterar timestamps históricos.",
      "plannedTestId": "T-AJU-EST-13",
      "testPlan": "19/10 23:30 local persiste instante correto e volta igual; filtro virada do dia não desloca data. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-14",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Na parte da NF, exibir a pergunta com “?” e trocar o flag por botões “Sim” ou “Não”.",
      "acceptance": "Sim mostra/exige dados da NF; Não omite no envio; alternância mantém política de rascunho e saída não habilita NF indevida.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-14",
      "testPlan": "Sim mostra/exige dados da NF; Não omite no envio; alternância mantém política de rascunho e saída não habilita NF indevida. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-15",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Fazer ajustes nos big numbers: Remover o big number de produtos.",
      "acceptance": "Card Produtos ausente e três/quatro indicadores restantes não deixam espaço quebrado; dados preservados.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-15",
      "testPlan": "Card Produtos ausente e três/quatro indicadores restantes não deixam espaço quebrado; dados preservados. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-16",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Fazer ajustes nos big numbers: Adicionar um big number de estoque alto.",
      "acceptance": "Produto em máximo exato não conta; máximo+0,001 conta quando pesável; máximo null/0 não gera alto.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Status high já existe com máximo>0 e quantity>maximum; apresentar contagem dedicada e provar limites, sem equiparar automático à especificação de valor excluída.",
      "plannedTestId": "T-AJU-EST-16",
      "testPlan": "Produto em máximo exato não conta; máximo+0,001 conta quando pesável; máximo null/0 não gera alto. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-18",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Fazer ajustes nos big numbers: Ordenar os indicadores: Valor / Baixo / Alto / Sem saldo.",
      "acceptance": "Ordem visual e DOM iguais; cada indicador bate com o recorte e mantém rótulo acessível.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-18",
      "testPlan": "Ordem visual e DOM iguais; cada indicador bate com o recorte e mantém rótulo acessível. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-19",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Fazer ajustes nos big numbers: Ao clicar no filtro, levar à página de Saldo.",
      "acceptance": "Clique Baixo muda a Saldo filtrado; voltar à navegação não perde filial nem mostra registro proibido.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-19",
      "testPlan": "Clique Baixo muda a Saldo filtrado; voltar à navegação não perde filial nem mostra registro proibido. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-20",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Corrigir a quantidade da movimentação: está crescendo em milésimos e a digitação está ruim.",
      "acceptance": "Apagar/colar 1,5 funciona para pesável; unitário rejeita fração sem truncar; 0 e negativo recusados ao confirmar.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Item.quantity é number com valor1; revisar rascunho textual e unidade/weightedProduct. Preservar precisão e validação backend.",
      "plannedTestId": "T-AJU-EST-20",
      "testPlan": "Apagar/colar 1,5 funciona para pesável; unitário rejeita fração sem truncar; 0 e negativo recusados ao confirmar. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-22",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Validar se o cálculo do saldo está sendo feito corretamente.",
      "acceptance": "QA17–19:entrada/saída/venda/estorno/transferência/reserva/cancelamento conciliam; não calcular saldo só dos300 registros.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Fonte já apresenta saldo físico/reservado/disponível e testesPOS; conciliar todas as origens com fixtures novas, sem inferir saldo dos movimentos limitados.",
      "plannedTestId": "T-AJU-EST-22",
      "testPlan": "QA17–19:entrada/saída/venda/estorno/transferência/reserva/cancelamento conciliam; não calcular saldo só dos300 registros. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-EST-23",
      "activity": "IP-2026-014",
      "module": "Estoque",
      "request": "Colocar o botão de limpar filtros fora do modal, ao lado da pesquisa.",
      "acceptance": "Limpar elimina filtros aplicados sem mudar filial indevidamente; consulta/total/CSV retornam ao mesmo recorte.\nReferências: QA17–20/33 e CA02/19/20/25/28; SEC001/002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/StockPage.tsx",
        "frontend/src/utils/stock.ts",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Revalidar StockPage e suas operações; manter saldo físico/reservado/disponível, autorização de filial e estorno idempotente. Nenhum requisito excluído é implementado por dependência.",
      "plannedTestId": "T-AJU-EST-23",
      "testPlan": "Limpar elimina filtros aplicados sem mudar filial indevidamente; consulta/total/CSV retornam ao mesmo recorte. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PROD-01",
      "activity": "IP-2026-015",
      "module": "Cadastro de produtos",
      "request": "Corrigir o campo de quantidade: está crescendo em milésimos e não permite escrever corretamente.",
      "acceptance": "Vazio durante edição, backspace/colagem/vírgula e limites; unitário inteiro, componente pela unidade do componente; não mudar máscara monetária.\nReferências: QA13/14/24 e CA07/26; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/MasterDataPage.tsx",
        "frontend/src/pages/ProductExtras.tsx",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Kit.quantity é number e inputstep=.001 converte Number em cada tecla. Rascunho textual deve permitir vazio/vírgula e validar unidade do componente.",
      "plannedTestId": "T-AJU-PROD-01",
      "testPlan": "Vazio durante edição, backspace/colagem/vírgula e limites; unitário inteiro, componente pela unidade do componente; não mudar máscara monetária. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-PROD-02",
      "activity": "IP-2026-015",
      "module": "Cadastro de produtos",
      "request": "Permitir cadastrar produtos com valor abaixo do custo, mas gerar um alerta bem explícito.",
      "acceptance": "Custo10/venda8 cadastra após aviso; cancelar não grava; negativo rejeitado; preço>=custo normal. Desconto do PDV continua sob regra própria.\nReferências: QA13/14/24 e CA07/26; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/MasterDataPage.tsx",
        "frontend/src/pages/ProductExtras.tsx",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "validate() em MasterDataPage bloqueia venda abaixo do custo. Trocar por aviso explícito com confirmação, mantendo preço não negativo e alçadas próprias doPDV.",
      "plannedTestId": "T-AJU-PROD-02",
      "testPlan": "Custo10/venda8 cadastra após aviso; cancelar não grava; negativo rejeitado; preço>=custo normal. Desconto do PDV continua sob regra própria. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-01",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Adicionar uma coluna Produtos à tabela, mostrando quantos produtos existem naquela categoria.",
      "acceptance": "Categoria com2 produtos e3 subcategorias mostra2, não6; zero e outra empresa não contaminam a contagem.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Category schema tem subcategoryCount, não productCount; query usa join subcategorias. Contar produtos separadamente para evitar multiplicação de joins.",
      "plannedTestId": "T-AJU-CAT-01",
      "testPlan": "Categoria com2 produtos e3 subcategorias mostra2, não6; zero e outra empresa não contaminam a contagem. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-02",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Incluir os seguintes campos/filtros no modal de pesquisa: Status.",
      "acceptance": "Ativo/Inativo/Todos considera páginas além da primeira; zero resultado e total ficam coerentes.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Filtroactive hoje age sobre items da página100; propagar ao servidor e contagem/exportação do mesmo recorte.",
      "plannedTestId": "T-AJU-CAT-02",
      "testPlan": "Ativo/Inativo/Todos considera páginas além da primeira; zero resultado e total ficam coerentes. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-03",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Incluir os seguintes campos/filtros no modal de pesquisa: Com ou sem produto.",
      "acceptance": "Com+Status filtra conjunto completo; categoria sem produto aparece em Sem; exportação repete filtro.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Produto exige productCount/EXISTS no servidor; não deduzir ausência a partir da primeira página.",
      "plannedTestId": "T-AJU-CAT-03",
      "testPlan": "Com+Status filtra conjunto completo; categoria sem produto aparece em Sem; exportação repete filtro. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-04",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Incluir os seguintes campos/filtros no modal de pesquisa: Com ou sem subcategoria.",
      "acceptance": "Categorias com/sem subcategorias corretamente localizadas inclusive fora da página; combinação AND com demais filtros.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "subcategoryCount existe; filtrocom/sem deve ser anterior à paginação e preservar semântica de subcategorias ativas/não excluídas explicitada na operação.",
      "plannedTestId": "T-AJU-CAT-04",
      "testPlan": "Categorias com/sem subcategorias corretamente localizadas inclusive fora da página; combinação AND com demais filtros. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-05",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Padronizar a paginação em todas as telas no formato “1–100 de 300 registros”.",
      "acceptance": "Fixture300 limita100:1–100/101–200/201–300; filtro reseta página e total deriva do servidor autorizado.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "PAGE_SIZE100 e hasNext=items.length===100 não fornecem total. Criar contador autorizado reutilizável e aplicar às listagens paginadas incluídas, mantendo carga limitada.",
      "plannedTestId": "T-AJU-CAT-05",
      "testPlan": "Fixture300 limita100:1–100/101–200/201–300; filtro reseta página e total deriva do servidor autorizado. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-06",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o texto do botão para “+ Nova Categoria”.",
      "acceptance": "Botão com texto exato só para canCreate; subcategoria recebe seu próprio rótulo.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-06",
      "testPlan": "Botão com texto exato só para canCreate; subcategoria recebe seu próprio rótulo. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-07",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o título do modal para “Nova Categoria”.",
      "acceptance": "Título solicitado na criação, ID mantido na edição e aria-labelledby conectado.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-07",
      "testPlan": "Título solicitado na criação, ID mantido na edição e aria-labelledby conectado. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-08",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o nome do campo do modal para “Nome da Categoria”.",
      "acceptance": "Rótulo exato em cada campo com ID único; leitor de tela diferencia itens do lote.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-08",
      "testPlan": "Rótulo exato em cada campo com ID único; leitor de tela diferencia itens do lote. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-09",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o placeholder do campo para “Ex.: Bebidas”.",
      "acceptance": "Placeholder exato, input inicialmente vazio e envio vazio é recusado.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-09",
      "testPlan": "Placeholder exato, input inicialmente vazio e envio vazio é recusado. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-10",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o texto do botão para “ADICIONAR OUTRA CATEGORIA”.",
      "acceptance": "Adiciona campo vazio e não grava até CADASTRAR; limite do lote não é burlado.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-10",
      "testPlan": "Adiciona campo vazio e não grava até CADASTRAR; limite do lote não é burlado. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-11",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Alterar o texto do botão Salvar para “CADASTRAR”.",
      "acceptance": "Texto exato; duplo clique/Enter durante gravação não duplica; erros preservam formulário.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "CatalogShell/BatchCategoryModal ainda usam textos genéricos e filtros locais; alterar somente o requisito, mantendo edição porID e permissões.",
      "plannedTestId": "T-AJU-CAT-11",
      "testPlan": "Texto exato; duplo clique/Enter durante gravação não duplica; erros preservam formulário. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-12",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Padronizar os nomes usando somente letras maiúsculas.",
      "acceptance": "Nome novo/alterado persiste maiúsculo com acentos; chamada direta não burla; igualdade normalizada testada.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Frontend usa trim().toUpperCase(); conferir escrita simples/lote/edição no servidor, sem reescrever registros antigos por migração implícita.",
      "plannedTestId": "T-AJU-CAT-12",
      "testPlan": "Nome novo/alterado persiste maiúsculo com acentos; chamada direta não burla; igualdade normalizada testada. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-13",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Remover espaços sobressalentes dos nomes.",
      "acceptance": "Espaços, tab e colagem viram nome canônico; conflito mostra categoria existente sem renomear histórico.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "trim() não colapsa espaços internos. Unificar canonização do nome novo/alterado e verificação de duplicidade, preservando palavras separadas.",
      "plannedTestId": "T-AJU-CAT-13",
      "testPlan": "Espaços, tab e colagem viram nome canônico; conflito mostra categoria existente sem renomear histórico. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-CAT-14",
      "activity": "IP-2026-016",
      "module": "Cadastro de categoria",
      "request": "Definir limite de caracteres.",
      "acceptance": "120 caracteres aceitos;121 recusados; Unicode/maiúsculas medidos pela regra consistente com PostgreSQL.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql"
      ],
      "reassessment": "Validar120/121 após canonização com Unicode/codepoints consistente entreJS/PostgreSQL; não truncar silenciosamente.",
      "plannedTestId": "T-AJU-CAT-14",
      "testPlan": "120 caracteres aceitos;121 recusados; Unicode/maiúsculas medidos pela regra consistente com PostgreSQL. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-01",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Adicionar uma coluna Produtos à tabela, mostrando quantos produtos existem naquela subcategoria.",
      "acceptance": "Duas subcategorias homônimas de pais distintos recebem suas próprias contagens; zero/ativo/inativo conferidos.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Subcategory schema não tem productCount. Associar contagem aoID da subcategoria/tenant, não ao texto.",
      "plannedTestId": "T-AJU-SUB-01",
      "testPlan": "Duas subcategorias homônimas de pais distintos recebem suas próprias contagens; zero/ativo/inativo conferidos. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-02",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Incluir no modal de pesquisa o filtro “Com ou sem produto”.",
      "acceptance": "Com/Sem/Todos funciona além da primeira página e permanece restrito ao tenant/categoria.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Com/semproduto requer filtro no servidor e total correspondente; pai/tenant não podem ser inferidos da página.",
      "plannedTestId": "T-AJU-SUB-02",
      "testPlan": "Com/Sem/Todos funciona além da primeira página e permanece restrito ao tenant/categoria. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-03",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o texto do botão para “+ Nova Subcategoria”.",
      "acceptance": "Texto exato e permissão de criação respeitada; categoria não recebe texto errado.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-03",
      "testPlan": "Texto exato e permissão de criação respeitada; categoria não recebe texto errado. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-04",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o título do modal para “Nova Subcategoria”.",
      "acceptance": "Título de criação exato; edição não muda ID nem promete criação.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-04",
      "testPlan": "Título de criação exato; edição não muda ID nem promete criação. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-05",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o nome do campo para “Nome da Subcategoria”.",
      "acceptance": "Rótulo exato e associação acessível; foco no campo correto após erro.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-05",
      "testPlan": "Rótulo exato e associação acessível; foco no campo correto após erro. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-06",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o placeholder para “Bebidas”.",
      "acceptance": "Placeholder visível só vazio; não é salvo como valor por abertura do modal.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-06",
      "testPlan": "Placeholder visível só vazio; não é salvo como valor por abertura do modal. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-07",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o texto do botão para “+ ADICIONAR OUTRA SUBCATEGORIA”.",
      "acceptance": "Texto exato; novo item vazio; limite20 e remoção de item continuam corretos.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-07",
      "testPlan": "Texto exato; novo item vazio; limite20 e remoção de item continuam corretos. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-08",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Alterar o texto do botão do modal para “CADASTRAR”.",
      "acceptance": "Clique duplo/Enter produz um lote, erro preserva dados e texto de edição continua contextual.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "BatchSubcategoryModal e consultas são reaproveitáveis; manter pai explícito, identidade da edição e permissão. Ciclo de vínculos/semelhança permanece fora.",
      "plannedTestId": "T-AJU-SUB-08",
      "testPlan": "Clique duplo/Enter produz um lote, erro preserva dados e texto de edição continua contextual. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-09",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Remover espaços desnecessários dos nomes.",
      "acceptance": "BE B I D A não é unido; apenas espaços excedentes colapsam; duplicata canônica na mesma categoria recusada.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Canonização de whitespace deve ser a mesma em simples/lote/edição e preservar limites de palavras.",
      "plannedTestId": "T-AJU-SUB-09",
      "testPlan": "BE B I D A não é unido; apenas espaços excedentes colapsam; duplicata canônica na mesma categoria recusada. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-10",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Padronizar os nomes usando somente letras maiúsculas.",
      "acceptance": "Maiúsculas persistidas por chamada normal/direta/lote; produto e histórico mantêm referências.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Revalidar maiúsculas no servidor; normalização no input não protege chamada direta.",
      "plannedTestId": "T-AJU-SUB-10",
      "testPlan": "Maiúsculas persistidas por chamada normal/direta/lote; produto e histórico mantêm referências. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-11",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Definir limite de caracteres.",
      "acceptance": "120 aceito/121 negado; mesmo comportamento na criação simples/lote/edição.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Mesma regra120/121 da categoria e consistência por Unicode; sem truncamento silencioso.",
      "plannedTestId": "T-AJU-SUB-11",
      "testPlan": "120 aceito/121 negado; mesmo comportamento na criação simples/lote/edição. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-13",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Não sugerir automaticamente uma subcategoria logo ao abrir o modal.",
      "acceptance": "Abrir novo não seleciona pai; edição conserva pai real; envio sem escolha falha sem gravar.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Rascunho inicial já tem categoryId vazio, mas adicionar outra linha usa categories[0]?.id. Corrigir também inclusão de linha sem alterar pai real na edição.",
      "plannedTestId": "T-AJU-SUB-13",
      "testPlan": "Abrir novo não seleciona pai; edição conserva pai real; envio sem escolha falha sem gravar. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    },
    {
      "id": "AJU-SUB-14",
      "activity": "IP-2026-017",
      "module": "Cadastro de subcategoria",
      "request": "Impedir duas subcategorias de mesmo nome dentro de uma mesma categoria. Permitir nomes iguais de subcategorias em categorias diferentes.",
      "acceptance": "Mesmo nome no mesmo pai falha incluindo duas sessões; em outro pai passa; reativação não cria colisão.\nReferências: QA15/16 e CA05/06/09/19/21; SEC002. Execução futura; não testado pelo parecer estático.",
      "sourceCommit": "888234283376bfa1145ac913031d827af2c40a74",
      "sourcePaths": [
        "frontend/src/pages/CatalogPages.tsx",
        "dataconnect/app/queries.gql",
        "dataconnect/app/mutations.gql",
        "dataconnect/schema/schema.gql"
      ],
      "reassessment": "Conferir unicidade por tenant+category+nomecanônico inclusive concorrência/reativação. NOT EXISTS isolado não prova proteção em duas sessões; revisar constraints/estratégia transacional.",
      "plannedTestId": "T-AJU-SUB-14",
      "testPlan": "Mesmo nome no mesmo pai falha incluindo duas sessões; em outro pai passa; reativação não cria colisão. Registrar positivos, negativos, permissão/tenant e evidência visual quando aplicável.",
      "status": "Preparado; implementação aguarda revisão técnica da base",
      "implementationCommits": [],
      "testEvidence": [],
      "independentReview": null,
      "arthurAcceptance": null
    }
  ]
}
```

## Validação e entrega final

1. Obter os pareceres técnicos independentes doPR18 noSHA88823428 e tratar ressalvas que afetem a base.
2. Implementar em commits por IDs; registrar no campo implementationCommits somente commits que alterem ou validem de fato o requisito. Registrar cobertura reaproveitada com resultado novo, sem atribuir teste prévio a comportamento novo.
3. Ao mudar operação/schema, compilar oDataConnect e regenerar ambosSDKs pelas ferramentas; não editar gerados à mão. Considerar compatibilidade e migrações aditivas, sem execução cloud nesta preparação.
4. Executar regressão integrada emNode22: frontend/Functions/scripts, lint/tipos/builds, contratos SQL com fixtures autorizadas e isolamento. Conferir manifestos, árvorelimpa, hashes deartefatos, sourceQA e segredo estático noSHAfinal.
5. AG-03 revisar Segurança e AG-04 executar navegadorreal: teclas/foco/inert/busy/retorno, temas, mobile ezoom, filtros multi-página/CSV/PDF, venda/caixa/estoque e conciliação com dados sintéticos. MockAuth não comprova auth/backend ativo; registrarlimites.
6. CTO avalia componentes e aprova expressamente a versão final. Somente depois publicar eminsightpad-dd-dev, executar smoke técnico e entregar aArthur a validação consolidada dos68. Não marcar aceiteArthur com base emCI.

Sem merge automático, deploy imediato, produção, migração destrutiva, nova despesa ou envio real de recuperação de senha. Revisões imutáveis dobackend e commit deHosting permanecem não comprovados até evidência específica.
