import { useEffect, useRef, useState } from "react";
import { useBoard } from "./hooks/useBoard.js";
import { useClock, useTheme, useWakeLock } from "./hooks/useDevice.js";
import {
  advance,
  dateLong,
  deep,
  fmt,
  isoWeek,
  MONTHS,
  parseDate,
  today,
  weekStart,
} from "./domain/schedule.js";
import {
  changeOrder,
  completed,
  findEntity,
  moveOccurrence,
  removeEntities,
  setDone,
} from "./domain/board.js";
import {
  CalendarView,
  DayView,
  ShoppingView,
  TasksView,
} from "./components/BoardViews.jsx";
import SettingsView from "./components/SettingsView.jsx";
import TaskEditor, { SubEditor } from "./components/TaskEditor.jsx";
import Modal from "./components/Modal.jsx";
import DatePicker from "./components/DatePicker.jsx";
const pages = [
  ["day", "Dag", "Dagens städning"],
  ["week", "Vecka", "Veckoplanering"],
  ["month", "Månad", "Månadsöversikt"],
  ["shopping", "Inköp", "Inköpslista"],
  ["tasks", "Uppgifter", "Alla uppgifter"],
  ["settings", "Inställningar", "Inställningar"],
];
function MoveEditor({ entity, date, onSave, onClose }) {
  const [target, setTarget] = useState(fmt(advance(date, 1)));
  return (
    <Modal title="Flytta uppgift" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(target);
        }}
      >
        <p className="caption">{entity.name}</p>
        <DatePicker label="Nytt datum" value={target} onChange={setTarget} />
        <p className="caption">
          Endast detta tillfälle flyttas. Grundschemat ändras inte.
        </p>
        <div className="formactions">
          <button type="button" className="secondary" onClick={onClose}>
            Avbryt
          </button>
          <button className="primary">Flytta</button>
        </div>
      </form>
    </Modal>
  );
}
export default function App() {
  const { board, error, loadFailed, commit, replace, undo } = useBoard();
  const [page, setPage] = useState("day"),
    [date, setDate] = useState(today),
    [editor, setEditor] = useState(null),
    [toast, setToast] = useState("");
  const now = useClock(),
    wake = useWakeLock(),
    lastDay = useRef(fmt(today()));
  useTheme(board?.theme || "light");
  useEffect(() => {
    const current = fmt(now);
    if (current !== lastDay.current) {
      const previousDay = lastDay.current;
      setDate((previous) =>
        fmt(previous) === previousDay ? parseDate(current) : previous,
      );
      lastDay.current = current;
    }
  }, [now]);
  function notify(message) {
    setToast(message);
  }
  if (!board)
    return (
      <main className="main">
        <h1>Städtavlan</h1>
        <p role="status">{loadFailed ? error : "Läser städtavlan…"}</p>
        {loadFailed && (
          <p>
            Exportera befintliga data från den gamla appen innan du fortsätter.
          </p>
        )}
      </main>
    );
  function edit(id) {
    const entity = findEntity(board, id);
    if (!entity) return;
    setEditor(
      entity.sub
        ? { type: "sub", task: entity.task, sub: entity.sub }
        : { type: "task", task: entity.task },
    );
  }
  const actions = {
    edit,
    add: (day) => setEditor({ type: "task", date: day }),
    addSub: (id) =>
      setEditor({ type: "sub", task: findEntity(board, id).task }),
    toggle: (id, day) => {
      commit((s) => setDone(s, id, day, !completed(s, id, day)));
      notify("Uppgiften uppdaterad.");
    },
    expand: (id) =>
      commit((s) => {
        s.settings.expanded[id] = s.settings.expanded[id] === false;
      }),
    filter: (value) =>
      commit((s) => {
        s.settings.filter = value;
      }),
    move: (id, day) => setEditor({ type: "move", id, date: day || date }),
    remove: (id) => {
      const entity = findEntity(board, id);
      if (
        !entity ||
        !confirm(
          `Ta bort ${entity.sub ? "delmomentet" : "uppgiften"} och dess historik?`,
        )
      )
        return;
      commit((s) => {
        const e = findEntity(s, id);
        const ids = e.sub ? [id] : [id, ...e.task.subs.map((x) => x.id)];
        if (e.sub) e.task.subs = e.task.subs.filter((x) => x.id !== id);
        else s.tasks = s.tasks.filter((x) => x.id !== id);
        removeEntities(s, ids);
      });
      notify("Uppgiften togs bort.");
    },
    order: (id, delta) =>
      commit((s) => {
        const e = findEntity(s, id);
        changeOrder(e.sub ? e.task.subs : s.tasks, id, delta);
      }),
  };
  const hasDate = ["day", "week", "month"].includes(page);
  function changeDate(step) {
    setDate((previous) =>
      page === "month"
        ? new Date(previous.getFullYear(), previous.getMonth() + step, 1, 12)
        : advance(previous, step * (page === "week" ? 7 : 1)),
    );
  }
  function saveTask(task) {
    commit((s) => {
      const previous = s.tasks.find((t) => t.id === task.id);
      if (previous) {
        removeEntities(
          s,
          previous.subs
            .filter((sub) => !task.subs.some((x) => x.id === sub.id))
            .map((x) => x.id),
        );
        s.tasks = s.tasks.map((t) => (t.id === task.id ? deep(task) : t));
      } else s.tasks.push(deep(task));
    });
    setEditor(null);
    notify("Uppgiften sparades.");
  }
  return (
    <>
      <div
        id="app"
        className={board.settings.collapsed ? "sidebar-hidden" : ""}
      >
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">⌂</div>
            <h1>Hemma.</h1>
            <small>Vår städtavla</small>
          </div>
          <nav className="nav" aria-label="Vyer">
            {pages.map(([key, label]) => (
              <button
                key={key}
                className={`navbtn ${page === key ? "active" : ""}`}
                aria-current={page === key ? "page" : undefined}
                onClick={() => {
                  setPage(key);
                  setToast("");
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="main">
          <header className="top">
            <div className="top-left">
              <button
                className="iconbtn sidebar-toggle"
                aria-label="Visa eller dölj navigation"
                onClick={() =>
                  commit((s) => {
                    s.settings.collapsed = !s.settings.collapsed;
                  })
                }
              >
                ☰
              </button>
              <div>
                <p className="kicker">HEMMA HOS OSS</p>
                <h2>{pages.find(([key]) => key === page)[2]}</h2>
                <p className="dateinfo">
                  {page === "day"
                    ? `${dateLong(date)} · Vecka ${isoWeek(date)}`
                    : page === "week"
                      ? `Vecka ${isoWeek(date)} · ${fmt(weekStart(date))} – ${fmt(advance(weekStart(date), 6))}`
                      : page === "month"
                        ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
                        : ""}
                </p>
              </div>
            </div>
            <div className="top-tools">
              <span className="clock">
                {now.toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {hasDate && (
                <>
                  {fmt(date) !== fmt(today()) && (
                    <button
                      className="top-today"
                      onClick={() => setDate(today())}
                    >
                      Idag
                    </button>
                  )}
                  <button
                    className="arrow"
                    aria-label="Föregående"
                    onClick={() => changeDate(-1)}
                  >
                    ‹
                  </button>
                  <button
                    className="arrow"
                    aria-label="Nästa"
                    onClick={() => changeDate(1)}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </header>
          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}
          {page === "day" && (
            <DayView board={board} date={date} actions={actions} />
          )}
          {["week", "month"].includes(page) && (
            <CalendarView
              board={board}
              date={date}
              monthly={page === "month"}
              onOpen={(day) => {
                setDate(day);
                setPage("day");
              }}
            />
          )}
          {page === "tasks" && <TasksView board={board} actions={actions} />}
          {page === "shopping" && (
            <ShoppingView board={board} commit={commit} notify={notify} />
          )}
          {page === "settings" && (
            <SettingsView
              board={board}
              commit={commit}
              replace={replace}
              notify={notify}
              wake={wake}
            />
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            onClick={() => {
              undo();
              setToast("");
            }}
          >
            Ångra
          </button>
          <button aria-label="Stäng meddelande" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
      {editor?.type === "task" && (
        <TaskEditor
          task={editor.task}
          date={editor.date}
          onClose={() => setEditor(null)}
          onSave={saveTask}
        />
      )}
      {editor?.type === "sub" && (
        <SubEditor
          sub={editor.sub}
          parent={editor.task}
          onClose={() => setEditor(null)}
          onSave={(sub) => {
            commit((s) => {
              const task = s.tasks.find((t) => t.id === editor.task.id);
              task.subs = editor.sub
                ? task.subs.map((x) => (x.id === sub.id ? sub : x))
                : [...task.subs, sub];
            });
            setEditor(null);
            notify("Delmomentet sparades.");
          }}
        />
      )}
      {editor?.type === "move" && (
        <MoveEditor
          entity={
            findEntity(board, editor.id).sub ||
            findEntity(board, editor.id).task
          }
          date={editor.date}
          onClose={() => setEditor(null)}
          onSave={(to) => {
            commit((s) => moveOccurrence(s, editor.id, fmt(editor.date), to));
            setEditor(null);
            notify("Uppgiften flyttades.");
          }}
        />
      )}
    </>
  );
}
