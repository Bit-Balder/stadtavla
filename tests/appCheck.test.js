import test from "node:test";
import assert from "node:assert/strict";
import { configureAppCheck } from "../src/firebase/appCheck.js";

test("missing App Check configuration prevents service initialization", () => {
  for (const siteKey of [undefined, null, "", "   "]) {
    let initialized = false;
    assert.throws(
      () =>
        configureAppCheck({}, siteKey, {
          initializeAppCheck() {
            initialized = true;
          },
          ReCaptchaEnterpriseProvider: class {},
        }),
      /webbplatsnyckel/,
    );
    assert.equal(initialized, false);
  }
});
test("App Check uses Enterprise verification and automatic token renewal", () => {
  const app = { name: "test" };
  class Provider {
    constructor(key) {
      this.key = key;
    }
  }
  const result = configureAppCheck(app, " public-site-key ", {
    ReCaptchaEnterpriseProvider: Provider,
    initializeAppCheck(received, options) {
      assert.equal(received, app);
      assert.ok(options.provider instanceof Provider);
      assert.equal(options.provider.key, "public-site-key");
      assert.equal(options.isTokenAutoRefreshEnabled, true);
      return { verifiedClient: true };
    },
  });
  assert.deepEqual(result, { verifiedClient: true });
});
test("App Check initialization failures are not silently bypassed", () => {
  assert.throws(
    () =>
      configureAppCheck({}, "public-site-key", {
        ReCaptchaEnterpriseProvider: class {},
        initializeAppCheck() {
          throw Error("initialization failed");
        },
      }),
    /initialization failed/,
  );
});
