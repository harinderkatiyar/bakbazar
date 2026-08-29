import { Search, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const stats = [
  { label: "Live listings", value: "12,000+" },
  { label: "Cities", value: "40+" },
  { label: "Verified sellers", value: "3,500+" },
];

const sampleListings = [
 
  { title: "iPhone 13, 128GB", price: "$385", loc: "Kanpur", tone: "rotate-[2deg] translate-x-6" },
];

export const Hero = () => {
  return (
    <section className="container grid gap-8 py-10 md:py-14 lg:grid-cols-2 lg:gap-8 place-items-center">
      <div className="space-y-4 text-center lg:text-start">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#0F5257]/20 bg-[#0F5257]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0F5257] dark:text-[#5fb8bd]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your local marketplace
        </span>

        <h1
          className="text-3xl font-bold leading-[1.1] text-[#14213D] dark:text-white md:text-5xl"
          style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
        >
          Someone's old, <span className="text-[#C4432B]">your next find.</span>
        </h1>

        <p className="mx-auto text-base text-muted-foreground md:w-10/12 lg:mx-0">
          Buy and sell anything near you — vehicles, electronics, furniture, and more.
        </p>

        {/* Trust stats — single compact row */}
        <div className="mx-auto flex max-w-xl justify-center gap-6 lg:mx-0 lg:justify-start">
          {stats.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-lg font-bold text-[#14213D] dark:text-white">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right visual: two floating listing cards */}
      <div className="flex w-full max-w-sm items-center justify-center py-2">
        <div className="flex flex-col gap-3">
          {sampleListings.map((item) => (
            <div
              key={item.title}
              className={`w-56 rounded-xl border border-[#14213D]/10 bg-white p-2.5 shadow-lg dark:bg-[#14213D] dark:border-white/10 ${item.tone}`}
            >
              <div className="mb-2 h-20 w-full rounded-lg bg-gradient-to-br from-[#0F5257]/15 to-[#E9A319]/20" />
              <p className="truncate text-sm font-semibold text-[#14213D] dark:text-white">
                {item.title}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-bold text-[#C4432B]">{item.price}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {item.loc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};