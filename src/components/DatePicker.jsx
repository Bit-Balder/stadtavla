import { useEffect, useId, useRef, useState } from "react";
import {
  advance,
  dateLong,
  fmt,
  MONTHS,
  parseDate,
  today,
  weekday,
} from "../domain/schedule.js";
export default function DatePicker({ value, onChange, label = "Datum" }) {
  const [open, setOpen] = useState(false),
    [month, setMonth] = useState(() => parseDate(value));
  const root = useRef(null),
    id = useId();
  useEffect(() => {
    function close(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function key(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", close);
    root.current?.addEventListener("keydown", key);
    const node = root.current;
    return () => {
      document.removeEventListener("pointerdown", close);
      node?.removeEventListener("keydown", key);
    };
  }, []);
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  function choose(date) {
    onChange(fmt(date));
    setOpen(false);
  }
  return (
    <div className="fieldblock">
      <label className="field" htmlFor={id}>
        {label}
      </label>
      <div className="date-control" ref={root}>
        <button
          id={id}
          type="button"
          className="date-trigger"
          aria-expanded={open}
          onClick={() => {
            setMonth(parseDate(value));
            setOpen(!open);
          }}
        >
          {value ? dateLong(parseDate(value)) : "Välj datum"}
        </button>
        {open && (
          <div className="date-calendar">
            <div className="calendar-top">
              <button
                type="button"
                className="calendar-arrow"
                aria-label="Föregående månad"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1, 12),
                  )
                }
              >
                ‹
              </button>
              <span className="calendar-title">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </span>
              <button
                type="button"
                className="calendar-arrow"
                aria-label="Nästa månad"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1, 12),
                  )
                }
              >
                ›
              </button>
            </div>
            <div className="calendar-grid">
              {["M", "T", "O", "T", "F", "L", "S"].map((day, i) => (
                <span key={i} className="calendar-weekday">
                  {day}
                </span>
              ))}
              {Array.from({ length: weekday(first) }, (_, i) => (
                <span key={`blank${i}`} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const date = advance(first, i);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`calendar-date${fmt(date) === value ? " active" : ""}${fmt(date) === fmt(today()) ? " is-today" : ""}`}
                    aria-label={dateLong(date)}
                    aria-pressed={fmt(date) === value}
                    onClick={() => choose(date)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              className="calendar-bottom"
              type="button"
              onClick={() => choose(today())}
            >
              Idag
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
