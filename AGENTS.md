# InsightPad — orientação de engenharia

## Estado e precedência

Esta é uma proposta de governança para pilotos opt-in. Não modifica autorizações,
critérios ou gates de tarefas/releases em andamento. Antes da adoção explícita,
seguir o processo vigente. Usar o fluxo proposto somente quando a tarefa autorizar
`governance: lean-pilot-v0.1`.

Executar integralmente em nuvem. O proprietário participa somente pelo navegador,
login/MFA e decisões de produto/autorização. Preservar arquivos preexistentes.
Não criar serviços pagos nem ampliar orçamento sem autorização específica.
Não executar merge, deploy, IAM, migração, exclusão de dados ou restauração remota
sem a autorização aplicável à operação, ambiente e plano concreto.

## Contexto sob demanda

- Ler [workflow](docs/engineering/workflow.md) ao iniciar uma tarefa que adote o piloto.
- Consultar apenas as seções pertinentes dos [padrões técnicos](docs/engineering/technical-standards.md).
  A referência preserva o manual anterior; não carregar integralmente em toda tarefa.
- Ler instruções de diretórios afetados, contratos reais e normas aprovadas aplicáveis.
- Requisitos explícitos da tarefa e decisões vigentes prevalecem sobre recomendações
  genéricas. Preservar escopo, exclusões e provas anteriores ainda válidas.
- Usar um ID estável, um PR e um pacote de evidências; manter dados de governança,
  credenciais e evidências sensíveis fora do repositório público.

## Ciclo do executor

Confirmar base/SHA e estado do checkout. Entender o requisito; classificar risco;
localizar consumidores/dependências; implementar; executar verificações pertinentes;
revisar o diff; corrigir e retestar os defeitos do escopo; entregar uma vez.
A implementação não termina no primeiro teste que falhar se a correção for clara.

Nível 1: alteração isolada sem lógica/superfície crítica — sem auditoria independente
por padrão, salvo decisão vigente ou evidência insuficiente.
Nível 2: alteração funcional — testes de fluxo, contratos, permissões e UI aplicáveis;
revisão independente conforme risco.
Nível 3: autorização/sessão/tenant, efeitos financeiros/estoque, concorrência,
migração, recuperação, infraestrutura ou esteira de confiança — revisões independentes
nos domínios pertinentes, conforme matriz e gates vigentes. Tamanho do diff não decide risco.
Nenhum classificador pode rebaixar um gate específico existente.

Quando houver auditoria: congelar um SHA; revisores usam o mesmo candidato e pacote;
não implementar concorrendo com a avaliação. Consolidar achados e retestar por impacto.
Autorrevisão, subagente do implementador e ferramenta auxiliar não são automaticamente
uma auditoria independente obrigatória.

## Economia e exceções

Reutilizar testes, instalação/build compatíveis e provas equivalentes por SHA/dependência.
Executar regressões afetadas; manter checks obrigatórios. Não desativar CI, guardas,
segurança ou critérios para economizar tempo. Não criar testes que apenas espelhem texto.
Após duas tentativas consecutivas sem informação nova, reavaliar causa/ambiente/custo;
prosseguir se houver hipótese nova verificável e baixo risco; caso contrário escalar o impedimento.

Não instalar JEV, criar API key, contratar serviço ou alterar modelo em execução como
parte implícita da tarefa. Declarar capacidades não verificadas. Reportar métricas reais;
franquia/tokens indisponíveis devem constar como não mensurados.
