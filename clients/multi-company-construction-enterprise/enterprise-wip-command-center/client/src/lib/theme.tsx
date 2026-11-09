import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

let dark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
const subs = new Set<(d: boolean) => void>();
if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", !!dark);
export function useDark() {
  const [d, setD] = useState(!!dark);
  useEffect(() => { const f = (x: boolean) => setD(x); subs.add(f); return () => { subs.delete(f); }; }, []);
  return [d, (x: boolean) => { dark = x; document.documentElement.classList.toggle("dark", x); subs.forEach((f) => f(x)); }] as const;
}
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [d, set] = useDark();
  return (
    <button type="button" onClick={() => set(!d)} className={`inline-flex h-9 w-9 items-center justify-center rounded-full hover-elevate ${className}`} aria-label={d ? "Switch to light mode" : "Switch to dark mode"} data-testid="button-theme">
      {d ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
