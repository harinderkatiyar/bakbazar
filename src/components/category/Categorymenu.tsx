// Save as: src/components/CategoryMenu.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { categories, type Category } from "../category/Categories";

// Goes to the homepage listings, filtered by category (and subcategory)
const useGoToCategory = (after?: () => void) => {
  const navigate = useNavigate();
  return (category: string, sub?: string) => {
    const search = new URLSearchParams({ category });
    if (sub) search.set("sub", sub);
    navigate({ pathname: "/", search: `?${search.toString()}`, hash: "#features" });
    after?.();
  };
};

/* ---------------------------- Desktop ---------------------------- */

const DesktopMenu = () => {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(categories[0].slug);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const go = useGoToCategory(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  return (
    <div ref={wrapperRef} className="hidden shrink-0 md:block">
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="gap-2 rounded-full border border-[#14213D]/15 text-[#14213D] dark:border-white/15 dark:text-white"
      >
        <LayoutGrid className="h-4 w-4" />
        Categories
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {/* Positioned against the sticky header, so it centres under the navbar */}
      {open && (
        <div
          role="dialog"
          aria-label="Browse categories"
          className="absolute left-1/2 top-full z-50 mt-2 grid w-[min(880px,calc(100vw-2rem))] -translate-x-1/2 grid-cols-[250px_1fr] overflow-hidden rounded-2xl border border-[#14213D]/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#11161D]"
        >
          {/* Left rail: main categories */}
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto bg-[#FBF7F0] p-2 dark:bg-white/5">
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive = c.slug === active.slug;
              return (
                <li key={c.slug}>
                  <button
                    onMouseEnter={() => setActiveSlug(c.slug)}
                    onFocus={() => setActiveSlug(c.slug)}
                    onClick={() => (c.subs.length ? setActiveSlug(c.slug) : go(c.slug))}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-[#14213D] transition-colors dark:text-white ${
                      isActive ? "bg-white shadow-sm dark:bg-white/10" : "hover:bg-white/60 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 leading-tight">{c.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right: subcategories of the active category */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[#14213D] dark:text-white">{active.name}</h3>
              <button
                onClick={() => go(active.slug)}
                className="text-sm font-medium text-[#C4432B] hover:underline"
              >
                See all in {active.name}
              </button>
            </div>

            {active.subs.length ? (
              <ul className={`mt-4 grid gap-x-6 gap-y-1 ${active.subs.length > 9 ? "grid-cols-3" : "grid-cols-2"}`}>
                {active.subs.map((s) => (
                  <li key={s.slug}>
                    <button
                      onClick={() => go(active.slug, s.slug)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#14213D]/80 hover:bg-[#14213D]/5 hover:text-[#14213D] dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Browse every listing in {active.name} using the link above.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Mobile ---------------------------- */

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Category | null>(null);
  const go = useGoToCategory(() => setOpen(false));

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCurrent(null);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Browse categories" className="shrink-0 md:hidden">
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] gap-0 rounded-t-2xl p-0">
        <SheetHeader className="flex-row items-center gap-2 border-b border-[#14213D]/10 p-4 pr-12 dark:border-white/10">
          {current && (
            <button
              onClick={() => setCurrent(null)}
              aria-label="Back to all categories"
              className="-ml-1 rounded-full p-1.5 hover:bg-[#14213D]/5 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <SheetTitle className="text-base text-[#14213D] dark:text-white">
            {current ? current.name : "Browse categories"}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto p-4">
          {!current ? (
            <ul className="grid grid-cols-2 gap-3">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.slug}>
                    <button
                      onClick={() => (c.subs.length ? setCurrent(c) : go(c.slug))}
                      className="flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-[#14213D]/10 p-3 text-left transition-colors hover:bg-[#14213D]/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tint}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium leading-tight text-[#14213D] dark:text-white">
                        {c.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="divide-y divide-[#14213D]/10 dark:divide-white/10">
              <li>
                <button
                  onClick={() => go(current.slug)}
                  className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-[#C4432B]"
                >
                  See all in {current.name}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              {current.subs.map((s) => (
                <li key={s.slug}>
                  <button
                    onClick={() => go(current.slug, s.slug)}
                    className="flex w-full items-center justify-between py-3 text-left text-sm text-[#14213D] dark:text-white"
                  >
                    {s.name}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const CategoryMenu = () => (
  <>
    <DesktopMenu />
    <MobileMenu />
  </>
);