import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("account controls wait for authentication and accept a future Google profile", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { AccountPanel, ProfileAvatar } = await server.ssrLoadModule(
      "/src/components/Account.jsx",
    );
    const { default: Navigation } = await server.ssrLoadModule(
      "/src/components/Navigation.jsx",
    );
    const render = (Component, props) =>
      renderToStaticMarkup(createElement(Component, props));
    const loggedOut = render(AccountPanel, { user: null });
    assert.match(loggedOut, /disabled=""/);
    assert.match(loggedOut, /Inloggningen är inte tillgänglig/);
    const ready = render(AccountPanel, { user: null, onSignIn() {} });
    assert.doesNotMatch(ready, /disabled=""/);
    const user = {
      displayName: "Anna Svensson",
      email: "anna@example.test",
      photoURL: "https://example.test/profile.png",
    };
    const account = render(AccountPanel, { user, onSignOut() {} });
    assert.match(account, /Anna Svensson/);
    assert.match(account, /anna@example.test/);
    assert.match(account, /Logga ut/);
    assert.doesNotMatch(account, /disabled=""/);
    assert.match(
      render(ProfileAvatar, { user: { displayName: "Anna Svensson" } }),
      />AS</,
    );
    const navigation = render(Navigation, {
      pages: [
        ["day", "Dag"],
        ["settings", "Inställningar"],
      ],
      page: "day",
      user,
      onNavigate() {},
      onAccount() {},
    });
    assert.match(navigation, /Öppna ditt konto/);
    assert.match(navigation, /profile\.png/);
    assert.match(navigation, /aria-current="page"/);
  } finally {
    await server.close();
  }
});
