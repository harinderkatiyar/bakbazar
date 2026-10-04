import { getFilterConfig } from "../components/filter/Filters";

export type SellFieldType = "select" | "text" | "number";
export interface SellField {
  key: string; // saved in listing.details[key]
  label: string;
  type: SellFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

export interface SellConfig {
  fields: SellField[];
  titleExample: string;
  descriptionExample: string;
  priceLabel: string;
  askCondition: boolean;
  askSellerType: boolean;
  tips: string[];
}

/* ------------------------------ helpers ------------------------------ */

const text = (key: string, label: string, placeholder = "", required = true): SellField => ({
  key,
  label,
  type: "text",
  placeholder,
  required,
});

const num = (
  key: string,
  label: string,
  placeholder = "",
  o: { suffix?: string; required?: boolean; min?: number; max?: number } = {}
): SellField => ({
  key,
  label,
  type: "number",
  placeholder,
  required: o.required ?? true,
  suffix: o.suffix,
  min: o.min ?? 0,
  max: o.max,
});

const pick = (key: string, options: string[], label = key, required = true): SellField => ({
  key,
  label,
  type: "select",
  options,
  required,
});

const THIS_YEAR = new Date().getFullYear();
const MODEL = text("Model", "Model / variant", "e.g. Swift VXi");
const YEAR = num("Year", "Year of manufacture", "e.g. 2019", { min: 1980, max: THIS_YEAR + 1 });
const KMS = num("KMs driven", "KMs driven", "e.g. 42000", { suffix: "km", max: 999999 });
const WARRANTY = pick("Warranty", ["In warranty", "Out of warranty"], "Warranty", false);
const OWNERS = pick("Owners", ["1st", "2nd", "3rd+"], "Owner number");
const AREA = num("Area", "Area", "e.g. 950", { suffix: "sq ft", min: 1 });
const STAR = pick("Star rating", ["1", "2", "3", "4", "5"], "Star rating", false);

/* ------------------------------- config ------------------------------- */

interface Entry {
  extra?: SellField[];
  titleExample?: string;
  descriptionExample?: string;
  priceLabel?: string;
  tips?: string[];
  noFilterFields?: boolean; // skip the Brand/Fuel/... fields that come from filters.ts
}

const CONFIG: Record<string, Entry & { subs?: Record<string, Entry> }> = {
  mobiles: {
    titleExample: "iPhone 13, 128 GB, Midnight",
    descriptionExample:
      "iPhone 13, 128 GB in Midnight, 14 months old with 90% battery health. Original bill and box are available, no scratches and never repaired. Charger included.",
    extra: [MODEL, WARRANTY, pick("Box and bill", ["Box and bill", "Bill only", "Box only", "None"], "Box and bill", false)],
    tips: ["Add the model name and storage", "Mention battery health and any scratches", "Say if the bill, box and charger are included"],
    subs: {
      tablets: {
        titleExample: "Samsung Galaxy Tab S7, 128 GB, Wi-Fi",
        descriptionExample:
          "Samsung Galaxy Tab S7, 128 GB Wi-Fi model, 2 years old and working perfectly. Comes with the original charger and a cover. Screen is clean with no cracks.",
        extra: [MODEL, WARRANTY],
      },
      accessories: {
        titleExample: "Original Apple 20W fast charger",
        descriptionExample:
          "Original Apple 20W fast charger with a Type-C cable, bought 6 months ago. Works perfectly and the bill is available. Selling because I switched phones.",
        extra: [text("Item", "Accessory type", "e.g. Charger, Case, Earbuds")],
      },
    },
  },

  cars: {
    titleExample: "2019 Maruti Swift VXi, Petrol, 1st owner",
    descriptionExample:
      "2019 Maruti Swift VXi, petrol with a CNG kit, 1st owner and 42,000 km driven. Single-hand use with all service records, insurance valid till March 2027. New tyres, no accidents or repainting.",
    extra: [MODEL, YEAR, KMS, pick("Insurance", ["Comprehensive", "Third party", "Expired"], "Insurance", false)],
    tips: [
      "Mention the fuel type: petrol, diesel or CNG",
      "Say which owner you are and the exact km driven",
      "Add insurance validity and service history",
      "Be honest about accidents or repainting",
    ],
  },

  bikes: {
    titleExample: "Royal Enfield Classic 350, 2021, 1st owner",
    descriptionExample:
      "Royal Enfield Classic 350, 2021 model, 1st owner with 18,000 km driven. Regular service at the authorised centre, all papers clear and insurance active. Only a minor scratch on the tank.",
    extra: [MODEL, YEAR, KMS, pick("Fuel", ["Petrol", "Electric"])],
    tips: ["Mention the owner number and km driven", "Say if RC, insurance and PUC are valid", "Add any modifications or repairs"],
    subs: {
      bicycles: {
        titleExample: "Hero Sprint 21-speed mountain bike",
        descriptionExample:
          "Hero Sprint 21-speed mountain bike, used for one year and in good condition. Gears and brakes work smoothly and the tyres are new. Suitable for ages 12 and above.",
        extra: [pick("Type", ["Road", "Mountain", "City", "Kids", "Electric", "Other"], "Bicycle type"), text("Gears", "Gears", "e.g. 21-speed", false)],
      },
      "bike-spare-parts": {
        titleExample: "Front disc brake set for Royal Enfield Classic 350",
        descriptionExample:
          "Front disc brake set for Royal Enfield Classic 350, used for only 2,000 km. Fully working, no cracks or wear. Selling because I changed the bike.",
        extra: [text("Part", "Part name", "e.g. Front disc brake"), text("Fits", "Fits models", "e.g. Royal Enfield Classic 350")],
      },
    },
  },

  property: {
    titleExample: "2 BHK semi-furnished flat near main market",
    descriptionExample:
      "2 BHK semi-furnished flat on the 3rd floor, 950 sq ft and close to the main market. Covered parking, 24-hour water and a gated society. Ready to move in.",
    extra: [AREA, num("Bathrooms", "Bathrooms", "e.g. 2", { min: 0, max: 10 }), text("Floor", "Floor", "e.g. 3rd of 5", false), pick("Parking", ["Car", "Bike", "Both", "None"], "Parking", false)],
    tips: ["Add the area in sq ft and the floor", "Mention parking, water and nearby landmarks", "Say whether it is freehold and the papers are clear"],
    subs: {
      "houses-and-flats-for-rent": {
        priceLabel: "Monthly rent (₹)",
        titleExample: "2 BHK flat for rent near main market",
        descriptionExample:
          "2 BHK semi-furnished flat on the 3rd floor, 950 sq ft. Rent includes water, covered parking available, family or working professionals preferred. Available from next month.",
        extra: [AREA, num("Bathrooms", "Bathrooms", "e.g. 2", { min: 0, max: 10 }), num("Security deposit", "Security deposit", "e.g. 20000", { suffix: "₹", required: false }), pick("Parking", ["Car", "Bike", "Both", "None"], "Parking", false)],
      },
      "plots-and-land": {
        titleExample: "1200 sq ft residential plot, east facing",
        descriptionExample:
          "1200 sq ft east-facing residential plot in a developed colony. Clear title, boundary wall on three sides and a 30 ft road in front. Water and electricity connection nearby.",
        extra: [num("Plot area", "Plot area", "e.g. 1200", { suffix: "sq ft", min: 1 }), pick("Boundary wall", ["Yes", "Partly", "No"], "Boundary wall", false)],
      },
      "pg-and-guest-houses": {
        priceLabel: "Rent per bed (₹ / month)",
        titleExample: "Girls PG near coaching hub, meals included",
        descriptionExample:
          "Clean and safe PG for girls with double sharing rooms, Wi-Fi and CCTV. Three meals a day included, 5 minutes from the coaching hub. Deposit one month rent.",
        extra: [pick("Room type", ["Single", "Double sharing", "Triple sharing"], "Room type"), pick("Meals included", ["Yes", "No"], "Meals included"), pick("Attached bathroom", ["Yes", "No"], "Attached bathroom", false)],
      },
      "shops-and-offices-for-sale": {
        titleExample: "400 sq ft ground floor shop on main road",
        descriptionExample:
          "400 sq ft ground floor shop on the main road with high footfall. Shutter, electricity and water connection ready. Clear papers and immediate possession.",
        extra: [AREA, text("Floor", "Floor", "e.g. Ground", false)],
      },
      "shops-and-offices-for-rent": {
        priceLabel: "Monthly rent (₹)",
        titleExample: "400 sq ft shop for rent on main road",
        descriptionExample:
          "400 sq ft ground floor shop on the main road with high footfall. Suitable for retail or an office, shutter and electricity ready. Deposit three months rent.",
        extra: [AREA, text("Floor", "Floor", "e.g. Ground", false)],
      },
      "new-projects": {
        titleExample: "2 and 3 BHK flats in Green Valley project",
        descriptionExample:
          "New 2 and 3 BHK flats in a gated project with a park, lift and parking. RERA registered with bank loan available. Possession expected in December 2027.",
        extra: [text("Project name", "Project / builder name", "e.g. Green Valley by ABC Builders"), text("Possession", "Possession date", "e.g. Dec 2027"), AREA],
      },
    },
  },

  "electronics-and-appliances": {
    titleExample: "Samsung 253 L double-door fridge",
    descriptionExample:
      "Samsung 253 L double-door fridge, 3 years old and working perfectly with no repairs. Bought from an authorised dealer with the bill available. Two years of compressor warranty left.",
    extra: [MODEL, num("Year of purchase", "Year of purchase", "e.g. 2023", { min: 2000, max: THIS_YEAR, required: false })],
    tips: ["Add the brand, model and year of purchase", "Say how it is working and whether it was ever repaired", "Mention warranty, bill and accessories"],
    subs: {
      "computers-and-laptops": {
        titleExample: "Dell Inspiron 15, i5 11th gen, 8 GB, 512 GB SSD",
        descriptionExample:
          "Dell Inspiron 15 with Intel i5 11th gen, 8 GB RAM and 512 GB SSD. Battery gives about 4 hours, no dents or screen marks. Original charger and bag included.",
        extra: [MODEL, text("Processor", "Processor", "e.g. Intel i5 11th gen"), pick("RAM", ["4 GB", "8 GB", "16 GB", "32 GB"]), pick("Storage", ["128 GB", "256 GB", "512 GB", "1 TB"]), WARRANTY],
      },
      fridges: {
        titleExample: "Samsung 253 L double-door fridge",
        descriptionExample:
          "Samsung 253 L double-door fridge, 3 years old and cooling perfectly. Never repaired and the bill is available. Two years of compressor warranty left.",
        extra: [MODEL, text("Capacity", "Capacity", "e.g. 253 L"), STAR, WARRANTY],
      },
      "air-conditioners": {
        titleExample: "LG 1.5 ton 3 star split AC",
        descriptionExample:
          "LG 1.5 ton 3 star split AC, 2 years old with regular servicing. Cooling is excellent and the remote is included. Installation can be arranged at extra cost.",
        extra: [MODEL, text("Capacity", "Capacity", "e.g. 1.5 ton"), pick("AC type", ["Split", "Window"], "AC type"), STAR, WARRANTY],
      },
      "washing-machines": {
        titleExample: "IFB 7 kg front load washing machine",
        descriptionExample:
          "IFB 7 kg front load washing machine, 2 years old and in full working order. Drum is clean and there are no leaks. Bill and manual are available.",
        extra: [MODEL, text("Capacity", "Capacity", "e.g. 7 kg"), pick("Machine type", ["Front load", "Top load", "Semi-automatic"], "Machine type"), WARRANTY],
      },
      "tvs-and-audio": {
        titleExample: "Sony Bravia 43 inch 4K smart TV",
        descriptionExample:
          "Sony Bravia 43 inch 4K smart TV, 2 years old with a perfect picture and no dead pixels. Remote and wall-mount stand are included. Bill available.",
        extra: [MODEL, text("Screen size", "Screen size", "e.g. 43 inch", false), WARRANTY],
      },
      "cameras-and-lenses": {
        titleExample: "Canon EOS 200D with 18-55 mm lens",
        descriptionExample:
          "Canon EOS 200D with the 18-55 mm kit lens, about 8,000 shutter count. Comes with two batteries, a charger and a camera bag. No fungus or scratches on the lens.",
        extra: [MODEL, text("Shutter count", "Shutter count (if known)", "e.g. 8000", false), WARRANTY],
      },
    },
  },

  furniture: {
    titleExample: "6-seater wooden dining table with chairs",
    descriptionExample:
      "6-seater sheesham wood dining table with 6 cushioned chairs, 2 years old. Strong and in very good condition with no cracks. Buyer arranges pickup, I can help with loading.",
    extra: [text("Size", "Size / dimensions", "e.g. 3-seater, 6 x 4 ft"), pick("Age of item", ["Under 1 year", "1–3 years", "3+ years"], "Age of item")],
    tips: ["Add the size so buyers know it will fit", "Mention the material and how old it is", "Say who arranges the pickup"],
  },

  fashion: {
    titleExample: "Allen Solly formal shirt, size M, brand new",
    descriptionExample:
      "Allen Solly formal shirt in size M, worn only once and washed. Light blue, slim fit, with no stains or damage. Original tag is still on.",
    extra: [text("Type", "Item type", "e.g. Shirt, Saree, Jacket"), text("Brand", "Brand", "e.g. Allen Solly", false)],
    tips: ["Mention the size and fit", "Say how many times it was worn", "Add clear photos of the front, back and label"],
  },

  jobs: {
    priceLabel: "Salary (₹)",
    titleExample: "Delivery executive needed",
    descriptionExample:
      "We are hiring a delivery executive for our Kanpur store. Salary ₹14,000 per month plus incentives, 9 AM to 6 PM, own two-wheeler and licence needed. Freshers are welcome.",
    extra: [
      pick("Salary period", ["Per month", "Per day", "Per hour"], "Salary period"),
      pick("Experience", ["Fresher", "1–2 years", "3–5 years", "5+ years"], "Experience needed"),
      num("Openings", "Number of openings", "e.g. 2", { required: false, min: 1, max: 500 }),
      text("Timings", "Work timings", "e.g. 9 AM to 6 PM", false),
    ],
    tips: ["Write the exact salary and work timings", "Say where the job is located", "Never ask candidates for money, fees or deposits"],
  },

  services: {
    priceLabel: "Starting charges (₹)",
    titleExample: "AC repair and gas filling at home",
    descriptionExample:
      "AC repair and gas filling at your home across Kanpur. 8 years of experience, same-day visit and a 30-day service warranty. Charges start at ₹499, spare parts extra.",
    extra: [
      pick("Charges type", ["Fixed price", "Per hour", "Per visit", "Per day"], "Charges type"),
      text("Service area", "Service area", "e.g. Kanpur and nearby"),
      pick("Experience", ["Under 1 year", "1–3 years", "3–5 years", "5+ years"], "Experience"),
    ],
    tips: ["Say which areas you serve", "Mention your experience and any warranty on your work", "Be clear about what the charges include"],
  },

  pets: {
    titleExample: "Labrador puppy, 2 months, vaccinated",
    descriptionExample:
      "Labrador puppy, 2 months old and male, with the first vaccination done. Healthy and playful, comes with a feeding chart. Serious buyers only, please.",
    extra: [text("Breed", "Breed / type", "e.g. Labrador"), pick("Gender", ["Male", "Female"], "Gender"), pick("Vaccinated", ["Yes", "No", "Not applicable"], "Vaccinated")],
    tips: ["Mention the age, vaccination and health", "Only list animals you are legally allowed to sell", "Meet buyers in person before handing over any pet"],
    subs: {
      "fish-and-aquariums": {
        titleExample: "Goldfish pair with 2 ft tank",
        descriptionExample:
          "Healthy goldfish pair with a 2 ft glass tank, filter and light. Tank is 1 year old and in good condition. Food and decorations are included.",
        extra: [text("Type", "What are you selling?", "e.g. Goldfish, 2 ft tank")],
        noFilterFields: true,
      },
      "pet-food-and-accessories": {
        titleExample: "Pedigree dog food 3 kg, sealed pack",
        descriptionExample:
          "Pedigree adult dog food, 3 kg sealed pack with a long expiry date. Bought extra by mistake. Also have a belt and a feeding bowl available.",
        extra: [text("Item", "Item", "e.g. Dog food 3 kg, belt")],
        noFilterFields: true,
      },
    },
  },

  "books-sports-and-hobbies": {
    titleExample: "Decathlon 20 kg adjustable dumbbell set",
    descriptionExample:
      "Decathlon 20 kg adjustable dumbbell set with 4 plates and 2 rods, used for 6 months. No rust and all the locks work. Selling because I am moving.",
    extra: [text("Brand", "Brand", "e.g. Decathlon", false)],
    tips: ["Mention the brand and how long you used it", "Say what is included in the set", "Add clear photos from different angles"],
    subs: {
      books: {
        titleExample: "Class 12 NCERT books, full set",
        descriptionExample:
          "Complete set of Class 12 NCERT books in English, used for one year. No torn pages and only light pencil marks. Can be sold separately.",
        extra: [text("Author", "Author / publisher", "e.g. NCERT"), pick("Language", ["Hindi", "English", "Other"], "Language"), text("Class", "Class or exam", "e.g. Class 12, UPSC", false)],
      },
      "musical-instruments": {
        titleExample: "Yamaha F310 acoustic guitar with bag",
        descriptionExample:
          "Yamaha F310 acoustic guitar, 2 years old with a soft bag and extra strings. Sounds great and there are no cracks. Selling because I rarely play now.",
        extra: [text("Instrument", "Instrument", "e.g. Acoustic guitar"), text("Brand", "Brand", "e.g. Yamaha", false)],
      },
    },
  },

  "commercial-vehicles": {
    titleExample: "2018 Tata Ace, diesel, 1st owner",
    descriptionExample:
      "2018 Tata Ace diesel, 1st owner and 62,000 km driven. Permit and fitness are valid, tyres are in good condition and the engine has no issues. Ready for immediate use.",
    extra: [MODEL, YEAR, KMS, text("Load capacity", "Load capacity", "e.g. 1 tonne"), OWNERS, pick("Permit", ["Valid", "Expired", "Not applicable"], "Permit and fitness", false)],
    tips: ["Mention the load capacity and km driven", "Say if permit, fitness and insurance are valid", "Add any recent repairs or tyre changes"],
    subs: {
      "vehicle-spare-parts": {
        titleExample: "Tata Ace gearbox, working condition",
        descriptionExample:
          "Tata Ace gearbox in working condition, removed from a 2018 vehicle. No leaks and smooth gear shifting. Can be checked before buying.",
        extra: [text("Part", "Part name", "e.g. Gearbox"), text("Fits", "Fits models", "e.g. Tata Ace")],
        noFilterFields: true,
      },
    },
  },
};

const DEFAULT_TITLE = "Brand, model and the key detail, e.g. size or age";
const DEFAULT_DESCRIPTION =
  "Used for one year and kept in very good condition, with no repairs or damage. Original bill and accessories are included. Selling because I no longer need it.";
const DEFAULT_TIPS = [
  "Use clear, well-lit photos of the actual item",
  "Write the brand, model and age in the title",
  "Be honest about any defect, it builds trust and saves time",
];

// These filter-based questions are optional. Everything else from filters.ts is required.
const OPTIONAL_FILTER_KEYS = new Set(["Warranty", "Facing", "Material"]);

export const getSellConfig = (categorySlug: string, subSlug?: string): SellConfig => {
  const { subs, ...category } = CONFIG[categorySlug] ?? {};
  const merged: Entry = { ...category, ...(subSlug ? subs?.[subSlug] : {}) };
  const filterCfg = getFilterConfig(categorySlug, subSlug);

  const derived: SellField[] = merged.noFilterFields
    ? []
    : filterCfg.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: "select",
        options: f.options,
        required: !OPTIONAL_FILTER_KEYS.has(f.key),
      }));

  return {
    fields: [...derived, ...(merged.extra ?? [])],
    titleExample: merged.titleExample ?? DEFAULT_TITLE,
    descriptionExample: merged.descriptionExample ?? DEFAULT_DESCRIPTION,
    priceLabel: merged.priceLabel ?? filterCfg.priceLabel,
    askCondition: filterCfg.condition,
    askSellerType: filterCfg.sellerType,
    tips: merged.tips ?? DEFAULT_TIPS,
  };
};