import { useId } from "react";
import { Check, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { ORG_TYPES, type Question } from "@shared/survey";
import { cn } from "@/lib/utils";

type P = { q: Question; value: any; onChange: (v: any) => void; error?: string; getFollow?: (id: string) => any; setFollow?: (id: string, v: any) => void; num?: string };

const inputCls = "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-[15px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function QuestionBlock(p: P) {
  const id = useId();
  const { q } = p;
  const isGroup = ["single", "multi", "likert", "scale5", "pick_rank", "rank", "assets", "text3"].includes(q.type);
  const Label = isGroup ? "legend" : "label";
  const body = (
    <>
      <Label {...(!isGroup ? { htmlFor: id } : {})} className="block">
        <span className="flex gap-3">
          {p.num && <span className="mt-[3px] shrink-0 text-[12px] font-semibold tnum text-muted-foreground">{p.num}</span>}
          <span className="text-[17px] font-medium leading-snug text-foreground">{q.label}</span>
        </span>
      </Label>
      {q.help && <p className={cn("mt-1.5 text-[14px] leading-relaxed text-muted-foreground", p.num && "pl-8")} id={`${id}-help`}>{q.help}</p>}
      <div className={cn("mt-4", p.num && "sm:pl-8")}>
        <Input {...p} id={id} />
        {q.followups?.map((f) => {
          const shown = Array.isArray(p.value) ? p.value.includes(f.when) : p.value === f.when;
          if (!shown) return null;
          return (
            <div key={f.id} className="mt-3 rounded-lg border-l-2 border-terra/60 bg-accent/40 py-2.5 pl-4 pr-3" style={{ borderColor: "hsl(var(--terra) / .6)" }}>
              <label htmlFor={`${id}-${f.id}`} className="text-[14px] font-medium">{f.label}</label>
              <input id={`${id}-${f.id}`} className={cn(inputCls, "mt-1.5")} value={p.getFollow?.(f.id) || ""} placeholder={f.placeholder} maxLength={300} onChange={(e) => p.setFollow?.(f.id, e.target.value)} data-testid={`input-${f.id}`} />
            </div>
          );
        })}
        {p.error && <p className="mt-2 text-[13.5px] font-medium text-destructive" role="alert">{p.error}</p>}
      </div>
    </>
  );
  return isGroup ? <fieldset className="border-0 p-0" aria-describedby={q.help ? `${id}-help` : undefined} data-testid={`q-${q.id}`}>{body}</fieldset> : <div data-testid={`q-${q.id}`}>{body}</div>;
}

function Input(p: P & { id: string }) {
  const { q, value, onChange, id } = p;
  switch (q.type) {
    case "single": return <Choice q={q} value={value} onChange={onChange} />;
    case "multi": return <Multi q={q} value={value || []} onChange={onChange} />;
    case "text": return <input id={id} className={inputCls} value={value || ""} placeholder={q.placeholder} maxLength={2000} onChange={(e) => onChange(e.target.value)} data-testid={`input-${q.id}`} />;
    case "zip": return <input id={id} className={cn(inputCls, "max-w-[11rem] tnum tracking-wider")} inputMode="numeric" autoComplete="postal-code" maxLength={5} value={value || ""} placeholder={q.placeholder} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))} data-testid={`input-${q.id}`} />;
    case "longtext": return (
      <div>
        <textarea id={id} className={cn(inputCls, "min-h-[120px] resize-y leading-relaxed")} value={value || ""} placeholder={q.placeholder || "In your own words"} maxLength={2000} onChange={(e) => onChange(e.target.value)} data-testid={`input-${q.id}`} />
        <p className="mt-1 text-right text-[12px] text-muted-foreground tnum">{(value || "").length} / 2,000</p>
      </div>
    );
    case "likert": return <Likert q={q} value={value} onChange={onChange} />;
    case "scale5": return <Scale q={q} value={value} onChange={onChange} />;
    case "pick_rank": case "rank": return <Rank q={q} value={value || []} onChange={onChange} />;
    case "text3": {
      const arr: string[] = Array.isArray(value) ? value : ["", "", ""];
      return (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold tnum" aria-hidden>{i + 1}</span>
              <input className={inputCls} aria-label={`Challenge ${i + 1}`} value={arr[i] || ""} maxLength={2000} placeholder={["First challenge", "Second challenge", "Third challenge"][i]} onChange={(e) => { const n = [...arr]; n[i] = e.target.value; onChange(n); }} data-testid={`input-${q.id}-${i + 1}`} />
            </div>
          ))}
        </div>
      );
    }
    case "assets": return <Assets value={value} onChange={onChange} />;
  }
  return null;
}

function Choice({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const name = useId();
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
      {q.options!.map((o) => {
        const on = value === o.code;
        return (
          <label key={o.code} className={cn("group flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-[15px] transition-colors hover:border-primary/50", on ? "border-primary bg-primary/[.06] ring-1 ring-primary" : "border-border")} data-testid={`opt-${q.id}-${o.code}`}>
            <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(o.code)} onClick={() => on && onChange(null)} />
            <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2", on ? "border-primary" : "border-input")}>{on && <span className="h-2 w-2 rounded-full bg-primary" />}</span>
            <span className="leading-snug">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function Multi({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: any) => void }) {
  const excl = q.options!.filter((o) => o.exclusive).map((o) => o.code);
  const toggle = (c: string) => {
    if (value.includes(c)) return onChange(value.filter((x) => x !== c));
    if (excl.includes(c)) return onChange([c]);
    onChange([...value.filter((x) => !excl.includes(x)), c]);
  };
  return (
    <div className={cn("grid gap-2", q.options!.length > 6 ? "sm:grid-cols-2" : "")}>
      {q.options!.map((o) => {
        const on = value.includes(o.code);
        return (
          <label key={o.code} className={cn("flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-[15px] transition-colors hover:border-primary/50", on ? "border-primary bg-primary/[.06] ring-1 ring-primary" : "border-border", o.exclusive && "sm:col-span-2 border-dashed")} data-testid={`opt-${q.id}-${o.code}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(o.code)} />
            <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
            <span className="leading-snug">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

const LK = [{ c: "1", l: "Strongly disagree", s: "Strongly\ndisagree" }, { c: "2", l: "Disagree", s: "Disagree" }, { c: "3", l: "Somewhat agree", s: "Somewhat\nagree" }, { c: "4", l: "Strongly agree", s: "Strongly\nagree" }];
function Likert({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const name = useId();
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={q.label}>
        {LK.map((o, i) => {
          const on = value === o.c;
          const tone = i < 2 ? "hsl(var(--lk-1))" : "hsl(var(--lk-4))";
          return (
            <label key={o.c} className={cn("flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-lg border px-1 py-2 text-center text-[12.5px] font-medium leading-tight transition-colors sm:text-[13.5px]", on ? "text-white" : "border-border bg-card hover:border-foreground/30")} style={on ? { background: tone, borderColor: tone } : undefined} data-testid={`opt-${q.id}-${o.c}`}>
              <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(o.c)} />
              <span className="whitespace-pre-line">{o.s}</span>
            </label>
          );
        })}
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[13.5px] text-muted-foreground hover:text-foreground">
        <input type="radio" name={name} className="h-4 w-4 accent-[hsl(var(--primary))]" checked={value === "na"} onChange={() => onChange("na")} data-testid={`opt-${q.id}-na`} />
        Prefer not to answer / not applicable
      </label>
    </div>
  );
}

function Scale({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const name = useId();
  const labels = q.scaleLabels || [];
  const hasNa = q.options!.some((o) => o.code === "na");
  const full = labels.every(Boolean) && labels.length === 5 && !labels.includes("2");
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={q.label}>
        {["1", "2", "3", "4", "5"].map((c, i) => {
          const on = value === c;
          return (
            <label key={c} className={cn("flex min-h-[52px] cursor-pointer flex-col items-center justify-center rounded-lg border text-center transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/30")} data-testid={`opt-${q.id}-${c}`}>
              <input type="radio" name={name} className="sr-only" checked={on} onChange={() => onChange(c)} aria-label={`${c}${labels[i] && labels[i] !== c ? ` — ${labels[i]}` : ""}`} />
              <span className="text-[17px] font-semibold tnum">{c}</span>
              {full && <span className={cn("hidden px-1 text-[11px] leading-tight sm:block", on ? "text-primary-foreground/85" : "text-muted-foreground")}>{labels[i]}</span>}
            </label>
          );
        })}
      </div>
      {!full && <div className="mt-1.5 flex justify-between text-[12.5px] text-muted-foreground"><span>1 = {labels[0]}</span><span>5 = {labels[4]}</span></div>}
      {full && <div className="mt-1.5 flex justify-between text-[12px] text-muted-foreground sm:hidden"><span>1 = {labels[0]}</span><span>5 = {labels[4]}</span></div>}
      {hasNa && (
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[13.5px] text-muted-foreground hover:text-foreground">
          <input type="radio" name={name} className="h-4 w-4" checked={value === "na"} onChange={() => onChange("na")} data-testid={`opt-${q.id}-na`} /> Not sure
        </label>
      )}
    </div>
  );
}

function Rank({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: any) => void }) {
  const max = q.max || q.options!.length;
  const label = (c: string) => q.options!.find((o) => o.code === c)?.label || c;
  const tap = (c: string) => { if (value.includes(c)) onChange(value.filter((x) => x !== c)); else if (value.length < max) onChange([...value, c]); };
  const move = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
      <div>
        <div className="flex flex-wrap gap-2">
          {q.options!.map((o) => {
            const r = value.indexOf(o.code);
            const on = r >= 0; const full = !on && value.length >= max;
            return (
              <button key={o.code} type="button" onClick={() => tap(o.code)} disabled={full} aria-pressed={on} className={cn("inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3.5 py-2 text-[14.5px] transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60", full && "opacity-40")} data-testid={`rank-${q.id}-${o.code}`}>
                {on ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[11.5px] font-bold text-primary tnum">{r + 1}</span> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground" aria-live="polite">{value.length ? `${value.length} of ${max === q.options!.length ? q.options!.length : `up to ${max}`} ranked` : "Tap an option to rank it."}</p>
      </div>
      <ol className="h-fit rounded-xl border border-dashed border-border bg-secondary/40 p-2.5" aria-label="Your ranking">
        {!value.length && <li className="px-2 py-6 text-center text-[13.5px] text-muted-foreground">Your ranking appears here</li>}
        {value.map((c, i) => (
          <li key={c} className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-[14px] shadow-[0_1px_0_hsl(var(--border))] [&+&]:mt-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground tnum">{i + 1}</span>
            <span className="min-w-0 flex-1 leading-snug">{label(c)}</span>
            <button type="button" className="rounded p-1 hover-elevate disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${label(c)} up`}><ChevronUp className="h-4 w-4" /></button>
            <button type="button" className="rounded p-1 hover-elevate disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move ${label(c)} down`}><ChevronDown className="h-4 w-4" /></button>
            <button type="button" className="rounded p-1 hover-elevate" onClick={() => tap(c)} aria-label={`Remove ${label(c)}`}><X className="h-4 w-4" /></button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Assets({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const arr: { name: string; type: string | null; age: string | null }[] = Array.isArray(value) && value.length ? value : [{ name: "", type: null, age: null }];
  const set = (i: number, patch: any) => { const n = arr.map((x, j) => (j === i ? { ...x, ...patch } : x)); onChange(n); };
  return (
    <div className="space-y-3">
      {arr.map((a, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[12.5px] font-semibold tnum" aria-hidden>{i + 1}</span>
            <input className={inputCls} aria-label={`Place or organization ${i + 1}`} placeholder="Name of place, group or organization" value={a.name} maxLength={160} onChange={(e) => set(i, { name: e.target.value })} data-testid={`input-asset-${i + 1}`} />
            {arr.length > 1 && <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))} className="rounded p-1.5 hover-elevate" aria-label={`Remove entry ${i + 1}`}><X className="h-4 w-4" /></button>}
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 sm:pl-10">
            <select className={cn(inputCls, "py-2 text-[14px]")} value={a.type || ""} onChange={(e) => set(i, { type: e.target.value || null })} aria-label={`Type of organization ${i + 1}`} data-testid={`select-asset-type-${i + 1}`}>
              <option value="">Type (optional)</option>
              {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-input bg-card p-1" role="radiogroup" aria-label={`New or established ${i + 1}`}>
              {[["new", "Newly formed"], ["established", "Established"], ["unsure", "Not sure"]].map(([c, l]) => (
                <button type="button" key={c} role="radio" aria-checked={a.age === c} onClick={() => set(i, { age: a.age === c ? null : c })} className={cn("rounded-md px-1.5 py-1.5 text-[12.5px] font-medium", a.age === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      {arr.length < 3 && <button type="button" onClick={() => onChange([...arr, { name: "", type: null, age: null }])} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-2 text-[14px] font-medium text-primary hover:border-primary" data-testid="button-add-asset"><Plus className="h-4 w-4" /> Add another</button>}
    </div>
  );
}
