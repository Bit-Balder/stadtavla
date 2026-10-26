import { useEffect, useRef, useState } from "react";
// Touch listeners also support Safari versions without Pointer Events.
export default function Sortable({
  id,
  group,
  onMove,
  className = "",
  children,
  style,
}) {
  const ref = useRef(null),
    callback = useRef(onMove);
  const [dragging, setDragging] = useState(false);
  callback.current = onMove;
  useEffect(() => {
    const node = ref.current;
    let timer,
      active = false,
      start,
      target,
      after,
      suppress = false;
    const point = (e) => (e.touches ? e.touches[0] : e);
    function finish(e) {
      clearTimeout(timer);
      if (active) {
        suppress = true;
        if (e?.type !== "touchcancel" && target && target !== id)
          callback.current?.(id, target, after);
      }
      active = false;
      target = null;
      start = null;
      setDragging(false);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", finish);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", finish);
    }
    function move(e) {
      const p = point(e);
      if (!p || !start) return;
      if (!active) {
        if (Math.abs(p.clientX - start.x) + Math.abs(p.clientY - start.y) > 12)
          finish();
        return;
      }
      if (e.cancelable) e.preventDefault();
      const element = document.elementFromPoint(p.clientX, p.clientY);
      let row = element?.closest("[data-sort-id]");
      while (row && row.dataset.sortGroup !== group)
        row = row.parentElement?.closest("[data-sort-id]");
      if (row) {
        target = row.dataset.sortId;
        const r = row.getBoundingClientRect();
        after = p.clientY > r.top + r.height / 2;
      }
      if (p.clientY < 70) window.scrollBy(0, -15);
      if (p.clientY > window.innerHeight - 90) window.scrollBy(0, 15);
    }
    function begin(e) {
      if (
        !callback.current ||
        e.button > 0 ||
        e.touches?.length > 1 ||
        e.target.closest("input,select,textarea,.menuwrap,.reorder") ||
        node.closest("fieldset:disabled")
      )
        return;
      if (e.target.closest("[data-sort-id]") !== node) return;
      suppress = false;
      const p = point(e);
      start = { x: p.clientX, y: p.clientY };
      timer = setTimeout(() => {
        active = true;
        setDragging(true);
      }, 450);
      document.addEventListener("mousemove", move, { passive: false });
      document.addEventListener("mouseup", finish);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", finish);
      document.addEventListener("touchcancel", finish);
    }
    const click = (e) => {
      if (suppress) {
        e.preventDefault();
        e.stopPropagation();
        suppress = false;
      }
    };
    const context = (e) => {
      if (active) e.preventDefault();
    };
    node.addEventListener("mousedown", begin);
    node.addEventListener("touchstart", begin, { passive: true });
    node.addEventListener("click", click, true);
    node.addEventListener("contextmenu", context);
    return () => {
      finish();
      node.removeEventListener("mousedown", begin);
      node.removeEventListener("touchstart", begin);
      node.removeEventListener("click", click, true);
      node.removeEventListener("contextmenu", context);
    };
  }, [id, group]);
  return (
    <div
      ref={ref}
      data-sort-id={id}
      data-sort-group={group}
      className={`${className} sortable ${dragging ? "dragging" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
