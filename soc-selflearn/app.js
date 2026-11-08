/* 社會 4 上 自主學習系統 — 應用邏輯（單檔離線） */
(function () {
  'use strict';

  var D = window.APP_DATA;
  var META = D.META, UNITS = D.UNITS, PAGES = D.PAGES, LIBRARY = D.LIBRARY;
  var IM = window.__IM__ || {};
  var KEY = META.storageKey;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var LESSONS = {}, LUNIT = {};
  UNITS.forEach(function (u) {
    u.lessons.forEach(function (l) { LESSONS[l.id] = l; LUNIT[l.id] = u; });
  });
  var ALLITEMS = {};
  Object.keys(LESSONS).forEach(function (lid) {
    LESSONS[lid].items.forEach(function (it) { ALLITEMS[it.id] = it; });
  });
  var TOTAL_ITEMS = Object.keys(ALLITEMS).length;
  var TOTAL_CARDS = UNITS.reduce(function (n, u) {
    return n + u.lessons.reduce(function (m, l) { return m + l.cards.length; }, 0);
  }, 0);
  var GROUPS = Object.keys(LIBRARY);

  /* ---------- 狀態 ---------- */
  function blank() {
    return {
      read: {}, done: {}, wrong: {}, best: {}, right: {},
      voice: { on: true, rate: 0.9 }, days: {}, streak: 0, lastDay: '',
      libgroup: GROUPS[0] || '概念圖', qrange: 'all', qmode: 'practice'
    };
  }
  var S = load();
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var o = JSON.parse(raw), b = blank();
      for (var k in b) if (!(k in o)) o[k] = b[k];
      if (!o.voice) o.voice = b.voice;
      if (!LIBRARY[o.libgroup]) o.libgroup = b.libgroup;
      return o;
    } catch (e) { return blank(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function touchDay() {
    var t = new Date(), d = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
    if (S.lastDay === d) return;
    var y = new Date(t.getTime() - 86400000);
    var yd = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    S.streak = (S.lastDay === yd) ? (S.streak || 0) + 1 : 1;
    S.lastDay = d; S.days[d] = 1; save();
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function md(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2100);
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function norm(s) {
    return String(s || '').replace(/[０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 65248);
    }).replace(/[\s。，、．,；;：:！!？?「」『』（）()【】\[\]…·―－—\/＿_]/g, '')
      .replace(/[臺台]/g, '台').toUpperCase();
  }
  function imgsrc(k) { return IM[k] || ''; }
  function imgTag(k, cls) {
    return '<img class="' + cls + '" loading="lazy" src="' + imgsrc(k) +
      '" data-zoom="' + esc(k) + '" alt="' + esc((PAGES[k] || {}).title || '') + '">';
  }
  function spk(text, label) {
    return '<button class="btn spk" data-say="' + esc(text) + '">🔊 ' + esc(label || '朗讀') + '</button>';
  }
  function statOf(lid) {
    var l = LESSONS[lid], n = l.items.length;
    var done = l.items.filter(function (i) { return S.done[i.id]; }).length;
    return { done: done, total: n, p: pct(done, n), best: S.best[lid] || 0 };
  }

  /* ---------- 語音 ---------- */
  var VOICE = null, speakingBtn = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = window.speechSynthesis.getVoices() || [];
    var tw = vs.filter(function (v) { return /^zh[-_]?TW/i.test(v.lang); });
    var zh = vs.filter(function (v) { return /^zh/i.test(v.lang); });
    var local = tw.filter(function (v) { return v.localService; });
    VOICE = local[0] || tw[0] || zh[0] || null;
  }
  function say(text, btn) {
    if (!S.voice.on) { toast('語音目前是關閉的，按右上角可以打開'); return; }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      toast('這個瀏覽器不支援語音朗讀'); return;
    }
    var t = String(text || '').replace(/\*\*/g, '')
      .replace(/＿+/g, '空格').replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '')
      .replace(/〔[^〕]*〕/g, '').replace(/\s{2,}/g, ' ').trim();
    if (!t) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-TW'; u.rate = Number(S.voice.rate) || 0.9; u.pitch = 1;
      if (VOICE) u.voice = VOICE;
      u.onend = function () { if (speakingBtn) { speakingBtn.classList.remove('playing'); speakingBtn = null; } };
      u.onerror = function () { if (speakingBtn) { speakingBtn.classList.remove('playing'); speakingBtn = null; } };
      if (speakingBtn) speakingBtn.classList.remove('playing');
      speakingBtn = btn || null;
      if (speakingBtn) speakingBtn.classList.add('playing');
      window.speechSynthesis.speak(u);
    } catch (e) { toast('語音啟動失敗：' + e.message); }
  }
  function initVoice() {
    pickVoice();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
      setTimeout(pickVoice, 400);
      setTimeout(pickVoice, 1400);
    }
    var tg = $('#voiceToggle'), sl = $('#rateSlider'), vl = $('#rateVal');
    sl.value = S.voice.rate; vl.textContent = Number(S.voice.rate).toFixed(2);
    function syncTg() {
      tg.textContent = S.voice.on ? '🔊 語音' : '🔇 靜音';
      tg.classList.toggle('off', !S.voice.on);
    }
    syncTg();
    tg.addEventListener('click', function () {
      S.voice.on = !S.voice.on; save(); syncTg();
      if (!S.voice.on && window.speechSynthesis) window.speechSynthesis.cancel();
      toast(S.voice.on ? '語音朗讀已開啟' : '語音朗讀已關閉');
    });
    sl.addEventListener('input', function () {
      S.voice.rate = Number(sl.value); vl.textContent = S.voice.rate.toFixed(2); save();
    });
    sl.addEventListener('change', function () { say('這是現在的朗讀速度'); });
  }

  /* ---------- 路由 ---------- */
  var V = { page: 'home', lid: '', tab: 'map' };
  function parseHash() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var p = h.split('/');
    if (p[0] === 'lesson' && LESSONS[p[1]]) {
      V.page = 'lesson'; V.lid = p[1]; V.tab = p[2] || 'map';
    } else if (p[0] === 'lib') { V.page = 'lib'; }
    else if (p[0] === 'wrong') { V.page = 'wrong'; }
    else if (p[0] === 'stats') { V.page = 'stats'; }
    else { V.page = 'home'; }
  }
  function go(hash) { location.hash = hash; }
  function navHtml() {
    var items = [['#home', 'home', '全冊首頁'], ['#lib', 'lib', '全冊圖庫'],
                 ['#wrong', 'wrong', '錯題本'], ['#stats', 'stats', '學習紀錄']];
    return items.map(function (x) {
      return '<button data-nav="' + x[0] + '" class="' + (V.page === x[1] ? 'on' : '') + '">' + x[2] + '</button>';
    }).join('');
  }
  function renderNav() { $('#nav').innerHTML = navHtml(); }
  function paint() {
    parseHash(); renderNav();
    $('#hdrBadge').textContent = META.subtitle.split('｜')[0] + '｜' + TOTAL_CARDS + ' 張知識卡・' + TOTAL_ITEMS + ' 題';
    var m = $('#main');
    if (V.page === 'home') m.innerHTML = viewHome();
    else if (V.page === 'lesson') { m.innerHTML = viewLesson(); mountLesson(); }
    else if (V.page === 'lib') { m.innerHTML = viewLibrary(); mountLibrary(); }
    else if (V.page === 'wrong') m.innerHTML = viewWrong();
    else m.innerHTML = viewStats();
    window.scrollTo(0, 0);
  }

  /* ---------- 首頁 ---------- */
  function viewHome() {
    var doneN = Object.keys(S.done).length, readN = Object.keys(S.read).length;
    var p = pct(doneN, TOTAL_ITEMS);
    var h = '<div class="hero"><div>' +
      '<span class="kicker">康軒社會 4 上・全冊</span>' +
      '<h2>把家鄉看清楚：從地圖、老街到節慶</h2>' +
      '<p>5 個單元、10 課加主題探究。每一課都有彩色概念圖、重點卡、課本原頁圖、' +
      '可以點了就念出來的語音，以及自動批改的練習。全部資料都在這一個檔案裡，離線也能用。</p>' +
      '<div class="row"><button class="btn primary" data-nav="#lesson/' + UNITS[0].lessons[0].id + '/map">從第一課開始</button>' +
      '<button class="btn" data-nav="#lib">逛全冊圖庫</button>' +
      '<button class="btn" data-nav="#wrong">看錯題本</button></div></div>' +
      '<div class="hero-r"><div class="ring" style="--p:' + p + '"><span>' + p + '%</span><i>練習進度</i></div>' +
      '<div class="hero-nums">' +
      '<div><b>' + doneN + '</b><span>／' + TOTAL_ITEMS + ' 題做過</span></div>' +
      '<div><b>' + readN + '</b><span>／' + TOTAL_CARDS + ' 張卡讀過</span></div>' +
      '<div><b>' + Object.keys(S.wrong).length + '</b><span>題待複習</span></div>' +
      '<div><b>' + (S.streak || 0) + '</b><span>天連續學習</span></div>' +
      '</div></div></div>';

    h += '<h2 class="sec">五個單元・點課名就進去</h2><div class="grid">';
    UNITS.forEach(function (u) {
      var all = u.lessons.reduce(function (n, l) { return n + l.items.length; }, 0);
      var dn = u.lessons.reduce(function (n, l) {
        return n + l.items.filter(function (i) { return S.done[i.id]; }).length;
      }, 0);
      var up = pct(dn, all);
      h += '<div class="ucard" style="--h:' + u.hue + '">' +
        '<div class="uc-top"><div class="uc-icon">' + esc(u.icon) + '</div>' +
        '<div><h3>' + esc(u.no) + '</h3><div class="uc-name">' + esc(u.name) + '</div></div>' +
        '<div class="uc-pct">' + up + '%</div></div>' +
        '<p class="uc-intro">' + esc(u.intro) + '</p>' +
        '<div class="bar"><i style="width:' + up + '%"></i></div>' +
        '<div class="lchips">' + u.lessons.map(function (l) {
          var st = statOf(l.id);
          return '<button class="lchip" data-nav="#lesson/' + l.id + '/map"><b>' + esc(l.id) + '</b>' +
            esc(l.name) + (st.best ? '<span class="ok">' + st.best + '分</span>' : '') + '</button>';
        }).join('') + '</div></div>';
    });
    h += '</div>';
    h += '<div class="tipbox"><b>怎麼用這套系統</b>' +
      '<p>① 先看「概念圖」把這一課的骨架記起來；② 讀「重點卡」，不懂就點 🔊 聽一次；' +
      '③ 到「圖文」看課本、地圖與海報原頁；④ 用「練習」驗收，答錯會自動進錯題本；' +
      '⑤ 最後玩「教具」把知識再用一次。右上角可以調整語音速度。</p></div>';
    return h;
  }

  /* ---------- 單課頁 ---------- */
  var TABS = [['map', '概念圖'], ['cards', '重點卡'], ['pages', '圖文'], ['quiz', '練習'], ['tools', '教具']];
  function mapKeys(lid) {
    var k = ['cm_' + lid, 'sm_' + lid].filter(function (x) { return !!PAGES[x]; });
    return k.length ? k : LESSONS[lid].pages.slice(0, 4);
  }
  function viewLesson() {
    var l = LESSONS[V.lid], u = LUNIT[V.lid], st = statOf(V.lid);
    var h = '<div class="row" style="margin-top:18px"><button class="btn ghost" data-nav="#home">← 回全冊首頁</button>' +
      '<span class="sub" style="margin:0">' + esc(u.no) + '　/　' + esc(u.name) + '</span></div>';
    h += '<div class="uhead" style="--h:' + u.hue + '"><div class="row between">' +
      '<span class="sub" style="margin:0">' + esc(l.id) + '　' + esc(u.no) + '</span>' +
      '<span class="uhead-pct">練習 ' + st.p + '%</span></div>' +
      '<div class="uhead-row"><div class="uhead-icon">' + esc(u.icon) + '</div><div>' +
      '<h2>' + esc(l.name) + '</h2><p class="sub" style="margin:4px 0 0">' + esc(l.intro) + '</p></div></div>' +
      '<div class="goalchips">' + l.goal.map(function (g) { return '<span class="goalchip">' + esc(g) + '</span>'; }).join('') + '</div></div>';
    h += '<div class="utabs">' + TABS.map(function (t) {
      var c = t[0] === 'cards' ? l.cards.length : t[0] === 'quiz' ? l.items.length :
        t[0] === 'pages' ? l.pages.length : t[0] === 'tools' ? l.tools.length : mapKeys(l.id).length;
      return '<button data-tab="' + t[0] + '" class="' + (V.tab === t[0] ? 'on' : '') + '">' +
        t[1] + '<span class="cnt">' + c + '</span></button>';
    }).join('') + '</div><div id="pane"></div>';
    return h;
  }
  function mountLesson() {
    $$('#main [data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { go('#lesson/' + V.lid + '/' + b.dataset.tab); });
    });
    var pane = $('#pane');
    if (V.tab === 'map') { pane.innerHTML = paneMap(); mountPages(pane); }
    else if (V.tab === 'cards') { pane.innerHTML = paneCards(); mountCards(pane); }
    else if (V.tab === 'pages') { pane.innerHTML = panePages(); mountPages(pane); mountLibrary(pane, true); }
    else if (V.tab === 'quiz') { pane.innerHTML = paneQuiz(); mountQuiz(pane); }
    else if (V.tab === 'tools') { pane.innerHTML = paneTools(); mountTools(pane); }
    else { pane.innerHTML = paneMap(); mountPages(pane); }
  }

  function pageCard(k) {
    var p = PAGES[k]; if (!p) return '';
    var long = /海報|地圖|卡牌|概念構圖|重點摘要|歌詞|小書/.test(p.group + p.title);
    return '<div class="pgcard ' + (long ? 'poster' : '') + '">' + imgTag(k, 'pgimg') +
      '<div class="pgbody"><span class="pgtag">' + esc(p.group) + '</span>' +
      '<div class="pgtitle">' + esc(p.title) + '</div>' +
      (p.desc ? '<p class="pgdesc">' + esc(p.desc) + '</p>' : '') +
      '<div class="pgacts">' + spk(p.title + '。' + (p.desc || ''), '念說明') +
      '<button class="btn sm" data-zoom="' + esc(k) + '">放大看圖</button></div></div></div>';
  }
  function paneMap() {
    var lid = V.lid, keys = mapKeys(lid), hasCm = keys[0] === 'cm_' + lid;
    var h = '<div class="panel"><h3>先看骨架，再讀細節</h3>' +
      (hasCm
        ? '<p class="sub">上面這張是出版社的概念構圖：中央是這一課的主題，往外是分類與例子。' +
          '下面這張是重點摘要表，讀完可以直接到「重點卡」驗收。</p>'
        : '<p class="sub">這一課是「主題探究」，沒有考試用的概念構圖；下面放的是探究小書的原頁，' +
          '照著頁面走一遍，再到「重點卡」看四個步驟、到「教具」勾檢查表。</p>') +
      '</div><div class="pggrid">';
    keys.forEach(function (k) { if (PAGES[k]) h += pageCard(k); });
    h += '</div>';
    var l = LESSONS[lid];
    h += '<div class="panel" style="margin-top:18px"><h3>這一課要會的事</h3><div class="goalchips">' +
      l.goal.map(function (g) { return '<span class="goalchip">' + esc(g) + '</span>'; }).join('') +
      '</div><div class="row" style="margin-top:14px">' + spk(l.name + '。' + l.intro + '。' + l.goal.join('；'), '念學習目標') +
      '<button class="btn" data-nav="#lesson/' + lid + '/cards">去讀重點卡 →</button></div></div>';
    return h;
  }
  function paneCards() {
    var l = LESSONS[V.lid];
    var h = '<div class="row between" style="margin-bottom:12px"><span class="sub" style="margin:0">點開卡片讀內容；每一張都可以按 🔊 念給你聽。</span>' +
      '<span class="sub kreadcnt" style="margin:0">已讀 ' + l.cards.filter(function (c) { return S.read[c.id]; }).length + '／' + l.cards.length + '</span></div><div class="klist">';
    l.cards.forEach(function (c, i) {
      h += '<div class="kcard' + (S.read[c.id] ? ' read' : '') + '" data-k="' + esc(c.id) + '">' +
        '<div class="khead"><span class="ktag">' + esc(c.tag) + '</span><b>' + esc(c.t) + '</b>' +
        (S.read[c.id] ? '<span class="kmark">✓ 已讀</span>' : '') + '</div>' +
        '<div class="kbody">' + c.b.map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') +
        (c.tip ? '<div class="ktip"><b>記憶訣</b>' + md(c.tip) + '</div>' : '') +
        (c.pit ? '<div class="kpit"><b>容易錯</b>' + md(c.pit) + '</div>' : '') +
        '<div class="kacts">' + spk(c.t + '。' + c.b.join('') + (c.tip ? '記憶訣：' + c.tip : '') + (c.pit ? '容易錯：' + c.pit : ''), '念這張卡') +
        '<button class="btn sm" data-read="' + esc(c.id) + '">' + (S.read[c.id] ? '取消已讀' : '標記已讀') + '</button></div></div></div>';
    });
    h += '</div><div class="row" style="margin-top:16px">' +
      spk(l.cards.map(function (c) { return c.t + '。' + c.b.join(''); }).join('　'), '一次念完整課') +
      '<button class="btn" data-nav="#lesson/' + l.id + '/quiz">去做練習 →</button></div>';
    return h;
  }
  function mountCards(pane) {
    var cards = $$('.kcard', pane);
    if (cards.length) cards[0].classList.add('open');
    $$('[data-read]', pane).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = b.dataset.read, card = b.closest('.kcard');
        if (!card) return;
        if (S.read[id]) delete S.read[id]; else S.read[id] = 1;
        save();
        var on = !!S.read[id];
        card.classList.toggle('read', on);
        b.textContent = on ? '取消已讀' : '標記已讀';
        var mk = $('.kmark', card);
        if (on && !mk) {
          mk = document.createElement('span');
          mk.className = 'kmark'; mk.textContent = '✓ 已讀';
          $('.khead', card).appendChild(mk);
        } else if (!on && mk) { mk.parentNode.removeChild(mk); }
        var cnt = $('.kreadcnt', pane);
        if (cnt) cnt.textContent = '已讀 ' + $$('.kcard.read', pane).length + '／' + cards.length;
      });
    });
  }
  function panePages() {
    var l = LESSONS[V.lid];
    var h = '<div class="panel"><h3>這一課的原頁教材</h3><p class="sub">課本學習單、素養任務、備課講義與補充資料，直接把原頁放進來；點圖可以放大。圖下面的文字可以朗讀。</p></div>';
    h += '<div class="pggrid">' + l.pages.map(pageCard).join('') + '</div>';
    if (!l.pages.length) h += '<div class="empty">這一課沒有額外原頁，概念圖與重點摘要在「概念圖」分頁。</div>';
    h += '<h2 class="sec">全冊圖庫（' + Object.keys(PAGES).length + ' 張）</h2>' +
      '<div class="seg" style="margin-bottom:14px">' + GROUPS.map(function (g) {
        return '<button data-lg="' + esc(g) + '" class="' + (S.libgroup === g ? 'on' : '') + '">' + esc(g) + ' ' + LIBRARY[g].length + '</button>';
      }).join('') + '</div><div id="libslot"><div class="pggrid">' +
      (LIBRARY[S.libgroup] || []).map(pageCard).join('') + '</div></div>';
    return h;
  }

  /* ---------- 練習 ---------- */
  var Q = null;
  function paneQuiz() {
    var l = LESSONS[V.lid], st = statOf(V.lid);
    var ranges = [['all', '全部'], ['tf', '是非・勾選'], ['mc', '選擇・配對'], ['fill', '填空'], ['wrong', '只看錯題']];
    var h = '<div class="panel"><div class="row between" style="margin-bottom:12px">' +
      '<div><h3 style="margin:0">自動批改練習</h3><p class="sub" style="margin:4px 0 0">共 ' + l.items.length +
      ' 題；做過 ' + st.done + ' 題；最佳 ' + (st.best || '—') + ' 分。答錯自動進錯題本。</p></div>' +
      '<div>' + spk('現在開始做' + l.name + '的練習。', '念提示') + '</div></div>' +
      '<div class="row" style="gap:14px"><div><div class="sub" style="margin:0 0 6px">出題範圍</div><div class="seg">' +
      ranges.map(function (r) { return '<button data-qr="' + r[0] + '" class="' + (S.qrange === r[0] ? 'on' : '') + '">' + r[1] + '</button>'; }).join('') +
      '</div></div><div><div class="sub" style="margin:0 0 6px">作答模式</div><div class="seg">' +
      '<button data-qm="practice" class="' + (S.qmode === 'practice' ? 'on' : '') + '">即時訂正</button>' +
      '<button data-qm="exam" class="' + (S.qmode === 'exam' ? 'on' : '') + '">測驗模式</button></div></div></div>' +
      '<div class="row" style="margin-top:14px"><button class="btn primary" id="qstart">開始練習</button>' +
      '<button class="btn" id="qquick">隨機 10 題</button>' +
      '<button class="btn" data-nav="#wrong">去錯題本</button></div></div><div id="qslot"></div>';
    var cnt = { tf: 0, mc: 0, fill: 0 };
    l.items.forEach(function (i) { cnt[i.t]++; });
    h += '<div class="panel" style="margin-top:18px"><h3>這一課有哪些題型</h3>' +
      '<div class="statgrid" style="margin-bottom:14px">' +
      '<div class="statbox"><b>' + cnt.tf + '</b><span>是非・勾選題</span></div>' +
      '<div class="statbox"><b>' + cnt.mc + '</b><span>選擇・配對題</span></div>' +
      '<div class="statbox"><b>' + cnt.fill + '</b><span>重點整理填空</span></div></div>' +
      '<p class="sub" style="margin:0">「即時訂正」每題馬上告訴你答案和為什麼；「測驗模式」全部寫完才公布成績。' +
      '是非題可按鍵盤 <b>1</b>／<b>2</b>，選擇題按 <b>1</b>～<b>5</b> 選答案，再按「送出」。' +
      '填空題只要意思對、沒有多寫錯字，就會判對。</p></div>';
    return h;
  }
  function filtered() {
    var l = LESSONS[V.lid], list = l.items;
    if (S.qrange === 'wrong') list = list.filter(function (i) { return S.wrong[i.id]; });
    else if (S.qrange !== 'all') list = list.filter(function (i) { return i.t === S.qrange; });
    return list;
  }
  function startQuiz() {
    var list = shuffle(filtered());
    runQuiz(list, { lid: V.lid, label: LESSONS[V.lid].name });
  }
  function runQuiz(list, opt) {
    opt = opt || {};
    if (!list || !list.length) { toast('這個範圍目前沒有題目'); return false; }
    Q = {
      list: list, i: 0, ok: 0, mode: opt.mode || S.qmode, ans: [],
      locked: false, finished: false,
      lid: opt.lid || null, cross: !!opt.cross, label: opt.label || ''
    };
    touchDay(); renderQ();
    return true;
  }
  function stemHtml(it) {
    var s = '<div class="qstem">' + md(it.q) + '</div>';
    if (it.img) s += '<div style="margin:-6px 0 14px"><img src="' + imgsrc(it.img) +
      '" style="height:88px;border:1px solid #e1e9ee;border-radius:8px;background:#fff" alt="題目圖示"></div>';
    if (it.hint) s = '<div class="qhint">' + esc(it.hint) + '</div>' + s;
    return s;
  }
  function renderQ() {
    var slot = $('#qslot'); if (!slot || !Q) return;
    if (Q.finished) { slot.innerHTML = resultHtml(); bindResult(slot); return; }
    var it = Q.list[Q.i], n = Q.list.length;
    var tag = it.t === 'fill' ? ['fill', '填空題'] : it.t === 'tf' ? ['tf', '是非題'] : ['', '選擇題'];
    var h = '<div class="qcard"><div class="qbar"><span>第 ' + (Q.i + 1) + ' / ' + n + ' 題</span>' +
      '<div class="qbar-b"><i style="width:' + pct(Q.i, n) + '%"></i></div>' +
      '<span>答對 ' + Q.ok + '</span></div>' +
      '<span class="qtag ' + tag[0] + '">' + tag[1] + '</span>' +
      '<div class="row" style="justify-content:flex-end;margin-top:-38px;margin-bottom:6px">' +
      spk(it.q, '念題目') + '</div>' + stemHtml(it);
    if (it.t === 'tf') {
      h += '<div class="opts two"><button class="opt" data-opt="1"><i>○</i>正確（○）</button>' +
        '<button class="opt" data-opt="0"><i>╳</i>錯誤（╳）</button></div>';
    } else if (it.t === 'mc') {
      h += '<div class="opts">' + it.o.map(function (o, i) {
        return '<button class="opt" data-opt="' + i + '"><i>' + '①②③④⑤'[i] + '</i>' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      h += '<div class="inputrow"><input class="blank" id="fillin" placeholder="把答案打在這裡" autocomplete="off">' +
        '<button class="btn" id="fillok">送出答案</button></div>';
    }
    h += '<div class="qacts"><button class="btn primary" id="qsubmit"' + (Q.locked ? ' disabled' : '') + '>送出</button>' +
      '<button class="btn" id="qskip">跳過</button>' +
      '<button class="btn ghost" id="qend">結束並看結果</button></div><div id="qfb"></div></div>';
    slot.innerHTML = h;
    bindQ(slot, it);
  }
  function bindQ(slot, it) {
    var sel = null;
    $$('[data-opt]', slot).forEach(function (b) {
      b.addEventListener('click', function () {
        if (Q.locked) return;
        $$('[data-opt]', slot).forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); sel = b.dataset.opt;
        if ($('#fillin', slot)) $('#fillin', slot).focus();
      });
    });
    var fi = $('#fillin', slot);
    if (fi) {
      fi.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      setTimeout(function () { try { fi.focus(); } catch (e) { } }, 30);
    }
    if ($('#fillok', slot)) $('#fillok', slot).addEventListener('click', submit);
    $('#qsubmit', slot).addEventListener('click', submit);
    $('#qskip', slot).addEventListener('click', function () { answer(-1); });
    $('#qend', slot).addEventListener('click', function () { Q.finished = true; renderQ(); });
    function submit() {
      if (Q.locked) return;
      var v = sel;
      if (it.t === 'fill') v = fi ? fi.value.trim() : '';
      if (v === null || v === '' || v === undefined) { toast('先選一個答案或填入答案'); return; }
      answer(v);
    }
  }
  function isRight(it, v) {
    if (v === -1) return false;
    if (it.t === 'tf') return (v === '1') === !!it.a;
    if (it.t === 'mc') return Number(v) === it.a;
    return norm(v) === norm(it.a) || (norm(v).length > 1 && norm(it.a).indexOf(norm(v)) >= 0);
  }
  function ansText(it) {
    if (it.t === 'tf') return it.a ? '正確（○）' : '錯誤（╳）';
    if (it.t === 'mc') return '①②③④⑤'[it.a] + ' ' + it.o[it.a];
    return it.a;
  }
  function answer(v) {
    var it = Q.list[Q.i], ok = isRight(it, v);
    Q.locked = true;
    Q.ans.push({ id: it.id, ok: ok, mine: v });
    if (ok) Q.ok++;
    S.done[it.id] = 1;
    if (ok) delete S.wrong[it.id]; else S.wrong[it.id] = 1;
    save();
    if (Q.mode === 'exam') { next(); return; }
    var fb = $('#qfb'); if (!fb) return;
    var h = '<div class="fb ' + (v === -1 ? 'skip' : ok ? 'ok' : 'no') + '">' +
      (v === -1 ? '先跳過這題' : ok ? '✓ 答對了！' : '✗ 答錯了，看一下為什麼') + '</div>' +
      '<div class="whybox"><b>正確答案</b><span class="cans">' + esc(ansText(it)) + '</span>' +
      '<div style="margin-top:8px"><b>為什麼</b>' + esc(it.why || '') + '</div>' +
      '<div class="row" style="margin-top:8px">' + spk(ansText(it) + '。' + (it.why || ''), '念詳解') + '</div></div>';
    fb.innerHTML = h;
    var acts = $('.qacts');
    if (acts) acts.innerHTML = '<button class="btn primary" id="qnext">' +
      (Q.i + 1 >= Q.list.length ? '看結果' : '下一題 →') + '</button>';
    $('#qnext').addEventListener('click', next);
  }
  function next() {
    Q.i++; Q.locked = false;
    if (Q.i >= Q.list.length) {
      Q.finished = true;
      var lid = Q.lid || V.lid, score = Math.round(Q.ok / Q.list.length * 100);
      if (!Q.cross && lid && score > (S.best[lid] || 0)) S.best[lid] = score;
      save();
    }
    renderQ();
  }
  function resultHtml() {
    var score = Math.round(Q.ok / Q.list.length * 100);
    var h = '<div class="qcard"><h3>這回練習的結果</h3>' +
      '<div class="statgrid" style="margin:12px 0 18px">' +
      '<div class="statbox"><b>' + score + '</b><span>分（' + Q.ok + '／' + Q.list.length + ' 題）</span></div>' +
      '<div class="statbox"><b>' + (Q.cross ? '—' : (S.best[Q.lid || V.lid] || 0)) + '</b><span>' +
      (Q.cross ? '跨課總複習' : '本課最佳成績') + '</span></div>' +
      '<div class="statbox"><b>' + Object.keys(S.wrong).length + '</b><span>錯題本待複習</span></div></div>' +
      '<div class="row"><button class="btn primary" id="qagain">再練一次</button>' +
      '<button class="btn" data-nav="#wrong">看錯題本</button>' +
      '<button class="btn" data-nav="#lesson/' + V.lid + '/cards">回重點卡</button></div>';
    h += '<h3 style="margin-top:22px">逐題回顧</h3>';
    Q.ans.forEach(function (a, i) {
      var it = ALLITEMS[a.id];
      h += '<div class="wrow"><span class="wl" style="min-width:34px">' + (i + 1) + '.</span>' +
        '<div class="wq">' + esc(it.q) + '<div class="wl" style="margin-top:3px">' +
        (a.ok ? '✓ 答對' : '✗ ' + (a.mine === -1 ? '跳過' : '答錯')) +
        '　正解：' + esc(ansText(it)) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:3px">' + esc(it.why || '') + '</div></div>' +
        spk(it.q + '。正解是' + ansText(it) + '。' + (it.why || ''), '念這題') + '</div>';
    });
    h += '</div>';
    return h;
  }
  function bindResult(slot) {
    var b = $('#qagain', slot);
    if (b) b.addEventListener('click', startQuiz);
  }
  function mountQuiz(pane) {
    $$('[data-qr]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        S.qrange = b.dataset.qr; save(); Q = null; mountLessonFreshQuiz();
      });
    });
    $$('[data-qm]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        S.qmode = b.dataset.qm; save(); Q = null; mountLessonFreshQuiz();
      });
    });
    var s = $('#qstart', pane);
    if (s) s.addEventListener('click', startQuiz);
    var qk = $('#qquick', pane);
    if (qk) qk.addEventListener('click', function () {
      runQuiz(shuffle(LESSONS[V.lid].items).slice(0, 10),
        { lid: V.lid, label: '隨機 10 題' });
    });
    if (Q && Q.lid === V.lid) renderQ(); else Q = null;
  }
  function mountLessonFreshQuiz() {
    // 重新整理練習面板但不離開分頁
    var pane = $('#pane');
    pane.innerHTML = paneQuiz(); mountQuiz(pane);
  }

  /* ---------- 互動教具 ---------- */
  function paneTools() {
    var l = LESSONS[V.lid];
    if (!l.tools.length) return '<div class="empty">這一課沒有教具，去「練習」驗收吧。</div>';
    return '<div class="panel"><h3>動手玩一次</h3><p class="sub">這些教具把課本重點變成配對、分類和排序，做錯不會扣分，可以一直重玩。</p></div>' +
      l.tools.map(function (t, i) {
        return '<div class="toolcard" data-tool="' + i + '"><div class="toolhead"><h3>' + esc(t.name) + '</h3>' +
          '<button class="btn sm" data-reset="' + i + '">重新玩</button></div>' +
          '<p class="toolhint">' + esc(t.tip) + '</p><div class="toolbody" id="tool' + i + '"></div></div>';
      }).join('');
  }
  function mountTools(pane) {
    var l = LESSONS[V.lid];
    $$('[data-tool]', pane).forEach(function (box) {
      var i = Number(box.dataset.tool), t = l.tools[i];
      var slot = $('#tool' + i, box);
      function run() {
        slot.innerHTML = toolHtml(t, i);
        toolBind(t, slot, run);
      }
      run();
      var rs = $('[data-reset="' + i + '"]', box);
      if (rs) rs.addEventListener('click', run);
    });
  }
  function toolHtml(t, idx) {
    var h = '';
    if (t.kind === 'match') {
      var rights = shuffle(t.pairs.map(function (p, i) { return { text: p[1], i: i }; }));
      h += '<div class="matchgrid"><div class="mcol">' + t.pairs.map(function (p, i) {
        return '<button class="mbtn" data-l="' + i + '">' + esc(p[0]) + '</button>';
      }).join('') + '</div><div class="mcol">' + rights.map(function (r) {
        return '<button class="mbtn" data-r="' + r.i + '">' + esc(r.text) + '</button>';
      }).join('') + '</div></div><div class="qacts"><span class="sub" id="tmsg' + idx + '" style="margin:0">配對完成 0／' + t.pairs.length + '</span></div>';
    } else if (t.kind === 'choice') {
      h += '<div class="qstem" id="tq' + idx + '"></div><div class="opts" id="to' + idx + '"></div>' +
        '<div class="qacts"><span class="sub" id="tmsg' + idx + '" style="margin:0"></span></div>';
    } else if (t.kind === 'sort') {
      h += '<div class="sortgroups">' + t.groups.map(function (g, i) {
        return '<div class="sortbox" data-g="' + i + '"><b>' + esc(g) + '</b><div class="gitems"></div></div>';
      }).join('') + '</div><div id="tpool' + idx + '">' + shuffle(t.items).map(function (x, i) {
        return '<button class="chipitem" data-s="' + esc(x[0]) + '" data-gt="' + x[1] + '">' + esc(x[0]) + '</button>';
      }).join('') + '</div><div class="qacts"><span class="sub" id="tmsg' + idx + '" style="margin:0">分好 0／' + t.items.length + '</span></div>';
    } else if (t.kind === 'order') {
      h += '<div class="sub" style="margin:0 0 8px">依一年當中的先後順序，由早到晚點選：</div>' +
        '<div class="orderrow" id="tseq' + idx + '"></div><div id="tpool' + idx + '">' +
        shuffle(t.items).map(function (x) {
          return '<button class="chipitem" data-o="' + esc(x[0]) + '">' + esc(x[0]) + '・' + esc(x[1]) + '</button>';
        }).join('') + '</div><div class="qacts"><button class="btn primary" id="tcheck' + idx + '">檢查順序</button>' +
        '<button class="btn" id="tclear' + idx + '">清空重排</button><span class="sub" id="tmsg' + idx + '" style="margin:0"></span></div>';
    } else if (t.kind === 'check') {
      h += t.items.map(function (x, i) {
        return '<label class="checkrow" data-c="' + i + '"><input type="checkbox"><span>' + esc(x[0]) + '</span><em>' + esc(x[1]) + '</em></label>';
      }).join('') + '<div class="qacts"><span class="sub" id="tmsg' + idx + '" style="margin:0">完成 0／' + t.items.length + '</span></div>';
    }
    return h;
  }
  function toolBind(t, slot, rerun) {
    var msg = function (s) { var m = $('[id^=tmsg]', slot); if (m) m.textContent = s; };
    if (t.kind === 'match') {
      var pick = null, done = {};
      $$('[data-l]', slot).forEach(function (b) {
        b.addEventListener('click', function () {
          if (done[b.dataset.l]) return;
          $$('[data-l]', slot).forEach(function (x) { x.classList.remove('pick'); });
          b.classList.add('pick'); pick = Number(b.dataset.l);
        });
      });
      $$('[data-r]', slot).forEach(function (b) {
        b.addEventListener('click', function () {
          if (pick === null) { toast('先點左邊的名詞'); return; }
          if (Number(b.dataset.r) === pick) {
            b.classList.add('done');
            $('[data-l="' + pick + '"]', slot).classList.add('done');
            $('[data-l="' + pick + '"]', slot).classList.remove('pick');
            done[pick] = 1; pick = null;
            var n = Object.keys(done).length;
            msg('配對完成 ' + n + '／' + t.pairs.length + (n === t.pairs.length ? '　✓ 全部答對！' : ''));
            if (n === t.pairs.length) toast('全對！這一課的重點記起來了');
          } else {
            b.classList.add('err');
            setTimeout(function () { b.classList.remove('err'); }, 350);
          }
        });
      });
    } else if (t.kind === 'choice') {
      var ci = 0;
      function show() {
        var q = t.qs[ci % t.qs.length];
        $('#tq' + slot.id.replace('tool', ''), slot).textContent = q[0];
        var opts = shuffle(t.opts);
        $('#to' + slot.id.replace('tool', ''), slot).innerHTML = opts.map(function (o) {
          return '<button class="opt" data-cq="' + esc(o) + '"><i>·</i>' + esc(o) + '</button>';
        }).join('');
        msg('第 ' + (ci % t.qs.length + 1) + ' / ' + t.qs.length + ' 題');
        $$('[data-cq]', slot).forEach(function (b) {
          b.addEventListener('click', function () {
            if (b.dataset.cq === q[1]) {
              b.classList.add('sel'); msg('✓ 答對了！' + q[1] + '　再點一次換下一題');
              $$('[data-cq]', slot).forEach(function (x) { x.dataset.done = '1'; });
              setTimeout(function () { ci++; show(); }, 900);
            } else { b.classList.add('err'); setTimeout(function () { b.classList.remove('err'); }, 350); }
          });
        });
      }
      show();
    } else if (t.kind === 'sort') {
      var pickS = null, placed = 0;
      $$('[data-s]', slot).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('[data-s]', slot).forEach(function (x) { x.classList.remove('pick'); });
          b.classList.add('pick'); pickS = b;
        });
      });
      $$('.sortbox', slot).forEach(function (box) {
        box.addEventListener('click', function () {
          if (!pickS) { toast('先點一個器物或節日'); return; }
          if (Number(box.dataset.g) === Number(pickS.dataset.gt)) {
            var chip = document.createElement('span');
            chip.className = 'chipitem placed'; chip.textContent = pickS.dataset.s;
            $('.gitems', box).appendChild(chip);
            pickS.remove(); pickS = null; placed++;
            msg('分好 ' + placed + '／' + t.items.length + (placed === t.items.length ? '　✓ 全部分對！' : ''));
            if (placed === t.items.length) toast('全對！分類完成');
          } else {
            box.classList.add('err'); setTimeout(function () { box.classList.remove('err'); }, 350);
            toast('再想一下，這一類不太對');
          }
        });
      });
    } else if (t.kind === 'order') {
      var suf = slot.id.replace('tool', ''), seq = [];
      var pool = $('#tpool' + suf, slot), row = $('#tseq' + suf, slot);
      function draw() {
        row.innerHTML = seq.map(function (x, i) {
          return '<button class="chipitem pick" data-x="' + i + '">' + (i + 1) + '. ' + esc(x) + ' ✕</button>';
        }).join('');
        $$('[data-x]', row).forEach(function (b) {
          b.addEventListener('click', function () {
            var i = Number(b.dataset.x), removed = seq.splice(i, 1)[0];
            var nb = document.createElement('button');
            nb.className = 'chipitem'; nb.setAttribute('data-o', removed); nb.textContent = removed;
            pool.appendChild(nb); draw(); bindPool();
          });
        });
      }
      function bindPool() {
        $$('[data-o]', pool).forEach(function (b) {
          b.onclick = function () { seq.push(b.dataset.o); b.remove(); draw(); };
        });
      }
      bindPool();
      $('#tclear' + suf, slot).addEventListener('click', function () { rerun(); });
      $('#tcheck' + suf, slot).addEventListener('click', function () {
        if (seq.length < t.items.length) { toast('還有 ' + (t.items.length - seq.length) + ' 個沒排進去'); return; }
        var want = t.items.map(function (x) { return x[0]; });
        var ok = seq.every(function (x, i) { return x === want[i]; });
        msg(ok ? '✓ 順序完全正確！' : '順序還不對，再試一次（點已排的可以拿回來）');
        if (ok) toast('排對了！');
      });
    } else if (t.kind === 'check') {
      var boxes = $$('[data-c]', slot);
      boxes.forEach(function (b) {
        $('input', b).addEventListener('change', function () {
          b.classList.toggle('on', $('input', b).checked);
          var n = boxes.filter(function (x) { return $('input', x).checked; }).length;
          msg('完成 ' + n + '／' + boxes.length + (n === boxes.length ? '　✓ 全部完成！可以開始做小書了' : ''));
          if (n === boxes.length) toast('探究檢查表全部完成！');
        });
      });
    }
  }

  /* ---------- 全冊圖庫 ---------- */
  function viewLibrary() {
    var h = '<div class="panel" style="margin-top:20px"><h2>全冊圖庫</h2>' +
      '<p class="sub">概念構圖、重點摘要、課本學習單、節慶海報、臺灣與世界地圖、22 個縣市主體海報……共 ' +
      Object.keys(PAGES).length + ' 張原頁。點圖放大，點 🔊 聽說明。</p>' +
      '<div class="seg">' + GROUPS.map(function (g) {
        return '<button data-lg="' + esc(g) + '" class="' + (S.libgroup === g ? 'on' : '') + '">' + esc(g) + ' ' + LIBRARY[g].length + '</button>';
      }).join('') + '</div></div><div id="libslot"><div class="pggrid">' +
      (LIBRARY[S.libgroup] || []).map(pageCard).join('') + '</div></div>';
    return h;
  }
  function mountLibrary(root, inLesson) {
    var r = root || $('#main');
    $$('[data-lg]', r).forEach(function (b) {
      b.addEventListener('click', function () {
        S.libgroup = b.dataset.lg; save();
        if (inLesson) {
          $$('[data-lg]', r).forEach(function (x) { x.classList.toggle('on', x === b); });
          var slot = $('#libslot', r);
          if (slot) { slot.innerHTML = '<div class="pggrid">' + LIBRARY[S.libgroup].map(pageCard).join('') + '</div>'; mountPages(slot); }
        } else paint();
      });
    });
    mountPages(r);
  }
  function mountPages(root) {
    // 放大用全域事件代理處理，這裡只補游標樣式，避免重複綁定
    $$('[data-zoom]', root || $('#main')).forEach(function (el) {
      el.style.cursor = 'zoom-in';
    });
  }
  function openZoom(k) {
    var p = PAGES[k] || {};
    $('#zoomImg').src = imgsrc(k);
    $('#zoomTitle').textContent = p.title || '';
    $('#zoombox').classList.add('on');
  }

  /* ---------- 錯題本 ---------- */
  function viewWrong() {
    var ids = Object.keys(S.wrong).filter(function (k) { return ALLITEMS[k]; });
    var h = '<div class="panel" style="margin-top:20px"><div class="row between">' +
      '<div><h2>錯題本</h2><p class="sub" style="margin:4px 0 0">答錯或跳過的題目會自動放進來；答對一次就移除。目前 ' + ids.length + ' 題。</p></div>' +
      (ids.length ? '<button class="btn primary" id="wrongRun">一次複習全部</button>' : '') + '</div></div>';
    if (!ids.length) return h + '<div class="empty">目前沒有錯題，很棒！去任一課的「練習」試試看。</div>';
    h += '<div class="panel">';
    ids.forEach(function (id) {
      var it = ALLITEMS[id], lid = id.split(':')[0], l = LESSONS[lid];
      h += '<div class="wrow"><div class="wq">' + esc(it.q) +
        '<div class="wl" style="margin-top:3px">' + esc(lid) + ' ' + esc(l ? l.name : '') + '　正解：' + esc(ansText(it)) + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:3px">' + esc(it.why || '') + '</div></div>' +
        spk(ansText(it) + '。' + (it.why || ''), '念詳解') +
        '<button class="btn sm" data-retry="' + esc(lid) + '">重做這課</button>' +
        '<button class="btn sm" data-drop="' + esc(id) + '">移除</button></div>';
    });
    h += '</div>';
    return h;
  }

  /* ---------- 學習紀錄 ---------- */
  function viewStats() {
    var doneN = Object.keys(S.done).length, readN = Object.keys(S.read).length;
    var rightN = Object.keys(S.right).length;
    var h = '<div class="panel" style="margin-top:20px"><h2>學習紀錄</h2>' +
      '<p class="sub">進度只存在這台電腦的瀏覽器裡，不會上傳。</p><div class="statgrid">' +
      '<div class="statbox"><b>' + doneN + '</b><span>／' + TOTAL_ITEMS + ' 題做過</span></div>' +
      '<div class="statbox"><b>' + readN + '</b><span>／' + TOTAL_CARDS + ' 張卡讀過</span></div>' +
      '<div class="statbox"><b>' + Object.keys(S.wrong).length + '</b><span>題待複習</span></div>' +
      '<div class="statbox"><b>' + (S.streak || 0) + '</b><span>天連續學習</span></div></div></div>';
    h += '<div class="panel"><h3>各課進度</h3>';
    UNITS.forEach(function (u) {
      h += '<h3 style="margin:16px 0 4px;font-size:14px;color:var(--blue)">' + esc(u.no) + ' ' + esc(u.name) + '</h3>';
      u.lessons.forEach(function (l) {
        var st = statOf(l.id);
        h += '<div class="lesstat"><span class="nm">' + esc(l.id) + ' ' + esc(l.name) + '</span>' +
          '<div class="minibar"><i style="width:' + st.p + '%"></i></div>' +
          '<span class="sub" style="margin:0;min-width:74px">' + st.done + '／' + st.total + ' 題</span>' +
          '<span class="sub" style="margin:0;min-width:66px">最佳 ' + (st.best || '—') + '</span>' +
          '<button class="btn sm" data-nav="#lesson/' + l.id + '/quiz">去練習</button></div>';
      });
    });
    h += '</div><div class="panel"><div class="row"><button class="btn" id="resetAll">清除所有學習紀錄</button>' +
      '<span class="sub" style="margin:0">（只清進度，教材本身不受影響）</span></div></div>';
    return h;
  }

  /* ---------- 全域事件 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav]');
    if (t) {
      var h = t.dataset.nav;
      if (location.hash === h) paint(); else go(h);
      return;
    }
    var s = e.target.closest('[data-say]');
    if (s) { say(s.dataset.say, s); return; }
    var k = e.target.closest('.khead');
    if (k) { k.parentNode.classList.toggle('open'); return; }
    var z = e.target.closest('[data-zoom]');
    if (z) { openZoom(z.dataset.zoom); return; }
    var rt = e.target.closest('[data-retry]');
    if (rt) { go('#lesson/' + rt.dataset.retry + '/quiz'); return; }
    var dp = e.target.closest('[data-drop]');
    if (dp) { delete S.wrong[dp.dataset.drop]; save(); paint(); return; }
    if (e.target.id === 'wrongRun') { startWrongRun(); return; }
    if (e.target.id === 'resetAll') {
      if (confirm('確定要清除所有學習紀錄嗎？這無法復原。')) {
        localStorage.removeItem(KEY); S = blank(); save(); paint(); toast('已清除');
      }
      return;
    }
    if (e.target.id === 'zoomClose' || e.target.id === 'zoombox') {
      $('#zoombox').classList.remove('on'); $('#zoomImg').src = ''; return;
    }
  });
  function startWrongRun() {
    var ids = Object.keys(S.wrong).filter(function (k) { return ALLITEMS[k]; });
    if (!ids.length) { toast('錯題本是空的'); return; }
    // 跨課總複習：把所有錯題組成一份卷，借用第一題所屬課的練習頁當作容器
    var lid = ids[0].split(':')[0];
    S.qmode = 'practice'; save();
    Q = {
      list: shuffle(ids.map(function (k) { return ALLITEMS[k]; })),
      i: 0, ok: 0, mode: 'practice', ans: [], locked: false, finished: false,
      lid: lid, cross: true, label: '錯題本總複習（' + ids.length + ' 題）'
    };
    touchDay();
    var hash = '#lesson/' + lid + '/quiz';
    if (location.hash === hash) paint(); else go(hash);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { $('#zoombox').classList.remove('on'); return; }
    if (!Q || Q.finished || Q.locked) return;
    if (/^[1-5]$/.test(e.key)) {
      var b = $('[data-opt="' + (Number(e.key) - 1) + '"]', $('#qslot'));
      if (b) b.click();
    }
  });
  window.addEventListener('hashchange', paint);

  /* ---------- 啟動 ---------- */
  initVoice();
  touchDay();
  paint();
  window.SOC = {
    speak: say, startQuiz: startQuiz, runQuiz: runQuiz, go: go, paint: paint,
    data: D, state: S,
    getQ: function () { return Q; },
    answer: answer, next: next,
    allItems: ALLITEMS, lessons: LESSONS, units: UNITS, pages: PAGES, images: IM,
    startAll: function (mode, limit) {
      var lid = UNITS[0].lessons[0].id;
      var list = shuffle(Object.keys(ALLITEMS).map(function (k) { return ALLITEMS[k]; })).slice(0, limit || 20);
      S.qrange = 'all'; save();
      Q = {
        list: list, i: 0, ok: 0, mode: mode || 'practice', ans: [],
        locked: false, finished: false, lid: lid, cross: true, label: '全冊抽測'
      };
      var hash = '#lesson/' + lid + '/quiz';
      if (location.hash === hash) paint(); else go(hash);
      return Q;
    }
  };
})();
