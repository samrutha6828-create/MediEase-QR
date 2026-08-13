"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export default function StaffLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const json = await res.json();
      setIsLoading(false);

      if (res.status === 200 && json.success && json.data?.accessKey) {
        sessionStorage.setItem("staffAccessKey", json.data.accessKey);
        router.push("/staff");
      } else {
        setError(json.error || "Invalid staff passcode");
      }
    } catch {
      setIsLoading(false);
      setError("Failed to connect to authentication service");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Logo size="md" variant="dark" showText={true} />
          <h2 className="text-xl font-bold text-slate-300 pt-2">Staff Portal Login</h2>
        </div>

        <Card className="bg-slate-800 border-2 border-slate-700 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Staff Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter staff passcode"
                className="w-full p-4 rounded-xl bg-slate-900 border-2 border-slate-700 text-white font-mono text-base focus:border-emerald-500 focus:outline-none"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-200 text-xs font-bold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Sign In to Staff Portal
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center">
            Authorized hospital personnel only
          </p>
        </Card>
      </div>
    </div>
  );
}
