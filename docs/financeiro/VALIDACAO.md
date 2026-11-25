# Validação do Financeiro

Execute no checkout de trabalho com Node 22 e o compilador/emulador SQL
Connect 3.4.23 fixado no harness. O PostgreSQL 18 é descartável, sem rede.
A massa é sintética. O browser usa identidade de QA e os comandos passam
pelo conector real no banco isolado.

```bash
node scripts/verify-reconciliation.mjs --working-tree
node scripts/verify-interface.mjs
npm --prefix frontend run lint
npm --prefix frontend test
python3 -B scripts/financeiro/test_runtime.py
npm --prefix frontend run build:qa
node scripts/qa-browser/financeiro.mjs
```

A prova do Chromium verifica as oito rotas, temas claro e escuro em
1440×900 e 390×844, retorno de foco com Escape e uma baixa com perda
simulada da confirmação após o commit. Em seguida recarrega a interface,
consulta o recibo, exporta CSV e verifica que houve uma única baixa no
PostgreSQL. A prova não utiliza Firebase Auth remoto ou dados de clientes.

O build DEV exige os campos públicos do cliente DEV. A verificação isolada
pode usar uma cópia previamente conferida desse conjunto público. A
publicação exige uma nova confirmação do ambiente e do artefato servido.

## Lacunas de escopo e critérios para ativação

- Não há implantação DEV do Financeiro. A proteção recuperável e a
  conferência dos cortes reais não foram demonstradas.
- O movimento em numerário iniciado no Financeiro está bloqueado e precisa
  da integração com o fluxo autorizado do Caixa. A leitura dos movimentos
  existentes e o vínculo por origem já têm implementação.
- Recebíveis externos de iFood/cartões e compras sem vínculo validado não
  são convertidos em dinheiro automaticamente. A integração operacional
  completa dessas origens e do crediário no PDV precisa de prova adicional.
- Comprovantes aguardam armazenamento privado e prova de autorização e de
  recuperação. As opções de baixa composta com conciliação e rateio de
  várias linhas têm contrato no servidor com cobertura e UI parciais.
- Nem todos os cenários, dimensões de tela, modais e relatórios do pacote
  foram testados. A matriz contabiliza somente execuções com evidência.
- A entrega do código e a revisão do CI não substituem os smokes
  autenticados no DEV após implantação e configuração das permissões.

Use [mapa-integracao.tsv](mapa-integracao.tsv) para comparar destino e
acionador. Use [PUBLICACAO_DEV.md](PUBLICACAO_DEV.md) para a sequência de
ativação e recuperação.
