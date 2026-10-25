import { useEffect, useRef, useState } from "react";
export function useTheme(theme) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      const dark = theme === "dark" || (theme === "auto" && query.matches);
      document.documentElement.classList.toggle("theme-dark", dark);
      document.querySelector('meta[name="theme-color"]').content = dark
        ? "#121a17"
        : "#f4f4ef";
    }
    apply();
    if (query.addEventListener) query.addEventListener("change", apply);
    else query.addListener(apply);
    return () => {
      if (query.removeEventListener) query.removeEventListener("change", apply);
      else query.removeListener(apply);
    };
  }, [theme]);
}
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function useWakeLock() {
  const lock = useRef(null),
    [awake, setAwake] = useState(false);
  useEffect(
    () => () => {
      lock.current?.release().catch(() => {});
    },
    [],
  );
  async function toggle() {
    if (lock.current) {
      await lock.current.release();
      lock.current = null;
      setAwake(false);
      return;
    }
    try {
      if (!navigator.wakeLock) throw Error();
      const next = await navigator.wakeLock.request("screen");
      lock.current = next;
      setAwake(true);
      next.addEventListener("release", () => {
        lock.current = null;
        setAwake(false);
      });
    } catch {
      alert(
        "Kan inte hålla skärmen tänd här. Använd iPadens inställning för Autolås.",
      );
    }
  }
  return { awake, toggle };
}
