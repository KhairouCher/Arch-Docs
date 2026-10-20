// Usage: node docs/build-blueprint.mjs <output.html>
// Renders docs/blueprint.json into the publishable Blueprint page. Edit the JSON, not the HTML.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const bp = JSON.parse(fs.readFileSync(path.join(here, "blueprint.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(here, "project-docs.json"), "utf8"));
const out = process.argv[2];
if (!out) { console.error("Usage: node docs/build-blueprint.mjs <output.html>"); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const planUrl = manifest.artifacts.plan;
const id = (s) => (s.startsWith("P-") && planUrl)
  ? `<a class="id" href="${esc(planUrl)}" target="_blank" rel="noopener">${esc(s)}</a>`
  : `<span class="id">${esc(s)}</span>`;

const css = `
:root {
  --bg: #f3f4f2; --surface: #ffffff; --fg: #15181b; --muted: #5b646b; --line: #d6dadc;
  --accent: #24559e; --ok: #2e7d4f; --warn: #a9680f; --risk: #b3342b;
  --warn-bg: #f7ecd9; --accent-bg: #e4ecf7; --ok-bg: #e0efe6; --risk-bg: #f6e2df; --later-bg: #ebedee;
  --head: "Barlow Condensed", "Arial Narrow", sans-serif;
  --body: "Barlow", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #111417; --surface: #181c20; --fg: #e8ebed; --muted: #98a2aa; --line: #2b3238;
  --accent: #7fa9e8; --ok: #5cbf86; --warn: #e0a44a; --risk: #e5786f;
  --warn-bg: #2b2415; --accent-bg: #1a2535; --ok-bg: #163023; --risk-bg: #321a18; --later-bg: #22272b; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #111417; --surface: #181c20; --fg: #e8ebed; --muted: #98a2aa; --line: #2b3238;
  --accent: #7fa9e8; --ok: #5cbf86; --warn: #e0a44a; --risk: #e5786f;
  --warn-bg: #2b2415; --accent-bg: #1a2535; --ok-bg: #163023; --risk-bg: #321a18; --later-bg: #22272b; color-scheme: dark; }
body { background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 16px; line-height: 1.55; }
* { box-sizing: border-box; }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 0 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.bar { display: flex; flex-wrap: wrap; gap: 4px 18px; padding: 10px 0; font-family: var(--mono); font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--line); }
.bar b { color: var(--fg); font-weight: 600; }
.bar a { color: var(--accent); }
.mast { padding: 36px 0 28px; border-bottom: 2px solid var(--fg); }
.mast h1 { font-family: var(--head); font-weight: 700; font-size: clamp(44px, 9vw, 84px); line-height: .95; letter-spacing: .01em; text-transform: uppercase; margin: 0 0 6px; text-wrap: balance; }
.mast .doc { font-family: var(--head); font-size: 22px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 0 0 18px; }
.mast p.sum { max-width: 70ch; font-size: 17px; margin: 0 0 16px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.chips li { font-family: var(--mono); font-size: 12px; border: 1px solid var(--line); background: var(--surface); padding: 4px 10px; border-radius: 3px; }
.pill { display: inline-block; font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
.pill.built, .pill.low { background: var(--ok-bg); color: var(--ok); }
.pill.partial, .pill.medium { background: var(--warn-bg); color: var(--warn); }
.pill.planned { background: var(--later-bg); color: var(--muted); }
.pill.high { background: var(--risk-bg); color: var(--risk); }
.layout { display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 40px; padding-top: 28px; }
.toc { position: sticky; top: env(safe-area-inset-top, 0px); align-self: start; max-height: 100vh; overflow-y: auto; padding-top: 4px; font-size: 14px; }
.toc h4 { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 14px 0 4px; font-weight: 500; }
.toc a { display: block; padding: 3px 0; color: var(--muted); text-decoration: none; }
.toc a:hover, .toc a:focus-visible { color: var(--accent); }
.toc a .id { color: inherit; margin-right: 6px; }
main { min-width: 0; }
.note { font-size: 14px; color: var(--muted); border-left: 3px solid var(--line); padding: 4px 0 4px 12px; margin: 0 0 28px; max-width: 70ch; }
.part { padding-top: 8px; }
.part > h2 { font-family: var(--head); font-weight: 700; font-size: 38px; text-transform: uppercase; letter-spacing: .04em; margin: 12px 0 8px; padding-bottom: 8px; border-bottom: 2px solid var(--fg); }
.part > h2 .n { font-family: var(--mono); font-size: 14px; color: var(--muted); margin-right: 10px; letter-spacing: 0; }
section { padding: 6px 0 26px; scroll-margin-top: 16px; }
section > h3 { font-family: var(--head); font-weight: 600; font-size: 25px; text-transform: uppercase; letter-spacing: .04em; margin: 18px 0 8px; }
section > h3 .id { margin-right: 10px; font-size: 13px; }
.intro { max-width: 70ch; margin: 0 0 12px; color: var(--muted); }
.id { font-family: var(--mono); font-size: 12px; color: var(--accent); white-space: nowrap; text-decoration: none; }
a.id:hover { text-decoration: underline; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 16px 18px; margin-bottom: 12px; min-width: 0; }
.card header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin-bottom: 8px; }
.card h4 { margin: 0; font-family: var(--head); font-weight: 600; font-size: 20px; letter-spacing: .03em; text-transform: uppercase; }
.card dl { margin: 0; display: grid; gap: 10px; }
.card dl > div { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 4px 16px; }
.card dt { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); padding-top: 3px; }
.card dd { margin: 0; font-size: 15px; min-width: 0; max-width: 75ch; }
.card ul { margin: 0; padding-left: 18px; }
.card li { margin-bottom: 6px; }
.dec b { font-weight: 600; }
.dec span { color: var(--muted); }
.links { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.risk { border-left: 3px solid var(--line); background: var(--surface); border-radius: 4px; padding: 12px 14px; margin-bottom: 10px; }
.risk.high { border-left-color: var(--risk); }
.risk.medium { border-left-color: var(--warn); }
.risk.low { border-left-color: var(--ok); }
.risk header { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; margin-bottom: 4px; }
.risk h4 { margin: 0; font-size: 16px; font-weight: 600; }
.risk p { margin: 2px 0; font-size: 14px; max-width: 75ch; }
.risk p b { font-family: var(--mono); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-right: 6px; }
.phases { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.phase { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; min-width: 0; }
.phase h4 { margin: 0 0 8px; font-family: var(--head); font-size: 20px; letter-spacing: .03em; text-transform: uppercase; font-weight: 600; }
.phase ul { margin: 0; padding-left: 18px; }
.phase li { margin-bottom: 5px; font-size: 14px; }
@media (max-width: 860px) {
  .layout { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .toc { position: static; max-height: none; }
  .card dl > div { grid-template-columns: minmax(0, 1fr); }
}
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;

const field = (label, html) => html ? `<div><dt>${label}</dt><dd>${html}</dd></div>` : "";

const card = (c) => `
  <div class="card">
    <header><h4>${esc(c.title)}</h4><span class="pill ${esc(c.status)}">${esc(c.status)}</span></header>
    <dl>
      ${field("How it works", esc(c.how))}
      ${field("Tech", esc(c.tech))}
      ${field("Limitations", esc(c.limits))}
      ${field("Future path", esc(c.future))}
      ${field("Lightweight version", c.light ? esc(c.light) : "")}
      ${field("Decisions", c.decisions && c.decisions.length
        ? `<ul>${c.decisions.map((d) => `<li class="dec"><b>${esc(d.choice)}</b> <span>Alternative: ${esc(d.alt)} Why: ${esc(d.why)}</span></li>`).join("")}</ul>` : "")}
      ${field("Links", c.links && c.links.length ? `<span class="links">${c.links.map(id).join("")}</span>` : "")}
      ${field("History", `<span style="color:var(--muted)">None logged yet. The History document is not created.</span>`)}
    </dl>
  </div>`;

const sectionBody = (s) => {
  let h = "";
  if (s.intro) h += `<p class="intro">${esc(s.intro)}</p>`;
  if (s.cards) h += s.cards.map(card).join("");
  if (s.phases) h += `<div class="phases">${s.phases.map((p) => `<div class="phase"><h4>${esc(p.name)}</h4><ul>${p.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`;
  if (s.risks) h += s.risks.map((r) => `<div class="risk ${esc(r.severity)}"><header><h4>${esc(r.title)}</h4><span class="pill ${esc(r.severity)}">${esc(r.severity)}</span></header><p><b>Consequence</b>${esc(r.consequence)}</p><p><b>Mitigation</b>${esc(r.mitigation)}</p></div>`).join("");
  return h;
};

const toc = bp.parts.map((p) => `<h4>${esc(p.letter)}. ${esc(p.title)}</h4>${p.sections.map((s) => `<a href="#${s.id}"><span class="id">${s.id}</span>${esc(s.title)}</a>`).join("")}`).join("");

const parts = bp.parts.map((p) => `
<div class="part"><h2><span class="n">${esc(p.letter)}</span>${esc(p.title)}</h2>
${p.sections.map((s) => `<section id="${s.id}"><h3><span class="id">${s.id}</span>${esc(s.title)}</h3>${sectionBody(s)}</section>`).join("")}
</div>`).join("");

const links = Object.entries({
  Plan: manifest.artifacts.plan,
  "Build Log": manifest.artifacts.buildLog,
  History: manifest.artifacts.history,
  "Style Ledger": manifest.artifacts.styleLedger,
}).map(([k, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${k}</a>` : `<span>${k}: not created yet</span>`).join("");

const html = `<title>ArchPresent Blueprint</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div class="wrap">
  <div class="bar"><b>Blueprint</b>${links}</div>
  <div class="mast">
    <h1>${esc(bp.meta.project)}</h1>
    <p class="doc">Blueprint</p>
    <p class="sum">${esc(bp.meta.summary)}</p>
    <ul class="chips">${bp.meta.principles.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  </div>
  <div class="layout">
    <nav class="toc" aria-label="Sections">${toc}</nav>
    <main>
      <p class="note">On the numbering: sections are numbered once, in the order they were written, and are never renumbered. A new section takes the next free number even when it sits in an earlier part. Status is built (works today), partial (a prototype or one piece exists) or planned (not started). P- links point to the Plan.</p>
      ${parts}
    </main>
  </div>
</div>
`;
fs.writeFileSync(out, html);
console.log("wrote", out, html.length, "bytes");
