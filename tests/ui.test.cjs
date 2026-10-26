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
// Mount the same React components without contacting the live Firebase project.
Object.assign(globalThis, {
  window: w,
  document: w.document,
  HTMLElement: w.HTMLElement,
  Event: w.Event,
  alert: w.alert,
  confirm: w.confirm,
});
Object.defineProperty(globalThis, "navigator", {
  value: w.navigator,
  configurable: true,
});
let root, server, App;
async function mount() {
  const { createServer } = await import("vite");
  server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ default: App } = await server.ssrLoadModule("/src/App.jsx"));
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  root = createRoot(w.document.getElementById("root"));
  root.render(React.createElement(App));
}
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
  await mount();
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
    query('[role="dialog"]').textContent.includes(
      "Inloggningen är inte tillgänglig",
    ),
  );
  assert.equal(query('[role="dialog"] .account-action').matches(":disabled"), true);
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
  // An account starts with a choice; guest data never becomes cloud data implicitly.
  let remote = null,
    listener;
  const repository = {
    async read() {
      return remote;
    },
    subscribe(next) {
      listener = next;
      return () => {
        listener = null;
      };
    },
    async write(board, revision) {
      assert.equal(revision, remote?.revision || 0);
      remote = {
        board: JSON.parse(JSON.stringify(board)),
        revision: revision + 1,
      };
      listener?.(remote);
      return remote.revision;
    },
  };
  const React = require("react");
  const guestBefore = w.localStorage.getItem("hemma-stadtavla-v1");
  root.render(
    React.createElement(App, {
      key: "alice",
      user: { uid: "alice", displayName: "Anna Svensson" },
      cloudRepository: repository,
      onSignOut: () => {},
    }),
  );
  await tick();
  assert.ok(
    w.document.body.textContent.includes("Första gången med det här kontot"),
  );
  assert.equal(remote, null);
  click("Använd mina lokala uppgifter");
  await tick();
  assert.equal(remote.board.shopping[0].name, "Mjölk");
  click("Inköp");
  await tick();
  input('[aria-label="Ny vara"]', "Molnvara");
  await tick();
  submit(".listcontrols");
  await tick();
  assert.ok(remote.board.shopping.some((item) => item.name === "Molnvara"));
  assert.equal(w.localStorage.getItem("hemma-stadtavla-v1"), guestBefore);
  root.render(React.createElement(App, { key: "guest" }));
  await tick();
  click("Inköp");
  await tick();
  assert.ok(!w.document.body.textContent.includes("Molnvara"));
  root?.unmount();
  await server?.close();
  w.close();
  console.log(
    "PASS: React app, task/subtask forms, move calendar, shopping persistence, navigation, themes",
  );
})().catch(async (e) => {
  console.error(e);
  root?.unmount();
  await server?.close();
  w.close();
  process.exit(1);
});
