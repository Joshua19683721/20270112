/* 英語自主學習 — 前端引擎 */
(function () {
  "use strict";
  var V = window.__V__;
  var AU = window.__AU__ || {};
  var IM = window.__IM__ || {};
  var KEY = "engself_" + V.code + "_v2";

  /* ---------- state ---------- */
  var S = { ok: {}, bad: {}, best: {}, xp: 0, seen: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(S, JSON.parse(raw));
  } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  var BYID = {};
  V.lessons.forEach(function (L) {
    L.items.forEach(function (it) { it._l = L.no; BYID[it.id] = it; });
  });

  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");
  var toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 1600);
  }

  function H(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function esc(s) { return H(s); }

  /* ---------- audio ---------- */
  var audioCache = {};
  var curAudio = null;
  function playAU(id, btn) {
    if (!id || !AU[id]) return;
    if (curAudio) { try { curAudio.pause(); } catch (e) {} }
    var a = audioCache[id];
    if (!a) { a = new Audio(AU[id]); audioCache[id] = a; }
    curAudio = a;
    try { a.currentTime = 0; } catch (e) {}
    var p = a.play();
    if (btn) {
      btn.classList.add("playing");
      setTimeout(function () { btn.classList.remove("playing"); }, 1200);
    }
    if (p && p.catch) p.catch(function () {});
  }

  var voice = null;
  var TTS_RATE = 0.65;          // 學習用慢速
  var TTS_LANG = "en-US";
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = window.speechSynthesis.getVoices() || [];
    var best = null;
    for (var i = 0; i < vs.length; i++) {
      if (/^en[-_]US/i.test(vs[i].lang)) {
        // 優先挑標記 en-US 的語音；同名再挑 localService 的
        if (!best || vs[i].localService) best = vs[i];
      }
    }
    if (!best) {
      for (var j = 0; j < vs.length; j++) {
        if (/^en/i.test(vs[j].lang)) { best = vs[j]; break; }
      }
    }
    if (best) voice = best;
  }
  if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    setTimeout(pickVoice, 400);
  }
  function speak(text) {
    if (!text) return;
    if (!window.speechSynthesis) { toast("這個瀏覽器不支援語音"); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = TTS_LANG;
      u.rate = TTS_RATE;
      u.pitch = 1;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\s+/g, " ")
      .replace(/[.,!?;:"'`]+$/g, "")
      .trim();
  }
  function normHard(s) {
    return norm(s).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  function lessonStat(L) {
    var done = 0;
    L.items.forEach(function (it) { if (S.ok[L.no + "|" + it.id]) done++; });
    return { done: done, total: L.items.length };
  }
  function volStat() {
    var d = 0, t = 0;
    V.lessons.forEach(function (L) {
      var s = lessonStat(L); d += s.done; t += s.total;
    });
    return { done: d, total: t };
  }
  function badCount() { return Object.keys(S.bad).length; }

  function imgs(it) {
    return (it.im || []).filter(function (k) { return IM[k]; });
  }
  function imgTag(k, alt) {
    return IM[k] ? '<img src="' + IM[k] + '" alt="' + H(alt || "") + '">' : "";
  }

  /* ---------- router ---------- */
  var route = { v: "home" };
  function go(r) {
    route = r;
    window.scrollTo(0, 0);
    render();
  }

  /* ---------- home ---------- */
  function renderHome() {
    var vs = volStat();
    var h = [];
    h.push('<div class="hero"><div class="in">');
    h.push('<h1>' + H(V.vol) + ' 英語自主學習</h1>');
    h.push('<div class="sub">' + H(V.sub || "康軒 Wonder World") + " · " + V.lessons.length +
      " 個單元 · " + vs.total + " 題</div>");
    h.push('<div class="ttsn">🔊 點任何英文都會發音：en-US · 語速 0.65×（慢速）</div>');
    h.push('<div class="stat">');
    h.push("<div><b>" + vs.done + "</b>已答對題數</div>");
    h.push("<div><b>" + pct(vs.done, vs.total) + "%</b>完成度</div>");
    h.push("<div><b>" + badCount() + "</b>待訂正</div>");
    h.push("</div></div></div>");

    h.push('<div class="wrap">');
    h.push('<div class="row" style="margin-top:16px;gap:10px">');
    h.push('<button class="btn ghost grow" onclick="APP.go({v:\'wrong\'})">📕 錯題本 (' + badCount() + ")</button>");
    h.push('<button class="btn ghost grow" onclick="APP.go({v:\'stats\'})">🏅 學習統計</button>');
    h.push("</div>");

    h.push('<div class="allbar"><div class="t">🔥 全冊總複習</div>');
    h.push('<div class="d">' + V.lessons.length + " 個單元 · " + vs.total + " 題隨機抽題，答錯自動進錯題本</div>");
    h.push('<div style="display:flex;gap:10px;margin-top:12px">');
    h.push('<button class="btn grow" onclick="APP.startAll(\'all\',20)">挑戰 20 題</button>');
    h.push('<button class="btn ghost grow" onclick="APP.startAll(\'listen\',20)">聽力 20 題</button>');
    h.push("</div></div>");

    h.push('<div class="sec-title">選一個單元 <small>點進去開始自學</small></div>');
    h.push('<div class="lgrid">');
    V.lessons.forEach(function (L) {
      var st = lessonStat(L);
      var p = pct(st.done, st.total);
      h.push('<button class="lcard" onclick="APP.go({v:\'lesson\',l:' + L.no + ',\'tab\':\'text\'})">');
      h.push('<div class="no">' + H(L.label) + "</div>");
      h.push('<div class="tt">' + H(L.zh || L.title) + "</div>");
      h.push('<div class="en">' + H(L.title) + "</div>");
      h.push('<div class="bar"><i style="width:' + p + '%"></i></div>');
      h.push('<div class="meta"><span>' + st.done + "/" + st.total + " 題</span><span>" + p + "%</span></div>");
      h.push("</button>");
    });
    h.push("</div></div>");
    return h.join("");
  }

  /* ---------- lesson ---------- */
  function renderLesson() {
    var L = V.lessons.filter(function (x) { return x.no === route.l; })[0];
    if (!L) return renderHome();
    var tab = route.tab || "text";
    var h = [];
    var st = lessonStat(L);

    h.push('<div class="hero" style="padding-bottom:20px"><div class="in">');
    h.push('<div class="row" style="gap:8px;margin-bottom:6px">');
    h.push('<button class="back" style="color:#fff;opacity:.9" onclick="APP.go({v:\'home\'})">← 回列表</button>');
    h.push("</div>");
    h.push('<h1 style="font-size:20px">' + H(L.zh || L.title) + "</h1>");
    h.push('<div class="sub">' + H(L.title) + " · 已答對 " + st.done + "/" + st.total + "</div>");
    h.push("</div></div>");

    h.push('<div class="wrap">');
    h.push('<div class="tabs">');
    var tabs = [["text", "📖 課文"], ["word", "📚 單字"], ["sent", "💬 句型"], ["phon", "🔤 拼讀"],
                ["cul", "🌍 素養"], ["quiz", "✏️ 練習"], ["listen", "🎧 聽力"]];
    tabs.forEach(function (t) {
      var n = tabCount(L, t[0]);
      if (t[0] !== "quiz" && !n) return;
      h.push('<button class="tab' + (tab === t[0] ? " on" : "") +
        '" onclick="APP.go({v:\'lesson\',l:' + L.no + ',\'tab\':\'' + t[0] + '\'})">' +
        t[1] + (n ? ' <span style="opacity:.65;font-size:12px">' + n + "</span>" : "") + "</button>");
    });
    h.push("</div>");

    if (tab === "text") h.push(tabText(L));
    else if (tab === "word") h.push(tabWord(L));
    else if (tab === "sent") h.push(tabSent(L));
    else if (tab === "phon") h.push(tabPhon(L));
    else if (tab === "cul") h.push(tabCul(L));
    else if (tab === "quiz") h.push(tabQuiz(L));
    else if (tab === "listen") h.push(tabListen(L));
    h.push("</div>");
    return h.join("");
  }

  function tabCount(L, t) {
    if (t === "text") return (L.pages || []).length;
    if (t === "word") return (L.words || []).length;
    if (t === "sent") return (L.sents || []).length;
    if (t === "phon") return (L.phonics || []).length;
    if (t === "cul") return (L.culture || []).length;
    if (t === "quiz") return L.items.length;
    if (t === "listen") return L.items.filter(function (i) { return i.au; }).length;
    return 0;
  }

  /* ---------- 課文頁 ---------- */
  function tabText(L) {
    var ps = L.pages || [];
    if (!ps.length) return emptyBox("這一課沒有課本頁面圖");
    var h = ['<div class="sec-title">課本頁面 <small>點圖可放大 · 點 🔊 聽課文朗讀</small></div>'];
    if (L.story && AU[L.story]) {
      h.push('<div class="playbar" style="margin-bottom:12px">' +
        '<button class="pb" id="pb_story" onclick="APP.play(\'' + L.story + '\',this)">▶</button>' +
        '<div class="txt">課文動畫旁白（全課）· 可以邊看下面的課本頁邊聽</div></div>');
    }
    ps.forEach(function (p) {
      var src = IM[p.k];
      if (!src) return;
      h.push('<div class="pgcard">');
      h.push('<div class="hd"><span class="pn">P' + H(p.n) + "</span>");
      h.push('<span class="tt">' + H(L.title) + "</span>");
      if (p.au && AU[p.au]) {
        h.push('<button class="pb" id="pb_' + p.k + '" onclick="APP.play(\'' + p.au + '\',this)">▶</button>');
      }
      h.push("</div>");
      h.push('<img src="' + src + '" alt="' + H("P" + p.n) + '" onclick="APP.zoom(this.src)">');
      if (p.ocr && p.ocr.length) {
        var badge = p.ocrm === "ab" ? "雙模型驗證" : "單模型讀取";
        h.push('<div class="ocr"><div class="oh">📝 頁面文字<span class="vd">OCR ' + badge + '</span>' +
          "<span style=\"font-weight:600;color:#9aa6c8\">點句子聽發音</span></div>");
        p.ocr.forEach(function (o) {
          h.push('<div class="ocrline" onclick="APP.say(' +
            JSON.stringify(o.t).replace(/"/g, "&quot;") + ')">' +
            '<div class="t">' + H(o.t) + "</div>" +
            (o.ipa ? '<span class="ipa">' + H(o.ipa) + "</span>" : "") +
            (o.zh ? '<div class="zh">' + H(o.zh) + "</div>" : "") +
            "</div>");
        });
        h.push("</div>");
      }
      h.push("</div>");
    });
    h.push('<div class="tiny" style="text-align:center;margin-top:6px">' +
      "課本圖片版權屬康軒文教，僅供本機自學使用</div>");
    return h.join("");
  }

  /* ---------- 素養 ---------- */
  function tabCul(L) {
    var cs = L.culture || [];
    if (!cs.length) return emptyBox("這一課沒有素養補充");
    var h = ['<div class="sec-title">素養補充 <small>跨領域與國際教育</small></div>'];
    cs.forEach(function (c) {
      h.push('<div class="culcard">');
      h.push('<div class="h">' + H(c.h) + "</div>");
      if (c.zh) h.push('<div class="zh">' + H(c.zh) + "</div>");
      if (c.body) h.push('<div class="bd">' + H(c.body) + "</div>");
      if (c.list && c.list.length) {
        h.push('<div class="kv">');
        c.list.forEach(function (r) {
          h.push('<div class="r"><b onclick="APP.say(' + JSON.stringify(r[0]).replace(/"/g, "&quot;") +
            ')">' + H(r[0]) + (r[3] ? '<span class="ipa">' + H(r[3]) + "</span>" : "") +
            "</b><span>" + H(r[1] || "") +
            (r[2] ? "　·　" + H(r[2]) : "") + "</span></div>");
        });
        h.push("</div>");
      }
      if (c.ask) {
        h.push('<div class="ask" onclick="APP.say(' +
          JSON.stringify(c.ask.split("／")[0].split(" — ")[0]).replace(/"/g, "&quot;") +
          ')">💡 ' + H(c.ask) +
          (c.ask_ipa ? '<span class="ipa">' + H(c.ask_ipa) + "</span>" : "") + "</div>");
      }
      h.push("</div>");
    });
    return h.join("");
  }

  /* ---------- 圖片放大 ---------- */
  function zoom(src) {
    var d = document.createElement("div");
    d.className = "lightbox";
    d.innerHTML = '<img src="' + src + '">';
    d.onclick = function () { if (d.parentNode) d.parentNode.removeChild(d); };
    document.body.appendChild(d);
  }

  function initial(w) {
    var s = String(w || "").replace(/^(a|an|the)\s+/i, "").trim();
    return (s.charAt(0) || "?").toUpperCase();
  }

  function tabWord(L) {
    var ws = L.words || [];
    if (!ws.length) return emptyBox("這一課沒有整理到單字卡");
    var h = ['<div class="sec-title">單字卡 <small>點單字聽發音 · 藍色是音標</small></div><div class="wgrid">'];
    ws.forEach(function (w, i) {
      var hasImg = !!(w.img && IM[w.img]);
      var say = 'APP.say(' + JSON.stringify(w.w).replace(/"/g, "&quot;") + ')';
      h.push('<div class="wcard' + (hasImg ? "" : " flat") + '">');
      if (hasImg) {
        h.push('<div class="rel"><div class="ph">' + imgTag(w.img, w.w) + "</div>");
        h.push('<button class="spk" title="課本原音" onclick="APP.word(' +
          JSON.stringify(w.w).replace(/"/g, "&quot;") + "," +
          JSON.stringify(w.au || "") + ')">🔊</button></div>');
      }
      h.push('<div class="bd">');
      h.push('<div class="wtop"><span class="w" onclick="' + say + '">' + H(w.w) + "</span>");
      if (!hasImg) {
        h.push('<button class="spk in" title="聽發音" onclick="APP.word(' +
          JSON.stringify(w.w).replace(/"/g, "&quot;") + "," +
          JSON.stringify(w.au || "") + ')">🔊</button>');
      }
      h.push("</div>");
      if (w.ipa) h.push('<span class="ipa">' + H(w.ipa) + "</span>");
      if (w.zh) h.push('<div class="zh">' + H(w.zh) + "</div>");
      h.push("</div></div>");
    });
    h.push("</div>");
    return h.join("");
  }

  function tabSent(L) {
    var ss = L.sents || [];
    if (!ss.length) return emptyBox("這一課沒有整理到句型卡");
    var h = ['<div class="sec-title">句型卡 <small>點句子聽發音</small></div>'];
    ss.forEach(function (s) {
      h.push('<div class="scard">');
      if (s.tag) h.push('<span class="tag">' + H(s.tag) + "</span>");
      h.push('<div class="en" style="cursor:pointer" onclick="APP.say(' +
        JSON.stringify(s.en).replace(/"/g, "&quot;") + ')">' + H(s.en) + "</div>");
      if (s.ipa) h.push('<span class="ipa">' + H(s.ipa) + "</span>");
      if (s.zh) h.push('<div class="zh">' + H(s.zh) + "</div>");
      if (s.note) {
        var warn = /^★/.test(s.note);
        h.push('<div class="note' + (warn ? " warn" : "") + '">' + H(s.note) + "</div>");
      }
      h.push("</div>");
    });
    return h.join("");
  }

  function tabPhon(L) {
    var ps = L.phonics || [];
    if (!ps.length) return emptyBox("這一課沒有拼讀規則卡");
    var h = ['<div class="sec-title">字母拼讀 <small>點例字聽發音</small></div>'];
    ps.forEach(function (p) {
      h.push('<div class="pcard">');
      h.push('<div class="pat">' + H(p.pat) + "</div>");
      if (p.rule) h.push('<div class="rule">' + H(p.rule) + "</div>");
      if (p.short && p.short.length) {
        h.push('<div class="grp"><div class="lb">短母音</div><div class="exs">');
        p.short.forEach(function (w) { h.push(exBtn(w, p.ipad)); });
        h.push("</div></div>");
      }
      if (p.long && p.long.length) {
        h.push('<div class="grp"><div class="lb long">長母音（魔法 e）</div><div class="exs">');
        p.long.forEach(function (w) { h.push(exBtn(w, p.ipad)); });
        h.push("</div></div>");
      }
      if (p.pairs && p.pairs.length) {
        h.push('<div class="grp"><div class="lb">聽辨對照</div>');
        p.pairs.forEach(function (pr) {
          h.push('<div class="pair">' + exBtn(pr[0], p.ipad) + '<span class="ar">↔</span>' + exBtn(pr[1], p.ipad) + "</div>");
        });
        h.push("</div>");
      }
      if (!p.short && !p.long && !p.pairs) {
        h.push('<div class="exs">');
        (p.words || []).forEach(function (w) { h.push(exBtn(w)); });
        h.push("</div>");
      }
      h.push("</div>");
    });
    return h.join("");
  }

  function exBtn(w, ipad) {
    var ip = (ipad && ipad[w]) || "";
    return '<button class="ex" onclick="APP.say(' + JSON.stringify(w).replace(/"/g, "&quot;") +
      ')"><span class="t">' + H(w) + "</span>" +
      (ip ? '<span class="ipa">' + H(ip) + "</span>" : "") + "</button>";
  }

  function tabQuiz(L) {
    var st = lessonStat(L);
    var nWrong = 0;
    L.items.forEach(function (it) { if (S.bad[L.no + "|" + it.id]) nWrong++; });
    var h = ['<div class="card" style="text-align:center;padding:22px 18px">'];
    h.push('<div style="font-size:34px;margin-bottom:6px">✏️</div>');
    h.push('<div style="font-weight:800;font-size:17px">本課練習</div>');
    h.push('<div class="tiny" style="margin-top:6px">共 ' + L.items.length + " 題 · 已答對 " + st.done + " 題" +
      (nWrong ? ' · <span style="color:var(--bad);font-weight:700">' + nWrong + " 題待訂正</span>" : "") + "</div>");
    h.push('<div style="display:flex;gap:10px;margin-top:18px">');
    h.push('<button class="btn grow" onclick="APP.start(' + L.no + ',\'all\',10)">開始 10 題</button>');
    h.push('<button class="btn ghost grow" onclick="APP.start(' + L.no + ',\'all\',0)">全部 ' + L.items.length + " 題</button>");
    h.push("</div>");
    if (nWrong) {
      h.push('<button class="btn soft" style="width:100%;margin-top:10px" onclick="APP.start(' + L.no + ',\'wrong\',0)">只練錯題（' + nWrong + "）</button>");
    }
    h.push("</div>");
    return h.join("");
  }

  function tabListen(L) {
    var ls = L.items.filter(function (i) { return i.au; });
    if (!ls.length) return emptyBox("這一課沒有聽力題");
    var h = ['<div class="card" style="text-align:center;padding:22px 18px">'];
    h.push('<div style="font-size:34px;margin-bottom:6px">🎧</div>');
    h.push('<div style="font-weight:800;font-size:17px">聽力練習</div>');
    h.push('<div class="tiny" style="margin-top:6px">共 ' + ls.length + " 題 · 每題都可以重複播放</div>");
    h.push('<div style="display:flex;gap:10px;margin-top:18px">');
    h.push('<button class="btn grow" onclick="APP.start(' + L.no + ',\'listen\',10)">開始 10 題</button>');
    h.push('<button class="btn ghost grow" onclick="APP.start(' + L.no + ',\'listen\',0)">全部 ' + ls.length + " 題</button>");
    h.push("</div></div>");
    return h.join("");
  }

  function emptyBox(msg) {
    return '<div class="empty"><div class="e">🗂️</div>' + H(msg) + "</div>";
  }

  /* ---------- quiz ---------- */
  var Q = null;

  function start(lessonNo, mode, limit) {
    var L = V.lessons.filter(function (x) { return x.no === lessonNo; })[0];
    var pool = L.items.slice();
    if (mode === "listen") pool = pool.filter(function (i) { return i.au; });
    if (mode === "wrong") pool = pool.filter(function (i) { return S.bad[lessonNo + "|" + i.id]; });
    if (!pool.length) { toast("沒有可練習的題目"); return; }
    // 優先抽未答對的
    var fresh = pool.filter(function (i) { return !S.ok[lessonNo + "|" + i.id]; });
    var old = pool.filter(function (i) { return S.ok[lessonNo + "|" + i.id]; });
    pool = shuffle(fresh).concat(shuffle(old));
    if (limit) pool = pool.slice(0, limit);
    Q = { l: lessonNo, list: pool, i: 0, right: 0, wrongs: [], answered: false, mine: null, sel: [] };
    go({ v: "quiz" });
  }

  function startAll(mode, limit) {
    var pool = [];
    V.lessons.forEach(function (L) {
      L.items.forEach(function (it) { pool.push(it); });
    });
    if (mode === "listen") pool = pool.filter(function (i) { return i.au; });
    if (mode === "wrong") pool = pool.filter(function (i) { return S.bad[i._l + "|" + i.id]; });
    if (!pool.length) { toast("沒有可練習的題目"); return; }
    var fresh = pool.filter(function (i) { return !S.ok[i._l + "|" + i.id]; });
    var old = pool.filter(function (i) { return S.ok[i._l + "|" + i.id]; });
    pool = shuffle(fresh).concat(shuffle(old));
    if (limit) pool = pool.slice(0, limit);
    Q = { l: 0, list: pool, i: 0, right: 0, wrongs: [], answered: false, mine: null, sel: [] };
    go({ v: "quiz" });
  }

  function renderQuiz() {
    if (!Q || !Q.list.length) return renderHome();
    var it = Q.list[Q.i];
    var L = V.lessons.filter(function (x) { return x.no === Q.l; })[0];
    var h = [];
    h.push('<div class="wrap" style="padding-top:14px">');
    h.push('<div class="qhead">');
    h.push('<button class="back" onclick="APP.quit()">✕</button>');
    h.push('<div class="qbar"><i style="width:' + pct(Q.i, Q.list.length) + '%"></i></div>');
    h.push('<div class="tiny" style="font-weight:700">' + (Q.i + 1) + "/" + Q.list.length + "</div>");
    h.push("</div>");

    h.push('<div class="qbody">');
    h.push('<div class="qsec">' + H(secLabel(it)) + "</div>" +
      (it.src ? '<span class="srcbadge">' + H(it.src) + "</span>" : ""));

    if (it.au) {
      h.push('<div class="playbar"><button class="pb" id="pbtn" onclick="APP.play(\'' + it.au + '\',this)">▶</button>' +
        '<div class="txt">點一下播放音檔，可以重複聽</div></div>');
    }

    if (it.t === "group") h.push(renderGroup(it));
    else h.push(renderSingle(it));

    h.push("</div></div>");
    return h.join("");
  }

  function secLabel(it) {
    if (it.sec) return it.sec;
    if (it.t === "group") return "閱讀測驗" + (it.kt ? " · " + it.kt : "");
    var m = { mc: "選出正確答案", pic: "看圖選答案", ox: "判斷對錯", type: "寫出答案", multi: "填入空格" };
    var base = m[it.t] || "作答";
    if (it.kt) return base + " · " + it.kt;
    return base;
  }

  function renderSingle(it) {
    var h = [];
    var im = imgs(it);

    if (it.t === "pic") {
      h.push('<div class="qstem">' + H(it.q || "看圖選出正確的答案") + "</div>");
      h.push('<div class="picrow" style="margin-top:14px">');
      (it.o || []).forEach(function (k, i) {
        h.push('<button class="opt picopt" data-i="' + i + '" onclick="APP.pick(' + i + ')">' +
          '<span class="k">' + "ABC"[i] + "</span>" + imgTag(k, "選項") + "</button>");
      });
      h.push("</div>");
    } else if (it.t === "ox") {
      if (im.length) h.push('<div class="qimg">' + im.map(function (k) { return imgTag(k, ""); }).join("") + "</div>");
      h.push('<div class="qstem">' + H(it.q) + "</div>");
      if (it.sub && !Q.answered) h.push('<div class="tiny" style="margin-top:6px">（答完會顯示聽到的字）</div>');
      h.push('<div class="oxrow">');
      h.push('<button class="opt" data-i="0" onclick="APP.pick(0)"><span class="k">O</span>相符</button>');
      h.push('<button class="opt" data-i="1" onclick="APP.pick(1)"><span class="k">X</span>不符</button>');
      h.push("</div>");
    } else if (it.t === "mc") {
      if (im.length) h.push('<div class="qimg">' + im.map(function (k) { return imgTag(k, ""); }).join("") + "</div>");
      h.push('<div class="qstem">' + stemHTML(it) + "</div>");
      h.push('<div style="margin-top:10px">');
      (it.o || []).forEach(function (o, i) {
        h.push('<button class="opt" data-i="' + i + '" onclick="APP.pick(' + i + ')">' +
          '<span class="k">' + "ABCD"[i] + "</span><span>" + H(o) + "</span></button>");
      });
      h.push("</div>");
    } else if (it.t === "type") {
      if (im.length) h.push('<div class="qimg">' + im.map(function (k) { return imgTag(k, ""); }).join("") + "</div>");
      h.push('<div class="qstem">' + H(it.q) + "</div>");
      if (it.show) h.push(showHTML(it));
      if (it.tok && it.tok.length) {
        h.push('<div class="tokwrap" id="tokwrap">');
        it.tok.forEach(function (t, i) {
          h.push('<button class="tok" data-t="' + i + '" onclick="APP.tok(' + i + ')">' + H(t) + "</button>");
        });
        h.push("</div>");
        h.push('<div class="typein" id="ansline" style="min-height:48px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:16px"></div>');
      } else {
        if (it.bank && it.bank.length) {
          h.push('<div class="bank">' + it.bank.map(function (b) { return '<span class="chip">' + H(b) + "</span>"; }).join("") + "</div>");
        }
        h.push('<input class="typein" id="typein" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="在這裡輸入答案">');
      }
      h.push('<div class="qfoot"><button class="btn" id="chkbtn" onclick="APP.checkType()">檢查</button></div>');
    } else if (it.t === "multi") {
      if (im.length) h.push('<div class="qimg">' + im.map(function (k) { return imgTag(k, ""); }).join("") + "</div>");
      if (it.bank && it.bank.length) {
        h.push('<div class="bank">' + it.bank.map(function (b) { return '<span class="chip">' + H(b) + "</span>"; }).join("") + "</div>");
      }
      h.push('<div class="multi" id="multiwrap">' + multiHTML(it) + "</div>");
      h.push('<div class="qfoot"><button class="btn" id="chkbtn" onclick="APP.checkMulti()">檢查</button></div>');
    }
    h.push('<div id="fb"></div>');
    return h.join("");
  }

  function stemHTML(it) {
    var s = esc(it.q || "");
    s = s.replace(/[\uFF3F_]{2,}/g, '<span class="bl">＿＿＿</span>');
    return s;
  }

  function multiHTML(it) {
    var parts = String(it.body || "").split(/[\uFF3F_]{2,}/);
    var out = "";
    for (var i = 0; i < parts.length; i++) {
      out += esc(parts[i]).replace(/\n/g, "<br>");
      if (i < parts.length - 1) {
        out += "<input data-i='" + i + "' autocomplete='off' spellcheck='false'>";
      }
    }
    return '<div class="mline">' + out + "</div>";
  }

  function showHTML(it) {
    var s = esc(it.show || "").replace(/\n/g, "<br>");
    s = s.replace(/[\uFF3F_]{2,}/g, '<span class="bl"></span>');
    return '<div class="showline">' + s + "</div>";
  }

  function renderGroup(it) {
    var h = [];
    var im = imgs(it);
    if (im.length) h.push('<div class="qimg big">' + im.map(function (k) { return imgTag(k, ""); }).join("") + "</div>");
    if (it.passage) {
      var ps = esc(it.passage).replace(/_{1,4}\((\d+)\)_{1,4}/g, '<span class="bk">($1)</span>');
      h.push('<div class="passage">' + ps + "</div>");
    }
    (it.subs || []).forEach(function (s, si) {
      h.push('<div class="subq" data-sub="' + si + '">');
      h.push('<div class="n">第 ' + (si + 1) + (s.q ? " 題" : " 格") + "</div>");
      if (s.q) h.push('<div class="qstem">' + esc(s.q) + "</div>");
      (s.o || []).forEach(function (o, oi) {
        h.push('<button class="opt" data-sub="' + si + '" data-i="' + oi + '" onclick="APP.pickSub(' + si + "," + oi + ')">' +
          '<span class="k">' + "ABCD"[oi] + "</span><span>" + H(o) + "</span></button>");
      });
      h.push("</div>");
    });
    h.push('<div id="fb"></div>');
    return h.join("");
  }

  /* ---------- answering ---------- */
  function markOptions(sel, ans) {
    var nodes = document.querySelectorAll(".opt[data-i]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.hasAttribute("data-sub")) continue;
      var k = parseInt(n.getAttribute("data-i"), 10);
      n.disabled = true;
      n.classList.remove("on");
      if (k === ans) n.classList.add("ok");
      else if (k === sel) n.classList.add("bad");
    }
  }

  function feedback(ok, it, mine) {
    var h = ['<div class="fb ' + (ok ? "ok" : "bad") + '">'];
    h.push('<div class="h">' + (ok ? "✅ 答對了" : "❌ 再想想") + "</div>");
    if (!ok) {
      var a = correctText(it, mine);
      if (a) h.push('<div>正確答案：<span class="ans">' + H(a) + "</span></div>");
    }
    if (it.t === "ox" && it.sub) h.push('<div style="font-weight:700;margin-top:4px">聽到的字：' + H(it.sub) + "</div>");
    if (it.blank && ok) h.push('<div style="font-weight:700;margin-top:4px">完整單字：' + H(it.blank) + "</div>");
    if (it.e) {
      if (it.eipa) {
        h.push('<div class="ex" style="cursor:pointer" onclick="APP.say(' +
          JSON.stringify(it.e).replace(/"/g, "&quot;") + ')">' + H(it.e) + "</div>");
        h.push('<span class="ipa" style="color:#2f6fb0;margin-top:1px">' + H(it.eipa) + "</span>");
      } else {
        h.push('<div class="ex">' + H(it.e) + "</div>");
      }
    }
    h.push("</div>");
    return h.join("");
  }

  function correctText(it, mine) {
    if (it.t === "mc" || it.t === "pic") return (it.o && it.o[it.a] != null) ? ("ABCD"[it.a] + ". " + it.o[it.a]) : "ABCD"[it.a];
    if (it.t === "ox") return it.a === 0 ? "O（相符）" : "X（不符）";
    if (it.t === "type") return it.a;
    if (it.t === "multi") return (it.a || []).join(" / ");
    return "";
  }

  function record(ok, it) {
    var k = (it._l || Q.l) + "|" + it.id;
    if (ok) {
      if (!S.ok[k]) { S.ok[k] = 1; S.xp += 2; }
      delete S.bad[k];
    } else {
      S.bad[k] = { ts: Date.now() };
      Q.wrongs.push(it.id);
    }
    save();
  }

  function pick(i) {
    if (Q.answered) return;
    Q.answered = true;
    var it = Q.list[Q.i];
    var ok = i === it.a;
    markOptions(i, it.a);
    document.getElementById("fb").innerHTML = feedback(ok, it, i);
    if (ok) Q.right++;
    record(ok, it);
    var f = document.querySelector(".qfoot");
    if (!f) {
      var d = document.createElement("div");
      d.className = "qfoot";
      d.innerHTML = '<button class="btn" onclick="APP.next()">' + (Q.i + 1 < Q.list.length ? "下一題 →" : "看結果") + "</button>";
      document.querySelector(".qbody").appendChild(d);
    }
  }

  function pickSub(si, oi) {
    var it = Q.list[Q.i];
    var s = it.subs[si];
    if (s._done) return;
    s._done = true;
    var correct = (typeof s.a === "number") ? s.a : "ABCD".indexOf(String(s.ans || "").toUpperCase());
    var nodes = document.querySelectorAll('.opt[data-sub="' + si + '"]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], k = parseInt(n.getAttribute("data-i"), 10);
      n.disabled = true;
      if (k === correct) n.classList.add("ok");
      else if (k === oi) n.classList.add("bad");
    }
    var ok = oi === correct;
    if (ok) Q.right++; else Q.wrongs.push(it.id);
    var all = it.subs.every(function (x) { return x._done; });
    if (all) {
      var good = it.subs.every(function (x) { var c = (typeof x.a === "number") ? x.a : "ABCD".indexOf(String(x.ans || "").toUpperCase()); return c === x._sel; });
      var k2 = Q.l + "|" + it.id;
      if (good) { if (!S.ok[k2]) { S.ok[k2] = 1; S.xp += 3; } delete S.bad[k2]; }
      else { S.bad[k2] = { ts: Date.now() }; }
      save();
      document.getElementById("fb").innerHTML = feedback(good, { t: "group", e: it.e }, null);
      var d = document.createElement("div");
      d.className = "qfoot";
      d.innerHTML = '<button class="btn" onclick="APP.next()">' + (Q.i + 1 < Q.list.length ? "下一題 →" : "看結果") + "</button>";
      document.querySelector(".qbody").appendChild(d);
      Q.answered = true;
    }
    s._sel = oi;
  }

  function checkType() {
    if (Q.answered) return;
    var it = Q.list[Q.i];
    var mine = "";
    var line = document.getElementById("ansline");
    if (line) {
      mine = Array.prototype.map.call(line.querySelectorAll(".tok"), function (n) { return n.textContent; }).join(" ");
      if (!mine) { toast("先點下面的字排出句子"); return; }
    } else {
      var inp = document.getElementById("typein");
      mine = inp.value;
      if (!String(mine).trim()) { toast("先輸入答案"); return; }
    }
    var ok = norm(mine) === norm(it.a) || normHard(mine) === normHard(it.a);
    Q.answered = true;
    var inp2 = document.getElementById("typein");
    if (inp2) { inp2.disabled = true; inp2.classList.add(ok ? "ok" : "bad"); }
    document.getElementById("fb").innerHTML = feedback(ok, it, mine);
    if (ok) Q.right++;
    record(ok, it);
    var b = document.getElementById("chkbtn");
    if (b) b.parentNode.innerHTML = '<button class="btn" onclick="APP.next()">' + (Q.i + 1 < Q.list.length ? "下一題 →" : "看結果") + "</button>";
  }

  function checkMulti() {
    if (Q.answered) return;
    var it = Q.list[Q.i];
    var inputs = document.querySelectorAll("#multiwrap input");
    var ans = it.a || [];
    var ok = true, empty = false;
    for (var i = 0; i < inputs.length; i++) {
      var v = inputs[i].value;
      if (!String(v).trim()) empty = true;
      var good = i < ans.length && (norm(v) === norm(ans[i]) || normHard(v) === normHard(ans[i]));
      inputs[i].classList.add(good ? "ok" : "bad");
      inputs[i].disabled = true;
      if (!good) ok = false;
    }
    if (empty) { toast("還有空格沒填"); }
    Q.answered = true;
    document.getElementById("fb").innerHTML = feedback(ok, it, null);
    if (ok) Q.right++;
    record(ok, it);
    var b = document.getElementById("chkbtn");
    if (b) b.parentNode.innerHTML = '<button class="btn" onclick="APP.next()">' + (Q.i + 1 < Q.list.length ? "下一題 →" : "看結果") + "</button>";
  }

  var tokSel = [];
  function tok(i) {
    if (Q.answered) return;
    var it = Q.list[Q.i];
    var btn = document.querySelector('.tok[data-t="' + i + '"]');
    if (!btn || btn.classList.contains("used")) return;
    btn.classList.add("used");
    tokSel.push(i);
    paintTok(it);
  }
  function paintTok(it) {
    var line = document.getElementById("ansline");
    if (!line) return;
    line.innerHTML = "";
    tokSel.forEach(function (i, pos) {
      var b = document.createElement("button");
      b.className = "tok";
      b.textContent = it.tok[i];
      b.onclick = function () {
        if (Q.answered) return;
        tokSel.splice(pos, 1);
        var o = document.querySelector('.tok[data-t="' + i + '"]');
        if (o) o.classList.remove("used");
        paintTok(it);
      };
      line.appendChild(b);
    });
  }

  function next() {
    if (Q.i + 1 < Q.list.length) {
      Q.i++;
      Q.answered = false;
      tokSel = [];
      render();
      var it = Q.list[Q.i];
      if (it.au) setTimeout(function () { playAU(it.au, document.getElementById("pbtn")); }, 260);
    } else {
      finish();
    }
  }

  function finish() {
    var n = Q.list.length;
    var p = pct(Q.right, n);
    var L = V.lessons.filter(function (x) { return x.no === Q.l; })[0];
    var title = L ? (L.zh || L.title) : "全冊總複習";
    if (!S.best[Q.l] || p > S.best[Q.l]) S.best[Q.l] = p;
    S.xp += Q.right;
    save();
    var h = [];
    h.push('<div class="wrap" style="padding-top:20px"><div class="card score">');
    h.push('<div class="big">' + p + "</div>");
    h.push('<div class="lbl">' + H(title) + " · 答對 " + Q.right + "/" + n + " 題</div>");
    h.push('<div class="chips">');
    h.push('<div class="chipst"><b>' + Q.right + "</b>答對</div>");
    h.push('<div class="chipst"><b>' + (n - Q.right) + "</b>答錯</div>");
    h.push('<div class="chipst"><b>' + (S.best[Q.l] || p) + "%</b>最佳</div>");
    h.push("</div>");
    h.push('<div style="display:flex;gap:10px;margin-top:22px">');
    if (Q.l) {
      h.push('<button class="btn grow" onclick="APP.start(' + Q.l + ',\'all\',10)">再練一輪</button>');
      h.push('<button class="btn ghost grow" onclick="APP.go({v:\'lesson\',l:' + Q.l + ',\'tab\':\'quiz\'})">回本課</button>');
    } else {
      h.push('<button class="btn grow" onclick="APP.startAll(\'all\',20)">再練一輪</button>');
      h.push('<button class="btn ghost grow" onclick="APP.go({v:\'home\'})">回單元列表</button>');
    }
    h.push("</div>");
    if (n - Q.right > 0) h.push('<button class="btn soft" style="width:100%;margin-top:10px" onclick="APP.go({v:\'wrong\'})">看錯題本</button>');
    h.push("</div></div>");
    app.innerHTML = h.join("");
  }

  /* ---------- wrong book ---------- */
  function renderWrong() {
    var keys = Object.keys(S.bad);
    var h = [];
    h.push('<div class="hero" style="padding-bottom:20px"><div class="in">');
    h.push('<button class="back" style="color:#fff;opacity:.9" onclick="APP.go({v:\'home\'})">← 回列表</button>');
    h.push('<h1 style="font-size:20px;margin-top:6px">📕 錯題本</h1>');
    h.push('<div class="sub">共 ' + keys.length + " 題待訂正</div>");
    h.push("</div></div>");
    h.push('<div class="wrap" style="padding-top:16px">');
    if (!keys.length) {
      h.push(emptyBox("目前沒有錯題，繼續保持！"));
      h.push("</div>");
      return h.join("");
    }
    var byL = {};
    keys.forEach(function (k) {
      var p = k.split("|");
      (byL[p[0]] = byL[p[0]] || []).push(k);
    });
    Object.keys(byL).sort(function (a, b) { return a - b; }).forEach(function (ln) {
      var L = V.lessons.filter(function (x) { return x.no == ln; })[0];
      h.push('<div class="sec-title">' + H(L ? (L.zh || L.title) : "第 " + ln + " 課") +
        " <small>" + byL[ln].length + " 題</small></div>");
      byL[ln].forEach(function (k) {
        var id = k.split("|")[1];
        var it = BYID[id];
        if (!it) return;
        h.push('<div class="wrow">');
        h.push('<div class="q">' + H(previewQ(it)) + "</div>");
        h.push('<div class="m"><span>答案 <i>' + H(correctText(it, null)) + "</i></span>" +
          "<span>" + H(secLabel(it)) + "</span></div>");
        if (it.e) h.push('<div class="tiny" style="margin-top:6px">' + H(it.e.slice(0, 120)) + "</div>");
        h.push("</div>");
      });
      h.push('<button class="btn soft" style="width:100%;margin:4px 0 6px" onclick="APP.start(' + ln + ',\'wrong\',0)">只練這課的錯題</button>');
    });
    h.push("</div>");
    return h.join("");
  }

  function previewQ(it) {
    if (it.t === "group") return (it.passage || "").slice(0, 60) + " …（共 " + (it.subs || []).length + " 小題）";
    if (it.t === "pic") return it.q || "看圖選答案";
    if (it.t === "type") return (it.q || "") + (it.show ? " " + it.show : "");
    if (it.t === "multi") return (it.body || "").slice(0, 70);
    return (it.q || "").slice(0, 80);
  }

  /* ---------- stats ---------- */
  function renderStats() {
    var vs = volStat();
    var h = [];
    h.push('<div class="hero" style="padding-bottom:20px"><div class="in">');
    h.push('<button class="back" style="color:#fff;opacity:.9" onclick="APP.go({v:\'home\'})">← 回列表</button>');
    h.push('<h1 style="font-size:20px;margin-top:6px">🏅 學習統計</h1>');
    h.push("</div></div>");
    h.push('<div class="wrap" style="padding-top:16px">');
    h.push('<div class="card"><div class="chips" style="margin-top:0">');
    h.push('<div class="chipst"><b>' + S.xp + "</b>學習點數</div>");
    h.push('<div class="chipst"><b>' + pct(vs.done, vs.total) + "%</b>完成度</div>");
    h.push('<div class="chipst"><b>' + badCount() + "</b>待訂正</div>");
    h.push("</div></div>");

    h.push('<div class="sec-title">各課進度</div>');
    h.push('<div class="card" style="padding:6px 16px">');
    V.lessons.forEach(function (L) {
      var st = lessonStat(L);
      var p = pct(st.done, st.total);
      h.push('<div style="padding:11px 0;border-bottom:1px solid var(--line)">');
      h.push('<div class="row"><div class="grow" style="font-size:14px;font-weight:700">' + H(L.zh || L.title) + "</div>");
      h.push('<div class="tiny">' + st.done + "/" + st.total + "</div></div>");
      h.push('<div class="qbar" style="margin-top:7px"><i style="width:' + p + '%"></i></div>');
      h.push("</div>");
    });
    h.push("</div></div>");
    return h.join("");
  }

  /* ---------- render ---------- */
  function render() {
    if (route.v === "home") app.innerHTML = renderHome();
    else if (route.v === "lesson") app.innerHTML = renderLesson();
    else if (route.v === "quiz") app.innerHTML = renderQuiz();
    else if (route.v === "wrong") app.innerHTML = renderWrong();
    else if (route.v === "stats") app.innerHTML = renderStats();
    else app.innerHTML = renderHome();
  }

  function quit() {
    if (Q && Q.l) go({ v: "lesson", l: Q.l, tab: "quiz" });
    else go({ v: "home" });
  }

  window.APP = {
    go: go, start: start, startAll: startAll, pick: pick, pickSub: pickSub, next: next,
    checkType: checkType, checkMulti: checkMulti, tok: tok, quit: quit, zoom: zoom,
    play: playAU, say: speak,
    word: function (w, au) { if (au && AU[au]) playAU(au, null); else speak(w); },
    one: function (id) {
      var it = BYID[id];
      if (!it) return false;
      Q = { l: it._l, list: [it], i: 0, right: 0, wrongs: [], answered: false };
      tokSel = [];
      route = { v: "quiz" };
      render();
      return true;
    },
    ids: function () { return Object.keys(BYID); }
  };

  document.addEventListener("keydown", function (e) {
    if (route.v !== "quiz" || !Q) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" && e.key !== "Enter") return;
    if (e.key === "Enter" && Q.answered) { e.preventDefault(); next(); return; }
    if (tag === "INPUT") return;
    if (/^[1-4]$/.test(e.key) && !Q.answered) {
      var it = Q.list[Q.i];
      if (!it || it.t === "group") return;
      var n = parseInt(e.key, 10) - 1;
      if (it.t === "ox" && n > 1) return;
      var max = (it.t === "ox") ? 2 : (it.o || []).length;
      if (n < max) { e.preventDefault(); pick(n); }
    }
  });

  render();
})();
