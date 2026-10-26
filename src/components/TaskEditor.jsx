import { useState } from "react";
import Modal from "./Modal.jsx";
import ScheduleFields, { validateSchedule } from "./ScheduleFields.jsx";
import {
  deep,
  fmt,
  schedule,
  scheduleLabel,
  today,
  uid,
  weekday,
} from "../domain/schedule.js";
import Sortable from "./Sortable.jsx";
import { reorderBefore } from "../domain/board.js";
function SubFields({ sub, parent, onSave, onClose }) {
  const [draft, setDraft] = useState(() =>
    deep(sub || { id: uid(), name: "", notes: "", schedule: null }),
  );
  const [own, setOwn] = useState(!!sub?.schedule),
    [plan, setPlan] = useState(() => deep(sub?.schedule || schedule(parent)));
  function submit(e) {
    e.preventDefault();
    const error = own && validateSchedule(plan);
    if (error) return alert(error);
    if (draft.name.trim())
      onSave({
        ...draft,
        name: draft.name.trim(),
        notes: draft.notes.trim(),
        schedule: own ? plan : null,
      });
  }
  return (
    <Modal
      title={sub ? "Redigera delmoment" : "Nytt delmoment"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="fieldblock">
          <label className="field" htmlFor="sub-name">
            Namn
          </label>
          <input
            id="sub-name"
            className="textinput"
            required
            maxLength={100}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="fieldblock">
          <label className="field" htmlFor="sub-notes">
            Anteckningar (valfritt)
          </label>
          <textarea
            id="sub-notes"
            className="textinput"
            rows={3}
            maxLength={400}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
        <details className="details">
          <summary>
            Schema · {own ? scheduleLabel(plan) : "Ärver huvuduppgiften"}
          </summary>
          <div className="details-body">
            <label className="checkboxlabel">
              <input
                type="checkbox"
                checked={own}
                onChange={(e) => setOwn(e.target.checked)}
              />
              Eget schema för detta delmoment
            </label>
            {own && <ScheduleFields value={plan} onChange={setPlan} />}
          </div>
        </details>
        <div className="formactions">
          <button className="secondary" type="button" onClick={onClose}>
            Avbryt
          </button>
          <button className="primary" type="submit">
            Spara delmoment
          </button>
        </div>
      </form>
    </Modal>
  );
}
export { SubFields as SubEditor };
export default function TaskEditor({ task, date, onSave, onClose }) {
  const [draft, setDraft] = useState(() =>
    deep(
      task || {
        id: uid(),
        name: "",
        room: "Hela hemmet",
        notes: "",
        subs: [],
        type: date ? "once" : "weekly",
        days: [weekday(date || today())],
        eachN: 14,
        start: fmt(date || today()),
        monthDay: (date || today()).getDate(),
        weekRepeat: 1,
        weekAnchor: fmt(date || today()),
      },
    ),
  );
  const [subEdit, setSubEdit] = useState(undefined);
  function submit(e) {
    e.preventDefault();
    const error = validateSchedule(draft);
    if (error) return alert(error);
    if (draft.name.trim())
      onSave({ ...draft, name: draft.name.trim(), notes: draft.notes.trim() });
  }
  function reorder(id, target, after) {
    const next = deep(draft);
    reorderBefore(next.subs, id, target, after);
    setDraft(next);
  }
  return (
    <>
      <Modal title={task ? "Redigera uppgift" : "Ny uppgift"} onClose={onClose}>
        <form onSubmit={submit}>
          <div className="fieldblock">
            <label className="field" htmlFor="task-name">
              Uppgiftens namn
            </label>
            <input
              id="task-name"
              className="textinput"
              required
              maxLength={100}
              placeholder="Exempel: Städa badrummet"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="fieldgrid">
            <div className="fieldblock">
              <label className="field" htmlFor="task-room">
                Rum eller kategori
              </label>
              <span className="select-wrap">
                <select
                  id="task-room"
                  value={draft.room}
                  onChange={(e) => setDraft({ ...draft, room: e.target.value })}
                >
                  {[
                    ...new Set([
                      "Kök",
                      "Badrum",
                      "Sovrum",
                      "Vardagsrum",
                      "Hela hemmet",
                      "Tvätt",
                      "Huset",
                      "Trädgård",
                      "Annat",
                      draft.room,
                    ]),
                  ].map((room) => (
                    <option key={room}>{room}</option>
                  ))}
                </select>
              </span>
            </div>
            <div className="fieldblock">
              <label className="field" htmlFor="task-notes">
                Anteckningar (valfritt)
              </label>
              <input
                id="task-notes"
                className="textinput"
                maxLength={400}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
          </div>
          <details className="details">
            <summary>Schema · {scheduleLabel(draft)}</summary>
            <div className="details-body">
              <ScheduleFields value={draft} onChange={setDraft} />
            </div>
          </details>
          <div className="panelhead">
            <span className="field">Delmoment</span>
            <button
              type="button"
              className="secondary"
              onClick={() => setSubEdit(null)}
            >
              + Delmoment
            </button>
          </div>
          {draft.subs.map((sub, i) => (
            <Sortable
              className="sub-edit-row"
              key={sub.id}
              id={sub.id}
              group="draft-subs"
              onMove={reorder}
            >
              <button
                type="button"
                className="secondary grow text-left"
                onClick={() => setSubEdit(sub)}
              >
                {sub.name}
                <span className="taskmeta">{scheduleLabel(sub.schedule)}</span>
              </button>
              <button
                type="button"
                className="tinybtn danger"
                aria-label="Ta bort delmoment"
                onClick={() => {
                  if (confirm("Ta bort delmomentet?"))
                    setDraft({
                      ...draft,
                      subs: draft.subs.filter((s) => s.id !== sub.id),
                    });
                }}
              >
                ×
              </button>
            </Sortable>
          ))}
          <div className="formactions">
            <button className="secondary" type="button" onClick={onClose}>
              Avbryt
            </button>
            <button className="primary" type="submit">
              Spara uppgift
            </button>
          </div>
        </form>
      </Modal>
      {subEdit !== undefined && (
        <SubFields
          sub={subEdit}
          parent={draft}
          onClose={() => setSubEdit(undefined)}
          onSave={(sub) => {
            setDraft({
              ...draft,
              subs: subEdit
                ? draft.subs.map((s) => (s.id === sub.id ? sub : s))
                : [...draft.subs, sub],
            });
            setSubEdit(undefined);
          }}
        />
      )}
    </>
  );
}
