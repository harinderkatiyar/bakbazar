// Save as: src/components/Features.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  SearchX,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { db } from "@/lib/firebase.config";
import { Listing, PLACEHOLDER, formatPrice, timeAgo } from "./Listing";
import { categories, getCategory } from "../category/Categories";
import {
  SORT_OPTIONS,
  applyFilters,
  defaultFilters,
  getFilterConfig,
  sortListings,
  type FilterState,
  type SortKey,
} from "../filter/Filters";
import { FilterPanel } from "../filter/Filterpanel";

// Old listings stored names like "Electronics". This keeps them visible until you migrate them to slugs.
const LEGACY_CATEGORY_NAMES: Record<string, string> = {
  "electronics-and-appliances": "Electronics",
};

type View = "grid" | "list";

/* --------------------------- Scrollable row --------------------------- */
// Arrows + soft edge fade, and the chosen item scrolls into view.
// (Centring is done with auto margins, so nothing gets cut off on the left.)

const ScrollRow = ({ children, activeKey }: { children: ReactNode; activeKey?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdge((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };

  useEffect(update); // re-check after every render (it bails out when nothing changed)

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const c = ref.current;
    const item = c?.querySelector<HTMLElement>('[data-active="true"]');
    if (!c || !item) return;
    c.scrollTo({ left: item.offsetLeft - (c.clientWidth - item.clientWidth) / 2, behavior: "smooth" });
  }, [activeKey]);

  const scrollBy = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

  const mask = `linear-gradient(to right, ${edge.left ? "transparent" : "black"} 0, black 56px, black calc(100% - 56px), ${
    edge.right ? "transparent" : "black"
  } 100%)`;

  const arrow =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition hover:scale-105 sm:grid dark:bg-[#1c2430] dark:ring-white/10";

  return (
    <div className="relative">
      {edge.left && (
        <button aria-label="Scroll left" onClick={() => scrollBy(-1)} className={`${arrow} left-0`}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={ref}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="relative flex gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>:first-child]:ml-auto [&>:last-child]:mr-auto"
      >
        {children}
      </div>
      {edge.right && (
        <button aria-label="Scroll right" onClick={() => scrollBy(1)} className={`${arrow} right-0`}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/* ------------------------------- Cards ------------------------------- */

const ListingCard = ({ listing, view }: { listing: Listing; view: View }) => {
  const [saved, setSaved] = useState(false);
  const isList = view === "list";

  return (
    <div className="relative">
      {/* The whole card is a link that opens the detail page in a new tab */}
      <Link
        to={`/listing/${listing.id}`}
       
        rel="noopener noreferrer"
        aria-label={`View details for ${listing.title}`}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4432B]"
      >
        <Card
          className={`group gap-0 overflow-hidden border-[#14213D]/10 py-0 transition-shadow hover:shadow-lg dark:border-white/10 ${
            isList ? "flex-row" : ""
          }`}
        >
          <div
            className={`relative shrink-0 overflow-hidden ${
              isList ? "aspect-[4/3] w-36 sm:w-56" : "aspect-[4/3] w-full"
            }`}
          >
            <img
              src={listing.images?.[0] || PLACEHOLDER}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <Badge className="absolute left-2 top-2 bg-white/90 text-[#14213D] hover:bg-white/90 dark:bg-black/40 dark:text-white">
              {listing.condition}
            </Badge>

            {listing.plan === "featured" && (
              <Badge className="absolute bottom-2 left-2 gap-1 bg-[#E9A319] text-white">
                <Zap className="h-3 w-3" /> Featured
              </Badge>
            )}
            {listing.plan === "premium" && (
              <Badge className="absolute bottom-2 left-2 gap-1 bg-[#C4432B] text-white">
                <BadgeCheck className="h-3 w-3" /> Premium
              </Badge>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <CardContent className={`p-3 pb-1 ${isList ? "pr-12" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-[#C4432B]">{formatPrice(listing.price)}</p>
                {listing.sellerType && (
                  <span className="rounded-full border border-[#14213D]/15 px-2 py-0.5 text-[11px] font-medium text-[#14213D]/70 dark:border-white/15 dark:text-white/70">
                    {listing.sellerType === "dealer" ? "Dealer" : "Owner"}
                  </span>
                )}
              </div>
              <p
                className={`mt-0.5 text-sm font-medium text-[#14213D] dark:text-white ${
                  isList ? "line-clamp-2" : "truncate"
                }`}
              >
                {listing.title}
              </p>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 p-3 pt-2 text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{listing.location?.city}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(listing.createdAt)}
              </span>
            </CardFooter>
          </div>
        </Card>
      </Link>

    </div>
  );
};

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-[#14213D]/10 dark:border-white/10">
    <div className="aspect-[4/3] animate-pulse bg-[#14213D]/5 dark:bg-white/5" />
    <div className="space-y-2 p-3">
      <div className="h-4 w-1/3 animate-pulse rounded bg-[#14213D]/5 dark:bg-white/5" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-[#14213D]/5 dark:bg-white/5" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[#14213D]/5 dark:bg-white/5" />
    </div>
  </div>
);

/* ----------------------------- Chips (sub) ----------------------------- */

const pill = "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";
const pillOn = "border-[#C4432B] bg-[#C4432B] text-white";
const pillOff =
  "border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5";

/* ------------------------------ Section ------------------------------ */

export const Features = () => {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [view, setView] = useState<View>("grid");
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCategory = getCategory(params.get("category") ?? "");
  const activeSlug = activeCategory?.slug ?? "all";
  const activeSub = activeCategory?.subs.find((s) => s.slug === params.get("sub"));
  const searchText = (params.get("q") ?? "").trim();

  const setParam = (next: { category?: string | null; sub?: string | null; q?: string | null }) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
  };

  // Filters are specific to a category, so start fresh when it changes
  useEffect(() => {
    setFilters(defaultFilters);
  }, [activeSlug, activeSub?.slug]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const constraints: QueryConstraint[] = [where("status", "==", "active")];

        if (activeCategory) {
          const values = [activeCategory.slug, activeCategory.name, LEGACY_CATEGORY_NAMES[activeCategory.slug]].filter(
            Boolean
          ) as string[];
          constraints.push(where("category", "in", values));
        }
        // Needs listings saved with a `subcategory` slug, plus a composite index (Firestore gives you a link)
        if (activeSub) constraints.push(where("subcategory", "==", activeSub.slug));

        // Load a bigger batch once, then filter and sort instantly in the browser
        const snap = await getDocs(
          query(
            collection(db, "listings"),
            ...constraints,
            orderBy("priority", "desc"),
            orderBy("createdAt", "desc"),
            limit(100)
          )
        );
        setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      } catch (err) {
        console.error("Error fetching listings:", err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [activeSlug, activeSub?.slug]);

  const config = useMemo(
    () => getFilterConfig(activeCategory?.slug, activeSub?.slug),
    [activeCategory?.slug, activeSub?.slug]
  );

  // Pool = everything in this category that matches the search text
  const pool = useMemo(() => {
    if (!searchText) return listings;
    const needle = searchText.toLowerCase();
    return listings.filter((l) => `${l.title} ${l.description ?? ""}`.toLowerCase().includes(needle));
  }, [listings, searchText]);

  const visible = useMemo(() => sortListings(applyFilters(pool, filters, config), sort), [pool, filters, config, sort]);

  const prices = useMemo(
    () => applyFilters(pool, filters, config, { skipPrice: true }).map((l) => l.price),
    [pool, filters, config]
  );

  /* active filter chips */
  const chips: { id: string; label: string; clear: () => void }[] = [];
  if (searchText) chips.push({ id: "q", label: `Search: “${searchText}”`, clear: () => setParam({ q: null }) });
  if (config.sellerType && filters.seller !== "all")
    chips.push({
      id: "seller",
      label: filters.seller === "dealer" ? "Dealer" : "Owner",
      clear: () => setFilters((f) => ({ ...f, seller: "all" })),
    });
  if (config.condition && filters.condition !== "any")
    chips.push({
      id: "condition",
      label: filters.condition,
      clear: () => setFilters((f) => ({ ...f, condition: "any" })),
    });
  if (filters.min || filters.max)
    chips.push({
      id: "price",
      label: `${filters.min ? formatPrice(Number(filters.min)) : "Any"} – ${
        filters.max ? formatPrice(Number(filters.max)) : "Any"
      }`,
      clear: () => setFilters((f) => ({ ...f, min: "", max: "" })),
    });
  config.fields.forEach((fld) => {
    const selected = filters.fields[fld.key];
    if (selected?.length)
      chips.push({
        id: fld.key,
        label: `${fld.label}: ${selected.join(", ")}`,
        clear: () => setFilters((f) => ({ ...f, fields: { ...f.fields, [fld.key]: [] } })),
      });
  });

  // Filter count for the panel and the mobile button (search text is not a panel filter)
  const panelActive = chips.filter((c) => c.id !== "q").length;

  const clearAll = () => {
    setFilters(defaultFilters);
    setParam({ q: null });
  };

  const heading = activeSub?.name ?? activeCategory?.name ?? "Fresh recommendations";
  const gridClass =
    view === "grid"
      ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      : "grid grid-cols-1 gap-3";

  return (
    <section id="features" className="container scroll-mt-32 space-y-6 pb-12 pt-6 sm:pt-8 lg:scroll-mt-24">
      {/* Category rail */}
      <ScrollRow activeKey={activeSlug}>
        <button
          data-active={activeSlug === "all"}
          aria-pressed={activeSlug === "all"}
          onClick={() => setParam({ category: null, sub: null })}
          className="group flex w-[84px] shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center"
        >
          <span
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-[#14213D] text-white transition dark:bg-white dark:text-[#14213D] ${
              activeSlug === "all"
                ? "ring-2 ring-[#C4432B] ring-offset-2 ring-offset-background"
                : "group-hover:scale-105"
            }`}
          >
            <LayoutGrid className="h-6 w-6" />
          </span>
          <span
            className={`text-xs leading-tight ${
              activeSlug === "all" ? "font-semibold text-[#14213D] dark:text-white" : "text-[#14213D]/70 dark:text-white/70"
            }`}
          >
            All
          </span>
        </button>

        {categories.map((c) => {
          const Icon = c.icon;
          const on = activeSlug === c.slug;
          return (
            <button
              key={c.slug}
              data-active={on}
              aria-pressed={on}
              onClick={() => setParam({ category: c.slug, sub: null })}
              className="group flex w-[84px] shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl transition ${c.tint} ${
                  on ? "ring-2 ring-[#C4432B] ring-offset-2 ring-offset-background" : "group-hover:scale-105"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span
                className={`text-xs leading-tight ${
                  on ? "font-semibold text-[#14213D] dark:text-white" : "text-[#14213D]/70 dark:text-white/70"
                }`}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </ScrollRow>

      {/* Subcategory pills */}
      {activeCategory && activeCategory.subs.length > 0 && (
        <ScrollRow activeKey={activeSub?.slug ?? "all-subs"}>
          <button
            data-active={!activeSub}
            aria-pressed={!activeSub}
            onClick={() => setParam({ sub: null })}
            className={`${pill} ${!activeSub ? pillOn : pillOff}`}
          >
            All {activeCategory.name}
          </button>
          {activeCategory.subs.map((s) => {
            const on = activeSub?.slug === s.slug;
            return (
              <button
                key={s.slug}
                data-active={on}
                aria-pressed={on}
                onClick={() => setParam({ sub: s.slug })}
                className={`${pill} ${on ? pillOn : pillOff}`}
              >
                {s.name}
              </button>
            );
          })}
        </ScrollRow>
      )}

      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Filters — sidebar on large screens */}
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <FilterPanel
            config={config}
            filters={filters}
            onChange={setFilters}
            pool={pool}
            prices={prices}
            activeCount={panelActive}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#14213D] sm:text-xl dark:text-white">{heading}</h2>
              {!loading && (
                <p className="text-sm text-muted-foreground">
                  {visible.length} listing{visible.length === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSheetOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#14213D]/15 px-3 text-sm font-medium text-[#14213D] hover:bg-[#14213D]/5 lg:hidden dark:border-white/15 dark:text-white dark:hover:bg-white/5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {panelActive > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#C4432B] px-1 text-xs text-white">
                    {panelActive}
                  </span>
                )}
              </button>

              <div className="relative">
                <select
                  aria-label="Sort listings"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="h-10 appearance-none rounded-xl border border-[#14213D]/15 bg-transparent pl-3 pr-9 text-sm font-medium text-[#14213D] outline-none focus:border-[#C4432B] focus:ring-2 focus:ring-[#C4432B]/20 dark:border-white/15 dark:text-white [&>option]:text-black"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              </div>

              <div
                role="radiogroup"
                aria-label="Layout"
                className="flex rounded-xl bg-[#14213D]/5 p-1 dark:bg-white/10"
              >
                {(
                  [
                    { v: "grid", label: "Grid view", Icon: LayoutGrid },
                    { v: "list", label: "List view", Icon: List },
                  ] as const
                ).map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={view === v}
                    aria-label={label}
                    onClick={() => setView(v)}
                    className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                      view === v
                        ? "bg-white text-[#14213D] shadow-sm dark:bg-[#1c2430] dark:text-white"
                        : "text-[#14213D]/50 dark:text-white/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  onClick={c.clear}
                  aria-label={`Remove filter ${c.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C4432B]/10 px-3 py-1 text-sm font-medium text-[#C4432B] hover:bg-[#C4432B]/15"
                >
                  {c.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button onClick={clearAll} className="px-1 text-sm font-medium text-muted-foreground hover:underline">
                Clear all
              </button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#14213D]/20 py-16 text-center dark:border-white/20">
              <SearchX className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-[#14213D] dark:text-white">No listings found</p>
                <p className="text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
              </div>
              {chips.length > 0 && (
                <button
                  onClick={clearAll}
                  className="rounded-full bg-[#C4432B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C4432B]/90"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className={gridClass}>
              {visible.map((listing) => (
                <ListingCard key={listing.id} listing={listing} view={view} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters — bottom sheet on small screens, with a live result count */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="flex h-[88vh] flex-col gap-0 rounded-t-2xl p-0 lg:hidden">
          <SheetHeader className="border-b border-[#14213D]/10 p-4 dark:border-white/10">
            <SheetTitle className="text-base text-[#14213D] dark:text-white">Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterPanel
              config={config}
              filters={filters}
              onChange={setFilters}
              pool={pool}
              prices={prices}
              activeCount={panelActive}
              showHeader={false}
            />
          </div>
          <div className="flex gap-3 border-t border-[#14213D]/10 p-4 dark:border-white/10">
            <button
              onClick={() => setFilters(defaultFilters)}
              disabled={panelActive === 0}
              className="rounded-xl border border-[#14213D]/15 px-4 py-2.5 text-sm font-medium text-[#14213D] disabled:opacity-40 dark:border-white/15 dark:text-white"
            >
              Reset
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="flex-1 rounded-xl bg-[#C4432B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#C4432B]/90"
            >
              Show {visible.length} result{visible.length === 1 ? "" : "s"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};