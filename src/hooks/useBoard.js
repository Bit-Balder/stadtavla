import { useEffect, useRef, useState } from "react";
import { useLocalBoard } from "./useLocalBoard.js";
import { createCloudSession } from "../storage/cloudSession.js";
import { createCloudCache } from "../storage/cloudCache.js";
import { createLocalRepository } from "../storage/localRepository.js";
import { deep, defaults } from "../domain/schedule.js";
import { updateBoard } from "../domain/board.js";
export function useBoard({ cloudRepository, user } = {}) {
  const local = useLocalBoard(!cloudRepository);
  const [cloud, setCloud] = useState({
    board: null,
    error: "",
    status: "Läser molnuppgifter…",
  });
  const controller = useRef(null),
    current = useRef(null),
    undoState = useRef(null);
  useEffect(() => {
    if (!cloudRepository) return;
    let cache;
    try {
      cache = createCloudCache(window.localStorage, user.uid);
    } catch {
      cache = {
        read() {
          return null;
        },
        write() {
          throw Error("Lokal lagring är avstängd");
        },
      };
    }
    const session = createCloudSession({
      repository: cloudRepository,
      cache,
      onChange: (next) => {
        if (
          current.current &&
          !current.current.dirty &&
          next.revision !== current.current.revision
        )
          undoState.current = null;
        current.current = next;
        setCloud(next);
      },
    });
    controller.current = session;
    session.start();
    return () => session.dispose();
  }, [cloudRepository, user?.uid]);
  useEffect(() => {
    if (!cloudRepository || !cloud.dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [cloudRepository, cloud.dirty]);
  if (!cloudRepository) return { ...local, mode: "local" };
  function change(next) {
    if (
      !current.current?.board ||
      current.current.blocked ||
      current.current.needsSetup
    )
      return;
    undoState.current = deep(current.current.board);
    controller.current.commit(next);
  }
  return {
    ...cloud,
    mode: "cloud",
    loadFailed: !!cloud.error,
    commit(update) {
      if (current.current?.board)
        change(updateBoard(current.current.board, update));
    },
    replace(next) {
      change(deep(next));
    },
    undo() {
      if (undoState.current) {
        const previous = undoState.current;
        undoState.current = null;
        change(previous);
        undoState.current = null;
      }
    },
    retry: () => controller.current?.retry(),
    reload: () => {
      undoState.current = null;
      return controller.current?.reload();
    },
    async initialize(useLocal) {
      try {
        const initial = useLocal
          ? await createLocalRepository(window.localStorage).read()
          : defaults();
        await controller.current.initialize(initial);
      } catch {
        setCloud((previous) => ({
          ...previous,
          error:
            "Kunde inte läsa lokala uppgifter. Exportera en säkerhetskopia från läget utan konto.",
        }));
      }
    },
  };
}
