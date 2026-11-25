#!/usr/bin/env bash
# Start the coordinated Financeiro release using the same P58 tooling.
set -euo pipefail
umask 077
[[ "${1-}" == --publicar-dev && $# == 1 ]] || {
  printf '%s\n' 'Execute com --publicar-dev no Cloud Shell autenticado.' >&2
  exit 2
}

root="$(cd -- "$(dirname -- "$0")/../.." && pwd)"
scratch="$(mktemp -d -t insightpad-fin-publicador.XXXXXXXX)"
trap 'rm -rf -- "$scratch"' EXIT
ops_sha=ae79f1dda7650073cf288be2f10d8b1e07cd6667
repo=https://github.com/DataDazzle24/InsightPad.git

for command in git gcloud npm python3 sha256sum; do
  command -v "$command" >/dev/null || { printf 'Comando indisponível: %s\n' "$command" >&2; exit 1; }
done
node22="$HOME/InsightPad_DEC035_OP_20261028T165248Z/tools-node22/node_modules/node/bin/node"
if [[ ! -x "$node22" ]]; then
  node22="$(command -v node)"
fi
[[ "$("$node22" --version)" == v22.* ]] || {
  printf '%s\n' 'Node 22 indisponível no Cloud Shell.' >&2
  exit 1
}
export PATH="$(dirname -- "$node22"):$PATH"
git init --quiet "$scratch/ops"
git -C "$scratch/ops" fetch --quiet --no-tags "$repo" "$ops_sha"
test "$(git -C "$scratch/ops" rev-parse FETCH_HEAD)" = "$ops_sha"
git -C "$scratch/ops" checkout --quiet --detach "$ops_sha"
(cd "$scratch/ops" && sha256sum --quiet -c SHA256SUMS)
printf '%s\n' 'Preparando as ferramentas fixadas do P58/P59.'
npm --prefix "$scratch/ops" ci --ignore-scripts --no-audit --no-fund >"$scratch/npm.log" 2>&1 || {
  printf '%s\n' 'Falha ao instalar as ferramentas P58/P59. Nenhuma alteração em DEV.' >&2
  exit 1
}
cp "$root/scripts/financeiro/publish-dev.py" "$scratch/ops/publish-dev.py"
python3 -B "$scratch/ops/publish-dev.py"
