// Usage: node docs/build-builds.mjs <output.html>
// Renders the Builds proposal (variants, dataset packs, feature flags, recipes) from docs/project-docs.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const m = JSON.parse(fs.readFileSync(path.join(here, "project-docs.json"), "utf8"));
const out = process.argv[2];
if (!out) { console.error("Usage: node docs/build-builds.mjs <output.html>"); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const A = m.artifacts;
const link = (id, kind) => {
  if (kind === "B" && A.blueprint) return `<a class="id" href="${esc(A.blueprint)}#${esc(id)}" target="_blank" rel="noopener">${esc(id)}</a>`;
  if (kind === "T" && A.buildLog) return `<a class="id" href="${esc(A.buildLog)}#${esc(id)}" target="_blank" rel="noopener">${esc(id)}</a>`;
  return `<span class="id">${esc(id)}</span>`;
};
const bar = Object.entries({ Plan: A.plan, Blueprint: A.blueprint, "Build Log": A.buildLog, History: A.history, "Style Ledger": A.styleLedger })
  .map(([k, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${k}</a>` : "").join("");

const css = `
:root { --bg:#f3f4f2; --surface:#fff; --fg:#15181b; --muted:#5b646b; --line:#d6dadc; --accent:#24559e; --ok:#2e7d4f; --warn:#a9680f; --warn-bg:#f7ecd9; --accent-bg:#e4ecf7; --ok-bg:#e0efe6; --later-bg:#ebedee;
  --head:"Barlow Condensed","Arial Narrow",sans-serif; --body:"Barlow",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111417; --surface:#181c20; --fg:#e8ebed; --muted:#98a2aa; --line:#2b3238; --accent:#7fa9e8; --ok:#5cbf86; --warn:#e0a44a; --warn-bg:#2b2415; --accent-bg:#1a2535; --ok-bg:#163023; --later-bg:#22272b; color-scheme: dark; } }
:root[data-theme="dark"] { --bg:#111417; --surface:#181c20; --fg:#e8ebed; --muted:#98a2aa; --line:#2b3238; --accent:#7fa9e8; --ok:#5cbf86; --warn:#e0a44a; --warn-bg:#2b2415; --accent-bg:#1a2535; --ok-bg:#163023; --later-bg:#22272b; color-scheme: dark; }
body { background:var(--bg); color:var(--fg); font-family:var(--body); font-size:16px; line-height:1.55; }
* { box-sizing:border-box; }
.wrap { max-width:1060px; margin:0 auto; padding-block:0 64px; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); }
.bar { display:flex; flex-wrap:wrap; gap:4px 18px; padding:10px 0; font-family:var(--mono); font-size:12px; color:var(--muted); border-bottom:1px solid var(--line); }
.bar a { color:var(--accent); } .bar b { color:var(--fg); }
.mast { padding:32px 0 22px; border-bottom:2px solid var(--fg); }
.mast h1 { font-family:var(--head); font-weight:700; font-size:clamp(40px,8vw,72px); line-height:.95; text-transform:uppercase; margin:0 0 4px; }
.mast .doc { font-family:var(--head); font-size:22px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:0 0 14px; }
.mast p.sum { max-width:72ch; margin:0 0 10px; }
.pill { display:inline-block; font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:2px 8px; border-radius:3px; background:var(--warn-bg); color:var(--warn); }
.pill.exp { background:var(--accent-bg); color:var(--accent); } .pill.on { background:var(--ok-bg); color:var(--ok); }
h2 { font-family:var(--head); font-weight:600; font-size:30px; text-transform:uppercase; letter-spacing:.04em; margin:34px 0 10px; padding-bottom:8px; border-bottom:1px solid var(--line); }
.lead { color:var(--muted); max-width:75ch; margin:0 0 12px; }
.tw { overflow-x:auto; border:1px solid var(--line); border-radius:6px; background:var(--surface); }
table { border-collapse:collapse; width:100%; min-width:760px; font-size:14px; }
th,td { text-align:left; vertical-align:top; padding:9px 12px; border-bottom:1px solid var(--line); }
th { font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:500; white-space:nowrap; }
tr:last-child td { border-bottom:0; }
.id { font-family:var(--mono); font-size:12.5px; color:var(--accent); text-decoration:none; white-space:nowrap; }
a.id:hover { text-decoration:underline; }
.recipe { background:var(--surface); border:1px solid var(--line); border-radius:6px; padding:12px 16px; margin-bottom:10px; }
.recipe h3 { margin:0 0 6px; font-size:16px; font-weight:600; } .recipe ol { margin:0; padding-left:22px; } .recipe li { margin-bottom:3px; }
.ask { background:var(--warn-bg); border-left:3px solid var(--warn); border-radius:4px; padding:12px 16px 4px; max-width:80ch; }
.ask ul { padding-left:22px; } .ask li { margin-bottom:8px; }
a:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
`;

const html = `<title>ArchPresent Builds</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div class="wrap">
  <div class="bar"><b>Builds</b>${bar}</div>
  <div class="mast"><h1>ArchPresent</h1><p class="doc">Builds</p>
    <p class="sum">How to compare a feature on realistic data without a second computer: several versions of the site that run side by side, named sets of test data, and switches that turn a feature on or off per version. Agreed on 2026-10-19 as written. Built so far: the sample-photo pack (D-photos) and the switch file (app/lib/flags.js). The rest waits on the database and on hosting.</p>
    <span class="pill">${esc(m.buildsStatus)}</span></div>

  <h2>Variants</h2>
  <p class="lead">Each variant has its own address and its own data, so they never overwrite each other. A colored badge in a corner of every page shows which one you are on, so a test version is never mistaken for the real site.</p>
  <div class="tw"><table><thead><tr><th>Variant</th><th>Where it runs</th><th>Data</th><th>Badge</th><th>Purpose</th></tr></thead><tbody>
    ${m.variants.map((v) => `<tr><td><span class="id">${esc(v.id)}</span></td><td>${esc(v.host)}</td><td>${esc(v.data)}</td><td>${esc(v.badge)}</td><td>${esc(v.purpose)}</td></tr>`).join("")}
  </tbody></table></div>

  <h2>Dataset packs</h2>
  <p class="lead">Named, repeatable test data kept in the repository under seed/. A script with a fixed random seed generates them, so they are identical every time and can be rebuilt when the database changes. The release site never contains them.</p>
  <div class="tw"><table><thead><tr><th>Pack</th><th>Folder</th><th>What it holds</th><th>Status</th></tr></thead><tbody>
    ${m.datasets.map((d) => `<tr><td><span class="id">${esc(d.id)}</span></td><td class="id">${esc(d.path)}</td><td>${esc(d.describes)}</td><td><span class="pill ${d.built ? "on" : "exp"}">${d.built ? "built" : "not yet"}</span></td></tr>`).join("")}
  </tbody></table></div>

  <h2>Feature flags</h2>
  <p class="lead">Each new or optional feature has a switch. It is on or off per variant, so a feature can be tried in V-exp while V-staging stays as it was. When a feature is trusted it is turned on in release and its switch is removed.</p>
  <div class="tw"><table><thead><tr><th>Flag</th><th>What it switches</th><th>Status</th><th>On in</th><th>Blueprint</th><th>Task</th></tr></thead><tbody>
    ${m.flags.map((f) => `<tr><td><span class="id">${esc(f.id)}</span></td><td>${esc(f.description)}</td><td><span class="pill ${f.status === "experimental" ? "exp" : "on"}">${esc(f.status)}</span></td><td>${f.on.length ? f.on.map((x) => `<span class="id">${esc(x)}</span>`).join(" ") : "nowhere"}</td><td>${link(f.blueprint, "B")}</td><td>${link(f.task, "T")}</td></tr>`).join("")}
  </tbody></table></div>

  <h2>How to compare things</h2>
  ${m.buildsRecipes.map((r) => `<div class="recipe"><h3>${esc(r.title)}</h3><ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>`).join("")}

  <h2>Still open</h2>
  <div class="ask"><ul>
    <li>Agreed as written: four variants, six packs and the flags. Whether V-demo is its own site or staging is enough for showing the client can be decided when hosting exists.</li>
    <li>Hosting is not chosen yet (T-006). Separate sites need a host that allows several. Locally the variants can run on different ports.</li>
    <li>The dataset packs need the database and the points functions to exist (T-007, T-008, T-026), so the generator script waits for them. D-photos is built: four generated photos at known sizes, with the script that makes them.</li>
    <li>Only F-print-quality is read by code so far. The other flags are listed in app/lib/flags.js so their code can be gated as it is written. F-server-export stays off in release until it is tested.</li>
  </ul></div>
</div>
`;
fs.writeFileSync(out, html);
console.log("wrote", out, html.length, "bytes;", m.variants.length, "variants,", m.datasets.length, "packs,", m.flags.length, "flags");
