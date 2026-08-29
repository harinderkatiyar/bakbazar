import { useState } from "react";
import { Search, MessageCircle, Heart, Menu, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ModeToggle } from "./mode-toggle";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { SellButton } from "./SellButton";
import { LocationPicker } from "./LocationPicker";

const BRAND_NAME = "Bikbazar";

const categories = [
  "All Categories",
  "Cars",
  "Mobiles",
  "Electronics",
  "Furniture",
  "Fashion",
  "Property",
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#14213D]/10 bg-[#FBF7F0]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FBF7F0]/80 dark:bg-[#0B0F14]/95 dark:border-white/10">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        {/* Logo */}
        <a
          href="/"
          className="flex shrink-0 items-center gap-1 text-2xl font-bold tracking-tight text-[#14213D] dark:text-white"
          style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
        >
          {BRAND_NAME.slice(0, 3)}
          <span className="text-[#C4432B]">{BRAND_NAME.slice(3)}</span>
        </a>

        {/* Location — desktop only */}
        <LocationPicker />

        {/* Search bar — desktop */}
        <div className="hidden flex-1 items-center rounded-full border border-[#14213D]/15 bg-white shadow-sm md:flex dark:bg-white/5 dark:border-white/15">
          <select className="max-w-[140px] shrink-0 truncate rounded-l-full border-r border-[#14213D]/10 bg-transparent px-3 py-2.5 text-sm text-[#14213D]/70 outline-none dark:text-white/70 dark:border-white/10">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Search className="ml-3 h-4 w-4 shrink-0 text-[#14213D]/40 dark:text-white/40" />
          <Input
            placeholder="Search cars, mobiles, furniture..."
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
          />
        </div>

        {/* Right actions — desktop */}
        <div className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
          <Button variant="ghost" size="icon" className="text-[#14213D] dark:text-white">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative text-[#14213D] dark:text-white">
            <MessageCircle className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C4432B]" />
          </Button>
          {user ? (
            <Button variant="ghost" onClick={logout} className="gap-1.5 text-[#14213D] dark:text-white">
              <img src={user.photoURL ?? ""} className="h-6 w-6 rounded-full" alt="" />
              {user.displayName?.split(" ")[0]}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate("/login")} className="gap-1.5 text-[#14213D] dark:text-white">
              <User className="h-4 w-4" />
              Login
            </Button>
          )}
          <SellButton className="ml-1" />
          <ModeToggle />
        </div>

        {/* Mobile */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen((v) => !v)}>
            <Search className="h-5 w-5" />
          </Button>
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle
                  className="text-xl font-bold text-[#14213D] dark:text-white"
                  style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
                >
                  {BRAND_NAME}
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-[#14213D]/5 dark:hover:bg-white/5"
                  >
                    <img src={user.photoURL ?? ""} className="h-4 w-4 rounded-full" alt="" />
                    Logout ({user.displayName?.split(" ")[0]})
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-[#14213D]/5 dark:hover:bg-white/5"
                  >
                    <User className="h-4 w-4" /> Login / Sign up
                  </button>
                )}
                <button className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-[#14213D]/5 dark:hover:bg-white/5">
                  <MessageCircle className="h-4 w-4" /> Chats
                </button>
                <button className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-[#14213D]/5 dark:hover:bg-white/5">
                  <Heart className="h-4 w-4" /> Wishlist
                </button>
                <SellButton className="mt-3 w-full" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search row */}
      {mobileSearchOpen && (
        <div className="border-t border-[#14213D]/10 px-4 py-2.5 md:hidden dark:border-white/10">
          <div className="flex items-center gap-2 rounded-full border border-[#14213D]/15 bg-white px-3 py-2 dark:bg-white/5 dark:border-white/15">
            <Search className="h-4 w-4 text-[#14213D]/40 dark:text-white/40" />
            <Input
              autoFocus
              placeholder="Search..."
              className="border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent h-6"
            />
          </div>
        </div>
      )}
    </header>
  );
};