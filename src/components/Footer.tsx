import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const BRAND_NAME = "Bikbazar";

const linkGroups = [
  {
    title: "Categories",
    links: ["Cars", "Mobiles", "Electronics", "Furniture", "Property", "Fashion"],
  },
  {
    title: "Company",
    links: ["About us", "How it works", "Careers", "Blog"],
  },
  {
    title: "Support",
    links: ["Help center", "Safety tips", "Report a listing", "Contact us"],
  },
  {
    title: "Legal",
    links: ["Terms of service", "Privacy policy", "Cookie policy"],
  },
];

const socials = [
  { icon: Facebook, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Twitter, href: "#" },
  { icon: Youtube, href: "#" },
];

export const Footer = () => {
  return (
    <footer id="footer" className="border-t border-[#14213D]/10 dark:border-white/10">
      <section className="container grid grid-cols-2 gap-x-8 gap-y-10 py-16 md:grid-cols-4 xl:grid-cols-6">
        <div className="col-span-full xl:col-span-2">
          <a
            href="/"
            className="flex items-center text-2xl font-bold tracking-tight text-[#14213D] dark:text-white"
            style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
          >
            {BRAND_NAME.slice(0, 3)}
            <span className="text-[#C4432B]">{BRAND_NAME.slice(3)}</span>
          </a>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Buy and sell anything near you. A simple, safe way to connect
            with people in your city.
          </p>
          <div className="mt-5 flex gap-3">
            {socials.map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                rel="noreferrer noopener"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 dark:text-white dark:border-white/15 dark:hover:bg-white/5"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {linkGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-[#14213D] dark:text-white">
              {group.title}
            </h3>
            {group.links.map((link) => (
              <a
                key={link}
                href="#"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground hover:text-[#C4432B]"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </section>

      <section className="container flex flex-col items-center justify-between gap-4 border-t border-[#14213D]/10 py-6 text-sm text-muted-foreground md:flex-row dark:border-white/10">
        <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
        <p>Made for buyers and sellers everywhere.</p>
      </section>
    </footer>
  );
};