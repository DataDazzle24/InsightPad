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
