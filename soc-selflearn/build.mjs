/* 把教材資料、133+2 張 WebP 原頁、應用邏輯全部塞進一個 HTML。
   產出：社會4上自主學習_全冊.html（離線可直接雙擊開啟） */
import fs from "fs";
import path from "path";

const PROJ = process.cwd();
const PG = path.join(PROJ, "assets", "pg");
const OUT = path.join(PROJ, "社會4上自主學習_全冊.html");

const D = JSON.parse(fs.readFileSync(path.join(PROJ, "content", "SOC4A.json"), "utf8"));
const tpl = fs.readFileSync(path.join(PROJ, "app.html"), "utf8");
const appjs = fs.readFileSync(path.join(PROJ, "app.js"), "utf8");

function js(x) {
  return JSON.stringify(x)
    .replace(/<\//g, "<\\/")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* 需要內嵌的圖：所有教材頁 + 題目專用的小圖示 */
const keys = new Set(Object.keys(D.PAGES));
for (const u of D.UNITS) {
  for (const l of u.lessons) {
    for (const p of l.pages || []) keys.add(p);
    for (const it of l.items || []) if (it.img) keys.add(it.img);
  }
}

const IM = {}, missing = [];
let bytes = 0;
for (const k of keys) {
  const f = path.join(PG, k + ".webp");
  if (!fs.existsSync(f)) { missing.push(k); continue; }
  const b = fs.readFileSync(f);
  bytes += b.length;
  IM[k] = "data:image/webp;base64," + b.toString("base64");
}

if (missing.length) {
  console.error("缺圖，中止打包：", missing);
  process.exit(1);
}
if (appjs.includes("</script") || tpl.split("/*__APP__*/").length !== 2) {
  console.error("樣板或程式碼含非法字串，中止打包");
  process.exit(1);
}

// 一定要用函式當 replacement：直接給字串時 $$ / $& / $' 會被當成替換樣板展開，
// app.js 裡的 $$() 會被吃掉一個 $，整份程式就此壞掉。
let html = tpl;
html = html.replace("/*__DATA__*/", () =>
  "window.APP_DATA=" + js(D) + ";\nwindow.__IM__=" + js(IM) + ";");
html = html.replace("/*__APP__*/", () => appjs);

fs.writeFileSync(OUT, html);

const nItems = D.UNITS.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.items.length, 0), 0);
const nCards = D.UNITS.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.cards.length, 0), 0);
const nTools = D.UNITS.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.tools.length, 0), 0);
const nL = D.UNITS.reduce((a, u) => a + u.lessons.length, 0);
console.log(`${path.basename(OUT)}  ${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB`);
console.log(`單元 ${D.UNITS.length} / 課 ${nL} / 知識卡 ${nCards} / 題目 ${nItems} / 教具 ${nTools}`);
console.log(`內嵌圖 ${Object.keys(IM).length} 張，原始 WebP ${(bytes / 1048576).toFixed(2)} MB`);
console.log(`storageKey ${D.META.storageKey}`);
