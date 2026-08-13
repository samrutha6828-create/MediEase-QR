"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/FeedbackState";
import { fetchApi } from "@/lib/api-client";

function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCodeParam = searchParams.get("code") || "MEDIEASE-HOSP-01";

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function verifyQrCode() {
      const res = await fetchApi<any>(`/hospitals/qr?code=${encodeURIComponent(qrCodeParam)}`);
      if (res.success && res.data) {
        setHospitalName(res.data.name);
      } else {
        setError("QR code not found. Please ask desk staff.");
      }
    }
    verifyQrCode();
  }, [qrCodeParam]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setError("");
    setTimeout(async () => {
      const res = await fetchApi<any>(`/hospitals/qr?code=${encodeURIComponent(qrCodeParam)}`);
      setIsScanning(false);

      if (res.success && res.data) {
        setHospitalName(res.data.name);
        setScanSuccess(true);
        setTimeout(() => {
          router.push("/identify");
        }, 800);
      } else {
        setError("Invalid QR code. Please try again.");
      }
    }, 800);
  };

  return (
    <PageContainer
      title="Hospital Check-In"
      subtitle={hospitalName ? hospitalName : "Scan your hospital QR code."}
      stepIndicator="Step 1 of 4"
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <Card className="text-center p-6 sm:p-8 space-y-6">
          <div className="relative w-44 h-44 mx-auto bg-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center border-4 border-emerald-600 shadow-xl overflow-hidden">
            {scanSuccess ? (
              <div className="text-emerald-400 space-y-2">
                <svg className="w-16 h-16 mx-auto text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg font-bold text-white">Checked In</p>
              </div>
            ) : isScanning ? (
              <div className="space-y-3">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto" />
                <p className="text-emerald-200 font-bold text-base">Reading Code...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-14 h-14 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <div className="w-20 h-1 bg-emerald-400 rounded-full mx-auto animate-pulse" />
                <p className="text-slate-300 text-sm font-medium">Hold up QR code</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">
              {hospitalName ? hospitalName : "Scan QR Code"}
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Hold your ticket up to the scanner.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 font-bold text-base">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="xl"
            onClick={handleSimulateScan}
            isLoading={isScanning}
          >
            {scanSuccess ? "Opening..." : "Scan QR Code"}
          </Button>
        </Card>

        <div className="space-y-3 pt-2">
          <p className="text-center font-bold text-slate-700 text-lg">
            No QR Code?
          </p>
          <Link href="/identify" className="block w-full">
            <Button variant="outline" size="lg">
              Sign In with Mobile Number
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <EntryContent />
    </Suspense>
  );
}
