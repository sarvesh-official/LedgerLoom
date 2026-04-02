// app/layout.tsx

import Navbar from "@/components/ui/Navbar";
import { SidebarLayout } from "@/components/ui/SidebarLayout";
import Sidebar from "@/components/Sidebar";
import { Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${sora.variable} font-[var(--font-space-grotesk)] h-screen overflow-hidden flex flex-col p-3 transition-colors duration-200`}
      >
        <SidebarLayout>
          <Navbar />
          <div className="flex flex-1 overflow-hidden pt-3">
            <Sidebar />
            <main className="flex-1 overflow-y-auto sm:pl-3 text-[var(--text)]">
              {children}
            </main>
          </div>
        </SidebarLayout>
      </body>
    </html>
  );
}
