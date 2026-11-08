import fs from "fs";
import path from "path";

const PIX = "../eng-selflearn/assets/pix";
const SND = "../eng-selflearn/assets/snd";
const PG = "assets/pg";
const AU = "assets/au";

const V = JSON.parse(fs.readFileSync("content/WW3.json", "utf8"));
const tpl = fs.readFileSync("app.html", "utf8");
const appjs = fs.readFileSync("app.js", "utf8");

function js(x) {
  return JSON.stringify(x).replace(/<\//g, "<\\/").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

const imgs = new Set(), auds = new Set();
for (const L of V.lessons) {
  for (const p of L.pages || []) if (p.k) imgs.add(p.k);
  for (const w of L.words || []) if (w.img) imgs.add(w.img);
  if (L.story) auds.add(L.story);
  for (const p of L.pages || []) if (p.au) auds.add(p.au);
  for (const w of L.words || []) if (w.au) auds.add(w.au);
  for (const it of L.items) {
    for (const k of it.im || []) imgs.add(k);
    if (it.au) auds.add(it.au);
  }
}

function findImg(k) {
  for (const d of [PG, PIX]) {
    const f = path.join(d, k + ".webp");
    if (fs.existsSync(f)) return f;
  }
  return null;
}
function findAud(k) {
  for (const d of [AU, SND]) {
    const f = path.join(d, k + ".mp3");
    if (fs.existsSync(f)) return f;
  }
  return null;
}

const IM = {}, AUm = {};
let nImg = 0, nAud = 0, missImg = [], missAud = [];
for (const k of imgs) {
  const f = findImg(k);
  if (f) { IM[k] = "data:image/webp;base64," + fs.readFileSync(f).toString("base64"); nImg++; }
  else missImg.push(k);
}
for (const k of auds) {
  const f = findAud(k);
  if (f) { AUm[k] = "data:audio/mpeg;base64," + fs.readFileSync(f).toString("base64"); nAud++; }
  else missAud.push(k);
}

let html = tpl;
html = html.replace("<title>英語自主學習</title>", "<title>Wonder World 3 英語自主學習</title>");
html = html.replace("/*__CONTENT__*/", "window.__V__=" + js(V) + ";");
html = html.replace("/*__ASSETS__*/", "window.__IM__=" + js(IM) + ";\nwindow.__AU__=" + js(AUm) + ";");
html = html.replace("/*__APP__*/", appjs);

const OUT = "英語WW3自主學習.html";
fs.writeFileSync(OUT, html);
const mb = (fs.statSync(OUT).size / 1048576).toFixed(1);
const nItems = V.lessons.reduce((a, L) => a + L.items.length, 0);
console.log(`${OUT}  ${mb} MB  ${V.lessons.length} 單元 ${nItems} 題  圖${nImg} 音${nAud}`);
if (missImg.length) console.log("缺圖", missImg.length, missImg.slice(0, 8));
if (missAud.length) console.log("缺音", missAud.length, missAud.slice(0, 8));
