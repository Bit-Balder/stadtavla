import { fmt, schedule, scheduled, parseDate, deep } from "./schedule.js";
export function completed(state, id, date) {
  return (state.done[fmt(date)] || []).includes(id);
}
export function setDone(state, id, date, value) {
  const key = fmt(date),
    list = new Set(state.done[key] || []);
  value ? list.add(id) : list.delete(id);
  if (list.size) state.done[key] = [...list];
  else delete state.done[key];
}
export function activeOn(state, id, plan, date) {
  const key = fmt(date);
  if (state.moves.some((m) => m.id === id && m.from === key)) return false;
  return (
    scheduled(plan, date) ||
    state.moves.some((m) => m.id === id && m.to === key)
  );
}
export function dueEntries(state, date) {
  const entries = [];
  for (const task of state.tasks) {
    const entities = task.subs.length ? task.subs : [task];
    for (const entity of entities) {
      const plan =
        entity === task ? schedule(task) : entity.schedule || schedule(task);
      if (
        activeOn(state, entity.id, plan, date) &&
        !state.skips.some((s) => s.id === entity.id && s.date === fmt(date))
      )
        entries.push({
          task,
          sub: entity === task ? null : entity,
          id: entity.id,
        });
    }
  }
  return entries;
}
export function progress(state, date) {
  const entries = dueEntries(state, date);
  return {
    total: entries.length,
    done: entries.filter((e) => completed(state, e.id, date)).length,
  };
}
export function findEntity(state, id) {
  for (const task of state.tasks) {
    if (task.id === id) return { task, sub: null };
    const sub = task.subs.find((s) => s.id === id);
    if (sub) return { task, sub };
  }
  return null;
}
export function removeEntities(state, ids) {
  for (const key of Object.keys(state.done)) {
    state.done[key] = state.done[key].filter((id) => !ids.includes(id));
    if (!state.done[key].length) delete state.done[key];
  }
  state.moves = state.moves.filter((m) => !ids.includes(m.id));
  state.skips = state.skips.filter((s) => !ids.includes(s.id));
}
export function moveOccurrence(state, id, from, to) {
  if (from === to) return;
  const entity = findEntity(state, id);
  if (!entity) return;
  const ids =
    !entity.sub && entity.task.subs.length
      ? dueEntries(state, parseDate(from))
          .filter((e) => e.task.id === id)
          .map((e) => e.id)
      : [id];
  for (const item of ids) {
    const previous = state.moves.find((m) => m.id === item && m.to === from);
    if (previous) previous.to = to;
    else {
      state.moves = state.moves.filter(
        (m) => !(m.id === item && m.from === from),
      );
      state.moves.push({ id: item, from, to });
    }
    if (completed(state, item, parseDate(from))) {
      setDone(state, item, parseDate(from), false);
      setDone(state, item, parseDate(to), true);
    }
  }
}
export function changeOrder(list, id, delta) {
  const index = list.findIndex((item) => item.id === id),
    target = index + delta;
  if (index >= 0 && target >= 0 && target < list.length)
    [list[index], list[target]] = [list[target], list[index]];
}
export function updateBoard(state, change) {
  const next = deep(state);
  change(next);
  return next;
}

export function reorderBefore(list, id, targetId, after = false) {
  const from = list.findIndex((x) => x.id === id);
  if (id === targetId || from < 0 || !list.some((x) => x.id === targetId))
    return;
  const [item] = list.splice(from, 1);
  const to = list.findIndex((x) => x.id === targetId);
  list.splice(to + (after ? 1 : 0), 0, item);
}

export function skipOccurrence(state, id, date) {
  const entity = findEntity(state, id);
  if (!entity) return;
  const ids =
    !entity.sub && entity.task.subs.length
      ? dueEntries(state, date)
          .filter((e) => e.task.id === id)
          .map((e) => e.id)
      : [id];
  const day = fmt(date);
  for (const item of ids) {
    if (!state.skips.some((s) => s.id === item && s.date === day))
      state.skips.push({ id: item, date: day });
    setDone(state, item, date, false);
  }
}
export function deleteTask(state, id) {
  const entity = findEntity(state, id);
  if (!entity) return;
  const ids = entity.sub ? [id] : [id, ...entity.task.subs.map((s) => s.id)];
  if (entity.sub)
    entity.task.subs = entity.task.subs.filter((s) => s.id !== id);
  else state.tasks = state.tasks.filter((t) => t.id !== id);
  removeEntities(state, ids);
}
