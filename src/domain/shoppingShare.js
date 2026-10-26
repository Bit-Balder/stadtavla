import LZString from "lz-string";
import { cleanItem } from "./shopping.js";
export function encodeShopping(items) {
  if (!items.length || items.length > 100)
    throw Error("QR-koden behöver mellan 1 och 100 varor.");
  const rows = items.map((item, i) => {
    const x = cleanItem(item, i);
    return [
      x.name,
      x.done ? 1 : 0,
      x.price ?? null,
      x.store || "",
      x.category || "",
      x.campaignStart || "",
      x.campaignEnd || "",
    ];
  });
  const encoded = LZString.compressToEncodedURIComponent(
    JSON.stringify({ v: 1, items: rows }),
  );
  if (encoded.length > 2000)
    throw Error(
      "Listan är för stor för en QR-kod. Dela upp listan eller korta varornas uppgifter.",
    );
  return encoded;
}
export function decodeShopping(encoded) {
  if (typeof encoded !== "string" || !encoded.length || encoded.length > 2000)
    throw Error("QR-länken är ogiltig eller för stor.");
  try {
    const text = LZString.decompressFromEncodedURIComponent(encoded);
    if (!text || text.length > 100000) throw Error();
    const data = JSON.parse(text);
    if (
      data.v !== 1 ||
      !Array.isArray(data.items) ||
      !data.items.length ||
      data.items.length > 100
    )
      throw Error();
    return data.items.map((row, i) => {
      if (!Array.isArray(row) || row.length !== 7 || ![0, 1].includes(row[1]))
        throw Error();
      return cleanItem(
        {
          id: `copy-${i}`,
          name: row[0],
          done: row[1] === 1,
          price: row[2],
          store: row[3],
          category: row[4],
          campaignStart: row[5],
          campaignEnd: row[6],
        },
        i,
      );
    });
  } catch {
    throw Error("QR-länken innehåller ingen giltig inköpslista.");
  }
}
export function shoppingURL(items, location) {
  const url = new URL(location);
  url.hash = "";
  url.search = "";
  url.hash = `shopping=${encodeShopping(items)}`;
  if (url.href.length > 2200)
    throw Error(
      "Listan är för stor för en QR-kod. Korta listan och försök igen.",
    );
  return url.href;
}
