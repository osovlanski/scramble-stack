# Decisions

- Keep three learning applications in one npm workspace with a shared hub. Supported by README and root scripts.
- Deploy frontends to Vercel and backends to Railway while supporting Docker local development. Supported by configs/workflows.
- Use Claude for diagram generation, content curation and answer scoring, with a separate evaluation harness. Supported by dependencies and eval suites.
- Share cross-app diagram/contracts selectively through `shared`, while services retain separate persistence. Supported by layout and types.
- Wire Playwright and accessibility checks into the PR gate. Supported by workflow/history.
- The reason for divergent Prisma/database versions is not documented; treat it as unresolved, not an intentional decision.
- Prisma client generation must work without secrets during `npm ci`; Prisma configs use non-routable local placeholder URLs only when `DATABASE_URL` is absent. Migration and deployment environments must supply the real URL.
