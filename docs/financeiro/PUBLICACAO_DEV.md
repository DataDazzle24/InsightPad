# Publicação e recuperação do Financeiro

Destino autorizado por Arthur: `insightpad-dd-dev`, região
`southamerica-east1`, instância `insightpad-fdc`, banco `fdcdb`.
Ativação depende de validação satisfatória, conferência de dados, proteção
recuperável e procedimento de recuperação preparado.

## Conferência de 25/11/2026

O Cloud Shell autenticado retornou PostgreSQL 18 na região esperada e
Hosting com `bb2def3336171b440df8038c4112abd9f05b7172`. Backup automático
está desativado. O resultado recebido não exibiu PITR confirmado nem execução
de backup. Essas leituras não comprovam uma cópia restaurável. Nenhum comando
de migração, configuração ou publicação do Financeiro foi executado em DEV.

## Ordem da entrega

1. Fixar SHA, confirmação do CI e versões atualmente implantadas. Registrar
   artefatos do conector e do Hosting anteriores e a operação autorizada.
2. No Cloud Shell, validar o projeto e a conexão. Rodar
   `scripts/financeiro/preflight.sql` em transação somente leitura. Conferir
   totais de títulos, vínculos e contas com o responsável. Não exportar PII.
3. Demonstrar proteção recuperável antes das alterações. Pode ser uma cópia
   já existente, íntegra e comprovadamente restaurável no ambiente autorizado.
   Se for proposto dump privado, validar acesso a todos os objetos, retenção,
   criptografia, capacidade e restauração isolada. A existência de um arquivo
   ou de uma configuração de backup por si só não demonstra recuperação.
4. Aplicar os SQLs versionados na ordem da constante `MIGRATIONS` do teste.
   O primeiro item dessa lista (P59) é dependência já publicada, não faz parte
   da nova migração. Execute o restante em transação coordenada pelo operador,
   com lock de publicação, limites de lock e de instrução e falha atômica.
   Os invólucros BEGIN/COMMIT de cada arquivo destinam-se ao teste individual.
   O executor deve retirar **somente** essas linhas externas para a transação
   coordenada. Um executor genérico não deve dividir SQL por ponto e vírgula.
5. Conferir contagens e contratos legados, ciclos de sessão, permissões e
   funções nativas. Validar e publicar somente o conector app com as três novas
   operações. A estrutura financeira é nativa em PostgreSQL. Não usar migração
   destrutiva inferida do schema Data Connect ou redefinir validação de schema
   por conveniência.
6. Publicar o build do Hosting DEV correspondente ao mesmo SHA, conservando
   a configuração servida confirmada. Verificar manifesto e versão por HTTP.
7. Habilitar explicitamente as páginas e ações em perfil controlado. Conferir
   cortes reais antes de liberar lançamentos em uma conta e configurar as
   origens correspondentes. Testar login real, listagem, baixa única,
   conciliação sem alteração de saldo, rejeição por perfil e isolamento por
   filial. Usar dados controlados e estornos auditados.

## Recuperação

- Erro antes do commit SQL: desfazer a transação coordenada e inspecionar o
  retorno. Não repetir sem identificar a etapa.
- Erro após migração e antes de expor o Financeiro: manter a estrutura aditiva.
  Verificar release e contrato e corrigir para frente. Não apagar tabelas,
  eventos, versões, recibos ou movimentos.
- Erro após disponibilização: suspender a entrada nas páginas e operações
  afetadas pelos controles existentes. Preservar o livro, recibos e deltas
  registrados desde o corte. Restaurar a revisão anterior do Hosting e do
  conector apenas após provar a compatibilidade com os dados persistidos.
- Restauração do banco: testar em cópia autorizada e reconciliar os registros
  posteriores à captura antes de decidir recuperação em DEV. Preservar as
  origens do PDV/iFood e movimentos existentes.

A configuração de armazenamento privado para comprovantes não está validada.
O comando de anexos retorna bloqueio específico. O check de recuperação e a
conferência real do inventário e dos cortes permanecem pendentes.
