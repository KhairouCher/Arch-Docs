// Usage: node docs/build-design-brief.mjs <outDir> <workDir>
// Builds the website design brief from docs/design-brief.html:
//   - fills in the token table from web/app/tokens.css (so it never drifts),
//   - writes <outDir>/design-brief.html, one file with the screenshots embedded,
//   - prints it to <outDir>/ArchPresent-Design-Brief.pdf with Chrome.
// Edit design-brief.html (and the screenshots in design-brief/), not the outputs.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, workDir] = process.argv.slice(2);
if (!outDir || !workDir) { console.error("Usage: node docs/build-design-brief.mjs <outDir> <workDir>"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(workDir, { recursive: true });
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const css = fs.readFileSync(path.join(here, "..", "web", "app", "tokens.css"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// :root block and the dark block
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
const darkBlock = (css.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/) || [, ""])[1];
const darkVals = Object.fromEntries([...darkBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

// group by the section comments (/* surfaces */ ...)
const groups = [];
for (const line of rootBlock.split("\n")) {
  const sec = line.match(/^\s*\/\*\s*([^*]+?)\s*\*\/\s*$/);
  if (sec) { groups.push({ title: sec[1], rows: [] }); continue; }
  const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/);
  if (m && groups.length) groups[groups.length - 1].rows.push({ name: m[1], light: m[2].trim(), dark: darkVals[m[1]] || "", use: m[3] || "" });
}
const isColor = (v) => /^#|^rgba?\(/.test(v);
const sw = (v) => (isColor(v) ? `<span class="sw" style="background:${esc(v)}"></span>` : "");
const tokens = groups.map((g) => `
<h3>${esc(g.title)}</h3>
<table><thead><tr><th>Token</th><th>Used for</th><th>Light</th><th>Dark</th><th>Your value</th></tr></thead><tbody>
${g.rows.map((r) => `<tr><td><code>${esc(r.name)}</code></td><td>${esc(r.use)}</td><td>${sw(r.light)}<span class="mono">${esc(r.light)}</span></td><td>${r.dark ? sw(r.dark) + `<span class="mono">${esc(r.dark)}</span>` : "same"}</td><td></td></tr>`).join("")}
</tbody></table>`).join("");

let html = fs.readFileSync(path.join(here, "design-brief.html"), "utf8");
if (!html.includes("<!--TOKENS-->")) throw new Error("token marker missing");
html = html.replace("<!--TOKENS-->", tokens);

// one file: embed the screenshots
const standalone = html.replace(/src="design-brief\/([\w.-]+)"/g, (m, f) => {
  const buf = fs.readFileSync(path.join(here, "design-brief", f));
  return `src="data:image/jpeg;base64,${buf.toString("base64")}"`;
});
fs.writeFileSync(path.join(outDir, "design-brief.html"), standalone);

// the PDF is printed from the standalone file
const work = path.join(workDir, "design-brief.html");
fs.writeFileSync(work, standalone);
const pdf = path.join(outDir, "ArchPresent-Design-Brief.pdf");
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--user-data-dir=${path.join(workDir, "chrome-profile")}`, `--print-to-pdf=${pdf}`, pathToFileURL(work).href], { stdio: "ignore", timeout: 120000 });
console.log("html", fs.statSync(path.join(outDir, "design-brief.html")).size, "bytes; pdf", fs.statSync(pdf).size, "bytes;", groups.reduce((n, g) => n + g.rows.length, 0), "tokens");
