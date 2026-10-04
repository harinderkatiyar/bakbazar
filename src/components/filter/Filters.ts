// Save as: src/components/filter/Filters.ts
import type { Listing } from "../cardListing/Listing";

/* ------------------------------- types ------------------------------- */

export interface FilterField {
  key: string; // read from listing.details[key] (Brand also reads listing.brand)
  label: string;
  options: string[];
}

/** Numeric filter on a details value, e.g. Year, KM driven, Area. Parsed from text like "45,000 km". */
export interface FilterRange {
  key: string; // listing.details[key]
  label: string;
  unit?: string;
}

export interface FilterConfig {
  condition: boolean; // show New / Used
  sellerType: boolean; // show Owner / Dealer
  location: boolean; // show Country / State / City
  priceLabel: string;
  fields: FilterField[];
  ranges: FilterRange[];
}

export type SellerFilter = "all" | "owner" | "dealer";
export type ConditionFilter = "any" | "New" | "Used";
export type PostedFilter = "any" | "24h" | "7d" | "30d";
export type SortKey = "recommended" | "newest" | "price-asc" | "price-desc";

export interface RangeValue {
  min: string;
  max: string;
}

export interface FilterState {
  seller: SellerFilter;
  condition: ConditionFilter;
  min: string;
  max: string;
  fields: Record<string, string[]>;
  // --- new ---
  country: string[];
  state: string[];
  city: string[];
  posted: PostedFilter;
  featured: boolean; // featured / premium ads only
  photos: boolean; // only ads that have photos
  ranges: Record<string, RangeValue>;
}

export const defaultFilters: FilterState = {
  seller: "all",
  condition: "any",
  min: "",
  max: "",
  fields: {},
  country: [],
  state: [],
  city: [],
  posted: "any",
  featured: false,
  photos: false,
  ranges: {},
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const POSTED_OPTIONS: { value: PostedFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const POSTED_MS: Record<Exclude<PostedFilter, "any">, number> = {
  "24h": 24 * 3600_000,
  "7d": 7 * 24 * 3600_000,
  "30d": 30 * 24 * 3600_000,
};

/* ------------------------- per-category config ------------------------ */

const field = (key: string, options: string[], label = key): FilterField => ({ key, label, options });
const range = (key: string, label = key, unit?: string): FilterRange => ({ key, label, unit });

const PHONE_BRANDS = ["Apple", "Samsung", "Xiaomi", "OnePlus", "Vivo", "Oppo", "Realme", "Other"];
const CAR_BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Kia", "Other"];
const BIKE_BRANDS = ["Hero", "Honda", "Bajaj", "TVS", "Royal Enfield", "Yamaha", "Suzuki", "Other"];
const OWNERS = field("Owners", ["1st", "2nd", "3rd+"]);

// NOTE: range keys must match the keys you save in listing.details when a user posts an ad.
// If no listing has a numeric value for a key, that range section simply stays hidden.
const YEAR = range("Year");
const KMS = range("KM driven", "KM driven", "km");

type CategoryFilters = Partial<FilterConfig> & { subs?: Record<string, Partial<FilterConfig>> };

// Keys are category slugs and subcategory slugs from categories.ts
const CONFIG: Record<string, CategoryFilters> = {
  mobiles: {
    fields: [
      field("Brand", PHONE_BRANDS),
      field("RAM", ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB"]),
      field("Storage", ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB"]),
    ],
    subs: {
      tablets: {
        fields: [field("Brand", ["Apple", "Samsung", "Lenovo", "Other"]), field("Storage", ["32 GB", "64 GB", "128 GB", "256 GB"])],
      },
      accessories: { fields: [field("Brand", PHONE_BRANDS)] },
    },
  },
  cars: {
    fields: [
      field("Brand", CAR_BRANDS),
      field("Fuel", ["Petrol", "Diesel", "CNG", "Electric"]),
      field("Transmission", ["Manual", "Automatic"]),
      OWNERS,
    ],
    ranges: [YEAR, KMS],
  },
  bikes: {
    fields: [field("Brand", BIKE_BRANDS), OWNERS],
    ranges: [YEAR, KMS],
    subs: {
      bicycles: { fields: [], ranges: [] },
      "bike-spare-parts": { fields: [], ranges: [] },
    },
  },
  property: {
    condition: false,
    fields: [
      field("Bedrooms", ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"]),
      field("Furnishing", ["Furnished", "Semi-furnished", "Unfurnished"]),
    ],
    ranges: [range("Area", "Area (sq ft)", "sq ft")],
    subs: {
      "plots-and-land": { fields: [field("Facing", ["East", "West", "North", "South"])] },
      "pg-and-guest-houses": { fields: [field("Suitable for", ["Men", "Women", "Anyone"])], ranges: [] },
      "shops-and-offices-for-sale": { fields: [] },
      "shops-and-offices-for-rent": { fields: [] },
    },
  },
  "electronics-and-appliances": {
    fields: [
      field("Brand", ["Samsung", "LG", "Sony", "Apple", "HP", "Dell", "Lenovo", "Other"]),
      field("Warranty", ["In warranty", "Out of warranty"]),
    ],
  },
  furniture: {
    fields: [field("Material", ["Wood", "Metal", "Fabric", "Plastic", "Glass"])],
  },
  fashion: {
    fields: [field("Size", ["XS", "S", "M", "L", "XL", "XXL"])],
    subs: { kids: { fields: [field("Size", ["0–2 yrs", "3–5 yrs", "6–9 yrs", "10+ yrs"])] } },
  },
  jobs: {
    condition: false,
    sellerType: false,
    priceLabel: "Salary (₹ per month)",
    fields: [field("Job type", ["Full-time", "Part-time", "Contract", "Work from home"])],
  },
  services: { condition: false, priceLabel: "Charges" },
  pets: {
    condition: false,
    fields: [field("Age", ["Under 3 months", "3–12 months", "1–3 years", "3+ years"])],
  },
  "commercial-vehicles": {
    fields: [
      field("Brand", ["Tata", "Mahindra", "Ashok Leyland", "Eicher", "Other"]),
      field("Fuel", ["Diesel", "CNG", "Electric"]),
    ],
    ranges: [YEAR, KMS],
    subs: { "vehicle-spare-parts": { fields: [], ranges: [] } },
  },
};

export const getFilterConfig = (categorySlug?: string, subSlug?: string): FilterConfig => {
  const base: FilterConfig = {
    condition: true,
    sellerType: true,
    location: true,
    priceLabel: "Price",
    fields: [],
    ranges: [],
  };
  const entry = categorySlug ? CONFIG[categorySlug] : undefined;
  if (!entry) return base;
  const { subs, ...category } = entry;
  return { ...base, ...category, ...(subSlug ? subs?.[subSlug] : {}) };
};

/* ------------------------------ helpers ------------------------------- */

const norm = (s: string) => s.trim().toLowerCase();
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v?: string[]) => v ?? [];

export const fieldValue = (l: Listing, key: string): string => {
  const raw = l.details?.[key] ?? (key === "Brand" ? l.brand : undefined);
  return raw ? String(raw).trim() : "";
};

/** Reads country/state/city/locality safely (country is optional on older listings). */
export const locationOf = (l: Listing) => {
  const loc = (l.location ?? {}) as unknown as Record<string, unknown>;
  return {
    country: clean(loc.country),
    state: clean(loc.state),
    city: clean(loc.city),
    locality: clean(loc.locality),
  };
};

/** "45,000 km" -> 45000. Returns null when the listing has no number for that key. */
export const numericDetail = (l: Listing, key: string): number | null => {
  const raw = l.details?.[key];
  if (raw == null || raw === "") return null;
  const text = String(raw);
  if (!/\d/.test(text)) return null;
  const n = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const millis = (l: Listing): number => l.createdAt?.toMillis?.() ?? 0;

/* ------------------------- location options --------------------------- */

export interface LocationOption {
  value: string;
  count: number;
}
export interface LocationOptions {
  country: LocationOption[];
  state: LocationOption[];
  city: LocationOption[];
}

const tally = (items: string[]): LocationOption[] => {
  const m = new Map<string, LocationOption>();
  items.forEach((v) => {
    if (!v) return;
    const k = norm(v);
    const e = m.get(k);
    if (e) e.count++;
    else m.set(k, { value: v, count: 1 });
  });
  return [...m.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
};

/** Cascading options: states depend on country, cities depend on country + state. */
export const buildLocationOptions = (
  pool: Listing[],
  f: Pick<FilterState, "country" | "state">
): LocationOptions => {
  const locs = pool.map(locationOf);
  const countries = arr(f.country);
  const states = arr(f.state);
  const inCountry = (l: ReturnType<typeof locationOf>) =>
    !countries.length || countries.some((c) => norm(c) === norm(l.country));
  const inState = (l: ReturnType<typeof locationOf>) =>
    !states.length || states.some((s) => norm(s) === norm(l.state));

  return {
    country: tally(locs.map((l) => l.country)),
    state: tally(locs.filter(inCountry).map((l) => l.state)),
    city: tally(locs.filter((l) => inCountry(l) && inState(l)).map((l) => l.city)),
  };
};

/* ------------------------------ matching ------------------------------ */

/** How many filter groups are active (use this for the "Filters (3)" badge). */
export const countActiveFilters = (f: FilterState, cfg: FilterConfig): number => {
  let n = 0;
  if (cfg.sellerType && f.seller !== "all") n++;
  if (cfg.condition && f.condition !== "any") n++;
  if (f.min !== "" || f.max !== "") n++;
  cfg.fields.forEach((fld) => {
    if (f.fields?.[fld.key]?.length) n++;
  });
  cfg.ranges.forEach((r) => {
    const v = f.ranges?.[r.key];
    if (v && (v.min !== "" || v.max !== "")) n++;
  });
  if (cfg.location) {
    if (arr(f.country).length) n++;
    if (arr(f.state).length) n++;
    if (arr(f.city).length) n++;
  }
  if (f.posted && f.posted !== "any") n++;
  if (f.featured) n++;
  if (f.photos) n++;
  return n;
};

export const applyFilters = (
  list: Listing[],
  f: FilterState,
  cfg: FilterConfig,
  opts: { skipPrice?: boolean } = {}
): Listing[] => {
  const min = f.min !== "" && Number.isFinite(Number(f.min)) ? Number(f.min) : null;
  const max = f.max !== "" && Number.isFinite(Number(f.max)) ? Number(f.max) : null;
  const now = Date.now();
  const country = arr(f.country);
  const state = arr(f.state);
  const city = arr(f.city);

  return list.filter((l) => {
    if (cfg.sellerType && f.seller !== "all" && l.sellerType !== f.seller) return false;
    if (cfg.condition && f.condition !== "any" && l.condition !== f.condition) return false;

    if (!opts.skipPrice) {
      if (min !== null && l.price < min) return false;
      if (max !== null && l.price > max) return false;
    }

    for (const fld of cfg.fields) {
      const selected = f.fields?.[fld.key];
      if (selected?.length) {
        const value = fieldValue(l, fld.key).toLowerCase();
        if (!selected.some((s) => s.toLowerCase() === value)) return false;
      }
    }

    for (const r of cfg.ranges) {
      const v = f.ranges?.[r.key];
      if (!v || (v.min === "" && v.max === "")) continue;
      const n = numericDetail(l, r.key);
      if (n === null) return false;
      if (v.min !== "" && Number.isFinite(Number(v.min)) && n < Number(v.min)) return false;
      if (v.max !== "" && Number.isFinite(Number(v.max)) && n > Number(v.max)) return false;
    }

    if (cfg.location && (country.length || state.length || city.length)) {
      const loc = locationOf(l);
      if (country.length && !country.some((c) => norm(c) === norm(loc.country))) return false;
      if (state.length && !state.some((s) => norm(s) === norm(loc.state))) return false;
      if (city.length && !city.some((c) => norm(c) === norm(loc.city))) return false;
    }

    if (f.posted && f.posted !== "any") {
      const t = millis(l);
      if (!t || now - t > POSTED_MS[f.posted]) return false;
    }

    if (f.featured && l.plan !== "featured" && l.plan !== "premium") return false;
    if (f.photos && !l.images?.length) return false;

    return true;
  });
};

export const sortListings = (list: Listing[], sort: SortKey): Listing[] => {
  if (sort === "recommended") return list; // server order: paid plan priority, then newest
  const copy = [...list];
  if (sort === "newest") return copy.sort((a, b) => millis(b) - millis(a));
  if (sort === "price-asc") return copy.sort((a, b) => a.price - b.price);
  return copy.sort((a, b) => b.price - a.price);
};