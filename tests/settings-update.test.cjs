const { JSDOM } = require("jsdom");
const assert = require("node:assert/strict");
const dom = new JSDOM('<meta name="theme-color"><div id="root"></div>', {
  url: "https://example.test/stadtavla/",
  pretendToBeVisual: true,
});
const w = dom.window;
Object.assign(globalThis, {
  window: w,
  document: w.document,
  HTMLElement: w.HTMLElement,
  Event: w.Event,
  localStorage: w.localStorage,
  confirm: () => true,
  alert: (m) => {
    throw Error(m);
  },
});
Object.defineProperty(globalThis, "navigator", {
  value: w.navigator,
  configurable: true,
});
w.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
const React = require("react");
const { createRoot } = require("react-dom/client");
let server,
  root = createRoot(document.getElementById("root"));
const tick = () => new Promise((r) => setTimeout(r, 40));
const q = (s) => document.querySelector(s);
const btn = (text) => {
  const b = [...document.querySelectorAll("button")].find(
    (x) => x.textContent.trim() === text,
  );
  assert.ok(b, "missing " + text);
  return b;
};
function set(selector, value) {
  const el = q(selector);
  const proto =
    el.tagName === "SELECT"
      ? w.HTMLSelectElement.prototype
      : w.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  el.dispatchEvent(
    new w.Event(el.tagName === "SELECT" ? "change" : "input", {
      bubbles: true,
    }),
  );
}
const submit = () =>
  q("form").dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
(async()=>{
 server=await (await import('vite')).createServer({server:{middlewareMode:true},appType:'custom'});
 const {default:App}=await server.ssrLoadModule('/src/App.jsx');
 const {defaults,today,advance,fmt,makeTask}=await server.ssrLoadModule('/src/domain/schedule.js');
 const yesterday=advance(today(),-1),old=advance(today(),-2);
 const initial=defaults();initial.tasks=[makeTask('Daglig test','Huset','daily',[],{id:'daily',start:fmt(yesterday)}),makeTask('Äldre miss','Trädgård','once',[],{id:'older',start:fmt(old)})];
 localStorage.setItem('hemma-stadtavla-v1',JSON.stringify(initial));
 root.render(React.createElement(App));await tick();await tick();
 assert.ok(q('.brandbar .header-login'));assert.equal(q('.top-tools .header-login'),null);
 assert.equal(q('.disclosure').getAttribute('aria-expanded'),'false');assert.match(q('.disclosure').textContent,/Missade1/);
 assert.equal(q('#missed-tasks'),null);q('.disclosure').click();await tick();assert.ok(q('#missed-tasks'));assert.ok(!q('#missed-tasks').textContent.includes('Äldre miss'));q('.disclosure').click();await tick();
 q('[aria-label="Fler alternativ för Daglig test"]').click();await tick();btn('Ta bort').click();await tick();
 btn('Ta bort bara detta tillfälle').click();await tick();let saved=JSON.parse(localStorage.getItem('hemma-stadtavla-v1'));assert.equal(saved.tasks.length,2);assert.equal(saved.skips[0].date,fmt(today()));
 btn('Ångra').click();await tick();assert.equal(JSON.parse(localStorage.getItem('hemma-stadtavla-v1')).skips.length,0);
 q('[aria-label="Fler alternativ för Daglig test"]').click();await tick();btn('Ta bort').click();await tick();btn('Ta bort uppgiften helt').click();await tick();assert.equal(JSON.parse(localStorage.getItem('hemma-stadtavla-v1')).tasks.length,1);btn('Ångra').click();await tick();
 btn('Inställningar').click();await tick();assert.ok(!document.body.textContent.includes('Håll skärmen'));assert.ok(!/paddan|paddans|iPad/.test(document.body.textContent));
 set('[name=homeName]','Villa Ängen');await tick();btn('Spara namn').click();await tick();assert.equal(q('.brand h1').textContent,'Villa Ängen');assert.equal(JSON.parse(localStorage.getItem('hemma-stadtavla-v1')).settings.homeName,'Villa Ängen');
 set('[name=homeName]','');await tick();btn('Spara namn').click();await tick();assert.equal(q('.brand h1').textContent,'Hemma.');
 btn('Uppgifter').click();await tick();assert.equal(q('[aria-label="Flytta upp"]'),null);
 q('[aria-label="Lägg till uppgift"]').click();await tick();const opts=[...q('#task-room').options].map(x=>x.text);assert.equal(opts[opts.indexOf('Annat')-2],'Huset');assert.equal(opts[opts.indexOf('Annat')-1],'Trädgård');
 const repeat=q('select[id$="-repeat"]');assert.ok(![...repeat.options].some(x=>x.text==='Var fjärde vecka'));
 repeat.value='custom';repeat.dispatchEvent(new w.Event('change',{bubbles:true}));await tick();set('input[id$="-weeks"]','5');await tick();set('#task-name','Fem veckor');await tick();btn('Spara uppgift').click();await tick();
 saved=JSON.parse(localStorage.getItem('hemma-stadtavla-v1'));assert.equal(saved.tasks.find(x=>x.name==='Fem veckor').weekRepeat,5);
 q('[aria-label="Fler alternativ för Fem veckor"]').click();await tick();btn('Redigera').click();await tick();assert.equal(q('select[id$="-repeat"]').value,'custom');assert.equal(q('input[id$="-weeks"]').value,'5');q('[aria-label="Stäng"]').click();await tick();
 q('[aria-label="Fler alternativ för Fem veckor"]').click();await tick();btn('Ta bort').click();await tick();assert.ok(!document.body.textContent.includes('Ta bort bara detta tillfälle'));q('[aria-label="Stäng"]').click();await tick();
 const {validateSchedule}=await server.ssrLoadModule('/src/components/ScheduleFields.jsx');
 const plan={type:'weekly',days:[0],weekAnchor:fmt(today()),start:fmt(today())};for(const weekRepeat of [0,-1,1.5,'',Infinity])assert.ok(validateSchedule({...plan,weekRepeat}));for(const weekRepeat of [1,4,5,'month'])assert.equal(validateSchedule({...plan,weekRepeat}),'');
 console.log('PASS: deletion scope and undo, yesterday disclosure, header account, home name, categories, custom weekly recurrence');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{root.unmount();await server?.close();w.close();});
