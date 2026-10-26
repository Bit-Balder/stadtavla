import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalize,makeTask,fmt,advance,scheduled,deep} from '../src/domain/schedule.js';
import {skipOccurrence,deleteTask,dueEntries,setDone,completed,moveOccurrence} from '../src/domain/board.js';
const day=new Date(2026,9,26,12);
function board(){const s=defaults();s.tasks=[makeTask('Daglig','Huset','daily',[],{id:'task',start:fmt(day)})];return s;}
test('skipping one occurrence preserves future schedule and can restore snapshot',()=>{
 const s=board(),before=deep(s);skipOccurrence(s,'task',day);skipOccurrence(s,'task',day);
 assert.equal(s.skips.length,1);assert.equal(dueEntries(s,day).length,0);
 assert.equal(dueEntries(s,advance(day,1)).length,1);assert.equal(s.tasks.length,1);
 assert.equal(dueEntries(before,day).length,1);
});
test('skipping a group hides only due subtasks on the selected date',()=>{
 const s=board();s.tasks[0].subs=[{id:'a',name:'A',schedule:null},{id:'b',name:'B',schedule:{type:'once',start:fmt(advance(day,1))}}];
 setDone(s,'a',day,true);skipOccurrence(s,'task',day);
 assert.deepEqual(s.skips,[{id:'a',date:fmt(day)}]);assert.equal(completed(s,'a',day),false);
 assert.equal(dueEntries(s,advance(day,1)).length,2);
});
test('skip moved occurrence does not delete its original schedule',()=>{
 const s=board();moveOccurrence(s,'task',fmt(day),fmt(advance(day,2)));
 skipOccurrence(s,'task',advance(day,2));assert.equal(dueEntries(s,advance(day,2)).length,0);
 assert.equal(s.moves.length,1);assert.equal(dueEntries(s,advance(day,3)).length,1);
});
test('full deletion removes children and their metadata but preserves unrelated tasks',()=>{
 const s=board();s.tasks[0].subs=[{id:'a',name:'A'}];s.tasks.push(makeTask('Other','Kök','daily',[],{id:'other',start:fmt(day)}));
 setDone(s,'a',day,true);skipOccurrence(s,'other',day);s.moves.push({id:'a',from:fmt(day),to:fmt(advance(day,1))});deleteTask(s,'task');
 assert.deepEqual(s.tasks.map(t=>t.id),['other']);assert.equal(s.moves.length,0);assert.equal(s.done[fmt(day)],undefined);assert.equal(s.skips[0].id,'other');
});
test('custom week interval preserves selected weekdays and legacy four-week cadence',()=>{
 for(const n of [4,5,6,13]){const plan={type:'weekly',days:[0,2],start:fmt(day),weekAnchor:fmt(day),weekRepeat:n};
 assert.equal(scheduled(plan,advance(day,n*7)),true);assert.equal(scheduled(plan,advance(day,n*7+2)),true);assert.equal(scheduled(plan,advance(day,n*7+1)),false);assert.equal(scheduled(plan,advance(day,7)),false);}
 const s=board();s.tasks[0].weekRepeat=4;assert.equal(normalize(s).tasks[0].weekRepeat,4);
});
test('home name survives export and cloud normalization; old wake settings are removed',()=>{
 const s=board();s.settings.homeName='  Villa Ängen  ';s.settings.awake=true;const restored=normalize(JSON.parse(JSON.stringify(s)));
 assert.equal(restored.settings.homeName,'Villa Ängen');assert.ok(!('awake' in restored.settings));
 restored.settings.homeName=' ';assert.equal(normalize(restored).settings.homeName,'Hemma.');
});
