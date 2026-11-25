BEGIN;
INSERT INTO app_pages(id,page_key,display_name,module,route,icon,display_order,requires_login,active,created_at,updated_at)
SELECT gen_random_uuid(),page_key,title,'Financeiro',route,icon,ord,true,true,now(),now()
FROM (VALUES
 ('FIN_VISAO','Visão financeira','/financeiro/visao','monitoring',40),
 ('CONTAS_PAGAR','Contas a pagar','/financeiro/contas-a-pagar','payments',41),
 ('CONTAS_RECEBER','Contas a receber','/financeiro/contas-a-receber','request_quote',42),
 ('FIN_CONTAS','Contas e movimentações','/financeiro/contas-e-movimentacoes','account_balance',43),
 ('FIN_CONCILIACAO','Conciliação','/financeiro/conciliacao','checklist',44),
 ('FIN_FLUXO','Fluxo de caixa','/financeiro/fluxo-de-caixa','timeline',45),
 ('FIN_RELATORIOS','Relatórios e fechamento','/financeiro/relatorios-e-fechamento','assessment',46),
 ('FIN_CONFIGURACOES','Configurações financeiras','/financeiro/configuracoes','tune',47)
) catalog(page_key,title,route,icon,ord)
WHERE NOT EXISTS (SELECT 1 FROM app_pages p WHERE p.page_key=catalog.page_key);
COMMIT;
