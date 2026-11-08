/* 社會 4 上單檔 HTML 的完整功能測試：node test.mjs [檔名] */
import fs from "fs";
import { JSDOM, VirtualConsole } from "jsdom";

const file = process.argv[2] || "社會4上自主學習_全冊.html";
let PASS = 0, FAIL = 0;
const fails = [];
function ok(cond, msg) {
  if (cond) PASS++;
  else { FAIL++; fails.push(msg); console.log("  ✗ " + msg); }
}
function sec(s) { console.log("\n== " + s); }

const html = fs.readFileSync(file, "utf8");
const errs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  errs.push(String((e && e.message) || e));
  if (process.env.DEBUG) console.log("JSDOM ERROR STACK:\n" + ((e && e.detail && e.detail.stack) || (e && e.stack)));
});
vc.on("error", (e) => errs.push(String(e)));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "http://localhost/",
  virtualConsole: vc,
  beforeParse(w) {
    w.__ERR__ = [];
    w.addEventListener("error", (e) => w.__ERR__.push((e.error && e.error.stack) || e.message));
    w.scrollTo = () => {};
    w.confirm = () => true;
    w.__UTT__ = [];
    w.speechSynthesis = {
      speak(u) { w.__UTT__.push(u); },
      cancel() {},
      getVoices: () => [
        { lang: "zh-TW", name: "Hanhan", localService: true },
        { lang: "en-US", name: "Zira", localService: true },
      ],
      onvoiceschanged: null,
    };
    w.SpeechSynthesisUtterance = class {
      constructor(t) { this.text = t; this.lang = ""; this.rate = 1; this.pitch = 1; }
    };
  },
});
const w = dom.window, d = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s, r) => (r || d).querySelector(s);
const qa = (s, r) => Array.from((r || d).querySelectorAll(s));
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const store = () => JSON.parse(w.localStorage.getItem("soc_selflearn_4a_all_v1") || "{}");

async function nav(hash) {
  w.history.replaceState(null, "", hash);
  w.SOC.paint();
  await wait(0);
}

await wait(100);

sec("載入與資料完整性");
ok(errs.length === 0, "載入時沒有 JS 錯誤：" + errs.slice(0, 3).join(" | "));
const S = w.SOC, D = S.data, IM = S.images;
ok(!!D && !!IM, "APP_DATA 與 __IM__ 都已載入");
ok(D.UNITS.length === 5, "5 個單元");
const lessons = D.UNITS.flatMap((u) => u.lessons);
ok(lessons.length === 11, "11 課（10 課＋主題探究）");
ok(Object.keys(D.PAGES).length === 133, "133 張教材原頁");
ok(Object.keys(IM).length === 135, "135 張內嵌圖（133 頁＋2 題目圖示）");
ok(!!IM.qicon_compass && !!IM.qicon_cross, "兩張題目圖示有內嵌");
ok(Object.values(IM).every((x) => x.startsWith("data:image/webp;base64,")), "所有圖都是 data URL");
ok(Object.keys(D.PAGES).every((k) => !!IM[k]), "每張教材頁都有對應圖檔");
const descBad = Object.entries(D.PAGES).filter(([, p]) => {
  const s = p.desc || "";
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ue000-\uf8ff]/.test(s) ||
    (s.match(/[\u4e00-\u9fff]/g) || []).length < 10;
});
ok(descBad.length === 0, "133 張圖的說明都是乾淨的白話文字：" + descBad.slice(0, 3).map((x) => x[0]).join(","));

let cards = 0, tools = 0, items = [];
for (const l of lessons) {
  cards += l.cards.length; tools += l.tools.length; items = items.concat(l.items);
  ok(l.pages.length > 0, l.id + " 有教材原頁");
  ok(l.items.length >= 10, l.id + " 有練習題 " + l.items.length);
  ok(l.cards.length >= 4, l.id + " 有知識卡");
  ok(l.tools.length >= 1, l.id + " 有互動教具");
  ok(l.pages.every((p) => !!D.PAGES[p] && !!IM[p]), l.id + " 原頁圖檔對應正確");
}
ok(cards === 57, "57 張知識卡");
ok(tools === 11, "11 個教具");
ok(items.length === 375, "375 題（145 隨堂＋214 填空＋16 探究）");
const tcount = {};
const ids = new Set();
for (const it of items) {
  tcount[it.t] = (tcount[it.t] || 0) + 1;
  const dup = ids.has(it.id); ids.add(it.id);
  ok(!dup, "題號不重複 " + it.id);
  ok(!!it.q && !!it.why, it.id + " 有題幹與詳解");
  if (it.t === "tf") ok(typeof it.a === "boolean", it.id + " 是非題答案是布林");
  if (it.t === "mc") ok(it.o.length >= 2 && it.a >= 0 && it.a < it.o.length, it.id + " 選擇題答案在範圍內");
  if (it.t === "fill") ok(it.q.includes("＿＿＿＿") && !!it.a, it.id + " 填空題有空格與答案");
  if (it.img) ok(!!IM[it.img], it.id + " 題目圖示有內嵌");
}
ok(JSON.stringify(tcount) === JSON.stringify({ tf: 82, mc: 74, fill: 219 }), "題型分布 tf82/mc74/fill219：" + JSON.stringify(tcount));
ok(D.META.storageKey === "soc_selflearn_4a_all_v1", "storageKey 正確");

sec("首頁");
await nav("#home");
ok(qa(".ucard").length === 5, "5 張單元卡");
ok(qa(".lchip").length === 11, "11 個課別捷徑");
ok(qa("#nav button").length === 4, "4 個主選單");
ok(/把家鄉看清楚/.test(q(".hero h2").textContent), "主視覺標題");
ok(/#toast/.test(html) && !!q("#toast"), "提示列存在");
ok(q("#hdrBadge").textContent.includes("57 張知識卡"), "頁首標記顯示知識卡數");

sec("各課五個分頁");
for (const l of lessons) {
  for (const tab of ["map", "cards", "pages", "quiz", "tools"]) {
    await nav(`#lesson/${l.id}/${tab}`);
    const pane = q("#pane");
    ok(!!pane && pane.textContent.length > 20, `${l.id}/${tab} 有內容`);
    if (tab === "map") {
      const want = (D.PAGES["cm_" + l.id] ? 1 : 0) + (D.PAGES["sm_" + l.id] ? 1 : 0) || Math.min(l.pages.length, 4);
      ok(qa("#pane .pgcard").length === want, `${l.id}/map 圖卡數 ${want}`);
    }
    if (tab === "cards") ok(qa("#pane .kcard").length === l.cards.length, `${l.id}/cards 卡數`);
    if (tab === "pages") ok(qa("#pane .pgcard").length >= l.pages.length, `${l.id}/pages 圖卡數`);
    if (tab === "quiz") {
      ok(!!q("#qstart") && !!q("#qquick"), `${l.id}/quiz 開始與快速抽測按鈕`);
      ok(q("#main").textContent.includes("重點整理填空"), `${l.id}/quiz 題型分布說明`);
    }
    if (tab === "tools") ok(qa("#pane .toolcard").length === l.tools.length, `${l.id}/tools 教具數`);
  }
}
ok(errs.length === 0, "切完所有分頁仍無 JS 錯誤：" + errs.slice(0, 2).join(" | "));

sec("重點卡：展開・已讀・語音");
await nav("#lesson/1-1/cards");
const k0 = qa(".kcard")[0];
ok(k0.classList.contains("open"), "第一張卡預設展開");
click(qa(".kcard")[1].querySelector(".khead"));
ok(qa(".kcard")[1].classList.contains("open"), "點標題可展開");
click(qa(".kcard")[1].querySelector("[data-read]"));
ok(qa(".kcard")[1].classList.contains("read"), "標記已讀");
ok(store().read["1-1:c1"] === 1, "已讀寫入 localStorage");
ok(q(".kreadcnt").textContent.includes("已讀 1"), "已讀計數即時更新");
click(qa(".kcard")[1].querySelector("[data-read]"));
ok(!qa(".kcard")[1].classList.contains("read"), "可取消已讀");
const utt0 = w.__UTT__.length;
click(q("[data-say]"));
ok(w.__UTT__.length === utt0 + 1, "點 🔊 會觸發語音");
const lastU = w.__UTT__[w.__UTT__.length - 1];
ok(lastU.lang === "zh-TW", "語音語言 zh-TW");
ok(Math.abs(lastU.rate - 0.9) < 1e-6, "語音預設語速 0.9");
ok(lastU.text.length > 3, "朗讀文字不是空的");
click(q("#voiceToggle"));
ok(S.state.voice.on === false && q("#voiceToggle").textContent.includes("靜音"), "語音可關閉");
click(q("#voiceToggle"));
const sl = q("#rateSlider");
sl.value = "0.75"; sl.dispatchEvent(new w.Event("input", { bubbles: true }));
ok(Math.abs(S.state.voice.rate - 0.75) < 1e-6 && q("#rateVal").textContent === "0.75", "語速可調整並保存");

sec("練習：批改・詳解・錯題本・結果頁");
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
const tfItem = items.find((i) => i.t === "tf");
const mcItem = items.find((i) => i.t === "mc");
const fillItem = items.find((i) => i.t === "fill");
function correctVal(it) {
  if (it.t === "tf") return it.a ? "1" : "0";
  if (it.t === "mc") return String(it.a);
  return it.a;
}
function wrongVal(it) {
  if (it.t === "tf") return it.a ? "0" : "1";
  if (it.t === "mc") return String((it.a + 1) % it.o.length);
  return "這一定不是答案";
}
function pickOpt(v) {
  const btn = q(`[data-opt="${v}"]`);
  ok(!!btn, "找得到選項 " + v);
  if (btn) click(btn);
  const sub = q("#qsubmit");
  if (sub) click(sub);
}
await nav("#lesson/1-1/quiz");
click(q("#qquick"));
ok(S.getQ().list.length === 10 && S.getQ().mode === S.state.qmode, "隨機 10 題快速抽測可啟動");
S.runQuiz([tfItem], { lid: "1-1", mode: "practice" });
pickOpt(wrongVal(tfItem));
ok(!!q(".fb.no"), "是非題答錯顯示紅色回饋");
ok(!!q(".whybox") && q(".whybox").textContent.includes("正確答案"), "顯示正確答案與詳解");
ok(!!store().wrong[tfItem.id], "答錯自動進錯題本");
click(q("#qnext"));
ok(!!q("#qagain"), "做完會出現結果頁");
S.runQuiz([tfItem], { lid: "1-1", mode: "practice" });
pickOpt(correctVal(tfItem));
ok(!!q(".fb.ok"), "是非題答對顯示綠色回饋");
ok(!store().wrong[tfItem.id], "答對後從錯題本移除");

S.runQuiz([mcItem], { lid: "1-1", mode: "practice" });
ok(qa("[data-opt]").length === mcItem.o.length, "選擇題選項數正確");
pickOpt(mcItem.a);
ok(!!q(".fb.ok"), "選擇題選對判對");

S.runQuiz([fillItem], { lid: "1-1", mode: "practice" });
ok(!!q("#fillin") && !!q("#fillok"), "填空題有輸入框與送出鍵");
q("#fillin").value = fillItem.a;
click(q("#fillok"));
ok(!!q(".fb.ok"), "填空題填對判對");
S.runQuiz([fillItem], { lid: "1-1", mode: "practice" });
q("#fillin").value = "完全不相干的答案";
click(q("#fillok"));
ok(!!q(".fb.no"), "填空題填錯判錯");

S.runQuiz([tfItem, mcItem, fillItem], { lid: "1-1", mode: "exam" });
[tfItem, mcItem, fillItem].forEach((it) => S.answer(correctVal(it)));
ok(S.getQ().finished && S.getQ().ok === 3, "測驗模式三題全對");
ok(q("#qslot").textContent.includes("100"), "結果頁顯示 100 分");
ok(store().best["1-1"] === 100, "最佳成績寫入 localStorage");

await nav("#lesson/1-1/quiz");
S.runQuiz([mcItem], { lid: "1-1", mode: "practice" });
d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "1", bubbles: true }));
ok(qa(".opt.sel").length === 1, "鍵盤 1-5 可選選項");
const compassItem = byId["1-1:q5"];
S.runQuiz([compassItem], { lid: "1-1", mode: "practice" });
ok(!!q("#qslot img") && q("#qslot img").src.startsWith("data:image/webp"), "方向標題目圖示有顯示");
const crossItem = byId["1-1:q13"];
S.runQuiz([crossItem], { lid: "1-1", mode: "practice" });
ok(q(".qstem").textContent.includes("〔下圖〕"), "醫院符號題幹已補上〔下圖〕");
ok(!!q("#qslot img"), "醫院符號題目圖示有顯示");

sec("375 題逐題驗收（正解都要判對）");
let sweepOK = 0;
for (const l of lessons) {
  await nav(`#lesson/${l.id}/quiz`);
  const run = S.runQuiz(l.items.slice(), { lid: l.id, mode: "exam" });
  ok(run === true, l.id + " 可啟動整課練習");
  for (const it of l.items) {
    const before = S.getQ().ok;
    S.answer(correctVal(it));
    if (S.getQ().ok === before + 1) sweepOK++;
  }
  ok(S.getQ().ok === l.items.length, `${l.id} ${l.items.length} 題全數判對（實際 ${S.getQ().ok}）`);
}
ok(sweepOK === 375, "全部 375 題正解判對，實際 " + sweepOK);
ok(Object.keys(store().done).length === 375, "375 題都記為做過");
ok(Object.keys(store().wrong).length === 0, "全對後錯題本清空");

sec("錯題本：跨課總複習");
const a1 = byId["1-1:q0"], a2 = byId["4-3:q0"];
await nav("#lesson/1-1/quiz");
S.runQuiz([a1], { lid: "1-1", mode: "exam" }); S.answer(wrongVal(a1));
await nav("#lesson/4-3/quiz");
S.runQuiz([a2], { lid: "4-3", mode: "exam" }); S.answer(wrongVal(a2));
ok(Object.keys(store().wrong).length === 2, "兩題錯題分別來自不同課");
await nav("#wrong");
ok(qa(".wrow").length === 2, "錯題本列出 2 題");
ok(qa(".wrow").some((x) => x.textContent.includes("1-1")), "錯題標示所屬課別");
click(q("#wrongRun"));
w.SOC.paint();
const cross = S.getQ();
ok(!!cross && cross.cross === true, "啟動跨課總複習");
ok(cross.list.length === 2, "總複習收錄全部 2 題（不是隻有該課）");
ok(new Set(cross.list.map((x) => x.id.split(":")[0])).size === 2, "題目確實跨兩課");
await nav("#wrong");
click(q("[data-drop]"));
ok(Object.keys(store().wrong).length === 1, "錯題可手動移除");

sec("全冊圖庫・放大・學習紀錄");
await nav("#lib");
ok(qa("[data-lg]").length === 13, "13 個圖庫分類");
const g2 = qa("[data-lg]")[6];
click(g2);
ok(S.state.libgroup === g2.dataset.lg, "切換分類會記住");
ok(qa("#libslot .pgcard").length === D.LIBRARY[g2.dataset.lg].length, "分類頁數正確");
const zi = q("#libslot [data-zoom]");
click(zi);
ok(q("#zoombox").classList.contains("on") && q("#zoomImg").src.startsWith("data:image/webp"), "點圖可放大且圖是內嵌");
click(q("#zoomClose"));
ok(!q("#zoombox").classList.contains("on"), "放大視窗可關閉");

await nav("#stats");
ok(qa(".lesstat").length === 11, "學習紀錄列出 11 課");
ok(q("#main").textContent.includes("題做過"), "統計數字存在");
click(q("#resetAll"));
ok(Object.keys(store().done).length === 0, "可清除學習紀錄");

sec("互動教具：五種玩法");
const clickByData = (sel, attr, value) => {
  const el = qa(sel).find((x) => x.getAttribute(attr) === value);
  if (el) click(el);
  return el;
};
// match
await nav("#lesson/1-1/tools");
let t = lessons.find((l) => l.id === "1-1").tools[0];
click(q('[data-l="0"]'));
click(q('[data-r="0"]'));
ok(qa(".mbtn.done").length === 2, "配對教具：答對標記完成");
ok(q("#tmsg0").textContent.includes("1／"), "配對教具：進度訊息");
// choice
await nav("#lesson/1-2/tools");
t = lessons.find((l) => l.id === "1-2").tools[0];
ok(!!clickByData("[data-cq]", "data-cq", t.qs[0][1]), "快答教具：正確選項有出現在畫面上");
ok(q("#tmsg0").textContent.includes("答對"), "快答教具：選對有回饋");
// sort
await nav("#lesson/2-2/tools");
t = lessons.find((l) => l.id === "2-2").tools[0];
for (const x of t.items) {
  const chip = qa('[data-s]').find((b) => b.dataset.s === x[0]);
  if (!chip) continue;
  click(chip);
  click(q(`.sortbox[data-g="${x[1]}"]`));
}
ok(qa(".chipitem.placed").length === t.items.length, "分類教具：全部就位");
ok(q("#tmsg0").textContent.includes("全部分對"), "分類教具：完成訊息");
// order
await nav("#lesson/4-2/tools");
t = lessons.find((l) => l.id === "4-2").tools[0];
for (const x of t.items) {
  const chip = qa("[data-o]").find((b) => b.dataset.o === x[0]);
  if (chip) click(chip);
}
click(q("#tcheck0"));
ok(q("#tmsg0").textContent.includes("順序完全正確"), "排序教具：正序檢查通過");
// check
await nav("#lesson/5-1/tools");
t = lessons.find((l) => l.id === "5-1").tools[0];
qa(".checkrow input").forEach((cb) => {
  cb.checked = true; cb.dispatchEvent(new w.Event("change", { bubbles: true }));
});
ok(q("#tmsg0").textContent.includes("全部完成"), "檢查表教具：六格全勾有回饋");

sec("資料導覽按鈕");
await nav("#home");
const navBtn = q('[data-nav="#lib"]');
click(navBtn);
ok(w.location.hash === "#lib", "點導覽會切換網址");
w.SOC.paint();
ok(q("#main").textContent.includes("全冊圖庫"), "導覽後頁面正確重繪");

sec("結果");
ok(errs.length === 0, "全程沒有 JS 錯誤：" + errs.slice(0, 3).join(" | "));
console.log(`\nPASS ${PASS}  FAIL ${FAIL}`);
if (fails.length) {
  console.log("失敗項目：");
  fails.slice(0, 40).forEach((f) => console.log("  - " + f));
}
process.exit(FAIL ? 1 : 0);
