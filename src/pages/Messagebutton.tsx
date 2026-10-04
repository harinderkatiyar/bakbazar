// Save as: src/components/MessageButton.tsx
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase.config";

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

  const handleMessage = async () => {
    if (!user) return navigate("/login");
    if (user.uid === sellerId) return alert("You can't message yourself!");

    // Ek listing + ek buyer = ek hi chat (deterministic id)
    const chatId = `${listingId}_${user.uid}`;

    try {
      await setDoc(
        doc(db, "chats", chatId),
        {
          listingId,
          listingTitle,
          buyerId: user.uid,
          sellerId,
          participants: [user.uid, sellerId],
          names: { [user.uid]: user.displayName || "User", [sellerId]: sellerName },
          photos: { [user.uid]: user.photoURL || null, [sellerId]: sellerPhoto },
        },
        { merge: true } // chat pehle se hai to lastMessage/unread overwrite nahi hoga
      );
      navigate(`/chats?chat=${chatId}`);
    } catch (err) {
      console.error(err);
      alert("Chat start nahi ho paya, dobara try karo.");
    }
  };

  return (
    <button
      onClick={handleMessage}
      className={`flex items-center justify-center gap-2 rounded-lg border border-[#14213D]/20 bg-white px-4 py-3 font-medium text-[#14213D] transition hover:bg-[#14213D]/5 dark:border-white/15 dark:bg-[#1c2430] dark:text-white dark:hover:bg-white/5 ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      Message Seller
    </button>
  );
}