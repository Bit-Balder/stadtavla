import { useId } from "react";
import DatePicker from "./DatePicker.jsx";
import { DAYS } from "../domain/schedule.js";
export function validateSchedule(plan) {
  if (plan.type === "weekly" && !plan.days.length)
    return "Välj minst en veckodag.";
  if (
    plan.type === "interval" &&
    (!Number.isInteger(+plan.eachN) || +plan.eachN < 1 || +plan.eachN > 365)
  )
    return "Välj 1–365 dagar.";
  if (
    plan.type === "monthly" &&
    (!Number.isInteger(+plan.monthDay) ||
      +plan.monthDay < 1 ||
      +plan.monthDay > 31)
  )
    return "Välj en dag mellan 1 och 31.";
  if (!plan.start || (plan.type === "weekly" && !plan.weekAnchor))
    return "Välj ett startdatum.";
  return "";
}
export default function ScheduleFields({ value, onChange }) {
  const id = useId();
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <>
      <div className="fieldblock">
        <label className="field" htmlFor={id}>
          Återkommer
        </label>
        <span className="select-wrap">
          <select
            id={id}
            value={value.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {[
              ["once", "En gång"],
              ["daily", "Varje dag"],
              ["weekly", "Valda veckodagar"],
              ["interval", "Var N:e dag"],
              ["monthly", "Varje månad"],
            ].map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </span>
      </div>
      {value.type === "once" && (
        <DatePicker value={value.start} onChange={(v) => set("start", v)} />
      )}
      {value.type === "weekly" && (
        <>
          <div className="fieldblock">
            <span className="field">Veckodagar</span>
            <div className="daychoices">
              {DAYS.map((day, i) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={value.days.includes(i)}
                    onChange={(e) =>
                      set(
                        "days",
                        e.target.checked
                          ? [...value.days, i]
                          : value.days.filter((d) => d !== i),
                      )
                    }
                  />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>
          <div className="fieldgrid cadence-grid">
            <div className="fieldblock">
              <label className="field" htmlFor={`${id}-repeat`}>
                Upprepning
              </label>
              <span className="select-wrap">
                <select
                  id={`${id}-repeat`}
                  value={value.weekRepeat || 1}
                  onChange={(e) =>
                    set(
                      "weekRepeat",
                      e.target.value === "month" ? "month" : +e.target.value,
                    )
                  }
                >
                  {[
                    [1, "Varje vecka"],
                    [2, "Varannan vecka"],
                    [3, "Var tredje vecka"],
                    [4, "Var fjärde vecka"],
                    ["month", "Varje månad"],
                  ].map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <DatePicker
              label="Börjar vecka med"
              value={value.weekAnchor}
              onChange={(v) => set("weekAnchor", v)}
            />
          </div>
          <p className="caption">
            Vid varje månad används samma vecka i månaden som startdatumet.
          </p>
        </>
      )}
      {value.type === "interval" && (
        <div className="fieldgrid">
          <div className="fieldblock">
            <label className="field" htmlFor={`${id}-interval`}>
              Antal dagar
            </label>
            <input
              id={`${id}-interval`}
              className="textinput"
              type="number"
              min="1"
              max="365"
              required
              value={value.eachN}
              onChange={(e) => set("eachN", +e.target.value)}
            />
          </div>
          <DatePicker
            label="Första datum"
            value={value.start}
            onChange={(v) => set("start", v)}
          />
        </div>
      )}
      {value.type === "monthly" && (
        <div className="fieldblock">
          <label className="field" htmlFor={`${id}-day`}>
            Dag i månaden
          </label>
          <input
            id={`${id}-day`}
            className="textinput"
            type="number"
            min="1"
            max="31"
            required
            value={value.monthDay}
            onChange={(e) => set("monthDay", +e.target.value)}
          />
          <p className="caption">
            Månadens sista dag används när dagen saknas.
          </p>
        </div>
      )}
    </>
  );
}
