/* 自然 4 上 自主學習系統 — 應用邏輯 */
(function () {
  'use strict';

  var D = window.APP_DATA;
  var UNITS = D.UNITS, META = D.META;
  var KEY = META.storageKey;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 狀態 ---------- */
  var S = load();
  function blank() {
    return { read: {}, ex: {}, done: {}, wrong: {}, gen: { n: 0, ok: 0 }, days: {}, ach: {}, lastDay: '', streak: 0, best: {} };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var o = JSON.parse(raw);
      var b = blank();
      for (var k in b) if (!(k in o)) o[k] = b[k];
      return o;
    } catch (e) { return blank(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  }
  function touchDay() {
    var t = new Date();
    var d = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
    if (S.lastDay === d) return;
    var y = new Date(t.getTime() - 86400000);
    var yd = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    S.streak = (S.lastDay === yd) ? (S.streak || 0) + 1 : 1;
    S.lastDay = d;
    S.days[d] = 1;
    save();
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function md(s) {
    var out = esc(s);
    out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return out;
  }
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function unitById(id) { return UNITS.filter(function (u) { return u.id === id; })[0]; }

  /* ---------- 文字正規化與批改 ---------- */
  var PUNCT = /[\s。，、,．.；;：:！!？?「」『』（）()【】\[\]…·―－—\/]/g;
  function halfWidth(s) {
    return String(s)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); })
      .replace(/[Ａ-Ｚａ-ｚ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); });
  }
  function normText(s) {
    var t = halfWidth(s).trim();
    t = t.replace(PUNCT, '');
    t = t.replace(/[臺台]/g, '台');
    t = t.toUpperCase();
    t = t.replace(/[〇O0]/g, '○').replace(/[╳X✕]/g, '×');
    return t;
  }
  function cmp(user, ans, alts) {
    var u = normText(user);
    if (!u) return false;
    var pool = [ans];
    if (alts && alts.length) pool = pool.concat(alts);
    for (var i = 0; i < pool.length; i++) {
      if (pool[i] == null) continue;
      if (u === normText(pool[i])) return true;
    }
    return false;
  }
  function altOf(item, i) { return (item.ok && item.ok[i]) || []; }
  function ansText(it) {
    if (it.type === 'tf') return it.ans.map(function (a) { return a === '○' ? '○ 對' : '× 錯'; }).join('、');
    if (it.type === 'choice') return it.ans.map(function (a) { var k = (it.opts || []).indexOf(a); return (k >= 0 ? CIRC[k] + ' ' : '') + a; }).join('、');
    return it.ans.join('、');
  }

  /* ---------- 首頁 ---------- */
  function unitStats(u) {
    var total = u.items.length + u.cards.length + u.examples.length;
    var got = 0;
    u.cards.forEach(function (c) { if (S.read[u.id + ':' + c.id]) got++; });
    u.examples.forEach(function (e) { if (S.ex[e.id]) got++; });
    u.items.forEach(function (i) { if (S.done[i.id]) got++; });
    var right = 0, tried = 0;
    u.items.forEach(function (i) {
      if (S.done[i.id]) { tried++; if (S.done[i.id].ok) right++; }
    });
    return { total: total, got: got, pct: pct(got, total), tried: tried, right: right, all: u.items.length };
  }
  function renderHome() {
    var totalItems = UNITS.reduce(function (a, u) { return a + u.items.length; }, 0);
    var doneItems = UNITS.reduce(function (a, u) {
      return a + u.items.filter(function (i) { return S.done[i.id]; }).length;
    }, 0);
    var okItems = UNITS.reduce(function (a, u) {
      return a + u.items.filter(function (i) { return S.done[i.id] && S.done[i.id].ok; }).length;
    }, 0);
    var wrongN = Object.keys(S.wrong).length;
    var cardN = UNITS.reduce(function (a, u) { return a + u.cards.length; }, 0);

    var html = '' +
      '<section class="hero">' +
      '<div class="hero-l">' +
      '<div class="kicker">期中考後 · 第 3～4 單元</div>' +
      '<h2>把「背答案」換成「想得通」</h2>' +
      '<p>聲音、光、電路三件事，總共 ' + totalItems + ' 道校訂題目、' + cardN + ' 張知識卡，加上無限出題與八種互動教具。每題都有分步解析，答錯會告訴你錯在哪裡。</p>' +
      '<div class="hero-btns">' +
      '<button class="btn primary" data-go="u3">從第 3 單元開始</button>' +
      '<button class="btn" data-go="wrong">看錯題本（' + wrongN + '）</button>' +
      '</div></div>' +
      '<div class="hero-r">' +
      '<div class="ring" style="--p:' + pct(okItems, totalItems) + '"><span>' + pct(okItems, totalItems) + '%</span><i>答對率</i></div>' +
      '<div class="hero-nums">' +
      '<div><b>' + doneItems + '</b><span>做過題數</span></div>' +
      '<div><b>' + okItems + '</b><span>答對題數</span></div>' +
      '<div><b>' + (S.streak || 0) + '</b><span>連續天數</span></div>' +
      '</div></div>' +
      '</section>';

    html += '<h2 class="sec">兩個單元</h2><p class="sub">點進去看概念圖、知識卡、例題，再練題。</p><div class="grid">';
    UNITS.forEach(function (u) {
      var st = unitStats(u);
      html += '' +
        '<article class="ucard" data-go="' + u.id + '" style="--h:' + u.hue + '">' +
        '<div class="uc-top"><div class="uc-icon">' + esc(u.icon) + '</div>' +
        '<div><h3>第 ' + u.no + ' 單元</h3><div class="uc-name">' + esc(u.name) + '</div></div>' +
        '<div class="uc-pct">' + st.pct + '%</div></div>' +
        '<p class="uc-intro">' + esc(u.intro) + '</p>' +
        '<div class="bar"><i style="width:' + st.pct + '%"></i></div>' +
        '<div class="uc-meta"><span>知識卡 ' + u.cards.length + '</span><span>例題 ' + u.examples.length + '</span><span>題目 ' + u.items.length + '</span><span class="ok">答對 ' + st.right + '/' + st.all + '</span></div>' +
        '</article>';
    });
    html += '</div>';

    html += '<div class="tipbox"><b>怎麼用最有效</b><p>① 先看概念圖建立骨架 → ② 讀知識卡補細節 → ③ 跟著例題想一次 → ④ 做題，錯了看解析與錯因 → ⑤ 到錯題本重練。自然科的題目幾乎都在問「為什麼」，答案要說得出理由。</p></div>';

    $('#view').innerHTML = html;
  }

  /* ---------- 單元頁 ---------- */
  var tab = 'map';
  function renderUnit(uid, keepTab) {
    var u = unitById(uid);
    if (!u) return renderHome();
    if (!keepTab) tab = 'map';
    var st = unitStats(u);
    var html = '' +
      '<div class="uhead" style="--h:' + u.hue + '">' +
      '<button class="btn sm ghost" data-go="home">← 回總覽</button>' +
      '<div class="uhead-row"><div class="uhead-icon">' + esc(u.icon) + '</div>' +
      '<div><h2>第 ' + u.no + ' 單元　' + esc(u.name) + '</h2>' +
      '<p class="sub">' + esc(u.intro) + '</p></div>' +
      '<div class="uhead-pct">' + st.pct + '%</div></div>' +
      '<div class="chips">' + u.goal.map(function (g) { return '<span class="chip">' + esc(g) + '</span>'; }).join('') + '</div>' +
      '</div>';

    var tabs = [['map', '概念圖'], ['cards', '知識卡'], ['ex', '例題'], ['quiz', '練習'], ['tools', '教具']];
    html += '<div class="utabs">' + tabs.map(function (t) {
      return '<button data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
    }).join('') + '</div><div id="tabpane"></div>';
    $('#view').innerHTML = html;

    var pane = $('#tabpane');
    if (tab === 'map') paneMap(u, pane);
    if (tab === 'cards') paneCards(u, pane);
    if (tab === 'ex') paneEx(u, pane);
    if (tab === 'quiz') paneQuiz(u, pane);
    if (tab === 'tools') paneTools(u, pane);
  }

  function paneMap(u, pane) {
    pane.innerHTML = '' +
      '<div class="panel"><h3>單元概念圖</h3><p class="sub">先看骨架，知道這個單元有哪些東西。</p>' +
      '<div class="mmwrap"><svg id="mm"></svg></div>' +
      '<div class="mmhint">可以拖曳、滾輪縮放</div></div>' +
      '<div class="panel"><h3>解題流程</h3><p class="sub">遇到題目時，照這個流程想一遍。</p>' +
      '<div class="mmd" id="mmd"></div></div>' +
      '<div class="panel"><h3>學習重點代碼</h3>' +
      '<div class="codes"><div><b>學習表現</b>' + u.codes.learn.map(function (c) { return '<span class="code">' + esc(c) + '</span>'; }).join('') + '</div>' +
      '<div><b>學習內容</b>' + u.codes.content.map(function (c) { return '<span class="code">' + esc(c) + '</span>'; }).join('') + '</div></div></div>';

    drawMarkmap($('#mm'), u.mindmap);
    drawMermaid($('#mmd'), u.flow);
  }

  function parseMdTree(src) {
    var root = { content: '', children: [] };
    var stack = [{ node: root, level: -1 }];
    src.split('\n').forEach(function (line) {
      var m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        var lv = m[1].length;
        var node = { content: m[2], children: [] };
        while (stack.length > 1 && stack[stack.length - 1].level >= lv) stack.pop();
        stack[stack.length - 1].node.children.push(node);
        stack.push({ node: node, level: lv });
      }
    });
    return root.children[0] || { content: '（無）', children: [] };
  }
  function drawMarkmap(svg, src) {
    if (!svg || !window.markmap) return;
    try {
      var data = parseMdTree(src);
      svg.innerHTML = '';
      var mm = window.markmap.Markmap.create(svg, {
        autoFit: true, duration: 0, paddingX: 14, spacingVertical: 6,
        colorFreezeLevel: 2, initialExpandLevel: -1, maxWidth: 220
      }, data);
      setTimeout(function () { try { mm.fit(); } catch (e) { } }, 60);
    } catch (e) { svg.parentNode.innerHTML = '<div class="warn">概念圖載入失敗</div>'; }
  }
  var midSeq = 0;
  function drawMermaid(el, code) {
    if (!el || !window.mermaid) return;
    var id = 'mm' + (++midSeq);
    try {
      window.mermaid.render(id, code).then(function (r) {
        el.innerHTML = r.svg;
      }).catch(function () {
        el.innerHTML = '<div class="warn">流程圖載入失敗</div>';
      });
    } catch (e) { el.innerHTML = '<div class="warn">流程圖載入失敗</div>'; }
  }

  function paneCards(u, pane) {
    var html = '<div class="panel"><div class="row between"><h3>知識卡</h3>' +
      '<div class="row" style="gap:8px"><span class="sub" style="margin:0">已讀 <b id="readn">0</b> / ' + u.cards.length + '</span>' +
      '<button class="btn sm" id="expandAll">展開全部</button></div></div>' +
      '<p class="sub">點卡片展開。讀完按「我讀懂了」。</p><div class="klist">';
    u.cards.forEach(function (c) {
      var key = u.id + ':' + c.id;
      var read = !!S.read[key];
      html += '<article class="kcard' + (read ? ' read' : '') + '" data-card="' + c.id + '">' +
        '<div class="khead"><span class="ktag">' + esc(c.tag) + '</span><b>' + esc(c.t) + '</b>' +
        '<span class="kmark">' + (read ? '✓' : '') + '</span></div>' +
        '<div class="kbody">' +
        c.body.map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') +
        '<div class="ktip"><b>訣竅</b>' + md(c.tip) + '</div>' +
        '<div class="kpit"><b>易錯</b>' + md(c.pit) + '</div>' +
        '<button class="btn sm primary" data-read="' + c.id + '">我讀懂了</button>' +
        '</div></article>';
    });
    html += '</div></div>';
    pane.innerHTML = html;

    function refresh() {
      var n = u.cards.filter(function (c) { return S.read[u.id + ':' + c.id]; }).length;
      var el = $('#readn'); if (el) el.textContent = n;
    }
    refresh();
    if (location.search.indexOf('open=1') >= 0) {
      $$('.kcard', pane).forEach(function (c) { c.classList.add('open'); });
      var eb = $('#expandAll', pane); if (eb) eb.textContent = '收合全部';
    }
    var exBtn = $('#expandAll', pane);
    if (exBtn) exBtn.addEventListener('click', function () {
      var anyClosed = $$('.kcard', pane).some(function (c) { return !c.classList.contains('open'); });
      $$('.kcard', pane).forEach(function (c) { c.classList.toggle('open', anyClosed); });
      exBtn.textContent = anyClosed ? '收合全部' : '展開全部';
    });
    $$('.kcard', pane).forEach(function (card) {
      $('.khead', card).addEventListener('click', function () {
        card.classList.toggle('open');
      });
    });
    $$('[data-read]', pane).forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var cid = b.getAttribute('data-read');
        S.read[u.id + ':' + cid] = true;
        save(); refresh();
        b.closest('.kcard').classList.add('read');
        b.textContent = '已讀 ✓';
        toast('已記錄');
        checkAch();
      });
    });
  }

  function paneEx(u, pane) {
    var html = '<div class="panel"><h3>分步例題</h3><p class="sub">先自己想一想，再展開看每一步。</p>';
    u.examples.forEach(function (e, i) {
      html += '<article class="excard" data-ex="' + e.id + '">' +
        '<div class="exhead"><span class="exno">例 ' + (i + 1) + '</span><b>' + esc(e.t) + '</b></div>' +
        '<div class="exq">' + md(e.q) + '</div>' +
        '<div class="exsteps">' +
        e.steps.map(function (s, k) {
          return '<div class="exstep"><i>' + (k + 1) + '</i><div><b>' + md(s[0]) + '</b><span>' + md(s[1]) + '</span></div></div>';
        }).join('') +
        '</div>' +
        '<div class="exans">答：<b>' + md(e.ans) + '</b></div>' +
        '<div class="exwhy"><b>為什麼</b>' + md(e.why) + '</div>' +
        '<button class="btn sm" data-exdone="' + e.id + '">' + (S.ex[e.id] ? '再看一次 ✓' : '我想過了') + '</button>' +
        '</article>';
    });
    html += '</div>';
    pane.innerHTML = html;
    $$('[data-exdone]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        S.ex[b.getAttribute('data-exdone')] = true; save();
        b.textContent = '再看一次 ✓'; toast('已記錄'); checkAch();
      });
    });
  }

  /* ---------- 練習 ---------- */
  var quiz = { mode: 'bank', idx: 0, order: null, item: null, gen: null, checked: false, uid: '' };

  function paneQuiz(u, pane) {
    if (quiz.uid !== u.id) { quiz.uid = u.id; quiz.mode = 'bank'; quiz.idx = 0; quiz.order = null; quiz.checked = false; }
    pane.innerHTML = '' +
      '<div class="panel">' +
      '<div class="row between"><h3>練習</h3>' +
      '<div class="seg"><button data-mode="bank" class="' + (quiz.mode === 'bank' ? 'on' : '') + '">課本題庫</button>' +
      '<button data-mode="gen" class="' + (quiz.mode === 'gen' ? 'on' : '') + '">無限出題</button></div></div>' +
      '<div id="qzone"></div></div>';

    $$('[data-mode]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        quiz.mode = b.getAttribute('data-mode');
        quiz.idx = 0; quiz.order = null; quiz.checked = false;
        $$('[data-mode]', pane).forEach(function (x) { x.classList.toggle('on', x === b); });
        renderQuizZone(u);
      });
    });
    renderQuizZone(u);
  }

  function renderQuizZone(u) {
    var z = $('#qzone');
    if (!z) return;
    if (quiz.mode === 'bank') {
      if (!quiz.order) quiz.order = u.items.map(function (_, i) { return i; });
      var i = quiz.idx % quiz.order.length;
      quiz.item = u.items[quiz.order[i]];
      z.innerHTML = '<div class="qbar"><span>第 ' + (i + 1) + ' / ' + quiz.order.length + ' 題</span>' +
        '<div class="qbar-b"><i style="width:' + pct(i, quiz.order.length) + '%"></i></div>' +
        '<button class="btn sm" id="shuffle">隨機排序</button></div>' +
        '<div id="qslot"></div>';
      $('#shuffle').addEventListener('click', function () {
        quiz.order = shuffle(quiz.order.slice());
        quiz.idx = 0; renderQuizZone(u);
      });
      renderQuestion(quiz.item, u, z.querySelector('#qslot'), function () {
        quiz.idx++; renderQuizZone(u);
      });
    } else {
      var gs = u.gens;
      z.innerHTML = '<div class="genpick">' + gs.map(function (g) {
        return '<button class="genbtn" data-gen="' + g.id + '"><b>' + esc(g.name) + '</b><span>' + esc(g.desc) + '</span></button>';
      }).join('') + '</div><div id="qslot"></div>' +
        '<div class="genstat">本次已做 <b id="gn">0</b> 題，答對 <b id="go">0</b> 題</div>';
      updateGenStat();
      $$('[data-gen]', z).forEach(function (b) {
        b.addEventListener('click', function () {
          var g = gs.filter(function (x) { return x.id === b.getAttribute('data-gen'); })[0];
          $$('[data-gen]', z).forEach(function (x) { x.classList.toggle('on', x === b); });
          nextGen(u, g);
        });
      });
    }
  }
  function updateGenStat() {
    var a = $('#gn'), b = $('#go');
    if (a) a.textContent = S.gen.n;
    if (b) b.textContent = S.gen.ok;
  }
  function nextGen(u, g) {
    var slot = $('#qslot');
    var item = GEN[g.kind] ? GEN[g.kind]() : null;
    if (!item) { slot.innerHTML = '<div class="warn">這個生成器尚未實作</div>'; return; }
    item.id = 'gen:' + u.id + ':' + g.id + ':' + Date.now();
    quiz.gen = item;
    renderQuestion(item, u, slot, function () {
      nextGen(u, g);
    }, true);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var CIRC = ['①', '②', '③', '④', '⑤', '⑥'];

  function renderQuestion(item, u, slot, next, isGen) {
    quiz.checked = false;
    var html = '<article class="qcard">' +
      '<div class="qstem">' + renderStem(item) + '</div>' +
      '<div class="qbody" id="qbody"></div>' +
      '<div class="qacts"><button class="btn primary" id="check">檢查</button>' +
      '<button class="btn" id="show">看解答</button>' +
      '<button class="btn ghost" id="next">下一題 →</button></div>' +
      '<div class="qfb" id="qfb"></div>' +
      '</article>';
    slot.innerHTML = html;

    var body = $('#qbody', slot);
    var inputs = [];
    if (item.type === 'choice') {
      body.innerHTML = '<div class="opts">' + item.opts.map(function (o, i) {
        return '<button class="opt" data-opt="' + esc(o) + '"><i>' + CIRC[i] + '</i><span>' + md(o) + '</span></button>';
      }).join('') + '</div>';
      $$('.opt', body).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.opt', body).forEach(function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
        });
      });
    } else if (item.type === 'tf') {
      body.innerHTML = '<div class="opts tf"><button class="opt" data-opt="○"><span>○ 對</span></button><button class="opt" data-opt="×"><span>× 錯</span></button></div>';
      $$('.opt', body).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.opt', body).forEach(function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
        });
      });
    } else {
      var n = item.ans.length;
      for (var i = 0; i < n; i++) {
        var w = document.createElement('div');
        w.className = 'blankrow' + (n === 1 ? ' solo' : '');
        w.innerHTML = (n > 1 ? '<span class="bn">第 ' + (i + 1) + ' 格</span>' : '') + '<input class="blank" autocomplete="off" spellcheck="false" placeholder="輸入答案">';
        body.appendChild(w);
        inputs.push($('input', w));
      }
      if (inputs[0]) inputs[0].focus();
      body.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') $('#check', slot).click();
      });
    }

    function collect() {
      if (item.type === 'choice' || item.type === 'tf') {
        var s = $('.opt.sel', body);
        return s ? [s.getAttribute('data-opt')] : null;
      }
      return inputs.map(function (x) { return x.value; });
    }

    function grade(userArr) {
      return userArr.map(function (v, i) { return cmp(v, item.ans[i], altOf(item, i)); });
    }

    function ansLabel(a) {
      if (item.type === 'choice') {
        var k = item.opts.indexOf(a);
        return (k >= 0 ? CIRC[k] + ' ' : '') + a;
      }
      if (item.type === 'tf') return a === '○' ? '○ 對（這句話是正確的）' : '× 錯（這句話是錯誤的）';
      return a;
    }

    function showFeedback(userArr, forced) {
      var res = userArr ? grade(userArr) : item.ans.map(function () { return false; });
      var allOk = userArr && res.every(Boolean);
      var fb = $('#qfb', slot);
      var head = allOk ? '<div class="fb ok">全部正確！</div>' :
        (forced ? '<div class="fb skip">以下是完整解答</div>' : '<div class="fb no">再想一下，看看是哪一格不對</div>');
      var rows = item.ans.map(function (a, i) {
        var mark = userArr ? (res[i] ? '<span class="gm ok">✓</span>' : '<span class="gm no">✗</span>') : '';
        var mine = userArr && userArr[i] ? '<span class="mine">你的答案：' + esc(userArr[i]) + '</span>' : '';
        var lab = item.ans.length > 1 ? '<span class="bn">第 ' + (i + 1) + ' 格</span>' : '';
        return '<div class="fbrow">' + mark + lab +
          '<span class="clabel">正確</span><b class="cans">' + md(ansLabel(a)) + '</b>' + mine + '</div>';
      }).join('');
      var sol = '<div class="sol"><b>解析</b>' + item.sol.map(function (s, i) {
        return '<div class="solrow"><i>' + (i + 1) + '</i><span>' + md(s) + '</span></div>';
      }).join('') + '</div>';
      var err = (userArr && !allOk && item.err) ? '<div class="err"><b>你可能錯在</b>' + md(item.err) + '</div>' : '';
      fb.innerHTML = head + rows + sol + err;
      if (userArr) {
        if (isGen) {
          S.gen.n++; if (allOk) S.gen.ok++;
          updateGenStat();
        } else {
          var rec = S.done[item.id] || { ok: true, n: 0 };
          rec.n++; rec.ok = allOk;
          S.done[item.id] = rec;
          if (allOk) {
            delete S.wrong[item.id];
          } else {
            S.wrong[item.id] = { n: (S.wrong[item.id] ? S.wrong[item.id].n : 0) + 1, ts: Date.now() };
          }
        }
        save(); checkAch();
      }
    }

    $('#check', slot).addEventListener('click', function () {
      if (quiz.checked) return;
      var v = collect();
      if (!v || v.some(function (x) { return !String(x).trim(); })) { toast('還有空格沒填'); return; }
      quiz.checked = true;
      showFeedback(v, false);
    });
    $('#show', slot).addEventListener('click', function () {
      quiz.checked = true;
      showFeedback(null, true);
    });
    $('#next', slot).addEventListener('click', function () { next(); });
  }

  function renderStem(item) {
    var stem = item.stem;
    var n = item.ans.length;
    if (item.type !== 'fill') return md(stem);
    var parts = stem.split(/\( (\d+) \)/);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        if (n > 1) out += '<span class="bph">（' + parts[i] + '）</span>';
      } else {
        out += md(parts[i]);
      }
    }
    return out;
  }

  /* ---------- 教具 ---------- */
  function paneTools(u, pane) {
    pane.innerHTML = '<div class="panel"><h3>互動教具</h3><p class="sub">動手玩一次，比讀十遍有用。</p><div id="toolzone"></div></div>';
    var z = $('#toolzone');
    z.innerHTML = u.tools.map(function (t) {
      return '<article class="tool" data-tool="' + t.id + '"><div class="toolhead"><b>' + esc(t.name) + '</b><span>' + esc(t.desc) + '</span></div><div class="toolbody" id="tb_' + t.id + '"></div></article>';
    }).join('');
    u.tools.forEach(function (t) {
      var box = $('#tb_' + t.id);
      if (!box) return;
      if (t.kind === 'sound') toolSound(box);
      if (t.kind === 'shadow') toolShadow(box);
      if (t.kind === 'reflect') toolReflect(box);
      if (t.kind === 'sortlight') toolSortLight(box);
      if (t.kind === 'circuit') toolCircuit(box);
      if (t.kind === 'series') toolSeries(box);
      if (t.kind === 'motor') toolMotor(box);
      if (t.kind === 'safety') toolSafety(box);
    });
  }

  /* 教具一：橡皮筋振動 */
  function toolSound(box) {
    box.innerHTML = '<div class="trow"><label>拉開距離 <input type="range" id="sd" min="1" max="6" value="1"><b id="sdv">1 公分</b></label></div>' +
      '<div class="tcanvas" id="ssvg"></div><div class="tinfo" id="sinfo"></div>';
    var r = $('#sd', box);
    function upd() {
      var d = +r.value;
      $('#sdv', box).textContent = d + ' 公分';
      var amp = d * 6;
      var W = 520, H = 190, y0 = 56;
      var pts = [];
      for (var x = 30; x <= W - 30; x += 4) {
        var t = (x - 30) / (W - 60);
        pts.push([x, y0 + Math.sin(t * Math.PI * 6) * amp]);
      }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      s += '<text x="30" y="20" class="tlab">橡皮筋振動的模樣</text>';
      s += '<line x1="30" y1="' + y0 + '" x2="' + (W - 30) + '" y2="' + y0 + '" stroke="#eef2f8" stroke-width="1"/>';
      s += '<polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#2b5fa8" stroke-width="2.6"/>';
      var vol = Math.round(d / 6 * 100);
      s += '<text x="30" y="' + (H - 34) + '" class="tlab">聲音大小</text>';
      s += '<rect x="120" y="' + (H - 46) + '" width="300" height="16" rx="8" fill="#eef2f8"/>';
      s += '<rect x="120" y="' + (H - 46) + '" width="' + (300 * vol / 100) + '" height="16" rx="8" fill="#d97706"/>';
      s += '<text x="430" y="' + (H - 33) + '" class="ax">' + vol + '%</text>';
      s += '</svg>';
      $('#ssvg', box).innerHTML = s;
      var lvl = d <= 2 ? '小' : (d <= 4 ? '中' : '大');
      $('#sinfo', box).innerHTML = '<div class="tres"><span>拉開 ' + d + ' 公分 → 振動較 <b>' + lvl + '</b></span><b>聲音較' + lvl + '</b></div>' +
        '<div class="sub" style="margin:8px 0 0">振動越大，聲音越大。拉得越長，橡皮筋彈回的幅度越大，所以聲音越響。</div>';
    }
    r.addEventListener('input', upd); upd();
  }

  /* 教具二：光源與影子 */
  function toolShadow(box) {
    box.innerHTML = '<div class="trow"><label>光源位置 <input type="range" id="sx" min="70" max="470" value="150"><b id="sxv">偏左</b></label></div>' +
      '<div class="tcanvas" id="hsvg"></div><div class="tinfo" id="hinfo"></div>';
    var r = $('#sx', box);
    function upd() {
      var lx = +r.value, W = 540, H = 250, ground = 205, ox = 270, oh = 90, ow = 26;
      $('#sxv', box).textContent = lx < ox ? '偏左' : (lx === ox ? '正上方' : '偏右');
      var y0 = ground - oh, top = 40;
      var sx = ox + (ox - lx) * (ground - y0) / (y0 - top);
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      s += '<line x1="20" y1="' + ground + '" x2="' + (W - 20) + '" y2="' + ground + '" stroke="#cbd5e1" stroke-width="2"/>';
      var a = Math.min(sx, ox - ow / 2), b = Math.max(sx, ox + ow / 2);
      s += '<rect x="' + a + '" y="' + (ground - 6) + '" width="' + Math.max(4, b - a) + '" height="8" rx="4" fill="#94a3b8"/>';
      s += '<text x="' + ((a + b) / 2) + '" y="' + (ground + 26) + '" class="ax" text-anchor="middle">影子</text>';
      s += '<line x1="' + lx + '" y1="' + top + '" x2="' + ox + '" y2="' + y0 + '" stroke="#f0b429" stroke-width="2" stroke-dasharray="6 4"/>';
      s += '<line x1="' + ox + '" y1="' + y0 + '" x2="' + sx + '" y2="' + ground + '" stroke="#f0b429" stroke-width="2" stroke-dasharray="6 4"/>';
      s += '<circle cx="' + lx + '" cy="' + top + '" r="15" fill="#fde68a" stroke="#d97706" stroke-width="2"/>';
      s += '<text x="' + lx + '" y="' + (top - 20) + '" class="tlab" text-anchor="middle">光源</text>';
      s += '<rect x="' + (ox - ow / 2) + '" y="' + y0 + '" width="' + ow + '" height="' + oh + '" rx="4" fill="#93c5fd" stroke="#2b5fa8" stroke-width="2"/>';
      s += '<text x="' + ox + '" y="' + (y0 - 10) + '" class="tlab" text-anchor="middle">物體</text>';
      s += '</svg>';
      $('#hsvg', box).innerHTML = s;
      var len = Math.round(Math.abs(sx - ox));
      var side = sx < ox ? '左' : '右';
      $('#hinfo', box).innerHTML = '<div class="tres"><span>影子在物體的 <b>' + side + '側</b>（背光面）</span><b>長度約 ' + len + '</b></div>' +
        '<div class="sub" style="margin:8px 0 0">光源 → 物體 → 影子，三個一定排成一直線。光源越低，影子越長；光源越靠近物體正上方，影子越短。</div>';
    }
    r.addEventListener('input', upd); upd();
  }

  /* 教具三：鏡面反射 */
  function toolReflect(box) {
    box.innerHTML = '<div class="trow"><label>入射角 <input type="range" id="ra" min="5" max="80" value="40"><b id="rav">40°</b></label></div>' +
      '<div class="tcanvas" id="rsvg"></div><div class="tinfo" id="rinfo"></div>';
    var r = $('#ra', box);
    function upd() {
      var a = +r.value;
      $('#rav', box).textContent = a + '°';
      var W = 520, H = 240, mx = W / 2, my = 185, R = 150;
      var rad = a * Math.PI / 180;
      var ix = mx - Math.sin(rad) * R, iy = my - Math.cos(rad) * R;
      var rx = mx + Math.sin(rad) * R, ry = my - Math.cos(rad) * R;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      s += '<line x1="60" y1="' + my + '" x2="' + (W - 60) + '" y2="' + my + '" stroke="#2b5fa8" stroke-width="6"/>';
      s += '<line x1="60" y1="' + (my + 10) + '" x2="' + (W - 60) + '" y2="' + (my + 10) + '" stroke="#bfdbfe" stroke-width="2"/>';
      s += '<line x1="' + mx + '" y1="' + (my - 12) + '" x2="' + mx + '" y2="' + (my - R - 12) + '" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="5 5"/>';
      s += '<line x1="' + ix + '" y1="' + iy + '" x2="' + mx + '" y2="' + my + '" stroke="#d97706" stroke-width="2.6"/>';
      s += '<line x1="' + mx + '" y1="' + my + '" x2="' + rx + '" y2="' + ry + '" stroke="#0f8b7e" stroke-width="2.6"/>';
      s += '<text x="' + (mx - 40) + '" y="' + (my - 30) + '" class="tang">' + a + '°</text>';
      s += '<text x="' + (mx + 16) + '" y="' + (my - 30) + '" class="tang">' + a + '°</text>';
      s += '<text x="' + (ix - 12) + '" y="' + (iy - 10) + '" class="tlab">入射光</text>';
      s += '<text x="' + (rx - 24) + '" y="' + (ry - 10) + '" class="tlab">反射光</text>';
      s += '<text x="' + (mx + 8) + '" y="' + (my - R - 16) + '" class="ax">法線</text>';
      s += '</svg>';
      $('#rsvg', box).innerHTML = s;
      $('#rinfo', box).innerHTML = '<div class="tres"><span>入射角 <b>' + a + '°</b> ＝ 反射角 <b>' + a + '°</b></span></div>' +
        '<div class="sub" style="margin:8px 0 0">光照射到鏡面會改變方向，這就是反射。改變照射的角度，反射光的位置也跟著改變，但反射後的光仍然是直線。</div>';
    }
    r.addEventListener('input', upd); upd();
  }

  /* 教具四：聲光用途分類 */
  var SORT_POOL = [
    { t: '救護車警示燈與警笛', k: 'warn' }, { t: '紅綠燈', k: 'warn' },
    { t: '一氧化碳偵測警報器', k: 'warn' }, { t: '燈塔', k: 'warn' },
    { t: '腳踏車車鈴', k: 'warn' }, { t: '電影院緊急出口燈', k: 'warn' },
    { t: '行人穿越號誌', k: 'warn' }, { t: '鐵路平交道號誌燈', k: 'warn' },
    { t: '聖誕樹燈飾', k: 'fun' }, { t: '元宵花燈', k: 'fun' },
    { t: '熱氣球光雕音樂會', k: 'fun' }, { t: '聲光玩具', k: 'fun' },
    { t: '樂器玩具', k: 'fun' }, { t: '表演舞臺閃燈', k: 'fun' }
  ];
  function toolSortLight(box) {
    var picked = SORT_POOL.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 8);
    var state = {};
    box.innerHTML = '<div class="tchips" id="spool"></div>' +
      '<div class="sortgrid">' +
      '<div><h3 style="font-size:13px;color:#8c3b2c;margin-bottom:6px">警示、指示</h3><div id="swarn" class="sortbox"></div></div>' +
      '<div><h3 style="font-size:13px;color:#1d5f52;margin-bottom:6px">裝飾、娛樂</h3><div id="sfun" class="sortbox"></div></div></div>' +
      '<div class="tinfo" id="sinfo2"></div>' +
      '<div class="sub" style="margin-top:8px">操作：點一下放進「警示、指示」；再點一次切換成「裝飾、娛樂」；第三次取消。</div>';
    function draw() {
      var pool = $('#spool', box), w = $('#swarn', box), f = $('#sfun', box);
      pool.innerHTML = ''; w.innerHTML = ''; f.innerHTML = '';
      picked.forEach(function (it, i) {
        var st = state[i] || '';
        if (!st) {
          pool.innerHTML += '<button class="chipb" data-i="' + i + '">' + esc(it.t) + '</button>';
        } else {
          var ok = (st === it.k);
          var html = '<div class="sortitem ' + (ok ? 'ok' : 'no') + '">' + esc(it.t) + '<b>' + (ok ? '✓' : '✗') + '</b></div>';
          if (st === 'warn') w.innerHTML += html; else f.innerHTML += html;
        }
      });
      var n = Object.keys(state).length, right = 0;
      Object.keys(state).forEach(function (k) { if (state[k] === picked[k].k) right++; });
      var tipEl = $('#sinfo2', box);
      if (tipEl) tipEl.innerHTML = '<div class="tres"><span>已分類 <b>' + n + '</b> / ' + picked.length + '</span><b>答對 ' + right + '</b></div>' +
        (n === picked.length ? '<div class="sub" style="margin:8px 0 0">全部完成！判斷訣竅：它想告訴你「注意、讓開、往哪裡走」就是警示指示；只是好看好玩就是裝飾娛樂。</div>' : '');
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      var i = +b.getAttribute('data-i');
      state[i] = state[i] === undefined ? 'warn' : (state[i] === 'warn' ? 'fun' : '');
      draw();
    });
    draw();
  }

  /* 教具五：電路接線台 */
  var CIRC_ITEMS = [
    { t: '銅線', ok: true }, { t: '迴紋針', ok: true }, { t: '十元硬幣', ok: true },
    { t: '鋁箔紙', ok: true }, { t: '長尾夾', ok: true },
    { t: '橡皮擦', ok: false }, { t: '塑膠尺', ok: false }, { t: '棉繩', ok: false },
    { t: '色紙', ok: false }, { t: '蠟筆', ok: false }
  ];
  function toolCircuit(box) {
    box.innerHTML = '<div class="trow">' +
      '<label>開關 <select id="csw" class="tin"><option value="1">關上（接通）</option><option value="0">打開（斷開）</option></select></label>' +
      '<label>接在電路的物品 <select id="cit" class="tin wide">' +
      CIRC_ITEMS.map(function (c, i) { return '<option value="' + i + '">' + c.t + '</option>'; }).join('') +
      '</select></label></div>' +
      '<div class="tcanvas" id="csv"></div><div class="tinfo" id="cinfo"></div>';
    function upd() {
      var sw = $('#csw', box).value === '1';
      var it = CIRC_ITEMS[+$('#cit', box).value];
      var on = sw && it.ok;
      var W = 520, H = 292, L = 90, R = 420, T = 74, B = 206;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      var wire = on ? '#0f8b7e' : '#94a3b8';
      var mid = W / 2;
      s += '<line x1="' + L + '" y1="' + T + '" x2="' + (mid - 30) + '" y2="' + T + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + (mid + 30) + '" y1="' + T + '" x2="' + R + '" y2="' + T + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + R + '" y1="' + T + '" x2="' + R + '" y2="' + (B - 36) + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + R + '" y1="' + (B + 36) + '" x2="' + R + '" y2="' + B + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + L + '" y1="' + B + '" x2="' + (mid - 42) + '" y2="' + B + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + (mid + 42) + '" y1="' + B + '" x2="' + R + '" y2="' + B + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (B - 36) + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + L + '" y1="' + (B + 36) + '" x2="' + L + '" y2="' + B + '" stroke="' + wire + '" stroke-width="3"/>';
      // 燈泡
      s += '<circle cx="' + mid + '" cy="' + T + '" r="28" fill="' + (on ? '#fde68a' : '#f1f5f9') + '" stroke="' + (on ? '#d97706' : '#94a3b8') + '" stroke-width="2.5"/>';
      if (on) {
        for (var k = 0; k < 8; k++) {
          var ang = k * Math.PI / 4;
          s += '<line x1="' + (mid + Math.cos(ang) * 34) + '" y1="' + (T + Math.sin(ang) * 34) + '" x2="' + (mid + Math.cos(ang) * 44) + '" y2="' + (T + Math.sin(ang) * 44) + '" stroke="#f0b429" stroke-width="2.5"/>';
        }
      }
      s += '<text x="' + mid + '" y="' + (T - 54) + '" class="tlab" text-anchor="middle">燈泡' + (on ? '（亮）' : '（不亮）') + '</text>';
      // 電池
      s += '<rect x="' + (mid - 40) + '" y="' + (B - 14) + '" width="80" height="28" rx="5" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>';
      s += '<text x="' + mid + '" y="' + (B + 5) + '" class="ax" text-anchor="middle">電池</text>';
      s += '<text x="' + (mid + 48) + '" y="' + (B - 1) + '" class="tang">＋</text>';
      s += '<text x="' + (mid - 56) + '" y="' + (B - 1) + '" class="tang">－</text>';
      // 開關
      s += '<line x1="' + L + '" y1="' + (B - 36) + '" x2="' + L + '" y2="' + (B - 8) + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + L + '" y1="' + (B + 8) + '" x2="' + L + '" y2="' + (B + 36) + '" stroke="' + wire + '" stroke-width="3"/>';
      s += '<line x1="' + L + '" y1="' + (B - 8) + '" x2="' + (sw ? L : L - 24) + '" y2="' + (sw ? B + 8 : B - 30) + '" stroke="#475569" stroke-width="4" stroke-linecap="round"/>';
      s += '<text x="' + (L - 4) + '" y="' + (B + 58) + '" class="ax" text-anchor="middle">開關</text>';
      // 測試物品
      s += '<rect x="' + (R - 18) + '" y="' + (B - 36) + '" width="36" height="72" rx="6" fill="' + (it.ok ? '#dbeafe' : '#fee2e2') + '" stroke="' + (it.ok ? '#2b5fa8' : '#c0392b') + '" stroke-width="2"/>';
      s += '<text x="' + R + '" y="' + (B + 58) + '" class="ax" text-anchor="middle">' + esc(it.t) + '</text>';
      s += '</svg>';
      $('#csv', box).innerHTML = s;
      var why = !sw ? '開關打開 → 電路有缺口 → 斷路，電流過不去。'
        : (it.ok ? '開關關上，而且' + it.t + '是電的良導體 → 形成通路，燈泡發亮。'
          : '開關關上了，但' + it.t + '是電的不良導體 → 電流過不去 → 斷路，燈泡不亮。');
      $('#cinfo', box).innerHTML = '<div class="tres"><span>狀態：<b>' + (on ? '通路' : '斷路') + '</b></span><b>' + (on ? '燈泡會亮' : '燈泡不亮') + '</b></div>' +
        '<div class="sub" style="margin:8px 0 0">' + why + '</div>';
    }
    $('#csw', box).addEventListener('change', upd);
    $('#cit', box).addEventListener('change', upd);
    upd();
  }

  /* 教具六：串並聯實驗 */
  function toolSeries(box) {
    box.innerHTML = '<div class="trow">' +
      '<label>電池 <select id="sb" class="tin wide"><option value="1">1 個</option><option value="s">2 個串聯</option><option value="p">2 個並聯</option></select></label>' +
      '<label>燈泡 <select id="sl" class="tin wide"><option value="1">1 個</option><option value="s">2 個串聯</option><option value="p">2 個並聯</option></select></label></div>' +
      '<div class="tcanvas" id="ssv2"></div><div class="tinfo" id="sinfo3"></div>';
    function upd() {
      var b = $('#sb', box).value, l = $('#sl', box).value;
      var bf = b === 's' ? 1.5 : 1;
      var lf = l === 's' ? 0.6 : 1;
      var score = bf * lf;
      var lvl = score > 1.15 ? '比較亮' : (score < 0.85 ? '比較暗' : '和平常一樣');
      var W = 520, H = 220;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      function lamp(x, y, bright, label) {
        return '<circle cx="' + x + '" cy="' + y + '" r="' + (bright ? 22 : 18) + '" fill="' + (bright ? '#fde68a' : '#f1f5f9') + '" stroke="' + (bright ? '#d97706' : '#94a3b8') + '" stroke-width="2.4"/>' +
          '<text x="' + x + '" y="' + (y + 38) + '" class="ax" text-anchor="middle">' + label + '</text>';
      }
      function batt(x, y, label) {
        return '<rect x="' + (x - 26) + '" y="' + (y - 10) + '" width="52" height="20" rx="4" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>' +
          '<text x="' + x + '" y="' + (y + 26) + '" class="ax" text-anchor="middle">' + label + '</text>';
      }
      s += '<rect x="16" y="18" width="240" height="180" rx="12" fill="#fbfdff" stroke="#e3eaf3"/>';
      s += '<text x="136" y="40" class="tlab" text-anchor="middle">電池接法</text>';
      if (b === '1') { s += batt(136, 110, '1 個電池'); }
      else if (b === 's') { s += batt(136, 78, '甲'); s += batt(136, 132, '乙（串聯）'); s += '<line x1="162" y1="78" x2="162" y2="132" stroke="#475569" stroke-width="2"/>'; }
      else { s += batt(100, 105, '甲'); s += batt(176, 105, '乙（並聯）'); }
      s += '<rect x="272" y="18" width="228" height="180" rx="12" fill="#fbfdff" stroke="#e3eaf3"/>';
      s += '<text x="386" y="40" class="tlab" text-anchor="middle">燈泡接法</text>';
      var bright = score > 1.15;
      if (l === '1') { s += lamp(386, 108, bright, '1 個燈泡'); }
      else if (l === 's') { s += lamp(336, 108, bright, '甲'); s += lamp(436, 108, bright, '乙（串聯）'); s += '<line x1="360" y1="108" x2="412" y2="108" stroke="#94a3b8" stroke-width="2"/>'; }
      else { s += lamp(336, 108, bright, '甲'); s += lamp(436, 108, bright, '乙（並聯）'); }
      s += '</svg>';
      $('#ssv2', box).innerHTML = s;
      var lines = [];
      lines.push('電池' + (b === '1' ? '1 個' : (b === 's' ? '串聯 → 亮度增加' : '並聯 → 亮度不變、更持久')));
      lines.push('燈泡' + (l === '1' ? '1 個' : (l === 's' ? '串聯 → 亮度減弱' : '並聯 → 亮度不變')));
      var extra;
      if (b === 's' && l === 's') extra = '電池串聯變亮、燈泡串聯變暗，兩個效果互相抵消，看起來和平常差不多。';
      else if (b === 's') extra = '電池串聯把電力疊加，所以燈泡比平常亮。';
      else if (l === 's') extra = '燈泡串聯時，兩個燈泡擠在同一條通路上，所以每個都變暗。';
      else if (b === 'p') extra = '電池並聯不會變亮，但電力更持久；其中一個電池沒電，燈泡仍然會亮。';
      else if (l === 'p') extra = '燈泡並聯時各自有通路，亮度不變；其中一個壞掉，另一個仍然會亮。';
      else extra = '一個電池配一個燈泡，這是最基本的通路。';
      $('#sinfo3', box).innerHTML = '<div class="tres"><span>' + lines.join('；') + '</span><b>' + lvl + '</b></div>' +
        '<div class="sub" style="margin:8px 0 0">' + extra + '</div>';
    }
    $('#sb', box).addEventListener('change', upd);
    $('#sl', box).addEventListener('change', upd);
    upd();
  }

  /* 教具七：小馬達轉向 */
  function toolMotor(box) {
    box.innerHTML = '<div class="trow"><label>電池接法 <select id="mp" class="tin wide"><option value="1">正常接法</option><option value="-1">正負極反接</option></select></label>' +
      '<label><input type="checkbox" id="mfan" checked> 裝上扇葉</label></div>' +
      '<div class="tcanvas" id="msv"></div><div class="tinfo" id="minfo"></div>';
    function upd() {
      var p = +$('#mp', box).value, fan = $('#mfan', box).checked;
      var dir = p > 0 ? '逆時針' : '順時針';
      var W = 480, H = 230, cx = 240, cy = 110;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="52" fill="#e2e8f0" stroke="#475569" stroke-width="3"/>';
      s += '<g class="mrotor' + (p < 0 ? ' rev' : '') + '">';
      if (fan) {
        for (var i = 0; i < 3; i++) {
          var a = i * 2 * Math.PI / 3;
          s += '<line x1="' + (cx + Math.cos(a) * 10).toFixed(1) + '" y1="' + (cy + Math.sin(a) * 10).toFixed(1) + '" x2="' + (cx + Math.cos(a) * 44).toFixed(1) + '" y2="' + (cy + Math.sin(a) * 44).toFixed(1) + '" stroke="#2b5fa8" stroke-width="7" stroke-linecap="round"/>';
        }
      } else {
        s += '<line x1="' + (cx - 40) + '" y1="' + cy + '" x2="' + (cx + 40) + '" y2="' + cy + '" stroke="#2b5fa8" stroke-width="7" stroke-linecap="round"/>';
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#2b5fa8"/>';
      }
      s += '</g>';
      s += '<text x="' + cx + '" y="' + (cy + 82) + '" class="tlab" text-anchor="middle">' + dir + '轉動</text>';
      s += '<line x1="' + (cx - 52) + '" y1="' + cy + '" x2="70" y2="' + (cy + 62) + '" stroke="#d97706" stroke-width="2.4"/>';
      s += '<line x1="' + (cx + 52) + '" y1="' + cy + '" x2="410" y2="' + (cy + 62) + '" stroke="#0f8b7e" stroke-width="2.4"/>';
      s += '<rect x="40" y="' + (cy + 62) + '" width="70" height="26" rx="4" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>';
      s += '<text x="75" y="' + (cy + 80) + '" class="ax" text-anchor="middle">電池</text>';
      s += '<text x="26" y="' + (cy + 60) + '" class="tang">' + (p > 0 ? '＋' : '－') + '</text>';
      s += '<text x="120" y="' + (cy + 60) + '" class="tang">' + (p > 0 ? '－' : '＋') + '</text>';
      s += '</svg>';
      $('#msv', box).innerHTML = s;
      $('#minfo', box).innerHTML = '<div class="tres"><span>電池反接 → 電流方向相反 → 馬達轉向 <b>' + dir + '</b></span></div>' +
        '<div class="sub" style="margin:8px 0 0">把電池正極、負極反過來接，小馬達不會壞、也不會停，只是轉動方向相反。裝上扇葉是為了方便觀察轉動方向，不是讓它轉得更快。</div>';
    }
    $('#mp', box).addEventListener('change', upd);
    $('#mfan', box).addEventListener('change', upd);
    upd();
  }

  /* 教具八：用電安全檢查 */
  var SAFE = [
    { t: '用手直接拉扯電線拔插頭', ok: false, why: '要捏住插頭拔，拉電線會讓內部銅線斷裂。' },
    { t: '用潮溼的手碰觸插座', ok: false, why: '水會導電，濕手碰插座容易觸電。' },
    { t: '定期檢查電線的塑膠皮有沒有破損', ok: true, why: '塑膠皮破損會露出銅線，非常危險。' },
    { t: '延長線上同時連接許多電器', ok: false, why: '用電超過負荷會電線走火。' },
    { t: '插頭要插到底、插好', ok: true, why: '沒插好會接觸不良、發熱。' },
    { t: '電線不要捲在一起', ok: true, why: '捲在一起散熱不良，容易過熱。' },
    { t: '長期不用的電器把電池取出', ok: true, why: '電池可能滲出化學物質損壞電器。' },
    { t: '把實驗電線插進家中插座', ok: false, why: '插座電壓遠高於電池，會觸電。' }
  ];
  function toolSafety(box) {
    var picked = {};
    box.innerHTML = '<div class="safelist" id="sfl"></div><div class="tinfo" id="sfi"></div>' +
      '<div class="sub" style="margin-top:8px">點一下判斷「安全」或「不安全」，會顯示正確答案與原因。</div>';
    function draw() {
      var el = $('#sfl', box);
      el.innerHTML = SAFE.map(function (s, i) {
        var st = picked[i];
        var cls = st === undefined ? '' : (st ? 'ok' : 'no');
        return '<button class="safeitem ' + cls + '" data-s="' + i + '"><span class="sfm">' + (st === undefined ? '？' : (st ? '✓' : '✗')) + '</span>' + esc(s.t) + '</button>';
      }).join('');
      var n = Object.keys(picked).length, right = 0;
      Object.keys(picked).forEach(function (k) { if (picked[k] === SAFE[k].ok) right++; });
      $('#sfi', box).innerHTML = '<div class="tres"><span>已判斷 <b>' + n + '</b> / ' + SAFE.length + '</span><b>答對 ' + right + '</b></div>' +
        (n === SAFE.length ? '<div class="sub" style="margin:8px 0 0">全部判斷完成。✓ 是正確做法，✗ 是危險行為。</div>' : '');
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-s]');
      if (!b) return;
      var i = +b.getAttribute('data-s');
      picked[i] = SAFE[i].ok;
      draw();
      toast((SAFE[i].ok ? '✓ 正確：' : '✗ 危險：') + SAFE[i].why);
    });
    draw();
  }

  /* ---------- 錯題本 ---------- */
  function renderWrong() {
    var ids = Object.keys(S.wrong);
    var html = '<h2 class="sec">錯題本</h2>';
    if (!ids.length) {
      html += '<div class="empty"><b>目前沒有錯題</b><p>去練習，答錯的題目會自動收進來。</p><button class="btn primary" data-go="u3">去練習</button></div>';
      $('#view').innerHTML = html; return;
    }
    html += '<p class="sub">共 ' + ids.length + ' 題。答對一次就會自動移除。</p><div class="panel">';
    ids.forEach(function (id) {
      var found = null;
      UNITS.forEach(function (u) {
        u.items.forEach(function (it) { if (it.id === id) found = { u: u, it: it }; });
      });
      if (!found) return;
      html += '<div class="wrow"><div class="wmeta"><span class="wtag">第 ' + found.u.no + ' 單元</span>' +
        '<span class="wn">錯 ' + S.wrong[id].n + ' 次</span></div>' +
        '<div class="wstem">' + renderStem(found.it) + '</div>' +
        '<div class="wans">答案：<b>' + md(ansText(found.it)) + '</b></div>' +
        '<div class="wsol">' + found.it.sol.map(function (s, i) { return '<div class="solrow"><i>' + (i + 1) + '</i><span>' + md(s) + '</span></div>'; }).join('') + '</div>' +
        '<div class="wacts"><button class="btn sm primary" data-redo="' + id + '">重做這題</button>' +
        '<button class="btn sm" data-clear="' + id + '">已會了，移除</button></div>' +
        '<div class="redo" id="redo_' + id + '"></div></div>';
    });
    html += '</div>';
    $('#view').innerHTML = html;

    $$('[data-clear]').forEach(function (b) {
      b.addEventListener('click', function () {
        delete S.wrong[b.getAttribute('data-clear')]; save(); renderWrong(); toast('已移除');
      });
    });
    $$('[data-redo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-redo');
        var found = null;
        UNITS.forEach(function (u) { u.items.forEach(function (it) { if (it.id === id) found = { u: u, it: it }; }); });
        if (!found) return;
        var slot = $('#redo_' + id);
        slot.innerHTML = '';
        renderQuestion(found.it, found.u, slot, function () {
          slot.innerHTML = '<div class="fb ok">這題已重做，答對就會從錯題本移除。</div>';
          if (S.done[id] && S.done[id].ok) { setTimeout(renderWrong, 700); }
        });
      });
    });
  }

  /* ---------- 成就 ---------- */
  var ACHS = [
    { id: 'a1', n: '踏出第一步', d: '完成第一道題目', f: function () { return Object.keys(S.done).length >= 1; } },
    { id: 'a2', n: '十題達人', d: '累積答對 10 題', f: function () { return okCount() >= 10; } },
    { id: 'a3', n: '半冊挑戰', d: '累積答對 50 題', f: function () { return okCount() >= 50; } },
    { id: 'a4', n: '概念通', d: '讀完 10 張知識卡', f: function () { return Object.keys(S.read).length >= 10; } },
    { id: 'a5', n: '單元掃蕩', d: '把任一個單元的題目全部做過', f: function () { return UNITS.some(function (u) { return u.items.every(function (i) { return S.done[i.id]; }); }); } },
    { id: 'a6', n: '滿分單元', d: '任一個單元全部答對', f: function () { return UNITS.some(function (u) { return u.items.every(function (i) { return S.done[i.id] && S.done[i.id].ok; }); }); } },
    { id: 'a7', n: '連三day', d: '連續 3 天回來學習', f: function () { return (S.streak || 0) >= 3; } },
    { id: 'a8', n: '無限練習', d: '用生成器做 30 題', f: function () { return S.gen.n >= 30; } },
    { id: 'a9', n: '錯題清零', d: '錯題本清空（至少做過 20 題）', f: function () { return Object.keys(S.done).length >= 20 && Object.keys(S.wrong).length === 0; } },
    { id: 'a10', n: '全單元制霸', d: '兩個單元全部答對', f: function () { return UNITS.every(function (u) { return u.items.every(function (i) { return S.done[i.id] && S.done[i.id].ok; }); }); } }
  ];
  function okCount() {
    return Object.keys(S.done).filter(function (k) { return S.done[k].ok; }).length;
  }
  function checkAch() {
    ACHS.forEach(function (a) {
      if (!S.ach[a.id] && a.f()) { S.ach[a.id] = Date.now(); save(); toast('成就達成：' + a.n); }
    });
  }
  function renderAch() {
    var got = ACHS.filter(function (a) { return S.ach[a.id]; }).length;
    var html = '<h2 class="sec">成就</h2><p class="sub">已達成 ' + got + ' / ' + ACHS.length + '</p><div class="agrid">';
    ACHS.forEach(function (a) {
      var on = !!S.ach[a.id];
      html += '<div class="ach' + (on ? ' on' : '') + '"><div class="amedal">' + (on ? '★' : '☆') + '</div><b>' + a.n + '</b><span>' + a.d + '</span></div>';
    });
    html += '</div>';
    html += '<div class="panel"><h3>學習紀錄</h3><div class="row">' +
      '<div class="stat"><b>' + Object.keys(S.done).length + '</b><span>做過題數</span></div>' +
      '<div class="stat"><b>' + okCount() + '</b><span>答對題數</span></div>' +
      '<div class="stat"><b>' + Object.keys(S.wrong).length + '</b><span>待複習</span></div>' +
      '<div class="stat"><b>' + S.gen.n + '</b><span>生成題數</span></div>' +
      '<div class="stat"><b>' + (S.streak || 0) + '</b><span>連續天數</span></div>' +
      '</div><div class="row" style="margin-top:12px"><button class="btn sm" id="reset">清除所有紀錄</button></div></div>';
    $('#view').innerHTML = html;
    $('#reset').addEventListener('click', function () {
      if (!confirm('確定要清除所有學習紀錄嗎？')) return;
      S = blank(); save(); renderAch(); toast('已清除');
    });
  }

  /* ---------- 路由 ---------- */
  var route = { name: 'home', uid: '' };
  function paint(name, uid) {
    route = { name: name, uid: uid || '' };
    renderNav();
    if (name === 'home') renderHome();
    else if (name === 'unit') renderUnit(uid, true);
    else if (name === 'wrong') renderWrong();
    else if (name === 'ach') renderAch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function go(name, uid) {
    var h = name === 'home' ? '#/home'
      : name === 'unit' ? '#/' + uid + '/' + tab
        : '#/' + name;
    if (location.hash === h) { paint(name, uid); return; }
    location.hash = h;
  }
  function applyHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var p = h.split('/').filter(Boolean);
    if (!p.length) return paint('home');
    if (p[0] === 'home') return paint('home');
    if (p[0] === 'wrong') return paint('wrong');
    if (p[0] === 'ach') return paint('ach');
    if (/^u\d+$/.test(p[0])) {
      tab = p[1] || 'map';
      return paint('unit', p[0]);
    }
    paint('home');
  }
  function renderNav() {
    var items = [['home', '總覽']].concat(UNITS.map(function (u) { return ['u' + u.no, '第 ' + u.no + ' 單元']; }))
      .concat([['wrong', '錯題本'], ['ach', '成就']]);
    $('#nav').innerHTML = items.map(function (it) {
      var on = (route.name === 'home' && it[0] === 'home') || (route.name === 'unit' && it[0] === 'u' + (unitById(route.uid) || {}).no) ||
        (route.name === 'wrong' && it[0] === 'wrong') || (route.name === 'ach' && it[0] === 'ach');
      return '<button data-nav="' + it[0] + '" class="' + (on ? 'on' : '') + '">' + it[1] + '</button>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go],[data-nav],[data-tab]');
    if (!t) return;
    if (t.hasAttribute('data-go')) {
      var g = t.getAttribute('data-go');
      if (g === 'home' || g === 'wrong' || g === 'ach') return go(g);
      tab = 'map';
      return go('unit', g);
    }
    if (t.hasAttribute('data-nav')) {
      var n = t.getAttribute('data-nav');
      if (n === 'home' || n === 'wrong' || n === 'ach') return go(n);
      tab = 'map';
      return go('unit', 'u' + n.slice(1));
    }
    if (t.hasAttribute('data-tab')) {
      tab = t.getAttribute('data-tab');
      go('unit', route.uid);
    }
  });

  /* ---------- 生成器 ---------- */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var GEN = {
    soundSize: function () {
      var d = pick([1, 2, 3, 4, 5, 6]);
      var big = d >= 4;
      if (Math.random() < 0.5) {
        var w1 = big ? '大' : '小';
        return {
          type: 'fill', stem: '手拉橡皮筋 ' + d + ' 公分後放手彈撥，橡皮筋振動較 ( 1 )，發出的聲音較 ( 2 )。（填「大」或「小」）',
          ans: [w1, w1],
          ok: [[w1, '較' + w1], [w1, '較' + w1]],
          sol: ['拉開 ' + d + ' 公分，振動幅度' + w1 + '。', '振動' + w1 + '，聲音就' + w1 + '。'],
          err: '把「拉得長」和「聲音大」的關係記反。'
        };
      }
      return {
        type: 'choice', stem: '想讓橡皮筋發出的聲音變小，下列哪一種做法正確？',
        opts: ['彈撥時力氣小一點，讓振動變小', '把橡皮筋換成紅色的', '把橡皮筋剪短一點', '把橡皮筋放到桌上'],
        ans: ['彈撥時力氣小一點，讓振動變小'],
        sol: ['聲音大小由振動大小決定。', '力氣小 → 振動小 → 聲音小。'],
        err: '用顏色或長度去猜。'
      };
    },
    medium: function () {
      var cases = [
        { q: '把耳朵貼在門板上，可以聽到門外的說話聲。聲音是透過什麼傳播？', a: '固體', why: '門板是固體，聲音透過門板傳到耳朵。' },
        { q: '水中的舞者能隨著音樂起舞。聲音主要是透過什麼傳播？', a: '液體', why: '水是液體，聲音透過水傳到舞者耳中。' },
        { q: '海豚透過聲音互相溝通。聲音主要是透過什麼傳播？', a: '液體', why: '海水是液體，海豚靠水傳聲。' },
        { q: '我們平常面對面說話，聲音主要是透過什麼傳播？', a: '氣體', why: '空氣是氣體，聲帶振動使空氣振動再傳到對方耳朵。' },
        { q: '把耳朵靠在桌面上，可以聽見遠處的敲擊聲。聲音是透過什麼傳播？', a: '固體', why: '桌面是固體，固體傳聲比空氣清楚。' },
        { q: '吹直笛時，坐在旁邊的同學聽得到聲音。聲音主要是透過什麼傳播？', a: '氣體', why: '聲音透過空氣（氣體）傳到同學耳朵。' }
      ];
      var c = pick(cases);
      return {
        type: 'fill', stem: c.q.replace(/什麼傳播？/, '( 1 ) 傳播？') + '（填「固體」「液體」或「氣體」）',
        ans: [c.a], ok: [[c.a, c.a === '液體' ? '水' : c.a]],
        sol: [c.why], err: '只想到空氣，忽略題目給的介質。'
      };
    },
    lightSrc: function () {
      var pool = [
        { t: '太陽', y: true }, { t: '點燃的蠟燭', y: true }, { t: '發亮的手電筒', y: true },
        { t: '亮著的燈泡', y: true }, { t: '螢火蟲', y: true }, { t: '燃燒中的木炭', y: true },
        { t: '鏡子', y: false }, { t: '月亮', y: false }, { t: '反光板', y: false },
        { t: '沒開燈的檯燈', y: false }, { t: '白紙', y: false }, { t: '平靜的湖面', y: false }
      ];
      var c = pick(pool);
      var others = pool.filter(function (x) { return x.y !== c.y; });
      var o1 = pick(others).t, o2 = pick(others).t;
      var stem = c.y ? '下列哪一項是光源？' : '下列哪一項不是光源？';
      return {
        type: 'choice', stem: stem,
        opts: [c.t, o1, o2, c.y ? '以上皆非' : '以上皆是'],
        ans: [c.t],
        sol: [c.y ? c.t + '會自己發光，所以是光源；另外兩項只是反射別人的光。'
          : c.t + '不會自己發光，只是把別人的光反射過來，所以不是光源；另外兩項都會自己發光。'],
        err: '把「亮亮的」當成「會發光」。'
      };
    },
    lightBehav: function () {
      var cases = [
        { q: '在陽光下玩踩影子遊戲，地上出現人的影子', a: '直線行進' },
        { q: '利用汽車後視鏡看見後方來車', a: '反射' },
        { q: '利用戲偶與燈光表演皮影戲', a: '直線行進' },
        { q: '在萬花筒裡看見美麗的圖案', a: '反射' },
        { q: '從雲縫中穿透的陽光形成一道一道的光束', a: '直線行進' },
        { q: '道路轉彎處的凸面鏡可以看見對向來車', a: '反射' },
        { q: '貓站在陽光下，地上出現貓的影子', a: '直線行進' },
        { q: '雷射筆的光照射鏡子後改變方向', a: '反射' },
        { q: '夜晚車燈射出的燈光筆直前進', a: '直線行進' },
        { q: '剪完頭髮用鏡子看後面的髮型', a: '反射' }
      ];
      var c = pick(cases);
      return {
        type: 'choice', stem: '「' + c.q + '」這是光的哪一種特性？',
        opts: ['光的直線行進', '光的反射', '光的折射', '光被吸收了'],
        ans: [c.a === '反射' ? '光的反射' : '光的直線行進'],
        sol: [c.a === '反射' ? '光照射到平滑光亮的表面，方向改變，這是反射。' : '光直線前進被物體擋住，後面就形成影子，這是直線行進。'],
        err: '看到「光」就選反射，沒有先問「有沒有看到倒影」。'
      };
    },
    usage: function () {
      var cases = [
        { t: '救護車的警示燈與警笛', k: '警示指示' }, { t: '紅綠燈', k: '警示指示' },
        { t: '一氧化碳偵測警報器', k: '警示指示' }, { t: '燈塔', k: '警示指示' },
        { t: '腳踏車車鈴', k: '警示指示' }, { t: '電影院緊急出口燈', k: '警示指示' },
        { t: '鐵路平交道號誌燈', k: '警示指示' }, { t: '路燈', k: '警示指示' },
        { t: '聖誕樹上的燈飾', k: '裝飾娛樂' }, { t: '元宵花燈', k: '裝飾娛樂' },
        { t: '熱氣球光雕音樂會', k: '裝飾娛樂' }, { t: '聲光玩具', k: '裝飾娛樂' },
        { t: '表演舞臺上的閃燈', k: '裝飾娛樂' }, { t: '樂器玩具', k: '裝飾娛樂' }
      ];
      var c = pick(cases);
      return {
        type: 'choice', stem: '「' + c.t + '」的聲光主要用途是什麼？',
        opts: ['警示或指示', '裝飾或娛樂', '取暖', '發電'],
        ans: [c.k === '警示指示' ? '警示或指示' : '裝飾或娛樂'],
        sol: [c.k === '警示指示' ? '它的目的是提醒人注意、讓開或指示方向。' : '它的目的是好看、好玩、增添氣氛。'],
        err: '用「亮不亮、響不響」判斷，而不是用「想告訴你什麼」。'
      };
    },
    conductor: function () {
      var good = ['迴紋針', '十元硬幣', '長尾夾', '鐵尺', '鋁箔紙', '銅線', '湯匙', '鑰匙'];
      var bad = ['橡皮擦', '塑膠尺', '棉繩', '色紙', '蠟筆', '玻璃杯', '木筷', '保麗龍'];
      var isGood = Math.random() < 0.5;
      var it = isGood ? pick(good) : pick(bad);
      var ansW = isGood ? '良導體' : '不良導體';
      return {
        type: 'fill', stem: '把' + it + '接在電路中，燈泡' + (isGood ? '會' : '不會') + '發亮。它是電的 ( 1 )。（填「良導體」或「不良導體」）',
        ans: [ansW], ok: [[ansW, isGood ? '導體' : '絕緣體']],
        sol: [isGood ? it + '是金屬，能導電。' : it + '不是金屬，不能導電。', '能讓燈泡發亮的是良導體，不能的是不良導體。'],
        err: '把「良」和「不良」寫反。'
      };
    },
    openclose: function () {
      var cases = [
        { s: '電線接好了，開關也關上，電池有電。', on: true },
        { s: '開關打開（金屬片移開）。', on: false },
        { s: '其中一條電線鬆脫，沒有碰到燈泡的接點。', on: false },
        { s: '電池沒電了。', on: false },
        { s: '燈泡的燈絲燒斷了。', on: false },
        { s: '電線接在燈泡的螺紋金屬體和接點上，開關關上，電池有電。', on: true },
        { s: '只把電線接到電池的正極，負極空著。', on: false }
      ];
      var c = pick(cases);
      return {
        type: 'choice', stem: c.s + '此時燈泡會不會發亮？',
        opts: ['會發亮，形成通路', '不會發亮，形成斷路', '會亮一下就不亮', '無法判斷'],
        ans: [c.on ? '會發亮，形成通路' : '不會發亮，形成斷路'],
        sol: [c.on ? '電流能走完一整圈，形成通路。' : '電路中間有缺口或沒有電源，電流過不去，形成斷路。'],
        err: '只看「有沒有接線」，沒檢查是不是完整一圈。'
      };
    },
    brightness: function () {
      var b = pick(['1', 's', 'p']), l = pick(['1', 's', 'p']);
      var bf = b === 's' ? 1.5 : 1, lf = l === 's' ? 0.6 : 1;
      var score = bf * lf;
      var lvl = score > 1.15 ? '比較亮' : (score < 0.85 ? '比較暗' : '和平常一樣');
      var bs = b === '1' ? '一個電池' : (b === 's' ? '兩個電池串聯' : '兩個電池並聯');
      var ls = l === '1' ? '一個燈泡' : (l === 's' ? '兩個燈泡串聯' : '兩個燈泡並聯');
      return {
        type: 'fill', stem: bs + '搭配' + ls + '，燈泡的亮度會 ( 1 )。（填「比較亮」「比較暗」或「和平常一樣」）',
        ans: [lvl], ok: [[lvl, lvl === '和平常一樣' ? '不變' : lvl.replace('比較', '較')]],
        sol: [
          '電池' + (b === '1' ? '一個，亮度基準。' : (b === 's' ? '串聯 → 亮度增加。' : '並聯 → 亮度不變。')),
          '燈泡' + (l === '1' ? '一個，亮度基準。' : (l === 's' ? '串聯 → 亮度減弱。' : '並聯 → 亮度不變。')),
          '兩項合起來 → ' + lvl + '。'
        ],
        err: '把「燈泡串聯」記成變亮。燈泡串聯是變暗。'
      };
    },
    failmode: function () {
      var series = Math.random() < 0.5;
      var n = series ? 5 : 8;
      return {
        type: 'choice', stem: '把 ' + n + ' 個燈泡' + (series ? '串聯' : '並聯') + '接在同一個電池上。如果其中 1 個燈泡壞掉了，其他燈泡會怎樣？',
        opts: ['其他燈泡全部不亮', '其他燈泡仍然會亮', '其他燈泡變得更亮', '其他燈泡會閃爍'],
        ans: [series ? '其他燈泡全部不亮' : '其他燈泡仍然會亮'],
        sol: [series ? '串聯的燈泡都在同一條通路上。' : '並聯的每個燈泡有各自的通路。',
          series ? '壞一個就整條通路斷掉，全部不亮。' : '壞一個只是那條通路斷了，其他仍然會亮。'],
        err: '把串聯和並聯的容錯性記反。'
      };
    },
    safety: function () {
      var good = ['不用手拉扯電線，改捏住插頭拔除', '定期檢查電線的塑膠皮有沒有破損', '插頭要插到底、插好', '電線不要捲在一起', '長期不用的電器把電池取出', '廢電池送到指定地點回收'];
      var bad = ['用潮溼的手碰觸插座', '延長線上同時連接許多電器', '把實驗用的電線插進家中插座', '把廢電池丟進一般垃圾桶', '所有用完的電池都拿去充電'];
      var isGood = Math.random() < 0.5;
      var it = isGood ? pick(good) : pick(bad);
      return {
        type: 'choice', stem: '「' + it + '」這是正確的用電（或電池處理）方法嗎？',
        opts: ['正確', '不正確', '要看電池種類', '無法判斷'],
        ans: [isGood ? '正確' : '不正確'],
        sol: [isGood ? '這個做法能避免觸電、走火或環境汙染，是正確的。' : '這個做法有觸電、走火或汙染環境的危險，不正確。'],
        err: '用「方便不方便」判斷，而不是用「安全不安全」。'
      };
    }
  };

  /* ---------- 啟動 ---------- */
  function init() {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false, securityLevel: 'loose', theme: 'base',
        themeVariables: {
          primaryColor: '#eef4ff', primaryBorderColor: '#2b6cb0', primaryTextColor: '#1a2b3c',
          lineColor: '#8fb3d9', secondaryColor: '#f0f7f5', tertiaryColor: '#fff', fontSize: '14px'
        },
        flowchart: { curve: 'basis', htmlLabels: true, padding: 12 }
      });
    }
    touchDay();
    var sb = $('#streak');
    if (sb) sb.textContent = '連續 ' + (S.streak || 0) + ' 天';
    applyHash();
    window.addEventListener('hashchange', applyHash);
    checkAch();
  }
  window.__SCI__ = { cmp: cmp, normText: normText, gen: GEN, state: function () { return S; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
