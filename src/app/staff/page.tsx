"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackState";

export interface QueueItem {
  id: string;
  queueToken: string;
  position: number;
  status: "WAITING" | "SERVING" | "COMPLETED" | "CANCELLED";
  appointment: {
    id: string;
    appointmentNumber: string;
    date: string;
    time: string;
    patient: {
      name: string;
      phone: string;
      age?: number;
    };
    doctor: {
      name: string;
      department: string;
      room: string;
    };
  };
}

export interface AssistanceAlert {
  id: string;
  requestType: string;
  status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
  createdAt: string;
  patient?: {
    name: string;
    phone: string;
  };
}

export interface StaffData {
  hospital: {
    name: string;
    code: string;
  };
  counts: {
    total: number;
    waiting: number;
    serving: number;
    completed: number;
    cancelled: number;
  };
  currentlyServing: QueueItem | null;
  nextInLine: QueueItem | null;
  queueItems: QueueItem[];
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StaffData | null>(null);
  const [assistanceAlerts, setAssistanceAlerts] = useState<AssistanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callingNext, setCallingNext] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "WAITING" | "SERVING" | "COMPLETED" | "CANCELLED">("ALL");

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const getStaffKey = () => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("staffAccessKey") || "";
  };

  const loadStaffData = async () => {
    const key = getStaffKey();
    if (!key) {
      router.push("/staff/login");
      return;
    }

    try {
      // 1. Fetch Queue Data
      const resQueue = await fetch("/api/staff/queue", {
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": key,
        },
      });

      if (resQueue.status === 401) {
        sessionStorage.removeItem("staffAccessKey");
        router.push("/staff/login");
        return;
      }

      const jsonQueue = await resQueue.json();
      if (jsonQueue.success && jsonQueue.data) {
        setData(jsonQueue.data);
      } else {
        setError(jsonQueue.error || "Failed to load dashboard data");
      }

      // 2. Fetch Assistance Alerts
      const resAssist = await fetch("/api/staff/assistance", {
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": key,
        },
      });
      const jsonAssist = await resAssist.json();
      if (jsonAssist.success && jsonAssist.data) {
        setAssistanceAlerts(jsonAssist.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
    const interval = setInterval(loadStaffData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    const key = getStaffKey();
    if (!key) return;

    setCallingNext(true);
    try {
      const res = await fetch("/api/staff/queue/call-next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": key,
        },
      });

      const json = await res.json();
      if (json.success) {
        await loadStaffData();
      } else {
        alert(json.error || "Failed to call next patient");
      }
    } catch {
      alert("Error calling next patient");
    } finally {
      setCallingNext(false);
    }
  };

  const handleUpdateStatus = async (queueItemId: string, newStatus: string) => {
    const key = getStaffKey();
    if (!key) return;

    try {
      const res = await fetch("/api/staff/queue/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": key,
        },
        body: JSON.stringify({ queueItemId, status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        await loadStaffData();
      } else {
        alert(json.error || "Failed to update status");
      }
    } catch {
      alert("Error updating status");
    }
  };

  const handleUpdateAssistance = async (requestId: string, newStatus: string) => {
    const key = getStaffKey();
    if (!key) return;

    try {
      const res = await fetch("/api/staff/assistance/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-access-key": key,
        },
        body: JSON.stringify({ requestId, status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        await loadStaffData();
      } else {
        alert(json.error || "Failed to update assistance status");
      }
    } catch {
      alert("Error updating assistance status");
    }
  };

  const handleShowQrModal = async () => {
    setShowQrModal(true);
    setQrLoading(true);
    const key = getStaffKey();

    try {
      const res = await fetch(`/api/hospitals/qr/generate?code=${data?.hospital.code || "MEDIEASE-HOSP-01"}`, {
        headers: { "x-staff-access-key": key },
      });
      const json = await res.json();
      if (json.success && json.data?.qrDataUrl) {
        setQrDataUrl(json.data.qrDataUrl);
      }
    } catch (err) {
      console.error("QR Generate Error:", err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("staffAccessKey");
    router.push("/staff/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <LoadingState message="Loading staff portal..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <ErrorState
          title="Staff Portal"
          message={error || "Could not load staff data"}
          onRetry={loadStaffData}
        />
      </div>
    );
  }

  const activeAssistanceAlerts = assistanceAlerts.filter(
    (a) => a.status === "PENDING" || a.status === "ACKNOWLEDGED"
  );

  const filteredItems = data.queueItems.filter((item) => {
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navigation (Clean, no emojis) */}
      <header className="bg-slate-800 border-b border-slate-700 py-3.5 px-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" variant="dark" showText={true} />
            <div className="hidden sm:block border-l border-slate-700 pl-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Staff Control Desk
              </p>
              <p className="text-sm font-bold text-slate-200">
                {data.hospital.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShowQrModal}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white text-xs border border-slate-600 cursor-pointer"
            >
              Hospital QR Code
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-slate-200 text-xs border border-slate-600 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="bg-slate-800 border-slate-700 p-4 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Today</p>
            <p className="text-3xl font-black text-white mt-1">{data.counts.total}</p>
          </Card>
          <Card className="bg-sky-950/60 border-sky-800 p-4 text-center">
            <p className="text-xs font-bold text-sky-400 uppercase">Waiting</p>
            <p className="text-3xl font-black text-sky-300 mt-1">{data.counts.waiting}</p>
          </Card>
          <Card className="bg-emerald-950/60 border-emerald-800 p-4 text-center">
            <p className="text-xs font-bold text-emerald-400 uppercase">Now Serving</p>
            <p className="text-3xl font-black text-emerald-300 mt-1">{data.counts.serving}</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
            <p className="text-3xl font-black text-slate-200 mt-1">{data.counts.completed}</p>
          </Card>
          <Card className="bg-rose-950/60 border-rose-900 p-4 text-center">
            <p className="text-xs font-bold text-rose-400 uppercase">Help Requests</p>
            <p className="text-3xl font-black text-rose-300 mt-1">{activeAssistanceAlerts.length}</p>
          </Card>
        </div>

        {/* Assistance Alerts Section */}
        {activeAssistanceAlerts.length > 0 && (
          <Card className="bg-amber-950/80 border-2 border-amber-500 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-amber-800/80 pb-2.5">
              <h2 className="text-lg font-black text-amber-200">
                Help Requests ({activeAssistanceAlerts.length})
              </h2>
              <Badge variant="warning" size="md">URGENT</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAssistanceAlerts.map((alert) => (
                <div key={alert.id} className="bg-slate-900 p-4 rounded-2xl border border-amber-600/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-300 text-base">
                      {alert.requestType}
                    </span>
                    <Badge variant={alert.status === "ACKNOWLEDGED" ? "success" : "warning"} size="md">
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm">
                    <strong>Patient:</strong> {alert.patient ? alert.patient.name : "Hardware Device Button"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Time: {new Date(alert.createdAt).toLocaleTimeString()}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {alert.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateAssistance(alert.id, "ACKNOWLEDGED")}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateAssistance(alert.id, "RESOLVED")}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Primary Action Control & Active Patient Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Call Next Button Box */}
          <Card className="bg-slate-800 border-2 border-emerald-600 p-6 flex flex-col justify-between space-y-4 shadow-md">
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800">
                Queue Control
              </span>
              <h2 className="text-2xl font-black text-white">Call Next</h2>
              <p className="text-slate-300 text-sm font-medium">
                {data.nextInLine
                  ? `Next: ${data.nextInLine.appointment.patient.name} (Token ${data.nextInLine.queueToken})`
                  : "No patients currently waiting."}
              </p>
            </div>

            <Button
              variant="primary"
              size="xl"
              onClick={handleCallNext}
              isLoading={callingNext}
              disabled={data.counts.waiting === 0}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xl h-16 shadow-lg"
            >
              Call Next Patient
            </Button>
          </Card>

          {/* Currently Serving Spotlight */}
          <Card className="md:col-span-2 bg-slate-800 border-2 border-slate-700 p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-lg font-bold text-white">
                Now Serving
              </h2>
              {data.currentlyServing ? (
                <Badge variant="success" size="lg">IN PROGRESS</Badge>
              ) : (
                <Badge variant="neutral" size="lg">DESK IDLE</Badge>
              )}
            </div>

            {data.currentlyServing ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Queue Token</span>
                    <p className="text-4xl font-black text-emerald-400">{data.currentlyServing.queueToken}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Patient</span>
                    <p className="text-2xl font-extrabold text-white">
                      {data.currentlyServing.appointment.patient.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      Phone: {data.currentlyServing.appointment.patient.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Doctor & Room</span>
                    <p className="text-lg font-bold text-slate-200">
                      {data.currentlyServing.appointment.doctor.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {data.currentlyServing.appointment.doctor.room}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => handleUpdateStatus(data.currentlyServing!.id, "COMPLETED")}
                  >
                    Complete Visit
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => handleUpdateStatus(data.currentlyServing!.id, "CANCELLED")}
                  >
                    Cancel Visit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-base font-medium">
                No patient is currently inside the consultation room. Click <strong>&quot;Call Next Patient&quot;</strong> to advance.
              </div>
            )}
          </Card>
        </div>

        {/* Queue Table Section */}
        <Card className="bg-slate-800 border border-slate-700 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-white">Today&apos;s Queue</h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
              {(["ALL", "WAITING", "SERVING", "COMPLETED", "CANCELLED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    filter === tab
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Room</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-200 font-medium">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-black text-xl text-emerald-400">{item.queueToken}</span>
                        <span className="text-xs text-slate-500 block font-mono">
                          {item.appointment.appointmentNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-base">
                          {item.appointment.patient.name}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {item.appointment.patient.phone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200">
                          {item.appointment.doctor.name}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {item.appointment.doctor.room}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-300">
                        {item.appointment.time}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            item.status === "SERVING"
                              ? "success"
                              : item.status === "WAITING"
                              ? "info"
                              : item.status === "COMPLETED"
                              ? "neutral"
                              : "error"
                          }
                          size="md"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "WAITING" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "SERVING")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Call
                            </button>
                          )}
                          {item.status === "SERVING" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "COMPLETED")}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          {item.status !== "CANCELLED" && item.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
                              className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No queue items found matching filter &quot;{filter}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Hospital QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="bg-white text-slate-900 max-w-sm w-full p-6 space-y-5 text-center rounded-3xl shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900">
              Hospital QR Code
            </h3>
            <p className="text-slate-600 text-sm font-medium">
              Official QR code for patient entrance check-in.
            </p>

            {qrLoading ? (
              <LoadingState message="Generating QR code..." />
            ) : qrDataUrl ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Official Hospital QR Code"
                  className="w-56 h-56 mx-auto border-4 border-slate-900 rounded-2xl shadow-md"
                />
              </div>
            ) : (
              <p className="text-rose-600 font-bold">Failed to load QR code</p>
            )}

            <Button variant="secondary" size="lg" onClick={() => setShowQrModal(false)}>
              Close View
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
