"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OptionCard } from "@/components/ui/OptionCard";
import { Badge } from "@/components/ui/Badge";
import { usePatient } from "@/context/PatientContext";
import { fetchApi } from "@/lib/api-client";

export interface AssistanceItem {
  id: string;
  requestType: string;
  status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
  createdAt: string;
  patient?: {
    name: string;
    phone: string;
  };
}

export default function AssistancePage() {
  const { patient } = usePatient();
  const [selectedType, setSelectedType] = useState("Wheelchair Support");
  const [activePatientRequest, setActivePatientRequest] = useState<any>(null);
  const [allRequests, setAllRequests] = useState<AssistanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"patient" | "operational">("operational");

  // If patient has an active session with an ID, default view to patient help
  useEffect(() => {
    if (patient.id) {
      setViewMode("patient");
    }
  }, [patient.id]);

  // Poll for both patient status and active hospital requests list
  const loadAssistanceData = async () => {
    if (patient.id) {
      const res = await fetchApi<any>(`/assistance?patientId=${patient.id}`);
      if (res.success && res.data) {
        setActivePatientRequest(res.data);
      } else {
        setActivePatientRequest(null);
      }
    }

    try {
      const staffKey = typeof window !== "undefined" ? sessionStorage.getItem("staffAccessKey") || "mediease-staff-2026" : "mediease-staff-2026";
      const resAll = await fetch("/api/staff/assistance", {
        headers: { "x-staff-access-key": staffKey },
      });
      const jsonAll = await resAll.json();
      if (jsonAll.success && jsonAll.data) {
        setAllRequests(jsonAll.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadAssistanceData();
    const interval = setInterval(loadAssistanceData, 4000);
    return () => clearInterval(interval);
  }, [patient.id]);

  const handleRequestHelp = async () => {
    setError("");
    setIsLoading(true);

    const res = await fetchApi<any>("/assistance", {
      method: "POST",
      body: JSON.stringify({
        patientId: patient.id || undefined,
        requestType: selectedType,
        hospitalCode: "MEDIEASE-HOSP-01",
      }),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      setActivePatientRequest(res.data);
      await loadAssistanceData();
    } else {
      setError(res.error || "Failed to request help");
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    const staffKey = typeof window !== "undefined" ? sessionStorage.getItem("staffAccessKey") || "mediease-staff-2026" : "mediease-staff-2026";
    try {
      const res = await fetch("/api/staff/assistance/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": staffKey,
        },
        body: JSON.stringify({ requestId, status }),
      });
      const json = await res.json();
      if (json.success) {
        await loadAssistanceData();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <PageContainer
      title="Hospital Assistance"
      subtitle="Request immediate help or manage active assistance alerts."
      showBack={true}
      showHelp={false}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        {/* View Mode Switcher */}
        <div className="flex items-center justify-center gap-2 bg-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewMode("operational")}
            className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all ${
              viewMode === "operational"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Operational View ({allRequests.length})
          </button>
          <button
            onClick={() => setViewMode("patient")}
            className={`px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all ${
              viewMode === "patient"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Patient View
          </button>
        </div>

        {/* 1. OPERATIONAL VIEW (Clean list without internal IDs or emojis) */}
        {viewMode === "operational" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Active Help Requests ({allRequests.length})
              </h3>
              <button
                onClick={loadAssistanceData}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {allRequests.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 space-y-1 border-2 border-slate-200">
                <p className="text-lg font-bold text-slate-800">No active assistance requests</p>
                <p className="text-sm">Requests triggered by patients or IoT buttons will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {allRequests.map((req) => (
                  <Card
                    key={req.id}
                    className={`p-5 space-y-3 border-2 ${
                      req.status === "ACKNOWLEDGED"
                        ? "border-emerald-400 bg-emerald-50/40"
                        : req.status === "PENDING"
                        ? "border-amber-400 bg-amber-50/40"
                        : "border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900">
                        {req.requestType}
                      </span>
                      <Badge
                        variant={
                          req.status === "ACKNOWLEDGED"
                            ? "success"
                            : req.status === "PENDING"
                            ? "warning"
                            : "neutral"
                        }
                        size="md"
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-slate-700 space-y-0.5">
                      <p>
                        <strong>Patient / Source:</strong> {req.patient ? `${req.patient.name} (${req.patient.phone})` : "Physical Hardware Button"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Requested: {new Date(req.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      {req.status === "PENDING" && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "ACKNOWLEDGED")}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      {req.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "RESOLVED")}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. PATIENT VIEW (Simple, calm, no emojis) */}
        {viewMode === "patient" && (
          <div className="space-y-6">
            {activePatientRequest && activePatientRequest.status !== "RESOLVED" ? (
              <Card
                variant="highlight"
                className={`p-8 text-center space-y-4 border-3 ${
                  activePatientRequest.status === "ACKNOWLEDGED"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-amber-400 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-center">
                  <Badge
                    variant={activePatientRequest.status === "ACKNOWLEDGED" ? "success" : "warning"}
                    size="lg"
                  >
                    {activePatientRequest.status === "ACKNOWLEDGED" ? "STAFF EN ROUTE" : "NOTIFIED"}
                  </Badge>
                </div>

                <h2 className="text-3xl font-black text-slate-900">
                  {activePatientRequest.status === "ACKNOWLEDGED"
                    ? "Staff is on their way."
                    : "Help Is Coming"}
                </h2>

                <p className="text-xl text-slate-800 leading-relaxed font-bold">
                  Hospital staff have been alerted for <strong>{activePatientRequest.requestType}</strong>.
                  Please stay seated.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Select what you need help with:
                </h3>

                <div className="space-y-3">
                  <OptionCard
                    title="Wheelchair Support"
                    subtitle="Assistance with wheelchair"
                    selected={selectedType === "Wheelchair Support"}
                    onClick={() => setSelectedType("Wheelchair Support")}
                  />
                  <OptionCard
                    title="Navigation Guide"
                    subtitle="Directions to doctor room"
                    selected={selectedType === "Navigation Guide"}
                    onClick={() => setSelectedType("Navigation Guide")}
                  />
                  <OptionCard
                    title="General Assistance"
                    subtitle="Speak with desk attendant"
                    selected={selectedType === "General Assistance"}
                    onClick={() => setSelectedType("General Assistance")}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 font-bold text-base">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="danger"
                    size="xl"
                    onClick={handleRequestHelp}
                    isLoading={isLoading}
                  >
                    Request Staff Help
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <Link href="/patient" className="block w-full">
            <Button variant="ghost" size="lg">
              Return to Patient Home
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
