// Usage: node docs/build-backend-model.mjs <output.html>
// Renders docs/backend-model.json into the Backend Model page (class diagram + attribute tables).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const m = JSON.parse(fs.readFileSync(path.join(here, "backend-model.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(here, "project-docs.json"), "utf8"));
const out = process.argv[2];
if (!out) { console.error("Usage: node docs/build-backend-model.mjs <output.html>"); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const planUrl = manifest.artifacts.plan;
const planRef = (x) => planUrl ? `<a class="id" href="${esc(planUrl)}" target="_blank" rel="noopener">${esc(x)}</a>` : `<span class="id">${esc(x)}</span>`;

// Diagram: names, the first few attributes and the methods. The tables below list everything.
const classLines = m.classes.map((c) => {
  const attrs = c.attrs.slice(0, 4).map((a) => `    +${a[1]} ${a[0]}`);
  const more = c.attrs.length > 4 ? [`    +... ${c.attrs.length - 4} more`] : [];
  const methods = c.methods.map((x) => `    +${x}`);
  return `  class ${c.name} {\n${[...attrs, ...more, ...methods].join("\n")}\n  }`;
});
const relLines = m.relations.map(([a, ma, mb, b, label]) => `  ${a} "${ma}" --> "${mb}" ${b} : ${label}`);
const diagram = `classDiagram\n  direction LR\n${classLines.join("\n")}\n${relLines.join("\n")}`;

const classCard = (c) => `
<article class="card" id="${esc(c.name)}">
  <header><h3>${esc(c.name)}</h3>${(c.plan || []).map(planRef).join(" ")}</header>
  <p class="why">${esc(c.purpose)}</p>
  <div class="tw"><table><thead><tr><th>Attribute</th><th>Type</th><th>Notes</th></tr></thead><tbody>
    ${c.attrs.map((a) => `<tr><td class="mono">${esc(a[0])}</td><td class="mono">${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join("")}
  </tbody></table></div>
  ${c.methods.length ? `<p class="meth"><b>Operations</b> ${c.methods.map((x) => `<code>${esc(x)}</code>`).join(" ")}</p>` : ""}
  <ul class="rules">${c.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
</article>`;

const links = Object.entries({ Plan: manifest.artifacts.plan, Blueprint: manifest.artifacts.blueprint, "Build Log": manifest.artifacts.buildLog, History: manifest.artifacts.history, "Style Ledger": manifest.artifacts.styleLedger })
  .map(([k, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${k}</a>` : "").join("");

const css = `
:root { --bg:#f3f4f2; --surface:#fff; --fg:#15181b; --muted:#5b646b; --line:#d6dadc; --accent:#24559e; --warn:#a9680f; --warn-bg:#f7ecd9; --accent-bg:#e4ecf7;
  --head:"Barlow Condensed","Arial Narrow",sans-serif; --body:"Barlow",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111417; --surface:#181c20; --fg:#e8ebed; --muted:#98a2aa; --line:#2b3238; --accent:#7fa9e8; --warn:#e0a44a; --warn-bg:#2b2415; --accent-bg:#1a2535; color-scheme: dark; } }
:root[data-theme="dark"] { --bg:#111417; --surface:#181c20; --fg:#e8ebed; --muted:#98a2aa; --line:#2b3238; --accent:#7fa9e8; --warn:#e0a44a; --warn-bg:#2b2415; --accent-bg:#1a2535; color-scheme: dark; }
body { background:var(--bg); color:var(--fg); font-family:var(--body); font-size:16px; line-height:1.55; }
* { box-sizing:border-box; }
.wrap { max-width:1060px; margin:0 auto; padding-block:0 64px; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); }
.bar { display:flex; flex-wrap:wrap; gap:4px 18px; padding:10px 0; font-family:var(--mono); font-size:12px; color:var(--muted); border-bottom:1px solid var(--line); }
.bar a { color:var(--accent); } .bar b { color:var(--fg); }
.mast { padding:32px 0 22px; border-bottom:2px solid var(--fg); }
.mast h1 { font-family:var(--head); font-weight:700; font-size:clamp(40px,8vw,72px); line-height:.95; text-transform:uppercase; margin:0 0 4px; }
.mast .doc { font-family:var(--head); font-size:22px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:0 0 14px; }
.mast p.sum { max-width:70ch; margin:0 0 10px; }
.pill { display:inline-block; font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:2px 8px; border-radius:3px; background:var(--warn-bg); color:var(--warn); }
h2 { font-family:var(--head); font-weight:600; font-size:30px; text-transform:uppercase; letter-spacing:.04em; margin:34px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--line); }
h3 { font-family:var(--head); font-weight:600; font-size:24px; letter-spacing:.03em; text-transform:uppercase; margin:0; }
.diagram { overflow-x:auto; border:1px solid var(--line); border-radius:6px; background:var(--surface); padding:12px; }
.diagram pre.mermaid { margin:0; min-width:900px; }
.note { color:var(--muted); font-size:14px; max-width:75ch; margin:8px 0 0; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:6px; padding:16px 18px; margin-bottom:14px; scroll-margin-top:16px; }
.card header { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 12px; }
.why { margin:4px 0 10px; color:var(--muted); }
.id { font-family:var(--mono); font-size:12px; color:var(--accent); text-decoration:none; white-space:nowrap; }
.tw { overflow-x:auto; border:1px solid var(--line); border-radius:4px; }
table { border-collapse:collapse; width:100%; min-width:520px; font-size:14px; }
th,td { text-align:left; vertical-align:top; padding:6px 10px; border-bottom:1px solid var(--line); }
th { font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:500; }
tr:last-child td { border-bottom:0; }
.mono { font-family:var(--mono); font-size:12.5px; }
.meth { margin:10px 0 0; font-size:14px; } .meth b { font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-right:6px; }
code { font-family:var(--mono); font-size:12.5px; background:var(--accent-bg); color:var(--accent); padding:1px 6px; border-radius:3px; }
ul.rules { margin:10px 0 0; padding-left:20px; font-size:14.5px; max-width:80ch; } ul.rules li { margin-bottom:4px; }
ul.plain { padding-left:22px; max-width:80ch; } ul.plain li { margin-bottom:8px; }
.ask { background:var(--warn-bg); border-left:3px solid var(--warn); border-radius:4px; padding:12px 16px 4px; }
.enums { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:8px 20px; }
.enums div { border-bottom:1px solid var(--line); padding:6px 0; min-width:0; } .enums b { font-family:var(--mono); font-size:13px; display:block; } .enums span { color:var(--muted); font-size:14px; }
a:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
`;

const html = `<title>ArchPresent Backend Model</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div class="wrap">
  <div class="bar"><b>Backend Model</b>${links}</div>
  <div class="mast"><h1>ArchPresent</h1><p class="doc">Backend Model</p><p class="sum">${esc(m.intro)}</p><span class="pill">draft for your review</span></div>

  <h2>Class diagram</h2>
  <div class="diagram"><pre class="mermaid">${esc(diagram)}</pre></div>
  <p class="note">The diagram shows each class's first four attributes and its operations. Every attribute is in the tables below. An arrow reads "one to many": one User owns many Drafts.</p>

  <h2>Answered</h2>
  <ul class="plain">${(m.answered || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul>

  <h2>Choices I made. Correct me.</h2>
  <ul class="plain">${m.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
  <div class="ask"><b>Questions for you</b><ul class="plain">${m.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>

  <h2>Classes</h2>
  ${m.classes.map(classCard).join("")}

  <h2>Fixed lists</h2>
  <div class="enums">${m.enums.map(([n, v]) => `<div><b>${esc(n)}</b><span>${esc(v)}</span></div>`).join("")}</div>

  <h2>Not drawn yet</h2>
  <p class="note">${esc(m.later)}</p>
</div>
`;
fs.writeFileSync(out, html);
console.log("wrote", out, html.length, "bytes;", m.classes.length, "classes,", m.relations.length, "relations");
