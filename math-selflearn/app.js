/* 數學 4 上 自主學習系統 — 應用邏輯 */
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
    out = out.replace(/\[\[([0-9]+)\/([0-9]+)\]\]/g, function (_, a, b) {
      return '<span class="fr"><i>' + a + '</i><i>' + b + '</i></span>';
    });
    out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return out;
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function unitById(id) { return UNITS.filter(function (u) { return u.id === id; })[0]; }

  /* ---------- 數值正規化 ---------- */
  function halfWidth(s) {
    return String(s)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); })
      .replace(/[．]/g, '.')
      .replace(/[，]/g, ',')
      .replace(/[＞]/g, '>')
      .replace(/[＜]/g, '<')
      .replace(/[＝]/g, '=')
      .replace(/[／]/g, '/')
      .replace(/[－−–]/g, '-')
      .replace(/[＋]/g, '+')
      .replace(/[×✕✖]/g, '×')
      .replace(/[÷∕]/g, '÷')
      .replace(/[√]/g, '○');
  }
  function stripUnit(s) {
    return s.replace(/(公分|公尺|公里|毫升|公升|公斤|公克|平方公分|平方公尺|立方公分|元|個|人|票|冊|格|條|枝|杯|盒|顆|天|次|度|分|秒|小時|歲|隻|張|片|朵|隻|組|班|層|頁|件|臺|輛|架|包|袋|瓶|罐|盒|倍|以上|以下)/g, '');
  }
  function toNumber(s) {
    var t = halfWidth(s).trim();
    t = stripUnit(t).replace(/,/g, '');
    if (!t) return null;
    var m = t.match(/^(-?\d+)\s*又\s*(\d+)\/(\d+)$/);
    if (m) return (+m[1]) + (+m[2]) / (+m[3]);
    m = t.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if (m) return (+m[1]) + (+m[2]) / (+m[3]);
    m = t.match(/^(-?\d+)\/(\d+)$/);
    if (m) return (+m[1]) / (+m[2]);
    t = t.replace(/\s/g, '');
    if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
    return null;
  }
  function cmp(user, ans) {
    var u = halfWidth(user).trim(), a = halfWidth(ans).trim();
    if (!u) return false;
    if (u === a) return true;
    var nu = toNumber(u), na = toNumber(a);
    if (nu !== null && na !== null) return Math.abs(nu - na) < 1e-9;
    // 全形空白、頓號差異
    var su = u.replace(/[\s、,，]/g, ''), sa = a.replace(/[\s、,，]/g, '');
    if (su === sa) return true;
    return false;
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

    var html = '' +
      '<section class="hero">' +
      '<div class="hero-l">' +
      '<div class="kicker">期中考後 · 第 6～10 單元</div>' +
      '<h2>把「算錯」變成「知道為什麼錯」</h2>' +
      '<p>五個單元、' + totalItems + ' 道校訂題目，加上無限出題與五種互動教具。每題都有分步解析，答錯會告訴你錯在哪一步。</p>' +
      '<div class="hero-btns">' +
      '<button class="btn primary" data-go="u6">從第 6 單元開始</button>' +
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

    html += '<h2 class="sec">五個單元</h2><p class="sub">點進去看概念圖、知識卡、例題，再練題。</p><div class="grid">';
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

    html += '<div class="tipbox"><b>怎麼用最有效</b><p>① 先看概念圖建立骨架 → ② 讀知識卡補細節 → ③ 跟著例題算一次 → ④ 做題，錯了看解析與錯因 → ⑤ 到錯題本重練。</p></div>';

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
    var html = '<div class="panel"><h3>分步例題</h3><p class="sub">先自己算一次，再展開看每一步。</p>';
    u.examples.forEach(function (e, i) {
      html += '<article class="excard" data-ex="' + e.id + '">' +
        '<div class="exhead"><span class="exno">例 ' + (i + 1) + '</span><b>' + esc(e.t) + '</b></div>' +
        '<div class="exq">' + md(e.q) + '</div>' +
        (e.chart ? '<div class="chartbox" data-chart="' + e.id + '"></div>' : '') +
        '<div class="exsteps">' +
        e.steps.map(function (s, k) {
          return '<div class="exstep"><i>' + (k + 1) + '</i><div><b>' + md(s[0]) + '</b><span>' + md(s[1]) + '</span></div></div>';
        }).join('') +
        '</div>' +
        '<div class="exans">答：<b>' + md(e.ans) + '</b></div>' +
        '<div class="exwhy"><b>為什麼</b>' + md(e.why) + '</div>' +
        '<button class="btn sm" data-exdone="' + e.id + '">' + (S.ex[e.id] ? '再看一次 ✓' : '我算過了') + '</button>' +
        '</article>';
    });
    html += '</div>';
    pane.innerHTML = html;
    u.examples.forEach(function (e) {
      if (e.chart) drawChart($('[data-chart="' + e.id + '"]', pane), e.chart);
    });
    $$('[data-exdone]', pane).forEach(function (b) {
      b.addEventListener('click', function () {
        S.ex[b.getAttribute('data-exdone')] = true; save();
        b.textContent = '再看一次 ✓'; toast('已記錄'); checkAch();
      });
    });
  }

  /* ---------- 練習 ---------- */
  var quiz = { mode: 'bank', idx: 0, order: null, item: null, gen: null, checked: false };

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
      var cur = quiz.gen;
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

  function renderQuestion(item, u, slot, next, isGen) {
    quiz.checked = false;
    var html = '<article class="qcard">' +
      '<div class="qstem">' + renderStem(item) + '</div>' +
      (item.chart ? '<div class="chartbox" id="qchart"></div>' : '') +
      '<div class="qbody" id="qbody"></div>' +
      '<div class="qacts"><button class="btn primary" id="check">檢查</button>' +
      '<button class="btn" id="show">看解答</button>' +
      '<button class="btn ghost" id="next">下一題 →</button></div>' +
      '<div class="qfb" id="qfb"></div>' +
      '</article>';
    slot.innerHTML = html;
    if (item.chart) drawChart($('#qchart', slot), item.chart);

    var body = $('#qbody', slot);
    var inputs = [];
    if (item.type === 'choice') {
      body.innerHTML = '<div class="opts">' + item.opts.map(function (o, i) {
        return '<button class="opt" data-opt="' + esc(o) + '"><i>' + 'ABCD'[i] + '</i><span>' + md(o) + '</span></button>';
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
        w.innerHTML = (n > 1 ? '<span class="bn">第 ' + (i + 1) + ' 格</span>' : '') + '<input class="blank" autocomplete="off" spellcheck="false">';
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
      return userArr.map(function (v, i) { return cmp(v, item.ans[i]); });
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
        return '<div class="fbrow">' + mark + '<span class="bn">第 ' + (i + 1) + ' 格</span>' +
          '<span class="clabel">正確</span><b class="cans">' + md(a) + '</b>' + mine + '</div>';
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

  /* ---------- 圖表 ---------- */
  function drawChart(box, cfg) {
    if (!box) return;
    var W = 560, H = 240, padL = 46, padR = 14, padT = 24, padB = 40;
    var vals = cfg.values, labels = cfg.labels;
    var max = Math.max.apply(null, vals);
    var min = cfg.kind === 'line' ? Math.min.apply(null, vals) : 0;
    var top = Math.ceil(max / 5) * 5 || 5;
    var base = 0;
    var iw = (W - padL - padR) / vals.length;
    var y = function (v) { return padT + (H - padT - padB) * (1 - (v - base) / (top - base)); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(cfg.title || '') + '">';
    svg += '<text x="' + padL + '" y="14" class="ct">' + esc(cfg.title || '') + '</text>';
    for (var g = 0; g <= 5; g++) {
      var v = base + (top - base) * g / 5;
      var yy = y(v);
      svg += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" class="gl"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (yy + 4) + '" class="ax" text-anchor="end">' + Math.round(v) + '</text>';
    }
    svg += '<line x1="' + padL + '" y1="' + y(base) + '" x2="' + (W - padR) + '" y2="' + y(base) + '" class="axis"/>';
    if (cfg.kind === 'bar') {
      vals.forEach(function (v, i) {
        var bw = Math.min(52, iw * 0.58);
        var x = padL + iw * i + (iw - bw) / 2;
        svg += '<rect x="' + x + '" y="' + y(v) + '" width="' + bw + '" height="' + (y(base) - y(v)) + '" rx="4" class="cbar"/>';
        svg += '<text x="' + (x + bw / 2) + '" y="' + (y(v) - 5) + '" class="val" text-anchor="middle">' + v + '</text>';
        svg += '<text x="' + (padL + iw * i + iw / 2) + '" y="' + (H - 14) + '" class="ax" text-anchor="middle">' + esc(labels[i]) + '</text>';
      });
    } else {
      var pts = vals.map(function (v, i) { return [padL + iw * i + iw / 2, y(v)]; });
      svg += '<polyline points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '" class="line"/>';
      pts.forEach(function (p, i) {
        svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="dot"/>';
        svg += '<text x="' + p[0] + '" y="' + (p[1] - 9) + '" class="val" text-anchor="middle">' + vals[i] + '</text>';
        svg += '<text x="' + p[0] + '" y="' + (H - 14) + '" class="ax" text-anchor="middle">' + esc(labels[i]) + '</text>';
      });
    }
    svg += '<text x="' + (W - padR) + '" y="14" class="unit" text-anchor="end">' + esc(cfg.unit || '') + '</text>';
    svg += '</svg>';
    box.innerHTML = svg;
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
      if (t.kind === 'tri') toolTri(box);
      if (t.kind === 'numline') toolNumline(box);
      if (t.kind === 'placevalue') toolPlaceValue(box);
      if (t.kind === 'order') toolOrder(box);
      if (t.kind === 'fraction') toolFraction(box);
      if (t.kind === 'chart') toolChart(box);
    });
  }

  function toolTri(box) {
    box.innerHTML = '<div class="trow"><label>角 A <input type="range" id="ta" min="15" max="150" value="60"><b id="tav">60°</b></label>' +
      '<label>角 B <input type="range" id="tb" min="15" max="150" value="60"><b id="tbv">60°</b></label></div>' +
      '<div class="tcanvas" id="tsvg"></div><div class="tinfo" id="tinfo"></div>';
    var A = $('#ta', box), B = $('#tb', box);
    function upd() {
      var a = +A.value, b = +B.value;
      if (a + b > 165) { b = 165 - a; B.value = b; }
      var c = 180 - a - b;
      $('#tav', box).textContent = a + '°';
      $('#tbv', box).textContent = b + '°';
      var ra = a * Math.PI / 180, rb = b * Math.PI / 180;
      var sideC = Math.sin(c * Math.PI / 180);
      var sideB = Math.sin(rb);
      var p1 = [0, 0], p2 = [sideC, 0];
      var p3 = [sideB * Math.cos(ra), sideB * Math.sin(ra)];
      var all = [p1, p2, p3];
      var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
      var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs);
      var miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
      var W = 420, H = 240, pad = 40;
      var sc = Math.min((W - pad * 2) / (maxx - minx || 1), (H - pad * 2) / (maxy - miny || 1));
      var P = all.map(function (p) {
        return [pad + (p[0] - minx) * sc, H - pad - (p[1] - miny) * sc];
      });
      var type = c === 90 || a === 90 || b === 90 ? '直角三角形' : (Math.max(a, b, c) > 90 ? '鈍角三角形' : '銳角三角形');
      var sides = [];
      if (a === b && b === c) type = '正三角形';
      else if (a === b || b === c || a === c) type += '・等腰';
      if (Math.abs(a - 45) < 0.5 && Math.abs(b - 45) < 0.5) type = '等腰直角三角形';
      var cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
      var angs = [a, b, c];
      var labs = P.map(function (p, i) {
        var dx = cx - p[0], dy = cy - p[1];
        var L = Math.sqrt(dx * dx + dy * dy) || 1;
        var tx = p[0] + dx / L * 26, ty = p[1] + dy / L * 26 + 4;
        return '<text x="' + tx + '" y="' + ty + '" class="tang" text-anchor="middle">' + Math.round(angs[i]) + '°</text>';
      }).join('');
      $('#tsvg', box).innerHTML = '<svg viewBox="0 0 420 240"><polygon points="' + P.map(function (p) { return p.join(','); }).join(' ') + '" class="tripoly"/>' +
        P.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="tdot"/><text x="' + p[0] + '" y="' + (p[1] - 8) + '" class="tlab" text-anchor="middle">' + 'ABC'[i] + '</text>'; }).join('') +
        labs + '</svg>';
      $('#tinfo', box).innerHTML = '<div class="tres"><span>' + a + '° ＋ ' + b + '° ＋ ' + Math.round(c) + '° ＝ 180°</span><b>' + type + '</b></div>';
    }
    A.addEventListener('input', upd); B.addEventListener('input', upd); upd();
  }

  function toolNumline(box) {
    box.innerHTML = '<div class="trow"><label>位置 <input type="range" id="nl" min="0" max="100" value="37"><b id="nlv">0.37</b></label></div>' +
      '<div id="nlsvg"></div><div class="tinfo" id="nlinfo"></div>';
    var r = $('#nl', box);
    function upd() {
      var v = +r.value;
      $('#nlv', box).textContent = (v / 100).toFixed(2);
      var W = 560, H = 90, pad = 24, y = 50;
      var x = pad + (W - pad * 2) * v / 100;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '"><line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" class="nline"/>';
      for (var i = 0; i <= 100; i++) {
        var xx = pad + (W - pad * 2) * i / 100;
        if (i % 10 === 0) {
          s += '<line x1="' + xx + '" y1="' + (y - 10) + '" x2="' + xx + '" y2="' + (y + 10) + '" class="ntick"/>';
          s += '<text x="' + xx + '" y="' + (y + 28) + '" class="ax" text-anchor="middle">' + (i / 100).toFixed(1) + '</text>';
        } else if (i % 5 === 0) {
          s += '<line x1="' + xx + '" y1="' + (y - 5) + '" x2="' + xx + '" y2="' + (y + 5) + '" class="ntick2"/>';
        }
      }
      s += '<circle cx="' + x + '" cy="' + y + '" r="7" class="ndot"/><text x="' + x + '" y="' + (y - 18) + '" class="val" text-anchor="middle">' + (v / 100).toFixed(2) + '</text></svg>';
      $('#nlsvg', box).innerHTML = s;
      var n = v;
      $('#nlinfo', box).innerHTML = '<div class="tres"><span>' + (v / 100).toFixed(2) + ' ＝ ' + n + ' 個 0.01 ＝ ' + n + '/100</span></div>';
    }
    r.addEventListener('input', upd); upd();
  }

  function toolPlaceValue(box) {
    box.innerHTML = '<div class="trow"><label>輸入一個數 <input id="pvi" class="tin" value="35.27" autocomplete="off"></label></div><div id="pvo"></div>';
    var inp = $('#pvi', box);
    function upd() {
      var raw = halfWidth(inp.value).replace(/[^\d.]/g, '');
      var parts = raw.split('.');
      var ip = (parts[0] || '0').replace(/^0+(?=\d)/, '');
      var dp = (parts[1] || '');
      var names = ['千位', '百位', '十位', '個位'];
      var cols = [];
      var padded = ip.padStart(4, ' ').split('');
      names.forEach(function (nm, i) {
        if (padded[i] !== ' ') cols.push([nm, padded[i]]);
      });
      var dn = ['十分位', '百分位', '千分位'];
      for (var i = 0; i < dp.length && i < 3; i++) cols.push([dn[i], dp[i]]);
      var html = '<table class="pvtable"><tr>' + cols.map(function (c) { return '<th>' + c[0] + '</th>'; }).join('') + '</tr>' +
        '<tr>' + cols.map(function (c) { return '<td>' + c[1] + '</td>'; }).join('') + '</tr></table>';
      var val = cols.map(function (c) { return c[1] + ' 個' + c[0]; }).join('、');
      html += '<div class="tres"><span>' + esc(raw || '0') + ' 是由 ' + esc(val) + ' 合起來的</span></div>';
      $('#pvo', box).innerHTML = html;
    }
    inp.addEventListener('input', upd); upd();
  }

  function toolOrder(box) {
    box.innerHTML = '<div class="trow"><label>輸入算式 <input id="oei" class="tin wide" value="(50＋8)×3" autocomplete="off"></label>' +
      '<button class="btn sm primary" id="oeb">拆解</button></div><div id="oeo"></div>' +
      '<div class="tchips">' + ['50＋8×3', '(50＋8)×3', '96÷8×3', '120÷(4×5)', '90－35＋25'].map(function (x) { return '<button class="chipb" data-expr="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
    function run() {
      var src = halfWidth($('#oei', box).value).replace(/\s/g, '');
      var out = [];
      try {
        var v = reduceExpr(src, out);
        $('#oeo', box).innerHTML = '<div class="steps">' + out.map(function (s, i) {
          return '<div class="solrow"><i>' + (i + 1) + '</i><span>' + esc(s) + '</span></div>';
        }).join('') + '</div><div class="tres"><b>答案 ＝ ' + v + '</b></div>';
      } catch (e) {
        $('#oeo', box).innerHTML = '<div class="warn">算式看不懂，請用 ＋ － × ÷ 和括號</div>';
      }
    }
    $('#oeb', box).addEventListener('click', run);
    $$('.chipb', box).forEach(function (b) {
      b.addEventListener('click', function () { $('#oei', box).value = b.getAttribute('data-expr'); run(); });
    });
    run();
  }

  // 簡易四則運算：回傳值，並把每一步寫進 log
  function reduceExpr(s, log) {
    s = s.replace(/＋/g, '+').replace(/－/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    function findParen(str) {
      var depth = 0, start = -1;
      for (var i = 0; i < str.length; i++) {
        if (str[i] === '(') { if (depth === 0) start = i; depth++; }
        else if (str[i] === ')') { depth--; if (depth === 0) return [start, i]; }
      }
      return null;
    }
    var p = findParen(s);
    if (p) {
      var inner = s.slice(p[0] + 1, p[1]);
      var sub = [];
      var v = reduceExpr(inner, sub);
      if (sub.length > 1) { sub.forEach(function (x) { log.push(x); }); }
      log.push('先算括號 ' + inner + ' ＝ ' + v);
      var ns = s.slice(0, p[0]) + v + s.slice(p[1] + 1);
      return reduceExpr(ns, log);
    }
    // 先乘除
    var m = s.match(/(\d+(?:\.\d+)?)([*/])(\d+(?:\.\d+)?)/);
    if (m) {
      var a = parseFloat(m[1]), b = parseFloat(m[3]);
      var r = m[2] === '*' ? a * b : a / b;
      r = Math.round(r * 1e6) / 1e6;
      log.push(m[1] + (m[2] === '*' ? '×' : '÷') + m[3] + ' ＝ ' + r);
      return reduceExpr(s.replace(m[0], String(r)), log);
    }
    // 加減由左而右
    var m2 = s.match(/^(-?\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)/);
    if (m2 && m2.index === 0) {
      var a2 = parseFloat(m2[1]), b2 = parseFloat(m2[3]);
      var r2 = m2[2] === '+' ? a2 + b2 : a2 - b2;
      r2 = Math.round(r2 * 1e6) / 1e6;
      log.push(m2[1] + m2[2] + m2[3] + ' ＝ ' + r2);
      return reduceExpr(String(r2) + s.slice(m2[0].length), log);
    }
    var only = s.match(/^-?\d+(\.\d+)?$/);
    if (only) return parseFloat(s);
    throw new Error('bad');
  }

  function toolFraction(box) {
    box.innerHTML = '<div class="trow"><label>分子 <input type="range" id="fn" min="0" max="16" value="3"><b id="fnv">3</b></label>' +
      '<label>分母 <input type="range" id="fd" min="1" max="12" value="4"><b id="fdv">4</b></label></div>' +
      '<div id="fsvg"></div><div class="tinfo" id="finfo"></div>';
    var N = $('#fn', box), Dd = $('#fd', box);
    function upd() {
      var n = +N.value, d = +Dd.value;
      $('#fnv', box).textContent = n; $('#fdv', box).textContent = d;
      var W = 520, H = 90, pad = 20, bw = W - pad * 2;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
      for (var i = 0; i < d; i++) {
        var x = pad + bw * i / d;
        s += '<rect x="' + x + '" y="20" width="' + (bw / d) + '" height="50" class="fcell' + (i < n ? ' on' : '') + '"/>';
      }
      s += '</svg>';
      $('#fsvg', box).innerHTML = s;
      var kind = n < d ? '真分數' : (n === d ? '假分數（等於 1）' : '假分數');
      var mixed = '';
      if (n > d) {
        var q = Math.floor(n / d), r = n % d;
        mixed = q + (r ? '又' + r + '/' + d : '');
      } else if (n === d) mixed = '1';
      $('#finfo', box).innerHTML = '<div class="tres"><span>' + n + '/' + d + ' ＝ ' + (n / d).toFixed(2) + '</span><b>' + kind + '</b>' +
        (mixed ? '<span>帶分數：' + mixed + '</span>' : '') + '</div>';
    }
    N.addEventListener('input', upd); Dd.addEventListener('input', upd); upd();
  }

  function toolChart(box) {
    box.innerHTML = '<div class="trow"><label class="col">資料（每行「項目,數值」）<textarea id="cd" class="tarea">蘋果,12\n香蕉,8\n橘子,15\n葡萄,6</textarea></label></div>' +
      '<div class="trow"><button class="btn sm primary" id="cdb">畫長條圖</button><button class="btn sm" id="cdl">畫折線圖</button></div><div id="cdo"></div>';
    function run(kind) {
      var lines = $('#cd', box).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      var labels = [], values = [];
      lines.forEach(function (l) {
        var p = l.split(/[,，\t]/);
        if (p.length >= 2 && !isNaN(parseFloat(p[1]))) { labels.push(p[0]); values.push(parseFloat(p[1])); }
      });
      if (!labels.length) { $('#cdo', box).innerHTML = '<div class="warn">格式不對，請用「項目,數值」</div>'; return; }
      var d = document.createElement('div');
      drawChart(d, { kind: kind, title: kind === 'bar' ? '長條圖' : '折線圖', labels: labels, values: values, unit: '' });
      $('#cdo', box).innerHTML = '';
      $('#cdo', box).appendChild(d);
    }
    $('#cdb', box).addEventListener('click', function () { run('bar'); });
    $('#cdl', box).addEventListener('click', function () { run('line'); });
    run('bar');
  }

  /* ---------- 錯題本 ---------- */
  function renderWrong() {
    var ids = Object.keys(S.wrong);
    var html = '<h2 class="sec">錯題本</h2>';
    if (!ids.length) {
      html += '<div class="empty"><b>目前沒有錯題</b><p>去練習，答錯的題目會自動收進來。</p><button class="btn primary" data-go="u6">去練習</button></div>';
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
        '<div class="wans">答案：<b>' + md(found.it.ans.join('、')) + '</b></div>' +
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
    { id: 'a3', n: '百題挑戰', d: '累積答對 100 題', f: function () { return okCount() >= 100; } },
    { id: 'a4', n: '概念通', d: '讀完 10 張知識卡', f: function () { return Object.keys(S.read).length >= 10; } },
    { id: 'a5', n: '單元掃蕩', d: '把任一個單元的題目全部做過', f: function () { return UNITS.some(function (u) { return u.items.every(function (i) { return S.done[i.id]; }); }); } },
    { id: 'a6', n: '滿分單元', d: '任一個單元全部答對', f: function () { return UNITS.some(function (u) { return u.items.every(function (i) { return S.done[i.id] && S.done[i.id].ok; }); }); } },
    { id: 'a7', n: '連三day', d: '連續 3 天回來學習', f: function () { return (S.streak || 0) >= 3; } },
    { id: 'a8', n: '無限練習', d: '用生成器做 30 題', f: function () { return S.gen.n >= 30; } },
    { id: 'a9', n: '錯題清零', d: '錯題本清空（至少做過 20 題）', f: function () { return Object.keys(S.done).length >= 20 && Object.keys(S.wrong).length === 0; } },
    { id: 'a10', n: '全單元制霸', d: '五個單元全部答對', f: function () { return UNITS.every(function (u) { return u.items.every(function (i) { return S.done[i.id] && S.done[i.id].ok; }); }); } }
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
  var R = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function simp(n, d) {
    var g = gcd(Math.abs(n), Math.abs(d)) || 1;
    return [n / g, d / g];
  }
  function fracStr(n, d) {
    if (n === 0) return '0';
    if (d === 1) return String(n);
    var s = simp(n, d);
    return s[0] + '/' + s[1];
  }
  function mixedStr(n, d) {
    if (n < d) return fracStr(n, d);
    var q = Math.floor(n / d), r = n % d;
    if (!r) return String(q);
    var s = simp(r, d);
    return q + ' ' + s[0] + '/' + s[1];
  }
  function fmt(x) {
    var v = Math.round(x * 100) / 100;
    return String(v);
  }

  var GEN = {
    tri3: function () {
      var a = R(2, 16) * 5, b = R(2, 16) * 5;
      if (a + b >= 175) b = 175 - a;
      var c = 180 - a - b;
      return {
        type: 'fill', stem: '一個三角形的兩個角分別是 ' + a + '° 和 ' + b + '°，第三個角是 ( 1 ) 度。',
        ans: [String(c)], sol: [a + '＋' + b + '＝' + (a + b), '180－' + (a + b) + '＝' + c],
        err: '忘記用 180° 去減，或只減了一個角。'
      };
    },
    isosceles: function () {
      if (Math.random() < 0.5) {
        var apex = R(2, 14) * 10;
        var base = (180 - apex) / 2;
        return {
          type: 'fill', stem: '等腰三角形的頂角是 ' + apex + '°，一個底角是 ( 1 ) 度。',
          ans: [fmt(base)], sol: ['180－' + apex + '＝' + (180 - apex), (180 - apex) + '÷2＝' + fmt(base)],
          err: '忘記兩個底角相等，沒有除以 2。'
        };
      }
      var b2 = R(3, 8) * 10;
      var ap = 180 - b2 * 2;
      return {
        type: 'fill', stem: '等腰三角形的底角是 ' + b2 + '°，頂角是 ( 1 ) 度。',
        ans: [String(ap)], sol: [b2 + '×2＝' + (b2 * 2), '180－' + (b2 * 2) + '＝' + ap],
        err: '只減一次底角，忘記底角有兩個。'
      };
    },
    classify: function () {
      var target = pick(['銳角三角形', '直角三角形', '鈍角三角形']);
      var angs;
      if (target === '直角三角形') {
        var b = R(3, 8) * 10;
        angs = [90, b, 90 - b];
      } else if (target === '鈍角三角形') {
        var a2 = R(19, 31) * 5;
        var b2 = R(2, 6) * 5;
        while (a2 + b2 > 168) b2 -= 5;
        angs = [a2, b2, 180 - a2 - b2];
      } else {
        var a3 = R(5, 8) * 10, b3 = R(5, 8) * 10;
        var c3 = 180 - a3 - b3;
        while (c3 >= 90 || c3 <= 20) { a3 = R(5, 8) * 10; b3 = R(4, 7) * 10; c3 = 180 - a3 - b3; }
        angs = [a3, b3, c3];
      }
      angs.sort(function (x, y) { return x - y; });
      var name = angs[2] === 90 ? '直角三角形' : (angs[2] > 90 ? '鈍角三角形' : '銳角三角形');
      return {
        type: 'choice', stem: '一個三角形的三個角是 ' + angs[0] + '°、' + angs[1] + '°、' + angs[2] + '°，它是什麼三角形？',
        opts: ['銳角三角形', '直角三角形', '鈍角三角形', '正三角形'], ans: [name],
        sol: ['三個角相加：' + angs[0] + '＋' + angs[1] + '＋' + angs[2] + '＝180°', '最大的角是 ' + angs[2] + '°', angs[2] === 90 ? '等於 90°，是直角三角形' : (angs[2] > 90 ? '大於 90°，是鈍角三角形' : '小於 90°，是銳角三角形')],
        err: '只看其中一個角，沒有先找最大的角。'
      };
    },
    perimeter: function () {
      if (Math.random() < 0.5) {
        var s = R(3, 15);
        return {
          type: 'fill', stem: '正三角形的邊長是 ' + s + ' 公分，周長是 ( 1 ) 公分。',
          ans: [String(s * 3)], sol: [s + '×3＝' + (s * 3)], err: '只乘 2。'
        };
      }
      var w = R(4, 12), b = R(3, 12);
      return {
        type: 'fill', stem: '等腰三角形的兩條腰各是 ' + w + ' 公分，底邊是 ' + b + ' 公分，周長是 ( 1 ) 公分。',
        ans: [String(w * 2 + b)], sol: [w + '＋' + w + '＋' + b + '＝' + (w * 2 + b)], err: '漏掉一條腰。'
      };
    },
    decplace: function () {
      var n = R(11, 99) / 100;
      if (Math.random() < 0.5) {
        return {
          type: 'fill', stem: n.toFixed(2) + ' 是 ( 1 ) 個 0.01 合起來的。',
          ans: [String(Math.round(n * 100))], sol: ['去掉小數點就是答案', Math.round(n * 100) + ' 個'],
          err: '把小數點位數算錯。'
        };
      }
      var m = R(11, 999);
      return {
        type: 'fill', stem: m + ' 個 0.01 合起來是 ( 1 )。',
        ans: [(m / 100).toFixed(2)], sol: ['100 個 0.01 是 1', (m / 100).toFixed(2)],
        err: '小數點位置放錯。'
      };
    },
    deccmp: function () {
      var a = R(100, 999) / 100, b = R(100, 999) / 100;
      while (a === b) b = R(100, 999) / 100;
      var big = Math.max(a, b), small = Math.min(a, b);
      return {
        type: 'choice', stem: '下面哪一個數比較大？', opts: [big.toFixed(2), small.toFixed(2), '一樣大', '不能比'],
        ans: [big.toFixed(2)], sol: ['先比整數部分，再比十分位、百分位', big.toFixed(2) + ' 比較大'],
        err: '以為小數位數多的比較大。'
      };
    },
    decadd: function () {
      var a = R(100, 999) / 100, b = R(10, 99) / 10;
      if (Math.random() < 0.5) {
        var s = Math.round((a + b) * 100) / 100;
        return {
          type: 'fill', stem: a.toFixed(2) + ' ＋ ' + b.toFixed(1) + ' ＝ ( 1 )',
          ans: [fmt(s)], sol: ['小數點對齊相加', a.toFixed(2) + '＋' + b.toFixed(2) + '＝' + fmt(s)],
          err: '小數點沒對齊。'
        };
      }
      var big = Math.max(a, b) + 1, small = Math.min(a, b);
      var d = Math.round((big - small) * 100) / 100;
      return {
        type: 'fill', stem: fmt(big) + ' － ' + small.toFixed(2) + ' ＝ ( 1 )',
        ans: [fmt(d)], sol: ['小數點對齊，不夠減要借位', fmt(d)],
        err: '借位時算錯。'
      };
    },
    declen: function () {
      if (Math.random() < 0.5) {
        var cm = R(11, 99) * 5;
        return {
          type: 'fill', stem: cm + ' 公分 ＝ ( 1 ) 公尺。',
          ans: [fmt(cm / 100)], sol: [cm + '÷100＝' + fmt(cm / 100)], err: '除以 10 而不是 100。'
        };
      }
      var m = R(1, 9), c2 = R(1, 99);
      return {
        type: 'fill', stem: m + ' 公尺 ' + c2 + ' 公分 ＝ ( 1 ) 公尺。',
        ans: [fmt(m + c2 / 100)], sol: [c2 + ' 公分＝' + fmt(c2 / 100) + ' 公尺', m + '＋' + fmt(c2 / 100) + '＝' + fmt(m + c2 / 100)],
        err: '把公分直接接在整數後面。'
      };
    },
    order2: function () {
      var a = R(10, 99), b = R(2, 9), c = R(2, 9);
      var forms = [
        { s: a + ' ＋ ' + b + ' × ' + c, v: a + b * c, sol: [b + '×' + c + '＝' + b * c, a + '＋' + b * c + '＝' + (a + b * c)] },
        { s: a + ' － ' + b + ' × ' + c, v: a - b * c, sol: [b + '×' + c + '＝' + b * c, a + '－' + b * c + '＝' + (a - b * c)] },
        { s: b + ' × ' + c + ' ＋ ' + a, v: b * c + a, sol: [b + '×' + c + '＝' + b * c, b * c + '＋' + a + '＝' + (b * c + a)] }
      ];
      var f = pick(forms);
      if (f.v < 0) f = forms[0];
      return { type: 'fill', stem: f.s + ' ＝ ( 1 )', ans: [String(f.v)], sol: f.sol, err: '從左算到右，沒有先乘除。' };
    },
    order3: function () {
      var a = R(2, 9), b = R(2, 9), c = R(2, 9);
      var v = (a + b) * c;
      return {
        type: 'fill', stem: '(' + a + ' ＋ ' + b + ') × ' + c + ' ＝ ( 1 )',
        ans: [String(v)], sol: [a + '＋' + b + '＝' + (a + b), (a + b) + '×' + c + '＝' + v],
        err: '漏看括號，先乘了 c。'
      };
    },
    bracket: function () {
      var a = R(10, 40), b = R(2, 9), c = R(2, 9);
      var v1 = (a + b) * c, v2 = a + b * c;
      return {
        type: 'fill', stem: '(' + a + ' ＋ ' + b + ') × ' + c + ' ＝ ( 1 )，' + a + ' ＋ ' + b + ' × ' + c + ' ＝ ( 2 )',
        ans: [String(v1), String(v2)],
        sol: ['有括號：' + (a + b) + '×' + c + '＝' + v1, '沒括號：' + b + '×' + c + '＝' + b * c + '，' + a + '＋' + b * c + '＝' + v2],
        err: '兩題算法搞混。'
      };
    },
    assoc: function () {
      var k = R(2, 9);
      var a = pick([25, 125]);
      var b = a === 25 ? 4 : 8;
      var v = a * b * k;
      return {
        type: 'fill', stem: '(' + a + ' × ' + b + ') × ' + k + ' ＝ ( 1 )',
        ans: [String(v)], sol: [a + '×' + b + '＝' + (a * b), (a * b) + '×' + k + '＝' + v],
        err: '沒有先湊成整百整千。'
      };
    },
    fracswap: function () {
      var d = R(3, 9), q = R(1, 4), r = R(1, d - 1);
      if (Math.random() < 0.5) {
        var n = q * d + r;
        return {
          type: 'fill', stem: n + '/' + d + ' 換成帶分數是 ( 1 )。',
          ans: [q + ' ' + r + '/' + d], sol: [n + '÷' + d + '＝' + q + ' 餘 ' + r, q + '又' + r + '/' + d],
          err: '商和餘數寫反。'
        };
      }
      return {
        type: 'fill', stem: q + '又' + r + '/' + d + ' 換成假分數是 ( 1 )。',
        ans: [(q * d + r) + '/' + d], sol: [q + '×' + d + '＋' + r + '＝' + (q * d + r), (q * d + r) + '/' + d],
        err: '只把整數和分子相加。'
      };
    },
    fraccmp: function () {
      var d = R(4, 9), a = R(1, d - 1), b = R(1, d - 1);
      while (a === b) b = R(1, d - 1);
      var big = Math.max(a, b), small = Math.min(a, b);
      return {
        type: 'fill', stem: '比較大小：' + small + '/' + d + ' ( 1 ) ' + big + '/' + d + '（填 ＞、＜ 或 ＝）',
        ans: ['<'], sol: ['同分母，比分子：' + small + '＜' + big, small + '/' + d + '＜' + big + '/' + d],
        err: '方向寫反。'
      };
    },
    fracadd: function () {
      var d = R(4, 9), a = R(1, d - 1), b = R(1, d - 1);
      if (Math.random() < 0.5) {
        var n = a + b;
        return {
          type: 'fill', stem: a + '/' + d + ' ＋ ' + b + '/' + d + ' ＝ ( 1 )',
          ans: [mixedStr(n, d)], sol: ['分母不變，分子相加：' + a + '＋' + b + '＝' + n, n + '/' + d + (n > d ? '＝' + mixedStr(n, d) : '')],
          err: '把分母也相加。'
        };
      }
      while (a === b) b = R(1, d - 1);
      var big = Math.max(a, b), small = Math.min(a, b);
      var r = big - small;
      return {
        type: 'fill', stem: big + '/' + d + ' － ' + small + '/' + d + ' ＝ ( 1 )',
        ans: [fracStr(r, d)], sol: ['分子相減：' + big + '－' + small + '＝' + r, r + '/' + d + '＝' + fracStr(r, d)],
        err: '忘記化簡。'
      };
    },
    fracmul: function () {
      var d = R(3, 9), n = R(1, d - 1), k = R(2, 5);
      return {
        type: 'fill', stem: n + '/' + d + ' 的 ' + k + ' 倍是 ( 1 )。',
        ans: [mixedStr(n * k, d)], sol: ['分子乘整數：' + n + '×' + k + '＝' + (n * k), (n * k) + '/' + d + '＝' + mixedStr(n * k, d)],
        err: '分母也乘上去。'
      };
    },
    chartread: function () {
      var labels = ['蘋果', '香蕉', '橘子', '葡萄', '西瓜'];
      var vals = [];
      for (var i = 0; i < 5; i++) vals.push(R(4, 20));
      var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
      var mi = vals.indexOf(max), ni = vals.indexOf(min);
      var q = pick(['max', 'diff', 'sum']);
      var chart = { kind: 'bar', title: '最喜歡的水果（票）', labels: labels, values: vals, unit: '票' };
      if (q === 'max') return { type: 'chart', chart: chart, stem: '看圖回答：票數最多的是哪一種水果？', ans: [labels[mi]], sol: ['最高的長條是 ' + labels[mi] + '，' + max + ' 票'], err: '只看第一條。' };
      if (q === 'diff') return { type: 'chart', chart: chart, stem: '看圖回答：最多和最少的票數相差 ( 1 ) 票。', ans: [String(max - min)], sol: [max + '－' + min + '＝' + (max - min)], err: '減錯順序。' };
      return { type: 'chart', chart: chart, stem: '看圖回答：五種水果的票數總共是 ( 1 ) 票。', ans: [String(vals.reduce(function (a, b) { return a + b; }, 0))], sol: [vals.join('＋') + '＝' + vals.reduce(function (a, b) { return a + b; }, 0)], err: '漏加一項。' };
    },
    lineread: function () {
      var labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
      var vals = [];
      for (var i = 0; i < 6; i++) vals.push(R(5, 30));
      var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
      var mi = vals.indexOf(max), ni = vals.indexOf(min);
      var chart = { kind: 'line', title: '每月數量', labels: labels, values: vals, unit: '' };
      if (Math.random() < 0.5) {
        return { type: 'chart', chart: chart, stem: '看折線圖，數量最多的是 ( 1 )，有 ( 2 ) 個。', ans: [labels[mi], String(max)], sol: ['最高點在 ' + labels[mi], '數值是 ' + max], err: '讀錯點。' };
      }
      return { type: 'chart', chart: chart, stem: '看折線圖，數量最少的是 ( 1 )，有 ( 2 ) 個。', ans: [labels[ni], String(min)], sol: ['最低點在 ' + labels[ni], '數值是 ' + min], err: '把最高當最低。' };
    },
    scale: function () {
      var per = pick([2, 5, 10, 20]);
      var n = R(2, 8);
      return {
        type: 'fill', stem: '長條圖縱軸每格代表 ' + per + ' 人，某長條佔 ' + n + ' 格，代表 ( 1 ) 人。',
        ans: [String(per * n)], sol: [per + '×' + n + '＝' + (per * n)], err: '只寫格數。'
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
  window.__MATH__ = { cmp: cmp, toNumber: toNumber, gen: GEN, state: function () { return S; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
