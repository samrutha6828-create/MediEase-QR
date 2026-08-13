"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { usePatient } from "@/context/PatientContext";
import { fetchApi } from "@/lib/api-client";

export default function IdentifyPage() {
  const router = useRouter();
  const { patient, setPatientData } = usePatient();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState(patient.name || "");
  const [phone, setPhone] = useState(patient.phone || "");
  const [age, setAge] = useState(patient.age || "");
  const [otpCode, setOtpCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Step 1: Send OTP to Phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a 10-digit mobile number.");
      return;
    }

    setError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const res = await fetchApi<{ success: boolean; devOtp?: string; message?: string }>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone: cleanPhone }),
      });

      setIsLoading(false);

      if (res.success && res.data) {
        setStep("otp");
        setCooldown(30);
        if (res.data.devOtp) {
          setDevCode(res.data.devOtp);
          setInfoMessage(`Code sent. (Dev Code: ${res.data.devOtp})`);
        } else {
          setInfoMessage("Verification code sent to your mobile.");
        }
      } else {
        setError(res.error || "Could not send verification code. Please try again.");
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetchApi<{ verified: boolean; patient: any }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
          code: otpCode.trim(),
          name: name.trim() || undefined,
          age: age ? parseInt(age.toString(), 10) : undefined,
        }),
      });

      setIsLoading(false);

      if (res.success && res.data?.verified && res.data.patient) {
        const p = res.data.patient;
        setPatientData({
          id: p.id,
          name: p.name,
          phone: p.phone,
          age: p.age ? p.age.toString() : "",
          patientId: p.patientId,
          hospitalCode: "MEDIEASE-HOSP-01",
        });

        router.push("/patient");
      } else {
        setError(res.error || "Incorrect code. Please check and try again.");
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  };

  return (
    <PageContainer
      title={step === "phone" ? "Patient Sign In" : "Enter Verification Code"}
      subtitle={
        step === "phone"
          ? "Enter your mobile number to sign in."
          : `We sent a 6-digit code to ${phone}`
      }
      stepIndicator={step === "phone" ? "Step 1 of 2" : "Step 2 of 2"}
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <Card className="space-y-5">
              <Input
                label="Mobile Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                type="tel"
                maxLength={10}
                required
              />

              <Input
                label="Your Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mary Smith"
              />

              <Input
                label="Your Age (Optional)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 68"
                type="number"
              />

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 font-bold text-base">
                  {error}
                </div>
              )}
            </Card>

            <Button type="submit" variant="primary" size="xl" isLoading={isLoading}>
              Send Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <Card className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xl font-bold text-slate-900">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-3xl sm:text-4xl tracking-widest font-black p-4 rounded-2xl border-3 border-slate-300 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  autoFocus
                  required
                />
              </div>

              {infoMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-sm text-center">
                  {infoMessage}
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 font-bold text-base">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                  className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                >
                  Change Phone Number
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={cooldown > 0 || isLoading}
                  className={`font-bold cursor-pointer ${
                    cooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-emerald-700 hover:underline"
                  }`}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
                </button>
              </div>
            </Card>

            <Button type="submit" variant="primary" size="xl" isLoading={isLoading}>
              Verify & Continue
            </Button>
          </form>
        )}
      </div>
    </PageContainer>
  );
}
