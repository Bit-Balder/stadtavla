import { advance, fmt, today, weekStart } from "./schedule.js";
export const stores = ["Ica", "Coop", "Willys", "Lidl"];
export const categories = [
  "Grönsaker",
  "Frukt",
  "Mejeri",
  "Spannmål",
  "Konserver",
  "Kött",
  "Fisk",
  "Frysvaror",
  "Dryck",
  "Hushåll",
  "Annat",
];
export function weekCampaign(date = today()) {
  const start = weekStart(date);
  return { campaignStart: fmt(start), campaignEnd: fmt(advance(start, 6)) };
}
const dateValid = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return !isNaN(d) && fmt(d) === value;
};
export function cleanItem(item, index = 0) {
  if (
    !item ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    item.name.length > 100
  )
    throw Error("Varan behöver ett namn på högst 100 tecken.");
  const result = {
    id: typeof item.id === "string" ? item.id : `copy-${index}`,
    name: item.name.trim(),
    done: item.done === true,
  };
  for (const key of ["store", "category"]) {
    if (item[key] != null && item[key] !== "") {
      if (typeof item[key] !== "string" || item[key].length > 100)
        throw Error("Ogiltiga uppgifter för varan.");
      result[key] = item[key].trim();
    }
  }
  if (item.price != null && item.price !== "") {
    const price = Number(String(item.price).replace(",", "."));
    if (!Number.isFinite(price) || price < 0 || price > 1000000)
      throw Error("Ange ett giltigt pris.");
    result.price = Math.round(price * 100) / 100;
  }
  if (item.campaignStart || item.campaignEnd) {
    if (
      !dateValid(item.campaignStart || "") ||
      !dateValid(item.campaignEnd || "") ||
      item.campaignStart > item.campaignEnd
    )
      throw Error("Ange ett giltigt startdatum och slutdatum för kampanjen.");
    result.campaignStart = item.campaignStart;
    result.campaignEnd = item.campaignEnd;
  }
  return result;
}
export function itemDetails(item) {
  return [
    item.store,
    item.category,
    item.price != null && item.price !== ""
      ? `${Number(item.price).toLocaleString("sv-SE")} kr`
      : "",
    item.campaignStart
      ? `Kampanj ${item.campaignStart}–${item.campaignEnd}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
