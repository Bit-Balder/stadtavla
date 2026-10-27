import Sortable from "./Sortable.jsx";
import { useState } from "react";
import {
  advance,
  DAYS,
  dateLong,
  fmt,
  isoWeek,
  MONTHS,
  scheduleLabel,
  today,
  weekStart,
  weekday,
} from "../domain/schedule.js";
import { completed, dueEntries, progress } from "../domain/board.js";
export function Progress({ done, total }) {
  return (
    <div className="progress" aria-label={`${done} av ${total} klara`}>
      <div
        style={{ width: `${total ? Math.round((100 * done) / total) : 100}%` }}
      />
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="statgrid">
      {items.map(([label, count, detail]) => (
        <div className="stat" key={label}>
          <label>{label}</label>
          <strong>{count}</strong>
          <span>{detail}</span>
        </div>
      ))}
    </div>
  );
}
export function Menu({ entity, date, actions }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="menuwrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        className="morebtn"
        aria-label={`Fler alternativ för ${entity.name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="dropdown">
          {[
            ["Redigera", () => actions.edit(entity.id)],
            ...(actions.move
              ? [["Flytta", () => actions.move(entity.id, date)]]
              : []),
            ["Ta bort", () => actions.remove(entity.id, date)],
          ].map(([label, fn]) => (
            <button
              key={label}
              className={label === "Ta bort" ? "danger" : ""}
              onClick={() => {
                setOpen(false);
                fn();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function Row({ entry, date, board, actions }) {
  const entity = entry.sub || entry.task,
    done = completed(board, entry.id, date);
  return (
    <Sortable
      id={entity.id}
      group={entry.sub ? `subs-${entry.task.id}` : "tasks"}
      onMove={actions.reorder}
      className="taskrow"
    >
      <button
        className="taskhit"
        aria-pressed={done}
        onClick={() => actions.toggle(entry.id, date)}
      >
        <span className={`checkmark ${done ? "done" : ""}`}>✓</span>
        <span className="tasktext">
          <span className={`taskname ${done ? "done" : ""}`}>
            {entity.name}
          </span>
          <span className="taskmeta">{entry.task.room || "Hela hemmet"}</span>
          {entity.notes && <span className="note-inline">{entity.notes}</span>}
        </span>
      </button>
      <Menu entity={entity} date={date} actions={actions} />
    </Sortable>
  );
}
export function DayView({ board, date, actions }) {
  const [missedOpen, setMissedOpen] = useState(false);
  const all = dueEntries(board, date),
    p = progress(board, date),
    filter = actions.currentFilter || "remaining";
  const shown = all.filter(
    (e) =>
      filter === "all" || completed(board, e.id, date) === (filter === "done"),
  );
  const groups = [...new Set(shown.map((e) => e.task.id))];
  const misses = [];
  if (fmt(date) === fmt(today()))
    for (let i = 1; i <= 1; i++) {
      const past = advance(today(), -i);
      for (const entry of dueEntries(board, past))
        if (!completed(board, entry.id, past))
          misses.push({ entry, date: past });
    }
  return (
    <>
      <Stats
        items={[
          ["UPPGIFTER", p.total, "planerade"],
          ["AVKLARADE", p.done, `av ${p.total}`],
          ["KVAR", p.total - p.done, "uppgifter"],
        ]}
      />
      {!!misses.length && (
        <section className="panel missed-panel">
          <button
            className="disclosure"
            aria-expanded={missedOpen}
            aria-controls="missed-tasks"
            onClick={() => setMissedOpen(!missedOpen)}
          >
            <span className="section-title">Missade</span>
            <span className="pill warn">{misses.length}</span>
            <svg
              className="disclosure-arrow"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="m6 9 6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {missedOpen && (
            <div id="missed-tasks">
              {misses.map(({ entry, date: past }) => (
                <div className="taskgroup" key={`${entry.id}${fmt(past)}`}>
                  <div className="taskmeta">{dateLong(past)}</div>
                  <Row
                    entry={entry}
                    date={past}
                    board={board}
                    actions={{ ...actions, reorder: undefined }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="panel">
        <div className="panelhead">
          <h3>
            {fmt(date) === fmt(today())
              ? "Att göra idag"
              : date < today()
                ? "Så gick dagen"
                : "Planerat den här dagen"}
          </h3>
          <div className="section-actions">
            <span className="pill">
              {p.total ? Math.round((p.done / p.total) * 100) : 100}% klart
            </span>
            <button
              className="iconbtn square-add"
              aria-label="Lägg till uppgift"
              onClick={() => actions.add(date)}
            >
              +
            </button>
          </div>
        </div>
        <div className="filterbar">
          {[
            ["remaining", "Kvarvarande"],
            ["done", "Färdiga"],
            ["all", "Alla"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`filterbtn ${filter === key ? "active" : ""}`}
              onClick={() => actions.filter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {!shown.length && (
          <div className="empty compact">
            {p.total && p.done === p.total
              ? "Alla dagens uppgifter är klara."
              : p.total
                ? "Inga uppgifter med det här filtret."
                : "Inga uppgifter den här dagen."}
          </div>
        )}
        {groups.map((id) => {
          const entries = shown.filter((e) => e.task.id === id),
            task = entries[0].task;
          if (!task.subs.length)
            return (
              <Row
                key={id}
                entry={entries[0]}
                date={date}
                board={board}
                actions={actions}
              />
            );
          const taskAll = all.filter((e) => e.task.id === id),
            done = taskAll.filter((e) => completed(board, e.id, date)).length,
            expanded = board.settings.expanded[id] !== false;
          return (
            <Sortable
              className="taskgroup"
              key={id}
              id={id}
              group="tasks"
              onMove={actions.reorder}
            >
              <div className="taskrow">
                <button
                  className="taskhit"
                  aria-expanded={expanded}
                  onClick={() => actions.expand(id)}
                >
                  <span className="chev">{expanded ? "⌄" : "›"}</span>
                  <span
                    className={`checkmark ${done === taskAll.length ? "done" : ""}`}
                  >
                    ✓
                  </span>
                  <span className="tasktext">
                    <span className="taskname">{task.name}</span>
                    <span className="taskmeta">
                      {task.room} · {done} av {taskAll.length} delmoment klara
                    </span>
                  </span>
                </button>
                <Menu entity={task} date={date} actions={actions} />
              </div>
              {expanded && (
                <div className="subtasks">
                  {entries.map((entry) => (
                    <Row
                      key={entry.id}
                      entry={entry}
                      date={date}
                      board={board}
                      actions={actions}
                    />
                  ))}
                  <button
                    className="minibtn"
                    onClick={() => actions.addSub(task.id)}
                  >
                    + Delmoment
                  </button>
                </div>
              )}
            </Sortable>
          );
        })}
        <Progress {...p} />
        {p.total > 0 && p.total === p.done && (
          <p className="successnote">Alla dagens uppgifter är klara.</p>
        )}
      </section>
    </>
  );
}
export function CalendarView({ board, date, monthly, onOpen }) {
  const start = monthly
    ? new Date(date.getFullYear(), date.getMonth(), 1, 12)
    : weekStart(date);
  const count = monthly
    ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    : 7;
  const days = Array.from({ length: count }, (_, i) => advance(start, i));
  const totals = days.reduce(
    (sum, d) => {
      const p = progress(board, d);
      return { total: sum.total + p.total, done: sum.done + p.done };
    },
    { total: 0, done: 0 },
  );
  return (
    <section className="panel">
      <div className="panelhead">
        <h3>{monthly ? MONTHS[date.getMonth()] : `Vecka ${isoWeek(date)}`}</h3>
      </div>
      <div className={monthly ? "monthgrid" : "weekgrid"}>
        {monthly &&
          DAYS.map((day) => (
            <div key={day} className="monthweekday">
              {day.slice(0, 3)}
            </div>
          ))}
        {monthly &&
          Array.from({ length: weekday(start) }, (_, i) => (
            <div key={`blank${i}`} className="monthday empty" />
          ))}
        {days.map((d) => {
          const p = progress(board, d);
          return (
            <button
              key={fmt(d)}
              className={`${monthly ? "monthday" : "daybox"} ${fmt(d) === fmt(today()) ? "today" : ""}`}
              onClick={() => onOpen(d)}
              aria-label={`${dateLong(d)}, ${p.done} av ${p.total} klara`}
            >
              {!monthly && <div className="dow">{DAYS[weekday(d)]}</div>}
              <div className={monthly ? "monthnum" : "daynum"}>
                {d.getDate()}
              </div>
              <div className={monthly ? "monthstat" : "summary"}>
                {p.total ? `${p.done} / ${p.total} klara` : "Ledigt"}
              </div>
            </button>
          );
        })}
      </div>
      <Progress {...totals} />
      <p className="caption">
        {totals.done} av {totals.total} uppgifter klara.
      </p>
    </section>
  );
}
export function TasksView({ board, actions }) {
  return (
    <section className="panel">
      <div className="panelhead">
        <h3>Städuppgifter</h3>
        <button
          className="iconbtn square-add"
          aria-label="Lägg till uppgift"
          onClick={() => actions.add()}
        >
          +
        </button>
      </div>
      {board.tasks.map((task, i) => (
        <Sortable
          key={task.id}
          id={task.id}
          group="tasks"
          onMove={actions.reorder}
        >
          <div className="manageitem">
            <div className="maintext">
              <div className="taskname">{task.name}</div>
              <div className="taskmeta">
                {task.room} · {scheduleLabel(task)}
                {task.subs.length ? ` · ${task.subs.length} delmoment` : ""}
              </div>
              {task.notes && <div className="note-inline">{task.notes}</div>}
            </div>
            <Menu entity={task} actions={actions} />
          </div>
          {task.subs.map((sub, j) => (
            <Sortable
              id={sub.id}
              group={`subs-${task.id}`}
              onMove={actions.reorder}
              key={sub.id}
              className="manageitem sub-indent"
            >
              <button className="taskhit" onClick={() => actions.edit(sub.id)}>
                <span className="tasktext">
                  <span className="taskname">{sub.name}</span>
                  <span className="taskmeta">
                    {scheduleLabel(sub.schedule)}
                  </span>
                </span>
              </button>
              <Menu entity={sub} actions={actions} />
            </Sortable>
          ))}
          <button className="minibtn" onClick={() => actions.addSub(task.id)}>
            + Delmoment
          </button>
        </Sortable>
      ))}
      {!board.tasks.length && <div className="empty">Inga uppgifter ännu.</div>}
    </section>
  );
}
