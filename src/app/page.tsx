"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4">
        <Logo size="md" variant="dark" showText={true} />
        <Link href="/patient">
          <Button variant="primary" size="md" fullWidth={false} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            Open Patient App
          </Button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full py-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white">System Navigation</h2>
          <p className="text-slate-400 text-lg">
            Access and test all 5 major MediEase sections independently:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Patient App */}
          <Link href="/patient" className="block group">
            <Card className="bg-slate-800 border-2 border-slate-700 group-hover:border-emerald-500 transition-all p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">1. Patient App</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Simplified elderly-friendly patient experience (Sign-In with OTP, 6-Month Booking, Live Queue, Help).
                </p>
              </div>
              <p className="text-emerald-400 font-mono text-xs font-bold pt-2">http://localhost:3000/patient</p>
            </Card>
          </Link>

          {/* 2. Staff Portal */}
          <Link href="/staff" className="block group">
            <Card className="bg-slate-800 border-2 border-slate-700 group-hover:border-teal-500 transition-all p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">2. Staff Portal</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Staff desk dashboard with &apos;Call Next&apos; action, live queue table, and active assistance alerts.
                </p>
              </div>
              <p className="text-teal-400 font-mono text-xs font-bold pt-2">http://localhost:3000/staff</p>
            </Card>
          </Link>

          {/* 3. Queue Operational View */}
          <Link href="/queue" className="block group">
            <Card className="bg-slate-800 border-2 border-slate-700 group-hover:border-sky-500 transition-all p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">3. Queue View</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Live operational queue board displaying Now Serving, Next Patient, and Waiting count.
                </p>
              </div>
              <p className="text-sky-400 font-mono text-xs font-bold pt-2">http://localhost:3000/queue</p>
            </Card>
          </Link>

          {/* 4. Assistance Operational View */}
          <Link href="/assistance" className="block group">
            <Card className="bg-slate-800 border-2 border-slate-700 group-hover:border-amber-500 transition-all p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">4. Assistance View</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Active patient assistance requests with Acknowledge and Resolve operational controls.
                </p>
              </div>
              <p className="text-amber-400 font-mono text-xs font-bold pt-2">http://localhost:3000/assistance</p>
            </Card>
          </Link>

          {/* 5. IoT Test Simulator */}
          <Link href="/iot" className="block group sm:col-span-2 lg:col-span-2">
            <Card className="bg-slate-800 border-2 border-slate-700 group-hover:border-purple-500 transition-all p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mt-1">5. IoT Test Console</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Simulate ESP32 physical hardware button presses targeting the real backend IoT webhook endpoint.
                </p>
              </div>
              <p className="text-purple-400 font-mono text-xs font-bold pt-2">http://localhost:3000/iot</p>
            </Card>
          </Link>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        MediEase Healthcare Platform • All 5 views connected to central backend & database
      </footer>
    </div>
  );
}
