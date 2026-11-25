#!/usr/bin/env bash
# DEV read-only checks using the existing P58/P59 connector lockfile.
set -euo pipefail
umask 077

root="$(cd -- "$(dirname -- "$0")/../.." && pwd)"
scratch="$(mktemp -d -t insightpad-fin-preflight.XXXXXXXX)"
trap 'rm -rf -- "$scratch"' EXIT
ops_sha=ae79f1dda7650073cf288be2f10d8b1e07cd6667
repo=https://github.com/DataDazzle24/InsightPad.git

case "${1-}" in
  ''|--rehearse-recovery) ;;
  *) printf '%s\n' 'Modo de verificação inválido.' >&2; exit 2 ;;
esac

for command in git gcloud node npm python3; do
  command -v "$command" >/dev/null || { printf 'Comando indisponível: %s\n' "$command" >&2; exit 1; }
done

git init --quiet "$scratch/ops"
git -C "$scratch/ops" fetch --quiet --no-tags "$repo" "$ops_sha"
test "$(git -C "$scratch/ops" rev-parse FETCH_HEAD)" = "$ops_sha"
for path in P58-sql.cjs package.json package-lock.json; do
  git -C "$scratch/ops" show "$ops_sha:$path" > "$scratch/ops/$path"
done

# Reuse the pinned bridge and its existing dependency lockfile.
npm --prefix "$scratch/ops" ci --ignore-scripts --no-audit --no-fund > "$scratch/npm.log" 2>&1 ||
  { printf '%s\n' 'Não foi possível preparar a ponte SQL do P59. Nenhuma alteração no DEV.' >&2; exit 1; }

if [[ "${1-}" == --rehearse-recovery ]]; then
  cp "$root/scripts/financeiro/recovery-socket.cjs" "$scratch/ops/"
  python3 -B "$root/scripts/financeiro/rehearse-recovery.py" "$scratch/ops/recovery-socket.cjs"
else
  python3 "$root/scripts/financeiro/preflight_cloud_shell.py" "$scratch/ops/P58-sql.cjs" "$root/scripts/financeiro/preflight.sql"
fi
