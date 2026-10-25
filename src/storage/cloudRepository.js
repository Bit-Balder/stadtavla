import {
  doc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { deep, normalize } from "../domain/schedule.js";
import { CloudConflictError } from "./cloudSession.js";
export function decodeCloudDocument(snapshot) {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (!Number.isInteger(data.revision) || data.revision < 1)
    throw Error("Ogiltig molnversion");
  return { board: normalize(deep(data.board)), revision: data.revision };
}
export function createCloudRepository(database, uid) {
  const reference = doc(database, "users", uid, "boards", "home");
  return {
    async read() {
      return decodeCloudDocument(await getDocFromServer(reference));
    },
    subscribe(next, error) {
      return onSnapshot(
        reference,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
            return;
          try {
            next(decodeCloudDocument(snapshot));
          } catch (e) {
            error(e);
          }
        },
        error,
      );
    },
    async write(board, expectedRevision) {
      const clean = normalize(deep(board));
      return runTransaction(database, async (transaction) => {
        const current = decodeCloudDocument(await transaction.get(reference));
        if ((current?.revision || 0) !== expectedRevision)
          throw new CloudConflictError();
        const revision = expectedRevision + 1;
        transaction.set(reference, {
          board: clean,
          revision,
          updatedAt: serverTimestamp(),
        });
        return revision;
      });
    },
  };
}
