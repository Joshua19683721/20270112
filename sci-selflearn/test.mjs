import fs from 'fs';
import { JSDOM } from 'jsdom';

const here = 'C:/Users/joshu/WorkBuddy AI/tempfolder/sci-selflearn';
const html = fs.readFileSync(here + '/自然4上自主學習_期中後.html', 'utf8');
const KEY = 'sci_selflearn_u3_4_v1';

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(w) {
    // jsdom 缺這兩個 API：structuredClone 讓 mermaid 無法初始化、ResizeObserver 讓部分佈局失敗
    w.structuredClone = o => JSON.parse(JSON.stringify(o));
    w.ResizeObserver = class { observe() { } unobserve() { } disconnect() { } };
  }
});
const { window } = dom;
const { document } = window;

const errs = [];
window.addEventListener('error', e => errs.push('window.error: ' + (e.message || e.error)));

function q(s) { return document.querySelector(s); }
function qa(s) { return Array.from(document.querySelectorAll(s)); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function ok(cond, name, extra) {
  if (cond) console.log('  PASS ' + name);
  else { console.log('  FAIL ' + name + (extra ? ' → ' + extra : '')); errs.push(name); }
}
function click(el) { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }
function setVal(el, v) {
  el.value = v;
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
}
async function nav(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await wait(40);
}
function store() { return JSON.parse(window.localStorage.getItem(KEY) || '{}'); }

await wait(300);

console.log('== 資料完整性 ==');
const D = window.APP_DATA;
ok(D.UNITS.length === 2, '兩個單元', D.UNITS.length);
let itemN = 0, cardN = 0, exN = 0, blankMismatch = [];
for (const u of D.UNITS) {
  itemN += u.items.length; cardN += u.cards.length; exN += u.examples.length;
  const ids = new Set();
  for (const it of u.items) {
    if (ids.has(it.id)) blankMismatch.push('重複 id ' + it.id);
    ids.add(it.id);
    if (!it.stem || !it.ans || !it.ans.length) blankMismatch.push(it.id + ' 缺欄位');
    if (!it.sol || !it.sol.length) blankMismatch.push(it.id + ' 缺解析');
    if (it.type === 'fill') {
      const n = (it.stem.match(/\( \d+ \)/g) || []).length;
      if (n !== it.ans.length) blankMismatch.push(it.id + ' 空格 ' + n + '≠答案 ' + it.ans.length);
    }
    if (it.type === 'choice') {
      if (!it.opts || it.opts.length !== 4) blankMismatch.push(it.id + ' 選項數 ' + (it.opts || []).length);
      if (!it.opts.includes(it.ans[0])) blankMismatch.push(it.id + ' 選項不含答案');
    }
    if (it.type === 'tf' && !['○', '×'].includes(it.ans[0])) blankMismatch.push(it.id + ' 是非答案異常 ' + it.ans[0]);
  }
  ok(!!u.mindmap && u.mindmap.split('\n').length > 8, u.name + ' 概念圖節點 ' + u.mindmap.split('\n').length);
  ok(!!u.flow && u.flow.startsWith('flowchart'), u.name + ' 流程圖');
  ok(u.tools.length === 4, u.name + ' 四個教具', u.tools.length);
  ok(u.gens.length === 5, u.name + ' 五個生成器', u.gens.length);
}
ok(itemN === 60, '題目總數 60', itemN);
ok(cardN === 16, '知識卡 16', cardN);
ok(exN === 10, '例題 10', exN);
ok(blankMismatch.length === 0, '題目結構檢查', blankMismatch.slice(0, 5).join(' / '));

console.log('== 首頁 ==');
ok(qa('.ucard').length === 2, '兩個單元卡', qa('.ucard').length);
ok(q('.hero h2') && q('.hero h2').textContent.includes('背答案'), '主視覺標題');
ok(q('#streak').textContent.includes('連續'), '連續天數徽章', q('#streak').textContent);

console.log('== 概念圖 ==');
await nav('#/u3/map');
ok(typeof window.markmap === 'object' && typeof window.mermaid === 'object', 'd3/markmap/mermaid 已載入');
ok(!!q('.mmwrap') && !!q('#mmd'), '概念圖與流程圖容器存在');
ok(q('.codes').textContent.includes('INe-Ⅱ-5'), '學習內容代碼');
// jsdom 沒有 SVG 排版（缺 getBBox / getTransform.baseVal），改驗證 mermaid 語法正確，
// 實際繪製結果由 headless Chrome 截圖驗證
let flowBad = 0;
for (const u of D.UNITS) {
  try { await window.mermaid.parse(u.flow); }
  catch (e) { flowBad++; console.log('  FAIL ' + u.id + ' 流程圖語法：' + String(e.message || e).slice(0, 120)); }
}
ok(flowBad === 0, '兩個流程圖語法正確');

console.log('== 知識卡 ==');
await nav('#/u3/cards');
ok(qa('.kcard').length === 8, '第3單元 8 張卡', qa('.kcard').length);
click(q('.kcard .khead'));
ok(q('.kcard').classList.contains('open'), '點標題展開');
click(q('.kcard [data-read]'));
ok(q('.kcard').classList.contains('read'), '標記已讀');
ok(store().read['u3:c1'] === true, '已讀寫入 localStorage');

console.log('== 是非題作答 ==');
await nav('#/u3/quiz');
ok(!!q('.qcard'), '題目卡出現');
let it = D.UNITS[0].items[0];
ok(it.type === 'tf', '第一題是非', it.type);
click(qa('.opt')[it.ans[0] === '○' ? 0 : 1]);
click(q('#check'));
await wait(30);
ok(!!q('.fb.ok'), '答對顯示綠色回饋', q('.qfb').textContent.slice(0, 30));
ok(store().done[it.id] && store().done[it.id].ok, '答對寫入紀錄');

console.log('== 答錯與錯題本 ==');
click(q('#next'));
await wait(30);
it = D.UNITS[0].items[1];
click(qa('.opt')[it.ans[0] === '○' ? 1 : 0]);
click(q('#check'));
await wait(30);
ok(!!q('.fb.no'), '答錯顯示紅色回饋');
ok(qa('.sol .solrow').length >= 1, '顯示分步解析', qa('.sol .solrow').length);
ok(!!q('.err'), '顯示錯因');
ok(Object.keys(store().wrong).length === 1, '錯題寫入錯題本', Object.keys(store().wrong).length);

console.log('== 填空題批改 ==');
function curIndex() { return parseInt(q('.qbar span').textContent.match(/第 (\d+) \//)[1], 10) - 1; }
let guard = 0;
while (D.UNITS[0].items[curIndex()].type !== 'fill' && guard++ < 40) {
  click(q('#next')); await wait(5);
}
const fill = D.UNITS[0].items[curIndex()];
ok(fill.type === 'fill', '走到填空題（' + fill.id + '）', fill.type);
ok(qa('input.blank').length === fill.ans.length, '填空題格數正確', qa('input.blank').length + '/' + fill.ans.length);
qa('input.blank').forEach((x, i) => { x.value = fill.ans[i]; });
click(q('#check'));
await wait(30);
ok(!!q('.fb.ok'), '填空答對（' + fill.ans.join('、') + '）', q('.qfb').textContent.slice(0, 40));

console.log('== 等價答案 ==');
const cmp = window.__SCI__.cmp;
const eqCases = [
  ['○', '○', true, null],
  ['O', '○', true, null],
  ['0', '○', true, null],
  ['〇', '○', true, null],
  ['X', '×', true, null],
  ['╳', '×', true, null],
  ['小', '小', true, null],
  [' 小 ', '小', true, null],
  ['小。', '小', true, null],
  ['較小', '小', true, ['小', '較小']],
  ['大', '小', false, null],
  ['固體', '固體', true, null],
  ['液體', '固體', false, null],
  ['水', '液體', true, ['液體', '水']],
  ['通路', '通路', true, null],
  ['通路。', '通路', true, null],
  ['斷路', '通路', false, null],
  ['', '通路', false, null],
  ['良導體', '良導體', true, null],
  ['絕緣體', '不良導體', true, ['不良導體', '絕緣體']],
  ['台', '臺', true, null]
];
let eqBad = 0;
for (const [u, a, want, alts] of eqCases) {
  const got = cmp(u, a, alts || []);
  if (got !== want) { eqBad++; console.log('  FAIL cmp(' + JSON.stringify(u) + ',' + JSON.stringify(a) + ') = ' + got); }
}
ok(eqBad === 0, '等價寫法判定 ' + eqCases.length + ' 例', eqBad + ' 個錯');

console.log('== 生成器正確性 ==');
const GEN = window.__SCI__.gen;
let genBad = 0;
for (const k of Object.keys(GEN)) {
  for (let i = 0; i < 60; i++) {
    const g = GEN[k]();
    if (!g || !g.stem || !g.ans || !g.ans.length || !g.sol || !g.sol.length) {
      genBad++; console.log('  FAIL ' + k + ' 結構不完整'); break;
    }
    if (g.ans.some(a => !a || /NaN|undefined|null/.test(a))) {
      genBad++; console.log('  FAIL ' + k + ' 答案異常：' + JSON.stringify(g.ans)); break;
    }
    if (g.type === 'choice' && !g.opts.includes(g.ans[0])) {
      genBad++; console.log('  FAIL ' + k + ' 選項不含答案：' + g.ans[0] + ' / ' + JSON.stringify(g.opts)); break;
    }
    if (g.type === 'fill') {
      const n = (g.stem.match(/\( \d+ \)/g) || []).length;
      if (n !== g.ans.length) { genBad++; console.log('  FAIL ' + k + ' 空格數不符 ' + n + '/' + g.ans.length + ' ' + g.stem); break; }
    }
    if (/NaN|undefined|Infinity/.test(g.stem + g.sol.join(''))) {
      genBad++; console.log('  FAIL ' + k + ' 文字異常：' + g.stem); break;
    }
  }
}
ok(genBad === 0, Object.keys(GEN).length + ' 個生成器各 60 次', genBad + ' 個問題');

console.log('== 生成器 UI ==');
await nav('#/u4/quiz');
click(qa('[data-mode]').find(b => b.dataset.mode === 'gen'));
await wait(30);
const gens = qa('.genbtn');
ok(gens.length === 5, '五個生成器按鈕', gens.length);
click(gens[0]);
await wait(30);
ok(!!q('#qslot .qcard'), '生成題目出現');
ok(q('.qstem').textContent.length > 5, '生成題目有題幹');
const before = Object.keys(store().wrong).length;
if (q('input.blank')) { q('input.blank').value = '亂寫'; }
else { click(qa('.opt')[0]); }
click(q('#check'));
await wait(30);
ok(store().gen.n >= 1, '生成題計數', store().gen.n);
ok(Object.keys(store().wrong).length === before, '生成題不污染錯題本');

console.log('== 切換單元不殘留 ==');
await nav('#/u4/quiz');
click(qa('[data-mode]').find(b => b.dataset.mode === 'bank'));
await wait(30);
ok(!!q('.qcard'), '第4單元練習載入');
ok(q('.qstem').textContent.length > 5, '第4單元題目', q('.qstem').textContent.slice(0, 30));
ok(q('.qbar span').textContent.includes('/ 30'), '第4單元 30 題', q('.qbar span').textContent);

console.log('== 教具：第3單元 ==');
await nav('#/u3/tools');
ok(!!q('#sd'), '橡皮筋教具滑桿');
setVal(q('#sd'), '6');
ok(q('#sinfo').textContent.includes('大'), '振動大 → 聲音大', q('#sinfo').textContent.slice(0, 30));
ok(!!q('#ssvg svg'), '振動波形繪出');
ok(!!q('#sx'), '光源與影子教具');
setVal(q('#sx'), '450');
ok(q('#hinfo').textContent.includes('左側'), '光源在右 → 影子在左側', q('#hinfo').textContent.slice(0, 30));
setVal(q('#sx'), '90');
ok(q('#hinfo').textContent.includes('右側'), '光源在左 → 影子在右側', q('#hinfo').textContent.slice(0, 30));
ok(!!q('#hsvg svg'), '影子圖繪出');
ok(!!q('#ra'), '反射教具');
setVal(q('#ra'), '60');
ok(q('#rinfo').textContent.includes('60'), '入射角=反射角', q('#rinfo').textContent.slice(0, 40));
ok(qa('#spool .chipb').length > 0, '聲光分類池有項目', qa('#spool .chipb').length);
const chip0 = qa('#spool .chipb')[0];
click(chip0);
await wait(20);
ok(qa('#swarn .sortitem').length + qa('#sfun .sortitem').length === 1, '分類後進入欄位');

console.log('== 教具：第4單元 ==');
await nav('#/u4/tools');
ok(!!q('#csw') && !!q('#cit'), '電路教具下拉');
setVal(q('#csw'), '1');
setVal(q('#cit'), '0');
ok(q('#cinfo').textContent.includes('通路'), '銅線 → 通路', q('#cinfo').textContent.slice(0, 30));
ok(q('#csv svg') !== null, '電路圖繪出');
const opts = qa('#cit option');
const eraser = opts.findIndex(o => o.textContent.includes('橡皮擦'));
setVal(q('#cit'), String(eraser));
ok(q('#cinfo').textContent.includes('斷路'), '橡皮擦 → 斷路', q('#cinfo').textContent.slice(0, 30));
setVal(q('#csw'), '0');
ok(q('#cinfo').textContent.includes('斷路'), '開關打開 → 斷路');
ok(!!q('#sb') && !!q('#sl'), '串並聯教具');
setVal(q('#sb'), 's');
setVal(q('#sl'), '1');
ok(q('#sinfo3').textContent.includes('比較亮'), '電池串聯 → 比較亮', q('#sinfo3').textContent.slice(0, 40));
setVal(q('#sl'), 's');
ok(q('#sinfo3').textContent.includes('和平常一樣'), '電池串聯+燈泡串聯 → 差不多', q('#sinfo3').textContent.slice(0, 40));
ok(!!q('#mp'), '馬達教具');
setVal(q('#mp'), '-1');
ok(q('#minfo').textContent.includes('順時針'), '反接 → 順時針', q('#minfo').textContent.slice(0, 40));
ok(qa('.safeitem').length === 8, '用電安全 8 項', qa('.safeitem').length);
click(qa('.safeitem')[0]);
await wait(20);
ok(q('.safeitem').classList.contains('no'), '錯誤行為標紅');

console.log('== 例題 ==');
await nav('#/u3/ex');
ok(qa('.excard').length === 5, '第3單元 5 個例題', qa('.excard').length);
ok(qa('.excard .exstep').length >= 10, '例題分步');
click(q('.excard [data-exdone]'));
ok(store().ex['e1'] === true, '例題紀錄');

console.log('== 錯題本 ==');
await nav('#/wrong');
ok(qa('.wrow').length === 1, '錯題本 1 題', qa('.wrow').length);
click(q('.wrow [data-clear]'));
await wait(20);
ok(qa('.wrow').length === 0, '移除後清空');

console.log('== 成就 ==');
await nav('#/ach');
ok(qa('.ach').length === 10, '十個成就', qa('.ach').length);

console.log('== 離線檢查 ==');
const ext = (html.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/gi) || []);
const cssImport = (html.match(/@import\s+url\(\s*["']?https?:\/\//gi) || []);
const fetchExt = (html.match(/fetch\(\s*["']https?:\/\//gi) || []);
ok(ext.length + cssImport.length + fetchExt.length === 0, '無外部資源引用（src/href/@import/fetch）',
  ext.slice(0, 2).concat(cssImport, fetchExt).join(' '));

console.log('\nJS errors captured: ' + errs.length);
errs.slice(0, 10).forEach(e => console.log('  ! ' + e));
