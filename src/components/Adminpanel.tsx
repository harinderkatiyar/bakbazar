// Save as: src/pages/AdminPanel.tsx      Route: /bikabazar-admin
// One file: access gate + Dashboard + Listings moderation + Users management.
// Security is enforced by Firestore rules (see firestore.rules) — this UI is only the front door.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection, deleteField, doc, getCountFromServer, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, where, writeBatch,
  type DocumentReference, type Query, type QueryConstraint, type WriteBatch,
} from "firebase/firestore";
import {
  Ban, Check, ExternalLink, LayoutDashboard, Loader2, LogOut, Package, RefreshCw, Search, ShieldAlert, Trash2, Users, X,
} from "lucide-react";
import { db } from "@/lib/firebase.config";

/* ------------------------------ helpers ------------------------------- */

type D = { id: string; [k: string]: any };
const inr = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const ms = (t: any): number => t?.toMillis?.() ?? 0;
const ago = (t: any) => {
  if (!ms(t)) return "—";
  const s = (Date.now() - ms(t)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};
const place = (l: D) => [l.location?.city, l.location?.state].filter(Boolean).join(", ");
const uname = (u: D) => u.displayName || u.name || u.fullName || u.email?.split("@")[0] || "User";
const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";
const PRIORITY: Record<string, number> = { free: 0, featured: 1, premium: 2 }; // adjust to how your feed sorts
const REASONS = ["Unclear / blurry photos", "Wrong price", "Prohibited item", "Duplicate ad", "Incomplete details"];

const btn = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50";
const B = {
  ok: `${btn} bg-emerald-600 text-white hover:bg-emerald-700`,
  no: `${btn} bg-[#C4432B]/10 text-[#C4432B] hover:bg-[#C4432B]/20`,
  ghost: `${btn} border border-[#14213D]/15 hover:bg-[#14213D]/5 dark:border-white/15 dark:hover:bg-white/10`,
  danger: `${btn} bg-[#C4432B] text-white hover:bg-[#C4432B]/90`,
};
const card = "rounded-2xl border border-[#14213D]/10 bg-white dark:border-white/10 dark:bg-[#121821]";
const input = "h-9 rounded-lg border border-[#14213D]/15 bg-transparent px-3 text-sm outline-none focus:border-[#C4432B] focus:ring-2 focus:ring-[#C4432B]/20 dark:border-white/15";
const TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
};
const Status = ({ s }: { s: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${TONE[s] ?? "bg-[#14213D]/10"}`}>{s || "unknown"}</span>
);

/** live Firestore query -> rows (null while loading) */
function useLive(build: () => Query, deps: unknown[]) {
  const [rows, setRows] = useState<D[] | null>(null);
  useEffect(() => {
    setRows(null);
    return onSnapshot(
      build(),
      (s) => setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => { console.error(e); setRows([]); }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return rows;
}

/* ------------------------------- modals ------------------------------- */

interface Ask {
  title: string;
  body?: string;
  presets?: string[]; // when set, shows a reason box
  label: string;
  danger?: boolean;
  run: (value: string) => Promise<unknown>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl ${wide ? "max-w-2xl" : "max-w-md"} ${card}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#14213D]/5 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AskModal({ ask, onClose }: { ask: Ask; onClose: () => void }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); await ask.run(v.trim()); onClose(); };
  return (
    <Modal title={ask.title} onClose={() => !busy && onClose()}>
      {ask.body && <p className="text-sm text-[#14213D]/70 dark:text-white/70">{ask.body}</p>}
      {ask.presets && (
        <div className="mt-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {ask.presets.map((p) => (
              <button key={p} onClick={() => setV(p)} className="rounded-full bg-[#14213D]/[0.06] px-2.5 py-1 text-xs font-medium hover:bg-[#14213D]/10 dark:bg-white/10">{p}</button>
            ))}
          </div>
          <textarea value={v} onChange={(e) => setV(e.target.value)} rows={3} placeholder="Reason (saved on the listing)" className={`${input} h-auto w-full py-2`} />
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button className={B.ghost} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={ask.danger ? B.danger : B.ok} onClick={go} disabled={busy}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{ask.label}
        </button>
      </div>
    </Modal>
  );
}

/* --------------------------- listing row/detail ------------------------ */

interface Act {
  approve: (ids: string[]) => Promise<void>;
  reject: (ids: string[]) => void;
  remove: (ids: string[]) => void;
  plan: (id: string, plan: string) => Promise<void>;
}

function ListingRow({ l, act, onOpen, onSeller, sel, onSel }: {
  l: D; act: Act; onOpen: () => void; onSeller?: () => void; sel?: boolean; onSel?: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3 p-3 sm:flex-nowrap">
      {onSel && <input type="checkbox" checked={!!sel} onChange={(e) => onSel(e.target.checked)} aria-label={`Select ${l.title}`} className="mt-1 h-4 w-4 accent-[#C4432B]" />}
      <button onClick={onOpen} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#14213D]/10" aria-label="Open details">
        {l.images?.[0] && <img src={l.images[0]} alt="" className="h-full w-full object-cover" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={onOpen} className="max-w-full truncate text-left text-sm font-semibold hover:underline">{l.title}</button>
          <Status s={l.status} />
          {l.plan && l.plan !== "free" && <span className="rounded-full bg-[#E9A319]/20 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#B7791F]">{l.plan}</span>}
        </div>
        <p className="mt-0.5 text-xs text-[#14213D]/60 dark:text-white/60">
          <b className="text-[#14213D] dark:text-white">{inr(l.price)}</b> · {l.category || "—"} · {place(l) || "No location"} · {ago(l.createdAt)}
        </p>
        <p className="text-xs">
          by {onSeller ? <button onClick={onSeller} className="font-medium text-[#C4432B] hover:underline">{l.sellerName || "Seller"}</button> : l.sellerName || "Seller"}
        </p>
        {l.status === "rejected" && l.rejectReason && <p className="mt-1 text-xs text-red-600 dark:text-red-300">Reason: {l.rejectReason}</p>}
      </div>
      <div className="ml-auto flex shrink-0 gap-1.5">
        {l.status !== "active" && <button className={B.ok} onClick={() => act.approve([l.id])}><Check className="h-3.5 w-3.5" />Approve</button>}
        {l.status !== "rejected" && <button className={B.no} onClick={() => act.reject([l.id])}><X className="h-3.5 w-3.5" />Reject</button>}
        <button className={B.ghost} onClick={() => act.remove([l.id])} aria-label="Delete listing"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function DetailModal({ l, act, onClose }: { l: D; act: Act; onClose: () => void }) {
  const facts: [string, any][] = [
    ["Price", inr(l.price)], ["Category", l.category], ["Brand", l.brand], ["Condition", l.condition],
    ["Location", place(l)], ["Seller", l.sellerName], ["Seller type", l.sellerType], ["Phone", l.sellerPhone],
    ...Object.entries(l.details ?? {}),
  ];
  return (
    <Modal title={l.title} onClose={onClose} wide>
      {l.images?.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {l.images.slice(0, 8).map((s: string, i: number) => (
            <a key={i} href={s} target="_blank" rel="noreferrer"><img src={s} alt="" className="aspect-square w-full rounded-lg object-cover" /></a>
          ))}
        </div>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt className="text-xs text-[#14213D]/55 dark:text-white/55">{k}</dt><dd className="font-medium">{String(v)}</dd></div>
        ))}
      </dl>
      <p className="mt-4 whitespace-pre-line text-sm text-[#14213D]/75 dark:text-white/70">{l.description || "No description."}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#14213D]/10 pt-4 dark:border-white/10">
        <label className="flex items-center gap-2 text-xs font-medium">
          Plan
          <select value={l.plan || "free"} onChange={(e) => act.plan(l.id, e.target.value)} className={`${input} h-8 capitalize`}>
            {Object.keys(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <div className="flex gap-1.5">
          <Link to={`/listing/${l.id}`} target="_blank" className={B.ghost}><ExternalLink className="h-3.5 w-3.5" />View</Link>
          {l.status !== "active" && <button className={B.ok} onClick={() => { act.approve([l.id]); onClose(); }}>Approve</button>}
          {l.status !== "rejected" && <button className={B.no} onClick={() => { onClose(); act.reject([l.id]); }}>Reject</button>}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------- dashboard ----------------------------- */

function Dashboard({ tick, go, act, open }: { tick: number; go: (t: string, s?: string) => void; act: Act; open: (l: D) => void }) {
  const [c, setC] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    const L = collection(db, "listings");
    const n = (q: Query) => getCountFromServer(q).then((s) => s.data().count);
    Promise.all([
      n(query(L, where("status", "==", "pending"))), n(query(L, where("status", "==", "active"))),
      n(query(L, where("status", "==", "rejected"))), n(query(L)), n(query(collection(db, "users"))),
    ]).then(([pending, active, rejected, total, users]) => setC({ pending, active, rejected, total, users })).catch(console.error);
  }, [tick]);

  const pending = useLive(() => query(collection(db, "listings"), where("status", "==", "pending"), limit(8)), [tick]);
  const latest = useLive(() => query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(5)), [tick]);

  const stats = [
    { k: "pending", label: "Pending review", tone: "text-amber-600", on: () => go("listings", "pending") },
    { k: "active", label: "Live listings", tone: "text-emerald-600", on: () => go("listings", "active") },
    { k: "rejected", label: "Rejected", tone: "text-red-600", on: () => go("listings", "rejected") },
    { k: "total", label: "All listings", tone: "", on: () => go("listings", "all") },
    { k: "users", label: "Users", tone: "text-[#C4432B]", on: () => go("users") },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <button key={s.k} onClick={s.on} className={`${card} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md`}>
            <p className="text-xs font-medium text-[#14213D]/60 dark:text-white/60">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${s.tone}`}>{c ? c[s.k].toLocaleString("en-IN") : "–"}</p>
          </button>
        ))}
      </div>

      <section className={card}>
        <div className="flex items-center justify-between border-b border-[#14213D]/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-bold">Needs your review</h2>
          <button onClick={() => go("listings", "pending")} className="text-xs font-semibold text-[#C4432B] hover:underline">See all</button>
        </div>
        {pending === null ? <p className="p-6 text-center text-sm text-[#14213D]/50">Loading…</p>
          : pending.length === 0 ? <p className="p-6 text-center text-sm text-[#14213D]/50">All caught up. No listings waiting.</p>
          : <div className="divide-y divide-[#14213D]/10 dark:divide-white/10">{pending.map((l) => <ListingRow key={l.id} l={l} act={act} onOpen={() => open(l)} />)}</div>}
      </section>

      <section className={card}>
        <h2 className="border-b border-[#14213D]/10 px-4 py-3 text-sm font-bold dark:border-white/10">Latest listings</h2>
        {latest === null ? <p className="p-6 text-center text-sm text-[#14213D]/50">Loading…</p>
          : <div className="divide-y divide-[#14213D]/10 dark:divide-white/10">{latest.map((l) => <ListingRow key={l.id} l={l} act={act} onOpen={() => open(l)} />)}</div>}
      </section>
    </div>
  );
}

/* -------------------------------- listings ----------------------------- */

const STATUS_TABS = ["all", "pending", "active", "rejected"];

function Listings({ status, setStatus, seller, setSeller, act, open, tick }: {
  status: string; setStatus: (s: string) => void; seller: string | null; setSeller: (s: string | null) => void;
  act: Act; open: (l: D) => void; tick: number;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  useEffect(() => setSel(new Set()), [tick, status, seller]);

  const rows = useLive(() => {
    const c: QueryConstraint[] = [];
    if (seller) c.push(where("sellerId", "==", seller));
    if (status !== "all") c.push(where("status", "==", status));
    if (!seller && status === "all") c.push(orderBy("createdAt", "desc"));
    return query(collection(db, "listings"), ...c, limit(300));
  }, [status, seller]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (rows ?? [])
      .filter((l) => !n || [l.title, l.sellerName, l.id, l.category, place(l)].join(" ").toLowerCase().includes(n))
      .sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  }, [rows, q]);

  const ids = [...sel];
  const allOn = shown.length > 0 && shown.every((l) => sel.has(l.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-[#14213D]/[0.06] p-0.5 dark:bg-white/10">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`h-8 rounded-[10px] px-3 text-xs font-semibold capitalize ${status === s ? "bg-white shadow-sm dark:bg-[#2b3547]" : "text-[#14213D]/55 dark:text-white/55"}`}>{s}</button>
          ))}
        </div>
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, seller, city, ID…" className={`${input} w-full pl-9`} />
        </label>
        {seller && (
          <button onClick={() => setSeller(null)} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#C4432B]/10 px-3 text-xs font-semibold text-[#C4432B]">
            Seller: {rows?.[0]?.sellerName || seller.slice(0, 6)} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#14213D]/10 px-3 py-2 text-xs dark:border-white/10">
          <input type="checkbox" checked={allOn} onChange={(e) => setSel(e.target.checked ? new Set(shown.map((l) => l.id)) : new Set())} aria-label="Select all" className="h-4 w-4 accent-[#C4432B]" />
          {ids.length ? (
            <>
              <b>{ids.length} selected</b>
              <button className={B.ok} onClick={() => act.approve(ids)}>Approve</button>
              <button className={B.no} onClick={() => act.reject(ids)}>Reject</button>
              <button className={B.danger} onClick={() => act.remove(ids)}>Delete</button>
            </>
          ) : <span className="text-[#14213D]/55 dark:text-white/55">{rows === null ? "Loading…" : `${shown.length} listing${shown.length === 1 ? "" : "s"}`}</span>}
        </div>
        {rows !== null && shown.length === 0
          ? <p className="p-10 text-center text-sm text-[#14213D]/50">Nothing here.</p>
          : <div className="divide-y divide-[#14213D]/10 dark:divide-white/10">
              {shown.map((l) => (
                <ListingRow key={l.id} l={l} act={act} onOpen={() => open(l)} onSeller={() => setSeller(l.sellerId)}
                  sel={sel.has(l.id)} onSel={(v) => setSel((p) => { const n = new Set(p); v ? n.add(l.id) : n.delete(l.id); return n; })} />
              ))}
            </div>}
      </div>
    </div>
  );
}

/* --------------------------------- users ------------------------------- */

function UsersTab({ viewListings, ask, notify, purge }: {
  viewListings: (uid: string) => void; ask: (a: Ask) => void; notify: (m: string) => void; purge: (uid: string) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const rows = useLive(() => query(collection(db, "users"), limit(500)), []);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (rows ?? [])
      .filter((u) => !n || [uname(u), u.email, u.phone, u.id].join(" ").toLowerCase().includes(n))
      .sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  }, [rows, q]);

  const ban = (u: D) => ask({
    title: u.banned ? `Unban ${uname(u)}?` : `Ban ${uname(u)}?`,
    body: u.banned ? "They will be able to post listings again." : "They will not be able to post new listings. Existing listings stay as they are.",
    label: u.banned ? "Unban" : "Ban user", danger: !u.banned,
    run: async () => { await updateDoc(doc(db, "users", u.id), { banned: !u.banned }); notify(u.banned ? "User unbanned" : "User banned"); },
  });
  const wipe = (u: D) => ask({
    title: `Delete all listings of ${uname(u)}?`, body: "Permanently removes every listing posted by this user. Use for spam accounts.",
    label: "Delete listings", danger: true, run: () => purge(u.id),
  });

  return (
    <div className="space-y-3">
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className={`${input} w-full pl-9`} />
      </label>
      <div className={card}>
        <p className="border-b border-[#14213D]/10 px-4 py-2 text-xs text-[#14213D]/55 dark:border-white/10 dark:text-white/55">{rows === null ? "Loading…" : `${shown.length} user${shown.length === 1 ? "" : "s"}`}</p>
        <div className="divide-y divide-[#14213D]/10 dark:divide-white/10">
          {shown.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#14213D] text-xs font-bold text-white dark:bg-white dark:text-[#14213D]">{initials(uname(u))}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">{uname(u)}
                  {u.banned && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-600">Banned</span>}
                </p>
                <p className="truncate text-xs text-[#14213D]/60 dark:text-white/60">{[u.email, u.phone].filter(Boolean).join(" · ") || u.id} · joined {ago(u.createdAt)}</p>
              </div>
              <div className="ml-auto flex shrink-0 gap-1.5">
                <button className={B.ghost} onClick={() => viewListings(u.id)}><Package className="h-3.5 w-3.5" />Listings</button>
                <button className={u.banned ? B.ok : B.no} onClick={() => ban(u)}><Ban className="h-3.5 w-3.5" />{u.banned ? "Unban" : "Ban"}</button>
                <button className={B.ghost} onClick={() => wipe(u)} aria-label="Delete all listings of this user"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {rows !== null && shown.length === 0 && <p className="p-10 text-center text-sm text-[#14213D]/50">No users found.</p>}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- shell ------------------------------- */

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "listings", label: "Listings", Icon: Package },
  { id: "users", label: "Users", Icon: Users },
];

function Panel({ admin }: { admin: User }) {
  const [tab, setTab] = useState("dashboard");
  const [status, setStatus] = useState("pending");
  const [seller, setSeller] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [view, setView] = useState<D | null>(null);
  const [toast, setToast] = useState("");

  const bump = () => setTick((t) => t + 1);
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const go = (t: string, s?: string) => { setSeller(null); if (s) setStatus(s); setTab(t); };

  /** batched write on listings (400 per batch) */
  const run = async (ids: string[], fn: (b: WriteBatch, r: DocumentReference) => void, msg: string) => {
    try {
      for (let i = 0; i < ids.length; i += 400) {
        const b = writeBatch(db);
        ids.slice(i, i + 400).forEach((id) => fn(b, doc(db, "listings", id)));
        await b.commit();
      }
      notify(msg); bump();
    } catch (e) { console.error(e); notify("Action failed. Check Firestore rules / admin access."); }
  };
  const review = { reviewedAt: serverTimestamp(), reviewedBy: admin.uid };
  const s = (n: number) => `${n} listing${n === 1 ? "" : "s"}`;

  const act: Act = {
    approve: (ids) => run(ids, (b, r) => b.update(r, { status: "active", rejectReason: deleteField(), ...review }), `${s(ids.length)} approved`),
    reject: (ids) => setAsk({
      title: `Reject ${s(ids.length)}`, presets: REASONS, label: "Reject", danger: true,
      run: (v) => run(ids, (b, r) => b.update(r, { status: "rejected", rejectReason: v || "Not specified", ...review }), `${s(ids.length)} rejected`),
    }),
    remove: (ids) => setAsk({
      title: `Delete ${s(ids.length)}?`, body: "This permanently removes the listing(s). It cannot be undone.", label: "Delete", danger: true,
      run: () => run(ids, (b, r) => b.delete(r), `${s(ids.length)} deleted`),
    }),
    plan: (id, plan) => run([id], (b, r) => b.update(r, { plan, priority: PRIORITY[plan] ?? 0 }), `Plan set to ${plan}`).then(() => setView((v) => v && { ...v, plan })),
  };

  const purge = async (uid: string) => {
    const snap = await getDocs(query(collection(db, "listings"), where("sellerId", "==", uid)));
    await run(snap.docs.map((d) => d.id), (b, r) => b.delete(r), `${s(snap.size)} deleted`);
  };

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[220px_1fr]">
      {/* sidebar (desktop) */}
      <aside className="hidden border-r border-[#14213D]/10 bg-white p-4 dark:border-white/10 dark:bg-[#121821] lg:block">
        <p className="mb-5 px-2 text-lg font-bold">BikeBazar <span className="text-[#C4432B]">Admin</span></p>
        <nav className="space-y-1">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => go(id, id === "listings" ? "all" : undefined)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${tab === id ? "bg-[#C4432B] text-white" : "hover:bg-[#14213D]/5 dark:hover:bg-white/10"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#14213D]/10 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#121821]/90">
          <h1 className="text-base font-bold capitalize">{tab}</h1>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[180px] truncate text-xs text-[#14213D]/60 dark:text-white/60 sm:block">{admin.email}</span>
            <button className={B.ghost} onClick={bump} aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>
            <Link to="/" className={B.ghost}>Site</Link>
            <button className={B.ghost} onClick={() => signOut(getAuth())} aria-label="Sign out"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </header>

        <main className="p-4 pb-24 lg:p-6">
          {tab === "dashboard" && <Dashboard tick={tick} go={go} act={act} open={setView} />}
          {tab === "listings" && <Listings status={status} setStatus={setStatus} seller={seller} setSeller={setSeller} act={act} open={setView} tick={tick} />}
          {tab === "users" && <UsersTab viewListings={(uid) => { setSeller(uid); setStatus("all"); setTab("listings"); }} ask={setAsk} notify={notify} purge={purge} />}
        </main>
      </div>

      {/* bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-[#14213D]/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-[#121821]/95 lg:hidden">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => go(id, id === "listings" ? "all" : undefined)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${tab === id ? "text-[#C4432B]" : "text-[#14213D]/55 dark:text-white/55"}`}>
            <Icon className="h-5 w-5" />{label}
          </button>
        ))}
      </nav>

      {view && <DetailModal l={view} act={act} onClose={() => setView(null)} />}
      {ask && <AskModal ask={ask} onClose={() => setAsk(null)} />}
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[#14213D] px-4 py-2 text-sm font-medium text-white shadow-lg lg:bottom-6">{toast}</div>}
    </div>
  );
}

/* ----------------------------- access gate ----------------------------- */

export default function AdminPanel() {
  const [state, setState] = useState<"loading" | "out" | "denied" | "ok">("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(getAuth(), async (u) => {
    setUser(u);
    if (!u) return setState("out");
    try { setState((await getDoc(doc(db, "admins", u.uid))).exists() ? "ok" : "denied"); }
    catch { setState("denied"); }
  }), []);

  return (
    <div className="fixed inset-0 z-[60] overflow-auto bg-[#F4F6FA] text-[#14213D] dark:bg-[#0B0F14] dark:text-white">
      {state === "ok" && user ? <Panel admin={user} /> : (
        <div className="grid min-h-full place-items-center p-6 text-center">
          {state === "loading" ? <Loader2 className="h-6 w-6 animate-spin text-[#C4432B]" /> : (
            <div className={`${card} max-w-sm p-8`}>
              <ShieldAlert className="mx-auto h-10 w-10 text-[#C4432B]" />
              {state === "out" ? (
                <>
                  <h1 className="mt-3 text-lg font-bold">Admin sign in</h1>
                  <p className="mt-1 text-sm text-[#14213D]/60 dark:text-white/60">Sign in with your admin account to continue.</p>
                  <Link to="/login" className={`${B.danger} mt-5 h-10 px-6 text-sm`}>Sign in</Link>
                </>
              ) : (
                <>
                  <h1 className="mt-3 text-lg font-bold">Access denied</h1>
                  <p className="mt-1 text-sm text-[#14213D]/60 dark:text-white/60">{user?.email} is not an admin.</p>
                  <p className="mt-4 break-all rounded-lg bg-[#14213D]/5 p-2 text-[11px] dark:bg-white/10">UID: {user?.uid}</p>
                  <button className={`${B.ghost} mt-4`} onClick={() => signOut(getAuth())}>Sign out</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}