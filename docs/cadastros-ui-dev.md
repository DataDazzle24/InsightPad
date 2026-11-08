# Cadastros: UI DEV sobre a publicação P50R

Base de produto: `9c50ee250c54ed9b2ab6a2b4656aedff1fb9a63a`.
A publicação deve conferir o conjunto efetivamente servido e a compatibilidade com esta base. Esta documentação técnica não substitui os registros operacionais privados.

## Resultado pretendido

Aplicar a publicação 4 aprovada de Cadastros ao submenu e às seis listagens: Categorias, Subcategorias, Produtos, Clientes, Fornecedores e Filiais. A camada carrega uma única vez depois de interface.css e exige tema e data-cadastros. Diálogos exigem ainda cad-page: o alerta global de pedidos continua independente. Shell, estado do rodapé, Login, Home, PDV, dashboards e demais módulos permanecem preservados.

O patch anexado foi aplicado sobre sua base exata após conferência dos sete hashes e git apply --check. Campos, máscaras, dados existentes, serviços, guards, SDK, queries, mutações e cálculos continuam sendo os do produto. Os componentes reais e os ícones instalados substituem qualquer recurso demonstrativo do protótipo.

## Adaptações após integração

- Todo o novo CSS é screen-only para preservar as folhas de impressão existentes.
- A regra mobile antiga de botões de composição fazia o botão de limpar do seletor saltar para outra linha. O reset de grid-column fica restrito ao botão interno de Cadastros; entrada e limpar permanecem lado a lado e têm regressão geométrica nos doze pares de tema/viewport.
- Escape na sugestão aberta de e-mail fecha a lista antes de alcançar o formulário, como ocorre nos seletores/calendários locais.
- Calendário e scanner recebem origem cadastros explícita; fora do módulo, o calendário mantém inclusive os atributos e o comportamento de Escape anteriores.
- O atributo de escopo aceita barra final e diferenças de caixa já admitidas pelo roteador. Isso preserva tema e teclado também no acesso direto às mesmas rotas, sem mudar URLs ou permissões.
- Promoções notifica mudanças apenas após resposta positiva. Fechar durante uma requisição não perde a atualização se a confirmação chegar depois; não há repetição da mutação. O pai consulta a referência do loader atual, preservando o recorte corrente e ignorando retorno a um cadastro já desmontado.
- Os testes antigos que localizavam formulário pelo nome genérico usam o atributo estável existente: o novo aria-labelledby mantém a identificação pelo título efetivo.
- verify-cadastros confere as mudanças aprovadas contra a base publicada, incluindo operações e argumentos, gravação, cálculos, carregamento, campos, CSV, CEP e escopo CSS. Os testes históricos continuam conferindo sua visão anterior dessas quatro fontes já validadas; os outros arquivos usam o conteúdo atual.
- O registro de escopo inclui CADASTROS-UI-20261108 e os caminhos exatos desta autorização. Os 68 critérios congelados, exclusões e fontes protegidas permanecem inalterados.

## Validação

Executar lint, frontend test, test:qa, TypeScript, build normal DEV com configuração pública real e build QA isolado. Os testes de foco e Promoções cobrem fechamento hierárquico, Tab, devolução de foco, falta de escopo, recusa, confirmação tardia e callback atualizado.

`scripts/qa-browser/cadastros.mjs` adiciona verificações dirigidas dos componentes reais à execução completa do CI, usando a fronteira sintética Auth/API existente, sem acesso ao banco. Inclui cores computadas de hover nos dois temas, perfis, diálogo/faceta/calendário, combos e reabertura, formulários, Promoções, scanner, alerta global, CEP sintético e zoom nativo via Chrome tabs. O scanner real e os serviços reais continuam exigindo validação autenticada/hardware; o stub ViaCEP fica apenas na página QA descartável e nunca na aplicação de produto.

A matriz local inclui as sete rotas em seis viewports nos dois temas e comparações externas pareadas, a 100% nativo. Os resultados e capturas individuais ficam no pacote de evidências da revisão. Cada CAD-01..31 distingue ensaio sintético de aceitação autenticada.

## DEV e limites

Este trabalho não altera Functions, SQL, Data Connect, SDK, IAM, schedulers, integrações, dependências ou PROD. iFood permanece contido. Não repetir migrations ou restaurações anteriores para publicar esta camada de UI.

Sem sessão autenticada GCP/navegador neste executor, a aceitação real e as capturas de DEV não são inferidas dos testes sintéticos. Os registros operacionais e a autorização de recursos/custos são mantidos separadamente. A publicação deve preservar o histórico e registrar o resultado efetivo, sem confundir planejamento com cobrança medida.

Revisar o SHA e CI final entregues separadamente, sem misturar este pacote com o build QA. A publicação deve seguir o fluxo existente, preservar configuração/rewrites e conferir a release corrente antes de escrever. Para reversão, usar a revisão específica e as guardas do Hosting; não executar uma reversão cega diante de versão concorrente ou de backend incompatível.
