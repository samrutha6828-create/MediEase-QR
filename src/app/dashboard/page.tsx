"use client";

import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePatient } from "@/context/PatientContext";

export default function DashboardPage() {
  const { patient, booking, queue } = usePatient();

  return (
    <PageContainer
      title="My Appointment"
      subtitle={patient.name ? `Patient: ${patient.name}` : "Your active hospital visit"}
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Patient Summary Card (Clean, no internal database IDs) */}
          <Card variant="highlight" className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Patient
              </p>
              <h2 className="text-2xl font-black text-slate-900">{patient.name || "Patient"}</h2>
              <p className="text-base text-slate-700">
                Phone: {patient.phone}
              </p>
            </div>
            {patient.age && (
              <div className="text-right">
                <span className="text-sm font-bold text-slate-600">
                  Age: {patient.age}
                </span>
              </div>
            )}
          </Card>

          {/* Active Appointment Details Card */}
          <Card className="space-y-4 border-2 border-slate-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Your Appointment
              </h3>
              <Badge variant="success" size="lg">Confirmed</Badge>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200 text-lg">
              <p><strong>Doctor:</strong> {booking.doctorName || "General Physician"}</p>
              <p><strong>Department:</strong> {booking.department || "Consultation"}</p>
              <p><strong>Room:</strong> {booking.room || "Room 101"}</p>
              <p><strong>Date & Time:</strong> {booking.date} at {booking.time}</p>
            </div>

            {/* Live Queue Token Box */}
            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-300 text-emerald-950">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-800">Your Number</p>
                <p className="text-4xl font-black text-emerald-900">{queue.token}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-emerald-800">People Ahead</p>
                <p className="text-4xl font-black text-emerald-700">{queue.patientsAhead}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-4">
          <Link href="/queue" className="block w-full">
            <Button variant="primary" size="xl">
              See Live Queue Status
            </Button>
          </Link>

          <Link href="/book" className="block w-full">
            <Button variant="secondary" size="lg">
              Book Another Appointment
            </Button>
          </Link>

          <Link href="/assistance" className="block w-full">
            <Button variant="outline" size="lg">
              Get Help
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
