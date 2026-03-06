"use client";

import Link from "next/link";
import { clearMockUser, getMockUser } from "../lib/mockAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getMockUser();
    setUserEmail(user?.email || null);
  }, []);

  function logout() {
    clearMockUser();
    setUserEmail(null);
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-lg font-bold text-white">
            A
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white">AthLink</div>
            <div className="text-xs text-slate-400">Connecting athletes to opportunity</div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/feed" className="transition hover:text-white">
            Feed
          </Link>
          <a href="/#opportunities" className="transition hover:text-white">
            Opportunities
          </a>
          <a href="/#post" className="transition hover:text-white">
            Post
          </a>
        </div>

        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:inline-flex">
                {userEmail}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}