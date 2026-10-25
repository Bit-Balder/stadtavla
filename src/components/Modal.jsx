import { useEffect, useId, useRef } from "react";
export default function Modal({ title, onClose, children }) {
  const root = useRef(null),
    id = useId(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    root.current.querySelector("input,button,textarea,select")?.focus();
    function key(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const nodes = [
        ...root.current.querySelectorAll(
          'button,input,select,textarea,[tabindex="0"]',
        ),
      ].filter((n) => !n.disabled && n.getClientRects().length);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    const node = root.current;
    node.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modalshade visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal modal-wide"
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="modal-head">
          <h3 id={id}>{title}</h3>
          <button
            type="button"
            className="iconbtn"
            aria-label="Stäng"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
