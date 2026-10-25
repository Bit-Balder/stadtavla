import { useEffect, useRef, useState } from "react";
import { deep } from "../domain/schedule.js";
import { updateBoard } from "../domain/board.js";
import { createLocalRepository } from "../storage/localRepository.js";
export function useLocalBoard(enabled = true) {
  const [board, setBoard] = useState(null),
    [error, setError] = useState(""),
    [loadFailed, setLoadFailed] = useState(false);
  const current = useRef(null),
    repository = useRef(null),
    undoState = useRef(null),
    writes = useRef(Promise.resolve());
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    async function load() {
      try {
        repository.current = createLocalRepository(window.localStorage);
        const data = await repository.current.read();
        if (active) {
          current.current = data;
          setBoard(data);
        }
      } catch {
        if (active) {
          setLoadFailed(true);
          setError(
            "Kunde inte läsa sparade data. Befintliga data har inte skrivits över.",
          );
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [enabled]);
  function persist(next) {
    current.current = next;
    setBoard(next);
    // Serialize asynchronous writes so future remote writes retain user action order.
    writes.current = writes.current
      .then(() => repository.current.write(deep(next)))
      .then(() => setError(""))
      .catch(() =>
        setError(
          "Kunde inte spara. Exportera en säkerhetskopia i Inställningar.",
        ),
      );
  }
  function commit(change) {
    undoState.current = deep(current.current);
    persist(updateBoard(current.current, change));
  }
  function replace(next) {
    undoState.current = deep(current.current);
    persist(deep(next));
  }
  function undo() {
    if (!undoState.current) return;
    const previous = undoState.current;
    undoState.current = null;
    persist(previous);
  }
  return { board, error, loadFailed, commit, replace, undo };
}
