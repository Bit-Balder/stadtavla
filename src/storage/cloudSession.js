import { deep, defaults, normalize } from "../domain/schedule.js";
export class CloudConflictError extends Error {
  constructor() {
    super("Molnversionen har ändrats på en annan enhet.");
    this.code = "board/conflict";
  }
}
// No Firebase dependencies: the controller is tested with isolated in-memory repositories.
export function createCloudSession({ repository, cache, onChange }) {
  let view = {
    board: null,
    revision: 0,
    dirty: false,
    pending: 0,
    needsSetup: false,
    blocked: false,
    error: "",
    status: "Läser molnuppgifter…",
  };
  let disposed = false,
    unsubscribe,
    queue = Promise.resolve(),
    generation = 0,
    latestRemote = null;
  const emit = () => {
    if (!disposed) onChange({ ...view, board: view.board && deep(view.board) });
  };
  function remember() {
    try {
      cache.write({
        board: view.board,
        revision: view.revision,
        dirty: view.dirty,
      });
    } catch {
      view.error =
        "Kunde inte spara en lokal kopia. Exportera en säkerhetskopia.";
    }
  }
  function failure(error) {
    view.blocked = true;
    view.status = "Synkning pausad";
    view.error =
      error?.code === "board/conflict"
        ? "En annan enhet har ändrat molnuppgifterna. Exportera dina ändringar innan du hämtar molnversionen."
        : error?.code === "permission-denied"
          ? "Åtkomst nekad. Kontrollera att Firestore-reglerna har publicerats för projektet."
          : "Kunde inte nå molnlagringen. Kontrollera anslutningen och försök igen.";
    emit();
  }
  function accept(remote) {
    if (!remote || view.dirty || view.pending || view.blocked) return;
    if (remote.revision < view.revision) return;
    view = {
      ...view,
      board: deep(remote.board),
      revision: remote.revision,
      needsSetup: false,
      status: "Sparat i molnet",
    };
    remember();
    emit();
  }
  function listen() {
    unsubscribe?.();
    unsubscribe = repository.subscribe((remote) => {
      if (remote && (!latestRemote || remote.revision >= latestRemote.revision))
        latestRemote = remote;
      accept(remote);
    }, failure);
  }
  async function start() {
    let cached;
    try {
      cached = cache.read();
    } catch {
      view.error = "Kunde inte läsa den lokala molnkopian.";
    }
    if (cached) {
      view = { ...view, ...cached, blocked: true };
      emit();
    }
    try {
      const remote = await repository.read();
      if (disposed) return;
      if (cached?.dirty) {
        view.blocked = true;
        view.status = "Osparade ändringar";
        view.error =
          "Det finns osparade ändringar från förra besöket. Försök spara igen eller hämta molnversionen.";
      } else if (remote) {
        view = {
          ...view,
          ...remote,
          error: "",
          blocked: false,
          status: "Sparat i molnet",
        };
        remember();
      } else {
        view = {
          ...view,
          board: defaults(),
          revision: 0,
          needsSetup: true,
          blocked: false,
          status: "Välj första uppgifter",
        };
      }
      emit();
      listen();
    } catch (error) {
      if (!disposed) failure(error);
    }
  }
  function save(next) {
    if (disposed) return;
    const currentGeneration = generation;
    view.board = normalize(deep(next));
    view.dirty = true;
    view.pending++;
    view.status = "Sparar…";
    remember();
    emit();
    const snapshot = deep(view.board);
    queue = queue
      .then(async () => {
        if (disposed || currentGeneration !== generation || view.blocked)
          return;
        const revision = await repository.write(snapshot, view.revision);
        if (disposed || currentGeneration !== generation) return;
        view.revision = revision;
      })
      .catch((error) => {
        if (!disposed && currentGeneration === generation) failure(error);
      })
      .finally(() => {
        if (disposed || currentGeneration !== generation) return;
        view.pending--;
        if (!view.pending && !view.blocked) {
          view.dirty = false;
          view.status = "Sparat i molnet";
        }
        remember();
        emit();
        if (
          !view.pending &&
          !view.blocked &&
          latestRemote?.revision > view.revision
        )
          accept(latestRemote);
      });
    return queue;
  }
  return {
    start,
    commit(next) {
      if (!view.blocked && !view.needsSetup && view.board) return save(next);
    },
    initialize(next) {
      if (!view.needsSetup || view.pending || view.blocked) return;
      view.needsSetup = false;
      return save(next);
    },
    retry() {
      if (view.pending) return;
      if (!view.board) return start();
      if (!view.dirty) return this.reload();
      view.blocked = false;
      view.error = "";
      listen();
      return save(view.board);
    },
    async reload() {
      if (view.pending) return;
      generation++;
      view.status = "Hämtar molnversionen…";
      emit();
      try {
        const remote = await repository.read();
        if (disposed) return;
        view = {
          ...view,
          board: remote ? deep(remote.board) : defaults(),
          revision: remote?.revision || 0,
          dirty: false,
          blocked: false,
          needsSetup: !remote,
          error: "",
          status: remote ? "Sparat i molnet" : "Välj första uppgifter",
        };
        remember();
        emit();
        listen();
      } catch (error) {
        if (!disposed) failure(error);
      }
    },
    dispose() {
      disposed = true;
      unsubscribe?.();
    },
    settled() {
      return queue;
    },
  };
}
