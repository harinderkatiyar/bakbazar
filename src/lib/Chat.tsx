import { collection, doc, increment, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase.config";

interface ChatUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface ChatTarget {
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string | null;
  listingId: string;
  listingTitle: string;
}

/** One listing + one buyer = one chat (deterministic id). */
export const chatIdFor = (listingId: string, buyerId: string) => `${listingId}_${buyerId}`;

/** Creates the chat doc if missing (merge keeps lastMessage / unread intact if it exists). */
export async function ensureChat(user: ChatUser, t: ChatTarget): Promise<string> {
  const chatId = chatIdFor(t.listingId, user.uid);
  await setDoc(
    doc(db, "chats", chatId),
    {
      listingId: t.listingId,
      listingTitle: t.listingTitle,
      buyerId: user.uid,
      sellerId: t.sellerId,
      participants: [user.uid, t.sellerId],
      names: { [user.uid]: user.displayName || "User", [t.sellerId]: t.sellerName },
      photos: { [user.uid]: user.photoURL || null, [t.sellerId]: t.sellerPhoto ?? null },
    },
    { merge: true }
  );
  return chatId;
}

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Sends the offer as a special chat message, so the seller sees it in Messages instantly. */
export async function sendOffer(chatId: string, senderId: string, receiverId: string, amount: number) {
  const batch = writeBatch(db);
  const msgRef = doc(collection(db, "chats", chatId, "messages"));
  batch.set(msgRef, {
    senderId,
    type: "offer",
    amount,
    text: `Offer: ${formatINR(amount)}`,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "chats", chatId), {
    lastMessage: `Offer: ${formatINR(amount)}`,
    lastMessageTime: serverTimestamp(),
    [`unread.${receiverId}`]: increment(1),
  });
  await batch.commit();
}