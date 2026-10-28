# Engenharia por risco — proposta v0.1

Estado: preparada para pilotos; adoção geral depende de aprovação do proprietário.
Não retroagir sobre releases bloqueadas. Não instalar ferramentas para usar este guia.

## Fluxo e responsabilidade

Proprietário define prioridade → CTO fixa escopo/aceite/risco/autorização → Codex
implementa, testa, revisa, corrige e entrega → validação proporcional → CTO decide.
AG-02 fornece conhecimento técnico quando necessário, sem etapa duplicada após Codex.
Segurança e QA mantêm suas responsabilidades independentes nas entregas que exigirem.
Arquitetura, produto, mercado e custos só entram quando uma decisão concreta os exigir.
Nenhuma passagem automática entre conversas externas está configurada por este documento.

## Matriz de risco

Aplicar a maior criticidade encontrada entre componente, dado, efeito, dependência,
reversibilidade e decisão vigente; separar gravidade do defeito e risco da mudança.
Incerteza relevante eleva a revisão; não é evidência de exploração ou bug.

| Nível | Exemplos e limite | Verificações | Revisão independente |
| --- | --- | --- | --- |
| 1 | Texto/espaçamento/ícone/documentação neutra, sem mudar ação crítica | Diff e verificação dirigida; UI afetada e estados próximos se houver | Dispensada por padrão, com justificativa curta; gate existente prevalece |
| 2 | Filtro/formulário/dashboard de consulta, sem alterar autorização ou efeito financeiro | Contrato e fluxo positivo/negativo; filtro/paginação/exportação; UI e regressões pertinentes | Por risco, insuficiência de prova ou política de release |
| 3 | Sessão, permissões, tenant/filial, cálculo/transação financeira, saldo transacional, concorrência, migração, recuperação, IAM/CI com segredos | Controles positivos/negativos e invariantes; compatibilidade, falhas e recuperação pertinentes | Segurança no domínio crítico; QA nos fluxos afetados; ambas em releases integradas críticas e se gate exigir |

Relatório financeiro é N2 apenas se a alteração não mudar cálculo, precisão, escopo
ou política de exportação. Cálculo monetário/contrato ou fronteira de acesso eleva a N3.
CSS que esconde confirmação/erro/valor de caixa pode afetar fluxo crítico: não é N1 por ser CSS.
Mudança na própria política de revisão exige validação dos cenários críticos, mesmo sendo documentação.

## Autonomia e interrupção

Codex pode corrigir lint, tipos, imports, testes, contratos de mocks e falhas reais
no escopo autorizado. Não ampliar oferta, inventar endpoint ou mudar a regra para
fazer o teste passar. Atualizar risco se o alcance mudar.
Após duas tentativas sem progresso, registrar hipótese, evidência, tentativas e menor
próxima ação. Esse é um ponto de reavaliação, não uma parada obrigatória depois de duas correções.
Continuar trabalho independente que não dependa de credencial/decisão indisponível.
Não repetir instalação/download com erro idêntico nem rodar suítes completas após cada edição.

## Verificação de segurança proporcional

Consultar contratos reais, não confiar no mock como autoridade.
- Escopo de leitura/escrita: ator, tenant, filial, vínculos e ação validados no servidor.
- Sessão: segredo/geração/expiração/revogação; respostas antigas não afetam ator novo.
- Dinheiro/estoque: precisão, atomicidade, operationId/payload, recibos e efeito único.
- Formulários/CSV: validação, normalização contratual, escape e canExport no handler.
- Infra/CI: permissões mínimas, versões verificáveis, arquivos/segredos privados.
Usar negativos com controle positivo para não confundir falha de sessão com prova de isolamento.
Prova local simulada não aprova enforcement implantado. Reusar prova se fonte e condições relevantes
estiverem preservadas; registrar motivo de invalidação quando houver impacto.

## QA funcional e visual proporcional

Usar servidor e navegador no mesmo executor cloud. Confirmar SHA, fixtures/mocks
ou ambiente autenticado e versão do navegador antes de creditar prova.
- N1: tela/controle afetado, estados pertinentes e larguras/temas com risco.
- N2: fluxo principal, validações, erro/pendência/vazio pertinentes, persistência alegada,
  filtros/ordem/página/exports e dependências.
- N3: acrescentar falhas críticas, recusa sem efeito, replay/concorrência e integração pertinente.
Capturar o que comprova aceite; trace em falha/inconclusivo ou interação que o exija.
Não gerar dezenas de imagens equivalentes nem trocar estado real por simulação não identificada.
Distinguir execução própria, inspeção de prova existente e declaração do implementador.
Viewport emulado e CSS zoom não comprovam dispositivo físico ou zoom nativo.
PDF headless não comprova diálogo interativo. Evidência indisponível é não verificado.

## Etapas de liberação

A: implementação/provas isoladas. B: autorização concreta, proteção/contenção e
publicação coordenada compatível. C: smokes autenticados do conjunto publicado,
antes da entrega ao usuário. PROD exige sua própria autorização explícita.
Não exigir testes da versão nova já instalada antes de autorizar sua implantação
inicial contida. Não chamar A concluída de versão publicada. Não liberar somente
Hosting quando contratos dependentes não forem comprovadamente compatíveis.
O CTO decide o próximo marco: APTO PARA A PRÓXIMA ETAPA, APTO COM RESTRIÇÕES,
BLOQUEADO ou NÃO AVALIADO; sempre declarar qual etapa. CI verde não aprova publicação.

## Evidências, retestes e registros

Um ID, um registro de demanda, um PR e um pacote técnico com índice/hash/SHA.
Não criar uma segunda cópia narrativa de testes nos registros de gestão.
Consolidar achados de revisores no formato:
ID | critério | severidade | SHA/camada | reprodução | esperado/observado |
evidência | menor correção | reteste | responsável/estado.
Após correção, verificar o achado, diff, consumidores e regressões pertinentes;
ampliar a auditoria somente por mudança material/risco ou gate vigente.
Não tratar cenários planejados como executados. Critério suficiente mantém seu alcance,
não vira aceite global. Documentar separadamente defeito, falta de prova e ação operacional.
Registrar na central privada somente mudança relevante de estado, achado, bloqueio,
decisão ou resultado; logs detalhados ficam no pacote. Atualizar catálogo comercial
apenas quando função/limite mudar; código aprovado não é oferta publicada.

## Modelos e limites reais

Configuração inicial sugerida, dependente da disponibilidade no cliente/plano:
N1 GPT-6 Luna/High para tarefa bem delimitada; N2 GPT-6.1 Sol/Medium;
N3 GPT-6.1 Sol/High para raciocínio complexo. Modelo não substitui testes/revisão.
Escalonar por dificuldade comprovada, não por hábito; evitar trocar o executor
no meio de tarefa curta porque a reconstrução de contexto também custa.
Se a superfície atual não permitir definir modelo/esforço por subtarefa,
escolher uma configuração no início da tarefa e fazer o ciclo sequencial.
Configuração de subagentes em outro cliente não prova suporte nesta tarefa cloud.
Nenhum roteamento automático ou economia percentual foi implementado/medido aqui.

## JEV opcional

Não é requisito de pronto, CI, V1, merge ou deploy. Avaliar somente em piloto separado
com autorização de custo e transferência de dados. jev-review envia contexto fornecido
à API TypeSafe e exige chave; execução do MCP no executor não torna a análise offline.
jev-pr-profiler usa metadata de PR, sinaliza risco; não audita todo código nem muda modelo.
Exigir pin de versão/commit, dados mínimos, conta autorizada, custo/privacidade e
comparação com triagem determinística antes de instalar. Não copiar exemplos externos
com permissões amplas ou revisão de código não confiável com segredos.

## Template de tarefa

```text
ID / objetivo:
Base/branch/SHA e ambiente:
Requisito e critérios verificáveis:
Escopo/exclusões e contratos/padrões aplicáveis:
Nível/justificativa, modelo/esforço recomendado:
Autonomia e operações especificamente autorizadas:
Provas anteriores reutilizáveis; testes por risco:
Entrega e próximo marco:
```

## Template único de entrega

```text
ID / nível / SHA / PR / ambiente-camada:
Resultado e alterações:
Aceite: atendido / não atendido / não verificado (referências aos critérios).
Verificações: comando/caso, resultado e link privado de prova por SHA.
Segurança e UI: achados ou limites pertinentes; evidência não é aprovação independente.
JEV: não utilizado, salvo piloto autorizado (não criar seção extensa vazia).
Pendências que impedem/restringem avanço e menor ação/responsável:
Parecer do executor e próximo marco/autorizações:
```

Não chamar a tarefa de totalmente concluída por apenas listar critérios obrigatórios
não verificados; usar entrega parcial/bloqueada quando faltarem evidências do marco.
O parecer do executor não é decisão CTO, aprovação independente ou deploy.

## Adoção, pilotos e retorno

Não mudar a tarefa já em andamento. Depois da entrega congelada, reutilizar suas
provas e retestar riscos. Piloto1: próxima correção N1 real já demandada; piloto2:
próxima melhoria N2 real; não criar funcionalidade ou repetir piloto antigo só para medir.
Piloto3: ensaio documental com mudança N3 exigindo revisores e autorizações,
sem operação remota. Gate crítico nunca é dispensado pelo piloto.

Medir em uma linha por tarefa: nível/modelo/esforço realmente usado, tentativas sem
progresso, intervenções humanas, transferências, tempo observado, testes relevantes,
defeitos/regressões e consumo se exposto. Registrar não mensurado onde faltar telemetria;
preço API não estima automaticamente consumo de franquia Plus.
Sucesso: critérios do marco demonstrados, nenhuma quebra de gate, entrega privada
acessível, nenhuma solicitação rotineira evitável; comparar retrabalho/intervenções
com tarefa semelhante, sem prometer economia estatística com duas amostras.
Aprovar adoção após pilotos; rollback: desativar opt-in e retornar ao processo anterior,
preservando código/evidências. Sem revert automático de commits de produto.

## Implementação inicial

Usar AGENTS + este guia + referência técnica preservada; não instalar três skills
pessoais duplicadas nem exigir plugin para esta fase. Os procedimentos de Segurança/QA
estão neste guia. Se pilotos mostrarem benefício, extrair uma skill de engenharia
reutilizável com referências de segurança/QA e validar descoberta na superfície cloud.
Nenhuma skill instalada, subagente configurado, regra de proteção alterada ou CI dispensado
por estes arquivos. Integrar documentos a branches recentes com revisão de conflitos,
nunca substituir instruções mais novas cegamente.
