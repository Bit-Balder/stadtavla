import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Modal from "./Modal.jsx";
import { decodeShopping, shoppingURL } from "../domain/shoppingShare.js";
import { itemDetails } from "../domain/shopping.js";
export function ShoppingShare({ items, onClose }) {
  const [svg, setSvg] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    try {
      const url = shoppingURL(items, window.location.href);
      QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 4,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((s) => {
          if (active) setSvg(s);
        })
        .catch(() => {
          if (active)
            setError("Kunde inte skapa QR-koden. Försök med en kortare lista.");
        });
    } catch (e) {
      setError(e.message);
    }
    return () => {
      active = false;
    };
  }, [items]);
  return (
    <Modal title="Ta med inköpslistan" onClose={onClose}>
      <p className="caption">
        Skanna med mobilens kamera. Kopian innehåller {items.length} varor.
      </p>
      {error ? (
        <p role="alert" className="notice">
          {error}
        </p>
      ) : svg ? (
        <div
          className="shopping-qr"
          role="img"
          aria-label="QR-kod för inköpslistan"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p role="status">Skapar QR-kod…</p>
      )}
      <p className="smallprint">
        Mobilens avbockningar påverkar inte plattan. Alla som skannar koden kan
        läsa kopian.
      </p>
    </Modal>
  );
}
export default function ShoppingCopy({ encoded }) {
  const [state, setState] = useState(() => {
    try {
      const items = decodeShopping(encoded);
      let done = null;
      let warning = "";
      try {
        const saved = JSON.parse(
          localStorage.getItem("stadtavla-shopping-copy") || "null",
        );
        if (saved?.encoded === encoded && Array.isArray(saved.done))
          done = saved.done;
      } catch {
        warning = "Avbockningar kan inte sparas på den här enheten.";
      }
      return {
        items: items.map((x) => ({
          ...x,
          done: done ? done.includes(x.id) : x.done,
        })),
        warning,
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  function toggle(id) {
    setState((previous) => {
      const items = previous.items.map((x) =>
        x.id === id ? { ...x, done: !x.done } : x,
      );
      let warning = "";
      try {
        localStorage.setItem(
          "stadtavla-shopping-copy",
          JSON.stringify({
            encoded,
            done: items.filter((x) => x.done).map((x) => x.id),
          }),
        );
      } catch {
        warning =
          "Avbockningar kan inte sparas. Håll sidan öppen medan du handlar.";
      }
      return { items, warning };
    });
  }
  return (
    <main className="shopping-copy">
      <p className="kicker">HEMMA · INKÖPSKOPIA</p>
      <h1>Din inköpslista</h1>
      {state.error ? (
        <p className="notice" role="alert">
          {state.error}
        </p>
      ) : (
        <>
          <p className="caption">
            {state.items.filter((x) => !x.done).length} kvar att köpa · Kopian
            påverkar inte plattan.
          </p>
          {state.warning && (
            <p role="alert" className="notice">
              {state.warning}
            </p>
          )}
          <section className="panel">
            {state.items.map((item) => (
              <div className="taskrow" key={item.id}>
                <button
                  className="taskhit"
                  aria-pressed={item.done}
                  onClick={() => toggle(item.id)}
                >
                  <span className={`checkmark ${item.done ? "done" : ""}`}>
                    ✓
                  </span>
                  <span className="tasktext">
                    <span className={`taskname ${item.done ? "done" : ""}`}>
                      {item.name}
                    </span>
                    <span className="taskmeta">{itemDetails(item)}</span>
                  </span>
                </button>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
