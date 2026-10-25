import test from "node:test";
import assert from "node:assert/strict";
import { deep, defaults } from "../src/domain/schedule.js";
import {
  createCloudSession,
  CloudConflictError,
} from "../src/storage/cloudSession.js";
import { createCloudCache } from "../src/storage/cloudCache.js";
function memory() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    data,
  };
}
function backend(initial = null) {
  let remote = initial && deep(initial),
    listeners = new Set(),
    fail = false,
    writes = 0;
  return {
    async read() {
      if (fail) throw Error("offline");
      return remote && deep(remote);
    },
    subscribe(next) {
      listeners.add(next);
      return () => listeners.delete(next);
    },
    async write(board, revision) {
      writes++;
      if (fail) throw Error("offline");
      if ((remote?.revision || 0) !== revision) throw new CloudConflictError();
      remote = { board: deep(board), revision: revision + 1 };
      for (const next of listeners) next(deep(remote));
      return remote.revision;
    },
    external(board) {
      remote = { board: deep(board), revision: (remote?.revision || 0) + 1 };
      for (const next of listeners) next(deep(remote));
    },
    setOffline(value) {
      fail = value;
    },
    get writes() {
      return writes;
    },
    get remote() {
      return remote;
    },
  };
}
function session(repository, storage = memory(), uid = "alice") {
  let state;
  const controller = createCloudSession({
    repository,
    cache: createCloudCache(storage, uid),
    onChange: (next) => {
      state = next;
    },
  });
  return {
    controller,
    storage,
    get state() {
      return state;
    },
  };
}
test("first cloud login requires an explicit import choice", async () => {
  const repo = backend(),
    s = session(repo);
  await s.controller.start();
  assert.equal(s.state.needsSetup, true);
  assert.equal(repo.writes, 0);
  const local = defaults();
  local.shopping.push({ id: "milk", name: "Mjölk", done: false });
  await s.controller.initialize(local);
  assert.equal(repo.remote.board.shopping[0].name, "Mjölk");
  assert.equal(s.state.dirty, false);
  s.controller.dispose();
});
test("existing cloud data wins without importing guest data", async () => {
  const cloud = defaults();
  cloud.shopping = [{ id: "c", name: "Moln", done: false }];
  const repo = backend({ board: cloud, revision: 3 }),
    s = session(repo);
  await s.controller.start();
  assert.equal(s.state.board.shopping[0].name, "Moln");
  assert.equal(repo.writes, 0);
  assert.equal(s.state.revision, 3);
  s.controller.dispose();
});
test("rapid edits serialize and retain all changes", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    s = session(repo);
  await s.controller.start();
  const first = deep(s.state.board);
  first.shopping.push({ id: "a", name: "A", done: false });
  s.controller.commit(first);
  const second = deep(s.state.board);
  second.shopping.push({ id: "b", name: "B", done: false });
  await s.controller.commit(second);
  assert.equal(repo.remote.revision, 3);
  assert.deepEqual(
    repo.remote.board.shopping.map((x) => x.id),
    ["a", "b"],
  );
  assert.equal(s.state.pending, 0);
  assert.equal(s.state.dirty, false);
  s.controller.dispose();
});
test("another device updates an idle board in real time", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    s = session(repo);
  await s.controller.start();
  const next = defaults();
  next.shopping = [{ id: "b", name: "Ny vara", done: true }];
  repo.external(next);
  assert.equal(s.state.revision, 2);
  assert.equal(s.state.board.shopping[0].done, true);
  s.controller.dispose();
});
test("offline edits remain cached and can be retried", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    s = session(repo);
  await s.controller.start();
  repo.setOffline(true);
  const next = deep(s.state.board);
  next.shopping = [{ id: "a", name: "Offline", done: false }];
  await s.controller.commit(next);
  assert.equal(s.state.blocked, true);
  assert.equal(s.state.dirty, true);
  assert.equal(createCloudCache(s.storage, "alice").read().dirty, true);
  repo.setOffline(false);
  await s.controller.retry();
  assert.equal(s.state.blocked, false);
  assert.equal(repo.remote.board.shopping[0].name, "Offline");
  s.controller.dispose();
});
test("concurrent changes never silently overwrite another device", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    s = session(repo);
  await s.controller.start();
  const draft = deep(s.state.board);
  draft.shopping = [{ id: "mine", name: "Min vara", done: false }];
  const pending = s.controller.commit(draft);
  const other = defaults();
  other.shopping = [{ id: "other", name: "Annan vara", done: false }];
  repo.external(other);
  await pending;
  assert.equal(s.state.blocked, true);
  assert.equal(repo.remote.board.shopping[0].id, "other");
  assert.equal(s.state.board.shopping[0].id, "mine");
  await s.controller.retry();
  assert.equal(s.state.blocked, true);
  await s.controller.reload();
  assert.equal(s.state.board.shopping[0].id, "other");
  assert.equal(s.state.dirty, false);
  s.controller.dispose();
});
test("unsaved edits survive reload without an automatic upload", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    storage = memory();
  const cache = createCloudCache(storage, "alice");
  const draft = defaults();
  draft.shopping = [{ id: "draft", name: "Utkast", done: false }];
  cache.write({ board: draft, revision: 1, dirty: true });
  const s = session(repo, storage);
  await s.controller.start();
  assert.equal(s.state.blocked, true);
  assert.equal(s.state.board.shopping[0].id, "draft");
  assert.equal(repo.writes, 0);
  s.controller.dispose();
});
test("guest and different accounts never share cached boards", () => {
  const storage = memory();
  storage.setItem("hemma-stadtavla-v1", "guest");
  createCloudCache(storage, "alice").write({
    board: defaults(),
    revision: 2,
    dirty: true,
  });
  assert.equal(createCloudCache(storage, "bob").read(), null);
  assert.equal(storage.getItem("hemma-stadtavla-v1"), "guest");
});
test("a failed initial read never creates a new cloud board", async () => {
  const repo = backend();
  repo.setOffline(true);
  const s = session(repo);
  await s.controller.start();
  assert.equal(s.state.blocked, true);
  assert.equal(s.state.board, null);
  assert.equal(repo.writes, 0);
  repo.setOffline(false);
  await s.controller.retry();
  assert.equal(s.state.needsSetup, true);
  s.controller.dispose();
});
test("unsubscribed sessions ignore account changes and writes", async () => {
  const repo = backend({ board: defaults(), revision: 1 }),
    s = session(repo);
  await s.controller.start();
  const previous = s.state;
  s.controller.dispose();
  repo.external(defaults());
  await s.controller.commit(defaults());
  assert.equal(s.state, previous);
  assert.equal(repo.writes, 0);
});
test("a newer snapshot arriving during the final write is applied after saving", async () => {
  const repo = backend({ board: defaults(), revision: 1 });
  const write = repo.write.bind(repo);
  repo.write = async (board, revision) => {
    const saved = await write(board, revision);
    const other = deep(board);
    other.shopping.push({ id: "other", name: "Andra enheten", done: false });
    repo.external(other);
    return saved;
  };
  const s = session(repo);
  await s.controller.start();
  await s.controller.commit(defaults());
  assert.equal(s.state.revision, 3);
  assert.equal(s.state.board.shopping[0].id, "other");
  s.controller.dispose();
});
