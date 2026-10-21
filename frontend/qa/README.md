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
