// Renders demo.html to an MP4, frame by frame (deterministic, no dropped frames).
//
// Usage:
//   node record.mjs [--page demo.html] [--fps 30] [--from 0] [--to 120] [--out file.mp4] [--stills 5,30,60]
// Env:
//   PLAYWRIGHT_CORE  path to a playwright-core package (default: resolve normally)
//   FFMPEG           ffmpeg binary with libx264
//   CHROMIUM         chromium executable (default: Playwright's bundled browser)
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const fps = Number(arg("fps", 30));
const from = Number(arg("from", 0));
const to = Number(arg("to", 120));
const out = path.resolve(arg("out", path.join(here, "myKONE-Assistant-Demo.mp4")));
const stills = arg("stills", "");
const pageFile = arg("page", "demo.html");
const ffmpeg = process.env.FFMPEG || "ffmpeg";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ["--force-color-profile=srgb", "--disable-gpu-vsync"],
});
// --scale 2 renders the 1920x1080 layout at 3840x2160 (4K UHD).
const scale = Number(arg("scale", 1));
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// Allow "page.html?insert=3B" style query strings.
const [pagePath, pageQuery] = pageFile.split("?");
const pageUrl = pathToFileURL(path.join(here, pagePath));
if (pageQuery) pageUrl.search = pageQuery;
await page.goto(pageUrl.href);
await page.evaluate(() => document.fonts.ready);

if (stills) {
  // Quick visual check: write PNGs at the given seconds instead of a video.
  for (const s of stills.split(",").map(Number)) {
    await page.evaluate((t) => window.seek(t), s);
    const file = path.join(here, `still-${String(s).padStart(5, "0")}.png`);
    await page.screenshot({ path: file });
    console.log("still", file);
  }
  await browser.close();
  process.exit(0);
}

const enc = spawn(ffmpeg, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => enc.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));

const total = Math.round((to - from) * fps);
const started = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / fps;
  await page.evaluate((x) => window.seek(x), t);
  const buf = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % (fps * 5) === 0) {
    const el = (Date.now() - started) / 1000;
    console.log(`frame ${i}/${total}  t=${t.toFixed(1)}s  elapsed ${el.toFixed(0)}s`);
  }
}
enc.stdin.end();
await done;
await browser.close();
if (errors.length) console.warn("page errors during render:\n  " + [...new Set(errors)].join("\n  "));
console.log("wrote", out);
