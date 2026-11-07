# Frente de Caixa v2 — revisão dirigida para DEV

Pedido de 7 de novembro de 2026. Base: `8efbd9d34e00b9d46a92f545d7d335368ce8f825`, última publicação DEV P49 informada pelo operador: Hosting `dc4de30734b6ae30`, release `1794057682780000`. Branch `agent/pdv-v2`. O SHA final é o HEAD da branch/CI e consta nas evidências geradas, sem autorreferência no código.

## Escopo e origem

Guia PDF v2 SHA256 `5435515068a5593aad753af9bbaa29c05b790a6629da8a31ca5c8c820a1f6aea`, 11 páginas. Os dois anexos foram extraídos: CSS `b5e525152039c8b229b144d3170bb070dbcc472a005c4799b109fd1a9723317a`, patch `2d25101a42e9a8526c1efc0107838325131ccfba5aeda1baea56bc4ce3f03468`. O patch compara o protótipo; não foi aplicado ao produto. Não se importaram loja, dados, seletor de cenários, câmera simulada ou adaptadores do protótipo.

A rota `/vendas/frente-de-caixa` recebe grade 44/56, campos Produto/Quantidade/Estoque, leitor dentro de Produto, atalhos F2/F4/F6/F8, lista absoluta sob toda a linha, rolagem própria e Total/pagamento fora da rolagem dos itens. A página real já não tinha o título interno redundante; não foi alterado o título do shell.

A folha nova é carregada no módulo da rota e só atua em mídia de tela, com namespace `.ip-pos-route`/`.ip-pos-modal`. O host dos modais carrega os tokens e o tema para funcionar também fora do shell em portal. O contêiner é `display:contents`, inclusive diante das regras herdadas. Somente com `:has(.ip-pos-route)` o grid do shell neutraliza a reserva móvel antiga de 780px; estrutura, sidebar, cabeçalho e demais páginas permanecem intactos. As poucas declarações `!important` sobrescrevem propriedades que já eram importantes no botão do scanner e nas cores de suprimento/sangria, dentro desse escopo. Impressão e comprovante são preservados.

## Contratos examinados

`SalesWorkspace` retorna filiais autorizadas, mas `openSession` exige a filial específica. `branchId:null` não procura uma sessão em todas as filiais. O fluxo não cria consulta N+1 nem muda esse contrato. Na abertura, consulta-se apenas a filial selecionada em rascunho. Uma sessão própria já aberta é retomada por leitura, sem nova mutação.

`OpenCashSession` não aceita `operationId` e impede outra sessão aberta para o mesmo usuário na mesma filial, sob lock no backend. Não se inventou identificador externo nem unicidade global entre filiais. Seleção/cancelamento/recusa não mudam o contexto principal. Filial única fica preenchida e desabilitada; contexto com carrinho ou correção fica bloqueado à filial original. Handler revalida elegibilidade, permissão, contexto e centavos. Só confirmação positiva da operação ou leitura de sessão própria permite vincular o contexto. Respostas de consultas antigas são invalidadas; seleção, busca, quantidade, paginação, estoque aberto e catálogo anteriores são limpos ao trocar de filial, sem descartar carrinho.

Uma abertura de resposta incerta mantém payload, SDK ref, segredo de sessão e contexto originais. Uma nova tentativa primeiro lê a sessão da mesma filial: se existir, retoma sem repetir a abertura; se não existir, conserva a referência congelada original. Uma recusa posterior a uma resposta incerta não apaga a incerteza anterior. Mudanças de contexto/SDK/segredo bloqueiam replay. Abrir em outra filial não fecha sessões de outras filiais silenciosamente.

Suprimento, sangria e fechamento conservam a instrução financeira existente: mesmo operationId, payload, contexto, validações, pedido/aprovação e referência SDK congelada. Fechamento continua bloqueado por vendas pendentes daquele caixa; o botão da barra abre o resumo e só o fluxo de confirmação fecha o caixa. Quando a mutação está confirmada e a leitura do saldo falha, o callback da página agora propaga a falha e a nova tentativa executa **somente SalesWorkspace**, sem EnsureSalesDefaults e sem repetir mutação financeira. Abertura confirmada com falha na atualização também só refaz a atualização de contexto.

## Preservação e revisão de impacto

O verificador mantém AST idêntica dos handlers `finish`, `sync`, `readProductCode`, `openCheckout`, `setPaymentAmount` e `printReceipt`, além do classificador de recusa, atualização confirmada, assinatura e variáveis financeiras de caixa. Permanecem byte a byte shell, CSS compartilhado, SalesUi, PosApprovalsModal, acessibilidade, sales/salesOffline, receipt/serverReceipt, backend, SDK e dependências. A antiga proteção byte a byte dos dois arquivos de PDV foi substituída por essas verificações específicas, porque o pedido autoriza alterar sua apresentação e escolha de filial. A matriz congelada de 68 IDs e suas exclusões não mudaram; o pedido tem ID adicional explícito `PDV-V2-20261107`.

Os testes antigos que selecionavam Filial na página passaram a usar o modal real; não inserem uma filial diretamente no estado. Após fechamento, a reabertura é explicitamente acionada conforme a v2, preservando as verificações de efeito/ACK. A fixture foi corrigida onde divergia do serviço: filial nula sem sessão e saldo disponível em `PosProductBranches.quantity`. Esses adaptadores continuam exclusivos da QA, sem substituir o cliente normal.

## Validação reproduzível

- `npm --prefix frontend run lint`, `npm --prefix frontend test`, tipos e build normal DEV.
- `npm --prefix frontend run test:qa`, `npm --prefix frontend run build:qa`.
- Verificadores de preservação/reconciliação e CI integral existente, com geração do SDK comparada à fonte, Functions, runtime SQL isolado e evidências de navegador.
- Casos adicionais de filial única/múltipla, cancelamento, mudança positiva, retomada, recusa, leitura antiga, segredo alterado, ACK perdido e confirmação com atualização recusada.
- `node scripts/qa-browser/run.mjs --pdv-v2`: 1440×900, 1366×768 adicional, 1280×800, 1024×600, 390×844 e 320×568, nos temas claro e escuro. Zoom nativo 1.0 por `chrome.tabs.setZoom/getZoom`; viewports emulados, sem alegar dispositivo físico. Lista até a última opção e geometria dos painéis, estoque autorizado, pagamento/cancelamento, resumo, portal e permissões. Casos de escrita somente na memória da QA.

Os resultados reais de execução ficam em `results.json`, logs e CI do SHA, não inferidos por esta lista de comandos. QA não comprova autenticação, SQL ou movimentações reais em DEV. Scanner físico, câmera autorizada, impressora e smokes autenticados dependem de validação no ambiente DEV. Não se deve alegar aceite financeiro real a partir dos ensaios sintéticos.

## Publicação e reversão

A entrega é candidata para revisão; merge não foi autorizado por este pedido. Não há banco, migração, Functions, IAM, scheduler ou integração iFood a publicar. Para uma futura publicação Hosting DEV, verificar a release ao vivo antes de qualquer escrita, usar build normal do projeto `insightpad-dd-dev` (QA=false/NODE_ENV=production), preservar rewrites/pinagens/configuração e nove contenções, conferir manifesto e arquivos públicos. Se o live divergir de P49, identificar antes de sobrescrever. Versão anterior conhecida para rollback: `dc4de30734b6ae30`, reconfirmar disponibilidade. Manter recibos e histórico, nunca repetir POST incerto sem consultar o resultado remoto. Envelope anterior USD4.75; teto USD5, estimativa não é cobrança medida. Nenhuma publicação está implícita nos testes.

CORE: não gravada nesta implementação; sem conector disponível. Preparar somente adendo com execução, SHA, CI, evidências, limites e futuro recibo real, preservando o histórico. Não apresentar preparação como registro efetivamente gravado.
