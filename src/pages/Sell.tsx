// Save as: src/pages/Sell.tsx
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  ImagePlus,
  Lightbulb,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldAlert,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase.config";
import { useAuth } from "@/context/AuthContext";
import { categories, getCategory } from "@/components/category/Categories";
import { getSellConfig, type SellField } from "./sellConfig";
import { formatPrice } from "@/components/cardListing/Listing";

const MAX_PHOTOS = 2;
const MAX_FILE_MB = 10;
const TERMS_VERSION = "2026-10-03";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/* ------------------------------ helpers ------------------------------ */

// Resize and re-encode before upload: faster for sellers, cheaper storage for you
const compressImage = (file: File, maxSide = 1280, quality = 0.82): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the photo"))),
        "image/jpeg",
        quality
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this photo. Please use a JPG, PNG or WebP image."));
    };
    img.src = url;
  });

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const USE_CLOUDINARY = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const STAGES = ["Optimising photos…", "Uploading photos…", "Submitting your ad…"];

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(blob);
  });

// No-account mode: shrink each photo until it is small enough to live inside the Firestore ad itself
// (a Firestore document can hold 1 MB in total). Good for testing; use Cloudinary for a real launch.
const compressForInline = async (file: File): Promise<Blob> => {
  const attempts: [number, number][] = [
    [800, 0.7],
    [640, 0.6],
    [520, 0.5],
    [420, 0.45],
  ];
  let blob = await compressImage(file, attempts[0][0], attempts[0][1]);
  for (const [side, quality] of attempts.slice(1)) {
    if (blob.size <= 150 * 1024) break;
    blob = await compressImage(file, side, quality);
  }
  return blob;
};

// Cloudinary: free, no card needed. Set the two VITE_CLOUDINARY_* values in .env
const uploadToCloudinary = async (blob: Blob, uid: string, name: string): Promise<string> => {
  const body = new FormData();
  body.append("file", blob, `${name}.jpg`);
  body.append("upload_preset", UPLOAD_PRESET as string);
  body.append("folder", `bikbazar/listings/${uid}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Photo upload failed. Please try again.");
    const data = await res.json();
    return data.secure_url as string;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Photo upload")) throw e;
    throw new Error("Photo upload failed. Please check your internet connection and try again.");
  } finally {
    clearTimeout(timer);
  }
};

const inputBase =
  "h-11 w-full rounded-xl border bg-transparent px-3 text-sm outline-none transition focus:border-[#C4432B] focus:ring-2 focus:ring-[#C4432B]/20";
const inputClass = (invalid?: boolean) =>
  `${inputBase} ${invalid ? "border-[#C4432B]" : "border-[#14213D]/15 dark:border-white/15"}`;

const Panel = ({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) => (
  <section className="space-y-5 rounded-2xl border border-[#14213D]/10 bg-white/70 p-5 sm:p-6 dark:border-white/10 dark:bg-white/5">
    <div>
      <h2 className="text-lg font-semibold text-[#14213D] dark:text-white">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
    </div>
    {children}
  </section>
);

const Field = ({
  id,
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div data-invalid={error ? "true" : undefined} className={className}>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#14213D] dark:text-white">
      {label}
      {required && <span className="text-[#C4432B]"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    {error && (
      <p role="alert" className="mt-1.5 text-xs font-medium text-[#C4432B]">
        {error}
      </p>
    )}
  </div>
);

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-[#14213D]/5 p-1 dark:bg-white/10"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              on
                ? "bg-white text-[#14213D] shadow-sm dark:bg-[#1c2430] dark:text-white"
                : "text-[#14213D]/60 hover:text-[#14213D] dark:text-white/60 dark:hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const DynamicField = ({
  field,
  value,
  error,
  onChange,
}: {
  field: SellField;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) => {
  const id = `f-${field.key}`;
  return (
    <Field id={id} label={field.label} required={field.required} error={error}>
      {field.type === "select" ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass(!!error)} appearance-none pr-9 [&>option]:text-black`}
          >
            <option value="">Select</option>
            {field.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            type={field.type === "number" ? "number" : "text"}
            inputMode={field.type === "number" ? "numeric" : undefined}
            min={field.min}
            max={field.max}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass(!!error)} ${field.suffix ? "pr-14" : ""}`}
          />
          {field.suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {field.suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
};

interface Photo {
  file: File;
  preview: string;
}

/* ------------------------------- form -------------------------------- */

const SellForm = ({ onPostAnother }: { onPostAnother: () => void }) => {
  const { user } = useAuth();

  const [catSlug, setCatSlug] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [sellerType, setSellerType] = useState<"owner" | "dealer" | "">("");
  const [condition, setCondition] = useState<"New" | "Used" | "">("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [locality, setLocality] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [phone, setPhone] = useState((user?.phoneNumber ?? "").replace(/\D/g, "").slice(-10));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const cat = getCategory(catSlug);
  const sub = cat?.subs.find((s) => s.slug === subSlug);
  const config = useMemo(() => (cat ? getSellConfig(cat.slug, sub?.slug) : null), [cat?.slug, sub?.slug]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const chooseCategory = (slug: string) => {
    setCatSlug(slug);
    setSubSlug("");
    setDetails({});
    setErrors({});
  };

  const chooseSub = (slug: string) => {
    setSubSlug(slug);
    setDetails({});
    clearError("subcategory");
  };

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const valid = list.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_MB * 1024 * 1024);
    let message = "";
    if (valid.length < list.length) message = `Use JPG, PNG or WebP photos under ${MAX_FILE_MB} MB.`;

    const room = MAX_PHOTOS - photos.length;
    if (valid.length > room) message = `You can add only ${MAX_PHOTOS} photos for now.`;

    const added = valid.slice(0, Math.max(room, 0)).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    if (added.length) setPhotos((prev) => [...prev, ...added]);

    setErrors((prev) => {
      const next = { ...prev };
      if (message) next.photos = message;
      else delete next.photos;
      return next;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    clearError("photos");
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const pinLocation = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Your browser can't share location. You can skip this.");
      return;
    }
    setGeoBusy(true);
    setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 3 decimals is about 100 m: shows the area on the map without revealing your exact door
        setCoords({ lat: Number(pos.coords.latitude.toFixed(3)), lng: Number(pos.coords.longitude.toFixed(3)) });
        setGeoBusy(false);
      },
      () => {
        setGeoBusy(false);
        setGeoMsg("Couldn't get your location. You can skip this.");
      },
      { timeout: 10000 }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cat) e.category = "Choose a category";
    else if (cat.subs.length && !sub) e.subcategory = "Choose a subcategory";

    if (config?.askSellerType && !sellerType) e.sellerType = "Tell buyers if you are the owner or a dealer";
    if (config?.askCondition && !condition) e.condition = "Select the condition";

    config?.fields.forEach((f) => {
      const v = (details[f.key] ?? "").trim();
      if (f.required && !v) e[`d:${f.key}`] = `${f.label} is required`;
      else if (f.type === "number" && v) {
        const n = Number(v);
        if (!Number.isFinite(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max))
          e[`d:${f.key}`] = `Enter a valid ${f.label.toLowerCase()}`;
      }
    });

    if (title.trim().length < 10) e.title = "Title must be at least 10 characters";
    if (description.trim().length < 30) e.description = "Add at least 30 characters (2 to 3 lines)";
    const p = Number(price);
    if (price === "" || !Number.isFinite(p) || p <= 0) e.price = "Enter a valid amount";
    if (photos.length < 1) e.photos = "Add at least 1 photo";
    if (!city.trim()) e.city = "Enter your city";
    if (!stateName) e.state = "Select your state";
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (!accepted) e.accepted = "You need to accept this before posting";
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (submitting || !user || !cat || !config) {
      if (!cat) setErrors({ category: "Choose a category" });
      return;
    }

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[data-invalid="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true });
      });
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      setStage("Optimising photos…");
      const blobs = await Promise.all(
        photos.map((p) => (USE_CLOUDINARY ? compressImage(p.file) : compressForInline(p.file)))
      );

      setStage("Uploading photos…");
      const stamp = Date.now();
      const urls = await Promise.all(
        blobs.map((blob, i) =>
          USE_CLOUDINARY ? uploadToCloudinary(blob, user.uid, `${stamp}-${i}`) : blobToDataUrl(blob)
        )
      );

      setStage("Submitting your ad…");
      const cleanDetails: Record<string, string> = {};
      config.fields.forEach((f) => {
        const v = (details[f.key] ?? "").trim();
        if (v) cleanDetails[f.key] = v;
      });
      const brand = cleanDetails.Brand;
      const memberSince = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;

      const docRef = await addDoc(collection(db, "listings"), {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category: cat.slug,
        subcategory: sub?.slug ?? null,
        location: {
          city: city.trim(),
          state: stateName,
          ...(locality.trim() ? { locality: locality.trim() } : {}),
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        },
        condition: config.askCondition ? condition : "New",
        ...(brand ? { brand } : {}),
        images: urls,
        details: cleanDetails,
        // The ad stays hidden until someone sets status to "active" after review
        status: "pending",
        plan: "free",
        priority: 0,
        ...(config.askSellerType && sellerType ? { sellerType } : {}),
        sellerId: user.uid,
        sellerName: user.displayName ?? "Seller",
        sellerPhone: `+91${phone}`,
        ...(memberSince ? { sellerSince: Timestamp.fromDate(memberSince) } : {}),
        // Proof that the seller accepted the disclaimer, and which version
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_VERSION,
        createdAt: serverTimestamp(),
      });

      setDoneId(docRef.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error posting ad:", err);
      const code = (err as { code?: string })?.code ?? "";
      setSubmitError(
        err instanceof Error && (err.message.startsWith("Could not read") || err.message.startsWith("Photo upload"))
          ? err.message
          : code.startsWith("storage/")
          ? "Your photos could not be uploaded. Please check your internet connection and try again."
          : "Something went wrong while posting your ad. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
      setStage("");
    }
  };

  /* ---------------------- success: under review ---------------------- */

  if (doneId) {
    const steps = [
      { label: "Submitted", state: "done" },
      { label: "Under review", state: "now" },
      { label: "Live on Bikbazar", state: "next" },
    ] as const;

    return (
      <div className="container max-w-xl py-16 text-center sm:py-24">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E9A319]/15 text-[#B67A00]">
          <Clock className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-[#14213D] dark:text-white">Your ad is under review</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Thank you! We check every ad before it goes live to keep Bikbazar safe. Once it is approved, it will show in
          the listings. You don't need to post it again.
        </p>

        <ol className="mx-auto mt-8 flex max-w-sm items-center justify-between">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : "bg-[#14213D]/15 dark:bg-white/15"}`} />
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    s.state === "done"
                      ? "bg-[#2F7D6D] text-white"
                      : s.state === "now"
                      ? "bg-[#E9A319] text-white"
                      : "bg-[#14213D]/10 text-[#14213D]/40 dark:bg-white/10 dark:text-white/40"
                  }`}
                >
                  {s.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </span>
                <span
                  className={`h-0.5 flex-1 ${i === steps.length - 1 ? "opacity-0" : "bg-[#14213D]/15 dark:bg-white/15"}`}
                />
              </span>
              <span className="text-xs font-medium text-[#14213D] dark:text-white">{s.label}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-xs text-muted-foreground">Ad reference: {doneId.slice(0, 10).toUpperCase()}</p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={onPostAnother}
            className="rounded-full bg-[#C4432B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C4432B]/90"
          >
            Post another ad
          </button>
          <Link
            to="/"
            className="rounded-full border border-[#14213D]/15 px-6 py-2.5 text-sm font-semibold text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ the form ------------------------------ */

  const descLen = description.trim().length;

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div className="container max-w-6xl py-8 sm:py-12">
      {/* Full-screen loader while the ad is being posted */}
      {submitting && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-live="polite"
          aria-label="Posting your ad"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white/90 px-6 text-center backdrop-blur-sm dark:bg-[#0B0F14]/90"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#C4432B]" />
          <div>
            <p className="text-lg font-semibold text-[#14213D] dark:text-white">{stage || "Posting…"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Please don't close or refresh this page.</p>
          </div>
          <div className="flex items-center gap-2" aria-hidden>
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  i <= stageIndex ? "bg-[#C4432B]" : "bg-[#14213D]/15 dark:bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#14213D] sm:text-3xl dark:text-white">Post your ad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It's free. Your ad goes live after a quick review by our team.
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Category */}
          <Panel title="What are you selling?" desc="Pick the category that fits best, so the right buyers find you.">
            <div data-invalid={errors.category ? "true" : undefined}>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-6">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const on = c.slug === catSlug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => chooseCategory(c.slug)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                        on
                          ? "border-[#C4432B] bg-[#C4432B]/5 ring-1 ring-[#C4432B]"
                          : "border-[#14213D]/10 hover:bg-[#14213D]/5 dark:border-white/10 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.tint}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-medium leading-tight text-[#14213D] dark:text-white">{c.name}</span>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p role="alert" className="mt-2 text-xs font-medium text-[#C4432B]">
                  {errors.category}
                </p>
              )}
            </div>

            {cat && cat.subs.length > 0 && (
              <div data-invalid={errors.subcategory ? "true" : undefined}>
                <p className="mb-2 text-sm font-medium text-[#14213D] dark:text-white">
                  Subcategory<span className="text-[#C4432B]"> *</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.subs.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      aria-pressed={s.slug === subSlug}
                      onClick={() => chooseSub(s.slug)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        s.slug === subSlug
                          ? "border-[#C4432B] bg-[#C4432B] text-white"
                          : "border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {errors.subcategory && (
                  <p role="alert" className="mt-2 text-xs font-medium text-[#C4432B]">
                    {errors.subcategory}
                  </p>
                )}
              </div>
            )}
          </Panel>

          {cat && config && (cat.subs.length === 0 || sub) && (
            <>
              {/* Details */}
              <Panel title="Item details" desc={`The key details buyers look for in ${sub?.name ?? cat.name}.`}>
                {(config.askSellerType || config.askCondition) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {config.askSellerType && (
                      <Field
                        label="You are"
                        required
                        error={errors.sellerType}
                        hint="Choose Dealer if you sell this as a business."
                      >
                        <Segmented
                          label="You are"
                          value={sellerType}
                          onChange={(v) => {
                            setSellerType(v);
                            clearError("sellerType");
                          }}
                          options={[
                            { value: "owner", label: "Owner" },
                            { value: "dealer", label: "Dealer" },
                          ]}
                        />
                      </Field>
                    )}
                    {config.askCondition && (
                      <Field label="Condition" required error={errors.condition}>
                        <Segmented
                          label="Condition"
                          value={condition}
                          onChange={(v) => {
                            setCondition(v);
                            clearError("condition");
                          }}
                          options={[
                            { value: "New", label: "New" },
                            { value: "Used", label: "Used" },
                          ]}
                        />
                      </Field>
                    )}
                  </div>
                )}

                {config.fields.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {config.fields.map((f) => (
                      <DynamicField
                        key={f.key}
                        field={f}
                        value={details[f.key] ?? ""}
                        error={errors[`d:${f.key}`]}
                        onChange={(v) => {
                          setDetails((prev) => ({ ...prev, [f.key]: v }));
                          clearError(`d:${f.key}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </Panel>

              {/* Photos */}
              <Panel
                title="Photos"
                desc={`Add up to ${MAX_PHOTOS} clear photos. The first one is the cover photo shown in listings.`}
              >
                <div data-invalid={errors.photos ? "true" : undefined}>
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((p, i) => (
                      <div
                        key={p.preview}
                        className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#14213D]/10 dark:border-white/10"
                      >
                        <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-[#14213D]/80 px-2 py-0.5 text-[11px] font-medium text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition hover:bg-[#14213D]/5 dark:hover:bg-white/5 ${
                          errors.photos ? "border-[#C4432B]" : "border-[#14213D]/20 dark:border-white/20"
                        }`}
                      >
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="font-medium text-[#14213D] dark:text-white">Add photo</span>
                        <span className="text-xs text-muted-foreground">Tap, or drag and drop</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {errors.photos && (
                    <p role="alert" className="mt-2 text-xs font-medium text-[#C4432B]">
                      {errors.photos}
                    </p>
                  )}
                </div>
              </Panel>

              {/* Title, description, price */}
              <Panel title="Describe your item">
                <Field
                  id="title"
                  label="Ad title"
                  required
                  error={errors.title}
                  hint={`Example: ${config.titleExample}`}
                >
                  <input
                    id="title"
                    value={title}
                    maxLength={70}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearError("title");
                    }}
                    placeholder={config.titleExample}
                    className={inputClass(!!errors.title)}
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">{title.length}/70</p>
                </Field>

                <Field id="description" label="Description" required error={errors.description}>
                  <textarea
                    id="description"
                    value={description}
                    rows={5}
                    maxLength={1000}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearError("description");
                    }}
                    placeholder="Write 2 to 3 lines about your item…"
                    className={`${inputBase} h-auto py-3 ${
                      errors.description ? "border-[#C4432B]" : "border-[#14213D]/15 dark:border-white/15"
                    }`}
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{descLen < 30 ? `${30 - descLen} more characters needed` : "Looks good"}</span>
                    <span>{description.length}/1000</span>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#E9A319]/10 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-medium text-[#14213D] dark:text-white">
                      <Lightbulb className="h-4 w-4 text-[#B67A00]" /> Example for {sub?.name ?? cat.name}
                    </p>
                    <p className="mt-1.5 italic text-muted-foreground">“{config.descriptionExample}”</p>
                    {description.trim() === "" && (
                      <button
                        type="button"
                        onClick={() => setDescription(config.descriptionExample)}
                        className="mt-2 text-xs font-semibold text-[#C4432B] hover:underline"
                      >
                        Use this as a starting point
                      </button>
                    )}
                  </div>
                </Field>

                <Field id="price" label={config.priceLabel} required error={errors.price}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <input
                      id="price"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        clearError("price");
                      }}
                      placeholder="0"
                      className={`${inputClass(!!errors.price)} pl-7`}
                    />
                  </div>
                </Field>
              </Panel>

              {/* Location */}
              <Panel title="Location" desc="Buyers use this to find items near them.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="city" label="City" required error={errors.city}>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        clearError("city");
                      }}
                      placeholder="e.g. Kanpur"
                      className={inputClass(!!errors.city)}
                    />
                  </Field>
                  <Field id="state" label="State" required error={errors.state}>
                    <div className="relative">
                      <select
                        id="state"
                        value={stateName}
                        onChange={(e) => {
                          setStateName(e.target.value);
                          clearError("state");
                        }}
                        className={`${inputClass(!!errors.state)} appearance-none pr-9 [&>option]:text-black`}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                    </div>
                  </Field>
                  <Field id="locality" label="Area / locality" className="sm:col-span-2">
                    <input
                      id="locality"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Hanuman Nagar, Purdilnagar"
                      className={inputClass()}
                    />
                  </Field>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={pinLocation}
                    disabled={geoBusy}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#14213D]/15 px-3.5 py-2 text-sm font-medium text-[#14213D] hover:bg-[#14213D]/5 disabled:opacity-60 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                  >
                    {geoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    {coords ? "Update map pin" : "Show my area on the map"}
                  </button>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {coords
                      ? "Area pinned. Only an approximate spot is shown, not your exact address."
                      : geoMsg || "Optional. We save only an approximate location, not your exact address."}
                  </p>
                </div>
              </Panel>

              {/* Contact */}
              <Panel title="Contact details" desc="Buyers will call you on this number.">
                <Field
                  id="phone"
                  label="Mobile number"
                  required
                  error={errors.phone}
                  hint="This number is shown to buyers on your ad. Use a number you answer."
                >
                  <div className="flex gap-2">
                    <span className="grid h-11 place-items-center rounded-xl border border-[#14213D]/15 px-3 text-sm text-muted-foreground dark:border-white/15">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        clearError("phone");
                      }}
                      placeholder="10-digit mobile number"
                      className={inputClass(!!errors.phone)}
                    />
                  </div>
                </Field>
              </Panel>

              {/* Disclaimer */}
              <section
                data-invalid={errors.accepted ? "true" : undefined}
                className={`space-y-4 rounded-2xl border p-5 sm:p-6 ${
                  errors.accepted
                    ? "border-[#C4432B] bg-[#C4432B]/5"
                    : "border-[#E9A319]/40 bg-[#E9A319]/10"
                }`}
              >
                <h2 className="flex items-center gap-2 text-base font-semibold text-[#14213D] dark:text-white">
                  <ShieldAlert className="h-5 w-5 text-[#B67A00]" /> Please read before posting
                </h2>
                <p className="text-sm text-muted-foreground">
                  Stay safe: meet in a public place, check the item before you pay, never share OTPs or bank PINs, and
                  never ask a buyer for advance money.
                </p>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => {
                      setAccepted(e.target.checked);
                      clearError("accepted");
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#C4432B]"
                  />
                  <span className="text-sm leading-relaxed text-[#14213D] dark:text-white">
                    I confirm that the details and photos in my ad are true, that I own this item and am legally allowed
                    to sell it, and that it is not stolen or prohibited. I understand that Bikbazar is only a platform
                    where buyers and sellers find each other. Bikbazar does not inspect, hold or guarantee any item,
                    payment or deal, and is not responsible for any scam, money loss, defective or wrongly described
                    item, or dispute between users.
                  </span>
                </label>
                {errors.accepted && (
                  <p role="alert" className="text-xs font-medium text-[#C4432B]">
                    {errors.accepted}
                  </p>
                )}
              </section>

              {submitError && (
                <p role="alert" className="rounded-xl bg-[#C4432B]/10 p-3 text-sm font-medium text-[#C4432B]">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C4432B] text-sm font-semibold text-white transition hover:bg-[#C4432B]/90 disabled:opacity-70"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? stage || "Posting…" : "Submit ad for review"}
              </button>
            </>
          )}
        </div>

        {/* Right column: live preview and tips */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-2xl border border-[#14213D]/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="mb-3 text-sm font-semibold text-[#14213D] dark:text-white">Live preview</p>
              <div className="overflow-hidden rounded-xl border border-[#14213D]/10 dark:border-white/10">
                <div className="relative aspect-[4/3] bg-[#14213D]/5 dark:bg-white/5">
                  {photos[0] ? (
                    <img src={photos[0].preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                  {config?.askCondition && condition && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[#14213D]">
                      {condition}
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-bold text-[#C4432B]">
                      {price && Number(price) > 0 ? formatPrice(Number(price)) : "₹ —"}
                    </p>
                    {config?.askSellerType && sellerType && (
                      <span className="rounded-full border border-[#14213D]/15 px-2 py-0.5 text-[11px] font-medium text-[#14213D]/70 dark:border-white/15 dark:text-white/70">
                        {sellerType === "dealer" ? "Dealer" : "Owner"}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-[#14213D] dark:text-white">
                    {title || "Your title appears here"}
                  </p>
                  <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {city || "Your city"}
                  </p>
                </div>
              </div>
            </div>

            {config && (
              <div className="rounded-2xl border border-[#14213D]/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#14213D] dark:text-white">
                  <Lightbulb className="h-4 w-4 text-[#B67A00]" /> Tips for a good ad
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {config.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
};

// Changing `round` remounts the form, which clears everything for "Post another ad"
export default function Sell() {
  const [round, setRound] = useState(0);
  return <SellForm key={round} onPostAnother={() => setRound((r) => r + 1)} />;
}