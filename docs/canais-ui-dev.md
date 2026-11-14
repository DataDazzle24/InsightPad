# Canais: integração visual em DEV

Base: `68abdac1ca10e30e953c626ebefc58cd89216666`, branch `agent/estoque-registros-ui-dev`. A referência de Hosting recebida para essa base é a versão `484ead9c40be1846`; o publicador deve conferir a release corrente novamente. Branch de integração: `agent/canais-ui-dev`.

## Implementação

O patch de apresentação aprovado aplica-se a cinco arquivos de produto: `frontend/src/App.tsx`, `frontend/src/pages/ChannelOrdersPage.tsx`, `frontend/src/pages/SalesChannelsPage.tsx`, `frontend/src/pedidos.css` e `frontend/src/conexoes.css`. Os imports seguem `estoque-registros.css`. As regras permanecem em `@media screen`, sob `.work-orders` e `.work-connections`, sem alteração do shell, submenu, alerta global, Cadastros, Estoque/Registros, PDV ou impressão.

Pedidos conserva o detalhe expandido, quatro indicadores, oito colunas, status vigente separado da solicitação do parceiro, bloqueios de aceite, motivos, quatro variantes de separação e vínculo com saldo insuficiente. Gestão conserva as três abas, oito/nove colunas, diagnóstico, autorização, horários/pausas e os formulários de catálogo. Histórico permanece exclusivo do Administrador da Plataforma; retentativa elegível e reconciliação de resultado incerto seguem regras distintas.

Não há alteração de operações, contratos, validações, timers, permissões, banco, SDK, Functions, IAM ou dependências. Não reativar integração ou recursos contidos para validar aparência. A revisão dos estados reais do parceiro permanece separada dos testes sintéticos.

## Verificação reproduzível

Com Node 22 e dependências dos lockfiles:

```bash
node scripts/verify-reconciliation.mjs --working-tree
node scripts/verify-interface.mjs
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run test:qa
npm --prefix frontend run build:qa
# O build normal exige a configuração pública REAL de DEV:
npm --prefix frontend run build -- --mode development
node scripts/qa-browser/run.mjs --canais
```

`verify-canais.mjs` comprova escopo exato, prefixos das funções (efeitos, consultas, handlers, timers e validações), tipos, atributos de negócio e payloads idênticos à base. Somente depois dessa prova os verificadores históricos de Estoque/Registros e Cadastros recebem a visão anterior dos arquivos autorizados. Todos os testes anteriores continuam ativos. O único ajuste do workflow é ampliar o timeout de 30 para 40 minutos para a cobertura acrescida.

O cenário Canais usa componentes reais e fixture opt-in da aplicação QA, com rede externa bloqueada. Confere temas claro/escuro em 1440×900, 1280×800, 390×844 e 320×568; zoom nativo pela API `chrome.tabs.setZoom/getZoom` a 100% e 200%; regiões de tabela, foco, Tab/Shift+Tab/Escape, fila versus confirmação, perfis, diálogos e downloads. Não comprova autenticação, regras implantadas nem interação real com o iFood. A fixture não integra o build de produto. Evidências do CI saem do runner somente criptografadas, conforme o processo existente.

## Aceite com sessão autenticada em DEV

Executar e registrar os 33 casos da matriz recebida com massa e perfis autorizados. Priorizar fila versus confirmação, permissão de Histórico e URL, retentativa versus reconciliação, três CSVs com filtros, validação de identificador/preço e horários/pausas. Comparar navegação global, alerta, Cadastros, Estoque/Registros e PDV. Somente disparar gravações ou operações externas dentro dos casos expressamente autorizados e das contenções vigentes.

## Publicação e reversão

Publicar apenas Hosting `insightpad-dd-dev`, após CI completo aprovado para o SHA exato e preflight fresco de identidade, permissões, base live, configuração de serviço, backend e contenções. Preparar reversão para a versão anterior utilizável, preservar configuração e rewrites e verificar artefato servido e contenções após a release. Manter recibo privado antes de cada mutação. Em timeout, consultar o recibo e a release; não repetir uma publicação com mutação registrada. Nenhum merge ou deploy de PROD é incluído.

Reversão de código: reverter o commit da integração. Reversão de Hosting: somente após conferir a versão live atual, a versão anterior e as contenções, sem modificar backend, banco, IAM ou serviços do parceiro.
