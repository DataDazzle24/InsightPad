# IP-2026-018 / BUG-2026-001 — recuperação de acesso

Recorte DEC-012, baseline de trabalho DEC-011:
`8f4bc9191f9e3597ffe858415b712b67b816c53d`.

## Causa e alteração

`LoginPage` apresentava um `section role=dialog` sem gestão de foco ou fechamento
por Escape. O hook legado seleciona diálogos globalmente, sem ref explícita; ele
não foi alterado e seus outros consumidores não foram migrados.

O novo `ModalDialog` usa `HTMLDialogElement.showModal()` e ref por instância. A
camada modal nativa torna o fundo inerte e controla navegação de foco/diálogos
aninhados. O cancelamento nativo (Escape) é encaminhado ao estado React, sem
propagar ao diálogo externo. O e-mail recebe foco inicial; ao desmontar, o foco
volta ao acionador ainda conectado após o commit React, quando ele já foi
reabilitado. Isso também cobre sucesso/falha assíncronos e Strict Mode.

Durante envio, Fechar/Cancelar, troca de método, input e envio ficam indisponíveis;
Escape não fecha. Ref de envio impede duplicidade inclusive antes de um novo
render. A resposta continua genérica para sucesso/falha e SMS continua indisponível.
Nenhum envio real de recuperação faz parte da validação deste recorte.
Classes e aparência existentes foram preservadas; há outline visível no foco.

## Testes automatizados

Node 22, `npm --prefix frontend ci`, lint, testes e build development (inclui tipos).
`src/pages/LoginPage.test.tsx` monta a página real com Auth mockado e DOM jsdom:
foco inicial/retorno por Cancelar, Fechar e cancel/Escape; reabertura; SMS;
pendência, duplicidade, respostas de sucesso/falha e isolamento de cancel aninhado.

`jsdom` é dependência somente de desenvolvimento, necessária porque a suíte
existente roda em Node sem DOM e não exercitava React/foco. Não entra no bundle.
jsdom não implementa o top layer: showModal/close são shims **apenas nos testes**.
Esses testes verificam o contrato React/foco/eventos; não provam Tab/fundo inerte,
renderização real, leitor de tela ou compatibilidade em navegadores.

## Roteiro AG-04 (revisão local e, após liberação CTO, em DEV)

1. Conferir SHA/candidato. Abrir `/login`, focar “Esqueci minha senha” por teclado
   e ativar. O foco deve estar em “E-mail cadastrado”; o diálogo deve ter nome
   “Recuperar acesso”. Não enviar recuperação real.
2. Percorrer Tab e Shift+Tab nas duas extremidades. O foco não deve atingir campos,
   botões ou conteúdo do login ao fundo. Confirmar também com leitor de tela.
3. Escape fecha e devolve foco ao acionador. Repetir com Fechar e Cancelar;
   reabrir e repetir; alternar SMS/e-mail sem requests reais.
4. Com Auth mockado localmente, manter Promise de envio pendente: campos e botões
   bloqueados, Escape não fecha, um único request. Resolver/rejeitar: mesma mensagem
   genérica, foco devolvido. Não usar destinatário real no DEV.
5. Em harness local com dois ModalDialog aninhados: Escape fecha apenas o interno,
   retorna ao acionador no externo; o fundo permanece inerte. Depois fechar externo.
6. Conferir desktop, 360px, zoom 200%, temas claro/escuro: título, foco, botão de
   fechar e rodapé alcançáveis; scroll interno sem conteúdo cortado. Conferir Chrome,
   Firefox e Safari suportados, pois a primitiva é dialog nativo, sem polyfill.
7. Smoke de login e dos modais legados em PDV/cadastros: não foram alterados, mas
   revisar CSS compartilhado e confirmar ausência de regressão visual.

AG-03 revisa resposta genérica, guardas de envio e ausência de alteração nos controles
de autenticação/tenant. AG-01/CTO decide versão/componentes após pareceres aplicáveis.

## Banco, publicação e reversão

Schema, operações e SDKs inalterados; sem migração ou publicação de Data Connect ou
Functions necessária para esta correção. Hosting só será publicado em DEV após gates
DEC-014. Reverter este commit restaura a UI anterior; não altera dados. Este PR não
é confirmação de homologação funcional em DEV nem liberação para produção.
