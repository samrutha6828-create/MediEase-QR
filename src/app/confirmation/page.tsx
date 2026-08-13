"use client";

import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePatient } from "@/context/PatientContext";

export default function ConfirmationPage() {
  const { booking, patient } = usePatient();

  return (
    <PageContainer
      title="Appointment Confirmed"
      subtitle="Your visit is booked. Please keep your queue number."
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6 text-center">
          <Card variant="highlight" className="p-8 space-y-4 border-3 border-emerald-400 bg-emerald-50">
            <div className="flex items-center justify-center">
              <Badge variant="success" size="lg">Confirmed</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Your Queue Number
              </p>
              <div className="text-6xl sm:text-7xl font-black text-emerald-900 tracking-tight">
                {booking.token}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 text-left space-y-2 text-lg text-slate-900 shadow-xs">
              <p><strong>Patient:</strong> {patient.name || "Patient"}</p>
              <p><strong>Doctor:</strong> {booking.doctorName}</p>
              <p><strong>Room:</strong> {booking.room}</p>
              <p><strong>Date & Time:</strong> {booking.date} at {booking.time}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-4">
          <Link href="/queue" className="block w-full">
            <Button variant="primary" size="xl">
              See Queue Status
            </Button>
          </Link>

          <Link href="/patient" className="block w-full">
            <Button variant="outline" size="lg">
              Return to Patient Home
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
