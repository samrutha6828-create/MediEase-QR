"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { usePatient } from "@/context/PatientContext";

export default function QueuePage() {
  const { queue, refreshQueueApi } = usePatient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll patient queue status every 5 seconds
  const loadQueueData = async () => {
    await refreshQueueApi();
  };

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadQueueData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <PageContainer
      title="Queue Status"
      subtitle="Follow your queue number in real-time."
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Main Status Banner (No emojis) */}
          <Card
            variant="highlight"
            className={`p-6 text-center space-y-4 border-3 ${
              queue.status === "Serving"
                ? "bg-emerald-50 border-emerald-500 animate-pulse"
                : queue.status === "Next in Line"
                ? "bg-amber-50 border-amber-400"
                : "bg-slate-50 border-slate-300"
            }`}
          >
            <div className="flex items-center justify-center">
              <Badge
                variant={
                  queue.status === "Serving"
                    ? "success"
                    : queue.status === "Next in Line"
                    ? "warning"
                    : "info"
                }
                size="lg"
              >
                {queue.status === "Serving"
                  ? "YOUR TURN"
                  : queue.status === "Next in Line"
                  ? "NEXT IN LINE"
                  : "WAITING"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Number</p>
                <p className="text-4xl font-black text-emerald-800">{queue.token}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Now Serving</p>
                <p className="text-4xl font-black text-slate-900">{queue.servingToken}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-1">
              <p className="text-2xl font-black text-slate-900">
                {queue.patientsAhead === 0 && queue.status === "Serving"
                  ? "Please enter the doctor room now."
                  : queue.patientsAhead <= 1
                  ? "Please be ready near the room."
                  : `${queue.patientsAhead} people ahead of you.`}
              </p>
              <p className="text-base font-bold text-slate-600">
                Estimated Wait: {queue.estimatedWait}
              </p>
            </div>
          </Card>

          {/* Location Card */}
          <Card className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Room Location
            </h3>
            <p className="text-2xl font-black text-slate-900">
              {queue.room}
            </p>
            <p className="text-sm text-slate-600">
              Please take a seat in the waiting area. Updates automatically.
            </p>
          </Card>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
          >
            Refresh Status
          </Button>

          <Link href="/assistance" className="block w-full">
            <Button variant="primary" size="xl">
              Get Help
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
