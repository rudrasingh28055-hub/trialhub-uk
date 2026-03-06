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
    <nav className="flex justify-between p-6 bg-black text-white">
      <Link href="/" className="font-bold text-xl">
        AthLink
      </Link>

      <div className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/feed">Feed</Link>

        {userEmail ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}