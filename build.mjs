import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Transformer } from 'markmap-lib';

const here = path.dirname(fileURLToPath(import.meta.url));
// 用法：node build.mjs [設定檔]，預設重建第一單元；node build.mjs book2.config.json 產生期中後版本
const CFG = JSON.parse(fs.readFileSync(path.join(here, process.argv[2] || 'book1.config.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(here, CFG.raw), 'utf8'));
// 兩套系統共用同一份知識庫；輔助 raw 只補課文文字（例如期中後版本要回頭比對第 1～3 課）。
const aux = CFG.rawAux ? JSON.parse(fs.readFileSync(path.join(here, CFG.rawAux), 'utf8')) : {};
const LESSONS = CFG.lessons;
const EXTRAS = CFG.extra || [];
const SRC = 'E:/01國語';

const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
const CAT = {
  preview: { label: '預習單', dim: '課文理解' },
  words: { label: '字詞句練習單', dim: '生字語詞' },
  idiom: { label: '成語加油站', dim: '生字語詞' },
  maps: { label: 'MAPS 提問單', dim: '閱讀策略' },
  write: { label: '一課一練筆', dim: '寫作表達' }
};

const clean = s => (s || '')
  .replace(/[\u0001\u0002\u0015\u000b\f\r\u0007]/g, ' ')
  .replace(/\t/g, ' ')
  .replace(/[ \u3000]{2,}/g, ' ')
  .trim();
// 課文給人讀，必須保留 Word 的 \r 段落界線；clean() 會把它壓成空白，
// 結果整課擠成一大段。順手清掉原教材的 ***** 分節線。
const textForDisplay = s => (s || '')
  .replace(/\r\n|\r|\f|\u000b/g, '\n')
  .replace(/[\u0001\u0002\u0015\t\u0007]/g, ' ')
  .replace(/\*{4,}/g, '')
  .replace(/[ \u3000]{2,}/g, ' ')
  .split('\n').map(x => x.trim()).filter(x => x.length).join('\n\n');
const T = k => { const v = raw[k] || aux[k]; return v ? v.text : ''; };
const cjkCount = s => (s.match(/[\u4e00-\u9fff]/g) || []).length;

// 知識庫是全冊共用檔，用「第○課」切段；保留所有 12 課，讓兩套系統都能取用。
function splitByLesson(txt) {
  const re = /第([一二三四五六七八九十]+)課/g;
  const hits = [];
  let m;
  while ((m = re.exec(txt))) hits.push({ n: CN[m[1]], s: m.index, e: m.index + m[0].length });
  const out = {};
  for (let i = 0; i < hits.length; i++) {
    const a = hits[i], b = hits[i + 1];
    if (!a.n) continue;
    const seg = txt.slice(a.e, b ? b.s : txt.length);
    if (!out[a.n] || seg.length > out[a.n].length) out[a.n] = seg;
  }
  return out;
}

const CIRCLED = '⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛';
function parseNumberedItems(txt) {
  const re = new RegExp('[' + CIRCLED + ']\\s*([^：:\\r\\n]{1,12})[：:]', 'g');
  const hits = [];
  let m;
  while ((m = re.exec(txt))) hits.push({ w: m[1].trim(), s: m.index, e: re.lastIndex });
  return hits.map((h, i) => ({
    w: h.w,
    body: txt.slice(h.e, i + 1 < hits.length ? hits[i + 1].s : txt.length)
  })).filter(x => x.w && x.w.length < 12);
}

function parseVocab(txt) {
  return parseNumberedItems(txt).map(x => {
    let body = clean(x.body).replace(/\s*\r\s*/g, ' ');
    let def = body, ex = '';
    const k = body.search(/例句/);
    if (k >= 0) { def = body.slice(0, k).trim(); ex = body.slice(k + 2).trim(); }
    return { w: x.w, def, ex };
  }).filter(v => v.def.length > 1);
}

function parseRhetoric(txt) {
  return clean(txt).split('●').slice(1).map(block => {
    const seg = t => {
      const re = new RegExp(t + '\\s*([\\s\\S]*?)(?=定義|例句|解析|$)');
      const m = block.match(re);
      return m ? m[1].trim() : '';
    };
    const first = block.split(/\s/)[0].trim();
    return { name: first, def: seg('定義'), ex: seg('例句'), note: seg('解析') };
  }).filter(x => x.name && x.def);
}

function parseGist(txt) {
  const out = { main: '', paras: [], raw: clean(txt) };
  for (const ln of txt.split(/\r/)) {
    const l = clean(ln);
    if (!l) continue;
    if (l.startsWith('大意：')) { if (!out.main) out.main = l.slice(3); continue; }
    const pm = l.match(/^第[一二三四五六七八九十]+段[：:](.*)$/);
    if (pm) {
      const q = pm[1];
      const am = q.match(/[（(]([^）)]+)[）)]\s*$/);
      out.paras.push({ q: am ? q.slice(0, q.length - am[0].length) : q, a: am ? am[1] : '' });
    }
  }
  return out;
}

function parseReading(txt) {
  const items = [];
  for (const ln of txt.split(/\r/)) {
    const l = clean(ln);
    const m = l.match(/^\d+\.\s*(.+)$/);
    if (!m) continue;
    let body = m[1];
    let ability = '';
    const am = body.match(/(\d+)\.(提取訊息|推論訊息|詮釋整合|比較評估|統整詮釋|評價省思|創意思考)\s*$/);
    if (am) { ability = am[2]; body = body.slice(0, am.index); }
    const answers = [...body.matchAll(/[（(]([^）)]{2,})[）)]/g)].map(x => x[1].trim());
    const q = body.replace(/[（(]([^）)]{2,})[）)]/g, '＿＿').trim();
    if (q.length < 6) continue;
    items.push({ q, answers, ability: ability || '統整詮釋' });
  }
  return items;
}

// 生字表是「十二…一」倒著排，但實體檔只有 11 列（有兩課被合併），
// 用「倒數第 n 列」會讓第 7～12 課全部錯位。改成拿每一列的字去課文裡算命中數，
// 做一對一最佳配對，缺課文的那幾課就留空，不硬猜。
function parseZi() {
  const rows = T('kb_zi').split(/\r/)
    .map(s => s.replace(/[\u0007\r]/g, '').trim())
    .filter(s => s.length >= 10 && cjkCount(s) === s.length);
  const sets = {};
  for (let n = 1; n <= 12; n++) {
    const t = clean(T('text_L' + n));
    sets[n] = new Set([...t].filter(c => /[\u4e00-\u9fff]/.test(c)));
  }
  const pairs = [];
  rows.forEach((row, ri) => {
    for (let n = 1; n <= 12; n++) {
      let s = 0;
      for (const c of row) if (sets[n].has(c)) s++;
      pairs.push({ ri, n, s });
    }
  });
  pairs.sort((a, b) => b.s - a.s);
  const usedRow = new Set(), usedLesson = new Set(), out = {};
  for (const p of pairs) {
    if (usedRow.has(p.ri) || usedLesson.has(p.n) || p.s < 3) continue;
    out[p.n] = rows[p.ri];
    usedRow.add(p.ri); usedLesson.add(p.n);
  }
  return out;
}

// 生字解釋用的是「⑴形」「⑸動」這種課本單字縮寫，而且詞性後面直接黏解釋。
// 拆成結構化 senses，讓前端把詞性畫成彩色標籤並用「—」隔開解釋。
const POS_ABBR = {
  '名': '名詞', '動': '動詞', '形': '形容詞', '副': '副詞', '代': '代詞',
  '介': '介詞', '連': '連詞', '助': '助詞', '嘆': '嘆詞', '數': '數詞', '量': '量詞',
  '摹': '摹聲詞'
};
const SENSE_MARK = /^[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂①②③④⑤⑥⑦⑧⑨⑩]|^\（\d+\）|^\(\d+\)/;
// 沒有詞性標籤的卡片（語詞、修辭、成語…）也把 ⑴⑵ 斷行，別擠成一長串。
const breakNumbered = s => (s || '').replace(/[ \u3000]+(?=[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂])/g, '\n');

function parseCharExplain(txt) {
  const re = /(\d{2})\s*([\u4e00-\u9fff])\s*([\s\S]*?)(?=\d{2}\s*[\u4e00-\u9fff]|$)/g;
  const out = {};
  let m;
  while ((m = re.exec(txt))) {
    const z = m[2];
    if (out[z]) continue;
    const raw = m[3];
    const lines = raw.split(/[\r\f\u000b]/)
      .map(s => s.replace(/[\u0007\u0001\u0002\u0015\t]/g, ' ').replace(/[ \u3000]{2,}/g, ' ').trim())
      .filter(s => s.length && !/^第[一二三四五六七八九十]+課/.test(s) && !/^\*{4,}/.test(s));
    const senses = [];
    lines.forEach((line, idx) => {
      const nm = line.match(SENSE_MARK);
      let n = nm ? nm[0] : '', rest = n ? line.slice(n.length).trim() : line;
      // 無編號時，只有「整條目就這一行」才把首字當詞性，避免把「形容…」誤判成 形。
      const maybePos = rest[0];
      let pos = '';
      if (POS_ABBR[maybePos] && (n || (lines.length === 1 && idx === 0))) {
        pos = maybePos;
        rest = rest.slice(1).trim();
      }
      if (!n && !pos && senses.length) { senses[senses.length - 1].def += ' ' + rest; return; }
      const k = rest.search(/例(?:句)?[：:]/);
      let def = (k >= 0 ? rest.slice(0, k) : rest).trim();
      let ex = k >= 0 ? rest.slice(k).replace(/^例(?:句)?[：:]\s*/, '').trim() : '';
      if (!def && !ex) return;
      senses.push({ n, pos, posFull: pos ? POS_ABBR[pos] : '', def: def.slice(0, 220), ex: ex.slice(0, 110) });
    });
    const usable = senses.some(s => s.pos);
    out[z] = {
      body: usable ? '' : clean(raw).slice(0, 240),
      senses: usable ? senses : undefined
    };
  }
  return out;
}

// 生字延伸成語用「一、二、…十二、」分課。
function parseIdiomExt(txt) {
  const re = /([一二三四五六七八九十]+)、\s*[\u4e00-\u9fff]+/g;
  const hits = [];
  let m;
  while ((m = re.exec(txt))) hits.push({ n: CN[m[1]] || 0, s: m.index });
  const out = {};
  hits.forEach((h, i) => {
    if (!h.n) return;
    const seg = txt.slice(h.s, i + 1 < hits.length ? hits[i + 1].s : txt.length);
    out[h.n] = clean(seg).slice(0, 900);
  });
  return out;
}

// 課文結構表以 jpg 為準（對應的 .doc 是空殼），直接用檔名特徵找圖。
function jpgData(spec) {
  if (!spec) return '';
  const dir = path.join(SRC, '1.基本備課/12.國語4上課文結構表');
  try {
    const f = fs.readdirSync(dir).find(x => x.includes(spec) && /\.jpg$/i.test(x));
    if (!f) return '';
    return 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
  } catch (e) { return ''; }
}

// 沒有原教材題目的閱讀階梯／自讀教材，給一組通用的四層次提問。
function genericReading(L) {
  return [
    { q: '這篇文章主要在寫誰？在什麼地方、做了什麼事？', answers: [], ability: '提取訊息', hint: '圈出人名、地方和動作，答案通常直接寫在句子裡。', tip: '把「誰＋在哪裡＋做什麼」連成一句話。' },
    { q: '從哪些句子可以看出主角的心情或想法？為什麼？', answers: [], ability: '推論訊息', hint: '找動作、表情、對話，作者通常不會直接寫出心情。', tip: '用「我從……推論……因為……」回答。' },
    { q: '把各段連起來，用三句話說出這篇的大意。', answers: [], ability: '詮釋整合', hint: '每一段挑一個關鍵詞，再串成順序。', tip: '先說起因，再說經過，最後說結果。' },
    { q: '如果是你，你會做一樣的選擇嗎？說說理由。', answers: [], ability: '比較評估', hint: '開放題沒有標準答案，重點是理由要跟課文有關。', tip: '先講想法，再舉出課文裡支持你的句子。' }
  ];
}
function strategyCards(L) {
  return [
    { type: '閱讀策略', title: '預測', body: '先看課名與插圖，猜猜這篇會寫什麼；讀完再回頭檢查猜對了幾項。', tag: '策略' },
    { type: '閱讀策略', title: '提問', body: '邊讀邊把「為什麼」「後來呢」寫在旁邊，這就是自己給自己的 MAPS 提問。', tag: '策略' },
    { type: '閱讀策略', title: '統整', body: '用「人、事、時、地、結果」五張卡排順序，再說出大意與作者的想法。', tag: '策略' },
    { type: '文體', title: L.genre, body: '本課焦點：' + L.focus + '。讀的時候特別注意作者怎麼安排順序。', tag: '文體' }
  ];
}

// 閱讀階梯／自讀教材沒有生字表、詞語解釋等制式講義，改從課文本身長出知識卡：
// 自然段 → 四層次提問 → 原教材預習任務，避免這一課只剩四張策略卡。
function storyParagraphs(text) {
  // clean() 已把連續空白壓成一個，所以這裡用 \s+ 而不是 \s{2,}
  const re = /(?:^|\s)([一二三四五六七八九十]{1,3})\s+/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) hits.push({ n: m[1], s: m.index + m[0].length, head: m.index });
  return hits.map((h, i) => ({
    n: h.n,
    body: text.slice(h.s, i + 1 < hits.length ? hits[i + 1].head : text.length).trim()
  })).filter(p => p.body.length > 8);
}
// 「語句練習」原本整課塞成一張卡，說明、結構、例句全黏在一起，
// 結構列裡的（名詞）（動詞）更容易和課文例句搞混。改成一個練習一張卡，
// 並把結構拆成 token，讓前端用彩色標籤＋分隔符號畫出來。
const POS_WORDS = ['疊字副詞', '形容詞', '名詞', '動詞', '副詞', '代名詞', '代詞', '連接詞', '連詞', '助詞', '嘆詞', '量詞', '數詞', '疊字'];
function structureSegs(s) {
  const out = [], re = /[（(]([^）)]{1,8})[）)]/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    const pre = s.slice(last, m.index).trim();
    if (pre) out.push({ label: pre });
    const w = m[1].trim();
    if (POS_WORDS.includes(w)) out.push({ label: w, pos: w });
    else out.push({ label: '（' + w + '）' });
    last = re.lastIndex;
  }
  const tail = s.slice(last).trim();
  if (tail) out.push({ label: tail });
  return out;
}
function parseSentencePractice(txt) {
  const out = [];
  let section = '', cur = null;
  const flush = () => {
    if (!cur) return;
    if (!cur.desc && !cur.structure && !cur.examples.length) { cur = null; return; }
    const lines = [];
    if (cur.desc) lines.push('說明：' + cur.desc);
    if (cur.note) lines.push('解析：' + cur.note);
    if (cur.src) lines.push('課文原句：' + cur.src);
    if (cur.examples.length) lines.push('例句：\n' + cur.examples.map(e => '　・' + e).join('\n'));
    const segs = cur.structure ? structureSegs(cur.structure) : [];
    out.push({
      type: '語句練習',
      title: (section ? section.replace(/練習$/, '') + '・' : '') + cur.title,
      body: lines.join('\n'),
      segs: segs.some(x => x.pos) ? segs : undefined,
      tag: '句型'
    });
    cur = null;
  };
  for (const rawLine of txt.split(/\r|\f|\u000b/)) {
    const line = rawLine.replace(/\u0007/g, '').replace(/^\s+|\s+$/g, '');
    if (!line) continue;
    const sec = line.match(/^[㈠㈡㈢㈣㈤㈥]\s*(.+?練習)\s*$/);
    if (sec) { flush(); section = sec[1]; continue; }
    const head = line.match(/^(?:●|◎|[⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕]|[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽]|\d+[.、])\s*(.+)$/);
    if (head) {
      flush();
      cur = { title: head[1].replace(/[—–－-]\s*$/, '').trim(), desc: '', structure: '', examples: [], src: '', note: '' };
      continue;
    }
    // 「引導」是給老師的情境提示，對孩子自學是雜訊，直接略過。
    const kv = line.match(/^(說明|結構|例|原|解析)[\t 　]+(.+)$/);
    if (!kv || !cur) continue;
    const v = kv[2].trim();
    if (kv[1] === '說明') cur.desc = v;
    else if (kv[1] === '結構') cur.structure = v;
    else if (kv[1] === '例') cur.examples.push(v);
    else if (kv[1] === '原') cur.src = v;
    else if (kv[1] === '解析') cur.note = v;
  }
  flush();
  return out;
}

function fallbackCards(L, reading, text, previewText) {
  const out = strategyCards(L);
  const paras = storyParagraphs(text);
  if (paras.length >= 3) {
    paras.forEach(p => out.push({ type: '段落大意', title: '第' + p.n + '段', body: p.body.slice(0, 180), tag: '結構' }));
  } else {
    (text.match(/[^。！？\n]{10,64}[。！？]/g) || []).slice(0, 10)
      .forEach((s, i) => out.push({ type: '課文切片', title: '第 ' + (i + 1) + ' 句', body: s.trim(), tag: '課文' }));
  }
  reading.slice(0, 8).forEach((r, i) => out.push({
    type: '四層次提問', title: 'Q' + (i + 1) + '・' + r.ability,
    body: r.q + '\n提示：' + (r.hint || '回課文找關鍵句子') + '\n參考：' + (r.tip || (r.answers || []).join('／') || '想法合理即可'),
    tag: '提問'
  }));
  if (previewText) out.push({ type: '預習任務', title: '原教材預習單', body: clean(previewText).slice(0, 700), tag: '預習' });
  return out;
}

// ---------- quiz ----------
function makeQuiz() {
  const all = [];
  const seenStem = new Map();
  for (const L of LESSONS) {
    for (const cat of Object.keys(CAT)) {
      const key = cat + '_' + L.id;
      const r = raw[key];
      if (!r || !r.qtext || !r.answers || !r.answers.length) continue;
      // Word 的 \r（段落）與 \u0007（表格儲存格）是天然題界，絕對不能壓成空白，
      // 否則題幹會跨過整張學習單，混進「□造詞 □國字 □讀音」「Q2…」等表格雜訊。
      const q = r.qtext
        .replace(/\r\n|\r|\u0007|\f|\u000b/g, '\n')
        .replace(/[\u0001\u0002\u0015\t]/g, ' ');
      const blanks = [...q.matchAll(/▢/g)].map(m => m.index);
      if (blanks.length !== r.answers.length) continue;
      blanks.forEach((pos, i) => {
        const a = r.answers[i].replace(/[\s\u3000]/g, '').replace(/[︵︶（）()]/g, '');
        if (!a || a.length > 14 || cjkCount(a) < 1) return;
        const s = q.lastIndexOf('\n', pos) + 1;
        let e = q.indexOf('\n', pos);
        if (e < 0) e = q.length;
        const line = q.slice(s, e).trim();
        if (/造詞|讀音|國字|形近字|多音字/.test(line) && cjkCount(line) < 14) return;
        if (line.length < 9 || cjkCount(line) < 7) return;
        const before = clean(q.slice(s, pos)).replace(/▢/g, '□');
        const after = clean(q.slice(pos + 1, e)).replace(/▢/g, '□');
        if (!before || !after) return;
        const tidy = t => t.replace(/︵/g, '（').replace(/︶/g, '）');
        const display = tidy(before + '【＿＿】' + after);
        if (display.length > 150) return;
        const norm = display.replace(/[【＿＿】□\s（）︵︶，。、！？：；]/g, '');
        const n = seenStem.get(norm) || 0;
        if (n >= 2) return;
        seenStem.set(norm, n + 1);
        const full = tidy(before + '「' + a + '」' + after);
        all.push({
          id: key + '#' + i, lesson: L.id, cat, label: CAT[cat].label, dim: CAT[cat].dim,
          q: display, a, full, src: key, pos: i
        });
      });
    }
  }
  all.forEach(it => {
    const pool = all.filter(o => o.lesson === it.lesson && o.a !== it.a && Math.abs(o.a.length - it.a.length) <= 2);
    const uniq = [];
    const seen = new Set([it.a]);
    for (const o of pool) { if (!seen.has(o.a)) { seen.add(o.a); uniq.push(o); } if (uniq.length >= 3) break; }
    for (const o of all) { if (uniq.length >= 3) break; if (!seen.has(o.a)) { seen.add(o.a); uniq.push(o); } }
    const opts = [{ t: it.a, ok: true, why: '放回原句讀得通：' + it.full }];
    uniq.forEach(o => opts.push({
      t: o.a, ok: false,
      why: '「' + o.a + '」是〈' + o.label + '〉另一格的正解，用在：' + clean(o.full).slice(0, 42) + '…　和這一題的意思不同。'
    }));
    const seed = [...it.id].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);
    for (let i = opts.length - 1; i > 0; i--) {
      const j = seed % (i + 1) + (i * 7 + (seed >>> 3)) % (i + 1);
      const k = j % (i + 1);
      [opts[i], opts[k]] = [opts[k], opts[i]];
    }
    it.options = opts;
    it.explain = it.full + '　〔出處：' + it.label + '〕';
  });
  return all.filter(it => it.options && it.options.length === 4);
}

// 閱讀階梯沒有「隱藏答案」學習單，用設定檔裡逐題校對過的課文理解題補足，
// 每一個錯項仍然各自寫明「為什麼錯」，不給湊數的誘答。
function makeQuizExtra() {
  return (CFG.quizExtra || []).map((x, i) => {
    const opts = [{ t: x.a, ok: true, why: x.why || '放回課文讀一遍，這一項才符合。' }];
    (x.d || []).forEach(p => opts.push({ t: p[0], ok: false, why: p[1] || '和課文內容不符。' }));
    const seed = [...(x.q || '')].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 17);
    for (let k = opts.length - 1; k > 0; k--) {
      const j = (seed + k * 37) % (k + 1);
      [opts[k], opts[j]] = [opts[j], opts[k]];
    }
    return {
      id: 'extra#' + i, lesson: x.lesson, cat: 'maps', label: x.label, dim: x.dim || '閱讀策略',
      q: x.q, a: x.a, full: x.why, src: 'quizExtra', pos: i,
      options: opts, explain: x.why + '　〔出處：' + x.label + '〕'
    };
  });
}

// ---------- markmap ----------
const transformer = new Transformer();
function mindmapRoot(md) { return transformer.transform(md).root; }

// ---------- build lessons ----------
const kb = {};
for (const [name, key] of Object.entries({
  vocab: 'kb_vocab', vocab2: 'kb_vocab2', rhetoric: 'kb_rhetoric', gist: 'kb_gist',
  reading: 'kb_reading', intro: 'kb_intro', phone: 'kb_phone', sent: 'kb_sent',
  char: 'kb_char', books: 'kb_books'
})) kb[name] = splitByLesson(T(key));
const zi = parseZi();
const idiomExt = parseIdiomExt(T('kb_idiom'));

const lessons = LESSONS.map(L => {
  const n = L.kb || 0;
  const text = textForDisplay(T('text_' + L.id));
  const vocab = n ? [...parseVocab(kb.vocab[n] || ''), ...parseVocab(kb.vocab2[n] || '')] : [];
  const rhetoric = n ? parseRhetoric(kb.rhetoric[n] || '') : [];
  const gist = n ? parseGist(kb.gist[n] || '') : { main: '', paras: [], raw: '' };
  const reading = n ? parseReading(kb.reading[n] || '') : [...(L.reading || []), ...genericReading(L)];
  const charExp = n ? parseCharExplain(kb.char[n] || '') : {};
  const introRaw = n ? clean(kb.intro[n] || '').replace(/^\s*\u0007?\s*/, '') : '';
  const mainIdeaMatch = introRaw.match(/透過[^。]{0,60}。?$/);
  const cards = [];
  (zi[n] || '').split('').forEach(z => {
    if (!z) return;
    const ce = charExp[z];
    cards.push({
      type: '生字', title: z,
      body: ce ? ce.body : '查查看：這個字在課文裡出現在哪一句？',
      senses: ce && ce.senses,
      tag: '生字'
    });
  });
  vocab.forEach(v => cards.push({ type: '語詞', title: v.w, body: v.def + (v.ex ? '\n例句：' + v.ex : ''), tag: '語詞' }));
  rhetoric.forEach(r => cards.push({ type: '修辭', title: r.name, body: '定義：' + r.def + '\n例句：' + r.ex + '\n解析：' + r.note, tag: '修辭' }));
  gist.paras.forEach((p, i) => cards.push({ type: '段落大意', title: '第 ' + (i + 1) + ' 段', body: p.q + (p.a ? '\n參考：' + p.a : ''), tag: '結構' }));
  if (n) parseSentencePractice(kb.sent[n] || '').forEach(c => cards.push(c));
  const phoneBody = n ? clean(kb.phone[n] || '').slice(0, 600) : '';
  if (phoneBody) cards.push({ type: '字音字形', title: '本課字音字形', body: phoneBody, tag: '字音' });
  const booksBody = n ? clean(kb.books[n] || '').slice(0, 400) : '';
  if (booksBody) cards.push({ type: '延伸閱讀', title: '延伸書目', body: booksBody, tag: '延伸' });
  if (idiomExt[n]) cards.push({ type: '生字延伸成語', title: '成語補給', body: idiomExt[n], tag: '成語' });
  if (!n) fallbackCards(L, reading, text, (raw['preview_' + L.id] || {}).text).forEach(c => cards.push(c));
  cards.forEach(c => { if (c.body) c.body = breakNumbered(c.body); });

  // clean() 會把 Word 的段落符号壓成空白，所以課文常是一整行；改用句號切出骨架，
  // 讓沒有標準講義的閱讀階梯／自讀教材也有像樣的心智圖分支。
  const byLine = text.split(/\n/).map(x => x.trim()).filter(x => cjkCount(x) > 12);
  const bySentence = (text.match(/[^。！？\n]{8,64}[。！？]/g) || []).map(x => x.trim());
  const paragraphs = (byLine.length >= 2 ? byLine : bySentence).slice(0, 4);
  const md = [
    '# ' + L.label + ' ' + L.title,
    '',
    '## 課文骨架',
    ...(gist.main ? ['### ' + gist.main.replace(/[。！？]/g, '')] : paragraphs.slice(0, 2).map(p => '### ' + p.slice(0, 26))),
    ...gist.paras.slice(0, 6).map((p, i) => '- 第' + (i + 1) + '段：' + (p.a || p.q).slice(0, 30).replace(/[（）()]/g, '')),
    '',
    '## 生字語詞',
    '- 生字 ' + (zi[n] || '').length + ' 個：' + (zi[n] || '').split('').slice(0, 8).join('、') + '…',
    ...vocab.slice(0, 6).map(v => '- ' + v.w + '：' + v.def.slice(0, 24).replace(/[。：]/g, '')),
    '',
    '## 修辭與句型',
    ...rhetoric.map(r => '- ' + r.name + '：' + r.def.slice(0, 28).replace(/[。：]/g, '')),
    '- 學習焦點：' + L.focus,
    '',
    '## 閱讀理解',
    ...reading.slice(0, 5).map((r, i) => '- Q' + (i + 1) + '（' + r.ability + '）' + r.q.slice(0, 24).replace(/[？?]/g, '')),
    '',
    '## 學習任務',
    '- 讀課文並標記不懂的詞',
    '- 翻完知識卡',
    '- 看結構圖與心智圖',
    '- 完成閱讀引導',
    '- 測驗達 80 分',
    '- 清空格錯題本'
  ].join('\n');
  const guideSrc = raw['sida_' + L.id] || raw['school_' + L.id] || raw['preview_' + L.id] || {};
  return {
    ...L, text, vocab, rhetoric, gist, reading, cards,
    intro: introRaw.slice(0, 900) || ('【自讀提示】' + L.genre + '｜' + L.focus + '。先預測、再提問，讀完用三句話說大意。'),
    mainIdea: mainIdeaMatch ? mainIdeaMatch[0] : '',
    structureImg: jpgData(L.jpg),
    mapsText: clean((raw['maps_' + L.id] || {}).text || '').slice(0, 1600),
    sidaText: clean(guideSrc.text || '').slice(0, 1200),
    markmap: mindmapRoot(md)
  };
});

const extra = EXTRAS.map(E => {
  const text = textForDisplay(T('text_' + E.id));
  const snippets = (text.match(/[^。！？\n]{8,64}[。！？]/g) || []).map(x => x.trim());
  const md = [
    '# ' + E.label + ' ' + E.title,
    '',
    '## 讀之前',
    '- 看標題猜內容：' + E.title,
    '- 先想一個想問的問題',
    '',
    '## 讀的時候',
    ...snippets.slice(0, 3).map((s, i) => '- 段' + (i + 1) + '：' + s.slice(0, 22)),
    '- 圈出人、事、時、地',
    '- 記下不懂的詞',
    '',
    '## 讀完',
    '- 用三句話說大意',
    '- 說出我的想法與理由',
    '- 焦點：' + E.focus,
    '',
    '## 自我檢核',
    '- 我能說出大意',
    '- 我能提出問題',
    '- 我能寫下想法'
  ].join('\n');
  return { ...E, text, reading: genericReading(E), markmap: mindmapRoot(md) };
});

const mindmapAll = mindmapRoot([
  '# ' + CFG.meta.mapTitle,
  '',
  ...lessons.flatMap(L => [
    '## ' + L.label + ' ' + L.title,
    '- 文體：' + L.genre,
    '- 焦點：' + L.focus,
    '- 生字 ' + (zi[L.kb] || '').length + ' 個／語詞 ' + L.vocab.length + ' 條',
    '- 修辭：' + (L.rhetoric[0] ? L.rhetoric[0].name : '—'),
    '- 大意：' + (L.gist.main || '').slice(0, 26).replace(/[。：]/g, '')
  ]),
  '',
  '## 共通學習策略',
  '- 預習：圈詞、預測文體',
  '- 理解：提取訊息 → 推論訊息',
  '- 統整：心智圖、結構表',
  '- 表達：仿寫、一課一練筆'
].join('\n'));

const diagrams = {
  flow: [
    'flowchart LR',
    '  A["1 預習單"] --> B["2 讀課文"]',
    '  B --> C["3 知識卡"]',
    '  C --> D["4 心智圖"]',
    '  D --> E["5 閱讀引導"]',
    '  E --> F["6 自動測驗"]',
    '  F -->|答錯| G["錯題本"]',
    '  G --> F',
    '  F -->|80 分以上| H["7 寫作挑戰"]',
    '  H --> I["完成一課"]'
  ].join('\n'),
  strategy: [
    'flowchart TD',
    '  A["提取訊息<br/>圈出人、事、時、地"] --> B["推論訊息<br/>從句子找心情與原因"]',
    '  B --> C["詮釋整合<br/>說出大意與段落關係"]',
    '  C --> D["比較評估<br/>我同意嗎？為什麼"]',
    '  D --> E["表達<br/>寫下自己的想法"]'
  ].join('\n'),
  state: [
    'stateDiagram-v2',
    '  [*] --> 未開始',
    '  未開始 --> 研讀中: 翻知識卡',
    '  研讀中 --> 練習中: 看心智圖',
    '  練習中 --> 待加強: 正確率 < 80',
    '  待加強 --> 練習中: 重做錯題',
    '  練習中 --> 精熟: 正確率 ≥ 80',
    '  精熟 --> [*]'
  ].join('\n'),
  unit: (CFG.diagrams && CFG.diagrams.unit) || [
    'flowchart LR',
    '  U["' + CFG.meta.unit + '"]',
    ...lessons.map((L, i) => '  U --> L' + i + '["' + L.label + ' ' + L.title + '<br/>' + L.genre + '"]'),
    ...lessons.map((L, i) => '  L' + i + ' --> W["一課一練筆<br/>寫下自己的想法"]')
  ].join('\n'),
  event: (CFG.diagrams && CFG.diagrams.event) || [
    'flowchart LR',
    '  A["看課名與插圖"] --> B["預測內容"]',
    '  B --> C["圈出人事物"]',
    '  C --> D["排出先後順序"]',
    '  D --> E["找出轉折"]',
    '  E --> F["說出結果與感想"]'
  ].join('\n')
};

const quiz = makeQuiz().concat(makeQuizExtra());
const DATA = {
  meta: { book: '康軒版國語四上', unit: CFG.meta.unit, built: new Date().toISOString().slice(0, 10), srcCount: 684, ...CFG.meta },
  lessons, extra, quiz, mindmapAll, diagrams
};

// ---------- assemble single file ----------
const libs = ['d3.min.js', 'markmap-view.js', 'mermaid.min.js']
  .map(f => '<script>' + fs.readFileSync(path.join(here, 'vendor', f), 'utf8') + '</script>')
  .join('\n');
const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let html = fs.readFileSync(path.join(here, 'app.html'), 'utf8');
html = html.replace('__TITLE__', () => escHtml(CFG.meta.title));
html = html.replace('__SUBTITLE__', () => escHtml(CFG.meta.subtitle));
html = html.replace('<!--__LIBS__-->', () => libs);
html = html.replace('/*__DATA__*/', () => 'window.APP_DATA=' + JSON.stringify(DATA) + ';');
const outPath = path.join(here, CFG.out);
fs.writeFileSync(outPath, html, 'utf8');
console.log('config', process.argv[2] || 'book1.config.json');
console.log('lessons', lessons.length, 'extra', extra.length, 'quiz', quiz.length, 'cards', lessons.map(l => l.cards.length).join('/'));
console.log('reading', lessons.map(l => l.reading.length).join('/'), 'maps', lessons.map(l => l.markmap.children.length).join('/'));
console.log('output', (fs.statSync(outPath).size / 1048576).toFixed(2), 'MB ->', outPath);
