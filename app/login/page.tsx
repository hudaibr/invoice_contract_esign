"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { branding } from "@/lib/branding";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900 mb-1 text-center">{branding.agencyName}</h1>
        <p className="text-sm text-neutral-500 mb-6 text-center">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}