import { deep, normalize } from "../domain/schedule.js";
export function createCloudCache(storage, uid) {
  const key = `hemma-stadtavla-cloud-v1:${uid}`;
  return {
    read() {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!Number.isInteger(data.revision) || data.revision < 0)
        throw Error("Ogiltig lokal molnversion");
      return {
        board: normalize(deep(data.board)),
        revision: data.revision,
        dirty: !!data.dirty,
      };
    },
    write(value) {
      storage.setItem(key, JSON.stringify(value));
    },
  };
}
