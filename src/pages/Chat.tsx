// Save as: src/pages/Chat.tsx
// Firebase-only chat: Firestore onSnapshot = realtime. No Express / Socket.io needed.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase.config";

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface ChatRoom {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  sellerId: string;
  participants: string[];
  names: Record<string, string>;
  photos: Record<string, string | null>;
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: Record<string, number>;
}

const toMs = (t: any) => (t?.toMillis ? t.toMillis() : Date.now());

export default function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("chat"));
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // 1) Mere saare chats (realtime)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatRoom, "id">) }));
        list.sort((a, b) => toMs(b.lastMessageTime) - toMs(a.lastMessageTime)); // client-side sort => index nahi chahiye
        setRooms(list);
        setLoading(false);
        const total = list.reduce((s, r) => s + (r.unread?.[user.uid] || 0), 0);
        localStorage.setItem("unreadChatsCount", String(total));
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  // 2) Selected chat ke messages (realtime)
  useEffect(() => {
    if (!selectedId) return setMessages([]);
    const q = query(collection(db, "chats", selectedId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })));
    });
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedId), [rooms, selectedId]);

  // 3) Chat khula hai to unread 0 kar do
  useEffect(() => {
    if (!user || !selectedRoom) return;
    if ((selectedRoom.unread?.[user.uid] || 0) > 0) {
      updateDoc(doc(db, "chats", selectedRoom.id), { [`unread.${user.uid}`]: 0 }).catch(console.error);
    }
  }, [user, selectedRoom]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedRoom || !user) return;
    const otherId = selectedRoom.participants.find((p) => p !== user.uid)!;
    setMessageText("");

    try {
      const batch = writeBatch(db);
      const msgRef = doc(collection(db, "chats", selectedRoom.id, "messages"));
      batch.set(msgRef, { senderId: user.uid, text, createdAt: serverTimestamp() });
      batch.update(doc(db, "chats", selectedRoom.id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        [`unread.${otherId}`]: increment(1),
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
      setMessageText(text); // fail hua to text wapas
    }
  };

  if (!user) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-[#14213D] dark:text-white">Sign in to chat</h1>
        <p className="mt-2 text-muted-foreground">You need to be logged in to message sellers and buyers.</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-[#C4432B] px-6 py-2.5 text-white hover:bg-[#C4432B]/90">
          Sign in
        </Link>
      </div>
    );
  }

  const filteredRooms = rooms.filter((r) => (activeTab === "buying" ? r.buyerId === user.uid : r.sellerId === user.uid));
  const otherOf = (r: ChatRoom) => r.participants.find((p) => p !== user.uid) || "";

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-[#0B0F14]">
      <div className="border-b border-[#14213D]/10 dark:border-white/10">
        <div className="container flex items-center gap-3 py-4">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#14213D]/15 hover:bg-[#14213D]/5 dark:border-white/15 dark:hover:bg-white/5">
            <ArrowLeft className="h-4 w-4 text-[#14213D] dark:text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#14213D] dark:text-white">Messages</h1>
            <p className="text-xs text-muted-foreground">{activeTab === "buying" ? "Chats with sellers" : "Chats with buyers"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`flex w-full flex-col border-r border-[#14213D]/10 dark:border-white/10 sm:max-w-sm ${selectedId ? "hidden sm:flex" : "flex"}`}>
          <div className="flex border-b border-[#14213D]/10 dark:border-white/10">
            {(["buying", "selling"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedId(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab ? "border-b-2 border-[#C4432B] text-[#C4432B]" : "text-muted-foreground hover:text-[#14213D] dark:hover:text-white"
                }`}
              >
                {tab === "buying" ? "Buying" : "Selling"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#C4432B]" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No {activeTab} conversations yet</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const otherId = otherOf(room);
                const name = room.names?.[otherId] || "User";
                const photo = room.photos?.[otherId];
                const unread = room.unread?.[user.uid] || 0;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedId(room.id)}
                    className={`w-full border-b border-[#14213D]/10 px-4 py-3 text-left transition hover:bg-[#14213D]/5 dark:border-white/10 dark:hover:bg-white/5 ${
                      selectedId === room.id ? "bg-[#14213D]/5 dark:bg-white/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {photo ? (
                        <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#14213D] text-xs font-bold text-white">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#14213D] dark:text-white">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{room.listingTitle}</p>
                        <p className="truncate text-xs text-muted-foreground">{room.lastMessage}</p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4432B] px-1 text-xs font-bold text-white">{unread}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        {selectedId && selectedRoom ? (
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-[#14213D]/10 px-4 py-4 dark:border-white/10">
              <div>
                <p className="font-semibold text-[#14213D] dark:text-white">{selectedRoom.names?.[otherOf(selectedRoom)] || "User"}</p>
                <p className="text-xs text-muted-foreground">{selectedRoom.listingTitle}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="rounded-lg p-2 hover:bg-[#14213D]/5 dark:hover:bg-white/5 sm:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg) => {
                const mine = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-lg px-4 py-2 ${mine ? "bg-[#C4432B] text-white" : "bg-[#14213D]/10 text-[#14213D] dark:bg-white/10 dark:text-white"}`}>
                      <p className="break-words text-sm">{msg.text}</p>
                      <p className={`mt-1 text-xs ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                        {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "…"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-[#14213D]/10 p-4 dark:border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-[#14213D]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#C4432B] focus:ring-2 focus:ring-[#C4432B]/20 dark:border-white/15 dark:bg-[#1c2430] dark:text-white"
                />
                <button type="submit" disabled={!messageText.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C4432B] text-white hover:bg-[#C4432B]/90 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}