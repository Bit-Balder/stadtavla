const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const assert = require("node:assert/strict");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(e.message));
const dom = new JSDOM(
  '<!doctype html><html><head><meta name="theme-color"></head><body><div id="root"></div></body></html>',
  {
    url: "https://example.com/stadtavla/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
  },
);
const w = dom.window;
w.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
w.confirm = () => true;
w.alert = (m) => {
  throw Error(m);
};
const source = fs.readFileSync(
  "dist/assets/" + fs.readdirSync("dist/assets").find((n) => n.endsWith(".js")),
  "utf8",
);
w.eval(source);
const tick = () => new Promise((r) => setTimeout(r, 100));
const query = (s) => w.document.querySelector(s);
const buttons = () => [...w.document.querySelectorAll("button")];
function click(text) {
  const b = buttons().find((b) => b.textContent.trim() === text);
  assert.ok(b, "missing button " + text);
  b.click();
}
function input(id, value) {
  const e = query(id);
  Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value",
  ).set.call(e, value);
  e.dispatchEvent(new w.Event("input", { bubbles: true }));
}
function submit(selector) {
  query(selector).dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
}
(async () => {
  for (let attempts = 0; !query("h2") && attempts < 50; attempts++)
    await tick();
  assert.equal(query("h2").textContent, "Dagens städning");
  query('[aria-label="Lägg till uppgift"]').click();
  await tick();
  input("#task-name", "Reacttest");
  await tick();
  click("Spara uppgift");
  await tick();
  assert.ok(w.document.body.textContent.includes("Reacttest"));
  assert.ok(
    JSON.parse(w.localStorage.getItem("hemma-stadtavla-v1")).tasks.some(
      (t) => t.name === "Reacttest",
    ),
  );
  query('[aria-label="Fler alternativ för Reacttest"]').click();
  await tick();
  click("Redigera");
  await tick();
  click("+ Delmoment");
  await tick();
  input("#sub-name", "Deltest");
  await tick();
  click("Spara delmoment");
  await tick();
  click("Spara uppgift");
  await tick();
  assert.ok(w.document.body.textContent.includes("Deltest"));
  query('[aria-label="Fler alternativ för Deltest"]').click();
  await tick();
  click("Flytta");
  await tick();
  query(".date-trigger").click();
  await tick();
  query('[aria-label="Nästa månad"]').click();
  await tick();
  query(".calendar-date").click();
  await tick();
  click("Flytta");
  await tick();
  click("Inköp");
  await tick();
  input('[aria-label="Ny vara"]', "Mjölk");
  await tick();
  submit(".listcontrols");
  await tick();
  buttons()
    .find((b) => b.textContent.includes("Mjölk"))
    .click();
  await tick();
  assert.equal(
    JSON.parse(w.localStorage.getItem("hemma-stadtavla-v1")).shopping[0].done,
    true,
  );
  for (const view of ["Vecka", "Månad", "Uppgifter", "Inställningar"]) {
    click(view);
    await tick();
  }
  assert.equal(query(".nav").children.length, 6);
  assert.equal(query(".nav-icon").getAttribute("aria-hidden"), "true");
  assert.ok(query(".brand-copy h1").textContent.includes("Hemma."));
  assert.ok(w.document.body.textContent.includes("Mitt konto"));
  click("Logga in");
  await tick();
  assert.ok(
    query('[role="dialog"]').textContent.includes("Google-inloggning kommer"),
  );
  assert.equal(query('[role="dialog"] .account-action').disabled, true);
  query('[aria-label="Stäng"]').click();
  await tick();
  click("Mörkt");
  await tick();
  assert.ok(w.document.documentElement.classList.contains("theme-dark"));
  click("Ljust");
  await tick();
  click("Dag");
  await tick();
  assert.equal(query("h2").textContent, "Dagens städning");
  assert.deepEqual(errors, []);
  w.close();
  console.log(
    "PASS: production bundle, task/subtask forms, move calendar, shopping persistence, navigation, themes",
  );
})().catch((e) => {
  console.error(e);
  w.close();
  process.exit(1);
});
