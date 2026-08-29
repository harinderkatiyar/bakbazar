import { useState } from "react";
import { Heart, MapPin, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  postedAgo: string;
  category: string;
  condition: "New" | "Used";
  gradient: string;
}

const categories = ["All", "Cars", "Mobiles", "Electronics", "Furniture", "Property", "Fashion"];

const listings: Listing[] = [
  {
    id: "1",
    title: "Royal Enfield Classic 350, 2021",
    price: "$1,380",
    location: "Kanpur",
    postedAgo: "2 hours ago",
    category: "Cars",
    condition: "Used",
    gradient: "from-[#0F5257]/20 to-[#E9A319]/25",
  },
  {
    id: "2",
    title: "iPhone 13, 128GB, Midnight",
    price: "$385",
    location: "Kanpur",
    postedAgo: "5 hours ago",
    category: "Mobiles",
    condition: "Used",
    gradient: "from-[#C4432B]/15 to-[#0F5257]/20",
  },
  {
    id: "3",
    title: "5-Seater Fabric Sofa Set",
    price: "$102",
    location: "Lucknow",
    postedAgo: "1 day ago",
    category: "Furniture",
    condition: "Used",
    gradient: "from-[#E9A319]/20 to-[#C4432B]/15",
  },
  {
    id: "4",
    title: "Sony WH-1000XM4 Headphones",
    price: "$145",
    location: "Delhi",
    postedAgo: "3 hours ago",
    category: "Electronics",
    condition: "New",
    gradient: "from-[#0F5257]/25 to-[#14213D]/10",
  },
  {
    id: "5",
    title: "2 BHK Apartment for Rent",
    price: "$210/mo",
    location: "Kanpur",
    postedAgo: "6 hours ago",
    category: "Property",
    condition: "Used",
    gradient: "from-[#14213D]/10 to-[#E9A319]/20",
  },
  {
    id: "6",
    title: "MacBook Air M1, 8/256GB",
    price: "$640",
    location: "Mumbai",
    postedAgo: "1 day ago",
    category: "Electronics",
    condition: "Used",
    gradient: "from-[#C4432B]/15 to-[#0F5257]/15",
  },
  {
    id: "7",
    title: "Leather Jacket, Size M",
    price: "$38",
    location: "Kanpur",
    postedAgo: "8 hours ago",
    category: "Fashion",
    condition: "New",
    gradient: "from-[#E9A319]/20 to-[#14213D]/10",
  },
  {
    id: "8",
    title: "Study Table with Chair",
    price: "$28",
    location: "Lucknow",
    postedAgo: "12 hours ago",
    category: "Furniture",
    condition: "Used",
    gradient: "from-[#0F5257]/15 to-[#C4432B]/10",
  },
];

const ListingCard = ({ listing }: { listing: Listing }) => {
  const [saved, setSaved] = useState(false);

  return (
    <Card className="overflow-hidden border-[#14213D]/10 dark:border-white/10 py-0 gap-0 transition-shadow hover:shadow-lg">
      <div className={`relative h-40 w-full bg-gradient-to-br ${listing.gradient}`}>
        <button
          onClick={() => setSaved((v) => !v)}
          aria-label="Save listing"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#14213D] shadow-sm hover:bg-white dark:bg-black/40 dark:text-white"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-[#C4432B] text-[#C4432B]" : ""}`} />
        </button>
        <Badge className="absolute left-2 top-2 bg-white/90 text-[#14213D] hover:bg-white/90 dark:bg-black/40 dark:text-white">
          {listing.condition}
        </Badge>
      </div>

      <CardContent className="p-3 pb-1">
        <p className="text-base font-bold text-[#C4432B]">{listing.price}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-[#14213D] dark:text-white">
          {listing.title}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-3 pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {listing.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {listing.postedAgo}
        </span>
      </CardFooter>
    </Card>
  );
};

export const Features = () => {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? listings : listings.filter((l) => l.category === active);

  return (
    <section id="features" className="container py-0 sm:py-0 space-y-8">
     
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active === cat
                ? "border-[#C4432B] bg-[#C4432B] text-white"
                : "border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 dark:text-white dark:border-white/15 dark:hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
};