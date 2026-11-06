#!/usr/bin/env bash
# Provision the lockfile's Chromium on the disposable CI runner. Never skip tests.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT="${PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT:-45000}"
case "${1:-}" in
  dependencies)
    timeout 180s node scripts/qa-browser/node_modules/playwright/cli.js install-deps chromium
    timeout 120s sudo -n apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y poppler-utils
    ;;
  browser)
    for attempt in 1 2; do
      echo "Pinned Chromium download attempt ${attempt}/2"
      if timeout 180s node scripts/qa-browser/node_modules/playwright/cli.js install chromium; then
        exit 0
      else
        result=$?
      fi
      if [[ "$attempt" == 2 ]]; then
        echo "Chromium installation failed; browser checks remain blocked (exit ${result})." >&2
        exit "$result"
      fi
    done
    ;;
  *) echo 'Usage: install-chromium.sh dependencies|browser' >&2; exit 2 ;;
esac
