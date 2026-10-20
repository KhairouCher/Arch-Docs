// Usage: node docs/build-playground.mjs <output.html>
// Builds the Style Playground: real ArchPresent screens drawn only from the tokens in
// web/app/tokens.css, with a panel to edit every token live. Edits are exported as CSS.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(here, "..", "web", "app", "tokens.css"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(here, "project-docs.json"), "utf8"));
const out = process.argv[2];
if (!out) { console.error("Usage: node docs/build-playground.mjs <output.html>"); process.exit(1); }

const block = (re) => { const m = css.match(new RegExp(re + "\\s*\\{([\\s\\S]*?)\\n\\s*\\}")); return m ? m[1] : ""; };
const parse = (b) => [...b.matchAll(/--([\w-]+):\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/g)].map((m) => ({ name: m[1], value: m[2].trim(), use: m[3] || "" }));
const light = parse(block(String.raw`:root(?!\[)`));
const dark = Object.fromEntries(parse(block(String.raw`:root\[data-theme="dark"\]`)).map((t) => [t.name, t.value]));
const group = (n) =>
  /^(bg|surface)/.test(n) ? "Surfaces" : /^line/.test(n) ? "Lines" : /^ink/.test(n) ? "Ink" :
  /^(accent|on-accent)/.test(n) ? "Accent" : /^(go|warn|danger)/.test(n) ? "Semantic" :
  /^(drop|scrim|shadow)/.test(n) ? "Interaction and depth" : /^zone/.test(n) ? "Zone colors" :
  /^font/.test(n) ? "Families" : /^fs-/.test(n) ? "Type sizes" : /^fw-/.test(n) ? "Weights" :
  /^r-/.test(n) ? "Radii" : /^sp-/.test(n) ? "Spacing" : /^layout/.test(n) ? "Layout" : "Other";
const TOKENS = light.map((t) => ({ name: t.name, light: t.value, dark: t.name in dark ? dark[t.name] : null, use: t.use, group: group(t.name) }));

// Token blocks re-scoped from :root to .stage so only the screens change, not the panel.
const stageCss = css
  .replace(/@media \(prefers-color-scheme: dark\) \{[\s\S]*$/, "")
  .replace(/:root\[data-theme="dark"\]/g, '.stage[data-theme="dark"]')
  .replace(/:root/g, ".stage");

const links = Object.entries({ "Style Ledger": manifest.artifacts.styleLedger, Plan: manifest.artifacts.plan, "Build Log": manifest.artifacts.buildLog }).map(([k, u]) => u ? `<a href="${u}" target="_blank" rel="noopener">${k}</a>` : "").join("");

const screens = String.raw`
<section data-screen="home">
  <header class="a-header"><div class="a-in"><b class="a-logo">ArchPresent</b><nav><a>Templates</a><a>Features</a><a>How it works</a></nav><span class="push"></span><a>Sign in</a><button class="a-btn solid">Open Editor</button></div></header>
  <div class="a-hero"><div class="a-in"><span class="a-badge acc">New</span><h1>Presentations that print at A0, built in 15 minutes</h1><p>Pick a template, drop in your photos, edit the text and download every page at full resolution.</p><div class="row"><button class="a-btn solid lg">Browse templates</button><button class="a-btn ghost lg">See how it works</button></div></div></div>
  <div class="a-in a-sec"><h2>Why architects use it</h2><div class="a-grid3">
    <div class="a-feature"><span class="a-ico">1</span><b>Real print quality</b><p>Every page exports at the template's full resolution.</p></div>
    <div class="a-feature"><span class="a-ico">2</span><b>Photos fit the design</b><p>Photos are cut to the shapes the designer drew.</p></div>
    <div class="a-feature"><span class="a-ico">3</span><b>Drafts are saved</b><p>Your work survives a power or internet cut.</p></div></div></div>
  <div class="a-in a-sec"><h2>How it works</h2><div class="a-steps"><div><span class="a-badge go">Step 1</span><b>Choose a model</b></div><div><span class="a-badge go">Step 2</span><b>Fill in your project</b></div><div><span class="a-badge go">Step 3</span><b>Buy and download</b></div></div></div>
  <div class="a-cta"><div class="a-in"><h2>Start your first presentation</h2><button class="a-btn solid lg">Open Editor</button></div></div>
  <footer class="a-footer"><div class="a-in"><b>ArchPresent</b><span>Templates</span><span>Sign in</span><span class="push"></span><span>2026 ArchPresent</span></div></footer>
</section>

<section data-screen="gallery" hidden>
  <header class="a-header"><div class="a-in"><b class="a-logo">ArchPresent</b><nav><a class="on">Templates</a><a>Features</a></nav><span class="push"></span><a>Sign in</a><button class="a-btn solid">Open Editor</button></div></header>
  <div class="a-in a-sec"><h1 class="a-h1">Templates</h1><p class="a-sub">Pick a template to open it in the editor.</p>
    <div class="a-cards">
      <div class="a-card"><div class="thumb"><span class="a-badge go price">1000 pts</span>3012 x 3893</div><div class="body"><b>Villa Horizon</b><span>4 photos, 2 text fields</span><em>from 11.psd</em></div></div>
      <div class="a-card"><div class="thumb"><span class="a-badge go price">1000 pts</span>5395 x 3031</div><div class="body"><b>Urban Block</b><span>6 photos, 3 text fields</span><em>from 12.psd</em></div></div>
      <div class="a-card"><div class="thumb"><span class="a-badge go price">2500 pts</span>3586 x 5636</div><div class="body"><b>Tower Study</b><span>8 photos, 4 text fields</span><em>from 13.psd</em></div></div>
      <div class="a-card"><div class="thumb"><span class="a-badge go price">1000 pts</span>3457 x 2396</div><div class="body"><b>Courtyard</b><span>3 photos, 1 text field</span><em>from 09.psd</em></div></div></div></div>
</section>

<section data-screen="login" hidden>
  <div class="a-center"><div class="a-auth"><b class="a-logo">ArchPresent</b><h1>Sign in</h1><p>Welcome back. Your drafts are waiting.</p>
    <label class="a-label">Email<input class="a-field" value="said@firm.dz"></label>
    <label class="a-label">Password<input class="a-field" type="password" value="password"></label>
    <div class="a-note dng">Wrong email or password.</div>
    <button class="a-btn solid full">Sign in</button><p class="a-small">No account yet? <a>Create one</a></p></div></div>
</section>

<section data-screen="dashboard" hidden>
  <div class="a-top"><b>ArchPresent</b><span class="push"></span><span class="a-muted">said@firm.dz</span><button class="a-btn ghost">Sign out</button></div>
  <div class="a-in a-sec"><h1 class="a-h1">Welcome, Said</h1><p class="a-sub">Pick a template to start a new presentation.</p>
    <div class="a-note go">Balance: 20000 pts. Last top-up 12 days ago.</div>
    <div class="a-cards" style="margin-top:var(--sp-5)">
      <div class="a-card"><div class="thumb"><span class="a-badge go price">1000 pts</span>3012 x 3893</div><div class="body"><b>Villa Horizon</b><span>4 photos, 2 text fields</span></div></div>
      <div class="a-card"><div class="thumb"><span class="a-badge go price">1000 pts</span>5395 x 3031</div><div class="body"><b>Urban Block</b><span>6 photos, 3 text fields</span></div></div></div></div>
</section>

<section data-screen="editor" hidden>
  <div class="a-top"><b>ArchPresent</b><span class="a-mono">11.psd</span><span class="a-mono a-faint">Loading 12/12...</span><span class="push"></span><button class="a-btn soft warn">Apply</button><button class="a-btn soft">Export PNG</button><button class="a-btn soft go">Export JPG</button></div>
  <div class="a-ed">
    <aside class="a-side"><div class="a-sidehead">Layers <span class="a-count">18</span><span class="push"></span><small>top to bottom</small></div>
      <div class="a-rows">
        <div class="a-lrow"><span class="nm">foreground</span><span class="z">z19</span><button class="a-mini">&uarr;</button><button class="a-mini">&darr;</button></div>
        <div class="a-lrow sel txt"><div class="top"><span class="a-tag t">TEXT</span><span class="nm">projectname</span><span class="z">z18.5</span><button class="a-mini">&uarr;</button><button class="a-mini">&darr;</button></div>
          <textarea class="a-field" rows="2">projet : etude et suivi pour la realisation</textarea>
          <div class="ctl"><select class="a-field"><option>Arial</option></select><input class="a-field sm" value="86"><span class="a-mono">px</span><button class="a-chip">B</button><button class="a-chip">I</button><span class="a-color"></span></div>
          <div class="ctl"><button class="a-chip on">Left</button><button class="a-chip">Center</button><button class="a-chip">Right</button></div>
          <p class="a-hint">Click text on canvas to select it, then drag it to reposition or drag the handle to resize</p></div>
        <div class="a-lrow"><div class="top"><span class="a-tag p">PHOTO</span><span class="nm">side2</span><span class="z">z17</span><button class="a-mini">&uarr;</button><button class="a-mini">&darr;</button></div>
          <div class="ctl"><span class="a-mono a-faint">3012 x 3893px</span></div><div class="ctl"><button class="a-chip on">Fit</button><button class="a-chip">Fill</button><button class="a-btn soft sm">Upload</button></div></div>
        <div class="a-lrow drag"><span class="nm">level 2</span><span class="z">z13</span><button class="a-mini">&uarr;</button><button class="a-mini">&darr;</button></div>
        <div class="a-lrow drop"><span class="nm">Rectangle 10</span><span class="z">z12</span><button class="a-mini">&uarr;</button><button class="a-mini">&darr;</button></div>
        <div class="a-lrow"><div class="top"><span class="a-tag p">PHOTO</span><span class="nm">front</span><span class="z">z11</span><button class="a-mini">&uarr;</button><button class="a-mini" disabled>&darr;</button></div></div>
      </div></aside>
    <div class="a-main"><div class="a-title"><h1>Sample Model <span>(Cover)</span></h1></div>
      <div class="a-stage"><button class="a-arrow" disabled>&lsaquo;</button>
        <div class="a-area"><div class="a-canvas"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
          <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9db4c9"/><stop offset="1" stop-color="#e7edf3"/></linearGradient></defs>
          <rect width="400" height="300" fill="#ffffff"/>
          <polygon points="20,20 190,20 120,120 20,150" fill="url(#sky)"/>
          <polygon points="210,20 380,20 380,130 280,130" style="fill:var(--zone-photo);fill-opacity:.2;stroke:var(--zone-photo);stroke-width:2;stroke-dasharray:6 4"/>
          <polygon points="20,170 220,170 220,280 20,280" style="fill:var(--zone-plan);fill-opacity:.2;stroke:var(--zone-plan);stroke-width:2;stroke-dasharray:6 4"/>
          <rect x="240" y="170" width="140" height="110" style="fill:var(--zone-model);fill-opacity:.2;stroke:var(--zone-model);stroke-width:2;stroke-dasharray:6 4"/>
          <rect x="262" y="50" width="62" height="16" rx="3" style="fill:var(--zone-photo)"/><text x="268" y="62" font-size="10" font-family="sans-serif" fill="#fff">+ Photo: side</text>
          <rect x="94" y="216" width="64" height="16" rx="3" style="fill:var(--zone-plan)"/><text x="100" y="228" font-size="10" font-family="sans-serif" fill="#fff">+ Plan: plan</text>
          <rect x="278" y="216" width="70" height="16" rx="3" style="fill:var(--zone-model)"/><text x="284" y="228" font-size="10" font-family="sans-serif" fill="#fff">+ Model: view</text>
          <text x="30" y="196" font-size="16" font-family="Arial,sans-serif" fill="#000">projet : etude et suivi</text>
          <rect x="26" y="180" width="150" height="22" fill="none" style="stroke:var(--accent)" stroke-width="1.5" stroke-dasharray="5 4"/>
          <circle cx="176" cy="191" r="5" fill="#fff" style="stroke:var(--accent)" stroke-width="2"/>
          <g fill="#000" fill-opacity=".13" font-size="14" font-weight="700" font-family="sans-serif"><text transform="translate(60 80) rotate(-22)">ArchPresent unpaid preview</text><text transform="translate(180 170) rotate(-22)">ArchPresent unpaid preview</text><text transform="translate(40 260) rotate(-22)">ArchPresent unpaid preview</text></g>
        </svg></div></div>
        <button class="a-arrow">&rsaquo;</button></div></div></div>
</section>

<section data-screen="admin" hidden>
  <div class="a-top"><b>ArchPresent <span class="a-tag t">Admin</span></b><span class="push"></span><a>Back to site</a></div>
  <div class="a-in a-sec"><h1 class="a-h1">Templates</h1><p class="a-sub">3 templates, 182 MB on disk.</p>
    <div class="a-note warn">This page has no sign-in yet. Anyone with the link can open it.</div>
    <div class="a-tw"><table><thead><tr><th>ID</th><th>Source</th><th>Converted</th><th>Canvas</th><th>Zones</th><th>Size</th><th>Actions</th></tr></thead><tbody>
      <tr><td class="a-mono">villa</td><td>11.psd</td><td>21 Aug 2026</td><td>3012 x 3893</td><td>4 photos, 2 text</td><td>60.1 MB</td><td><a>Open editor</a> <a>JSON</a></td></tr>
      <tr><td class="a-mono">urban</td><td>12.psd</td><td>24 Aug 2026</td><td>5395 x 3031</td><td>6 photos, 3 text</td><td>71.4 MB</td><td><a>Open editor</a> <a>JSON</a></td></tr>
      <tr><td class="a-mono">tower</td><td>13.psd</td><td>01 Sep 2026</td><td>3586 x 5636</td><td>8 photos, 4 text</td><td>50.6 MB</td><td><a>Open editor</a> <a>JSON</a></td></tr></tbody></table></div></div>
</section>

<section data-screen="dialog" hidden>
  <div class="a-scrim"><div class="a-modal"><h2>Pay to save this export</h2><p>Unlocks one export of <b>template</b>. Each future save is a separate payment.</p>
    <div class="sum"><span>One export: template</span><span>1000 pts</span></div><div class="sum tot"><span>Total</span><span>1000 pts</span></div>
    <button class="a-btn solid full">Pay 1000 pts</button><button class="a-btn ghost full">Cancel</button>
    <p class="a-small">Your balance after this purchase: 19000 pts.</p></div></div>
</section>

<section data-screen="states" hidden>
  <div class="a-in a-sec"><h2>Buttons</h2><div class="row"><button class="a-btn solid">Solid</button><button class="a-btn soft">Soft</button><button class="a-btn soft go">Soft go</button><button class="a-btn soft warn">Soft warn</button><button class="a-btn soft dng">Soft danger</button><button class="a-btn ghost">Ghost</button><button class="a-btn solid" disabled>Disabled</button></div>
    <h2>Badges and tags</h2><div class="row"><span class="a-badge go">1000 pts</span><span class="a-badge acc">Photo</span><span class="a-badge warn">Partial</span><span class="a-badge dng">Error</span><span class="a-tag p">PHOTO</span><span class="a-tag t">TEXT</span></div>
    <h2>Form fields and chips</h2><div class="row"><input class="a-field" value="Text field"><select class="a-field"><option>Select</option></select><button class="a-chip on">On</button><button class="a-chip">Off</button><span class="a-color"></span></div>
    <h2>Notices</h2><div class="a-notes"><div class="a-note go">Saved. Your draft is kept for 1 month.</div><div class="a-note warn">This photo is small for A0 printing.</div><div class="a-note dng">Error: template.json not found.</div></div>
    <h2>Layer rows</h2><div class="a-rows" style="max-width:320px"><div class="a-lrow"><span class="nm">Rest</span></div><div class="a-lrow sel"><span class="nm">Selected</span></div><div class="a-lrow drag"><span class="nm">Dragging</span></div><div class="a-lrow drop"><span class="nm">Drop target</span></div></div>
    <h2>Zone colors</h2><div class="row"><span class="a-zone" style="--c:var(--zone-photo)">Photo</span><span class="a-zone" style="--c:var(--zone-plan)">Plan</span><span class="a-zone" style="--c:var(--zone-model)">Model</span><span class="a-zone" style="--c:var(--zone-text)">Text</span><span class="a-zone" style="--c:var(--zone-logo)">Logo</span></div>
    <h2>Type scale</h2><div class="a-scale"><span style="font-size:var(--fs-10)">10 Tiny label</span><span style="font-size:var(--fs-11)">11 Uppercase label</span><span style="font-size:var(--fs-12)">12 Meta</span><span style="font-size:var(--fs-13)">13 Controls</span><span style="font-size:var(--fs-14)">14 Body in tools</span><span style="font-size:var(--fs-15)">15 Body on the website</span><span style="font-size:var(--fs-18)">18 Lead text</span><span style="font-size:var(--fs-22)">22 Section title</span><span style="font-size:var(--fs-30)">30 Page title</span><span style="font-size:var(--fs-44)">44 Display</span></div></div>
</section>
`;

const stageComponentCss = String.raw`
.stage { background: var(--bg); color: var(--ink-body); font-family: var(--font-sans); font-size: var(--fs-14); line-height: 1.5; border: 1px solid var(--pg-line); border-radius: 8px; overflow: hidden; min-height: 520px; }
.stage * { box-sizing: border-box; }
.stage section[hidden] { display: none !important; }
.stage a { color: var(--accent); text-decoration: none; cursor: pointer; }
.stage .push { flex: 1; }
.stage .row { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; margin: var(--sp-2) 0 var(--sp-5); }
.stage h1, .stage h2, .stage p { margin: 0; }
.a-in { max-width: var(--layout-content); margin: 0 auto; padding-left: var(--sp-5); padding-right: var(--sp-5); display: flex; align-items: center; gap: var(--sp-4); flex-wrap: wrap; }
.a-sec { display: block; padding-top: var(--sp-7); padding-bottom: var(--sp-7); }
.a-header { background: var(--surface); border-bottom: 1px solid var(--line); }
.a-header .a-in { height: 56px; }
.a-header nav { display: flex; gap: var(--sp-4); }
.a-header nav a { color: var(--ink-muted); }
.a-header nav a.on { color: var(--ink); }
.a-logo { color: var(--ink); font-size: var(--fs-18); font-weight: var(--fw-bold); }
.a-hero { padding: var(--sp-8) 0; background: var(--surface-sunken); border-bottom: 1px solid var(--line); }
.a-hero .a-in { display: grid; gap: var(--sp-4); justify-items: start; }
.a-hero h1 { font-size: var(--fs-44); font-weight: var(--fw-bold); color: var(--ink); line-height: 1.08; max-width: 18ch; }
.a-hero p { font-size: var(--fs-18); color: var(--ink-muted); max-width: 52ch; }
.a-sec h2 { font-size: var(--fs-22); color: var(--ink); font-weight: var(--fw-semibold); margin: var(--sp-5) 0 var(--sp-3); }
.a-sec > h2:first-child { margin-top: 0; }
.a-h1 { font-size: var(--fs-30); font-weight: var(--fw-bold); color: var(--ink); margin-bottom: var(--sp-1); }
.a-sub { color: var(--ink-muted); font-size: var(--fs-15); margin-bottom: var(--sp-6); }
.a-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--sp-4); }
.a-feature { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); padding: var(--sp-5); display: grid; gap: var(--sp-2); }
.a-feature b { color: var(--ink); font-size: var(--fs-15); }
.a-feature p { color: var(--ink-muted); font-size: var(--fs-14); }
.a-ico { width: 32px; height: 32px; border-radius: var(--r-md); background: var(--accent-bg); color: var(--accent-ink); border: 1px solid var(--accent-line); display: grid; place-items: center; font-family: var(--font-mono); font-size: var(--fs-13); }
.a-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--sp-4); }
.a-steps div { display: grid; gap: var(--sp-2); justify-items: start; padding: var(--sp-4); border-left: 3px solid var(--accent-line); background: var(--surface); border-radius: var(--r-sm); }
.a-steps b { color: var(--ink); }
.a-cta { background: var(--accent-bg); border-top: 1px solid var(--accent-line); padding: var(--sp-7) 0; }
.a-cta .a-in { justify-content: space-between; }
.a-cta h2 { font-size: var(--fs-22); color: var(--ink); }
.a-footer { border-top: 1px solid var(--line); background: var(--surface); padding: var(--sp-4) 0; font-size: var(--fs-13); color: var(--ink-muted); }
.a-footer b { color: var(--ink); }
.a-btn { font-family: var(--font-sans); font-size: var(--fs-13); font-weight: var(--fw-semibold); padding: 6px 16px; border-radius: var(--r-md); border: 1px solid transparent; cursor: pointer; }
.a-btn.lg { font-size: var(--fs-15); padding: 10px 22px; }
.a-btn.sm { padding: 3px 10px; font-size: var(--fs-12); }
.a-btn.full { display: block; width: 100%; padding: 10px 0; margin-top: var(--sp-2); }
.a-btn.solid { background: var(--accent); color: var(--on-accent); }
.a-btn.soft { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.a-btn.soft.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.a-btn.soft.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); }
.a-btn.soft.dng { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-line); }
.a-btn.ghost { background: transparent; color: var(--ink-muted); border-color: var(--line-strong); font-weight: var(--fw-medium); }
.a-btn:disabled { opacity: .5; cursor: default; }
.a-badge { display: inline-block; font-family: var(--font-mono); font-size: var(--fs-11); font-weight: var(--fw-semibold); text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: var(--r-sm); border: 1px solid transparent; }
.a-badge.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.a-badge.acc { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.a-badge.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); }
.a-badge.dng { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-line); }
.a-tag { font-family: var(--font-mono); font-size: var(--fs-10); font-weight: var(--fw-bold); padding: 1px 6px; border-radius: var(--r-sm); color: var(--on-accent); }
.a-tag.p { background: var(--zone-photo); }
.a-tag.t { background: var(--zone-text); }
.a-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: var(--sp-5); }
.a-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
.a-card .thumb { position: relative; aspect-ratio: 4 / 3; background: var(--accent-bg); color: var(--ink-subtle); font-family: var(--font-mono); font-size: var(--fs-12); display: flex; align-items: center; justify-content: center; }
.a-card .price { position: absolute; top: 10px; right: 10px; }
.a-card .body { padding: 14px var(--sp-4); display: grid; gap: 2px; }
.a-card .body b { color: var(--ink); font-size: var(--fs-15); font-weight: var(--fw-semibold); }
.a-card .body span { color: var(--ink-muted); font-size: var(--fs-12); }
.a-card .body em { color: var(--ink-subtle); font-size: var(--fs-11); font-style: normal; }
.a-center { min-height: 520px; display: grid; place-items: center; padding: var(--sp-6) var(--sp-4); }
.a-auth { width: 100%; max-width: 380px; background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--r-lg); padding: var(--sp-7); display: grid; gap: var(--sp-3); }
.a-auth h1 { font-size: var(--fs-22); color: var(--ink); }
.a-auth p { color: var(--ink-muted); font-size: var(--fs-13); }
.a-small { color: var(--ink-subtle); font-size: var(--fs-12); }
.a-label { display: grid; gap: var(--sp-1); font-size: var(--fs-12); color: var(--ink-muted); font-weight: var(--fw-medium); }
.a-field { font-family: var(--font-sans); font-size: var(--fs-13); padding: 7px 10px; background: var(--surface-raised); color: var(--ink-body); border: 1px solid var(--line-strong); border-radius: var(--r-md); min-width: 0; width: 100%; }
.row .a-field { width: auto; }
.a-field.sm { width: 54px; }
.a-note { padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); font-size: var(--fs-13); border: 1px solid transparent; }
.a-note.go { background: var(--go-bg); color: var(--go); border-color: var(--go-line); }
.a-note.warn { background: var(--warn-bg); color: var(--warn); border-color: var(--warn-line); margin-bottom: var(--sp-4); }
.a-note.dng { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-line); }
.a-notes { display: grid; gap: var(--sp-2); max-width: 420px; margin-top: var(--sp-2); }
.a-top { display: flex; align-items: center; gap: var(--sp-3); height: var(--layout-topbar); padding: 0 var(--sp-5); background: var(--surface); border-bottom: 1px solid var(--line); }
.a-top b { color: var(--ink); font-size: var(--fs-15); }
.a-muted { color: var(--ink-muted); font-size: var(--fs-13); }
.a-mono { font-family: var(--font-mono); font-size: var(--fs-12); color: var(--ink-subtle); }
.a-faint { color: var(--ink-faint); }
.a-tw { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); }
.a-tw table { border-collapse: collapse; width: 100%; min-width: 640px; font-size: var(--fs-13); }
.a-tw th, .a-tw td { text-align: left; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--line-faint); }
.a-tw th { font-family: var(--font-mono); font-size: var(--fs-11); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-subtle); font-weight: var(--fw-medium); background: var(--surface-sunken); }
.a-tw tr:last-child td { border-bottom: 0; }
.a-ed { display: flex; min-height: 440px; }
.a-side { width: var(--layout-sidebar); flex-shrink: 0; background: var(--surface-sunken); border-right: 1px solid var(--line); display: flex; flex-direction: column; }
.a-sidehead { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-3) 14px; border-bottom: 1px solid var(--line); font-size: var(--fs-11); font-weight: var(--fw-bold); letter-spacing: .08em; text-transform: uppercase; color: var(--ink-subtle); }
.a-sidehead small { font-size: var(--fs-10); font-weight: var(--fw-regular); text-transform: none; letter-spacing: 0; color: var(--ink-faint); }
.a-count { background: var(--surface-hover); color: var(--ink-subtle); font-size: var(--fs-10); padding: 1px 6px; border-radius: 8px; }
.a-rows { display: grid; gap: var(--sp-1); padding: var(--sp-2) 10px; }
.a-lrow { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2); padding: var(--sp-2) 10px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md); font-size: var(--fs-13); }
.a-lrow .top { display: flex; align-items: center; gap: var(--sp-2); width: 100%; }
.a-lrow .nm { flex: 1; color: var(--ink-body); font-weight: var(--fw-medium); min-width: 0; }
.a-lrow .z { font-family: var(--font-mono); font-size: var(--fs-10); color: var(--ink-faint); }
.a-lrow .ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; width: 100%; }
.a-lrow.sel { background: var(--accent-bg); border-color: var(--accent-line); }
.a-lrow.drag { opacity: .5; }
.a-lrow.drop::before { content: ""; position: absolute; left: 0; right: 0; top: -4px; height: 3px; background: var(--drop); border-radius: var(--r-sm); }
.a-lrow textarea { resize: none; }
.a-mini { width: 22px; height: 22px; padding: 0; background: var(--surface-raised); color: var(--ink-muted); border: 1px solid var(--line-strong); border-radius: var(--r-sm); font-size: var(--fs-12); cursor: pointer; }
.a-mini:disabled { color: var(--ink-faint); cursor: default; }
.a-chip { font-family: var(--font-sans); font-size: var(--fs-12); padding: 3px 10px; background: var(--surface-raised); color: var(--ink-muted); border: 1px solid var(--line-strong); border-radius: var(--r-md); cursor: pointer; }
.a-chip.on { background: var(--accent-bg); color: var(--accent-ink); border-color: var(--accent-line); }
.a-color { width: 28px; height: 22px; background: #000; border: 1px solid var(--line-strong); border-radius: var(--r-sm); display: inline-block; }
.a-hint { font-size: var(--fs-11); color: var(--ink-subtle); line-height: 1.4; }
.a-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.a-title { padding: 14px var(--sp-5) 6px; text-align: center; }
.a-title h1 { font-size: var(--fs-30); font-weight: var(--fw-bold); color: var(--ink); }
.a-title h1 span { font-weight: var(--fw-medium); color: var(--ink-subtle); }
.a-stage { flex: 1; display: flex; min-height: 0; }
.a-arrow { width: var(--layout-arrow); flex-shrink: 0; background: var(--surface-sunken); border: 0; border-left: 1px solid var(--line); border-right: 1px solid var(--line); color: var(--ink); font-size: var(--fs-44); line-height: 1; cursor: pointer; }
.a-arrow:disabled { color: var(--ink-faint); cursor: default; }
.a-area { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: var(--sp-4); background: var(--bg); }
.a-canvas { width: 100%; max-width: 560px; box-shadow: var(--shadow-canvas); background: #ffffff; }
.a-canvas svg { display: block; width: 100%; height: auto; }
.a-scrim { background: var(--scrim); min-height: 520px; display: grid; place-items: center; padding: var(--sp-6) var(--sp-4); }
.a-modal { width: 100%; max-width: 380px; background: var(--surface-raised); border: 1px solid var(--line); border-radius: var(--r-lg); box-shadow: var(--shadow-modal); padding: 28px 26px; }
.a-modal h2 { font-size: var(--fs-18); color: var(--ink); margin-bottom: var(--sp-1); }
.a-modal p { color: var(--ink-muted); font-size: var(--fs-13); margin-bottom: var(--sp-4); }
.a-modal .sum { display: flex; justify-content: space-between; padding: var(--sp-2) 0; border-bottom: 1px solid var(--line-faint); font-size: var(--fs-13); color: var(--ink-muted); }
.a-modal .tot { color: var(--ink); font-weight: var(--fw-bold); border-bottom: 0; }
.a-modal .a-small { text-align: center; margin-top: var(--sp-3); }
.a-zone { min-width: 72px; padding: var(--sp-3) var(--sp-2); text-align: center; font-family: var(--font-mono); font-size: var(--fs-11); color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); border: 2px dashed var(--c); border-radius: var(--r-sm); }
.a-scale { display: grid; gap: var(--sp-1); color: var(--ink); }
@media (max-width: 720px) { .a-ed { flex-direction: column; } .a-side { width: 100%; } .a-arrow { width: 40px; } }
`;

const pageCss = String.raw`
:root { --pg-bg: #eef0f3; --pg-surface: #ffffff; --pg-ink: #16202b; --pg-muted: #5c6773; --pg-line: #d3d8de; --pg-accent: #1f5fd1; --pg-ok: #1f7a46; --pg-warn: #9a5b0a; --pg-warn-bg: #f7ecd9; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --pg-bg: #14181d; --pg-surface: #1c2229; --pg-ink: #e8ecf0; --pg-muted: #98a3af; --pg-line: #2f3842; --pg-accent: #6aa0f2; --pg-ok: #5cbf86; --pg-warn: #e0a44a; --pg-warn-bg: #2b2415; color-scheme: dark; } }
:root[data-theme="dark"] { --pg-bg: #14181d; --pg-surface: #1c2229; --pg-ink: #e8ecf0; --pg-muted: #98a3af; --pg-line: #2f3842; --pg-accent: #6aa0f2; --pg-ok: #5cbf86; --pg-warn: #e0a44a; --pg-warn-bg: #2b2415; color-scheme: dark; }
body { background: var(--pg-bg); color: var(--pg-ink); font-family: "Geist", system-ui, sans-serif; font-size: 14px; line-height: 1.45; }
* { box-sizing: border-box; }
.pg { max-width: 1500px; margin: 0 auto; padding-block: 0 40px; padding-left: max(14px, env(safe-area-inset-left, 0px)); padding-right: max(14px, env(safe-area-inset-right, 0px)); }
.pgbar { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; padding: 10px 0; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; color: var(--pg-muted); border-bottom: 1px solid var(--pg-line); }
.pgbar a { color: var(--pg-accent); }
.pgbar b { color: var(--pg-ink); }
.pgtools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 0; position: sticky; top: env(safe-area-inset-top, 0px); background: var(--pg-bg); z-index: 3; border-bottom: 1px solid var(--pg-line); }
.pgtools h1 { margin: 0 10px 0 0; font-size: 18px; }
.pseg { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--pg-line); border-radius: 6px; overflow: hidden; background: var(--pg-surface); }
.pseg button { font: inherit; font-size: 12px; border: 0; background: transparent; color: var(--pg-muted); padding: 6px 11px; cursor: pointer; }
.pseg button + button { border-left: 1px solid var(--pg-line); }
.pseg button[aria-pressed="true"] { background: var(--pg-accent); color: #fff; }
.pbtn { font: inherit; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--pg-line); background: var(--pg-surface); color: var(--pg-ink); cursor: pointer; }
.pbtn.primary { background: var(--pg-ink); color: var(--pg-bg); border-color: var(--pg-ink); }
.pgrow { flex: 1 1 auto; }
.layout { display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 16px; padding-top: 14px; align-items: start; }
.panel { background: var(--pg-surface); border: 1px solid var(--pg-line); border-radius: 8px; padding: 10px 12px; max-height: calc(100vh - 90px); overflow-y: auto; position: sticky; top: 64px; }
.panel input.q { width: 100%; font: inherit; padding: 6px 8px; border: 1px solid var(--pg-line); border-radius: 6px; background: var(--pg-bg); color: var(--pg-ink); margin-bottom: 8px; }
.panel details { border-top: 1px solid var(--pg-line); padding: 6px 0; }
.panel summary { cursor: pointer; font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--pg-muted); }
.tk { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; align-items: center; padding: 6px 0; }
.tk .nm { font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; }
.tk .nm.chg::after { content: " \25CF"; color: var(--pg-warn); }
.tk .use { grid-column: 1 / -1; font-size: 11px; color: var(--pg-muted); }
.tk .ctl { display: flex; gap: 6px; align-items: center; }
.tk input[type="color"] { width: 30px; height: 26px; padding: 0; border: 1px solid var(--pg-line); border-radius: 4px; background: none; cursor: pointer; }
.tk input[type="text"] { width: 120px; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; padding: 4px 6px; border: 1px solid var(--pg-line); border-radius: 4px; background: var(--pg-bg); color: var(--pg-ink); min-width: 0; }
.tk .x { font: inherit; font-size: 11px; border: 0; background: none; color: var(--pg-accent); cursor: pointer; padding: 0 2px; }
.note { font-size: 12px; color: var(--pg-muted); margin: 0 0 8px; }
.exportbox { margin: 14px 0 0; background: var(--pg-surface); border: 1px solid var(--pg-line); border-radius: 8px; padding: 12px; }
.exportbox textarea { width: 100%; min-height: 150px; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; padding: 8px; border: 1px solid var(--pg-line); border-radius: 6px; background: var(--pg-bg); color: var(--pg-ink); }
.exportbox p { margin: 0 0 8px; font-size: 12px; color: var(--pg-muted); }
@media (max-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr); } .panel { position: static; max-height: 420px; } }
:focus-visible { outline: 2px solid var(--pg-accent); outline-offset: 2px; }
`;

const script = String.raw`
(function () {
  var TOKENS = __TOKENS__;
  var KEY = "archpresent-style-playground";
  var state = { theme: "light", screen: "home", edits: { light: {}, dark: {} }, q: "" };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved && saved.edits) { state.edits = { light: saved.edits.light || {}, dark: saved.edits.dark || {} }; } } catch (e) {}
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ edits: state.edits })); } catch (e) {} }
  var stage = $("stage");

  function val(t, theme) {
    if (t.dark === null) return state.edits.light[t.name] != null ? state.edits.light[t.name] : t.light;
    var base = theme === "dark" ? t.dark : t.light;
    return state.edits[theme][t.name] != null ? state.edits[theme][t.name] : base;
  }
  function applyStyle() {
    var lightCss = TOKENS.map(function (t) { return "--" + t.name + ":" + val(t, "light") + ";"; }).join("");
    var darkCss = TOKENS.filter(function (t) { return t.dark !== null; }).map(function (t) { return "--" + t.name + ":" + val(t, "dark") + ";"; }).join("");
    $("override").textContent = ".stage{" + lightCss + "}.stage[data-theme=\"dark\"]{" + darkCss + "}";
  }
  function isChanged(t, theme) { return t.dark === null ? state.edits.light[t.name] != null : state.edits[theme][t.name] != null; }
  function hex6(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

  function renderPanel() {
    var groups = {}, order = [];
    TOKENS.forEach(function (t) {
      if (t.group === "Families" || t.group === "Weights" || t.group === "Other") return;
      if (state.q && (t.name + " " + t.use).toLowerCase().indexOf(state.q) < 0) return;
      if (!groups[t.group]) { groups[t.group] = []; order.push(t.group); }
      groups[t.group].push(t);
    });
    var html = "";
    order.forEach(function (g) {
      html += '<details open><summary>' + esc(g) + '</summary>' + groups[g].map(function (t) {
        var v = val(t, state.theme), ch = isChanged(t, state.theme);
        var ctl = hex6(v) ? '<input type="color" data-n="' + t.name + '" value="' + v + '" aria-label="' + t.name + ' color"><input type="text" data-n="' + t.name + '" value="' + esc(v) + '" aria-label="' + t.name + ' value">'
                          : '<input type="text" data-n="' + t.name + '" value="' + esc(v) + '" aria-label="' + t.name + ' value">';
        return '<div class="tk"><span class="nm' + (ch ? " chg" : "") + '">--' + t.name + '</span><span class="ctl">' + ctl + (ch ? '<button type="button" class="x" data-r="' + t.name + '">reset</button>' : "") + '</span><span class="use">' + esc(t.use) + '</span></div>';
      }).join("") + '</details>';
    });
    $("panelBody").innerHTML = html || '<p class="note">No token matches.</p>';
  }
  function setEdit(name, v) {
    var t = TOKENS.filter(function (x) { return x.name === name; })[0]; if (!t) return;
    var theme = t.dark === null ? "light" : state.theme;
    var base = t.dark === null ? t.light : (theme === "dark" ? t.dark : t.light);
    if (v === base) delete state.edits[theme][name]; else state.edits[theme][name] = v;
    persist(); applyStyle(); renderExport();
  }
  $("panelBody").addEventListener("input", function (e) {
    var el = e.target; var n = el.getAttribute("data-n"); if (!n) return;
    var v = el.value.trim();
    if (el.type === "color") { setEdit(n, v); var txt = el.parentNode.querySelector('input[type="text"]'); if (txt) txt.value = v; }
    else if (v) { setEdit(n, v); var col = el.parentNode.querySelector('input[type="color"]'); if (col && hex6(v)) col.value = v; }
  });
  $("panelBody").addEventListener("change", function () { renderPanel(); });
  $("panelBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-r]"); if (!b) return;
    var n = b.getAttribute("data-r"); var t = TOKENS.filter(function (x) { return x.name === n; })[0];
    delete state.edits[t.dark === null ? "light" : state.theme][n];
    persist(); applyStyle(); renderPanel(); renderExport();
  });
  $("q").addEventListener("input", function () { state.q = this.value.trim().toLowerCase(); renderPanel(); });

  function renderExport() {
    var out = [];
    function lines(theme) {
      return TOKENS.filter(function (t) { return (t.dark === null ? theme === "light" : true) && state.edits[theme][t.name] != null; })
        .map(function (t) { return "  --" + t.name + ": " + state.edits[theme][t.name] + ";"; });
    }
    var l = lines("light"), d = lines("dark");
    if (l.length) out.push("/* in the :root block (light) */\n" + l.join("\n"));
    if (d.length) out.push("/* in the :root[data-theme=\"dark\"] block, and the same values in the system dark block */\n" + d.join("\n"));
    $("exportText").value = out.length ? out.join("\n\n") : "No changes yet. Edit a token in the panel and the CSS to paste back appears here.";
    $("changeCount").textContent = String(l.length + d.length);
  }
  $("copyBtn").addEventListener("click", function () {
    var ta = $("exportText"), b = this;
    function ok() { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy changes"; }, 1000); }
    function fallback() { ta.focus(); ta.select(); }
    try { navigator.clipboard.writeText(ta.value).then(ok, fallback); } catch (e) { fallback(); }
  });
  $("resetBtn").addEventListener("click", function () {
    var b = this;
    if (b.getAttribute("data-armed") !== "1") { b.setAttribute("data-armed", "1"); b.textContent = "Click again to reset all"; setTimeout(function () { b.removeAttribute("data-armed"); b.textContent = "Reset all"; }, 2500); return; }
    state.edits = { light: {}, dark: {} }; persist(); applyStyle(); renderPanel(); renderExport();
    b.removeAttribute("data-armed"); b.textContent = "Reset all";
  });

  function setTheme(t) {
    state.theme = t; stage.setAttribute("data-theme", t);
    document.querySelectorAll("#themeSeg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === t)); });
    renderPanel();
  }
  function setScreen(s) {
    state.screen = s;
    stage.querySelectorAll("section[data-screen]").forEach(function (x) { x.hidden = x.getAttribute("data-screen") !== s; });
    document.querySelectorAll("#screenSeg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === s)); });
  }
  $("themeSeg").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) setTheme(b.getAttribute("data-v")); });
  $("screenSeg").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) setScreen(b.getAttribute("data-v")); });
  stage.addEventListener("click", function (e) { if (e.target.closest("a, button")) e.preventDefault(); });

  applyStyle(); setTheme("light"); setScreen("home"); renderExport();
})();
`.replace("__TOKENS__", JSON.stringify(TOKENS));

const screenNames = [["home", "Home"], ["gallery", "Gallery"], ["login", "Sign in"], ["dashboard", "Dashboard"], ["editor", "Editor"], ["admin", "Admin"], ["dialog", "Payment dialog"], ["states", "All states"]];

const html = `<title>ArchPresent Style Playground</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
${pageCss}
:root { --font-geist-sans: "Geist"; --font-geist-mono: "Geist Mono"; }
${stageCss}
${stageComponentCss}
</style>
<style id="override"></style>
<div class="pg">
  <div class="pgbar"><b>Style Playground</b>${links}<span>Generated from web/app/tokens.css</span></div>
  <div class="pgtools">
    <h1>Style Playground</h1>
    <div class="pseg" id="screenSeg" role="group" aria-label="Screen">${screenNames.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="false">${l}</button>`).join("")}</div>
    <span class="pgrow"></span>
    <div class="pseg" id="themeSeg" role="group" aria-label="Theme"><button type="button" data-v="light" aria-pressed="true">Light</button><button type="button" data-v="dark" aria-pressed="false">Dark</button></div>
    <button type="button" class="pbtn" id="resetBtn">Reset all</button>
  </div>
  <div class="layout">
    <div class="panel"><p class="note">Edits apply to the theme you are previewing. Tokens that do not change between themes (sizes, radii, zone colors) apply to both.</p>
      <input class="q" id="q" type="search" placeholder="Search tokens" aria-label="Search tokens"><div id="panelBody"></div></div>
    <div>
      <div class="stage" id="stage" data-theme="light">${screens}</div>
      <div class="exportbox"><p><b id="changeCount">0</b> changed tokens. Copy this and send it to Claude, or paste it into web/app/tokens.css. The Style Ledger and the app follow once it is in that file.</p>
        <textarea id="exportText" readonly aria-label="Changed tokens as CSS"></textarea><p style="margin-top:8px"><button type="button" class="pbtn primary" id="copyBtn">Copy changes</button></p></div>
    </div>
  </div>
</div>
<script>${script}</script>
`;
fs.writeFileSync(out, html);
console.log("wrote", out, html.length, "bytes;", TOKENS.length, "tokens");
