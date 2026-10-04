// Save as: src/lib/categories.ts
// One source of truth. Use it in the navbar menu, the Sell form, the homepage chips and the search filter.
import {
  Armchair,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Shirt,
  Smartphone,
  Truck,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface SubCategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
  icon: LucideIcon;
  tint: string; // Tailwind classes for the icon tile
  subs: SubCategory[];
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const tints = [
  "bg-[#C4432B]/10 text-[#C4432B]",
  "bg-[#14213D]/10 text-[#14213D] dark:bg-white/10 dark:text-white",
  "bg-[#E9A319]/15 text-[#B67A00] dark:text-[#E9A319]",
  "bg-[#2F7D6D]/10 text-[#2F7D6D]",
  "bg-[#5B5BD6]/10 text-[#5B5BD6]",
];

const make = (index: number, name: string, icon: LucideIcon, subs: string[] = []): Category => ({
  name,
  slug: slugify(name),
  icon,
  tint: tints[index % tints.length],
  subs: subs.map((s) => ({ name: s, slug: slugify(s) })),
});

export const categories: Category[] = [
  make(0, "Mobiles", Smartphone, ["Mobile Phones", "Accessories", "Tablets"]),
  make(1, "Cars", Car),
  make(2, "Bikes", Bike, ["Motorcycles", "Scooters", "Bike Spare Parts", "Bicycles"]),
  make(3, "Property", Building2, [
    "Houses & Flats for Sale",
    "Houses & Flats for Rent",
    "Plots & Land",
    "New Projects",
    "Shops & Offices for Sale",
    "Shops & Offices for Rent",
    "PG & Guest Houses",
  ]),
  make(4, "Electronics & Appliances", Tv, [
    "TVs & Audio",
    "Kitchen Appliances",
    "Computers & Laptops",
    "Cameras & Lenses",
    "Gaming",
    "Fridges",
    "Computer Accessories",
    "Printers, Monitors & Drives",
    "Air Conditioners",
    "Washing Machines",
  ]),
  make(0, "Furniture", Armchair, [
    "Sofas & Dining",
    "Beds & Wardrobes",
    "Home Decor & Garden",
    "Kids Furniture",
    "Other Household Items",
  ]),
  make(1, "Fashion", Shirt, ["Men", "Women", "Kids"]),
  make(2, "Jobs", Briefcase, [
    "Data Entry & Back Office",
    "Sales & Marketing",
    "Call Centre & Telecaller",
    "Driver",
    "Office Assistant",
    "Delivery & Collection",
    "Teacher",
    "Cook",
    "Reception & Front Desk",
    "Operator & Technician",
    "IT & Software",
    "Hotel & Travel",
    "Accountant",
    "Warehouse Staff",
    "Designer",
    "Security Guard",
    "Other Jobs",
  ]),
  make(3, "Services", Wrench, [
    "Education & Classes",
    "Tours & Travel",
    "Electronics Repair",
    "Health & Beauty",
    "Home Repair & Renovation",
    "Cleaning & Pest Control",
    "Legal & Documentation",
    "Packers & Movers",
    "Other Services",
  ]),
  make(0, "Books, Sports & Hobbies", BookOpen, [
    "Books",
    "Gym & Fitness",
    "Musical Instruments",
    "Sports Equipment",
    "Other Hobbies",
  ]),
  make(1, "Commercial Vehicles", Truck, ["Commercial Vehicles", "Vehicle Spare Parts"]),
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);