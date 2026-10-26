import { useState } from "react";
import { Stats, Menu } from "./BoardViews.jsx";
import Modal from "./Modal.jsx";
import DatePicker from "./DatePicker.jsx";
import Sortable from "./Sortable.jsx";
import { ShoppingShare } from "./ShoppingShare.jsx";
import { uid } from "../domain/schedule.js";
import { reorderBefore } from "../domain/board.js";
import {
  stores,
  categories,
  cleanItem,
  itemDetails,
  weekCampaign,
} from "../domain/shopping.js";
function Fields({ value, onChange }) {
  const [store, setStore] = useState(
    stores.includes(value.store) ? value.store : value.store ? "Annan" : "",
  );
  const [campaign, setCampaign] = useState(value.campaignStart ? "custom" : "");
  const change = (key, v) => onChange({ ...value, [key]: v });
  return (
    <details className="shopping-fields" open={undefined}>
      <summary>Fler uppgifter</summary>
      <div className="formgrid">
        <label>
          Pris (kr)
          <input
            className="textinput"
            inputMode="decimal"
            value={value.price ?? ""}
            onChange={(e) => change("price", e.target.value)}
            placeholder="Valfritt"
          />
        </label>
        <label>
          Butik
          <select
            value={store}
            onChange={(e) => {
              setStore(e.target.value);
              change("store", e.target.value === "Annan" ? "" : e.target.value);
            }}
          >
            <option value="">Ingen vald</option>
            {[...stores, "Annan"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {store === "Annan" && (
          <label>
            Butikens namn
            <input
              className="textinput"
              maxLength={100}
              value={value.store || ""}
              onChange={(e) => change("store", e.target.value)}
            />
          </label>
        )}
        <label>
          Typ
          <select
            value={value.category || ""}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="">Ingen vald</option>
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Kampanj
          <select
            value={campaign}
            onChange={(e) => {
              const mode = e.target.value;
              setCampaign(mode);
              onChange({
                ...value,
                ...(mode === "week"
                  ? weekCampaign()
                  : { campaignStart: "", campaignEnd: "" }),
              });
            }}
          >
            <option value="">Ingen kampanj</option>
            <option value="week">Denna vecka</option>
            <option value="custom">Välj datum</option>
          </select>
        </label>
        {campaign && (
          <>
            <DatePicker
              label="Kampanj från"
              value={value.campaignStart || ""}
              onChange={(v) => change("campaignStart", v)}
            />
            <DatePicker
              label="Kampanj till"
              value={value.campaignEnd || ""}
              onChange={(v) => change("campaignEnd", v)}
            />
          </>
        )}
      </div>
    </details>
  );
}
export default function ShoppingView({
  board,
  commit,
  notify,
  revision,
  cloud,
}) {
  const [draft, setDraft] = useState({ name: "" }),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [share, setShare] = useState(null),
    [formKey, setFormKey] = useState(0);
  const left = board.shopping.filter((x) => !x.done).length;
  function save(e, edit = false) {
    e.preventDefault();
    setError("");
    try {
      if (edit && cloud && editing.revision !== revision)
        throw Error(
          "Listan har ändrats. Stäng formuläret och öppna varan igen.",
        );
      const item = cleanItem(
        edit ? editing.item : { ...draft, id: uid(), done: false },
      );
      commit((s) => {
        if (edit)
          s.shopping = s.shopping.map((x) => (x.id === item.id ? item : x));
        else s.shopping.push(item);
      });
      if (edit) setEditing(null);
      else {
        setDraft({ name: "" });
        setFormKey((x) => x + 1);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  const actions = {
    edit: (id) => {
      setError("");
      setEditing({
        item: { ...board.shopping.find((x) => x.id === id) },
        revision,
      });
    },
    remove: (id) => {
      if (confirm("Ta bort varan?")) {
        commit((s) => {
          s.shopping = s.shopping.filter((x) => x.id !== id);
        });
        notify("Varan togs bort.");
      }
    },
  };
  return (
    <>
      <Stats
        items={[
          ["KVAR ATT KÖPA", left],
          ["I LISTAN", board.shopping.length],
          ["KLARA", board.shopping.length - left],
        ]}
      />
      <section className="panel">
        <div className="panelhead">
          <h3>Handla</h3>
          <div className="section-actions equal-actions">
            <button
              className="secondary"
              disabled={!board.shopping.length}
              onClick={() => setShare(board.shopping.map((x) => ({ ...x })))}
            >
              Visa QR-kod
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (confirm("Rensa alla köpta varor?")) {
                  commit((s) => {
                    s.shopping = s.shopping.filter((x) => !x.done);
                  });
                  notify("Köpta varor rensade.");
                }
              }}
            >
              Rensa köpta
            </button>
          </div>
        </div>
        <form className="listcontrols shopping-add" onSubmit={(e) => save(e)}>
          <div className="shopping-quick">
            <input
              className="textinput"
              aria-label="Ny vara"
              required
              maxLength={100}
              placeholder="Lägg till en vara"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <button className="primary">Lägg till</button>
          </div>
          <Fields key={formKey} value={draft} onChange={setDraft} />
        </form>
        {error && !editing && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {board.shopping.map((item) => (
          <Sortable
            key={item.id}
            id={item.id}
            group="shopping"
            className="taskrow"
            onMove={(id, target, after) =>
              commit((s) => reorderBefore(s.shopping, id, target, after))
            }
          >
            <button
              className="taskhit"
              aria-pressed={item.done}
              onClick={() =>
                commit((s) => {
                  const x = s.shopping.find((x) => x.id === item.id);
                  if (x) x.done = !x.done;
                })
              }
            >
              <span className={`checkmark ${item.done ? "done" : ""}`}>✓</span>
              <span className="tasktext">
                <span className={`taskname ${item.done ? "done" : ""}`}>
                  {item.name}
                </span>
                <span className="taskmeta">{itemDetails(item)}</span>
              </span>
            </button>
            <Menu entity={item} actions={actions} />
          </Sortable>
        ))}
        {!board.shopping.length && (
          <div className="empty">Inköpslistan är tom.</div>
        )}
        <p className="smallprint">
          Håll inne en vara och dra för att ändra ordningen.
        </p>
      </section>
      {editing && (
        <Modal
          title="Redigera vara"
          onClose={() => {
            setEditing(null);
            setError("");
          }}
        >
          <form onSubmit={(e) => save(e, true)}>
            <label>
              Varans namn
              <input
                className="textinput"
                required
                maxLength={100}
                value={editing.item.name}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    item: { ...editing.item, name: e.target.value },
                  })
                }
              />
            </label>
            <Fields
              value={editing.item}
              onChange={(item) => setEditing({ ...editing, item })}
            />
            {error && (
              <p role="alert" className="notice">
                {error}
              </p>
            )}
            <div className="formactions">
              <button className="primary">Spara vara</button>
            </div>
          </form>
        </Modal>
      )}
      {share && <ShoppingShare items={share} onClose={() => setShare(null)} />}
    </>
  );
}
