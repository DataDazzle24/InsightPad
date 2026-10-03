#!/usr/bin/env bash
# Run only after the reviewed PDV release has been merged into release/production-v1.
set -euo pipefail
export NO_COLOR=1

readonly PROJECT="insightpad-dd"
readonly REGION="southamerica-east1"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly FIREBASE=(npx --yes firebase-tools@15.30.0)
readonly CONFIG="firebase.production.json"
DIFF_LOG=""

cleanup() { [[ -z "${DIFF_LOG}" ]] || rm -f -- "${DIFF_LOG}"; }
trap cleanup EXIT
fail() { printf 'BLOQUEADO: %s\n' "$1" >&2; exit 1; }

cd "${REPOSITORY}"
[[ $# -eq 1 ]] || fail "informe o SHA completo do commit de release aprovado como único argumento."
[[ "$1" =~ ^[a-f0-9]{40}$ ]] || fail "o SHA de release deve ter 40 caracteres hexadecimais."
readonly APPROVED_COMMIT="$1"
[[ "$(git branch --show-current)" == "release/production-v1" ]] || fail "use release/production-v1."
[[ -z "$(git status --porcelain)" ]] || fail "o repositório contém alterações locais."
[[ "$(git rev-parse HEAD)" == "${APPROVED_COMMIT}" ]] || fail "HEAD não é o commit aprovado."
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT}" ]] || fail "gcloud não está no projeto de produção."
[[ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)" ]] || fail "não há conta gcloud ativa."

# The client ID is entered only in the terminal; it is never written to a file or log.
[[ -t 0 ]] || fail "execute em um terminal interativo para revisar a migração e os gates."
printf 'Client ID do aplicativo iFood oficial Insight Pad (entrada oculta): '
IFS= read -r -s official_client_id </dev/tty
printf '\n'
[[ -n "${official_client_id}" ]] || fail "informe o aplicativo iFood oficial."
stored_client_id="$(gcloud secrets versions access latest --secret=IFOOD_CLIENT_ID --project="${PROJECT}")" \
  || fail "não foi possível ler o client ID configurado em produção."
[[ "${stored_client_id}" == "${official_client_id}" ]] || fail "o client ID configurado não é o aplicativo oficial informado."
unset official_client_id stored_client_id
for name in IFOOD_CLIENT_ID IFOOD_CLIENT_SECRET; do
  [[ -n "$(gcloud secrets versions list "${name}" --project="${PROJECT}" --filter='state=ENABLED' --limit=1 --format='value(name)')" ]] \
    || fail "${name} não possui versão habilitada."
done

printf '%s\n' 'Confirme no portal iFood: aplicativo de teste desvinculado; app oficial, webhook, merchants e permissões homologados.'
printf '%s\n' 'Confirme também o piloto DEV: caixa individual, venda/correção, estoque, offline, busca, teclado, temas e mobile.'
printf 'Digite HOMOLOGADO para prosseguir: '
IFS= read -r confirmation </dev/tty
[[ "${confirmation}" == "HOMOLOGADO" ]] || fail "homologação não confirmada."

echo '===== VALIDAÇÃO LOCAL DA RELEASE ====='
bash scripts/validate-ifood-production.sh

echo '===== REVISÃO DO SQL DE PRODUÇÃO ====='
DIFF_LOG="$(mktemp)"
"${FIREBASE[@]}" dataconnect:sql:diff --config="${CONFIG}" --project="${PROJECT}" 2>&1 | tee "${DIFF_LOG}"
if grep -Eiq '(^|[[:space:]])(DROP|TRUNCATE|DELETE[[:space:]]+FROM)([[:space:];]|$)|ALTER[[:space:]]+TABLE.*DROP' "${DIFF_LOG}"; then
  fail "o diff contém operação potencialmente destrutiva; revise uma migração separada."
fi
diff_hash="$(sha256sum "${DIFF_LOG}" | cut -d' ' -f1)"
printf 'SHA-256 do diff completo: %s\n' "${diff_hash}"
[[ "${APPROVED_SQL_DIFF_SHA256:-}" == "${diff_hash}" ]] \
  || fail "revise o diff e execute novamente com APPROVED_SQL_DIFF_SHA256 igual ao hash acima."
printf 'Digite MIGRAR para executar a migração interativa revisada: '
IFS= read -r confirmation </dev/tty
[[ "${confirmation}" == "MIGRAR" ]] || fail "migração não autorizada."

"${FIREBASE[@]}" dataconnect:sql:migrate --config="${CONFIG}" --project="${PROJECT}"
"${FIREBASE[@]}" deploy --config="${CONFIG}" --project="${PROJECT}" --only dataconnect
"${FIREBASE[@]}" deploy --config="${CONFIG}" --project="${PROJECT}" --only functions,hosting

echo '===== VERIFICAÇÕES DE PRODUÇÃO ====='
"${FIREBASE[@]}" dataconnect:sql:diff --config="${CONFIG}" --project="${PROJECT}"
host="https://${PROJECT}.web.app"
webhook="${host}/api/ifood/webhook"
[[ "$(curl -fsS -o /dev/null -w '%{http_code}' "${host}/")" == 200 ]] || fail "Hosting não respondeu HTTP 200."
[[ "$(curl -sS -o /dev/null -w '%{http_code}' "${webhook}")" == 405 ]] || fail "GET do webhook não respondeu 405."
[[ "$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"id":"unsigned-smoke-test"}' "${webhook}")" == 401 ]] \
  || fail "POST sem assinatura não respondeu 401."
[[ "$(gcloud functions describe ifoodWebhook --gen2 --region="${REGION}" --project="${PROJECT}" --format='value(state)')" == ACTIVE ]] \
  || fail "ifoodWebhook não está ACTIVE."
printf 'Produção publicada: %s no commit %s\n' "${host}" "${APPROVED_COMMIT}"
