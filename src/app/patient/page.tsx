"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { usePatient } from "@/context/PatientContext";

export default function PatientHomePage() {
  const { patient, booking } = usePatient();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <PageHeader showBack={false} showHelp={true} />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-10 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-1 text-left">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">
              Patient Portal
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {patient.name ? `Welcome, ${patient.name}` : "Welcome to MediEase"}
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Select what you would like to do today.
            </p>
          </div>

          {/* 3 Main Direct Patient Action Cards */}
          <div className="space-y-4 pt-2">
            {/* 1. Book Appointment */}
            <Link href="/book" className="block group">
              <Card className="p-6 border-2 border-slate-300 group-hover:border-emerald-600 group-hover:shadow-md transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-800">
                    Book Appointment
                  </h2>
                  <p className="text-base text-slate-600 font-medium">
                    Choose a doctor, date, and time.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 ml-3">
                  →
                </div>
              </Card>
            </Link>

            {/* 2. My Appointment */}
            <Link href={booking.doctorName ? "/dashboard" : "/identify"} className="block group">
              <Card className="p-6 border-2 border-slate-300 group-hover:border-teal-600 group-hover:shadow-md transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-teal-800">
                    My Appointment
                  </h2>
                  <p className="text-base text-slate-600 font-medium">
                    View your booked visit and queue number.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0 ml-3">
                  →
                </div>
              </Card>
            </Link>

            {/* 3. Get Help */}
            <Link href="/assistance" className="block group">
              <Card className="p-6 border-2 border-slate-300 group-hover:border-amber-500 group-hover:shadow-md transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-amber-900">
                    Get Help
                  </h2>
                  <p className="text-base text-slate-600 font-medium">
                    Request wheelchair or staff support.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xl group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0 ml-3">
                  →
                </div>
              </Card>
            </Link>
          </div>
        </div>

        <div className="pt-8 text-center">
          <Link
            href="/entry"
            className="text-sm font-bold text-slate-500 hover:text-slate-800 underline"
          >
            Hospital QR Code Check-In
          </Link>
        </div>
      </main>
    </div>
  );
}
