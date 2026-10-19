# IP-2026-008 — CI e manifesto de candidato (DEC-012)

Baseline de trabalho: `8f4bc9191f9e3597ffe858415b712b67b816c53d` (DEC-011).
Essa referência não identifica a versão publicada em DEV.

O workflow `CI DEV (sem deploy)` executa em PRs, pushes `agent/**` e execução manual.
Usa Node 22, `npm ci` nos dois lockfiles, lint, tipos, testes e builds. As Actions
estão fixadas por SHA; o token tem somente `contents: read`, sem persistir credenciais.
Não usa segredos cloud, autenticação Firebase/GCP, deploy ou migração.
O build do frontend é uma conferência de compilação, sem configuração real de acesso:
não é um pacote aprovado para publicação. Nenhum build é enviado ao Hosting.

## Reproduzir localmente

Com Node 22 ativo, na raiz:

```sh
npm --prefix frontend ci --no-audit --no-fund
npm --prefix functions ci --no-audit --no-fund
node --test scripts/version-manifest.test.mjs
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build -- --mode development
npm --prefix functions run lint
npm --prefix functions test
npm --prefix functions run build
node scripts/version-manifest.mjs --project insightpad-dd-dev
```

`artifacts/version-manifest.json` registra commit/tree realmente consultados no Git,
branch (null em checkout detached), worktree sujo, runtime, hashes SHA-256 dos locks,
configurações, schema, operações, SDKs e arquivos compilados. O hash de grupo é
SHA-256 do JSON da lista ordenada `{path, sha256}`. Não lê variáveis/arquivos de segredos.
O manifesto fica fora de `frontend/dist` e não altera o artefato publicado.
Ausência de build falha explicitamente; projeto diferente de DEV é rejeitado.

`kind=build-candidate` e revisões efetivas de Hosting, Functions, Data Connect,
schema e Git publicado permanecem `null` com motivo. São dados que um build local
não pode provar. Aprovação CTO também é null. Um candidato sujo não deve virar release;
em PR o checkout padrão pode ser o merge sintético: conferir o SHA no manifesto.
Testes unitários do manifesto usam fixtures em diretório temporário, sem cloud.

## Revisão e limite deste recorte

AG-03 confere permissões, ausência de segredos/deploy e provenance dos hashes;
AG-04 confere execução real e artefato JSON no GitHub. Resultado local não prova
execução do runner remoto. CLI/compiler Data Connect e compatibilidade com o schema
efetivo de DEV continuam gates separados: nenhum SDK/schema foi alterado neste recorte.

Inventário autenticado e pareceres aplicáveis precedem a liberação CTO da versão e
componentes (DEC-014). Para rollback deste recorte, reverter o commit; não há efeito
em banco, SDK, IAM ou infraestrutura. Não executar `deploy-ifood-dev.sh` como teste
de CI: ele contém publicação e possível migração fora do recorte local.
