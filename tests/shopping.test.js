import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { cleanItem, weekCampaign } from "../src/domain/shopping.js";
import {
  encodeShopping,
  decodeShopping,
  shoppingURL,
} from "../src/domain/shoppingShare.js";
import { reorderBefore } from "../src/domain/board.js";
import { normalize, defaults } from "../src/domain/schedule.js";
const list = [
  {
    id: "a",
    name: "Mjölk 🥛",
    done: false,
    price: 12.9,
    store: "Närbutiken",
    category: "Mejeri",
    campaignStart: "2026-10-26",
    campaignEnd: "2026-11-01",
  },
  { id: "b", name: "Äpplen", done: true },
];
test("QR snapshot preserves details, Swedish names, order and completion", () => {
  const copy = decodeShopping(encodeShopping(list));
  assert.deepEqual(
    copy,
    list.map((x, i) => ({ ...x, id: `copy-${i}` })),
  );
  copy[0].done = true;
  assert.equal(list[0].done, false);
});
test("QR image decodes independently to the same complete URL", () => {
  const url = shoppingURL(
    list,
    "https://bit-balder.github.io/stadtavla/?old=1#old",
  );
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" }),
    size = (qr.modules.size + 8) * 5;
  const rgba = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < qr.modules.size; y++)
    for (let x = 0; x < qr.modules.size; x++)
      if (qr.modules.get(y, x))
        for (let j = 0; j < 5; j++)
          for (let i = 0; i < 5; i++) {
            const n = (((y + 4) * 5 + j) * size + (x + 4) * 5 + i) * 4;
            rgba[n] = rgba[n + 1] = rgba[n + 2] = 0;
          }
  const result = jsQR(rgba, size, size);
  assert.equal(result?.data, url);
  assert.ok(!url.includes("?old"));
});
test("QR rejects malformed, oversized and unknown data", () => {
  for (const value of ["", "not-a-list", "x".repeat(2001)])
    assert.throws(() => decodeShopping(value));
  assert.throws(() => encodeShopping([]));
  assert.throws(() =>
    encodeShopping(Array.from({ length: 101 }, () => list[0])),
  );
  assert.throws(() => cleanItem({ name: "X", price: -1 }));
  assert.throws(() =>
    cleanItem({
      name: "X",
      campaignStart: "2026-02-30",
      campaignEnd: "2026-03-02",
    }),
  );
  assert.throws(() =>
    cleanItem({
      name: "X",
      campaignStart: "2026-10-28",
      campaignEnd: "2026-10-26",
    }),
  );
  assert.throws(() => cleanItem({ name: "X", store: {} }));
});
test("campaign this week resolves to concrete Monday and Sunday dates", () => {
  assert.deepEqual(weekCampaign(new Date(2026, 9, 28, 12)), {
    campaignStart: "2026-10-26",
    campaignEnd: "2026-11-01",
  });
  assert.equal(cleanItem({ name: " X ", price: "12,90" }).price, 12.9);
});
test("saved board retains new shopping fields and custom order", () => {
  const board = defaults();
  board.shopping = structuredClone(list);
  reorderBefore(board.shopping, "b", "a");
  const copy = normalize(JSON.parse(JSON.stringify(board)));
  assert.equal(copy.shopping[0].id, "b");
  assert.equal(copy.shopping[1].store, "Närbutiken");
  reorderBefore(copy.shopping, "b", "a", true);
  assert.equal(copy.shopping[0].id, "a");
  reorderBefore(copy.shopping, "a", "missing");
  assert.equal(copy.shopping[0].id, "a");
});
