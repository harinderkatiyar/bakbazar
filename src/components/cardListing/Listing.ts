export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: {
    city: string;
    state?: string;
    locality?: string; // e.g. "Hanuman Nagar, Purdilnagar"
    lat?: number;
    lng?: number;
  };
  category: string;
  brand?: string;
  condition: "New" | "Used";
  images: string[];
  status: "active" | "sold" | "pending" | "expired";
  plan: "free" | "featured" | "premium";
  priority: number;
  createdAt: any;
  details?: Record<string, string>; // any extra rows, e.g. { Storage: "128 GB" }
  sellerType?: "owner" | "dealer";
  sellerName?: string;
  sellerPhone?: string;
  sellerSince?: any; // Firestore Timestamp
  sellerListingCount?: number;
    sellerId?: string;
}

export const PLACEHOLDER = "https://picsum.photos/seed/placeholder/400/300";

export const formatPrice = (price: number) => `₹ ${Number(price).toLocaleString("en-IN")}`;

export const timeAgo = (timestamp: any) => {
  if (!timestamp?.toDate) return "";
  const diffMs = Date.now() - timestamp.toDate().getTime();
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export const formatMonthYear = (timestamp: any) =>
  timestamp?.toDate
    ? timestamp.toDate().toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";