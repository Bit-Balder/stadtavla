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
(async () => {
  server = await (
    await import("vite")
  ).createServer({ server: { middlewareMode: true }, appType: "custom" });
  const { AccountDialog } = await server.ssrLoadModule(
    "/src/components/Account.jsx",
  );
  let calls = [],
    closed = 0;
  const actions = {
    email: async (...a) => calls.push(["email", ...a]),
    register: async (...a) => calls.push(["register", ...a]),
    reset: async (...a) => calls.push(["reset", ...a]),
  };
  root.render(
    React.createElement(AccountDialog, {
      authActions: actions,
      onSignIn: async () => calls.push(["google"]),
      onClose: () => closed++,
    }),
  );
  await tick();
  set("input[type=email]", "test@example.test");
  set("input[type=password]", "secret123");
  await tick();
  submit();
  await tick();
  assert.deepEqual(calls[0], ["email", "test@example.test", "secret123"]);
  assert.equal(closed, 1);
  btn("Registrera dig").click();
  await tick();
  set("input[autocomplete=new-password]", "secret123");
  set("input[autocomplete=new-password]:last-of-type", "secret123");
  await tick();
  // Set the confirmation explicitly; each input has a separate label.
  const inputs = document.querySelectorAll("input[type=password]");
  Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value",
  ).set.call(inputs[1], "different");
  inputs[1].dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  submit();
  await tick();
  assert.match(document.body.textContent, /matchar inte/);
  assert.equal(calls.length, 1);
  Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value",
  ).set.call(inputs[1], "secret123");
  inputs[1].dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  submit();
  await tick();
  assert.equal(calls[1][0], "register");
  btn("Tillbaka till Logga in").click();
  await tick();
  btn("Glömt lösenord?").click();
  await tick();
  submit();
  await tick();
  assert.equal(calls[2][0], "reset");
  assert.match(document.body.textContent, /Om adressen har ett konto/);
  btn("Tillbaka till Logga in").click();
  await tick();
  btn("Logga in med Google").click();
  await tick();
  assert.equal(calls[3][0], "google");
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  root.render(
    React.createElement(App, {
      key: "board",
      authError: "Testfel för inloggning",
      authLoading: true,
    }),
  );
  await tick();
  await tick();
  assert.equal(q(".filterbtn.active").textContent, "Kvarvarande");
  assert.ok(!document.body.textContent.includes("Testfel"));
  btn("Inköp").click();
  await tick();
  set('[aria-label="Ny vara"]', "Mjölk");
  await tick();
  submit();
  await tick();
  assert.equal(q(".toast"), null);
  q('[aria-label="Fler alternativ för Mjölk"]').click();
  await tick();
  btn("Redigera").click();
  await tick();
  const form = q("[role=dialog] form");
  const input = form.querySelector("input");
  Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value",
  ).set.call(input, "Havremjölk");
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  set("[role=dialog] input[inputmode=decimal]", "19,90");
  await tick();
  const selects = q("[role=dialog]").querySelectorAll("select");
  selects[0].value = "Annan";
  selects[0].dispatchEvent(new w.Event("change", { bubbles: true }));
  await tick();
  const named = [...q("[role=dialog]").querySelectorAll("label")]
    .find((x) => x.textContent.includes("Butikens namn"))
    .querySelector("input");
  Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value",
  ).set.call(named, "Min butik");
  named.dispatchEvent(new w.Event("input", { bubbles: true }));
  await tick();
  form.dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
  await tick();
  assert.equal(q(".toast"), null);
  let board = JSON.parse(localStorage.getItem("hemma-stadtavla-v1"));
  assert.equal(board.shopping[0].price, 19.9);
  assert.equal(board.shopping[0].store, "Min butik");
  q('[aria-label="Fler alternativ för Havremjölk"]').click();
  await tick();
  btn("Ta bort").click();
  await tick();
  assert.ok(q(".toast"));
  btn("Ångra").click();
  await tick();
  assert.match(document.body.textContent, /Havremjölk/);
  btn("Inställningar").click();
  await tick();
  assert.match(document.body.textContent, /Testfel för inloggning/);
  const { default: Sortable } = await server.ssrLoadModule(
    "/src/components/Sortable.jsx",
  );
  let moves = [],
    clicks = 0;
  root.render(
    React.createElement(
      "div",
      null,
      ...["a", "b"].map((id) =>
        React.createElement(
          Sortable,
          { id, group: "test", key: id, onMove: (...args) => moves.push(args) },
          React.createElement("button", { onClick: () => clicks++ }, id),
        ),
      ),
    ),
  );
  await tick();
  const a = q("[data-sort-id=a]"),
    b = q("[data-sort-id=b]");
  document.elementFromPoint = () => b;
  b.getBoundingClientRect = () => ({ top: 100, height: 100 });
  a.querySelector("button").dispatchEvent(
    new w.MouseEvent("mousedown", {
      bubbles: true,
      clientX: 100,
      clientY: 100,
    }),
  );
  await new Promise((r) => setTimeout(r, 480));
  document.dispatchEvent(
    new w.MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 180,
    }),
  );
  document.dispatchEvent(new w.MouseEvent("mouseup", { bubbles: true }));
  a.querySelector("button").click();
  await tick();
  assert.deepEqual(moves, [["a", "b", true]]);
  assert.equal(clicks, 0);
  const { default: Copy } = await server.ssrLoadModule(
    "/src/components/ShoppingShare.jsx",
  );
  const { encodeShopping } = await server.ssrLoadModule(
    "/src/domain/shoppingShare.js",
  );
  const encoded = encodeShopping([{ name: "Kopia", done: true }]);
  const original = localStorage.getItem("hemma-stadtavla-v1");
  root.render(React.createElement(Copy, { encoded, key: "copy1" }));
  await tick();
  q(".taskhit").click();
  await tick();
  assert.equal(q(".taskhit").getAttribute("aria-pressed"), "false");
  root.render(React.createElement(Copy, { encoded, key: "copy2" }));
  await tick();
  assert.equal(q(".taskhit").getAttribute("aria-pressed"), "false");
  assert.equal(q("nav"), null);
  assert.equal(localStorage.getItem("hemma-stadtavla-v1"), original);
  root.render(React.createElement(Copy, { encoded: "broken", key: "bad" }));
  await tick();
  assert.ok(q("[role=alert]"));
  assert.equal(localStorage.getItem("hemma-stadtavla-v1"), original);
  console.log(
    "PASS: email/login/reset forms, shopping editing and undo, default filters, hidden auth status, long-press ordering, isolated QR persistence",
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    root.unmount();
    await server?.close();
    w.close();
  });
