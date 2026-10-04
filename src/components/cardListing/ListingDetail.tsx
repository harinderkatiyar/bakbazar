import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  SearchX,
  Share2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MakeOfferButton } from "@/components/MakeOfferButton";
import { db } from "@/lib/firebase.config";
import { Listing, PLACEHOLDER, formatMonthYear, formatPrice, timeAgo } from "./Listing";
import { MessageButton } from "../Messagebutton";

const card =
  "rounded-3xl border border-[#14213D]/10 bg-white p-5 shadow-[0_8px_30px_-14px_rgba(20,33,61,0.2)] dark:border-white/10 dark:bg-[#121821] dark:shadow-none sm:p-6";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#C4432B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121821]";

const iconBtn = `grid h-10 w-10 place-items-center rounded-xl border border-[#14213D]/12 text-[#14213D] transition hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10 ${focusRing}`;

const initials = (name?: string) =>
  (name || "S")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setActiveImage(0);
      try {
        const snap = await getDoc(doc(db, "listings", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Listing;
          setListing(data);
          document.title = `${data.title} | Listings`;
        } else {
          setListing(null);
        }
      } catch (err) {
        console.error("Error loading listing:", err);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const imageCount = listing?.images?.length || 1;

  // Keyboard arrows for the gallery
  useEffect(() => {
    if (imageCount < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActiveImage((i) => (i + 1) % imageCount);
      if (e.key === "ArrowLeft") setActiveImage((i) => (i - 1 + imageCount) % imageCount);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageCount]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  /* ------------------------------ loading ------------------------------ */
  if (loading) {
    return (
      <div className="container py-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-[#14213D]/10 dark:bg-white/10" />
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-[#14213D]/10 dark:bg-white/10 sm:aspect-[16/10]" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-[#14213D]/10 dark:bg-white/10" />
            <div className="h-48 animate-pulse rounded-3xl bg-[#14213D]/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------- not found ----------------------------- */
  if (!listing) {
    return (
      <div className="container grid place-items-center py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#14213D]/5 dark:bg-white/10">
          <SearchX className="h-7 w-7 text-[#14213D]/60 dark:text-white/60" />
        </span>
        <p className="mt-4 text-lg font-semibold text-[#14213D] dark:text-white">Listing not found</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This listing may have been removed, or the link is incorrect.
        </p>
        <Link
          to="/"
          className={`mt-6 rounded-xl bg-[#C4432B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C4432B]/90 ${focusRing}`}
        >
          Browse listings
        </Link>
      </div>
    );
  }

  /* ------------------------------ derived ------------------------------ */
  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const next = () => setActiveImage((i) => (i + 1) % images.length);
  const prev = () => setActiveImage((i) => (i - 1 + images.length) % images.length);

  const place = [listing.location?.locality, listing.location?.city, listing.location?.state]
    .filter(Boolean)
    .join(", ");

  const mapQuery =
    listing.location?.lat != null && listing.location?.lng != null
      ? `${listing.location.lat},${listing.location.lng}`
      : place;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;

  const detailRows: [string, string][] = [
    ...(listing.brand ? ([["Brand", listing.brand]] as [string, string][]) : []),
    ["Condition", listing.condition],
    ["Category", listing.category],
    ...Object.entries(listing.details ?? {}),
  ];
  const highlights = detailRows.slice(0, 4);
  const moreRows = detailRows.slice(4);

  const sellerLabel = listing.sellerType === "dealer" ? "Dealer" : listing.sellerType === "owner" ? "Owner" : null;
  const memberSince = formatMonthYear(listing.sellerSince);

  const description = listing.description || "The seller has not added a description for this listing.";
  const longDesc = description.length > 240;

  /* summary block (price + title) — rendered once on mobile, once in sidebar on desktop */
  const summary = (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[32px] font-bold leading-none tracking-tight tabular-nums text-[#14213D] dark:text-white">
          {formatPrice(listing.price)}
        </p>
        <div className="flex gap-2">
          <button onClick={share} aria-label="Share listing" className={iconBtn}>
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            aria-pressed={saved}
            className={iconBtn}
          >
            <Heart className={`h-4 w-4 transition ${saved ? "fill-[#C4432B] text-[#C4432B]" : ""}`} />
          </button>
        </div>
      </div>

      {(listing.plan === "featured" || listing.plan === "premium") && (
        <div className="mt-3 flex flex-wrap gap-2">
          {listing.plan === "featured" && (
            <Badge className="gap-1 rounded-full bg-[#E9A319] text-white">
              <Zap className="h-3 w-3" /> Featured
            </Badge>
          )}
          {listing.plan === "premium" && (
            <Badge className="gap-1 rounded-full bg-[#C4432B] text-white">
              <BadgeCheck className="h-3 w-3" /> Premium
            </Badge>
          )}
        </div>
      )}

      <h1 className="mt-3 text-lg font-semibold leading-snug text-[#14213D] dark:text-white">{listing.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {place || "Location not provided"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {timeAgo(listing.createdAt)}
        </span>
      </div>
    </div>
  );

  const actionButtons = listing.sellerId ? (
    <>
      <MessageButton
        sellerId={listing.sellerId}
        sellerName={listing.sellerName || "Seller"}
        listingId={listing.id}
        listingTitle={listing.title}
        className="flex-1"
      />
      <MakeOfferButton
        sellerId={listing.sellerId}
        sellerName={listing.sellerName || "Seller"}
        listingId={listing.id}
        listingTitle={listing.title}
        price={Number(listing.price) || 0}
        className="flex-1"
      />
    </>
  ) : null;

  return (
    <div className="container pb-28 pt-5 lg:pb-10">
      <Link
        to="/"
        className={`mb-4 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-[#14213D]/80 transition hover:text-[#14213D] dark:text-white/80 dark:hover:text-white ${focusRing}`}
      >
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ============================ LEFT ============================ */}
        <div className="min-w-0 space-y-5">
          {/* Gallery */}
          <div className="overflow-hidden rounded-3xl border border-[#14213D]/10 bg-white shadow-[0_8px_30px_-14px_rgba(20,33,61,0.2)] dark:border-white/10 dark:bg-[#121821] dark:shadow-none">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#0e1623] sm:aspect-[16/10]"
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current == null || images.length < 2) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
                touchX.current = null;
              }}
            >
              {/* blurred backdrop fills the empty space around contained photos */}
              <img
                src={images[activeImage]}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
              />
              <img
                src={images[activeImage]}
                alt={`${listing.title} – photo ${activeImage + 1} of ${images.length}`}
                className="relative h-full w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Previous photo"
                    className={`absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#14213D] shadow-lg backdrop-blur transition hover:bg-white ${focusRing}`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next photo"
                    className={`absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#14213D] shadow-lg backdrop-blur transition hover:bg-white ${focusRing}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium tabular-nums text-white backdrop-blur">
                    {activeImage + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === activeImage}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl transition ${focusRing} ${i === activeImage
                        ? "ring-2 ring-[#C4432B] ring-offset-2 ring-offset-white dark:ring-offset-[#121821]"
                        : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price + title (mobile only; desktop shows it in the sidebar) */}
          <div className="lg:hidden">{summary}</div>

          {/* Details */}
          <div className={card}>
            {highlights.length > 0 && (
              <>
                <h2 className="text-base font-semibold text-[#14213D] dark:text-white">Highlights</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {highlights.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#14213D]/[0.05] px-3.5 py-3 dark:bg-white/[0.07]">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-[#14213D] dark:text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {moreRows.length > 0 && (
              <dl className="mt-4 divide-y divide-[#14213D]/10 text-sm dark:divide-white/10">
                {moreRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-[#14213D] dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <h2 className="mt-6 text-base font-semibold text-[#14213D] dark:text-white">Description</h2>
            <p
              className={`mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-[#14213D]/75 dark:text-white/70 ${longDesc && !descOpen ? "line-clamp-4" : ""
                }`}
            >
              {description}
            </p>
            {longDesc && (
              <button
                onClick={() => setDescOpen((o) => !o)}
                aria-expanded={descOpen}
                className={`mt-2 rounded-md text-sm font-semibold text-[#C4432B] hover:underline ${focusRing}`}
              >
                {descOpen ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        </div>

        {/* =========================== SIDEBAR =========================== */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-4">
          <div className="hidden lg:block">{summary}</div>

          {/* Seller */}
          <div className={card}>
            <div className="flex items-center gap-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#14213D] text-lg font-bold text-white dark:bg-white dark:text-[#14213D]">
                {initials(listing.sellerName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Posted by</p>
                <p className="truncate text-base font-semibold text-[#14213D] dark:text-white">
                  {listing.sellerName || "Seller"}
                </p>
                {memberSince && <p className="text-xs text-muted-foreground">Member since {memberSince}</p>}
              </div>
              {sellerLabel && (
                <Badge
                  variant="outline"
                  className={`rounded-full ${listing.sellerType === "dealer"
                      ? "border-[#E9A319] text-[#E9A319]"
                      : "border-[#C4432B] text-[#C4432B]"
                    }`}
                >
                  {sellerLabel}
                </Badge>
              )}
            </div>

            {listing.sellerListingCount != null && (
              <p className="mt-4 rounded-xl bg-[#14213D]/[0.05] py-2.5 text-center text-sm dark:bg-white/[0.07]">
                <span className="font-bold text-[#14213D] dark:text-white">{listing.sellerListingCount}</span>{" "}
                <span className="text-muted-foreground">
                  item{listing.sellerListingCount === 1 ? "" : "s"} listed
                </span>
              </p>
            )}

            {/* Desktop CTAs (mobile uses the bottom bar) */}
            <div className="mt-4 hidden gap-2.5 lg:flex">
              {actionButtons ?? (
                <p className="w-full rounded-lg border border-dashed border-[#14213D]/20 px-4 py-3 text-center text-sm text-muted-foreground dark:border-white/20">
                  Seller is not available for chat
                </p>
              )}
            </div>
          </div>

          {/* Map */}
          <div className={card}>
            <h2 className="text-base font-semibold text-[#14213D] dark:text-white">Posted in</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {place || "Location not provided"}
            </p>
            {mapQuery && (
              <iframe
                title={`Map showing ${place}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="mt-3 h-56 w-full rounded-2xl border-0"
              />
            )}
          </div>

          <p className="px-1 text-xs text-muted-foreground">Ad ID {listing.id.slice(0, 10).toUpperCase()}</p>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#14213D]/10 bg-white/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md dark:border-white/10 dark:bg-[#0B0F14]/90 lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2.5">
          {actionButtons ?? (
            <p className="w-full py-2 text-center text-sm text-muted-foreground">Seller is not available for chat</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;