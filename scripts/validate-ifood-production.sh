#!/usr/bin/env bash
set -euo pipefail

readonly PRODUCTION_PROJECT="insightpad-dd"
readonly PRODUCTION_BRANCH="release/production-v1"
readonly EXPECTED_SERVICE_ACCOUNT="insightpad-ifood-adapter@${PRODUCTION_PROJECT}.iam.gserviceaccount.com"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly FUNCTIONS_ENV="${REPOSITORY}/functions/.env.${PRODUCTION_PROJECT}"
readonly FRONTEND_ENV="${REPOSITORY}/frontend/.env.production"

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

  [[ "$(node --version 2>/dev/null || true)" == v22.* ]] \
    || fail "Node 22 não está ativo. Execute 'nvm use 22' e tente novamente."
}

require_env_value() {
  local file="$1"
  local key="$2"
  local value
  value="$(sed -nE "s/^${key}=['\"]?([^'\"]+)['\"]?$/\\1/p" "${file}" | tail -n 1)"
  [[ -n "${value}" ]] || fail "${key} está ausente ou vazio em ${file}."
  printf '%s' "${value}"
}

cd "${REPOSITORY}"

echo "===== PRÉ-VALIDAÇÃO DA RELEASE 1.0 ====="
[[ "$(git branch --show-current)" == "${PRODUCTION_BRANCH}" ]] \
  || fail "execute somente na branch ${PRODUCTION_BRANCH}."
[[ -z "$(git status --porcelain)" ]] || { git status --short; fail "existem alterações locais não versionadas."; }
[[ -f "${FUNCTIONS_ENV}" ]] || fail "crie ${FUNCTIONS_ENV} a partir de functions/.env.insightpad-dd.example."
[[ -f "${FRONTEND_ENV}" ]] || fail "crie ${FRONTEND_ENV} a partir de frontend/.env.production.example."

node --input-type=module - "${REPOSITORY}" "${PRODUCTION_PROJECT}" <<'NODE'
import { readFileSync } from "node:fs";
const [repository, project] = process.argv.slice(2);
const rc = JSON.parse(readFileSync(`${repository}/.firebaserc.production`, "utf8"));
const firebase = JSON.parse(readFileSync(`${repository}/firebase.production.json`, "utf8"));
if (rc?.projects?.default !== project) throw new Error(".firebaserc.production aponta para outro projeto.");
if (firebase?.hosting?.site !== project) throw new Error("firebase.production.json aponta o Hosting para outro site.");
if (firebase?.functions?.runtime !== "nodejs22") throw new Error("o runtime de produção precisa ser Node.js 22.");
if (firebase?.dataconnect?.source !== "dataconnect") throw new Error("a origem do Data Connect de produção é inválida.");
NODE

[[ "$(require_env_value "${FUNCTIONS_ENV}" IFOOD_SERVICE_ACCOUNT)" == "${EXPECTED_SERVICE_ACCOUNT}" ]] \
  || fail "IFOOD_SERVICE_ACCOUNT não é a conta dedicada de produção."
[[ "$(require_env_value "${FUNCTIONS_ENV}" ENFORCE_APP_CHECK)" == "true" ]] \
  || fail "ENFORCE_APP_CHECK precisa estar true em produção."
[[ "$(require_env_value "${FRONTEND_ENV}" VITE_FIREBASE_PROJECT_ID)" == "${PRODUCTION_PROJECT}" ]] \
  || fail "VITE_FIREBASE_PROJECT_ID não aponta para produção."
[[ "$(require_env_value "${FRONTEND_ENV}" VITE_FIREBASE_AUTH_DOMAIN)" == "${PRODUCTION_PROJECT}.firebaseapp.com" ]] \
  || fail "VITE_FIREBASE_AUTH_DOMAIN não aponta para produção."
APP_CHECK_SITE_KEY="$(require_env_value "${FRONTEND_ENV}" VITE_FIREBASE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY)"
[[ "${#APP_CHECK_SITE_KEY}" -ge 20 ]] \
  || fail "a chave pública do reCAPTCHA Enterprise/App Check parece inválida."

if grep -Fq "insightpad-dd-dev" \
  .firebaserc.production firebase.production.json "${FUNCTIONS_ENV}" "${FRONTEND_ENV}"; then
  fail "uma configuração de produção contém referência ao projeto DEV."
fi

activate_node_22
echo "Commit: $(git rev-parse HEAD)"
echo "Node: $(node --version)"

echo "===== TESTES REPRODUTÍVEIS ====="
npm --prefix functions ci
npm --prefix frontend ci
node scripts/normalize-dataconnect-sdk.mjs
git diff --quiet || fail "os artefatos gerados não estão normalizados ou versionados."
npm --prefix functions run lint
npm --prefix functions test
npm --prefix functions run build
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build -- --mode production

echo "PRÉ-VALIDAÇÃO CONCLUÍDA."
echo "Nenhum deploy, migração ou alteração remota foi executado."
echo "A promoção ainda exige revisão do diff SQL, App Check registrado, IAM, segredos, alertas e autorização explícita do responsável."
