// Usage: node docs/build-plan-pdf.mjs <outDir> <workDir>
// Makes the client-facing PDFs of the Plan (French and Arabic) from docs/plan.html.
// Changes versus the live Plan: Said becomes "the client", Khairou becomes "the developer",
// and the developer's local-converter fast path is left out. Printing uses Chrome, which
// shapes Arabic and lays it out right to left correctly.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, workDir] = process.argv.slice(2);
if (!outDir || !workDir) { console.error("Usage: node docs/build-plan-pdf.mjs <outDir> <workDir>"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(workDir, { recursive: true });
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const src = fs.readFileSync(path.join(here, "plan.html"), "utf8");
const iFr = src.indexOf('<div class="wrap" data-lang="fr"');
const iAr = src.indexOf('<div class="wrap" data-lang="ar"');
const iEnd = src.indexOf("<script>", iAr);
const blocks = { fr: src.slice(iFr, iAr), ar: src.slice(iAr, iEnd) };

const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error("marker not found: " + a); return s.slice(i + a.length, j); };

function must(label, s, from, to) {
  if (!s.includes(from)) throw new Error(`${label}: text to change not found: ${from.slice(0, 60)}`);
  return s.replace(from, to);
}
function dropRow(label, s, id) {
  const re = new RegExp(`\\s*<div class="row"><span class="id">${id}</span>[\\s\\S]*?</div></div>`);
  if (!re.test(s)) throw new Error(`${label}: row ${id} not found`);
  return s.replace(re, "");
}

function french(s) {
  s = must("fr admin", s, " Khairou peut aussi convertir sur son propre PC et déposer le résultat, ce qui évite la file d’attente.", "");
  s = must("fr step", s, "<li>Voie rapide, Khairou uniquement : il lance le convertisseur sur son propre PC et dépose le résultat manuellement. Il apparaît comme modèle sans attendre dans la file.</li>", "");
  s = dropRow("fr", s, "P-5.24");
  s = must("fr open", s, "Un gabarit déposé par la voie rapide (converti sur le PC de Khairou) doit-il encore être validé par Said avant sa mise en ligne ? Même question pour les gabarits convertis via la file d’attente.", "Un gabarit converti via la file d’attente doit-il encore être validé par Said avant sa mise en ligne ?");
  s = must("fr client", s, "<dd>Said, architecte (cabinet propre)</dd>", "<dd>Architecte (cabinet propre)</dd>");
  s = s.replace(/(^|[\s>(])à Said\b/g, "$1au client").replace(/(^|[\s>(])de Said\b/g, "$1du client")
       .replace(/(^|[\s>(])à Khairou\b/g, "$1au développeur").replace(/(^|[\s>(])de Khairou\b/g, "$1du développeur");
  s = s.replace(/\bSaid\b/g, "le client").replace(/\bKhairou\b/g, "le développeur");
  s = s.replace(/(^|>|[.?!]\s)(le client|le développeur)/g, (m, p, n) => p + n[0].toUpperCase() + n.slice(1));
  return s;
}
function arabic(s) {
  s = must("ar admin", s, " ويستطيع خيرو أيضًا التحويل على حاسوبه الخاص ورفع الناتج، فيتجاوز الطابور.", "");
  s = must("ar step", s, "<li>المسار السريع، لخيرو وحده: يشغّل المحوّل على حاسوبه الخاص ويرفع الناتج يدويًا. يظهر نموذجًا دون انتظار الطابور.</li>", "");
  s = dropRow("ar", s, "P-5.24");
  s = must("ar open", s, "هل يحتاج قالب رُفع عبر المسار السريع (حُوِّل على حاسوب خيرو) إلى مراجعة سعيد قبل نشره؟ والسؤال نفسه عن القوالب المحوَّلة عبر الطابور.", "هل يحتاج قالب حُوِّل عبر الطابور إلى مراجعة سعيد قبل نشره؟");
  s = must("ar client", s, "<dd>سعيد، مهندس معماري (مكتبه الخاص)</dd>", "<dd>مهندس معماري (مكتبه الخاص)</dd>");
  const L = "(?<![\\u0600-\\u06FF])";
  const swap = (from, to) => { s = s.replace(new RegExp(L + from, "g"), to); };
  swap("لسعيد", "للعميل"); swap("لخيرو", "للمطوّر"); swap("وسعيد", "والعميل"); swap("وخيرو", "والمطوّر");
  swap("سعيد", "العميل"); swap("خيرو", "المطوّر");
  return s;
}

const css = String.raw`
@page { size: A4; margin: 16mm 14mm 18mm; @bottom-center { content: counter(page) " / " counter(pages); font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 8pt; color: #5b646b; } }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #15181b; background: #fff; }
a { color: #24559e; text-decoration: none; }
.id { font-family: Consolas, "Courier New", monospace; font-size: 8.5pt; color: #24559e; white-space: nowrap; direction: ltr; unicode-bidi: isolate; }
.d { direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
html[dir="rtl"] .mast h1 { text-align: right; }
.mast { padding: 0 0 8mm; border-bottom: 1.5pt solid #15181b; margin-bottom: 6mm; }
.mast h1 { margin: 0; font-size: 34pt; line-height: 1; font-weight: 800; letter-spacing: .01em; text-transform: uppercase; direction: ltr; text-align: start; }
.mast .doc { margin: 1mm 0 6mm; font-size: 14pt; letter-spacing: .1em; color: #5b646b; }
html[lang="ar"] .mast .doc { letter-spacing: 0; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; margin: 0; }
.meta div { min-width: 0; }
.meta dt { font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase; color: #5b646b; }
html[lang="ar"] .meta dt { letter-spacing: 0; text-transform: none; font-size: 8.5pt; }
.meta dd { margin: 0; }
.pill { display: inline-block; font-size: 7.5pt; letter-spacing: .05em; text-transform: uppercase; padding: 0.4mm 2.2mm; border-radius: 1mm; }
html[lang="ar"] .pill { letter-spacing: 0; text-transform: none; font-size: 8.5pt; }
.pill.must { background: #e0efe6; color: #1f6a40; }
.pill.later { background: #ebedee; color: #5b646b; }
.pill.draft { background: #f7ecd9; color: #8a5509; }
.toc { margin: 0 0 6mm; padding: 3mm 4mm; background: #f3f4f2; border: .5pt solid #d6dadc; border-radius: 1.5mm; }
.toc ol { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 8mm; }
.toc li { padding: .6mm 0; }
section { margin: 0 0 4mm; }
h2 { margin: 7mm 0 3mm; padding-bottom: 1.5mm; border-bottom: .75pt solid #d6dadc; font-size: 16pt; font-weight: 700; break-after: avoid; }
h2 .n { font-family: Consolas, "Courier New", monospace; font-size: 9pt; color: #5b646b; margin-inline-end: 3mm; font-weight: 400; }
h3 { margin: 5mm 0 2mm; font-size: 11.5pt; font-weight: 700; break-after: avoid; }
p { margin: 0 0 2mm; }
.lead { font-size: 11.5pt; }
ul.plain { margin: 0; padding-inline-start: 6mm; }
ul.plain li { margin-bottom: 1.6mm; }
.cards { display: grid; grid-template-columns: 1fr; gap: 3mm; }
.card, .wf, .open, .scope div { break-inside: avoid; }
.card { border: .5pt solid #d6dadc; border-radius: 1.5mm; padding: 3mm 4mm; background: #fff; }
.card h3 { margin-top: 0; }
.card dl { margin: 0; display: grid; gap: 1.5mm; }
.card dl > div { display: grid; grid-template-columns: 22mm 1fr; gap: 3mm; }
.card dt { font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase; color: #5b646b; padding-top: .6mm; }
html[lang="ar"] .card dt { letter-spacing: 0; text-transform: none; font-size: 8.5pt; }
.card dd { margin: 0; }
.wf { border: .5pt solid #d6dadc; border-radius: 1.5mm; padding: 3mm 4mm; margin-bottom: 3mm; }
.wf header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 1mm 3mm; margin-bottom: 1.5mm; }
.wf h3 { margin: 0; }
.wf header .id[style] { color: #5b646b !important; }
.wf ol { margin: 0; padding-inline-start: 6mm; }
.wf li { margin-bottom: 1mm; }
.row { display: grid; grid-template-columns: 17mm 1fr 34mm; gap: 2mm 4mm; padding: 2.4mm 0; border-bottom: .5pt solid #d6dadc; break-inside: avoid; }
.row .acc { display: block; margin-top: 1mm; font-size: 9pt; color: #5b646b; }
.row .side { display: flex; flex-direction: column; gap: 1mm; align-items: flex-start; font-size: 8pt; color: #5b646b; }
.tablewrap { border: .5pt solid #d6dadc; border-radius: 1.5mm; overflow: hidden; }
table { border-collapse: collapse; width: 100%; font-size: 9pt; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { text-align: start; vertical-align: top; padding: 2mm 3mm; border-bottom: .5pt solid #d6dadc; }
th { font-size: 7.5pt; letter-spacing: .06em; text-transform: uppercase; color: #5b646b; background: #f3f4f2; font-weight: 600; }
html[lang="ar"] th { letter-spacing: 0; text-transform: none; font-size: 8.5pt; }
tr:last-child td { border-bottom: 0; }
.open { background: #f7ecd9; border-inline-start: 1.2mm solid #a9680f; border-radius: 1mm; padding: 2.4mm 3.5mm; margin-bottom: 2.4mm; }
.open .q { margin: 1mm 0; }
.open .who { font-size: 8.5pt; color: #5b646b; }
.scope { display: grid; gap: 2.4mm; }
.scope div { border: .5pt solid #d6dadc; border-radius: 1.5mm; padding: 2.6mm 3.6mm; }
.scope b { display: block; }
.scope span { color: #5b646b; font-size: 9pt; }
`;

const docs = [
  { lang: "fr", dir: "ltr", title: "ArchPresent - Plan", file: "ArchPresent-Plan-FR.pdf", tx: french },
  { lang: "ar", dir: "rtl", title: "ArchPresent - الخطة", file: "ArchPresent-Plan-AR.pdf", tx: arabic },
];
for (const d of docs) {
  const b = d.tx(blocks[d.lang]);
  const mast = between(b, '<div class="mast">', '<div class="layout">').replace(/\s*<\/div>\s*$/, "");
  const toc = between(b, '<nav class="toc"', "</nav>").replace(/^[^>]*>/, "");
  const main = between(b, "<main>", "</main>");
  const html = `<!doctype html><html lang="${d.lang}" dir="${d.dir}"><head><meta charset="utf-8"><title>${d.title}</title><style>${css}</style></head><body>
<div class="mast">${mast}</div>
<nav class="toc">${toc}</nav>
<main>${main}</main></body></html>`;
  const leftovers = (html.match(/Said|Khairou|سعيد|خيرو|[Vv]oie rapide|المسار السريع|propre PC|حاسوبه الخاص|P-5\.24/g) || []);
  if (leftovers.length) throw new Error(`${d.lang}: leftover text after changes: ${[...new Set(leftovers)].join(", ")}`);
  const htmlPath = path.join(workDir, `plan-${d.lang}.html`);
  fs.writeFileSync(htmlPath, html);
  const pdfPath = path.join(outDir, d.file);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--user-data-dir=${path.join(workDir, "chrome-profile")}`, `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: "ignore", timeout: 120000 });
  console.log(d.lang, "->", pdfPath, fs.statSync(pdfPath).size, "bytes");
}
