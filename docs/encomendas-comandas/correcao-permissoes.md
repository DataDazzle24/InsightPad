# Correção da matriz de permissões após P58R

O P58R publicou Encomendas/Comandas em DEV em19/11/2026, SHA bb2def3. O catálogo
contém as duas páginas, sem concessões automáticas de acesso. Ao habilitá-las pela
matriz, o operador recebeu erro. Reproduzido com SQL Connect v3.4.23 e PostgreSQL18
isolados: SetPlatformRolePermission resulta em42601 perto de INSERT. A gravação e
a auditoria não ocorrem. Não é falta de checkbox nem um motivo para liberar os
menus sem autorização.

A operação SQL é válida no PostgreSQL quando executada diretamente. Porém o
compilador insere _execute dentro de uma expressão escalar de SELECT. O bloco
WITH ... INSERT deixa de ser um comando de escrita no topo e falha nesse contexto.
O @check de sessão aparece como abortado em consequência; não autoriza remover
a validação de sessão. Os antigos testes de navegador usavam resposta em memória
e não demonstravam a execução real desse SQL.

## Alteração

Uma função nativa platform_set_role_permission(text,jsonb,text), SECURITY INVOKER,
executa o mesmo upsert e a auditoria em transação. Confere sessão ativa no servidor,
usuário/tenant/perfil ativos e o perfil de sistema Administrador da Plataforma.
O tenant alvo vem do perfil existente, nunca de um tenant livre no payload.
Não concede automaticamente acesso a página alguma. Não modifica D02/D05/D07,
permissões individuais, política de Caixa, estoque ou funções EC.

O connector conserva assinatura, auth, @transaction, guard de sessão e a resposta
numérica _execute. O SQL agora é SELECT platform_set_role_permission(...),
compatível com a expressão gerada. A matriz existente recebe1 quando aplica e0
quando o perfil/página não é válido. Sem alteração de interface, rotas, schema ou
assinaturas do SDK. SDKs regenerados devem permanecer sem diff após normalização.

## Validação e publicação

`python3 scripts/ec/test_platform_permissions.py`:12 testes com compilador e
PostgreSQL reais e dados sintéticos, sem DEV. Cobre criação nas duas páginas,
update sem duplicar, revogação, auditoria, rollback, perfis/sessões inválidos,
tenant derivado do perfil, consulta real GetCurrentUserAccess e EcRead após liberar.
O teste foi incluído no CI existente, sem retirar gates anteriores.

Publicar somente em insightpad-dd-dev: conferir a baseline P58R e o catálogo
existente, aplicar o único SQL20261119-platform-role-permission.sql e atualizar
connector app. Não repetir sete migrações, não mudar schema/schemaValidation, não
publicar Hosting/Functions/IAM nem atribuir permissões por script. A orientação
vigente de não exigir/criar backup é mantida, sem nova consulta de tarifas.

Após a publicação, usar Perfis e permissões para habilitar explicitamente o acesso
no perfil alvo e recarregar a sessão. Verificar um usuário sem acesso, um operador
e um gestor. O deploy não substitui esse aceite autenticado de DEV.

## Recuperação

Falha no SQL impede atualizar o connector. Falha ao auditar durante uso reverte
o upsert da mesma transação. Após deploy parcial, conservar recibo e conferir a
versão remota antes de repetir. A função pode permanecer instalada se houver falha
do connector; sua instalação não altera permissões. Não remover ledger, triggers
ou dados EC. Restaurar o connector anterior reintroduz o erro da matriz, portanto
preferir corrigir em frente. CORE não gravada; handoff local atualizado.
