import fs from "fs";
import { JSDOM, VirtualConsole } from "jsdom";

const files = process.argv.slice(2);
let PASS = 0, FAIL = 0;
const fails = [];
function ok(cond, msg) {
  if (cond) { PASS++; } else { FAIL++; fails.push(msg); console.log("  ✗ " + msg); }
}

for (const file of files) {
  console.log("\n=== " + file);
  const html = fs.readFileSync(file, "utf8");
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errs.push(String(e && e.message)));
  vc.on("error", (e) => errs.push(String(e)));

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost/",
    virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => {};
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [], onvoiceschanged: null };
      w.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
      w.Audio = class {
        constructor(src) { this.src = src; }
        play() { return Promise.resolve(); }
        pause() {}
      };
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    },
  });

  const w = dom.window, d = w.document;
  await new Promise((r) => setTimeout(r, 60));

  ok(errs.length === 0, file + " 載入時有 JS 錯誤: " + errs.slice(0, 3).join(" | "));
  const V = w.__V__;
  ok(!!V, file + " 沒有載入課程資料");
  if (!V) continue;

  const nLesson = d.querySelectorAll(".lcard").length;
  ok(nLesson === V.lessons.length, `首頁課卡數 ${nLesson} != ${V.lessons.length}`);

  // 每課每個分頁
  for (const L of V.lessons) {
    for (const tab of ["text", "word", "sent", "phon", "cul", "quiz", "listen"]) {
      w.APP.go({ v: "lesson", l: L.no, tab });
      const body = d.querySelector(".wrap");
      ok(!!body && body.textContent.length > 20, `${L.label} ${tab} 分頁空白`);
    }
  }

  // 逐題型測試
  const kinds = {};
  for (const L of V.lessons) for (const it of L.items) if (!kinds[it.t]) kinds[it.t] = it;
  ok(!!kinds.mc && !!kinds.pic && !!kinds.ox && !!kinds.type && !!kinds.multi,
    file + " 缺少某種題型: " + Object.keys(kinds).join(","));

  function answerCorrect(it) {
    w.APP.one(it.id);
    const fb = () => d.querySelector("#fb");
    if (it.t === "mc" || it.t === "pic" || it.t === "ox") {
      const btns = d.querySelectorAll(".opt[data-i]");
      ok(btns.length >= 2, `${it.t} ${it.id} 選項數 ${btns.length}`);
      if (btns[it.a]) btns[it.a].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      const t = fb() ? fb().textContent : "";
      ok(/答對/.test(t), `${it.t} ${it.id} 選對卻沒判對 (${t.slice(0, 40)})`);
    } else if (it.t === "type") {
      if (it.tok) {
        for (let i = 0; i < it.tok.length; i++) w.APP.tok(i);
        const line = d.querySelector("#ansline");
        ok(!!line && line.querySelectorAll(".tok").length === it.tok.length,
          `type ${it.id} 重組句沒有把字放進作答列`);
        return;
      } else {
        const inp = d.querySelector("#typein");
        ok(!!inp, `type ${it.id} 沒有輸入框`);
        if (inp) inp.value = it.a;
      }
      const b = d.querySelector("#chkbtn");
      if (b) b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      const t = fb() ? fb().textContent : "";
      ok(/答對/.test(t), `type ${it.id} 答對卻沒判對 (${t.slice(0, 40)})`);
    } else if (it.t === "multi") {
      const ins = d.querySelectorAll("#multiwrap input");
      ok(ins.length === (it.a || []).length, `multi ${it.id} 空格 ${ins.length} != 答案 ${(it.a || []).length}`);
      ins.forEach((el, i) => { el.value = it.a[i]; });
      const b = d.querySelector("#chkbtn");
      if (b) b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      const t = fb() ? fb().textContent : "";
      ok(/答對/.test(t), `multi ${it.id} 答對卻沒判對 (${t.slice(0, 40)})`);
    }
  }

  // 抽樣：每種題型前 14 題全部作答
  const sample = [];
  for (const k of Object.keys(kinds)) {
    const arr = V.lessons.flatMap((L) => L.items).filter((x) => x.t === k);
    sample.push(...arr.slice(0, 14));
  }
  for (const it of sample) {
    if (it.t === "group") continue;
    answerCorrect(it);
  }

  // group 題
  const g = V.lessons.flatMap((L) => L.items).find((x) => x.t === "group");
  if (g) {
    w.APP.one(g.id);
    ok(!!d.querySelector(".passage"), "group 沒有顯示文章");
    let allok = true;
    for (let si = 0; si < g.subs.length; si++) {
      const ans = (typeof g.subs[si].a === "number") ? g.subs[si].a : "ABCD".indexOf(String(g.subs[si].ans).toUpperCase());
      if (ans < 0) { allok = false; continue; }
      const btn = d.querySelector(`.opt[data-sub="${si}"][data-i="${ans}"]`);
      if (!btn) { allok = false; continue; }
      btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    }
    ok(allok, "group " + g.id + " 有小題找不到正確選項");
  }

  // 資源檢查
  const imgs = Object.keys(w.__IM__ || {}).length;
  const auds = Object.keys(w.__AU__ || {}).length;
  console.log(`  圖 ${imgs} · 音 ${auds} · 題型 ${Object.keys(kinds).join(",")}`);
  ok(imgs > 50, file + " 圖片過少 " + imgs);
  ok(auds > 50, file + " 音檔過少 " + auds);

  // 全冊總複習
  w.APP.startAll("all", 20);
  ok(d.querySelectorAll(".qbody").length === 1, "全冊總複習沒有出題");
  w.APP.startAll("listen", 20);
  ok(d.querySelectorAll(".qbody").length === 1, "全冊聽力沒有出題");
  w.APP.go({ v: "home" });

  // 錯題本 / 統計頁
  w.APP.go({ v: "wrong" });
  ok(d.querySelector(".wrap") !== null, "錯題本頁面異常");
  w.APP.go({ v: "stats" });
  ok(d.querySelector(".wrap") !== null, "統計頁面異常");

  dom.window.close();
}

console.log(`\n=== PASS ${PASS}  FAIL ${FAIL}`);
if (FAIL) { console.log(fails.slice(0, 20).join("\n")); process.exit(1); }
