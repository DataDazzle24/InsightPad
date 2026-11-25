# Delta para a CORE

CORE não gravada. O registro abaixo acompanha a branch de trabalho do Financeiro.

- Base técnica P59, commit `dcb03f18a49bf267eb44a8fecbebeea641c9984a`.
- D03–D11 aprovadas por Arthur e consolidadas em `DECISOES.md`.
- Implementação aditiva com CP/CR existentes, registro de intenção e recibo,
  eventos de competência, livro por conta, classificação, conciliação e
  fechamento com revisões. Rotas e diálogos estão mapeados no arquivo
  `mapa-integracao.tsv`.
- Ativação exige acessos nas páginas, contas e filiais. O vínculo de origem
  exige corte e vigência conferidos. As origens sem comprovação ficam fora do
  saldo. A lista de títulos legados mantém esses registros visíveis.
- Cloud Shell em 25/11 confirmou Hosting `bb2def3336171b440df8038c4112abd9f05b7172`
  e PostgreSQL 18. Backup automático desativado e proteção recuperável
  pendente de comprovação. Financeiro ainda não implantado.
- Entrega e matriz precisam distinguir ambiente isolado, execução de CI e
  validação autenticada no DEV. Use `PUBLICACAO_DEV.md` para as etapas de
  recuperação e ativação.
