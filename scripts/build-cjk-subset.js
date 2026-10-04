/*
 * 生成中文子集字体（Noto Sans SC）。
 *
 * 背景：整包 Noto Sans SC 运行时会按 unicode-range 拉取 ~1MB；本项目中文有限，
 * 故只打包「页面实际用到的字符」，缩到每字重约 74KB。
 *
 * 用法：先 `npm run build -w web`（脚本从 web/dist 提取用到的字符），再
 *   node scripts/build-cjk-subset.js
 * 需要联网访问 Google Fonts CSS API（会自动下载 woff2 到 web/public/fonts/）。
 *
 * 何时重跑：UI 新增了中文文案后（否则新字会回退到系统字体）。
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "web/dist/assets");
const PUB = path.join(ROOT, "web/public/fonts");
const WEIGHTS = "400;500;600;700";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

if (!fs.existsSync(DIST)) {
  console.error("未找到 web/dist/assets，请先 `npm run build -w web`");
  process.exit(1);
}
fs.mkdirSync(PUB, { recursive: true });

// 1. 收集构建产物里出现的非 ASCII 字符（所有中文文案都在 i18n/数据里）
const chars = new Set();
for (const f of fs.readdirSync(DIST).filter((f) => /\.(js|css)$/.test(f))) {
  for (const ch of fs.readFileSync(path.join(DIST, f), "utf8")) {
    if (ch.codePointAt(0) > 0x7f) chars.add(ch);
  }
}
for (const ch of "→←↔×÷·¥€£￡￥¤‰°±⧉—…（）《》、。，：；！？") chars.add(ch);
const text = [...chars].join("");
console.log("非 ASCII 字符数:", chars.size);

const url =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@" +
  WEIGHTS +
  "&text=" +
  encodeURIComponent(text) +
  "&display=swap";

(async () => {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("CSS " + res.status);
  const css = await res.text();

  const faces = [];
  for (const block of css.split("@font-face").slice(1)) {
    const weight = /font-weight:\s*(\d+)/.exec(block);
    const src = /url\((https:[^)]+)\)/.exec(block);
    if (!weight || !src) continue;
    const r = await fetch(src[1], { headers: { "User-Agent": UA } });
    if (!r.ok) {
      console.log("跳过字重", weight[1], r.status);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const name = `noto-sans-sc-${weight[1]}.woff2`;
    fs.writeFileSync(path.join(PUB, name), buf);
    faces.push({ weight: weight[1], name, kb: Math.round(buf.length / 1024) });
  }
  console.log(JSON.stringify(faces));
  console.log("完成。@font-face 的 src 指向 /fonts/<name>（见 web/src/index.css）");
})().catch((e) => {
  console.error("失败:", e.message);
  process.exit(1);
});
