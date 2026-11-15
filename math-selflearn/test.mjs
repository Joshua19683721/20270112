import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const here = 'C:/Users/joshu/AppData/Local/Temp/site/math-selflearn';
const html = fs.readFileSync(path.join(here, '數學4上自主學習_全冊.html'), 'utf8');

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
ok(qa('.ucard').length === 10, '十個單元卡', qa('.ucard').length);
ok(qa('.ucard')[0].getAttribute('data-go') === 'u1', '第一張卡是第 1 單元');
ok(qa('.ucard')[9].getAttribute('data-go') === 'u10', '最後一張卡是第 10 單元');
ok(q('.hero h2') && q('.hero h2').textContent.includes('算錯'), '主視覺標題');
ok(q('#streak').textContent.includes('連續'), '連續天數徽章', q('#streak').textContent);

console.log('== 新增單元結構 ==');
for (const uid of ['u1', 'u2', 'u3', 'u4', 'u5']) {
  const u = window.APP_DATA.UNITS.find(x => x.id === uid);
  ok(!!u, uid + ' 存在');
  ok(u.cards.length === 6, uid + ' 六張知識卡', u.cards.length);
  ok(u.examples.length === 5, uid + ' 五個例題', u.examples.length);
  ok(u.items.length >= 24, uid + ' 至少 24 題', u.items.length);
  ok(u.gens.length === 4, uid + ' 四個生成器', u.gens.length);
  ok(u.tools.length >= 1, uid + ' 至少一個教具', u.tools.length);
  ok(/^u\d+/.test(u.items[0].id), uid + ' 題號前綴正確', u.items[0].id);
}
const allIds = new Set();
let dup = 0;
window.APP_DATA.UNITS.forEach(u => u.items.forEach(i => { if (allIds.has(i.id)) dup++; allIds.add(i.id); }));
ok(dup === 0, '題號沒有重複', dup);

console.log('== 知識卡 ==');
await nav('#/u6/cards');
ok(qa('.kcard').length === 6, '第6單元 6 張卡', qa('.kcard').length);
q('.kcard .khead').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('.kcard').classList.contains('open'), '點標題展開');
q('.kcard [data-read]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('.kcard').classList.contains('read'), '標記已讀');
const store = JSON.parse(window.localStorage.getItem('math_selflearn_u1_10_v1'));
ok(store.read['u6:c1'] === true, '已讀寫入 localStorage');

console.log('== 練習：答錯 ==');
await nav('#/u1/quiz');
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
const st2 = JSON.parse(window.localStorage.getItem('math_selflearn_u1_10_v1'));
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
const st3 = JSON.parse(window.localStorage.getItem('math_selflearn_u1_10_v1'));
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
ok(genBad === 0, Object.keys(GEN).length + ' 個生成器各 60 次', genBad + ' 個問題');

console.log('== 生成器答案驗算 ==');
const POSN = { '個位': 0, '十位': 1, '百位': 2, '千位': 3, '萬位': 4, '十萬位': 5, '百萬位': 6, '千萬位': 7, '億位': 8 };
function expectGen(it) {
  const s = it.stem, m = null;
  if (it.type === 'choice') {
    if ((s.match(/^比較大小：(\d+) 　□　 (\d+)$/))) {
      const mm = s.match(/^比較大小：(\d+) 　□　 (\d+)$/);
      const a = +mm[1], b = +mm[2];
      return [a > b ? '＞' : (a < b ? '＜' : '＝')];
    }
    if ((s.match(/^比較大小：(\d+) 公里 (\d+) 公尺 　□　 (\d+) 公尺$/))) {
      const mm = s.match(/^比較大小：(\d+) 公里 (\d+) 公尺 　□　 (\d+) 公尺$/);
      const a = +mm[1] * 1000 + +mm[2], b = +mm[3];
      return [a > b ? '＞' : (a < b ? '＜' : '＝')];
    }
    if ((s.match(/^一個角是 (\d+)°，它是哪一種角？$/))) {
      const d = +s.match(/^一個角是 (\d+)°，它是哪一種角？$/)[1];
      return [d < 90 ? '銳角' : (d === 90 ? '直角' : (d < 180 ? '鈍角' : '平角'))];
    }
    return null;
  }
  let mm;
  if ((mm = s.match(/^(\d+) × (\d+) ＝ \( 1 \)$/))) return [String(+mm[1] * +mm[2])];
  if ((mm = s.match(/^(\d+) ＋ (\d+) ＝ \( 1 \)$/))) return [String(+mm[1] + +mm[2])];
  if ((mm = s.match(/^(\d+) － (\d+) ＝ \( 1 \)$/))) return [String(+mm[1] - +mm[2])];
  if ((mm = s.match(/^在 (\d+) 中，(\d) 在(.+?)，表示 \( 1 \)。$/))) return [String(+mm[2] * Math.pow(10, POSN[mm[3]]))];
  if ((mm = s.match(/^(\d+) ÷ (\d+) 的商是 \( 1 \)，餘數是 \( 2 \)。$/))) return [String(Math.floor(+mm[1] / +mm[2])), String(+mm[1] % +mm[2])];
  if ((mm = s.match(/除數是 (\d+)、商是 (\d+)、餘數是 (\d+)，被除數是 \( 1 \)。/))) return [String(+mm[1] * +mm[2] + +mm[3])];
  if ((mm = s.match(/^(\d+) 公里＝\( 1 \) 公尺。$/))) return [String(+mm[1] * 1000)];
  if ((mm = s.match(/^(\d+) 公尺＝\( 1 \) 公里。$/))) return [String(+mm[1] / 1000)];
  if ((mm = s.match(/^(\d+) 公尺＝\( 1 \) 公里 \( 2 \) 公尺。$/))) return [String(Math.floor(+mm[1] / 1000)), String(+mm[1] % 1000)];
  if ((mm = s.match(/^(\d+) 公里 (\d+) 公尺＋(\d+) 公里 (\d+) 公尺＝\( 1 \) 公里 \( 2 \) 公尺。$/))) {
    const t = +mm[1] * 1000 + +mm[2] + +mm[3] * 1000 + +mm[4];
    return [String(Math.floor(t / 1000)), String(t % 1000)];
  }
  if ((mm = s.match(/^(\d+) 公里 (\d+) 公尺－(\d+) 公里 (\d+) 公尺＝\( 1 \) 公里 \( 2 \) 公尺。$/))) {
    const t = (+mm[1] * 1000 + +mm[2]) - (+mm[3] * 1000 + +mm[4]);
    return [String(Math.floor(t / 1000)), String(t % 1000)];
  }
  if ((mm = s.match(/^鐘面上，分針從 (\d+) 順時針走到 (\d+)，轉了 \( 1 \) 度。$/))) {
    const steps = ((+mm[2] - +mm[1]) + 12) % 12;
    return [String(steps * 30)];
  }
  if ((mm = s.match(/^∠A＝(\d+)°，∠B＝(\d+)°，兩角合起來是 \( 1 \) 度。$/))) return [String(+mm[1] + +mm[2])];
  if ((mm = s.match(/^(直角|平角)扣掉 (\d+)° 的角，剩下 \( 1 \) 度。$/))) return [String((mm[1] === '直角' ? 90 : 180) - +mm[2])];
  if ((mm = s.match(/合起來是 \( 1 \)。$/))) {
    const pmap = { '千萬': 1e7, '百萬': 1e6, '十萬': 1e5, '萬': 1e4 };
    const re = /(\d+) 個(千萬|百萬|十萬|萬)/g;
    let total = 0, hit = 0, t;
    while ((t = re.exec(s))) { total += +t[1] * pmap[t[2]]; hit++; }
    if (hit) return [String(total)];
  }
  return null;
}
let genAnsBad = 0, genChecked = 0;
for (const k of Object.keys(GEN)) {
  for (let i = 0; i < 40; i++) {
    const it = GEN[k]();
    const exp = expectGen(it);
    if (!exp) continue;
    genChecked++;
    if (JSON.stringify(exp) !== JSON.stringify(it.ans)) {
      genAnsBad++;
      console.log('  FAIL ' + k + ' 期望 ' + JSON.stringify(exp) + ' 實得 ' + JSON.stringify(it.ans) + ' ｜ ' + it.stem);
      break;
    }
  }
}
ok(genAnsBad === 0, '生成器答案驗算 ' + genChecked + ' 題', genAnsBad + ' 題不符');

console.log('== 生成器 ==');
await nav('#/u1/quiz');
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
const stGen = JSON.parse(window.localStorage.getItem('math_selflearn_u1_10_v1'));
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

console.log('== 新增教具 ==');
await nav('#/u1/tools');
ok(!!q('#bpi'), '大數定位板輸入');
q('#bpi').value = '23264640';
q('#bpi').dispatchEvent(new window.Event('input', { bubbles: true }));
ok(q('#bpo').textContent.includes('二千三百二十六萬四千六百四十'), '大數讀法', q('#bpo').textContent.slice(0, 60));

await nav('#/u2/tools');
ok(!!q('#mxa'), '乘法拆解器');
q('#mxa').value = '47'; q('#mxb').value = '38';
q('#mxgo').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('#mxo').textContent.includes('1786'), '乘法拆解結果', q('#mxo').textContent.slice(0, 60));

await nav('#/u3/tools');
ok(!!q('#ang'), '角度探索器');
q('#ang').value = '100';
q('#ang').dispatchEvent(new window.Event('input', { bubbles: true }));
ok(q('#anginfo').textContent.includes('鈍角'), '角度分類', q('#anginfo').textContent.slice(0, 40));

await nav('#/u4/tools');
ok(!!q('#dva'), '除法拆解器');
q('#dva').value = '253'; q('#dvb').value = '36';
q('#dvgo').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('#dvo').textContent.includes('餘 1'), '除法商與餘數', q('#dvo').textContent.slice(0, 80));

await nav('#/u5/tools');
ok(!!q('#kmk'), '公里換算器');
q('#kmk').value = '2'; q('#kmm').value = '500';
q('#kmgo').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok(q('#kmo').textContent.includes('2500'), '公里換算結果', q('#kmo').textContent.slice(0, 60));

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
