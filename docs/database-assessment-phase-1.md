# Avaliação do banco — Fase 1

Data da avaliação: 17/08/2026

## Escopo verificado

- esquema SQL Connect versionado em `dataconnect/schema/schema.gql`;
- conector público `dataconnect/app`;
- SDK JavaScript gerado;
- histórico de implantação do projeto `insightpad-dd-dev`;
- dependências entre as páginas legadas e as entidades PostgreSQL.

O serviço usa validação `STRICT`, banco `fdcdb`, instância Cloud SQL
`insightpad-fdc` e região `southamerica-east1`.

## Estado encontrado

O modelo já cobre tenants, perfis, usuários, permissões, filiais, categorias,
subcategorias, fornecedores, clientes, produtos, kits, promoções, vendas,
pagamentos, documentos fiscais, estoque, transferências, fila offline e logs.

O conector de cliente, porém, expõe apenas:

1. `GetCurrentUser`;
2. `GetCurrentUserAccess`;
3. `BootstrapNavigationCatalog`, bloqueado para clientes.

Portanto, nenhuma página operacional deve ser considerada funcional apenas
porque a tabela correspondente já existe.

## Ajuste estrutural realizado

Foi adicionada a relação `UserBranchAccess`, necessária para restringir vendas,
estoque e financeiro às filiais autorizadas para cada usuário. A relação guarda:

- permissão de visualização;
- permissão de operação;
- filial padrão;
- tenant obrigatório;
- datas de criação e atualização.

## Regras obrigatórias para os próximos conectores

1. Nunca aceitar `tenantId` do navegador como fonte de autorização.
2. Derivar usuário, tenant, perfil e filiais de `auth.uid`.
3. Verificar `active` e `deletedAt` em todas as leituras operacionais.
4. Validar `canAccess` e a ação específica antes de cada mutation.
5. Aplicar exclusão lógica nos cadastros; exclusão física só em rotinas de
   manutenção explicitamente administrativas.
6. Gravar `AuditLog` em cadastros, edições, inativações, vendas, estornos e
   movimentações de estoque.
7. Usar `clientOperationId`/`operationKey` nas operações críticas para impedir
   duplicidade por repetição, reconexão ou clique duplo.
8. Executar venda, baixa de estoque e pagamentos na mesma transação.
9. Executar transferência e seus movimentos de origem/destino na mesma
   transação.
10. Não expor mutations administrativas com `@auth(level: USER)` sem checagem
    de perfil e permissão dentro da operação.

## Pendências que exigem validação no banco remoto

Como a autenticação do Firebase CLI pertence ao Codespace do proprietário, a
verificação final deve confirmar:

- contagem de tenants, usuários, perfis, páginas e permissões;
- existência das 13 páginas do bootstrap;
- ausência de registros órfãos;
- volume atual de cada tabela operacional;
- migração compatível para `user_branch_access`;
- backup/PITR do Cloud SQL antes da primeira carga real.

## Gate para iniciar Categorias e Subcategorias

O primeiro CRUD só deve ser publicado quando:

- a geração do SDK aceitar o esquema;
- o deploy gerar uma migração compatível;
- o usuário administrador receber uma filial padrão ou tratamento explícito de
  acesso irrestrito;
- queries e mutations derivarem o tenant do usuário autenticado;
- testes de acesso cruzado entre tenants retornarem acesso negado.
