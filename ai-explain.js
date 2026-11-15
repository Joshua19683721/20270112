/* AI 解釋按鈕 — DeepSeek 金鑰只存在使用者瀏覽器 */
(function () {
  'use strict';

  var API_URL = 'https://api.deepseek.com/chat/completions';
  var KEY_LS = 'deepseek_api_key_v1';
  var MODEL_LS = 'deepseek_model_v1';
  var CACHE_LS = 'deepseek_explain_cache_v1';
  var CACHE_MAX = 300;
  var DEFAULT_MODEL = 'deepseek-flash';
  var MAX_CONTEXT = 4500;
  var busy = false;
  var lastText = '';
  var abortCtl = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function getKey() {
    try { return (localStorage.getItem(KEY_LS) || '').trim(); } catch (e) { return ''; }
  }
  function setKey(v) {
    try { localStorage.setItem(KEY_LS, v); } catch (e) { }
  }
  function delKey() {
    try { localStorage.removeItem(KEY_LS); } catch (e) { }
  }
  function getModel() {
    try {
      var v = localStorage.getItem(MODEL_LS) || '';
      if (!v || /^(deepseek-chat|deepseek-reasoner|deepseek-v4-flash)/.test(v)) return DEFAULT_MODEL;
      return v;
    } catch (e) { return DEFAULT_MODEL; }
  }
  function setModel(v) {
    try { localStorage.setItem(MODEL_LS, v); } catch (e) { }
  }

  /* ---------- 解釋快取（同一題第二次先顯示上次結果） ---------- */
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_LS);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  function writeCache(o) {
    try { localStorage.setItem(CACHE_LS, JSON.stringify(o)); return; } catch (e) { }
    var keys = Object.keys(o).sort(function (a, b) { return (o[a].ts || 0) - (o[b].ts || 0); });
    keys.slice(0, Math.ceil(keys.length / 2)).forEach(function (k) { delete o[k]; });
    try { localStorage.setItem(CACHE_LS, JSON.stringify(o)); } catch (e2) { }
  }
  function cacheCount() { return Object.keys(readCache()).length; }
  function cacheClear() {
    try { localStorage.removeItem(CACHE_LS); } catch (e) { }
  }
  function cyrb53(str, seed) {
    var h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function normalizeContext(t) {
    return String(t)
      .replace(/第\s*\d+\s*\/\s*\d+\s*題/g, '')
      .replace(/隨機排序|課本題庫|無限出題|看解答|下一題\s*→|上一題|檢查|送出答案/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  function cacheKey(context) {
    return cyrb53((document.title || '') + '\n' + getModel() + '\n' + normalizeContext(context));
  }
  function cacheGet(key) {
    var c = readCache();
    var hit = c[key];
    return hit && hit.text ? hit : null;
  }
  function cacheSet(key, text) {
    var c = readCache();
    c[key] = { text: text, ts: Date.now(), model: getModel(), title: (document.title || '').slice(0, 100) };
    var keys = Object.keys(c);
    if (keys.length > CACHE_MAX) {
      keys.sort(function (a, b) { return (c[a].ts || 0) - (c[b].ts || 0); });
      keys.slice(0, keys.length - CACHE_MAX).forEach(function (k) { delete c[k]; });
    }
    writeCache(c);
  }
  function fmtTime(ts) {
    var d = new Date(ts || Date.now());
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function hash32(s) {
    var x = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      x ^= s.charCodeAt(i);
      x = Math.imul(x, 16777619);
      x >>>= 0;
    }
    return ('00000000' + x.toString(16)).slice(-8);
  }
  var LOCK_HASH = '46294705'; /* 管理密碼的雜湊，不直接寫出密碼 */

  function css() {
    if ($('aix-style')) return;
    var st = document.createElement('style');
    st.id = 'aix-style';
    st.textContent = [
      '.aix-bar{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:90;display:flex;align-items:center;gap:8px;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",system-ui,sans-serif}',
      '.aix-main,.aix-gear{border:0;border-radius:999px;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(15,35,60,.24);display:flex;align-items:center;justify-content:center;transition:transform .12s ease,filter .12s ease}',
      '.aix-main{height:44px;padding:0 22px;background:linear-gradient(135deg,#2b5fa8,#0f8b7e);color:#fff;font-size:15px;font-weight:800;letter-spacing:.02em}',
      '.aix-gear{width:44px;height:44px;background:#fff;color:#2b5fa8;font-size:19px;border:1px solid #dbe5f1}',
      '.aix-main:hover,.aix-gear:hover{transform:translateY(-2px);filter:brightness(1.03)}',
      '.aix-main:active,.aix-gear:active{transform:translateY(0)}',
      '.aix-overlay{position:fixed;inset:0;z-index:2147483645;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,22,38,.55);font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",system-ui,sans-serif;color:#17263a}',
      '#aix-settings-overlay{z-index:2147483646}',
      '#aix-lock-overlay{z-index:2147483647}',
      '.aix-overlay[hidden]{display:none!important}',
      '.aix-card{width:min(100%,560px);max-height:min(86vh,760px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.32);padding:22px 22px 18px;box-sizing:border-box}',
      '.aix-card.aix-wide{width:min(100%,720px);display:flex;flex-direction:column}',
      '.aix-card.aix-lock{width:min(100%,430px)}',
      '.aix-card.aix-wide .aix-out{flex:1 1 auto;min-height:110px;overflow:auto;padding-right:4px}',
      '.aix-card.aix-wide .aix-actions,.aix-card.aix-wide .aix-foot,.aix-card.aix-wide .aix-head,.aix-card.aix-wide .aix-ctx{flex:none}',
      '.aix-head{display:flex;align-items:flex-start;gap:10px;margin:0 0 6px}',
      '.aix-head h2{margin:0;font-size:20px;line-height:1.35;flex:1}',
      '.aix-sub{margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.7}',
      '.aix-close{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:20px;line-height:1;cursor:pointer}',
      '.aix-label{display:block;font-size:14px;font-weight:800;margin:14px 0 7px}',
      '.aix-keyrow{display:flex;gap:8px}',
      '.aix-input,.aix-select{width:100%;box-sizing:border-box;height:46px;border:1px solid #cbd8e6;border-radius:11px;padding:0 13px;background:#f8fafc;color:#17263a;font-size:15px;font-family:inherit;outline:none}',
      '.aix-input:focus,.aix-select:focus{border-color:#2b5fa8;box-shadow:0 0 0 3px rgba(43,95,168,.14)}',
      '.aix-eye{flex:none;height:46px;padding:0 13px;border:1px solid #cbd8e6;border-radius:11px;background:#fff;color:#2b5fa8;font-weight:800;cursor:pointer}',
      '.aix-hint{margin:8px 0 0;color:#64748b;font-size:12px;line-height:1.7}',
      '.aix-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
      '.aix-btn{height:42px;padding:0 16px;border:1px solid #d5e0ee;border-radius:11px;background:#fff;color:#274b73;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit}',
      '.aix-btn.primary{background:#2b5fa8;border-color:#2b5fa8;color:#fff}',
      '.aix-btn.danger{color:#b42318;border-color:#f3c7c1}',
      '.aix-btn:disabled{opacity:.55;cursor:wait}',
      '.aix-status{margin-top:10px;font-size:13px;line-height:1.6;min-height:20px}',
      '.aix-status.ok{color:#0f7a45}.aix-status.bad{color:#b42318}.aix-status.info{color:#475569}',
      '.aix-foot{margin:14px 0 0;color:#7c8da3;font-size:11px;line-height:1.7}',
      '.aix-out{min-height:120px;font-size:15px;line-height:1.85;white-space:pre-wrap;word-break:break-word}',
      '.aix-out b.aix-h{display:block;margin:12px 0 4px;color:#123a63;font-size:16px}',
      '.aix-out code{background:#eef4fb;border-radius:5px;padding:1px 5px;font-size:13px}',
      '.aix-loading{display:flex;align-items:center;gap:12px;color:#475569;font-size:14px;padding:18px 0}',
      '.aix-spin{width:22px;height:22px;border:3px solid #dbe7f5;border-top-color:#2b5fa8;border-radius:50%;animation:aixspin .8s linear infinite}',
      '@keyframes aixspin{to{transform:rotate(360deg)}}',
      '.aix-err{background:#fff5f4;border:1px solid #f6c9c3;color:#9c2a20;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.7;white-space:pre-wrap}',
      '.aix-cachebar{display:inline-block;font-size:11px;color:#0f7a45;background:#ecfdf3;border:1px solid #b7ebc9;border-radius:999px;padding:3px 10px;margin:0 0 9px}',
      '.aix-ctx{display:inline-block;align-self:flex-start;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#64748b;background:#f1f5f9;border-radius:999px;padding:3px 9px;margin-top:4px}',
      '.aix-copy{color:#0f7a45}',
      '@media(max-width:520px){.aix-main{font-size:14px;padding:0 16px;height:42px}.aix-gear{width:42px;height:42px}.aix-card{padding:18px 16px 16px;max-height:90vh}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function ui() {
    if ($('aix-bar')) return;
    css();
    var root = document.createElement('div');
    root.innerHTML = [
      '<div class="aix-bar" id="aix-bar">',
      '<button class="aix-main" id="aix-explain" type="button" aria-haspopup="dialog">💡 看不懂，請解釋</button>',
      '<button class="aix-gear" id="aix-settings" type="button" title="AI 設定" aria-label="AI 設定">⚙</button>',
      '</div>',
      '<div class="aix-overlay" id="aix-settings-overlay" hidden>',
      '<div class="aix-card" role="dialog" aria-modal="true" aria-labelledby="aix-settings-title">',
      '<div class="aix-head"><h2 id="aix-settings-title">AI 解釋設定</h2><button class="aix-close" id="aix-settings-x" type="button" aria-label="關閉">×</button></div>',
      '<p class="aix-sub">使用 DeepSeek V4.1 Flash（deepseek-flash）產生解釋。金鑰只存放在這台裝置的瀏覽器，按下解釋時直接送到 DeepSeek，不會經過本站伺服器。</p>',
      '<label class="aix-label" for="aix-key">DeepSeek API Key</label>',
      '<div class="aix-keyrow"><input class="aix-input" id="aix-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-..."><button class="aix-eye" id="aix-eye" type="button">顯示</button></div>',
      '<p class="aix-hint">金鑰保存在 localStorage（鍵名：deepseek_api_key_v1）。共用電腦或借人使用前，建議按「清除金鑰」。費用由你的 DeepSeek 帳號負擔。</p>',
      '<label class="aix-label" for="aix-model">模型</label>',
      '<select class="aix-select" id="aix-model"><option value="deepseek-flash">deepseek-flash（V4.1 Flash，推薦）</option><option value="deepseek-v4-pro">deepseek-v4-pro（較強、較慢）</option></select>',
      '<div class="aix-actions"><button class="aix-btn primary" id="aix-save" type="button">儲存設定</button><button class="aix-btn" id="aix-test" type="button">測試連線</button><button class="aix-btn danger" id="aix-clear" type="button">清除金鑰</button><button class="aix-btn" id="aix-clear-cache" type="button">清除解釋快取</button><button class="aix-btn" id="aix-settings-cancel" type="button">取消</button></div>',
      '<div class="aix-status" id="aix-status" aria-live="polite"></div>',
      '<p class="aix-foot">還沒有金鑰？到 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">DeepSeek 平台</a> 建立。金鑰若外流，請立刻到平台刪除。</p>',
      '</div></div>',
      '<div class="aix-overlay" id="aix-explain-overlay" hidden>',
      '<div class="aix-card aix-wide" role="dialog" aria-modal="true" aria-labelledby="aix-explain-title">',
      '<div class="aix-head"><h2 id="aix-explain-title">看不懂，請解釋</h2><button class="aix-close" id="aix-explain-x" type="button" aria-label="關閉">×</button></div>',
      '<span class="aix-ctx" id="aix-ctx"></span>',
      '<div class="aix-out" id="aix-out" aria-live="polite"></div>',
      '<div class="aix-actions"><button class="aix-btn primary" id="aix-regen" type="button">重新解釋</button><button class="aix-btn aix-copy" id="aix-copy" type="button">複製</button><button class="aix-btn" id="aix-explain-close" type="button">關閉</button></div>',
      '<p class="aix-foot">AI 產生的解釋僅供參考；若和課程解答不同，以課程解答為準。同一題第二次開啟會先顯示上次結果，按「重新解釋」才會重新查詢。</p>',
      '</div></div>',
      '<div class="aix-overlay" id="aix-lock-overlay" hidden>',
      '<form class="aix-card aix-lock" id="aix-lock-form" role="dialog" aria-modal="true" aria-labelledby="aix-lock-title">',
      '<div class="aix-head"><h2 id="aix-lock-title">AI 設定已上鎖</h2><button class="aix-close" id="aix-lock-x" type="button" aria-label="關閉">×</button></div>',
      '<p class="aix-sub">要進入 AI 設定修改金鑰或模型，請先輸入管理密碼。</p>',
      '<label class="aix-label" for="aix-lock-input">管理密碼</label>',
      '<div class="aix-keyrow"><input class="aix-input" id="aix-lock-input" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="請輸入密碼"><button class="aix-eye" id="aix-lock-eye" type="button">顯示</button></div>',
      '<div class="aix-actions"><button class="aix-btn primary" id="aix-lock-ok" type="submit">解鎖</button><button class="aix-btn" id="aix-lock-cancel" type="button">取消</button></div>',
      '<div class="aix-status" id="aix-lock-status" aria-live="polite"></div>',
      '</form></div>'
    ].join('');
    while (root.firstChild) document.body.appendChild(root.firstChild);
    bind();
  }

  function openOverlay(id) {
    var el = $(id);
    if (!el) return;
    el.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }
  function closeOverlay(id) {
    var el = $(id);
    if (!el) return;
    el.hidden = true;
    if (!document.querySelector('.aix-overlay:not([hidden])')) document.documentElement.style.overflow = '';
  }
  function closeAll() {
    closeOverlay('aix-lock-overlay');
    closeOverlay('aix-settings-overlay');
    closeOverlay('aix-explain-overlay');
  }

  function status(msg, kind) {
    var el = $('aix-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'aix-status' + (kind ? ' ' + kind : '');
  }

  var pendingSettingsMsg = '';
  function lockStatus(msg, kind) {
    var el = $('aix-lock-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'aix-status' + (kind ? ' ' + kind : '');
  }
  function openSettings(msg) {
    pendingSettingsMsg = msg || '';
    var li = $('aix-lock-input');
    if (li) { li.value = ''; li.type = 'password'; }
    var le = $('aix-lock-eye');
    if (le) le.textContent = '顯示';
    lockStatus('', '');
    openOverlay('aix-lock-overlay');
    if (li) setTimeout(function () { li.focus(); }, 30);
  }
  function showSettings(msg) {
    var input = $('aix-key');
    if (input) input.value = getKey();
    var sel = $('aix-model');
    if (sel) sel.value = getModel();
    status(msg || '', msg ? 'info' : '');
    openOverlay('aix-settings-overlay');
    if (input && !input.value) setTimeout(function () { input.focus(); }, 30);
  }
  function tryUnlockSettings() {
    var input = $('aix-lock-input');
    var value = (input && input.value || '').trim();
    if (hash32(value) === LOCK_HASH) {
      closeOverlay('aix-lock-overlay');
      showSettings(pendingSettingsMsg);
    } else {
      lockStatus('管理密碼不正確，請再試一次。', 'bad');
      if (input) input.select();
    }
  }

  function pickContext() {
    var sels = ['#qArea', '.qcard', '.excard', '.kcard.open', '#tabpane', '#view', '.view.on', '#lessonView', 'main', '.wrap', 'body'];
    var best = '';
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (!el) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el !== document.body && !el.getClientRects().length) continue;
      var t = (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ').trim();
      if (sels[i] === 'body') {
        t = t.replace(/看不懂，請解釋/g, '').replace(/AI 設定/g, '').trim();
      }
      if (t.length >= 40) { best = t; break; }
    }
    if (!best) best = (document.body.innerText || '').trim();
    best = best.replace(/\n{3,}/g, '\n\n');
    if (best.length > MAX_CONTEXT) best = best.slice(0, MAX_CONTEXT) + '\n…（以下省略）';
    return best;
  }

  function md(src) {
    var s = esc(src);
    s = s.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, function (m, p1) {
      return '<code style="display:block;white-space:pre-wrap;padding:10px;margin:8px 0">' + p1.replace(/^\n|\n$/g, '') + '</code>';
    });
    s = s.replace(/^\s*#{1,6}\s*(.+)$/gm, '<b class="aix-h">$1</b>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/^(\s*)[-*]\s+/gm, '$1• ');
    return s;
  }

  function apiError(statusCode, text) {
    var detail = '';
    try {
      var j = JSON.parse(text);
      detail = j && j.error && j.error.message ? j.error.message : '';
    } catch (e) { detail = String(text || '').slice(0, 180); }
    if (/invalid|authentication|api key/i.test(detail) || statusCode === 401) return 'API Key 無效或已失效（401）。請開啟「AI 設定」重新貼上金鑰。';
    if (statusCode === 402) return 'DeepSeek 帳號餘額不足（402）。請到 DeepSeek 平台儲值後再試。';
    if (statusCode === 429) return '請求太頻繁（429），請等幾秒再按一次。';
    if (statusCode >= 500) return 'DeepSeek 伺服器暫時有問題（' + statusCode + '），請稍後再試。';
    return 'DeepSeek 回傳錯誤（' + statusCode + '）：' + (detail || '沒有詳細訊息');
  }

  function request(messages, maxTokens) {
    var key = getKey();
    if (!key) return Promise.reject({ code: 'nokey' });
    abortCtl = new AbortController();
    var timer = setTimeout(function () { try { abortCtl.abort(); } catch (e) { } }, 90000);
    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: getModel(),
        messages: messages,
        temperature: 0.4,
        max_tokens: maxTokens || 1600,
        thinking: { type: 'disabled' },
        stream: false
      }),
      signal: abortCtl.signal
    }).then(function (r) {
      return r.text().then(function (t) { return { ok: r.ok, status: r.status, text: t }; });
    }).then(function (x) {
      clearTimeout(timer);
      if (!x.ok) throw { code: 'http', status: x.status, message: apiError(x.status, x.text) };
      var data;
      try { data = JSON.parse(x.text); } catch (e) { throw { code: 'parse', message: 'DeepSeek 回傳格式無法解析，請稍後再試。' }; }
      var msg = data && data.choices && data.choices[0] && data.choices[0].message;
      var content = msg && msg.content ? String(msg.content).trim() : '';
      if (!content) throw { code: 'empty', message: 'DeepSeek 沒有回傳解釋內容，請再按一次。' };
      return content;
    }).catch(function (e) {
      clearTimeout(timer);
      if (e && e.name === 'AbortError') throw { code: 'timeout', message: '等太久（超過 90 秒）沒有回應，請再試一次。' };
      if (e && e.code) throw e;
      throw { code: 'network', message: '無法連線到 DeepSeek。請檢查網路，或稍後再試。' };
    });
  }

  function explainPrompt(context) {
    var title = (document.title || '學習畫面').trim();
    return [
      {
        role: 'system',
        content: '你是臺灣國小四年級的老師，專長是數學、自然、社會、國語和英語。學生按下了「看不懂，請解釋」，你要用繁體中文（臺灣用語）幫他看懂目前畫面上的學習內容或測驗題。\n\n請遵守：\n1. 先用一句話說出這個畫面的重點。\n2. 如果畫面有題目：說明解題關鍵，列出清楚的步驟，指出正確答案，並解釋為什麼；如果是選擇題，簡單說明其他選項為什麼不對。\n3. 如果是知識卡或課文：用一個生活例子補充，並指出最容易混淆的地方。\n4. 用國小四年級聽得懂的話，句子簡短，不要用太難的術語。\n5. 不要重複整段原文，不要編造畫面沒有的資訊；資訊不足時直接說明。\n6. 最後用「小提醒：」給一句記憶重點。\n\n輸出使用簡單的 Markdown：用 ## 小標題、**粗體**、- 列點。總長度控制在 500 字以內。'
      },
      {
        role: 'user',
        content: '頁面標題：' + title + '\n\n目前畫面上看得到的內容：\n' + context + '\n\n請根據以上內容解釋，並幫我解決畫面中的題目。'
      }
    ];
  }

  function setBusy(b) {
    busy = b;
    var btn = $('aix-regen');
    if (btn) { btn.disabled = b; btn.textContent = b ? '產生中…' : '重新解釋'; }
    var main = $('aix-explain');
    if (main) main.disabled = b;
  }

  function showCached(entry, out) {
    lastText = entry.text;
    out.innerHTML = '<span class="aix-cachebar">上次的解釋 · ' + esc(fmtTime(entry.ts)) + '</span>' + md(entry.text);
    out.scrollTop = 0;
  }

  function runExplain(force) {
    if (busy) return;
    var out = $('aix-out');
    var context = pickContext();
    var ctxEl = $('aix-ctx');
    if (ctxEl) {
      var label = (document.title || '').trim();
      ctxEl.textContent = label ? label.slice(0, 80) : '目前畫面';
      ctxEl.title = label;
    }
    if (!context || context.length < 5) {
      out.innerHTML = '<div class="aix-err">目前畫面抓不到文字內容。請先進入單元或題目，再按一次。</div>';
      return;
    }
    var key = cacheKey(context);
    var hit = force ? null : cacheGet(key);
    if (hit) {
      showCached(hit, out);
      setBusy(false);
      return;
    }
    if (!getKey()) {
      out.innerHTML = '<div class="aix-err">尚未設定 DeepSeek API Key。請按「AI 設定」貼上金鑰，才能查詢新的解釋。</div>';
      setBusy(false);
      openSettings('請先貼上 DeepSeek API Key，才能查詢新的解釋。');
      return;
    }
    setBusy(true);
    out.innerHTML = '<div class="aix-loading"><span class="aix-spin" aria-hidden="true"></span><span>正在請 DeepSeek 解釋，通常需要 5～20 秒…</span></div>';
    request(explainPrompt(context)).then(function (text) {
      lastText = text;
      cacheSet(key, text);
      out.innerHTML = md(text);
      out.scrollTop = 0;
    }).catch(function (e) {
      lastText = '';
      out.innerHTML = '<div class="aix-err">' + esc(e && e.message ? e.message : '發生未知錯誤，請再試一次。') + '</div>';
    }).then(function () { setBusy(false); });
  }

  function openExplain() {
    var context = pickContext();
    var hit = cacheGet(cacheKey(context));
    if (!getKey() && !hit) { openSettings('請先貼上 DeepSeek API Key，才能使用 AI 解釋。'); return; }
    openOverlay('aix-explain-overlay');
    runExplain(false);
  }

  function copyText() {
    if (!lastText) return;
    var done = function () {
      var b = $('aix-copy'); if (!b) return;
      var old = b.textContent; b.textContent = '已複製'; setTimeout(function () { b.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastText).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = lastText; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { }
      document.body.removeChild(ta);
    }
  }

  function testConnection() {
    var key = ($('aix-key') && $('aix-key').value || '').trim();
    if (!key) { status('請先貼上 API Key。', 'bad'); return; }
    status('測試中…', 'info');
    var saved = getKey();
    setKey(key);
    request([{ role: 'user', content: '請只回覆「OK」兩個字。' }], 8).then(function () {
      status('連線成功，記得按「儲存設定」保存。', 'ok');
    }).catch(function (e) {
      status(e && e.message ? e.message : '測試失敗。', 'bad');
    }).then(function () {
      if (saved) setKey(saved); else delKey();
    });
  }

  function bind() {
    var main = $('aix-explain'), gear = $('aix-settings');
    if (main) main.addEventListener('click', openExplain);
    if (gear) gear.addEventListener('click', function () { openSettings(''); });

    var lf = $('aix-lock-form');
    if (lf) lf.addEventListener('submit', function (e) { e.preventDefault(); tryUnlockSettings(); });
    var lx = $('aix-lock-x'), lc = $('aix-lock-cancel');
    if (lx) lx.addEventListener('click', function () { closeOverlay('aix-lock-overlay'); });
    if (lc) lc.addEventListener('click', function () { closeOverlay('aix-lock-overlay'); });
    var le = $('aix-lock-eye');
    if (le) le.addEventListener('click', function () {
      var i = $('aix-lock-input');
      var show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      le.textContent = show ? '隱藏' : '顯示';
    });

    var sk = $('aix-save');
    if (sk) sk.addEventListener('click', function () {
      var v = ($('aix-key').value || '').trim();
      if (!v) { status('請先輸入 API Key。', 'bad'); return; }
      if (v.length < 20) { status('這個金鑰看起來太短，請確認是否完整貼上（通常以 sk- 開頭）。', 'bad'); return; }
      setKey(v); setModel($('aix-model').value || DEFAULT_MODEL);
      status('已儲存在這台裝置的瀏覽器。', 'ok');
      setTimeout(function () { closeOverlay('aix-settings-overlay'); }, 700);
    });
    var eye = $('aix-eye');
    if (eye) eye.addEventListener('click', function () {
      var i = $('aix-key');
      var show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      eye.textContent = show ? '隱藏' : '顯示';
    });
    var tc = $('aix-test');
    if (tc) tc.addEventListener('click', testConnection);
    var cl = $('aix-clear');
    if (cl) cl.addEventListener('click', function () {
      delKey();
      $('aix-key').value = '';
      status('已清除這台裝置上的金鑰。', 'ok');
    });
    var cc = $('aix-clear-cache');
    if (cc) cc.addEventListener('click', function () {
      var n = cacheCount();
      cacheClear();
      status('已清除 ' + n + ' 筆解釋快取。', 'ok');
    });
    var sx = $('aix-settings-x'), sc = $('aix-settings-cancel');
    if (sx) sx.addEventListener('click', function () { closeOverlay('aix-settings-overlay'); });
    if (sc) sc.addEventListener('click', function () { closeOverlay('aix-settings-overlay'); });

    var ex = $('aix-explain-x'), ec = $('aix-explain-close');
    if (ex) ex.addEventListener('click', function () { closeOverlay('aix-explain-overlay'); });
    if (ec) ec.addEventListener('click', function () { closeOverlay('aix-explain-overlay'); });
    var rg = $('aix-regen');
    if (rg) rg.addEventListener('click', function () { runExplain(true); });
    var cp = $('aix-copy');
    if (cp) cp.addEventListener('click', copyText);

    $$('.aix-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) { if (e.target === ov) closeOverlay(ov.id); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('aix-lock-overlay').hidden) closeOverlay('aix-lock-overlay');
        else if (!$('aix-explain-overlay').hidden) closeOverlay('aix-explain-overlay');
        else if (!$('aix-settings-overlay').hidden) closeOverlay('aix-settings-overlay');
      }
    });
  }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function start() {
    if (!document.body || $('aix-bar')) return;
    ui();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.__AIX__ = {
    pickContext: pickContext,
    render: md,
    keyName: KEY_LS,
    cacheKey: cacheKey,
    cacheCount: cacheCount,
    cacheClear: cacheClear,
    hasKey: function () { return !!getKey(); }
  };
})();
