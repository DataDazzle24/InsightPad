# Escopo da migração — Insight Pad

Data da decisão: 15/08/2026

## Incluído na primeira migração

- Autenticação e usuários
- Perfis e permissões
- Cadastros
- Filiais
- Clientes
- Fornecedores
- Categorias e subcategorias
- Produtos e promoções
- Estoque
- Notas fiscais registradas no sistema
- Transferências
- Vendas
- PDV
- Funcionamento offline
- Logs de acesso e sistema
- Dashboards e dados analíticos
- Frontend
- Hospedagem
- Banco de dados
- Regras de segurança e multitenancy

## Fora da primeira migração

- Chatbot
- Integração com OpenAI
- Integração com Gemini
- Outras funcionalidades de inteligência artificial
- Código responsável pela aba `CHAT_LOG_IA`

## Tratamento da aba CHAT_LOG_IA

A aba `CHAT_LOG_IA` será preservada como histórico do sistema atual.

Seus dados poderão ser exportados e arquivados durante a migração, mas nenhuma
funcionalidade de IA dependerá dessa tabela na primeira versão Firebase.

## Decisão

A ausência do código da integração de IA não bloqueia mais a migração inicial.
O módulo poderá ser estudado e implementado em uma fase posterior.