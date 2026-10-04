// Save as: src/components/MakeOfferButton.tsx
import { useEffect, useRef, useState } from "react";
import { BadgeIndianRupee, CheckCircle2, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ensureChat, formatINR, sendOffer } from "../lib/Chat";

interface MakeOfferButtonProps {
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string | null;
  listingId: string;
  listingTitle: string;
  price: number; // asking price
  className?: string;
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#C4432B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121821]";

export function MakeOfferButton({
  sellerId,
  sellerName,
  sellerPhoto = null,
  listingId,
  listingTitle,
  price,
  className = "",
}: MakeOfferButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ chatId: string; amount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    if (!user) return navigate("/login");
    if (user.uid === sellerId) return alert("You can't make an offer on your own listing.");
    setAmount("");
    setError("");
    setSent(null);
    setOpen(true);
  };

  const close = () => !busy && setOpen(false);

  // Escape to close, lock page scroll, focus the input
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy]);

  // quick-pick suggestions below the asking price
  const roundTo = price >= 5000 ? 100 : 10;
  const suggestions = [5, 10, 15].map((pct) => ({
    pct,
    value: Math.max(1, Math.round((price * (1 - pct / 100)) / roundTo) * roundTo),
  }));

  const value = Number(amount);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount greater than ₹0.");
    if (value > price) return setError(`Your offer should not be higher than the asking price (${formatINR(price)}).`);

    setBusy(true);
    setError("");
    try {
      const chatId = await ensureChat(user, { sellerId, sellerName, sellerPhoto, listingId, listingTitle });
      await sendOffer(chatId, user.uid, sellerId, Math.round(value));
      setSent({ chatId, amount: Math.round(value) });
    } catch (err) {
      console.error(err);
      setError("Could not send your offer. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`flex items-center justify-center gap-2 rounded-lg bg-[#C4432B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#C4432B]/90 ${focusRing} ${className}`}
      >
        <BadgeIndianRupee className="h-4 w-4" />
        Make offer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B0F14]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="w-full max-w-md rounded-t-3xl border border-[#14213D]/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121821] sm:rounded-3xl"
          >
            {sent ? (
              <div className="py-2 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </span>
                <h2 id="offer-title" className="mt-4 text-lg font-bold text-[#14213D] dark:text-white">
                  Offer sent
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your offer of <span className="font-semibold text-[#14213D] dark:text-white">{formatINR(sent.amount)}</span>{" "}
                  was sent to {sellerName}. You'll see their reply in Messages.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={`rounded-lg border border-[#14213D]/20 px-4 py-3 text-sm font-semibold text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5 ${focusRing}`}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/chats?chat=${sent.chatId}`)}
                    className={`rounded-lg bg-[#C4432B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#C4432B]/90 ${focusRing}`}
                  >
                    Open chat
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="offer-title" className="text-lg font-bold text-[#14213D] dark:text-white">
                      Make an offer
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{listingTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#14213D]/60 hover:bg-[#14213D]/5 dark:text-white/60 dark:hover:bg-white/10 ${focusRing}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#14213D]/[0.05] px-4 py-3 dark:bg-white/[0.07]">
                  <span className="text-sm text-muted-foreground">Asking price</span>
                  <span className="text-base font-bold tabular-nums text-[#14213D] dark:text-white">{formatINR(price)}</span>
                </div>

                <label htmlFor="offer-amount" className="mt-5 block text-sm font-semibold text-[#14213D] dark:text-white">
                  Your offer
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#14213D]/50 dark:text-white/50">
                    ₹
                  </span>
                  <input
                    id="offer-amount"
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter amount"
                    aria-invalid={!!error}
                    aria-describedby={error ? "offer-error" : undefined}
                    className="h-14 w-full rounded-2xl border border-transparent bg-[#14213D]/[0.06] pl-9 pr-4 text-xl font-semibold tabular-nums text-[#14213D] outline-none transition placeholder:text-base placeholder:font-normal placeholder:text-[#14213D]/40 focus:border-[#C4432B] focus:bg-white focus:ring-2 focus:ring-[#C4432B]/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-[#1c2430]"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.pct}
                      type="button"
                      onClick={() => {
                        setAmount(String(s.value));
                        setError("");
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums transition ${focusRing} ${
                        Number(amount) === s.value
                          ? "border-[#14213D] bg-[#14213D] text-white dark:border-white dark:bg-white dark:text-[#14213D]"
                          : "border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
                      }`}
                    >
                      {formatINR(s.value)}
                      <span className="ml-1.5 text-xs opacity-60">−{s.pct}%</span>
                    </button>
                  ))}
                </div>

                <p id="offer-error" role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm text-[#C4432B]">
                  {error}
                </p>

                <button
                  type="submit"
                  disabled={busy || !amount}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C4432B] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C4432B]/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Sending…" : amount && value > 0 ? `Send offer of ${formatINR(value)}` : "Send offer"}
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  The seller gets your offer in Messages and can reply there.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}