"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/components/ui/SidebarLayout";
import MobileSidebar from "@/components/MobileSidebar";
import { IconMenu2, IconBell, IconSearch } from "@tabler/icons-react";
import { MoonStar, SunMedium } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "ledgerloom-theme";

const sampleNotifications = [
  { id: 1, text: "Budget alert: Housing is 12% above target.", time: "2m ago" },
  { id: 2, text: "New income entry synced from mock API.", time: "15m ago" },
  { id: 3, text: "Weekly summary is ready to export.", time: "1h ago" },
];

const NavbarContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const [theme, setTheme] = React.useState<ThemeMode>("dark");
  const [searchValue, setSearchValue] = React.useState("");
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(sampleNotifications.length);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ?? (preferredDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchValue(params.get("q") ?? "");
  }, [pathname]);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    };

    if (notifOpen) {
      document.addEventListener("mousedown", handler);
    }

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [notifOpen]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchValue.trim();
    window.dispatchEvent(new CustomEvent("ledgerloom-search", { detail: q }));
    router.push(`/dashboard${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

  const handleLogoClick = () => {
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <>
      <div className="relative z-50 w-full px-3 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex justify-between items-center rounded-full transition-colors duration-200 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <IconMenu2 size={18} className="text-[var(--text)]" />
          </button>

          <button
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleLogoClick}
          >
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={32}
              height={24}
              className="w-8 h-6"
            />
            <h1 className="hidden sm:block text-sm font-semibold tracking-wide">LEDGERLOOM</h1>
          </button>
        </div>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search transactions, categories, or notes"
              className="pl-9 bg-[var(--surface-soft)] border-[var(--border)]"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-10">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 shrink-0" ref={notificationRef}>
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setUnreadCount(0);
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <IconBell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] bg-[var(--brand)] text-white rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-3 top-16 w-80 max-w-[92vw] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_40px_var(--ring)] z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {sampleNotifications.map((item) => (
                  <li key={item.id} className="px-4 py-3 border-b border-[var(--border)] last:border-b-0">
                    <p className="text-sm text-[var(--text)]">{item.text}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{item.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>
          <div className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer overflow-hidden border border-[var(--border)]">
            <Image
              src="/images/profile.png"
              alt="User"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="md:hidden mt-2 relative z-40">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search transactions"
            className="bg-[var(--surface-soft)] border-[var(--border)]"
          />
          <Button type="submit" size="sm" variant="outline">
            Go
          </Button>
        </form>
      </div>

      <MobileSidebar />
    </>
  );
};

const Navbar = () => {
  return (
    <SidebarProvider>
      <NavbarContent />
    </SidebarProvider>
  );
};

export default Navbar;
