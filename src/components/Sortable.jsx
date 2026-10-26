import { useEffect, useRef } from "react";
// A floating copy preserves layout while the insertion line shows the destination.
// Native touch events keep this usable on devices without Pointer Events.
export default function Sortable({
  id,
  group,
  onMove,
  className = "",
  children,
}) {
  const root = useRef(null),
    callback = useRef(onMove);
  callback.current = onMove;
  useEffect(() => {
    const node = root.current;
    let timer,
      frame,
      active = false,
      start,
      last,
      target,
      after = false,
      ghost,
      marker;
    let suppressUntil = 0,
      offset;
    const point = (e) => (e.touches ? e.touches[0] : e);
    const scope = () => node.closest(".panel,form") || node.parentElement;
    function clear() {
      clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      ghost?.remove();
      marker?.remove();
      ghost = marker = null;
      node.classList.remove("drag-origin");
      document.body.classList.remove("is-sorting");
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", finish);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", cancel);
      document.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
    }
    function finish(e) {
      const destination = target,
        insertAfter = after,
        commit = active && e && e.type !== "touchcancel";
      if (active) suppressUntil = Date.now() + 600;
      active = false;
      start = last = target = null;
      clear();
      if (
        commit &&
        destination &&
        destination !== id &&
        !node.closest("fieldset:disabled")
      )
        callback.current?.(id, destination, insertAfter);
    }
    function cancel() {
      finish();
    }
    function key(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    }
    function position() {
      if (!last || !ghost) return;
      ghost.style.left = `${last.clientX - offset.x}px`;
      ghost.style.top = `${last.clientY - offset.y}px`;
      let row = document
        .elementFromPoint(last.clientX, last.clientY)
        ?.closest("[data-sort-id]");
      while (row && row.dataset.sortGroup !== group)
        row = row.parentElement?.closest("[data-sort-id]");
      if (
        row &&
        row !== node &&
        scope().contains(row) &&
        row.dataset.sortEnabled === "true"
      ) {
        target = row.dataset.sortId;
        const rect = row.getBoundingClientRect();
        after = last.clientY > rect.top + rect.height / 2;
        marker.style.display = "block";
        marker.style.left = `${rect.left}px`;
        marker.style.width = `${rect.width}px`;
        marker.style.top = `${after ? rect.bottom : rect.top}px`;
      } else {
        target = null;
        marker.style.display = "none";
      }
    }
    function scroll() {
      if (!active) return;
      const container = node.closest(".modal");
      const rect = container
        ? container.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      const dy =
        last.clientY < rect.top + 60
          ? -8
          : last.clientY > rect.bottom - 80
            ? 8
            : 0;
      if (dy) {
        if (container) container.scrollTop += dy;
        else window.scrollBy(0, dy);
        position();
      }
      frame = window.requestAnimationFrame(scroll);
    }
    function lift() {
      if (!start || node.closest("fieldset:disabled")) return;
      active = true;
      const rect = node.getBoundingClientRect();
      offset = { x: start.clientX - rect.left, y: start.clientY - rect.top };
      ghost = node.cloneNode(true);
      ghost.removeAttribute("id");
      ghost.removeAttribute("data-sort-id");
      ghost.removeAttribute("tabindex");
      ghost.querySelectorAll("[id],[data-sort-id],[tabindex]").forEach((el) => {
        el.removeAttribute("id");
        el.removeAttribute("data-sort-id");
        el.removeAttribute("tabindex");
      });
      ghost.setAttribute("aria-hidden", "true");
      ghost.classList.add("drag-preview");
      ghost.style.width = `${rect.width}px`;
      document.body.appendChild(ghost);
      marker = document.createElement("div");
      marker.className = "drop-marker";
      marker.setAttribute("aria-hidden", "true");
      document.body.appendChild(marker);
      node.classList.add("drag-origin");
      document.body.classList.add("is-sorting");
      position();
      frame = window.requestAnimationFrame(scroll);
    }
    function move(e) {
      if (e.touches?.length > 1) {
        cancel();
        return;
      }
      const p = point(e);
      if (!p || !start) return;
      last = { clientX: p.clientX, clientY: p.clientY };
      if (!active) {
        if (
          Math.abs(last.clientX - start.clientX) +
            Math.abs(last.clientY - start.clientY) >
          12
        )
          cancel();
        return;
      }
      if (e.cancelable) e.preventDefault();
      position();
    }
    function begin(e) {
      if (
        !callback.current ||
        Date.now() < suppressUntil ||
        e.button > 0 ||
        e.touches?.length > 1 ||
        e.target.closest("input,select,textarea,.menuwrap,summary,.tinybtn") ||
        node.closest("fieldset:disabled") ||
        e.target.closest("[data-sort-id]") !== node
      )
        return;
      cancel();
      const p = point(e);
      start = last = { clientX: p.clientX, clientY: p.clientY };
      timer = setTimeout(lift, 450);
      document.addEventListener("mousemove", move, { passive: false });
      document.addEventListener("mouseup", finish);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", finish);
      document.addEventListener("touchcancel", cancel);
      document.addEventListener("keydown", key);
      window.addEventListener("blur", cancel);
    }
    const click = (e) => {
      if (Date.now() < suppressUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const context = (e) => {
      if (start) e.preventDefault();
    };
    const keyboard = (e) => {
      if (
        !e.altKey ||
        !["ArrowUp", "ArrowDown"].includes(e.key) ||
        e.target !== node ||
        !callback.current ||
        node.closest("fieldset:disabled")
      )
        return;
      e.preventDefault();
      const rows = [
        ...scope().querySelectorAll('[data-sort-enabled="true"]'),
      ].filter((x) => x.dataset.sortGroup === group);
      const index = rows.indexOf(node),
        next = rows[index + (e.key === "ArrowUp" ? -1 : 1)];
      if (next)
        callback.current(id, next.dataset.sortId, e.key === "ArrowDown");
    };
    node.addEventListener("mousedown", begin);
    node.addEventListener("touchstart", begin, { passive: true });
    node.addEventListener("click", click, true);
    node.addEventListener("contextmenu", context);
    node.addEventListener("keydown", keyboard);
    return () => {
      active = false;
      clear();
      node.removeEventListener("mousedown", begin);
      node.removeEventListener("touchstart", begin);
      node.removeEventListener("click", click, true);
      node.removeEventListener("contextmenu", context);
      node.removeEventListener("keydown", keyboard);
    };
  }, [id, group]);
  return (
    <div
      ref={root}
      data-sort-id={id}
      data-sort-group={group}
      data-sort-enabled={!!onMove}
      tabIndex={onMove ? 0 : undefined}
      title={
        onMove
          ? "Håll inne och dra. Tangentbord: Alt + pil upp eller ned."
          : undefined
      }
      className={`sortable ${className}`}
    >
      {children}
    </div>
  );
}
