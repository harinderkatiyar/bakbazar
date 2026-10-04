// Save as: src/components/FilterPanel.tsx
// v3: compact + advanced. Small type, dense rows, location tabs with search,
// numeric ranges, "posted within", toggles. Needs the new Filters.ts.
import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Listing, formatPrice } from "../cardListing/Listing";
import {
  POSTED_OPTIONS,
  buildLocationOptions,
  countActiveFilters,
  defaultFilters,
  fieldValue,
  numericDetail,
  type ConditionFilter,
  type FilterConfig,
  type FilterRange,
  type FilterState,
  type LocationOption,
  type PostedFilter,
  type RangeValue,
  type SellerFilter,
} from "../filter/Filters";

/* ------------------------------ tokens -------------------------------- */

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#C4432B]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121821]";
const soft = "bg-[#14213D]/[0.05] dark:bg-white/[0.07]";
const muted = "text-[#14213D]/50 dark:text-white/50";

const has = (arr: string[], v: string) => arr.some((x) => x.toLowerCase() === v.toLowerCase());
const toggleIn = (arr: string[], v: string) =>
  has(arr, v) ? arr.filter((x) => x.toLowerCase() !== v.toLowerCase()) : [...arr, v];
const summarize = (list: string[]) =>
  list.length <= 2 ? list.join(", ") : `${list.slice(0, 2).join(", ")} +${list.length - 2}`;

/* ----------------------------- section -------------------------------- */

const Section = ({
  title,
  summary,
  children,
  defaultOpen = true,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="py-3 first:pt-0.5 last:pb-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-md text-left ${focusRing}`}
      >
        <span className="text-[13px] font-semibold text-[#14213D] dark:text-white">{title}</span>
        {summary && (
          <span className="min-w-0 flex-1 truncate text-right text-[11px] font-medium text-[#C4432B]">{summary}</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 ${muted} transition-transform duration-200 motion-reduce:transition-none ${
            summary ? "" : "ml-auto"
          } ${open ? "" : "-rotate-90"}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-0.5 pb-0.5 pt-2.5">{children}</div>
        </div>
      </div>
    </section>
  );
};

/* --------------------------- segmented control ------------------------- */

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  const n = options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative grid rounded-xl p-0.5 ${soft}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute bottom-0.5 left-0.5 top-0.5 rounded-[10px] bg-white shadow-[0_1px_4px_-1px_rgba(20,33,61,0.3)] transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-[#2b3547]"
        style={{ width: `calc((100% - 0.25rem) / ${n})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex h-8 items-center justify-center gap-1 rounded-[10px] text-xs font-semibold transition-colors ${focusRing} ${
              on
                ? "text-[#14213D] dark:text-white"
                : "text-[#14213D]/50 hover:text-[#14213D] dark:text-white/50 dark:hover:text-white"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`text-[10px] font-medium tabular-nums ${on ? "text-[#C4432B]" : "opacity-70"}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- chips -------------------------------- */

const ChipGroup = ({
  options,
  selected,
  countFor,
  onToggle,
  limit = 8,
}: {
  options: string[];
  selected: string[];
  countFor: (opt: string) => number;
  onToggle: (opt: string) => void;
  limit?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.filter((o, i) => i < limit || selected.includes(o));
  const hidden = options.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((opt) => {
        const on = selected.includes(opt);
        const n = countFor(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={on}
            disabled={!on && n === 0}
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none ${focusRing} ${
              on
                ? "bg-[#C4432B] text-white"
                : `${soft} text-[#14213D] hover:bg-[#14213D]/10 dark:text-white dark:hover:bg-white/15`
            }`}
          >
            {on && <Check className="h-3 w-3" strokeWidth={3} />}
            {opt}
            <span className={`text-[10px] font-normal tabular-nums ${on ? "text-white/75" : muted}`}>{n}</span>
          </button>
        );
      })}
      {options.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold text-[#C4432B] hover:bg-[#C4432B]/10 ${focusRing}`}
        >
          {expanded ? "Less" : `+${hidden} more`}
        </button>
      )}
    </div>
  );
};

/* ----------------------- searchable checkbox list ---------------------- */

const SearchList = ({
  options,
  selected,
  onToggle,
  noun,
}: {
  options: LocationOption[];
  selected: string[];
  onToggle: (v: string) => void;
  noun: string;
}) => {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const known = new Set(options.map((o) => o.value.toLowerCase()));
    // keep selected values visible even if the cascade hides them
    const extra = selected.filter((s) => !known.has(s.toLowerCase())).map((value) => ({ value, count: 0 }));
    const all = [...options, ...extra];
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((o) => o.value.toLowerCase().includes(needle)) : all;
  }, [options, selected, q]);

  return (
    <div>
      {options.length > 6 && (
        <label className={`relative mb-1.5 block rounded-lg ${soft}`}>
          <span className="sr-only">Search {noun}</span>
          <Search className={`pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${muted}`} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${noun}`}
            className="h-8 w-full rounded-lg bg-transparent pl-8 pr-7 text-xs text-[#14213D] outline-none placeholder:text-[#14213D]/40 focus:ring-2 focus:ring-[#C4432B]/30 dark:text-white dark:placeholder:text-white/40"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className={`absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded ${muted} hover:text-[#14213D] dark:hover:text-white`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </label>
      )}

      <div role="group" aria-label={noun} className="-mx-1 max-h-[10.5rem] overflow-y-auto px-1">
        {list.length === 0 ? (
          <p className={`py-3 text-center text-xs ${muted}`}>No {noun} found</p>
        ) : (
          list.map((o) => {
            const on = has(selected, o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(o.value)}
                className={`flex h-8 w-full items-center gap-2 rounded-lg px-1.5 text-left text-xs transition-colors hover:bg-[#14213D]/[0.05] dark:hover:bg-white/[0.07] ${focusRing}`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors ${
                    on
                      ? "border-[#C4432B] bg-[#C4432B] text-white"
                      : "border-[#14213D]/25 dark:border-white/30"
                  }`}
                >
                  {on && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
                <span className={`min-w-0 flex-1 truncate ${on ? "font-semibold" : "font-medium"} text-[#14213D] dark:text-white`}>
                  {o.value}
                </span>
                <span className={`text-[11px] tabular-nums ${muted}`}>{o.count}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

/* --------------------------- location filter --------------------------- */

type Level = "country" | "state" | "city";
const LEVEL_LABEL: Record<Level, string> = { country: "Country", state: "State", city: "City" };

const LocationFilter = ({
  options,
  filters,
  onToggle,
}: {
  options: Record<Level, LocationOption[]>;
  filters: FilterState;
  onToggle: (level: Level, value: string) => void;
}) => {
  const sel = (l: Level) => filters[l] ?? [];
  const levels = (["country", "state", "city"] as Level[]).filter((l) => options[l].length > 0 || sel(l).length > 0);
  const [tab, setTab] = useState<Level>("city");
  const current = levels.includes(tab) ? tab : levels[levels.length - 1];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label="Location level" className={`mb-2 flex gap-0.5 rounded-xl p-0.5 ${soft}`}>
        {levels.map((l) => {
          const on = l === current;
          const n = sel(l).length;
          return (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(l)}
              className={`flex h-7 flex-1 items-center justify-center gap-1 rounded-[10px] text-xs font-semibold transition-colors ${focusRing} ${
                on
                  ? "bg-white text-[#14213D] shadow-[0_1px_4px_-1px_rgba(20,33,61,0.3)] dark:bg-[#2b3547] dark:text-white"
                  : "text-[#14213D]/55 hover:text-[#14213D] dark:text-white/55 dark:hover:text-white"
              }`}
            >
              {LEVEL_LABEL[l]}
              {n > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#C4432B] px-1 text-[9px] font-bold leading-none text-white">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <SearchList
        key={current}
        options={options[current]}
        selected={sel(current)}
        onToggle={(v) => onToggle(current, v)}
        noun={LEVEL_LABEL[current].toLowerCase() === "city" ? "cities" : LEVEL_LABEL[current].toLowerCase() + "s"}
      />
    </div>
  );
};

/* ------------------------------ price --------------------------------- */

const BUCKETS = 30;

const rangeCss = `
.fp-range{position:absolute;inset:0;width:100%;height:100%;margin:0;background:transparent;-webkit-appearance:none;appearance:none;pointer-events:none;outline:none}
.fp-range::-webkit-slider-runnable-track{background:transparent;height:24px}
.fp-range::-moz-range-track{background:transparent;height:24px}
.fp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;pointer-events:auto;box-sizing:border-box;height:24px;width:24px;border-radius:9999px;background:#fff;border:0;box-shadow:0 0 0 1px rgba(20,33,61,.12),0 3px 8px rgba(20,33,61,.28);cursor:grab;transition:transform .15s,box-shadow .15s}
.fp-range::-moz-range-thumb{pointer-events:auto;box-sizing:border-box;height:24px;width:24px;border-radius:9999px;background:#fff;border:0;box-shadow:0 0 0 1px rgba(20,33,61,.12),0 3px 8px rgba(20,33,61,.28);cursor:grab}
.fp-range:active::-webkit-slider-thumb{transform:scale(1.1);cursor:grabbing;box-shadow:0 0 0 5px rgba(196,67,43,.18),0 3px 8px rgba(20,33,61,.28)}
.fp-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px rgba(196,67,43,.45),0 3px 8px rgba(20,33,61,.28)}
.fp-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 3px rgba(196,67,43,.45),0 3px 8px rgba(20,33,61,.28)}
@media (prefers-reduced-motion:reduce){.fp-range::-webkit-slider-thumb{transition:none}}
`;

const MiniInput = ({
  id,
  label,
  value,
  placeholder,
  prefix,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  prefix?: string;
  onChange: (v: string) => void;
}) => (
  <label
    htmlFor={id}
    className={`block cursor-text rounded-xl border border-transparent px-3 py-1.5 transition focus-within:border-[#C4432B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C4432B]/15 dark:focus-within:bg-[#1c2430] ${soft}`}
  >
    <span className={`block text-[10px] font-medium ${muted}`}>{label}</span>
    <span className="flex items-center gap-1">
      {prefix && <span className={`text-xs font-semibold ${muted}`}>{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[13px] font-semibold tabular-nums text-[#14213D] outline-none placeholder:font-normal placeholder:text-[#14213D]/35 dark:text-white dark:placeholder:text-white/35"
      />
    </span>
  </label>
);

const PriceFilter = ({
  prices,
  min,
  max,
  onChange,
}: {
  prices: number[];
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}) => {
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const canSlide = prices.length > 0 && hi > lo;
  const step = Math.max(1, Math.round((hi - lo) / 200));

  const bars = useMemo(() => {
    if (!canSlide) return [];
    const w = (hi - lo) / BUCKETS;
    const counts = new Array<number>(BUCKETS).fill(0);
    prices.forEach((p) => {
      counts[Math.min(BUCKETS - 1, Math.floor((p - lo) / w))]++;
    });
    const top = Math.max(...counts);
    return counts.map((c, i) => ({ c, h: c / top, from: lo + i * w, to: lo + (i + 1) * w }));
  }, [prices, lo, hi, canSlide]);

  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  const selMin = clamp(min === "" ? lo : Number(min) || lo);
  const selMax = clamp(max === "" ? hi : Number(max) || hi);
  const pct = (v: number) => (canSlide ? ((v - lo) / (hi - lo)) * 100 : 0);

  const onMinSlide = (v: number) => {
    const next = Math.min(v, selMax - step);
    onChange(next <= lo ? "" : String(next), max);
  };
  const onMaxSlide = (v: number) => {
    const next = Math.max(v, selMin + step);
    onChange(min, next >= hi ? "" : String(next));
  };

  return (
    <div>
      <style>{rangeCss}</style>

      {canSlide && (
        <>
          <div className="mx-3 flex h-9 items-end gap-[2px]" aria-hidden>
            {bars.map((b, i) => (
              <span
                key={i}
                style={{ height: `${b.c === 0 ? 5 : Math.max(14, b.h * 100)}%` }}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  b.to >= selMin && b.from <= selMax ? "bg-[#C4432B]/85" : "bg-[#14213D]/12 dark:bg-white/15"
                }`}
              />
            ))}
          </div>

          <div className="relative mt-0.5 h-6">
            <div className="pointer-events-none absolute inset-x-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#14213D]/12 dark:bg-white/15">
              <div
                className="absolute h-full rounded-full bg-[#C4432B]"
                style={{ left: `${pct(selMin)}%`, right: `${100 - pct(selMax)}%` }}
              />
            </div>
            <input
              type="range"
              aria-label="Minimum price"
              className="fp-range"
              min={lo}
              max={hi}
              step={step}
              value={selMin}
              onChange={(e) => onMinSlide(Number(e.target.value))}
              style={{ zIndex: selMin > lo + (hi - lo) * 0.9 ? 3 : 2 }}
            />
            <input
              type="range"
              aria-label="Maximum price"
              className="fp-range"
              min={lo}
              max={hi}
              step={step}
              value={selMax}
              onChange={(e) => onMaxSlide(Number(e.target.value))}
              style={{ zIndex: 2 }}
            />
          </div>
          <p className={`mt-1 flex justify-between text-[11px] tabular-nums ${muted}`}>
            <span>{formatPrice(lo)}</span>
            <span>{formatPrice(hi)}</span>
          </p>
        </>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <MiniInput id="fp-min" label="Min" prefix="₹" placeholder="No min" value={min} onChange={(v) => onChange(v, max)} />
        <MiniInput id="fp-max" label="Max" prefix="₹" placeholder="No max" value={max} onChange={(v) => onChange(min, v)} />
      </div>
    </div>
  );
};

/* ---------------------------- numeric range ---------------------------- */

const RangeInputs = ({
  range,
  bounds,
  value,
  onChange,
}: {
  range: FilterRange;
  bounds: [number, number];
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) => (
  <div className="grid grid-cols-2 gap-2">
    <MiniInput
      id={`fp-r-${range.key}-min`}
      label={range.unit ? `From (${range.unit})` : "From"}
      placeholder={bounds[0].toLocaleString("en-IN")}
      value={value.min}
      onChange={(min) => onChange({ ...value, min })}
    />
    <MiniInput
      id={`fp-r-${range.key}-max`}
      label={range.unit ? `To (${range.unit})` : "To"}
      placeholder={bounds[1].toLocaleString("en-IN")}
      value={value.max}
      onChange={(max) => onChange({ ...value, max })}
    />
  </div>
);

/* ------------------------------ switch row ----------------------------- */

const SwitchRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`flex h-8 w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-xs font-medium text-[#14213D] dark:text-white ${focusRing}`}
  >
    {label}
    <span
      aria-hidden
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#C4432B]" : "bg-[#14213D]/20 dark:bg-white/25"
      }`}
    >
      <span
        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </span>
  </button>
);

/* ------------------------------- panel -------------------------------- */

interface FilterPanelProps {
  config: FilterConfig;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  pool: Listing[]; // listings of the current category, used for counts + location options
  prices: number[]; // prices for the histogram
  activeCount?: number; // no longer needed — the panel counts its own filters (kept so old calls still compile)
  showHeader?: boolean;
  /** optional: when given, a sticky "Show N results" footer appears (use inside a mobile sheet) */
  onApply?: () => void;
  resultCount?: number;
}

export const FilterPanel = ({
  config,
  filters,
  onChange,
  pool,
  prices,
  showHeader = true,
  onApply,
  resultCount,
}: FilterPanelProps) => {
  const patch = (p: Partial<FilterState>) => onChange({ ...filters, ...p });
  const activeCount = countActiveFilters(filters, config);

  const toggleOption = (key: string, option: string) => {
    const current = filters.fields?.[key] ?? [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    patch({ fields: { ...(filters.fields ?? {}), [key]: next } });
  };

  const count = (pred: (l: Listing) => boolean) => pool.filter(pred).length;

  /* location */
  const locOptions = useMemo(
    () => buildLocationOptions(pool, { country: filters.country ?? [], state: filters.state ?? [] }),
    [pool, filters.country, filters.state]
  );
  const showLocation =
    config.location &&
    (locOptions.country.length > 0 ||
      locOptions.state.length > 0 ||
      locOptions.city.length > 0 ||
      (filters.country ?? []).length + (filters.state ?? []).length + (filters.city ?? []).length > 0);
  const locationSummary = summarize([...(filters.city ?? []), ...(filters.state ?? []), ...(filters.country ?? [])]);

  /* numeric ranges (only those with data in the current pool) */
  const rangeBounds = useMemo(() => {
    const out: { range: FilterRange; bounds: [number, number] }[] = [];
    config.ranges.forEach((r) => {
      const nums = pool.map((l) => numericDetail(l, r.key)).filter((n): n is number => n !== null);
      if (nums.length) out.push({ range: r, bounds: [Math.min(...nums), Math.max(...nums)] });
    });
    return out;
  }, [pool, config.ranges]);

  const priceSummary =
    filters.min !== "" || filters.max !== ""
      ? `${filters.min !== "" ? formatPrice(Number(filters.min)) : "Any"} – ${
          filters.max !== "" ? formatPrice(Number(filters.max)) : "Any"
        }`
      : undefined;

  const moreSummary = [
    filters.posted && filters.posted !== "any" ? POSTED_OPTIONS.find((o) => o.value === filters.posted)?.label : "",
    filters.featured ? "Featured" : "",
    filters.photos ? "Photos" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const reset = () => onChange(defaultFilters);

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#14213D]/[0.08] shadow-[0_10px_30px_-16px_rgba(20,33,61,0.25)] dark:bg-[#121821] dark:ring-white/10 dark:shadow-none">
      {showHeader && (
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-[#14213D] dark:text-white">Filters</h2>
          <button
            type="button"
            onClick={reset}
            disabled={activeCount === 0}
            className={`rounded-md px-2 py-1 text-xs font-semibold text-[#C4432B] transition hover:bg-[#C4432B]/10 disabled:pointer-events-none disabled:opacity-0 ${focusRing}`}
          >
            Reset{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      )}

      <div className="divide-y divide-[#14213D]/[0.07] dark:divide-white/10">
        {showLocation && (
          <Section title="Location" summary={locationSummary || undefined}>
            <LocationFilter
              options={locOptions}
              filters={filters}
              onToggle={(level, value) => patch({ [level]: toggleIn(filters[level] ?? [], value) } as Partial<FilterState>)}
            />
          </Section>
        )}

        {config.sellerType && (
          <Section
            title="Posted by"
            summary={filters.seller !== "all" ? (filters.seller === "owner" ? "Owner" : "Dealer") : undefined}
          >
            <Segmented<SellerFilter>
              label="Posted by"
              value={filters.seller}
              onChange={(seller) => patch({ seller })}
              options={[
                { value: "all", label: "All" },
                { value: "owner", label: "Owner", count: count((l) => l.sellerType === "owner") },
                { value: "dealer", label: "Dealer", count: count((l) => l.sellerType === "dealer") },
              ]}
            />
          </Section>
        )}

        {config.condition && (
          <Section title="Condition" summary={filters.condition !== "any" ? filters.condition : undefined}>
            <Segmented<ConditionFilter>
              label="Condition"
              value={filters.condition}
              onChange={(condition) => patch({ condition })}
              options={[
                { value: "any", label: "Any" },
                { value: "New", label: "New", count: count((l) => l.condition === "New") },
                { value: "Used", label: "Used", count: count((l) => l.condition === "Used") },
              ]}
            />
          </Section>
        )}

        <Section title={config.priceLabel} summary={priceSummary}>
          <PriceFilter
            prices={prices}
            min={filters.min}
            max={filters.max}
            onChange={(min, max) => patch({ min, max })}
          />
        </Section>

        {config.fields.map((fld) => {
          const selected = filters.fields?.[fld.key] ?? [];
          return (
            <Section key={fld.key} title={fld.label} summary={selected.length ? summarize(selected) : undefined}>
              <ChipGroup
                options={fld.options}
                selected={selected}
                countFor={(opt) => count((l) => fieldValue(l, fld.key).toLowerCase() === opt.toLowerCase())}
                onToggle={(opt) => toggleOption(fld.key, opt)}
              />
            </Section>
          );
        })}

        {rangeBounds.map(({ range, bounds }) => {
          const v = filters.ranges?.[range.key] ?? { min: "", max: "" };
          const sum =
            v.min !== "" || v.max !== "" ? `${v.min !== "" ? v.min : "Any"} – ${v.max !== "" ? v.max : "Any"}` : undefined;
          return (
            <Section key={range.key} title={range.label} summary={sum}>
              <RangeInputs
                range={range}
                bounds={bounds}
                value={v}
                onChange={(next) => patch({ ranges: { ...(filters.ranges ?? {}), [range.key]: next } })}
              />
            </Section>
          );
        })}

        <Section title="More options" summary={moreSummary || undefined}>
          <p className={`mb-1.5 text-[11px] font-medium ${muted}`}>Posted within</p>
          <Segmented<PostedFilter>
            label="Posted within"
            value={filters.posted ?? "any"}
            onChange={(posted) => patch({ posted })}
            options={POSTED_OPTIONS}
          />
          <div className="mt-2">
            <SwitchRow
              label="Featured & premium ads only"
              checked={!!filters.featured}
              onChange={(featured) => patch({ featured })}
            />
            <SwitchRow label="Only ads with photos" checked={!!filters.photos} onChange={(photos) => patch({ photos })} />
          </div>
        </Section>
      </div>

      {onApply && (
        <div className="sticky bottom-0 -mx-4 -mb-4 mt-3 flex gap-2.5 rounded-b-2xl border-t border-[#14213D]/[0.07] bg-white/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md dark:border-white/10 dark:bg-[#121821]/90">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className={`h-10 rounded-xl px-4 text-xs font-semibold text-[#14213D] ring-1 ring-[#14213D]/15 transition hover:bg-[#14213D]/5 dark:text-white dark:ring-white/20 dark:hover:bg-white/10 ${focusRing}`}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onApply}
            className={`h-10 flex-1 rounded-xl bg-[#C4432B] text-[13px] font-semibold text-white transition hover:bg-[#C4432B]/90 active:scale-[0.99] ${focusRing}`}
          >
            {resultCount != null ? `Show ${resultCount} result${resultCount === 1 ? "" : "s"}` : "Show results"}
          </button>
        </div>
      )}
    </div>
  );
};