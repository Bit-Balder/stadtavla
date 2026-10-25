import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  normalize,
  scheduled,
  parseDate,
  fmt,
  deep,
} from "../src/domain/schedule.js";
import {
  dueEntries,
  moveOccurrence,
  setDone,
  completed,
  removeEntities,
} from "../src/domain/board.js";
import {
  createLocalRepository,
  STORAGE_KEY,
} from "../src/storage/localRepository.js";
const date = parseDate;
function board() {
  return {
    version: 2,
    tasks: [
      {
        id: "task",
        name: "Test",
        room: "Kök",
        type: "daily",
        start: "2026-01-01",
        days: [],
        subs: [],
      },
    ],
    done: {},
    shopping: [],
    theme: "auto",
    settings: { filter: "all", expanded: {} },
    moves: [],
    skips: [],
  };
}
test("weekly recurrence supports every second and third week", () => {
  const plan = {
    type: "weekly",
    days: [0],
    start: "2026-01-05",
    weekAnchor: "2026-01-05",
    weekRepeat: 2,
  };
  assert.equal(scheduled(plan, date("2026-01-05")), true);
  assert.equal(scheduled(plan, date("2026-01-12")), false);
  assert.equal(scheduled(plan, date("2026-01-19")), true);
  plan.weekRepeat = 3;
  assert.equal(scheduled(plan, date("2026-01-19")), false);
  assert.equal(scheduled(plan, date("2026-01-26")), true);
});
test("monthly weekday recurrence preserves ordinal weekday", () => {
  const plan = {
    type: "weekly",
    days: [0],
    start: "2026-01-12",
    weekAnchor: "2026-01-12",
    weekRepeat: "month",
  };
  assert.equal(scheduled(plan, date("2026-02-09")), true);
  assert.equal(scheduled(plan, date("2026-02-16")), false);
});
test("monthly day clamps to month end including leap years", () => {
  const plan = { type: "monthly", monthDay: 31 };
  assert.equal(scheduled(plan, date("2026-02-28")), true);
  assert.equal(scheduled(plan, date("2028-02-29")), true);
  assert.equal(scheduled(plan, date("2026-02-27")), false);
});
test("interval uses calendar days through daylight saving changes", () => {
  const plan = { type: "interval", eachN: 2, start: "2026-03-28" };
  assert.equal(scheduled(plan, date("2026-03-30")), true);
  assert.equal(scheduled(plan, date("2026-03-29")), false);
});
test("subtasks inherit or override schedules", () => {
  const s = board();
  s.tasks[0].subs = [
    { id: "a", name: "A", schedule: null },
    { id: "b", name: "B", schedule: { type: "once", start: "2026-01-03" } },
  ];
  assert.deepEqual(
    dueEntries(s, date("2026-01-02")).map((e) => e.id),
    ["a"],
  );
  assert.deepEqual(
    dueEntries(s, date("2026-01-03")).map((e) => e.id),
    ["a", "b"],
  );
});
test("moving completed occurrence twice preserves completion and original source", () => {
  const s = board();
  setDone(s, "task", date("2026-01-02"), true);
  moveOccurrence(s, "task", "2026-01-02", "2026-01-03");
  moveOccurrence(s, "task", "2026-01-03", "2026-01-04");
  assert.deepEqual(s.moves, [
    { id: "task", from: "2026-01-02", to: "2026-01-04" },
  ]);
  assert.equal(dueEntries(s, date("2026-01-02")).length, 0);
  assert.equal(completed(s, "task", date("2026-01-04")), true);
  assert.equal(completed(s, "task", date("2026-01-03")), false);
});
test("deletion removes completion, moves and skips", () => {
  const s = board();
  s.done = { "2026-01-02": ["task", "other"] };
  s.moves = [{ id: "task", from: "a", to: "b" }];
  s.skips = [{ id: "task", date: "a" }];
  removeEntities(s, ["task"]);
  assert.deepEqual(s.done, { "2026-01-02": ["other"] });
  assert.deepEqual(s.moves, []);
  assert.deepEqual(s.skips, []);
});
test("legacy storage and backups retain IDs, history, settings and shopping", async () => {
  const original = board();
  original.shopping = [{ id: "s", name: "Mjölk", done: true }];
  original.done = { "2026-01-02": ["task"] };
  const data = new Map([[STORAGE_KEY, JSON.stringify(original)]]);
  const repo = createLocalRepository({
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  });
  const loaded = await repo.read();
  assert.equal(loaded.tasks[0].id, "task");
  assert.deepEqual(loaded.done, original.done);
  assert.deepEqual(loaded.shopping, original.shopping);
  await repo.write(loaded);
  assert.deepEqual(normalize(JSON.parse(data.get(STORAGE_KEY))), loaded);
});
test("corrupted storage rejects without writing defaults", async () => {
  let wrote = false;
  const repo = createLocalRepository({
    getItem: () => "{broken",
    setItem: () => {
      wrote = true;
    },
  });
  await assert.rejects(repo.read());
  assert.equal(wrote, false);
});
test("unavailable storage and failed writes report errors", async () => {
  const repo = createLocalRepository({
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("quota");
    },
  });
  await assert.rejects(repo.read());
  await assert.rejects(repo.write(board()));
});
test("fresh data contains expected tasks and keeps schema version", () => {
  const s = normalize(defaults());
  assert.equal(s.tasks.length, 10);
  assert.equal(s.version, 2);
  assert.equal(fmt(date("2026-10-25")), "2026-10-25");
});
test("malformed nested backups and future versions reject safely", () => {
  for (const change of [
    (s) => (s.done.bad = null),
    (s) => (s.tasks[0].name = null),
    (s) => s.shopping.push(null),
    (s) => s.moves.push(null),
    (s) => (s.version = 99),
  ]) {
    const s = board();
    change(s);
    assert.throws(() => normalize(s));
  }
});
