import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] || '國語4上自主學習_第一單元.html';
const src = fs.readFileSync(path.join(here, target), 'utf8');
const probe = `
<div id="TESTOUT" style="display:none"></div>
<script>
(function(){
var R={};
function rec(k,v){R[k]=v;}
function txt(){document.getElementById('TESTOUT').textContent=JSON.stringify(R);}
try{
 rec('appOk', !!window.__APP_OK__);
 rec('dataLessons', window.APP_DATA.lessons.length);
 rec('dataQuiz', window.APP_DATA.quiz.length);
 rec('dataExtra', window.APP_DATA.extra.length);
 rec('metaTitle', document.title);
 rec('metaSubtitle', (document.querySelector('header .logo p')||{}).textContent);
 rec('storageKey', window.APP_DATA.meta.storageKey);
 rec('navExtraVisible', document.getElementById('navExtra').style.display!=='none');
 rec('dbg', (document.getElementById('dbg').textContent||'').slice(0,300));
 rec('homeMermaid', document.querySelectorAll('#v-home .mermaid[data-processed]').length);
 rec('homeMermaidTotal', document.querySelectorAll('#v-home .mermaid').length);
 rec('homeMarkmapNodes', document.querySelectorAll('#homeMap .markmap-node').length);
 rec('homeSvg', document.querySelectorAll('#v-home svg').length);

 function nav(v){document.querySelector('#nav button[data-v="'+v+'"]').click();}
 nav('quiz');
 rec('quizOpts', document.querySelectorAll('#qArea .opt').length);
 rec('quizStem', (document.querySelector('#qArea .qstem')||{}).textContent ? 'yes':'no');
 var o=document.querySelector('#qArea .opt'); if(o)o.click();
 rec('afterAnswerExplain', document.querySelectorAll('#qArea .explain').length);
 rec('afterAnswerWhy', document.querySelectorAll('#qArea .why').length);

 nav('study');
 rec('studyTabs', document.querySelectorAll('#studyTabs button').length);
 var t=document.querySelector('#studyTabs button[data-tab="map"]'); if(t)t.click();
 rec('lessonMapNodes', document.querySelectorAll('#lessonMap .markmap-node').length);
 rec('studyMermaid', document.querySelectorAll('#v-study .mermaid[data-processed]').length);
 var tc=document.querySelector('#studyTabs button[data-tab="cards"]'); if(tc)tc.click();
 rec('cards', document.querySelectorAll('#studyBody .kcard').length);
 rec('posLegend', document.querySelectorAll('#studyBody .poslegend').length);
 rec('posRows', document.querySelectorAll('#studyBody .posline').length);
 rec('posLabels', document.querySelectorAll('#studyBody .posline .pos').length);
 rec('posSeps', document.querySelectorAll('#studyBody .posline .possep').length);
 rec('posRawLeft', (((document.querySelector('#studyBody .grid')||{textContent:''}).textContent||'').match(/[（(](名詞|動詞|形容詞|副詞|疊字副詞)[）)]/g)||[]).length);
 rec('posSpanLeak', (document.querySelector('#studyBody .grid')||{textContent:''}).textContent.indexOf('<span')>=0);
 rec('senseRows', document.querySelectorAll('#studyBody .senses .sense').length);
 rec('sensePosLabels', document.querySelectorAll('#studyBody .senses .pos').length);
 rec('senseSeps', document.querySelectorAll('#studyBody .senses .ssep').length);
 rec('senseBadges', document.querySelectorAll('#studyBody .b .snum').length);
 rec('senseIncomplete', Array.from(document.querySelectorAll('#studyBody .senses .sense')).filter(function(x){return !x.querySelector('.pos')||!x.querySelector('.ssep');}).length);
 // 只檢查純文字卡片內文；排除「⑴形容…」這種正好以詞性字開頭的普通詞。
 rec('bodyRawPos', (Array.from(document.querySelectorAll('#studyBody .kcard .b')).map(function(x){return x.textContent||'';}).join(' ').match(/[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽][名動形副代量連助摹](?!容詞|詞)/g)||[]).length);
 rec('sentCards', Array.from(document.querySelectorAll('#studyBody .kcard .tag')).filter(function(x){return x.textContent==='語句練習';}).length);
 var kb=document.querySelector('#studyBody .kcard [data-known]'); if(kb)kb.click();
 rec('cardMarked', document.querySelectorAll('#studyBody .kcard.done').length);
 var tr=document.querySelector('#studyTabs button[data-tab="read"]'); if(tr)tr.click();
 rec('readSteps', document.querySelectorAll('#studyBody .stepbox').length);
 rec('readMermaid', document.querySelectorAll('#v-study .mermaid[data-processed]').length);

 nav('wrong');
 rec('wrongView', document.querySelectorAll('#v-wrong .panel').length);
 rec('wrongMermaid', document.querySelectorAll('#v-wrong .mermaid[data-processed]').length);

 nav('extra');
 rec('extraTabs', document.querySelectorAll('#extraTabs button').length);
 rec('extraTextLen', ((document.querySelector('#extraBody pre.text')||{}).textContent||'').length);
 var xm=document.querySelector('#extraTabs button[data-xtab="map"]'); if(xm)xm.click();
 rec('extraMapNodes', document.querySelectorAll('#extraMap .markmap-node').length);
 var xr=document.querySelector('#extraTabs button[data-xtab="read"]'); if(xr)xr.click();
 rec('extraReadSteps', document.querySelectorAll('#extraBody .stepbox').length);
 var xd=document.querySelector('#extraTabs button[data-xtab="text"]'); if(xd)xd.click();
 var xdone=document.querySelector('#extraBody [data-xdone]'); if(xdone)xdone.click();
 rec('extraDone', !!window.APP_DATA.extra.length && !!document.querySelector('#extraBody .btn.teal'));

 nav('progress');
 rec('progressTables', document.querySelectorAll('#v-progress table').length);
 rec('ach', document.querySelectorAll('#v-progress .ach div').length);
 function visit(v,tab,key,next){
   nav(v);
   if(tab){var b=document.querySelector('#studyTabs button[data-tab="'+tab+'"]');if(b)b.click();}
   setTimeout(function(){
     var all=document.querySelectorAll('#v-'+v+' .mermaid').length;
     var done=document.querySelectorAll('#v-'+v+' .mermaid[data-processed]').length;
     rec(key, done+'/'+all);
     rec(key+'_svg', document.querySelectorAll('#v-'+v+' .mermaid svg').length);
     next();
   },700);
 }
 visit('study','map','mmStudyMap',function(){
   visit('study','read','mmStudyRead',function(){
     visit('extra',null,'mmExtra',function(){
       visit('wrong',null,'mmWrong',function(){
         visit('progress',null,'mmProgress',function(){
           rec('finalDbg', (document.getElementById('dbg').textContent||'').slice(0,400));
           rec('dbgVisible', document.getElementById('dbg').style.display);
           txt();
         });
       });
     });
   });
 });
 txt();
}catch(e){rec('FATAL',e.message+' @ '+e.stack);txt();}
})();
<\/script>
`;
const at = src.lastIndexOf('</body>');
if (at < 0) throw new Error('no closing body tag');
const out = src.slice(0, at) + probe + '\n' + src.slice(at);
fs.writeFileSync(path.join(here, 'test.html'), out, 'utf8');
console.log('wrote test.html', (out.length / 1048576).toFixed(2), 'MB');
