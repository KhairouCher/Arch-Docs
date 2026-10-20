# ArchPresent project documents

The sources and generators of the project documents. The pages themselves are
published as Claude artifacts; their links, and the last ID used of each kind
(P- plan, B- blueprint, T- task, H- history), are in
[`project-docs.json`](project-docs.json).

Edit the sources, never a generated page, then rebuild and publish.

| Document | Source | How it is built |
|---|---|---|
| Plan (English, French, Arabic) | [`plan.html`](plan.html) | published as it is |
| Blueprint | [`blueprint.json`](blueprint.json) | `node build-blueprint.mjs <out.html>` |
| Backend Model | [`backend-model.json`](backend-model.json) | `node build-backend-model.mjs <out.html>` |
| Builds | [`project-docs.json`](project-docs.json) | `node build-builds.mjs <out.html>` |
| Style Ledger | `../web/app/tokens.css` | `node build-ledger.mjs <out.html>` |
| Style Playground | `../web/app/tokens.css` | `node build-playground.mjs <out.html>` |
| History | [`history.html`](history.html) | page template; the entries live in the page's own database |
| Build Log | [`buildlog.html`](buildlog.html) | page template; the tasks live in the page's own database |
| Plan PDFs (French, Arabic) | [`plan.html`](plan.html) | `node build-plan-pdf.mjs` |

History entries and Build Log tasks are rows in the database of their published
page, not files here. Their last IDs are in `project-docs.json`.

## Things to know

- Write generated pages to a scratch folder, not into this one.
- [`ArchPresent-Plan-FR.pdf`](ArchPresent-Plan-FR.pdf) and
  [`ArchPresent-Plan-AR.pdf`](ArchPresent-Plan-AR.pdf) were made on 2026-10-17
  and are **out of date**: the Plan has been updated since (Open 5, 6, 8, 9 and
  10). Regenerate them before sending them to the client.
- Every change to the project lands in the History, and usually in the Build Log
  and the Blueprint too.
