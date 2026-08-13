"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";

export default function IotTestPage() {
  const [deviceCode, setDeviceCode] = useState("ESP32-WAITING-ROOM-A");
  const [requestType, setRequestType] = useState("Wheelchair Support");
  const [hospitalCode, setHospitalCode] = useState("MEDIEASE-HOSP-01");
  const [deviceSecret, setDeviceSecret] = useState("mediease-iot-secret-key-2026");

  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSimulateIotButton = async () => {
    setIsLoading(true);
    setError("");
    setLastResponse(null);

    try {
      // Calls the EXACT same backend endpoint that the physical ESP32 microcontrollers call
      const res = await fetch("/api/iot/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-iot-device-token": deviceSecret,
        },
        body: JSON.stringify({
          deviceCode,
          requestType,
          hospitalCode,
        }),
      });

      const json = await res.json();
      if (res.status === 200 || res.status === 201) {
        setLastResponse(json);
      } else {
        setError(json.error || `HTTP error ${res.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger IoT webhook");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4">
        <Logo size="sm" variant="dark" showText={true} />
        <Badge variant="warning" size="md">IoT Test Console</Badge>
      </header>

      <main className="max-w-3xl mx-auto w-full py-8 space-y-6">
        <Card className="bg-slate-800 border-2 border-slate-700 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Hardware Trigger Simulation</h2>
            <p className="text-slate-300 text-sm">
              Sends an authenticated HTTP POST request to{" "}
              <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono text-xs">
                POST /api/iot/assistance
              </code>
              , simulating an ESP32 physical button event.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                ESP32 Device Code
              </label>
              <input
                type="text"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl font-mono text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Hospital Code
              </label>
              <input
                type="text"
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl font-mono text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Assistance Request Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none"
              >
                <option value="Wheelchair Support">Wheelchair Support</option>
                <option value="Navigation Guide">Navigation Guide</option>
                <option value="Nurse Call Button">Nurse Call Button</option>
                <option value="Emergency Alert">Emergency Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                IoT Secret Key Header
              </label>
              <input
                type="password"
                value={deviceSecret}
                onChange={(e) => setDeviceSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl font-mono text-sm focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="xl"
              onClick={handleSimulateIotButton}
              isLoading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-lg w-full h-16 shadow-md cursor-pointer"
            >
              Simulate Hardware Button Press
            </Button>
          </div>
        </Card>

        {/* Live Result Feedback Card */}
        {lastResponse && (
          <Card className="bg-emerald-950/80 border-2 border-emerald-500 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-200">
                IoT Webhook Accepted (HTTP 201)
              </h3>
              <Badge variant="success" size="md">Saved to Database</Badge>
            </div>
            <p className="text-slate-300 text-sm">
              The request was saved to the central database and is now visible on both the{" "}
              <strong>Staff Dashboard</strong> and the <strong>Assistance Queue</strong>.
            </p>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-emerald-800/60">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </Card>
        )}

        {error && (
          <Card className="bg-rose-950/80 border-2 border-rose-500 p-6 space-y-2">
            <h3 className="text-lg font-black text-rose-200">IoT Webhook Error</h3>
            <p className="text-rose-300 text-sm font-semibold">{error}</p>
          </Card>
        )}

        {/* Navigation to other operational views */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href="/assistance">
            <Button variant="outline" size="md">
              Open Assistance View (/assistance)
            </Button>
          </Link>
          <Link href="/staff">
            <Button variant="outline" size="md">
              Open Staff Portal (/staff)
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        MediEase IoT Testing Console • Direct POST to /api/iot/assistance
      </footer>
    </div>
  );
}
