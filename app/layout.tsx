import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCompanies } from "@/lib/data";
import AccountSwitcher from "./AccountSwitcher";
import FilterBar from "./FilterBar";
import { FilterProvider } from "./FilterContext";

export const metadata: Metadata = {
  title: "Account Intelligence Dashboard",
  description: "Live account-signal monitoring across a strategic customer list.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const companies = getCompanies();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <FilterProvider>
          <header className="border-b border-slate-200 sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
            <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <Link href="/" className="font-semibold tracking-tight text-slate-900 shrink-0">
                Account Intelligence Dashboard
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <FilterBar />
                <AccountSwitcher companies={companies} />
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</main>
        </FilterProvider>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Updates daily via a scheduled agent · Built by Nick Stroud
        </footer>
      </body>
    </html>
  );
}
