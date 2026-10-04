import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const dummySellers = [
  { sellerId: "seed_user_1", sellerName: "Rohit Sharma", sellerPhoto: "https://i.pravatar.cc/150?img=12", sellerPhone: "9876543210", verified: true },
  { sellerId: "seed_user_2", sellerName: "Priya Verma", sellerPhoto: "https://i.pravatar.cc/150?img=25", sellerPhone: "9123456780", verified: false },
  { sellerId: "seed_user_3", sellerName: "Amit Singh", sellerPhoto: "https://i.pravatar.cc/150?img=33", sellerPhone: "9988776655", verified: true },
];

const dummyListings = [
  {
    title: "Royal Enfield Classic 350, 2021",
    description: "Well maintained, single owner, all papers clear.",
    price: 1380,
    category: "Cars",
    condition: "Used",
    images: ["https://picsum.photos/seed/re350/500/375", "https://picsum.photos/seed/re350b/500/375"],
    location: { city: "Kanpur", state: "Uttar Pradesh" },
    status: "active",
    plan: "premium",
    priority: 10,
    negotiable: true,
  },
  {
    title: "iPhone 13, 128GB, Midnight",
    description: "6 months old, box and charger included.",
    price: 385,
    category: "Mobiles",
    condition: "Used",
    images: ["https://picsum.photos/seed/iphone13/500/375"],
    location: { city: "Kanpur", state: "Uttar Pradesh" },
    status: "active",
    plan: "featured",
    priority: 5,
    negotiable: true,
  },
  {
    title: "5-Seater Fabric Sofa Set",
    description: "Barely used, no tears or stains.",
    price: 102,
    category: "Furniture",
    condition: "Used",
    images: ["https://picsum.photos/seed/sofa1/500/375"],
    location: { city: "Lucknow", state: "Uttar Pradesh" },
    status: "active",
    plan: "free",
    priority: 0,
    negotiable: false,
  },
  {
    title: "Sony WH-1000XM4 Headphones",
    description: "Brand new, sealed box.",
    price: 145,
    category: "Electronics",
    condition: "New",
    images: ["https://picsum.photos/seed/sonywh/500/375"],
    location: { city: "Delhi", state: "Delhi" },
    status: "active",
    plan: "featured",
    priority: 5,
    negotiable: false,
  },
  {
    title: "2 BHK Apartment for Rent",
    description: "Near market, 2nd floor, parking available.",
    price: 210,
    category: "Property",
    condition: "Used",
    images: ["https://picsum.photos/seed/apartment1/500/375"],
    location: { city: "Kanpur", state: "Uttar Pradesh" },
    status: "active",
    plan: "free",
    priority: 0,
    negotiable: true,
  },
  {
    title: "MacBook Air M1, 8/256GB",
    description: "Excellent battery health, minor scratches.",
    price: 640,
    category: "Electronics",
    condition: "Used",
    images: ["https://picsum.photos/seed/macair1/500/375"],
    location: { city: "Mumbai", state: "Maharashtra" },
    status: "active",
    plan: "premium",
    priority: 10,
    negotiable: true,
  },
  {
    title: "Leather Jacket, Size M",
    description: "New with tags.",
    price: 38,
    category: "Fashion",
    condition: "New",
    images: ["https://picsum.photos/seed/jacket1/500/375"],
    location: { city: "Kanpur", state: "Uttar Pradesh" },
    status: "active",
    plan: "free",
    priority: 0,
    negotiable: false,
  },
  {
    title: "Study Table with Chair",
    description: "Sturdy wood, good condition.",
    price: 28,
    category: "Furniture",
    condition: "Used",
    images: ["https://picsum.photos/seed/table1/500/375"],
    location: { city: "Lucknow", state: "Uttar Pradesh" },
    status: "sold",
    plan: "free",
    priority: 0,
    negotiable: false,
  },
];

async function seed() {
  for (let i = 0; i < dummyListings.length; i++) {
    const listing = dummyListings[i];
    const seller = dummySellers[i % dummySellers.length];

    await db.collection("listings").add({
      ...listing,
      ...seller,
      views: Math.floor(Math.random() * 200),
      favoritesCount: Math.floor(Math.random() * 30),
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    });

    console.log(`✅ Added: ${listing.title}`);
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});