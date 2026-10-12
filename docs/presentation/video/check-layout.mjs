// Layout sanity check for demo.html: at sampled times, reports visible elements
// that overflow the 1920x1080 frame or their container, and chat messages that
// are clipped by the message pane. Exit code 1 if anything is wrong.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const i = process.argv.indexOf("--page");
const pageFile = i > -1 ? process.argv[i + 1] : "demo.html";
const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(e.message));
await page.goto(pathToFileURL(path.join(here, pageFile)).href);

const problems = [];
for (let t = 0.5; t < 120; t += 0.5) {
  const found = await page.evaluate((t) => {
    window.seek(t);
    const out = [];
    const visible = (el) => { const s = getComputedStyle(el); return s.display !== "none" && parseFloat(s.opacity) > 0.05; };
    document.querySelectorAll(".scene").forEach((sc) => {
      if (!visible(sc)) return;
      sc.querySelectorAll("h1,h2,.sub,.kicker,.card,.step,.stat,.phase,.node,.portal,.chat,.caption,.row,.ms," +
        ".dash,.fnode,.palette,.src,.kb-stats,.code,.site,.chan,.wall,.mini,.kpi,.chatbox,.ticket,.meta div,.tstep,.log div," +
        ".card360,.timeline,.ev,.chart,.loop").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.left < -2 || r.top < -2 || r.right > 1922 || r.bottom > 1082)
          out.push(`${sc.id}: ${el.className || el.tagName} out of frame (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`);
        // Containers with overflow:hidden clip slide-in animations on purpose; skip them.
        const clips = getComputedStyle(el).overflow === "hidden";
        if (!clips && el.scrollWidth > el.clientWidth + 2 && !el.classList.contains("portal") && !el.classList.contains("chat"))
          out.push(`${sc.id}: ${el.className || el.tagName} text overflows horizontally`);
      });
    });
    // Content clipped inside a fixed-size container (overflow hidden).
    document.querySelectorAll(".mini, .ticket, .timeline, .chart, .card360, .code").forEach((el) => {
      if (!visible(el.closest(".scene") || el)) return;
      if (el.scrollHeight > el.clientHeight + 2) out.push(`${el.className} content taller than its box`);
    });
    const tpane = document.querySelector("#tmsgs");
    if (tpane && visible(document.querySelector("#s-ticket"))) {
      const pr = tpane.getBoundingClientRect();
      tpane.querySelectorAll(".msg").forEach((m) => {
        if (m.getBoundingClientRect().top < pr.top - 1) out.push(`ticket chat clipped: "${m.textContent.slice(0, 40)}"`);
      });
    }
    const pane = document.querySelector("#msgs");
    if (pane && document.querySelector("#s-chat") && visible(document.querySelector("#s-chat"))) {
      const pr = pane.getBoundingClientRect();
      pane.querySelectorAll(".msg").forEach((m) => {
        const r = m.getBoundingClientRect();
        if (r.top < pr.top - 1) out.push(`chat: message clipped at top: "${m.textContent.slice(0, 40)}"`);
      });
      const body = document.querySelector("#portal-body"), portal = document.querySelector("#portal");
      if (body.getBoundingClientRect().bottom > portal.getBoundingClientRect().bottom + 1)
        out.push("chat: portal body overflows the portal panel");
    }
    return out;
  }, t);
  for (const f of found) problems.push(`t=${t.toFixed(1)}  ${f}`);
}
await browser.close();
for (const e of new Set(jsErrors)) problems.push(`t=?  JS error: ${e}`);
const uniq = [...new Set(problems.map((p) => p.replace(/^t=\S+\s+/, "")))];
if (uniq.length) {
  console.log(`${uniq.length} layout issue(s):`);
  for (const u of uniq) console.log("  " + u + "   first at " + problems.find((p) => p.endsWith(u)).split(" ")[0]);
  process.exit(1);
}
console.log("layout OK at all sampled times");
