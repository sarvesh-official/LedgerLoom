"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, useSidebar } from "@/components/ui/SidebarLayout"
import MobileSidebar from "@/components/MobileSidebar"
import { IconMenu2, IconBell, IconSearch } from "@tabler/icons-react"
import Image from "next/image"

const NavbarContent = () => {
  const router = useRouter()
  const { open, setOpen } = useSidebar()

  return (
    <>
      <div className="w-full px-3 py-3 bg-[#1e1e1e] text-white flex justify-between items-center rounded-full">
        {/* Left Section (Hamburger + Logo) */}
        <div className="flex items-center gap-2">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8"
            onClick={() => setOpen(!open)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <IconMenu2 size={18} className="text-white" />
          </button>

          {/* Logo */}
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
            <h1 className="hidden sm:block text-sm font-semibold">
              LEDGERLOOM
            </h1>
          </div>
        </div>

        {/* Right Section (Search, Notification, Avatar) */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] cursor-pointer">
            <IconSearch size={16} />
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] cursor-pointer">
            <IconBell size={16} />
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer overflow-hidden">
            <img
              src="/images/profile.png"
              alt="User"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>

      {/* 👇 Only render sidebar component here */}
      <MobileSidebar />
    </>
  )
}

const Navbar = () => {
  return (
    <SidebarProvider>
      <NavbarContent />
    </SidebarProvider>
  )
}

export default Navbar
