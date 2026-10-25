import test, { before, after } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { defaults } from "../src/domain/schedule.js";
import { createCloudRepository } from "../src/storage/cloudRepository.js";
let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-stadtavla",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
after(async () => {
  await environment?.cleanup();
});
test("Firestore only allows the owner and rejects invalid revisions", async () => {
  const alice = environment.authenticatedContext("alice").firestore();
  const bob = environment.authenticatedContext("bob").firestore();
  const guest = environment.unauthenticatedContext().firestore();
  const path = "users/alice/boards/home";
  const payload = {
    board: defaults(),
    revision: 1,
    updatedAt: serverTimestamp(),
  };
  await assertFails(getDoc(doc(guest, path)));
  await assertFails(getDoc(doc(bob, path)));
  await assertFails(setDoc(doc(bob, path), payload));
  await assertFails(setDoc(doc(guest, path), payload));
  await assertSucceeds(setDoc(doc(alice, path), payload));
  await assertSucceeds(getDoc(doc(alice, path)));
  await assertFails(setDoc(doc(alice, path), payload));
  await assertFails(
    setDoc(doc(alice, path), {
      ...payload,
      revision: 2,
      board: { version: 2 },
    }),
  );
  await assertFails(getDocs(collection(alice, "users/alice/boards")));
  await assertFails(deleteDoc(doc(alice, path)));
  const repository = createCloudRepository(alice, "alice");
  const current = await repository.read();
  assert.equal(current.revision, 1);
  assert.equal(await repository.write(current.board, 1), 2);
  await assert.rejects(repository.write(current.board, 1), {
    code: "board/conflict",
  });
});
