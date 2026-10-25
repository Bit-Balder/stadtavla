export const DAYS = [
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
  "Söndag",
];
export const MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];
export function midnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}
export function fmt(d) {
  return (
    d.getFullYear() +
    "-" +
    ("0" + (d.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + d.getDate()).slice(-2)
  );
}
export function parseDate(s) {
  if (!/^\d{4}-\d\d-\d\d$/.test(String(s || ""))) return midnight(new Date());
  var a = s.split("-");
  return new Date(+a[0], +a[1] - 1, +a[2], 12);
}
export function advance(d, n) {
  var x = midnight(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function weekday(d) {
  return (d.getDay() + 6) % 7;
}
export function weekStart(d) {
  return advance(d, -weekday(d));
}
export function dateNum(d) {
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
  );
}
export function uid() {
  return (
    "t" + Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36)
  );
}
export function isoWeek(x) {
  var d = new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
export function today() {
  return midnight(new Date());
}
export function deep(x) {
  return JSON.parse(JSON.stringify(x));
}
export function makeTask(name, room, type, days, more) {
  var x = {
    id: uid(),
    name: name,
    room: room,
    type: type,
    days: days || [],
    eachN: 7,
    start: fmt(today()),
    monthDay: 1,
    notes: "",
    subs: [],
  };
  Object.assign(x, more || {});
  return x;
}
export function defaults() {
  return {
    version: 2,
    tasks: [
      makeTask("Torka av köksbänkar", "Kök", "daily"),
      makeTask("Plocka undan", "Hela hemmet", "daily"),
      makeTask("Diska / töm diskmaskinen", "Kök", "daily"),
      makeTask("Dammsuga golv", "Hela hemmet", "weekly", [2, 5]),
      makeTask("Rengöra badrummet", "Badrum", "weekly", [4]),
      makeTask("Damma av ytor", "Hela hemmet", "weekly", [3]),
      makeTask("Byta sängkläder", "Sovrum", "weekly", [6]),
      makeTask("Rensa gammal mat i kylen", "Kök", "weekly", [0]),
      makeTask("Torka köksluckor", "Kök", "monthly", [], { monthDay: 15 }),
      makeTask("Rengöra ugn och mikro", "Kök", "monthly", [], { monthDay: 1 }),
    ],
    done: {},
    shopping: [],
    theme: "light",
    settings: { collapsed: false, filter: "all", expanded: {}, awake: false },
    moves: [],
    skips: [],
  };
}
export function normalize(x) {
  if (
    !x ||
    !Array.isArray(x.tasks) ||
    !Array.isArray(x.shopping) ||
    !x.done ||
    typeof x.done !== "object" ||
    Array.isArray(x.done)
  )
    throw Error("Ogiltiga data");
  validateStoredShape(x);
  x.version = 2;
  if (["light", "dark", "auto"].indexOf(x.theme) < 0) x.theme = "light";
  x.settings = x.settings && typeof x.settings === "object" ? x.settings : {};
  x.settings.expanded =
    x.settings.expanded && typeof x.settings.expanded === "object"
      ? x.settings.expanded
      : {};
  x.settings.filter =
    ["all", "remaining", "done"].indexOf(x.settings.filter) >= 0
      ? x.settings.filter
      : "all";
  x.settings.collapsed = !!x.settings.collapsed;
  x.moves = Array.isArray(x.moves) ? x.moves : [];
  x.skips = Array.isArray(x.skips) ? x.skips : [];
  x.tasks.forEach(function (t) {
    if (!t.id) t.id = uid();
    if (!Array.isArray(t.days)) t.days = [];
    if (!Array.isArray(t.subs)) t.subs = [];
    if (!t.weekRepeat) t.weekRepeat = 1;
    if (!t.weekAnchor) t.weekAnchor = t.start || fmt(today());
    if (typeof t.notes !== "string") t.notes = "";
    t.subs.forEach(function (s) {
      if (!s.id) s.id = uid();
      if (typeof s.notes !== "string") s.notes = "";
      if (s.schedule && typeof s.schedule === "object") {
        if (!Array.isArray(s.schedule.days)) s.schedule.days = [];
        if (!s.schedule.weekRepeat) s.schedule.weekRepeat = 1;
        if (!s.schedule.weekAnchor)
          s.schedule.weekAnchor = s.schedule.start || fmt(today());
      } else s.schedule = null;
    });
  });
  return x;
}
export function schedule(t) {
  return {
    type: t.type,
    days: t.days || [],
    eachN: t.eachN || 1,
    start: t.start,
    monthDay: t.monthDay,
    weekRepeat: t.weekRepeat || 1,
    weekAnchor: t.weekAnchor || t.start,
  };
}
export function scheduled(s, d) {
  if (!s) return false;
  if (s.start && dateNum(d) < dateNum(parseDate(s.start))) return false;
  var w = weekday(d);
  if (s.type === "once") return fmt(d) === s.start;
  if (s.type === "daily") return true;
  if (s.type === "weekly") {
    if (!Array.isArray(s.days) || s.days.indexOf(w) < 0) return false;
    var every = s.weekRepeat || 1,
      anchor = parseDate(s.weekAnchor || s.start || fmt(today()));
    if (every === "month") {
      var nth = Math.floor((anchor.getDate() - 1) / 7),
        currentNth = Math.floor((d.getDate() - 1) / 7);
      return currentNth === nth;
    }
    var diff = Math.floor(
      (dateNum(weekStart(d)) - dateNum(weekStart(anchor))) / 7,
    );
    return diff >= 0 && diff % (+every || 1) === 0;
  }
  if (s.type === "interval") {
    var n = Math.max(1, parseInt(s.eachN, 10) || 1);
    return (dateNum(d) - dateNum(parseDate(s.start))) % n === 0;
  }
  if (s.type === "monthly")
    return (
      d.getDate() ===
      Math.min(
        Math.max(1, +s.monthDay || 1),
        new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      )
    );
  return false;
}
export function dateLong(d) {
  return (
    DAYS[weekday(d)] +
    " " +
    d.getDate() +
    " " +
    MONTHS[d.getMonth()] +
    " " +
    d.getFullYear()
  );
}
export function scheduleLabel(t) {
  if (!t) return "Ärver huvuduppgiften";
  if (t.type === "once") return "En gång · " + (t.start || "");
  if (t.type === "daily") return "Varje dag";
  if (t.type === "weekly") {
    var ds =
      (t.days || [])
        .slice()
        .sort()
        .map(function (n) {
          return DAYS[n].slice(0, 3).toLowerCase();
        })
        .join(", ") || "Inga veckodagar";
    var repeat = t.weekRepeat || 1;
    return (
      ds +
      " · " +
      (repeat === "month"
        ? "varje månad"
        : +repeat === 1
          ? "varje vecka"
          : +repeat === 2
            ? "varannan vecka"
            : "var " + repeat + ":e vecka")
    );
  }
  if (t.type === "interval") return "Var " + (+t.eachN || 1) + ":e dag";
  if (t.type === "monthly") return "Dag " + (t.monthDay || 1) + " varje månad";
  return "Eget schema";
}

function validateStoredShape(x) {
  if (x.version > 2) throw Error("Dataversionen stöds inte.");
  const validEntity = (entity) =>
    entity && typeof entity === "object" && typeof entity.name === "string";
  if (
    x.tasks.some(
      (t) =>
        !validEntity(t) ||
        (Array.isArray(t.subs) && t.subs.some((s) => !validEntity(s))),
    )
  )
    throw Error("Ogiltiga uppgifter");
  if (x.shopping.some((s) => !validEntity(s))) throw Error("Ogiltiga inköp");
  if (
    Object.values(x.done).some(
      (ids) => !Array.isArray(ids) || ids.some((id) => typeof id !== "string"),
    )
  )
    throw Error("Ogiltig historik");
  if (
    Array.isArray(x.moves) &&
    x.moves.some(
      (m) =>
        !m ||
        typeof m.id !== "string" ||
        typeof m.from !== "string" ||
        typeof m.to !== "string",
    )
  )
    throw Error("Ogiltiga flyttar");
  if (
    Array.isArray(x.skips) &&
    x.skips.some(
      (s) => !s || typeof s.id !== "string" || typeof s.date !== "string",
    )
  )
    throw Error("Ogiltiga undantag");
}
