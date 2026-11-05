# Dashboards v3 — integração frontend DEV

## Origem, alvo e estado desta entrega

Pacote aprovado de Arthur/CTO: `InsightPad_Dashboards_Implantacao_DEV_v1.zip`, SHA256 `928e60fe2ee26fbc21a5ac0da170a4b50c31455a543c6ed9404411f24063b19e`. Os 76 arquivos do manifesto foram conferidos. O PDF anexado e o PDF do pacote têm o mesmo texto extraído. O protótipo serviu exclusivamente para comparação visual.

Base conferida: `agent/login-visual-v2`, `b753891db86b3219e9f11cc113405a83bf3fedb5`. Os cinco arquivos originais fornecidos no pacote correspondiam byte a byte à base. Branch isolada desta implementação: `agent/dashboard-visual-v3`; o candidato publicável será o SHA exato aprovado pelo CI, sem merge ou alteração de PROD. Checkouts anteriores preservados.

Último estado DEV comprovado pelo recibo fornecido P47R, em 04/11/2026: frontend b753891, versão Hosting `a7f9d9526cc5fb29`, release `1793791765554000`. Isso é uma baseline histórica, não uma consulta atual ao serviço. Uma operação de publicação precisa verificar novamente o estado remoto antes de gravar.

Este documento acompanha o código. O recibo operacional externo identifica o SHA congelado, o CI observado e eventual publicação. Não se deve inferir deploy, login real, aceitação financeira ou atualização da CORE a partir de build/fixtures.

## Resultado implementado

Os controladores existentes consultam as mesmas operações reais e passam seus resultados aos adaptadores de apresentação. Não foram importados `shell.js`, Shadow DOM, `AppLayout` demonstrativo, mock API ou números do protótipo no produto.

| Vista | Subpáginas | Conteúdo preservado |
| --- | --- | --- |
| Vendas | Visão geral; Produtos; Comparativos | 6 KPIs; evolução financeira; distribuição por categoria; tabela de 10 colunas e totalizadores; último mês/média de volume e lucro |
| Canais | Visão geral; Lojas e taxas; Pagamentos e produtos | 9 KPIs distribuídos entre subpáginas; evolução; lojas; taxas; pagamentos; produtos; quantidades com até 3 casas |
| Estoque | Visão geral; Produtos | 6 KPIs; evolução mensal; tabela completa de movimentação por produto |
| Clientes | Visão geral; Relacionamento; Regiões | 5 KPIs; Curva ABC; regiões; aniversariantes; clientes sem comprar; todos os registros |
| Categorias | Categorias; Subcategorias | 5 KPIs; comparação em barras por métrica; duas tabelas de 7 colunas, mantendo os níveis separados |

As 13 subpáginas organizam a tela sem criar rotas ou autorizações novas. O celular alterna painéis sem descartar dados. A rolagem das tabelas permite alcançar linhas e colunas completas; telas baixas por zoom usam fluxo interno com controles acessíveis. Os seis WebP aprovados decoram os cards no desktop, com transparência; ficam ocultos no mobile.

As ações usam nomes acessíveis, foco e tooltips. Os modais continuam usando `DateRangePicker`, `SearchableMultiSelect` e os helpers existentes de isolamento/foco. Detalhes da análise reúne período, filtros, atualização, fórmulas e distinções de significado.

## Preservação e decisões de integração

- As construções JSX de `.legacy-header` e `.ip-top` são byte a byte iguais à base. Permanecem logo, destinos, módulos, título dinâmico, empresa real, tema, permissões e Conta e sistema.
- `.app-stage` continua filho direto de `AppLayout`, com seu `Outlet` existente. `DashboardPage.tsx`, o novo login, Auth, domínio, SQL, SDKs e lockfiles não são alterados pelo lote.
- Foi retirado somente `.ip-bottom`, sua linha da grade e as reservas antigas relacionadas. Não existe regra que esconda todo `footer`. Ações de modais, relatórios, tabelas e assinatura do login permanecem.
- Continua havendo uma única instância de `ChannelOrderNotifier` em `AppLayout`. Um portal move somente o botão compacto para o cabeçalho local. O hook escolhe um destino do dashboard ou cabeçalhos já existentes; na home usa o canto da área de marca. Ele não remonta a instância do notifier.
- O verificador inverte exclusivamente os quatro pontos de plumbing do portal e exige igualdade integral do notifier original. Polling, identidade da aba, leases, preferências, áudio, permissões, contadores, seleção de pedido, guardas, confirmação de leitura, aceite/recusa e overlays permanecem originais.
- A cobertura usa pedido sintético e confirmação somente em memória. Nenhuma integração é ativada. Teste de áudio não comprova reprodução audível em computador físico.
- A quebra responsiva do relógio do PDV foi comparada com a base no mesmo viewport/data: a geometria existente é igual. A asserção antiga de linha única foi ajustada para aceitar a quebra já presente, exigindo visibilidade e ausência de sobreposição. O componente/estilo funcional do PDV não foi modificado por esse motivo.

## Contratos, estados e exatidão

`financialIndicatorsDashboard`, `SalesChannelAnalyticsDashboard` e `OperationalAnalyticsDashboard` mantêm nomes, variáveis, filtros, `requestKey` e tratamento existente de erro/carregamento. O verificador compara os loaders normalizados contra b753891; só permite adicionar o horário de recebimento para apresentação. As guardas de descarte de respostas antigas permanecem onde já existiam; não se declara uma guarda nova no controlador de Canais.

Os métodos financeiros de aplicação, métricas e seleção de período são comparados com a base. Seleção de produto preserva as outras dimensões e permite combinação explícita. O período selecionado continua sendo um único intervalo contíguo suportado pelo endpoint. Agrupamento, métricas e ordenação não são reinicializados por limpar filtros.

A seleção ABC usa a classe recebida, não uma reclassificação calculada na interface. A, B e C mostram contagens reais da tabela recebida; clique e Ctrl/Command/combinação móvel recortam só a tabela e seu CSV. KPIs gerais e impressão completa permanecem independentes. Limpar remove a seleção local e mantém a ordenação.

Centavos inteiros permanecem texto/BigInt para valores exibidos, totais, comparação exata e CSV. Números aproximados existem apenas na geometria dos gráficos. A ordenação de centavos maiores que `Number.MAX_SAFE_INTEGER` e a soma do total impresso foram cobertas com valores que diferem por um centavo.

O gráfico separa eixos de moeda/quantidade; lacunas não são ligadas por uma série inventada. Categorias e subcategorias não são somadas. As barras ordenam faturamento/lucro por seus centavos originais, mantêm o sinal e usam magnitude somente no comprimento. Roscas não desenham distribuição inválida com negativos.

Diferenças explícitas do protótipo que o contrato atual não oferece:

1. Comparativos mostram último mês fechado e média; não há série de meses individuais inventada.
2. Não há reconstrução produto × dia com agregações separadas.
3. Filial e conexão de Canais continuam singulares; não são enviados arrays.
4. Cliques de período não agrupam dias descontínuos em um intervalo maior.
5. Lucro após taxas não é chamado de lucro líquido contábil; saldo de movimentação no período não é apresentado como posição atual de estoque.

Essas limitações só mudam com dados/decisão adicionais, fora deste lote.

## Exportações e impressão

`financialCsv`, `csvSafe` e o helper genérico de download permanecem originais. A tabela financeira entrega ao helper os objetos originais na ordenação exibida, sem serializar números de desenho. O CSV genérico preserva suas unidades, colunas, quantidades e convenções de moeda/sinal; uma representação própria para exportação evita que a nova aparência dos nomes ou a formatação visual alterem o contrato do arquivo. Os controles e handlers conferem permissão, carregamento e disponibilidade de dados; tabelas vazias não exportam.

`DashboardPrintReport.tsx` mantém o relatório original completo, separado da apresentação de tela. Não contém botões ou handlers duplicados. O verificador compara todos os mapeamentos originais `rows`, `headers` e `columns` de Canais/Operacional com a base. O relatório financeiro conserva os cards, comparativos, evolução, dez colunas, totais, filtros e aviso de conciliação provisória. A seleção local ABC, subpágina ou painel móvel não reduz o conteúdo impresso.

O CSS original de impressão foi preservado. O novo wrapper tem padding neutro na impressão para evitar duplicação de espaço e página final vazia. Os testes usam o renderizador PDF do Chromium e análise independente por Poppler; não simulam uma conferência humana do diálogo nativo da impressora.

## Verificação e rastreabilidade

Testes dirigidos e padrão do frontend cobrem modelos imutáveis, classes ABC, combinação, limpeza, ordenação Int64, centavos, exportação bloqueada com tentativa de contornar botão desabilitado, resposta financeira antiga, independência entre filtros/agrupamento/métricas, tabelas completas e datasets grandes de clientes. A fixture de alertas existe somente em `frontend/qa`, protegida pelo build QA isolado.

O runner existente recebe as provas `dashboard-v3.mjs` e `dashboard-v3-zoom.mjs` no fluxo completo do CI. A matriz exige os seis tamanhos aprovados, dark/light, cinco vistas, 13 subpáginas, painéis móveis, última linha/coluna, imagens, modais e ausência de rolagem externa. A comparação local com b753891 registra também geometria e estilos computados das duas barras. O teste de zoom usa `chrome.tabs.setZoom/getZoom`, separado de viewport emulado, escala CSS e DPR.

Os testes de relatórios verificam dez PDFs, preto sobre fundo claro nos dois temas, todos os 65 clientes ABC, 51 aniversariantes e 1.201 clientes sem comprar, paginação final e ausência de `NaN`/`undefined`. Os consumidores financeiros mantêm oráculos independentes do ledger, arquivos CSV reais, recorte e limpeza, dados vazios, falha local, permissões e teclado.

As suites existentes não foram desativadas. Seletores antigos foram adaptados às subpáginas; o conteúdo original de impressão não é usado como substituto de prova da nova tela. A única exceção deliberada é a comparação do formato do CSV de Canais contra as células do relatório original completo, além do oráculo independente de valores do ledger. O novo heatmap é testado na tabela visível.

Capturas, PDFs, logs e manifests completos ficam em diretório privado, fora de `public`/`dist` e dos arquivos públicos do Hosting. O CI mantém o mecanismo existente de cifrar as evidências antes de upload. Imagens de QA são identificadas como fixtures; não comprovam sessão autenticada ou dados remotos.

## Publicação, reversão e itens pendentes

A autorização vigente permite publicar DEV após os gates, sem nova aprovação de rotina. O executor deste lote não tem sessão Google Cloud utilizável e a rede bloqueia consulta direta ao Hosting/cliente público. Não se pede senha/token. A operação preparada para Cloud Shell deve reutilizar o procedimento restrito de Hosting, conferir o SHA/CI e build normal com a configuração pública real DEV, snapshots atuais, nove contenções, backend compatível, release anterior e rollback utilizável.

Somente arquivos necessários do frontend devem ser enviados. A configuração servida, cabeçalhos, rewrites e pinagens são preservados exatamente. Não usar o build QA nem um comando genérico de deploy que alcance Functions. Não incluir banco, connector, schema, migração, IAM, API ou reativação de serviços.

Antes/depois de publicar: conferir a release e todos os hashes dos arquivos públicos, `/login`, marcador público de versão, configurações e contenções. Diante de resultado remoto incerto, consultar o recibo/estado em vez de reenviar. Reversão cria uma release da versão anterior de Hosting, somente se a live ainda for a publicada por esta operação e o backend continuar compatível. Nunca fazer limpeza de backups/recursos por consequência.

O último envelope conhecido era US$4,25, teto autorizado US$5; é planejamento acumulado, não custo faturado. Uma reserva adicional deve caber no saldo do envelope e ser registrada. Não se afirma bloqueio automático de cobrança.

Após publicação são indispensáveis smokes autenticados com o acesso existente (login/renovação, navegação, Conta e sistema, temas, filtros, tabelas, modais e alertas). Nenhuma nova movimentação financeira/estoque ou ativação iFood é autorizada por esta integração. Aparelho físico, leitor de tela real, saída audível e diálogo físico da impressora permanecem limitações explícitas.

CORE: sem ferramenta de escrita disponível. O delta estruturado deste lote deve ser acrescentado ao histórico, com recibo real e SHA de CI, sem sobrescrever registros anteriores. **CORE não gravada.**

Não refazer a migração de sessão, SQL/ACL, o login aprovado, as duas barras, o contrato do backend, auditorias globais não afetadas ou suítes já aprovadas de outra base apenas para confirmar recebimento. Esses trabalhos são baseline; as novas mudanças exigem as verificações por impacto e o CI obrigatório deste candidato.
