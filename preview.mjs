import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'));
const final = path.join(here, process.argv[2] || '國語4上自主學習_第一單元.html');
const src = fs.readFileSync(final, 'utf8');
const at = src.lastIndexOf('</body>');
if (at < 0) throw new Error('no closing body tag');

const views = {
  quiz: `
    document.querySelector('#nav button[data-v="quiz"]').click();
    setTimeout(function(){var o=document.querySelector('#v-quiz [data-opt]');if(o)o.click();},350);
  `,
  cards: `
    document.querySelector('#nav button[data-v="study"]').click();
    setTimeout(function(){var b=document.querySelector('#studyTabs button[data-tab="cards"]');if(b)b.click();},250);
  `,
  progress: `
    document.querySelector('#nav button[data-v="progress"]').click();
  `,
  extra: `
    document.querySelector('#nav button[data-v="extra"]').click();
  `,
  extraMap: `
    document.querySelector('#nav button[data-v="extra"]').click();
    setTimeout(function(){var b=document.querySelector('#extraTabs button[data-xtab="map"]');if(b)b.click();},250);
  `,
  r2cards: `
    document.querySelector('#nav button[data-v="study"]').click();
    setTimeout(function(){
      var t=document.querySelectorAll('#v-study .tabs button[data-lesson]');
      if(t.length)t[t.length-1].click();
      setTimeout(function(){var c=document.querySelector('#studyTabs button[data-tab="cards"]');if(c)c.click();},200);
    },250);
  `,
  zi: `
    document.querySelector('#nav button[data-v="study"]').click();
    setTimeout(function(){
      var c=document.querySelector('#studyTabs button[data-tab="cards"]');if(c)c.click();
      setTimeout(function(){var f=document.querySelector('#studyBody [data-cfilter="生字"]');if(f)f.click();},180);
    },250);
  `,
  pos: `
    document.querySelector('#nav button[data-v="study"]').click();
    setTimeout(function(){
      var c=document.querySelector('#studyTabs button[data-tab="cards"]');if(c)c.click();
      setTimeout(function(){var f=document.querySelector('#studyBody [data-cfilter="語句練習"]');if(f)f.click();},180);
    },250);
  `,
  pos2: `
    document.querySelector('#nav button[data-v="study"]').click();
    setTimeout(function(){
      var t=document.querySelectorAll('#v-study .tabs button[data-lesson]');
      if(t.length>1)t[1].click();
      setTimeout(function(){
        var c=document.querySelector('#studyTabs button[data-tab="cards"]');if(c)c.click();
        setTimeout(function(){var f=document.querySelector('#studyBody [data-cfilter="語句練習"]');if(f)f.click();},180);
      },180);
    },250);
  `
};

for (const [name, code] of Object.entries(views)) {
  const probe = '<style>*{animation:none!important;transition:none!important}</style><script>setTimeout(function(){' + code + '},120);</script>';
  const out = src.slice(0, at) + probe + '\n' + src.slice(at);
  const p = path.join(here, 'preview_' + name + '.html');
  fs.writeFileSync(p, out, 'utf8');
  console.log(name, '->', p, (Buffer.byteLength(out) / 1048576).toFixed(2) + ' MB');
}
