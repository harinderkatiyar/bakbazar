// Save as: src/pages/MyAds.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Loader2, Trash2, Edit2, MapPin, AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase.config";
import { useAuth } from "@/context/AuthContext";
import { formatPrice, type Listing } from "@/components/cardListing/Listing";

export default function MyAds() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAds = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Query all ads where sellerId matches current user
        const q = query(collection(db, "listings"), where("sellerId", "==", user.uid));
        const snapshot = await getDocs(q);
        const ads = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Listing));

        // Sort by newest first, pending first
        ads.sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "pending" ? -1 : 1; // pending comes first
          }
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime; // newer first
        });

        setListings(ads);
      } catch (err) {
        console.error("Error loading ads:", err);
        setError("Could not load your ads. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAds();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    setDeleting(id);
    try {
      await deleteDoc(doc(db, "listings", id));
      setListings((prev) => prev.filter((ad) => ad.id !== id));
    } catch (err) {
      console.error("Error deleting ad:", err);
      setError("Could not delete the ad. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-[#14213D] dark:text-white">Sign in to see your ads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be logged in to view and manage your listings.
        </p>
        <Link
          to="/sign-in"
          className="mt-4 inline-block rounded-full bg-[#C4432B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C4432B]/90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#C4432B]" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-[#14213D] dark:text-white">No ads yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven't posted any ads. Get started by posting your first ad.
        </p>
        <Link
          to="/sell"
          className="mt-4 inline-block rounded-full bg-[#C4432B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C4432B]/90"
        >
          Post an ad
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#14213D] dark:text-white">My ads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your listings here</p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-[#C4432B]/10 p-4 text-sm font-medium text-[#C4432B]">
          {error}
        </div>
      )}

      {/* Pending ads section */}
      {listings.some((ad) => ad.status === "pending") && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#14213D] dark:text-white">
            <AlertCircle className="h-5 w-5 text-[#E9A319]" />
            Under Review ({listings.filter((ad) => ad.status === "pending").length})
          </h2>
          <div className="space-y-3 rounded-xl border border-[#E9A319]/30 bg-[#E9A319]/5 p-4">
            <p className="text-sm text-muted-foreground">
              Your ads are being reviewed by our team. They'll go live once approved.
            </p>
            <div className="grid gap-4">
              {listings
                .filter((ad) => ad.status === "pending")
                .map((ad) => (
                  <AdCard key={ad.id} ad={ad} onDelete={handleDelete} deleting={deleting} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Active ads section */}
      {listings.some((ad) => ad.status === "active") && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#14213D] dark:text-white">
            Live ({listings.filter((ad) => ad.status === "active").length})
          </h2>
          <div className="grid gap-4">
            {listings
              .filter((ad) => ad.status === "active")
              .map((ad) => (
                <AdCard key={ad.id} ad={ad} onDelete={handleDelete} deleting={deleting} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AdCard({
  ad,
  onDelete,
  deleting,
}: {
  ad: Listing;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-[#14213D]/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
      {/* Cover image */}
      <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-[#14213D]/10 dark:border-white/10 sm:h-28 sm:w-40">
        {ad.images?.[0] ? (
          <img src={ad.images[0]} alt={ad.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-[#14213D]/5 dark:bg-white/5">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#14213D] dark:text-white">{ad.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{ad.category}</p>
             
            </div>
            {ad.status === "pending" && (
              <span className="rounded-full bg-[#E9A319]/20 px-2.5 py-0.5 text-xs font-medium text-[#B67A00]">
                Pending
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {ad.location?.city}
            {ad.location?.state && `, ${ad.location.state}`}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-[#C4432B]">{formatPrice(ad.price)}</p>
          <div className="flex gap-2">
            <Link
              to={`/edit-listing/${ad.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#14213D]/15 px-3 text-sm font-medium text-[#14213D] hover:bg-[#14213D]/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
            >
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <button
              onClick={() => onDelete(ad.id)}
              disabled={deleting === ad.id}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#C4432B]/30 px-3 text-sm font-medium text-[#C4432B] hover:bg-[#C4432B]/10 disabled:opacity-60 dark:border-[#C4432B]/20"
            >
              {deleting === ad.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}