# Gestão da Plataforma: apresentação aprovada

Base: `7bc4aec60d5455c6a8e6c7cb95f537f196cac6e8` (`agent/canais-ui-dev`), também identificada no recibo da publicação P53. Branch de integração: `agent/plataforma-ui-dev`. Esta execução entrega código e evidências para revisão; publicação hospedada, merge e PROD ficam fora do escopo do pacote recebido.

## Produto e preservação

Cinco arquivos de produto: `frontend/src/App.tsx`, `frontend/src/pages/PlatformAdminPage.tsx`, `frontend/src/components/PlatformBillingPanel.tsx`, `frontend/src/components/PlatformPermissions.tsx` e `frontend/src/plataforma.css`. O import segue `conexoes.css`. Adaptação visual ao patch: restaurar a família Material Symbols Rounded e a ligatura da lupa no seletor local `.work-platform .platform-search > .material-symbols-rounded`, pois a regra compartilhada de rótulos substituía a fonte e exibia a palavra search. Estilos globais não foram modificados. Estilos exclusivamente em `@media screen`, sob `.ip-ui[data-theme] .work-platform`.

O patch mantém a célula `td` como `table-cell`; botões consecutivos usam margem lógica de 6 px. Os dois NavLinks de Gestão de usuários foram movidos juntos para o cabeçalho: alinhamento à direita na linha do título em desktop e abaixo dele até 640 px, acima dos indicadores. As quatro vistas conservam tabelas, colunas, paginação e rolagem interna. Matriz ganha região nomeada, `aria-busy` e anúncio ligado ao estado `saving` existente.

Handlers, consultas, contratos, valores em centavos, versões, chaves de idempotência, validações, papéis, dependências de Acessar, auditoria e hooks de diálogo são preservados. `verify-plataforma.mjs` compara imports/tipos/constantes, prefixos completos das funções, atributos de negócio e condições de elegibilidade com a base. Depois dessa prova, os verificadores históricos recebem a visão anterior apenas dos arquivos autorizados. Nenhum teste anterior foi removido. Uma espera dirigida pelo primeiro registro da segunda página foi acrescentada ao teste de Canais após uma leitura prematura de 50 linhas no CI; a asserção original de 11 linhas permanece. A fonte do produto e do teste original coincide com a base; a janela foi reproduzida na base intacta com agendamento de efeito controlado (cinco execuções naturais passaram). Nenhum schema, SDK, dependência, workflow, autenticação, shell, submenu ou módulo vizinho foi alterado.

## Validação reproduzível

Com Node 22 e dependências dos lockfiles:

```bash
node scripts/verify-reconciliation.mjs --working-tree
node scripts/verify-interface.mjs
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run test:qa
npm --prefix frontend run build:qa
# O build normal usa somente configuração pública REAL de DEV:
npm --prefix frontend run build -- --mode development
node scripts/qa-browser/run.mjs --plataforma
```

O CI existente executa todos os gates e a nova prova dentro de `--full`. Não publica o produto. A fixture é opt-in da entrada QA, com rede externa bloqueada, e não integra o build normal. Usa componentes React reais e massa sintética para testar layout, payloads e comportamento de interface; não comprova identidade, autorização, auditoria ou atomicidade implantadas no backend.

Medições: claro/escuro em 1440×900, 1280×800, 390×844 e 320×568; zoom nativo 100%/200% pela API `chrome.tabs.setZoom/getZoom`; largura CSS resultante, distância entre botões, posição das abas, última linha/coluna, formulários, foco, Tab/Shift+Tab/Escape e camadas sobrepostas.

As provas financeiras sintéticas cobrem baixa parcial/integral, limite de saldo, conflito, criação/edição com versão, histórico e estorno. No cenário de confirmação perdida após persistência sintética, o cliente conserva o feedback de falha e o formulário: uma tentativa e um efeito modelados. Não se executa nova tentativa nesse estado. Esse cenário preserva o comportamento anterior e não atesta idempotência de retentativa nem confirmação real no backend. Validar a reconciliação por recarga e o estado confirmado com massa autorizada antes do aceite autenticado.

## Aceite e reversão

Registrar os 20 cenários da matriz recebida separando provas isoladas de testes autenticados em DEV. Conferir conta atual/ambiente protegido, UID somente leitura, perfis dependentes da empresa, gravação imediata e recuperação da matriz, consentimento, suspensão administrativa e concorrência financeira. A proteção da conta atual permanece no contrato de servidor; a interface conserva o envio e o tratamento de rejeição existentes.

O executor não possui sessão autenticada de DEV; não produzir novas movimentações financeiras nem reativar integração para demonstrar aparência. As evidências de navegador são sintéticas e identificadas como tal. O Hosting conserva a revisão já publicada de Canais.

Para reversão de código, reverter o commit isolado da integração. Antes de commit, a checagem reversa do patch recebido identifica correspondência integral; preservar os modos `100644` do repositório apesar dos modos `100755` presentes nos arquivos exportados. Não há implantação hospedada ou migração a reverter nesta execução.
