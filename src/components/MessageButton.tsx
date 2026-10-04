import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ensureChat } from "../lib/Chat";

interface MessageButtonProps {
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string | null;
  listingId: string;
  listingTitle: string;
  className?: string;
}

export function MessageButton({
  sellerId,
  sellerName,
  sellerPhoto = null,
  listingId,
  listingTitle,
  className = "",
}: MessageButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleChat = async () => {
    if (!user) return navigate("/login");
    if (user.uid === sellerId) return alert("This is your own listing.");

    setBusy(true);
    try {
      const chatId = await ensureChat(user, { sellerId, sellerName, sellerPhoto, listingId, listingTitle });
      navigate(`/chats?chat=${chatId}`);
    } catch (err) {
      console.error(err);
      alert("Could not start the chat. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleChat}
      disabled={busy}
      className={`flex items-center justify-center gap-2 rounded-lg border border-[#14213D]/20 bg-white px-4 py-3 text-sm font-semibold text-[#14213D] transition hover:bg-[#14213D]/5 disabled:opacity-60 dark:border-white/15 dark:bg-[#1c2430] dark:text-white dark:hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-[#C4432B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121821] ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Chat now
    </button>
  );
}