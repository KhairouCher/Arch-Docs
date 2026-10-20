// Usage: node docs/build-ledger.mjs <output.html>
// Generates the Style Ledger page from web/app/tokens.css (the source of truth).
// Edit the tokens file, then rerun this. The page is styled with the app's own tokens.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const tokensPath = path.join(here, "..", "web", "app", "tokens.css");
const css = fs.readFileSync(tokensPath, "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(here, "project-docs.json"), "utf8"));
const out = process.argv[2];
if (!out) { console.error("Usage: node docs/build-ledger.mjs <output.html>"); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function block(selectorRe) {
  const m = css.match(new RegExp(selectorRe + "\\s*\\{([\\s\\S]*?)\\n\\s*\\}", ""));
  return m ? m[1] : "";
}
function parse(body) {
  const out = [];
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/g)) out.push({ name: m[1], value: m[2].trim(), use: m[3] || "" });
  return out;
}
const light = parse(block(String.raw`:root(?!\[)`));
const darkTokens = parse(block(String.raw`:root\[data-theme="dark"\]`));
const dark = Object.fromEntries(darkTokens.map((t) => [t.name, t.value]));
const mediaBody = css.match(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([\s\S]*?)\n  \}/);
const mediaTokens = Object.fromEntries(parse(mediaBody ? mediaBody[1] : "").map((t) => [t.name, t.value]));
const mismatches = [];
for (const [k, v] of Object.entries(dark)) if (mediaTokens[k] !== v) mismatches.push(`--${k} differs between the data-theme dark block and the system dark block`);
for (const k of Object.keys(mediaTokens)) if (!(k in dark)) mismatches.push(`--${k} is only in the system dark block`);

const group = (n) =>
  /^(bg|surface)/.test(n) ? "Surfaces" : /^line/.test(n) ? "Lines" : /^ink/.test(n) ? "Ink" :
  /^(accent|on-accent)/.test(n) ? "Accent" : /^(go|warn|danger)/.test(n) ? "Semantic" :
  /^(drop|scrim|shadow)/.test(n) ? "Interaction and depth" : /^zone/.test(n) ? "Zone colors" :
  /^font/.test(n) ? "Families" : /^fs-/.test(n) ? "Type scale" : /^fw-/.test(n) ? "Weights" :
  /^r-/.test(n) ? "Radii" : /^sp-/.test(n) ? "Spacing" : /^layout/.test(n) ? "Layout" : "Other";
const byGroup = {};
for (const t of light) (byGroup[group(t.name)] ||= []).push(t);
const colorGroups = ["Surfaces", "Lines", "Ink", "Accent", "Semantic", "Interaction and depth", "Zone colors"];
const themed = light.filter((t) => colorGroups.includes(group(t.name))).length;

const swatchRow = (t) => {
  const d = dark[t.name] ?? t.value;
  const same = !(t.name in dark);
  return `<tr><td><button type="button" class="tok" data-copy="--${t.name}" title="Copy the token name">--${t.name}</button></td>
    <td><span class="sw" style="background:${esc(t.value)}"></span><span class="sw" style="background:${esc(d)}"></span></td>
    <td class="mono">${esc(t.value)}</td><td class="mono">${same ? "same" : esc(d)}</td><td>${esc(t.use)}</td></tr>`;
};
const colorSection = colorGroups.map((g) => byGroup[g] ? `<h3>${g}</h3><div class="tw"><table>
  <thead><tr><th>Token</th><th>Light, dark</th><th>Light</th><th>Dark</th><th>Used for</th></tr></thead>
  <tbody>${byGroup[g].map(swatchRow).join("")}</tbody></table></div>` : "").join("");

const plainRow = (t) => `<tr><td><button type="button" class="tok" data-copy="--${t.name}">--${t.name}</button></td><td class="mono">${esc(t.value)}</td><td>${esc(t.use)}</td></tr>`;
const plainTable = (g) => `<div class="tw"><table><thead><tr><th>Token</th><th>Value</th><th>Used for</th></tr></thead><tbody>${(byGroup[g] || []).map(plainRow).join("")}</tbody></table></div>`;

const spacing = (byGroup["Spacing"] || []).map((t) => `<div class="spr"><button type="button" class="tok" data-copy="--${t.name}">--${t.name}</button><span class="bar" style="width:${esc(t.value)}"></span><span class="mono">${esc(t.value)}</span></div>`).join("");
const radii = (byGroup["Radii"] || []).map((t) => `<div class="rad"><span class="box" style="border-radius:${esc(t.value)}"></span><button type="button" class="tok" data-copy="--${t.name}">--${t.name}</button><span class="mono">${esc(t.value)}</span><span class="use">${esc(t.use)}</span></div>`).join("");
const typeScale = (byGroup["Type scale"] || []).map((t) => `<div class="tsr"><button type="button" class="tok" data-copy="--${t.name}">--${t.name}</button><span class="mono">${esc(t.value)}</span><span class="smp" style="font-size:var(--${t.name})">Template ready in 15 minutes</span><span class="use">${esc(t.use)}</span></div>`).join("");
const weights = (byGroup["Weights"] || []).map((t) => `<span class="wt" style="font-weight:var(--${t.name})">${esc(t.name.replace("fw-", ""))} ${esc(t.value)}</span>`).join("");

const components = [
  { name: "Button", uses: ["accent", "on-accent", "accent-bg", "accent-ink", "accent-line", "go-bg", "go", "go-line", "warn-bg", "warn", "warn-line", "line-strong", "ink-muted", "surface-hover", "r-md", "fs-13", "fw-semibold"],
    sizes: "Padding 6px 16px (sm) or 11px 0 full width (modal). Radius --r-md. Text --fs-13, --fw-semibold.",
    sample: `<div class="row"><button class="s-btn solid">Solid</button><button class="s-btn soft">Soft accent</button><button class="s-btn soft go">Soft go</button><button class="s-btn soft warn">Soft warn</button><button class="s-btn ghost">Ghost</button><button class="s-btn solid" disabled>Disabled</button></div>`,
    states: [["Rest", "As shown.", "yes"], ["Hover", "Solid: fill --accent-ink. Soft: border --accent. Ghost: fill --surface-hover.", "no"], ["Disabled", "Opacity 0.5, default cursor.", "yes"], ["Focus", "2px --accent outline, 2px offset.", "no"]] },
  { name: "Badge", uses: ["go", "go-bg", "go-line", "accent-ink", "accent-bg", "warn", "warn-bg", "danger", "danger-bg", "r-sm", "font-mono", "fs-11"],
    sizes: "Padding 2px 8px. Radius --r-sm. --font-mono, --fs-11, uppercase.",
    sample: `<div class="row"><span class="s-badge go">$29</span><span class="s-badge acc">Photo</span><span class="s-badge warn">Partial</span><span class="s-badge dng">Error</span></div>`,
    states: [["Rest", "Static label. Never interactive.", "yes"]] },
  { name: "Form field", uses: ["surface-raised", "line-strong", "ink-body", "ink-faint", "accent", "r-md", "fs-13"],
    sizes: "Padding 7px 10px. Radius --r-md. Text --fs-13.",
    sample: `<div class="row"><input class="s-field" value="VUE 3D"><select class="s-field"><option>Arial</option></select><input class="s-field" placeholder="Enter text..."></div>`,
    states: [["Rest", "Border --line-strong, fill --surface-raised.", "yes"], ["Focus", "Border --accent, 2px --accent outline.", "no"], ["Disabled", "Text --ink-faint, opacity 0.6.", "no"], ["Error", "Border --danger.", "no"]] },
  { name: "Chip toggle", uses: ["accent-bg", "accent-ink", "accent-line", "surface-raised", "line-strong", "ink-muted", "r-md", "fs-13"],
    sizes: "Padding 4px 12px. Radius --r-md. Used for B, I and alignment.",
    sample: `<div class="row"><button class="s-chip on">Left</button><button class="s-chip">Center</button><button class="s-chip">Right</button></div>`,
    states: [["Off", "Border --line-strong, text --ink-muted.", "yes"], ["On", "Fill --accent-bg, text --accent-ink, border --accent-line.", "yes"], ["Hover", "Fill --surface-hover.", "no"]] },
  { name: "Card", uses: ["surface", "line", "r-lg", "ink", "ink-muted", "ink-subtle", "go", "go-bg", "accent-bg"],
    sizes: "Radius --r-lg. Thumbnail 4:3. Body padding 14px 16px.",
    sample: `<div class="s-card"><div class="thumb"><span class="s-badge go price">$29</span>3012 x 3893</div><div class="body"><b>template</b><span>4 photos, 2 text fields</span></div></div>`,
    states: [["Rest", "Border --line.", "yes"], ["Hover", "Border --line-strong.", "no"], ["Focus", "2px --accent outline.", "no"]] },
  { name: "Top bar", uses: ["surface", "line", "ink", "ink-muted", "layout-topbar", "fs-15"],
    sizes: "Height --layout-topbar (52px), bottom border --line, padding 0 20px.",
    sample: `<div class="s-top"><b>ArchPresent</b><span>11.psd</span><span class="push"></span><button class="s-btn soft">Export PNG</button></div>`,
    states: [["Rest", "Fixed look. No states.", "yes"]] },
  { name: "Layer row", uses: ["surface", "line", "accent-bg", "accent-line", "drop", "surface-hover", "r-md", "fs-13"],
    sizes: "Padding 8px 10px. Radius --r-md. The drop line is 3px of --drop.",
    sample: `<div class="s-rows"><div class="s-row">Foreground</div><div class="s-row sel">projectname</div><div class="s-row drop">cader</div><div class="s-row">side2</div></div>`,
    states: [["Rest", "Border --line.", "yes"], ["Selected", "Fill --accent-bg, border --accent-line.", "yes"], ["Dragging", "Opacity 0.5.", "yes"], ["Drop target", "3px --drop line above or below.", "yes"], ["Hover", "Fill --surface-hover.", "no"]] },
  { name: "Page arrow", uses: ["surface-sunken", "ink", "ink-faint", "line", "layout-arrow", "fs-44"],
    sizes: "Width --layout-arrow (56px), full height of the canvas area. Glyph --fs-44.",
    sample: `<div class="row"><button class="s-arrow">‹</button><button class="s-arrow" disabled>›</button></div>`,
    states: [["Rest", "Glyph --ink.", "yes"], ["Disabled", "Glyph --ink-faint, default cursor.", "yes"], ["Hover", "Fill --surface-hover.", "no"], ["Focus", "2px --accent outline inside.", "no"]] },
  { name: "Zone overlay", uses: ["zone-photo", "zone-plan", "zone-model", "zone-text", "zone-logo", "r-sm", "fs-11"],
    sizes: "Drawn on the canvas, not in the page. Tint at about 20 percent, dashed outline at full color.",
    sample: `<div class="row"><span class="s-zone" style="--c:var(--zone-photo)">Photo</span><span class="s-zone" style="--c:var(--zone-plan)">Plan</span><span class="s-zone" style="--c:var(--zone-model)">Model</span><span class="s-zone" style="--c:var(--zone-text)">Text</span><span class="s-zone" style="--c:var(--zone-logo)">Logo</span></div>`,
    states: [["Empty zone", "Tint and dashed outline following the mask's shape.", "yes"], ["Filled zone", "No overlay. The buyer's photo shows.", "yes"]] },
  { name: "Modal", uses: ["scrim", "surface-raised", "line", "shadow-modal", "r-lg", "ink", "ink-muted", "ink-subtle", "fs-18"],
    sizes: "Width up to 380px, padding 28px 26px, radius --r-lg, shadow --shadow-modal over a --scrim.",
    sample: `<div class="s-scrim"><div class="s-modal"><b>Pay to save this export</b><p>Unlocks one export of template.</p><button class="s-btn solid full">Pay</button><button class="s-btn ghost full">Cancel</button></div></div>`,
    states: [["Open", "As shown. Click on the scrim or Cancel closes it.", "yes"]] },
];
const patterns = [
  { name: "Notice", uses: ["go-bg", "go-line", "go", "warn-bg", "warn-line", "warn", "danger-bg", "danger-line", "danger", "r-md"],
    sample: `<div class="s-notes"><div class="s-note go">Saved. Your draft is kept for 1 month.</div><div class="s-note warn">This photo is small for A0 printing.</div><div class="s-note dng">Error: template.json not found.</div></div>` },
  { name: "Template grid", uses: ["sp-4", "sp-5", "layout-content"],
    sample: `<div class="s-grid"><div class="s-card"><div class="thumb">4 : 3</div><div class="body"><b>template</b><span>4 photos</span></div></div><div class="s-card"><div class="thumb">4 : 3</div><div class="body"><b>villa</b><span>5 photos</span></div></div><div class="s-card"><div class="thumb">4 : 3</div><div class="body"><b>tower</b><span>6 photos</span></div></div></div>` },
];
const compHtml = (c, isPattern) => `<article class="spec" id="${c.name.toLowerCase().replace(/\s+/g, "-")}"><h3>${esc(c.name)}</h3>
  <div class="live">${c.sample}</div>
  <dl><div><dt>Tokens</dt><dd>${c.uses.map((u) => `<button type="button" class="tok" data-copy="--${u}">--${esc(u)}</button>`).join(" ")}</dd></div>
  ${c.sizes ? `<div><dt>Sizes</dt><dd>${esc(c.sizes)}</dd></div>` : ""}
  ${c.states ? `<div><dt>States</dt><dd><div class="tw"><table><thead><tr><th>State</th><th>Look</th><th>In code today</th></tr></thead><tbody>${c.states.map((s) => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td><td>${s[2] === "yes" ? "Yes" : "Not yet"}</td></tr>`).join("")}</tbody></table></div></dd></div>` : ""}</dl></article>`;

const flags = [
  "The app now reads these tokens: tokens.css is imported in layout.js, globals.css and every page use var(--token), and the pages were checked in light and dark (T-051 done, H-2026-10-19-12). Light is the main theme, so pages that were dark are now light unless the system is set to dark.",
  "Hard-coded hex colors that remain on purpose (9): the five zone colors in editor/lib/constants.js, which equal the --zone-* tokens but are also drawn on the canvas where CSS variables do not work, the default color of a text box (user data), and the canvas drawing colors (selection outline, resize handle, watermark). Template artwork is never themed.",
  "Spacing is not migrated: paddings, margins and gaps are still plain pixel numbers. Colors, type sizes, radii, fonts, shadows and the scrim use tokens.",
  "Sizes outside the scale were rounded to the nearest token: font sizes 9 to 10, 16 to 15, 17 and 19 to 18, 24 to 22, 26 and 34 to 30, 48 to 44; radii 2 to 3, 4 to 6, 8 and 10 to 12.",
  "Hover and focus states are not styled anywhere in the code. They are marked 'Not yet' in the component specs.",
  "The earlier prototype files PaywallModal.jsx, mockPayment.js and pricing.js, and the /templates page, are still in the app but unused by the new flow.",
  ...mismatches,
];

const links = Object.entries({ Plan: manifest.artifacts.plan, Blueprint: manifest.artifacts.blueprint, "Build Log": manifest.artifacts.buildLog, History: manifest.artifacts.history, Playground: manifest.artifacts.playground }).map(([k, u]) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${k}</a>` : `<span>${k}</span>`).join("");

const pageCss = `
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink-body); font-family: var(--font-sans); font-size: var(--fs-14); line-height: 1.5; }
.wrap { max-width: var(--layout-content); margin: 0 auto; padding-block: 0 var(--sp-8);
  padding-left: max(var(--sp-4), env(safe-area-inset-left, 0px)); padding-right: max(var(--sp-4), env(safe-area-inset-right, 0px)); }
.nav { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-1) var(--sp-4); padding: var(--sp-2) 0; font-family: var(--font-mono); font-size: var(--fs-12); color: var(--ink-muted); border-bottom: 1px solid var(--line); }
.nav a { color: var(--accent); }
.nav b { color: var(--ink); }
.nav .push { flex: 1; }
.seg { display: inline-flex; border: 1px solid var(--line-strong); border-radius: var(--r-md); overflow: hidden; background: var(--surface-raised); }
.seg button { font-family: var(--font-mono); font-size: var(--fs-12); border: 0; background: transparent; color: var(--ink-muted); padding: 5px 12px; cursor: pointer; }
.seg button + button { border-left: 1px solid var(--line-strong); }
.seg button[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
header.top { padding: var(--sp-7) 0 var(--sp-5); border-bottom: 1px solid var(--line); }
header.top h1 { margin: 0 0 var(--sp-2); font-size: var(--fs-44); font-weight: var(--fw-bold); color: var(--ink); line-height: 1.05; }
header.top p { margin: 0; max-width: 68ch; color: var(--ink-muted); font-size: var(--fs-15); }
.rule { margin: var(--sp-5) 0; background: var(--accent-bg); border: 1px solid var(--accent-line); border-radius: var(--r-md); padding: var(--sp-3) var(--sp-4); color: var(--accent-ink); font-size: var(--fs-13); }
.rule ol { margin: var(--sp-1) 0 0; padding-left: var(--sp-5); }
nav.toc { display: flex; flex-wrap: wrap; gap: var(--sp-1) var(--sp-4); padding: var(--sp-3) 0; border-bottom: 1px solid var(--line); font-size: var(--fs-13); }
nav.toc a { color: var(--ink-muted); text-decoration: none; }
nav.toc a:hover { color: var(--accent); }
section { padding: var(--sp-6) 0 var(--sp-2); scroll-margin-top: var(--sp-4); }
h2 { margin: 0 0 var(--sp-3); font-size: var(--fs-30); font-weight: var(--fw-bold); color: var(--ink); }
h2 small { font-family: var(--font-mono); font-size: var(--fs-12); color: var(--ink-subtle); font-weight: var(--fw-regular); margin-left: var(--sp-2); }
h3 { margin: var(--sp-5) 0 var(--sp-2); font-size: var(--fs-18); font-weight: var(--fw-semibold); color: var(--ink); }
p.lead { max-width: 70ch; color: var(--ink-muted); margin: 0 0 var(--sp-3); }
.mono { font-family: var(--font-mono); font-size: var(--fs-12); }
.tw { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
table { border-collapse: collapse; width: 100%; font-size: var(--fs-13); }
th, td { text-align: left; vertical-align: middle; padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--line-faint); }
tr:last-child td { border-bottom: 0; }
th { font-family: var(--font-mono); font-size: var(--fs-11); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-subtle); font-weight: var(--fw-medium); white-space: nowrap; }
.tok { font-family: var(--font-mono); font-size: var(--fs-12); color: var(--accent-ink); background: var(--accent-bg); border: 1px solid var(--accent-line); border-radius: var(--r-sm); padding: 1px 6px; cursor: pointer; }
.tok.copied { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.sw { display: inline-block; width: 28px; height: 28px; border: 1px solid var(--line-strong); vertical-align: middle; }
.sw:first-child { border-radius: var(--r-sm) 0 0 var(--r-sm); }
.sw + .sw { border-radius: 0 var(--r-sm) var(--r-sm) 0; border-left: 0; }
.spr { display: grid; grid-template-columns: 90px minmax(0, 1fr) 50px; gap: var(--sp-3); align-items: center; padding: var(--sp-1) 0; }
.spr .bar { display: block; height: 12px; background: var(--accent); border-radius: var(--r-sm); }
.rad { display: grid; grid-template-columns: 56px 90px 50px minmax(0, 1fr); gap: var(--sp-3); align-items: center; padding: var(--sp-1) 0; }
.rad .box { display: block; width: 48px; height: 32px; background: var(--accent-bg); border: 1px solid var(--accent-line); }
.use { color: var(--ink-muted); font-size: var(--fs-13); }
.tsr { display: grid; grid-template-columns: 90px 50px minmax(0, 1fr); gap: var(--sp-1) var(--sp-3); align-items: baseline; padding: var(--sp-1) 0; border-bottom: 1px solid var(--line-faint); }
.tsr .use { grid-column: 2 / -1; }
.smp { color: var(--ink); overflow-wrap: anywhere; }
.wt { margin-right: var(--sp-5); font-size: var(--fs-18); color: var(--ink); }
.fam { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); padding: var(--sp-3) var(--sp-4); margin-bottom: var(--sp-2); }
.fam .mono { color: var(--ink-subtle); }
.fam .smp { font-size: var(--fs-22); display: block; margin-top: var(--sp-1); }
.spec { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); padding: var(--sp-4) var(--sp-5); margin-bottom: var(--sp-4); min-width: 0; }
.spec h3 { margin-top: 0; }
.live { background: var(--bg); border: 1px dashed var(--line-strong); border-radius: var(--r-md); padding: var(--sp-4); margin-bottom: var(--sp-3); overflow-x: auto; }
.spec dl { margin: 0; display: grid; gap: var(--sp-3); }
.spec dl > div { display: grid; grid-template-columns: 70px minmax(0, 1fr); gap: var(--sp-3); }
.spec dt { font-family: var(--font-mono); font-size: var(--fs-11); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-subtle); padding-top: 3px; }
.spec dd { margin: 0; min-width: 0; }
.spec dd .tok { margin: 0 var(--sp-1) var(--sp-1) 0; display: inline-block; }
.row { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; }
.flags { margin: 0; padding-left: var(--sp-5); max-width: 78ch; }
.flags li { margin-bottom: var(--sp-2); }
/* component samples, built only from tokens */
.s-btn { font-family: var(--font-sans); font-size: var(--fs-13); font-weight: var(--fw-semibold); padding: 6px 16px; border-radius: var(--r-md); border: 1px solid transparent; cursor: pointer; }
.s-btn.solid { background: var(--accent); color: var(--on-accent); }
.s-btn.soft { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.s-btn.soft.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.s-btn.soft.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); }
.s-btn.ghost { background: transparent; color: var(--ink-muted); border-color: var(--line-strong); font-weight: var(--fw-medium); }
.s-btn:disabled { opacity: .5; cursor: default; }
.s-btn.full { display: block; width: 100%; padding: 10px 0; margin-top: var(--sp-2); }
.s-badge { display: inline-block; font-family: var(--font-mono); font-size: var(--fs-11); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: var(--r-sm); border: 1px solid transparent; }
.s-badge.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.s-badge.acc { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.s-badge.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); }
.s-badge.dng { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-line); }
.s-field { font-family: var(--font-sans); font-size: var(--fs-13); padding: 7px 10px; background: var(--surface-raised); color: var(--ink-body); border: 1px solid var(--line-strong); border-radius: var(--r-md); min-width: 0; }
.s-chip { font-family: var(--font-sans); font-size: var(--fs-13); padding: 4px 12px; background: var(--surface-raised); color: var(--ink-muted); border: 1px solid var(--line-strong); border-radius: var(--r-md); cursor: pointer; }
.s-chip.on { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.s-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; min-width: 0; max-width: 260px; }
.s-card .thumb { position: relative; aspect-ratio: 4 / 3; background: var(--accent-bg); color: var(--ink-subtle); font-family: var(--font-mono); font-size: var(--fs-12); display: flex; align-items: center; justify-content: center; }
.s-card .price { position: absolute; top: var(--sp-2); right: var(--sp-2); }
.s-card .body { padding: 14px var(--sp-4); display: grid; gap: 2px; }
.s-card .body b { color: var(--ink); font-size: var(--fs-15); font-weight: var(--fw-semibold); }
.s-card .body span { color: var(--ink-muted); font-size: var(--fs-12); }
.s-top { display: flex; align-items: center; gap: var(--sp-3); height: var(--layout-topbar); padding: 0 var(--sp-5); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); }
.s-top b { color: var(--ink); font-size: var(--fs-15); }
.s-top span { color: var(--ink-subtle); font-family: var(--font-mono); font-size: var(--fs-12); }
.s-top .push { flex: 1; }
.s-rows { display: grid; gap: var(--sp-1); max-width: 320px; }
.s-row { position: relative; padding: var(--sp-2) 10px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); font-size: var(--fs-13); }
.s-row.sel { background: var(--accent-bg); border-color: var(--accent-line); color: var(--accent-ink); }
.s-row.drop::before { content: ""; position: absolute; left: 0; right: 0; top: -3px; height: 3px; background: var(--drop); border-radius: var(--r-sm); }
.s-arrow { width: var(--layout-arrow); height: 120px; background: var(--surface-sunken); border: 1px solid var(--line); color: var(--ink); font-size: var(--fs-44); line-height: 1; cursor: pointer; }
.s-arrow:disabled { color: var(--ink-faint); cursor: default; }
.s-zone { min-width: 72px; padding: var(--sp-3) var(--sp-2); text-align: center; font-family: var(--font-mono); font-size: var(--fs-11); color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); border: 2px dashed var(--c); border-radius: var(--r-sm); }
.s-scrim { background: var(--scrim); padding: var(--sp-6) var(--sp-4); display: flex; justify-content: center; border-radius: var(--r-md); }
.s-modal { width: 100%; max-width: 320px; background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--r-lg); box-shadow: var(--shadow-modal); padding: 28px 26px; }
.s-modal b { display: block; color: var(--ink); font-size: var(--fs-18); }
.s-modal p { color: var(--ink-muted); font-size: var(--fs-13); margin: var(--sp-1) 0 var(--sp-3); }
.s-notes { display: grid; gap: var(--sp-2); max-width: 420px; }
.s-note { padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); font-size: var(--fs-13); border: 1px solid transparent; }
.s-note.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.s-note.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); }
.s-note.dng { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-line); }
.s-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--sp-4); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (max-width: 640px) { .spec dl > div { grid-template-columns: minmax(0, 1fr); } .rad { grid-template-columns: 56px 80px 44px; } .rad .use { grid-column: 1 / -1; } }
`;

const script = `
(function () {
  var root = document.documentElement;
  var btns = document.querySelectorAll("#themeSeg button");
  function setTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
    btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-t") === t)); });
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { setTheme(b.getAttribute("data-t")); }); });
  setTheme("light");
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button[data-copy]"); if (!t) return;
    var text = t.getAttribute("data-copy"), old = t.textContent;
    function done() { t.classList.add("copied"); t.textContent = "copied"; setTimeout(function () { t.classList.remove("copied"); t.textContent = old; }, 900); }
    try { navigator.clipboard.writeText(text).then(done, function () { sel(); }); } catch (x) { sel(); }
    function sel() { var r = document.createRange(); r.selectNodeContents(t); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });
})();
`;

const html = `<title>ArchPresent Style Ledger</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
:root { --font-geist-sans: "Geist"; --font-geist-mono: "Geist Mono"; }
${css}
${pageCss}
</style>
<div class="wrap">
  <div class="nav"><b>Style Ledger</b>${links}<span class="push"></span><div class="seg" id="themeSeg" role="group" aria-label="Preview theme"><button type="button" data-t="light" aria-pressed="true">Light</button><button type="button" data-t="dark" aria-pressed="false">Dark</button></div></div>
  <header class="top">
    <h1>Style Ledger</h1>
    <p>The only UI styles ArchPresent may use: ${themed} color tokens, the type scale, spacing, radii and every component with its states. This page is generated from <span class="mono">web/app/tokens.css</span>. Light is the main theme. Click a token name to copy it.</p>
  </header>
  <div class="rule"><b>Before writing any UI:</b> find the token or component here. If it is missing:
    <ol><li>Propose it to Khairou: name, light and dark values, and why an existing one will not do.</li><li>Add it to tokens.css, then regenerate this ledger.</li><li>Log a docs entry in the History.</li><li>Only then use it.</li></ol></div>
  <nav class="toc" aria-label="Sections"><a href="#layout">1 Layout and grid</a><a href="#color">2 Color tokens</a><a href="#type">3 Typography</a><a href="#components">4 Components</a><a href="#patterns">5 Patterns</a><a href="#flags">6 Known mismatches</a></nav>

  <section id="layout"><h2>1 Layout and grid</h2>
    <p class="lead">There are no breakpoints defined in the code yet. The editor is a fixed layout (top bar, a 260px sidebar and a canvas area) and the website uses a centered column with auto-fill grids. The platform is desktop only.</p>
    <h3>Layout tokens</h3>${plainTable("Layout")}
    <h3>Spacing scale</h3>${spacing}
    <h3>Radii</h3>${radii}
  </section>

  <section id="color"><h2>2 Color tokens<small>${themed} tokens, light and dark</small></h2>
    <p class="lead">Each token has a light and a dark value. Zone colors and the text on the solid accent are the same in both.</p>
    ${colorSection}
  </section>

  <section id="type"><h2>3 Typography</h2>
    <h3>Families</h3>
    ${(byGroup["Families"] || []).map((t) => `<div class="fam"><button type="button" class="tok" data-copy="--${t.name}">--${t.name}</button> <span class="mono">${esc(t.use)}</span><span class="smp" style="font-family:var(--${t.name})">Template ready in 15 minutes 0123456789</span></div>`).join("")}
    <h3>Type scale</h3>${typeScale}
    <h3>Weights</h3><p>${weights}</p>
  </section>

  <section id="components"><h2>4 Components</h2>
    <p class="lead">Each card shows the component in the current preview theme, the tokens it uses, its sizes and every allowed state. "In code today" says whether the existing pages already style that state.</p>
    ${components.map((c) => compHtml(c)).join("")}
  </section>

  <section id="patterns"><h2>5 Patterns</h2>
    <p class="lead">Built from the components above, using the same tokens.</p>
    ${patterns.map((c) => compHtml(c, true)).join("")}
  </section>

  <section id="flags"><h2>6 Known mismatches</h2>
    <p class="lead">Where the current code and this ledger still disagree, and what was rounded when the pages moved onto the tokens.</p>
    <ul class="flags">${flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
  </section>
</div>
<script>${script}</script>
`;
fs.writeFileSync(out, html);
console.log("wrote", out, html.length, "bytes;", themed, "color tokens;", mismatches.length, "token mismatches");
