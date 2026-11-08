import fs from 'fs';
import { JSDOM } from 'jsdom';

const here = 'C:/Users/joshu/WorkBuddy AI/tempfolder/math-selflearn';
const html = fs.readFileSync(here + '/數學4上自主學習_期中後.html', 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true
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
async function nav(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await wait(30);
}

await wait(200);

console.log('== 首頁 ==');
ok(qa('.ucard').length === 5, '五個單元卡', qa('.ucard').length);
ok(q('.hero h2') && q('.hero h2').textContent.includes('算錯'), '主視覺標題');
ok(q('#streak').textContent.includes('連續'), '連續天數徽章', q('#streak').textContent);

console.log('== 知識卡 ==');
await nav('#/u6/cards');
ok(qa('.kcard').length === 6, '第6單元 6 張卡', qa('.kcard').length);
q('.kcard .khead').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('.kcard').classList.contains('open'), '點標題展開');
q('.kcard [data-read]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('.kcard').classList.contains('read'), '標記已讀');
const store = JSON.parse(window.localStorage.getItem('math_selflearn_u6_10_v1'));
ok(store.read['u6:c1'] === true, '已讀寫入 localStorage');

console.log('== 練習：答錯 ==');
await nav('#/u6/quiz');
ok(!!q('.qcard'), '題目卡出現');
const stem = q('.qstem').textContent;
const inputs = qa('input.blank');
ok(inputs.length >= 1, '有作答格', inputs.length);
inputs.forEach(i => { i.value = '999'; });
q('#check').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
ok(!!q('.fb.no'), '答錯顯示紅色回饋');
ok(qa('.sol .solrow').length >= 1, '顯示分步解析', qa('.sol .solrow').length);
ok(!!q('.err'), '顯示錯因');
const st2 = JSON.parse(window.localStorage.getItem('math_selflearn_u6_10_v1'));
ok(Object.keys(st2.wrong).length === 1, '錯題寫入錯題本', Object.keys(st2.wrong).length);

console.log('== 練習：答對 ==');
q('#next').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
const it = window.APP_DATA.UNITS[0].items[1];
const ins2 = qa('input.blank');
ok(ins2.length === it.ans.length, '下一題格數正確', ins2.length + ' vs ' + it.ans.length);
ins2.forEach((x, i) => { x.value = it.ans[i]; });
q('#check').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
ok(!!q('.fb.ok'), '答對顯示綠色回饋');
const st3 = JSON.parse(window.localStorage.getItem('math_selflearn_u6_10_v1'));
ok(st3.done[it.id] && st3.done[it.id].ok, '答對寫入紀錄');

console.log('== 等價答案 ==');
const cmp = window.__MATH__.cmp;
const eqCases = [
  ['9950000', '9950000', true],
  ['9,950,000', '9950000', true],
  ['１８０', '180', true],
  ['70度', '70', true],
  ['1又5/8', '1 5/8', true],
  ['13/8', '1 5/8', true],
  ['0.5', '0.50', true],
  ['＞', '>', true],
  ['3.50', '3.5', true],
  ['abc', '180', false],
  ['', '180', false]
];
let eqBad = 0;
for (const [u, a, want] of eqCases) {
  const got = cmp(u, a);
  if (got !== want) { eqBad++; console.log('  FAIL cmp(' + JSON.stringify(u) + ',' + JSON.stringify(a) + ') = ' + got); }
}
ok(eqBad === 0, '等價寫法判定 ' + eqCases.length + ' 例', eqBad + ' 個錯');

console.log('== 生成器正確性 ==');
const GEN = window.__MATH__.gen;
let genBad = 0;
for (const k of Object.keys(GEN)) {
  for (let i = 0; i < 60; i++) {
    const it = GEN[k]();
    if (!it || !it.stem || !it.ans || !it.ans.length || !it.sol || !it.sol.length) {
      genBad++; console.log('  FAIL ' + k + ' 結構不完整'); break;
    }
    if (it.ans.some(a => a === '' || a === 'NaN' || /NaN|undefined/.test(a))) {
      genBad++; console.log('  FAIL ' + k + ' 答案異常：' + JSON.stringify(it.ans)); break;
    }
    if (it.type === 'choice' && !it.opts.includes(it.ans[0])) {
      genBad++; console.log('  FAIL ' + k + ' 選項不含答案：' + it.ans[0]); break;
    }
    if (it.type === 'fill') {
      const n = (it.stem.match(/\( \d+ \)/g) || []).length;
      if (n !== it.ans.length) { genBad++; console.log('  FAIL ' + k + ' 空格數不符 ' + n + '/' + it.ans.length + ' ' + it.stem); break; }
    }
    if (/NaN|undefined|Infinity/.test(it.stem)) { genBad++; console.log('  FAIL ' + k + ' 題幹異常：' + it.stem); break; }
  }
}
ok(genBad === 0, '15 個生成器各 60 次', genBad + ' 個問題');

console.log('== 生成器 ==');
await nav('#/u6/quiz');
qa('[data-mode]').find(b => b.dataset.mode === 'gen').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
const gens = qa('.genbtn');
ok(gens.length === 4, '四個生成器', gens.length);
gens[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
ok(!!q('#qslot .qcard'), '生成題目出現');
ok(q('.qstem').textContent.length > 5, '生成題目有題幹');
const gi = qa('input.blank');
gi.forEach(x => { x.value = '999'; });
q('#check').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(20);
const stGen = JSON.parse(window.localStorage.getItem('math_selflearn_u6_10_v1'));
ok(stGen.gen.n === 1, '生成題計數', stGen.gen.n);
ok(Object.keys(stGen.wrong).length === 1, '生成題不污染錯題本', Object.keys(stGen.wrong).length);

console.log('== 切換單元 ==');
await nav('#/u7/quiz');
ok(!!q('.qcard'), '第7單元練習載入');
ok(q('.qstem').textContent.includes('0.') || q('.qstem').textContent.includes('小數') || q('.qstem').textContent.includes('公尺'), '第7單元題目正確', q('.qstem').textContent.slice(0, 30));

console.log('== 錯題本 ==');
await nav('#/wrong');
ok(qa('.wrow').length === 1, '錯題本 1 題', qa('.wrow').length);

console.log('== 成就 ==');
await nav('#/ach');
ok(qa('.ach').length === 10, '十個成就', qa('.ach').length);

console.log('== 教具 ==');
await nav('#/u6/tools');
ok(!!q('#ta'), '三角形教具滑桿');
q('#ta').value = '90';
q('#ta').dispatchEvent(new window.Event('input', { bubbles: true }));
ok(q('#tinfo').textContent.includes('180'), '內角和顯示');

await nav('#/u8/tools');
ok(!!q('#oei'), '四則拆解器');
ok(q('#oeo').textContent.includes('答案'), '拆解結果', q('#oeo').textContent.slice(0, 40));

await nav('#/u9/tools');
ok(!!q('#fn'), '分數板');
ok(q('#finfo').textContent.includes('真分數'), '分數分類', q('#finfo').textContent.slice(0, 40));

await nav('#/u10/tools');
ok(!!q('#cd'), '統計圖產生器');
ok(!!q('#cdo svg'), '長條圖繪出');

console.log('== 例題 ==');
await nav('#/u10/ex');
ok(qa('.excard').length === 3, '第10單元 3 個例題', qa('.excard').length);
ok(!!q('.chartbox svg'), '例題圖表繪出');

console.log('\nJS errors captured: ' + errs.length);
errs.slice(0, 8).forEach(e => console.log('  ! ' + e));
