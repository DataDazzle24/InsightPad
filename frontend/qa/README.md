# Isolated application QA

Run `npm --prefix frontend run build:qa`, then
`node scripts/serve-recovery-qa.mjs --entry application --port 4174`.
Open `http://127.0.0.1:4174/qa/application.html` in a browser on the same
machine. Use hash navigation, for example
`/qa/application.html#/dashboards/operacional` or `#/estoque`.
The original modal entry remains `/qa/recovery.html`.
The ZIP artifact includes both entries, assets and `qa-source.json`.

This is the real application router, layout, components and styles with an
alternative build boundary. Auth, Data Connect, callable Functions and the
session adapter resolve to memory-only fixtures. The build fails if real
Firebase modules, the production Firebase bootstrap or AuthProvider appear.
CSP disallows API connections, frames and form submission. No deploy is needed.
Do not publish a preview without the separate required authorization.

The collapsible QA panel shows the exact source SHA and offers complete,
no-export and read-only permissions, synthetic API error, response delay,
loss of the first stock acknowledgment and fixture reset. Use fictitious data.
Fixtures include 151 categories/subcategories, 65 products, two branches,
501 movements, 201 transfers, 51 birthdays and 1,201 dormant customers.
Catalog writes and stock confirmations are in-memory; unknown operations fail
explicitly. The fixtures do not implement real backend authorization, fiscal
processing, channel partner integrations or durable persistence.

Use the complete application's catalog, product, stock, PDV and dashboard routes
for functional/visual review. Verify CSV row counts and print/PDF output,
keyboard navigation and all columns at 320/360/375 pixels and 200/400% zoom.
Horizontal analytical-table regions have keyboard focus and accessible labels.
For a lost stock acknowledgment, enable the panel's first-confirmation failure,
submit once, then retry the identical form: the simulated persisted operation
returns a matching replay receipt. Changed content with the same ID is refused.

Reset fixtures between cases. Record browser/version, source SHA, route,
scenario, expected/actual result and actual artifacts. A build, synthetic
receipt or modal-only test does not validate the integrated deployed backend.
The entry prepares independent QA; no acceptance is implied.

## Reproducible browser executor

Use Node22 and the lockfiles. No cloud credentials, Firebase service, preview,
new paid service or real data are needed. Browser and HTTP server must run on
this same machine; a remote browser cannot use this machine's loopback URL.

```bash
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build:qa
npm --prefix scripts/qa-browser ci --ignore-scripts --no-audit --no-fund
node scripts/qa-browser/node_modules/playwright/cli.js install --with-deps chromium
# Full PDF checks also need Poppler (pdftotext/pdfinfo), e.g. apt-get install poppler-utils.
node scripts/qa-browser/run.mjs
# After inspecting the first route proof:
node scripts/qa-browser/run.mjs --full
```

The runner starts/stops its own server, binds127.0.0.1, blocks foreign requests,
and checks the artifact SHA against Git HEAD before opening the app. QA fonts
(Inter, IBM Plex Mono and Material Symbols Rounded, OFL licenses included in
font-licenses.txt) are local and only affect this alternative build.

The first command produces route.png and proof.json in
artifacts/browser-private. Full mode adds a route inventory read from App.tsx
and pages.ts, viewport captures, modal/keyboard/loading/empty/error/permission
cases, interactions, actual CSV downloads, a Chromium print-rendered PDF,
geometry and a trace. coverage.json records each route, redirect, unsupported
operation and case result. These are observations for independent review,
not automatic visual acceptance. Inspect captures, CSV row counts/contents,
PDF pagination/all51birthday and1201dormant rows, trace interactions and all failures.

The repository is public. CI NEVER uploads plaintext captures, traces, browser
reports or a private key. It seals the private directory with AES-256-GCM and
RSA-OAEP-SHA256 using evidence-public.pem and uploads only evidence.enc. The
matching private key is held separately in private project storage. In a
private workspace, obtain that key through the project owner and decrypt:

```bash
node scripts/qa-browser/decrypt.mjs PRIVATE.pem evidence.enc evidence.tar.gz
mkdir -p private-review
tar --no-same-owner -xzf evidence.tar.gz -C private-review
```

For a local run, inspect the private output directly. For a different review
recipient, generate their own RSA pair, keep its private key private and set
QA_EVIDENCE_PUBLIC_KEY to the public PEM path when running seal.mjs. Do not
put private evidence in public issues, PR bodies, logs or git. The default CI
retention is7days. Unencrypted application build/manifest artifacts continue
to contain only public source-derived code and synthetic fixtures.

Supported memory behavior: product create/edit/status, cash open/supply/
withdrawal/close/policy, sale with validated cash payment/change/stock and
matching retry receipt, catalog writes and simple stock entries/transfers.
Writes survive route navigation in the same loaded app; reload/reset restores
fixtures deterministically. Unknown or unmodeled operations (including stock
reversal, promotions, external calls) throw explicitly. Empty/error/latency,
no-export/read/denied modes are controlled by the QA panel. The fixture
permission/branch checks are synthetic, not backend authorization evidence.

Inventory includes current tenant routes, module menus, placeholders,
redirects and platform routes. Platform identity restrictions and unsupported
API scenarios must be marked inaccessible/unsupported rather than accepted.
Viewport320/375 and CSS zoom200/400 are emulation, not a physical device or
native interactive browser zoom. Chromium's PDF renderer uses the application's
print CSS after its PDF handler is invoked; interactive print-dialog behavior,
physical mobile, camera/scanner, native zoom and real backend integration
remain separate assisted cases for Quality.
