"use client";

import { saveMockUser } from "../../lib/mockAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleLogin(e: any) {
    e.preventDefault();

    if (!email) return;

    saveMockUser(email);

    router.push("/feed");
  }

  return (
    <div className="p-20">
      <h1 className="text-3xl mb-6">Login</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-96">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3"
        />

        <button className="bg-black text-white p-3">
          Login
        </button>
      </form>
    </div>
  );
}