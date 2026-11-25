# Decisões de Arthur — Financeiro — 25/11/2026

Fonte: aprovação expressa nesta conversa, mensagem “CODEX — DECISÕES D-FIN E
AUTONOMIA DE IMPLEMENTAÇÃO”. Não são propostas pendentes.

| ID | Política aprovada |
| --- | --- |
| D03 | Cliente cadastrado e limite configurado obrigatórios; zero impede novo crédito. Aumentar exposição de inadimplente exige autorização real de gestor vinculada à operação, sem ultrapassar limite. Alterar limite exige permissão e auditoria. Recebimentos/correções autorizadas continuam disponíveis. Encomendas/Comandas exigem quitação para concluir. |
| D04 | Acessar + Gerenciar na página e autorização para todas as filiais/contas nas ações sensíveis, no servidor. Reutilizar gestor e políticas do Caixa, inclusive aprovador distinto quando exigido. Sem dupla aprovação universal bancária. |
| D05 | Mensal preserva âncora original e limita ao último dia válido; quinzenal = 15 dias corridos; sem ajuste de feriados. Dia operacional do Caixa segue sessão vigente. Datas civis não sofrem deslocamento UTC. |
| D06 | Saldo global compartilhado exige autorização explícita. Sem ela, contribuição autorizada identificada como parcial; não repartir abertura nem chamar contribuição de saldo bancário integral. |
| D07 | DRE com mapeamento gerencial versionado. Custo/classificação ausentes deixam resultado incompleto, com lacunas e acesso aos registros; nunca substituir ausência por zero. |
| D08 | Fechar exige resolver diferenças monetárias, operações incertas, duplicidades e inconsistências. Títulos futuros/recebíveis de cartão legítimos não bloqueiam por si. Reabertura por gestor, motivo e auditoria preserva revisão anterior. Sem dispensar inconsistência por confirmação. |
| D09 | Retirada exige beneficiário, natureza previamente configurada, mapeamento e motivo. Não presumir distribuição nem calcular tributos. Reutilizar sangria/retirada de origem para não duplicar dinheiro. |
| D10 | Migrar somente valores/vínculos comprovados; conferir cortes/saldos reais antes de ativar. Identificar/isolar lacunas, sem inventar histórico. |
| D11 | Juros, multas e desconto integral exigem gestor, revisão e motivo; sem percentuais automáticos. Desconto parcial segue política comprovada; na ausência, exige gestor. Matemática e autorização não são dispensadas. |

D01: oito destinos aprovados. D02: sem contratação de bancos/adquirentes;
importação assistida OFX/CSV. D12: limites técnicos fundamentados e configuráveis,
não limites comerciais inventados.

Arthur autorizou decisões técnicas de modelagem, contratos, cálculos, migrações,
integrações diretamente afetadas, interface, segurança, testes, documentação e
preparação. Configuração obrigatória sem valor real protege somente sua ação.

Publicação DEV (`insightpad-dd-dev`) autorizada após validação satisfatória,
conferência dos dados, proteção recuperável e recuperação preparada. Não autoriza
PROD, exclusão de dados ou novos serviços pagos. A dispensa de backup de P58 não
dispensa a proteção recuperável requerida nesta nova autorização. Smokes DEV
devem ser autenticados, com massa controlada e prova de persistência/permissões/
saldos/ausência de duplicação. CORE não gravada; este registro compõe o handoff.
