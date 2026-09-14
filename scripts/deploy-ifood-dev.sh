#!/usr/bin/env bash
set -euo pipefail

readonly FIREBASE_PROJECT="insightpad-dd-dev"
readonly PRODUCTION_PROJECT="insightpad-dd"
readonly REGION="southamerica-east1"
readonly EXPECTED_SERVICE_ACCOUNT="insightpad-ifood-adapter@${FIREBASE_PROJECT}.iam.gserviceaccount.com"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly ENV_FILE="${REPOSITORY}/functions/.env.${FIREBASE_PROJECT}"
readonly FIREBASE=(npx --yes firebase-tools@15.30.0)
export NO_COLOR=1

MIGRATION_LOG=""
EXPERIMENT_DISABLED_BY_SCRIPT="false"

cleanup() {
  if [[ -n "${MIGRATION_LOG}" && -f "${MIGRATION_LOG}" ]]; then
    rm -f -- "${MIGRATION_LOG}"
  fi
  if [[ "${EXPERIMENT_DISABLED_BY_SCRIPT}" == "true" ]]; then
    "${FIREBASE[@]}" experiments:enable fdcapimigration >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

fail() {
  printf 'BLOQUEADO: %s\n' "$1" >&2
  exit 1
}

activate_node_22() {
  if [[ "$(node --version 2>/dev/null || true)" == v22.* ]]; then
    return
  fi

  if [[ -n "${NVM_DIR:-}" && -s "${NVM_DIR}/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "${NVM_DIR}/nvm.sh"
    nvm use 22 >/dev/null
  elif [[ -s "/usr/local/share/nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "/usr/local/share/nvm/nvm.sh"
    nvm use 22 >/dev/null
  fi

  [[ "$(node --version 2>/dev/null || true)" == v22.* ]] || fail "Node 22 não está ativo. Execute 'nvm use 22' e tente novamente."
}

assert_expected_migration() {
  local diff_file="$1"
  local diff_hash

  if grep -Eq 'matches SQL Connect Schema exactly|is compatible with SQL Connect Schema' "${diff_file}"; then
    return 1
  fi

  if grep -Eiq '\b(DROP|TRUNCATE|DELETE[[:space:]]+FROM|ALTER[[:space:]]+COLUMN)\b' "${diff_file}"; then
    fail "o diff SQL contém uma operação destrutiva ou inesperada. Nada foi migrado."
  fi

  diff_hash="$(sha256sum "${diff_file}" | awk '{print $1}')"
  if [[ ! "${APPROVED_MIGRATION_SHA256:-}" =~ ^[a-f0-9]{64}$ ]]; then
    printf 'Hash SHA-256 do diff completo: %s\n' "${diff_hash}" >&2
    fail "revise todo o diff acima e execute novamente com APPROVED_MIGRATION_SHA256 igual ao hash exibido."
  fi
  [[ "${APPROVED_MIGRATION_SHA256}" == "${diff_hash}" ]] \
    || fail "o diff SQL mudou depois da aprovação; o hash completo não corresponde. Nada foi migrado."

  return 0
}

cd "${REPOSITORY}"

echo "===== PROTEÇÃO DO AMBIENTE ====="
[[ "$(git branch --show-current)" == agent/* ]] || fail "use uma branch agent/*."
[[ -z "$(git status --porcelain)" ]] || { git status --short; fail "existem alterações locais."; }
[[ "$(gcloud config get-value project 2>/dev/null)" == "${FIREBASE_PROJECT}" ]] || fail "o projeto gcloud ativo não é o DEV."
[[ "${FIREBASE_PROJECT}" != "${PRODUCTION_PROJECT}" ]] || fail "o alvo coincide com produção."
[[ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)" ]] || fail "não existe uma conta gcloud ativa."
[[ -f "${ENV_FILE}" ]] || fail "crie ${ENV_FILE} a partir de functions/.env.example."
grep -Eq "^IFOOD_SERVICE_ACCOUNT=['\"]?${EXPECTED_SERVICE_ACCOUNT//./\\.}['\"]?$" "${ENV_FILE}" \
  || fail "IFOOD_SERVICE_ACCOUNT no arquivo DEV não é a conta dedicada esperada."

for secret_name in IFOOD_CLIENT_ID IFOOD_CLIENT_SECRET; do
  [[ -n "$(gcloud secrets versions list "${secret_name}" --project="${FIREBASE_PROJECT}" --filter='state=ENABLED' --limit=1 --format='value(name)' 2>/dev/null)" ]] \
    || fail "${secret_name} não possui versão habilitada no DEV."
done

activate_node_22
echo "Commit: $(git rev-parse HEAD)"
echo "Node: $(node --version)"

echo "===== INSTALAÇÃO E VALIDAÇÃO ====="
npm --prefix functions ci
npm --prefix frontend ci
(cd functions && node -e "require.resolve('@rolldown/binding-linux-x64-gnu')") \
  || fail "o binding nativo do Rolldown não foi instalado."
"${FIREBASE[@]}" dataconnect:sdk:generate --project="${FIREBASE_PROJECT}"
node scripts/normalize-dataconnect-sdk.mjs
git diff --quiet || fail "a geração do SDK alterou arquivos; versione os SDKs antes do deploy."
npm --prefix functions run lint
npm --prefix functions test
npm --prefix functions run build
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build -- --mode development

echo "===== REVISÃO DA MIGRAÇÃO DEV ====="
MIGRATION_LOG="$(mktemp)"
"${FIREBASE[@]}" dataconnect:sql:diff --project="${FIREBASE_PROJECT}" 2>&1 | tee "${MIGRATION_LOG}"

if assert_expected_migration "${MIGRATION_LOG}"; then
  printf 'Foram encontradas alterações aditivas aprovadas pelo hash completo. Digite MIGRAR para aplicar no DEV: '
  read -r confirmation </dev/tty
  [[ "${confirmation}" == "MIGRAR" ]] || fail "migração cancelada pelo operador."

  echo "===== MIGRAÇÃO DEV ====="
  if ! "${FIREBASE[@]}" dataconnect:sql:migrate --project="${FIREBASE_PROJECT}" --force 2>&1 | tee "${MIGRATION_LOG}"; then
    if grep -q 'Method not found' "${MIGRATION_LOG}"; then
      "${FIREBASE[@]}" experiments:disable fdcapimigration
      EXPERIMENT_DISABLED_BY_SCRIPT="true"
      "${FIREBASE[@]}" dataconnect:sql:migrate --project="${FIREBASE_PROJECT}" --force
    else
      fail "a migração falhou; nenhum deploy foi iniciado."
    fi
  fi
else
  echo "O banco DEV já está compatível; nenhuma migração foi necessária."
fi

echo "===== PUBLICAÇÃO DEV ====="
"${FIREBASE[@]}" deploy --project="${FIREBASE_PROJECT}" --only dataconnect
"${FIREBASE[@]}" deploy --project="${FIREBASE_PROJECT}" --only functions,hosting

echo "===== VERIFICAÇÃO FINAL ====="
"${FIREBASE[@]}" dataconnect:sql:diff --project="${FIREBASE_PROJECT}"

functions=(
  onIfoodAuthorizationRequested
  onIfoodSyncRequested
  onIfoodOrderActionQueued
  onIfoodOrderActionRetried
  onIfoodOrderReconciliationRequested
  onIfoodOrderItemMapped
  onIfoodEventRegistered
  onIfoodEventsRegistered
  ifoodWebhook
  ifoodCancellationReasons
  ifoodAvailableMerchants
  ifoodMerchantOperations
  reconcileIfood
  purgeIfoodPayloads
)
for function_name in "${functions[@]}"; do
  function_state="$(gcloud functions describe "${function_name}" --gen2 --region="${REGION}" --project="${FIREBASE_PROJECT}" --format='value(state)')"
  [[ "${function_state}" == "ACTIVE" ]] || fail "${function_name} está ${function_state:-sem estado}, esperado ACTIVE."
done

readonly HOST="https://${FIREBASE_PROJECT}.web.app"
readonly WEBHOOK="${HOST}/api/ifood/webhook"

hosting_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${HOST}")"
hosting_headers="$(curl --silent --show-error --head "${HOST}")"
get_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${WEBHOOK}")"
unsigned_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --request POST --header 'Content-Type: application/json' --data '{"id":"unsigned-smoke-test"}' "${WEBHOOK}")"
invalid_type_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --request POST --header 'Content-Type: text/plain' --data '{}' "${WEBHOOK}")"

[[ "${hosting_status}" == "200" ]] || fail "Hosting respondeu HTTP ${hosting_status}."
[[ "${get_status}" == "405" ]] || fail "GET do webhook respondeu HTTP ${get_status}, esperado 405."
[[ "${unsigned_status}" == "401" ]] || fail "POST sem assinatura respondeu HTTP ${unsigned_status}, esperado 401."
[[ "${invalid_type_status}" == "415" ]] || fail "Content-Type inválido respondeu HTTP ${invalid_type_status}, esperado 415."
grep -Eiq '^cache-control:.*no-cache.*no-store' <<<"${hosting_headers}" || fail "a raiz do Hosting não publicou a política no-cache esperada."
grep -Eiq '^content-security-policy:' <<<"${hosting_headers}" || fail "o Hosting não publicou Content-Security-Policy."

echo "Hosting: 200"
echo "Webhook GET: 405"
echo "Webhook sem assinatura: 401"
echo "Webhook Content-Type inválido: 415"
echo "Hosting cache/CSP: protegidos"
echo "Deploy DEV concluído. Produção ${PRODUCTION_PROJECT} não foi alterada."
