// Save as: src/components/Navbar.tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Store,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ModeToggle } from "../mode-toggle";
import { useAuth } from "@/context/AuthContext";
import { SellButton } from "../SellButton";
import { LocationPicker } from "../LocationPicker";
import { CategoryMenu } from "../category/Categorymenu";

const BRAND_NAME = "Bikbazar";

/* ------------------------------ helpers ------------------------------ */

const UserAvatar = ({
  src,
  name,
  className = "h-8 w-8",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) =>
  src ? (
    <img src={src} alt={name ?? "User"} className={`${className} rounded-full object-cover`} />
  ) : (
    <span
      className={`${className} grid place-items-center rounded-full bg-[#14213D] text-xs font-semibold text-white`}
      aria-hidden
    >
      {(name ?? "U").charAt(0).toUpperCase()}
    </span>
  );

const MenuRow = ({
  icon: Icon,
  label,
  onClick,
  danger,
  badge,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-[#14213D]/5 dark:hover:bg-white/5 ${danger ? "text-[#C4432B]" : "text-[#14213D] dark:text-white"
      }`}
  >
    <span className="flex items-center gap-3">
      <Icon className="h-4 w-4" />
      {label}
    </span>
    {badge ? (
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#C4432B] px-1.5 text-xs font-bold text-white">
        {badge}
      </span>
    ) : null}
  </button>
);

interface SearchFormProps {
  q: string;
  setQ: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

const SearchForm = ({ q, setQ, onSubmit, className = "" }: SearchFormProps) => (
  <form
    role="search"
    onSubmit={onSubmit}
    className={`items-center rounded-xl bg-[#14213D]/[0.05] ring-1 ring-[#14213D]/10 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C4432B]/40 dark:bg-white/5 dark:ring-white/10 dark:focus-within:bg-white/10 ${className}`}
  >
    <Search className="ml-3 h-4 w-4 shrink-0 text-[#14213D]/40 dark:text-white/40" />
    <Input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Search for mobiles, cars, furniture…"
      aria-label="Search listings"
      className="h-11 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
    <button
      type="submit"
      aria-label="Search"
      className="m-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#C4432B] text-white transition-colors hover:bg-[#C4432B]/90"
    >
      <Search className="h-4 w-4" />
    </button>
  </form>
);

/* ------------------------------- Navbar ------------------------------ */

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Get unread count from localStorage (will be updated by Chat page)
  useEffect(() => {
    const checkUnread = () => {
      const count = localStorage.getItem("unreadChatsCount");
      setUnreadCount(count ? parseInt(count) : 0);
    };
    checkUnread();
    window.addEventListener("storage", checkUnread);
    return () => window.removeEventListener("storage", checkUnread);
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ pathname: "/", search: `?q=${encodeURIComponent(q.trim())}`, hash: "#features" });
    }
    setQ("");
  };

  const goTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const firstName = user?.displayName?.split(" ")[0];

  return (
    <header className="sticky top-0 z-50 w-full pt-3">
      <div className="container">
        <nav
          className={`rounded-2xl border border-[#14213D]/10 bg-white/80 backdrop-blur-xl transition-shadow dark:border-white/10 dark:bg-[#11161D]/80 ${scrolled ? "shadow-lg shadow-[#14213D]/10" : "shadow-sm"
            }`}
        >
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 md:px-4">
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={`${BRAND_NAME} home`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C4432B] text-white">
                <Store className="h-5 w-5" />
              </span>
              <span
                className="hidden text-xl font-bold tracking-tight text-[#14213D] sm:block dark:text-white"
                style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
              >
                {BRAND_NAME.slice(0, 3)}
                <span className="text-[#C4432B]">{BRAND_NAME.slice(3)}</span>
              </span>
            </Link>

            {/* Location — large screens only */}
            <div className="hidden lg:block">
              <LocationPicker />
            </div>

            {/* Categories — desktop button, mobile icon */}
            <CategoryMenu />

            {/* Search — large screens, simplified (no category) */}
            <SearchForm
              q={q}
              setQ={setQ}
              onSubmit={submitSearch}
              className="hidden flex-1 lg:flex"
            />

            {/* Right actions — large screens */}
            <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">

              {/* Chat button with unread badge */}
              <button
                onClick={() => navigate("/chats")}
                className="relative rounded-full p-2 text-[#14213D] hover:bg-[#14213D]/5 transition dark:text-white dark:hover:bg-white/5"
                aria-label="Chats"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4432B] px-1 text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <span className="mx-1 h-6 w-px bg-[#14213D]/15 dark:bg-white/15" />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-full pl-1.5 pr-3 text-[#14213D] dark:text-white">
                      <UserAvatar src={user.photoURL} name={user.displayName} />
                      {firstName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/my-ads")}>
                      <Store className="mr-2 h-4 w-4" />
                      My Ads
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-[#C4432B]">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="gap-1.5 rounded-full text-[#14213D] dark:text-white"
                >
                  <User className="h-4 w-4" />
                  Login
                </Button>
              )}

              <SellButton className="ml-1" />
              <ModeToggle />
            </div>

            {/* Compact actions — below lg */}
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <ModeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[300px] flex-col gap-0 p-0 sm:w-[340px]">
                  <SheetHeader className="border-b border-[#14213D]/10 p-5 dark:border-white/10">
                    <SheetTitle
                      className="text-xl font-bold text-[#14213D] dark:text-white"
                      style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
                    >
                      {BRAND_NAME.slice(0, 3)}
                      <span className="text-[#C4432B]">{BRAND_NAME.slice(3)}</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 space-y-1 overflow-y-auto p-4">
                    {/* Search in mobile menu */}
                    <div className="mb-3">
                      <SearchForm
                        q={q}
                        setQ={setQ}
                        onSubmit={(e) => {
                          submitSearch(e);
                          setIsOpen(false);
                        }}
                        className="flex"
                      />
                    </div>

                    {user ? (
                      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#14213D]/5 p-3 dark:bg-white/5">
                        <UserAvatar src={user.photoURL} name={user.displayName} className="h-11 w-11" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#14213D] dark:text-white">
                            {user.displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => goTo("/login")}
                        className="mb-3 w-full rounded-xl bg-[#14213D] text-white hover:bg-[#14213D]/90 dark:bg-white dark:text-[#14213D]"
                      >
                        <User className="mr-2 h-4 w-4" /> Login / Sign up
                      </Button>
                    )}

                    {user && <MenuRow icon={Store} label="My Ads" onClick={() => goTo("/my-ads")} />}
                    <MenuRow 
                      icon={MessageCircle} 
                      label="Chats" 
                      onClick={() => goTo("/chats")}
                      badge={unreadCount > 0 ? unreadCount : undefined}
                    />
                  </div>

                  <div className="space-y-2 border-t border-[#14213D]/10 p-4 dark:border-white/10">
                    <SellButton className="w-full" />
                    {user && (
                      <MenuRow
                        icon={LogOut}
                        label="Logout"
                        danger
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                      />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search row — mobile only */}
          <div className="px-3 pb-3 lg:hidden">
            <SearchForm
              q={q}
              setQ={setQ}
              onSubmit={submitSearch}
              className="flex"
            />
          </div>
        </nav>
      </div>
    </header>
  );
};