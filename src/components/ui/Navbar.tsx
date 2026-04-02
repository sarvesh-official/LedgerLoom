"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/components/ui/SidebarLayout";
import MobileSidebar from "@/components/MobileSidebar";
import { IconMenu2, IconBell, IconSearch } from "@tabler/icons-react";
import { MoonStar, SunMedium } from "lucide-react";
import Image from "next/image";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "ledgerloom-theme";

const NavbarContent = () => {
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [theme, setTheme] = React.useState<ThemeMode>("dark");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ?? (preferredDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <>
      <div className="w-full px-3 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] flex justify-between items-center rounded-full transition-colors duration-200">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden flex items-center justify-center w-8 h-8"
            onClick={() => setOpen(!open)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <IconMenu2 size={18} className="text-[var(--text)]" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={32}
              height={24}
              className="w-8 h-6"
            />
            <h1 className="hidden sm:block text-sm font-semibold tracking-wide">LEDGERLOOM</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            title="Search"
            aria-label="Search"
          >
            <IconSearch size={16} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <IconBell size={16} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
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
