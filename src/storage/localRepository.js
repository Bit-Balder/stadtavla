import { defaults, normalize, deep } from "../domain/schedule.js";
export const STORAGE_KEY = "hemma-stadtavla-v1";
// Repository boundary: replace this implementation when cloud storage is introduced.
// read() -> Promise<board>; write(board) -> Promise<void>.
export function createLocalRepository(storage) {
  return {
    async read() {
      const raw = storage.getItem(STORAGE_KEY);
      return raw === null ? defaults() : normalize(JSON.parse(raw));
    },
    async write(board) {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalize(deep(board))));
    },
  };
}
