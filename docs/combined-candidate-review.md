# Candidato combinado — PRs #15 e #16

Branch isolada: `agent/ip-2026-008-018-candidate`. Integra o conteúdo do PR #15 (`09197d09715d9decd8f30ab479f4143a40ee07e0`) e do PR #16 (`c269ecc77e60459893adee27bd2565ab442f1c71`), ambos derivados da baseline de trabalho aprovada `8f4bc9191f9e3597ffe858415b712b67b816c53d`. Nenhuma dessas referências comprova a versão publicada em DEV. Não há merge nas branches-base nem deploy.

O SHA revisável é o HEAD desta branch, registrado no PR e na CORE. Use o run de **push** desse SHA. Um run de `pull_request` pode testar um merge sintético diferente; seus artefatos não identificam automaticamente o HEAD do candidato.

## Execução e artefatos

Node 22. CI instala pelos lockfiles e executa 2 testes do manifesto, lint, 62 testes de frontend, tipos/build de frontend, tipos, 119 testes e build de Functions. Também compila o harness de revisão. Não utiliza credenciais de nuvem, OIDC ou comandos de deploy; token limitado a `contents: read`; actions fixadas por SHA.

O run publica `candidate-manifest-<SHA>` e `recovery-qa-<SHA>`, por 14 dias. O manifesto distingue candidato de componentes publicados e mantém aprovação de deploy nula. `qa-source.json` identifica o SHA do harness e `auth: mock`. O artefato de QA não é o frontend de produção nem deve ser publicado no Hosting.

## AG-04 — navegador real, sem recuperação real

Em checkout limpo do SHA informado, com Node 22:

```sh
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build:qa
node scripts/serve-recovery-qa.mjs
```

Abra `http://127.0.0.1:4174/qa/recovery.html` em navegador real no mesmo computador. Alternativamente, extraia o artefato `recovery-qa-<SHA>` para `artifacts/recovery-qa` do checkout e execute apenas o servidor. Confira `qa-source.json` e o SHA exibido. O servidor escuta somente em loopback; não há preview remoto ou deploy implícito.

O harness utiliza os arquivos reais `LoginPage` e `ModalDialog`, com `AuthContext` simulado. O build rejeita módulos Firebase/AuthProvider; CSP bloqueia conexões e submissões de formulário. Login real está desativado. Use e-mail fictício, sem senha real. Tema, resultado sintético e atraso são escolhidos antes de abrir o modal. Recolha o painel de QA para avaliar layout. Fontes externas podem ser requisitadas pelo CSS; nenhuma operação Auth é executada.

| Conferência | Evidência a registrar na CORE |
| --- | --- |
| Abrir recuperação | Foco inicial no e-mail, nome acessível, leitor de tela se disponível |
| Tab / Shift+Tab | Ciclo dentro do diálogo, incluindo extremos; fundo sem foco nem interação |
| Escape / fechar / retorno | Fecha quando ocioso e devolve foco ao acionador; segundo Escape em diálogos aninhados fecha somente o superior |
| Envio pendente por 60 s | Escape, fechar e submissão adicional bloqueados; contador permanece em 1; após resolução, retorno de foco correto |
| Sucesso e falha simulados | Mensagem genérica, sem revelar existência de conta; nova tentativa após falha |
| Temas, mobile, zoom | Claro/escuro, viewport 320/375 px, zoom 200% e 400%, conteúdo e foco visíveis, rolagem utilizável |

Registrar SHA, navegador/versão, viewport, zoom, passos, resultado e evidências; retornar parecer em texto. Testes DOM usam shim de `showModal` e não comprovam comportamento nativo do top layer, foco, inert ou layout. Esses pontos continuam dependentes de AG-04.

## AG-03 — segurança

Revisar workflow/permissões/actions, lockfiles e inclusão de jsdom apenas como dependência de desenvolvimento; guardas síncronas contra duplo envio/fechamento pendente, cancelamento nativo e isolamento de diálogos aninhados. Conferir o build de QA e sua separação do build padrão. Revisar compatibilidade conforme `dev-frontend-compatibility.md`, incluindo operações, autorização por tenant/papel, idempotência e políticas/aprovações do PDV. Os testes mockados não demonstram autorização no backend.

Registrar parecer, evidências, SHA e pendências na CORE e retornar em texto. Não há parecer independente de AG-03/AG-04 produzido pelo desenvolvedor. Mesmo CI verde não libera Hosting: há divergência funcional comprovada no PDV publicado. Próximo gate: revisões independentes e avaliação do CTO da versão e de cada componente.
