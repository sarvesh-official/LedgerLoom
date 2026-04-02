// app/layout.tsx

import Navbar from "@/components/ui/Navbar";
import { SidebarLayout } from "@/components/ui/SidebarLayout";
import Sidebar from "@/components/Sidebar";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} font-[var(--font-space-grotesk)] bg-[#111111] h-screen overflow-hidden flex flex-col p-3`}
      >
        <SidebarLayout>
          <Navbar />
          <div className="flex flex-1 overflow-hidden pt-3">
            <Sidebar />
            <main className="flex-1 overflow-y-auto sm:pl-3 text-white">
              {children}
            </main>
          </div>
        </SidebarLayout>
      </body>
    </html>
  );
}
