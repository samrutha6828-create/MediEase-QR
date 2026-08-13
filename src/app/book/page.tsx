"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OptionCard } from "@/components/ui/OptionCard";
import { DatePicker } from "@/components/ui/DatePicker";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackState";
import { usePatient } from "@/context/PatientContext";
import { fetchApi } from "@/lib/api-client";

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialty: string;
  room: string;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export default function BookPage() {
  const router = useRouter();
  const { patient, bookAppointmentApi } = usePatient();

  const [currentStep, setCurrentStep] = useState<"doctor" | "date" | "time" | "review">("doctor");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Today as default date
  const today = new Date();
  const defaultDateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  const [selectedDateStr, setSelectedDateStr] = useState(defaultDateStr);
  const [selectedDateDisplay, setSelectedDateDisplay] = useState(
    today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  );

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // 1. Fetch real doctors from Backend API
  useEffect(() => {
    async function loadDoctors() {
      setLoadingDoctors(true);
      const res = await fetchApi<Doctor[]>("/doctors");
      if (res.success && res.data && res.data.length > 0) {
        setDoctors(res.data);
        setSelectedDoctor(res.data[0]);
      } else {
        setDoctorsError(res.error || "Could not load doctors");
      }
      setLoadingDoctors(false);
    }
    loadDoctors();
  }, []);

  // 2. Fetch real slot availability when Doctor or Date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDateStr) return;
    const docId = selectedDoctor.id;

    async function loadSlotAvailability() {
      setLoadingSlots(true);
      const res = await fetchApi<any>(`/doctors/${docId}/availability?date=${encodeURIComponent(selectedDateStr)}`);
      if (res.success && res.data?.slots) {
        const slots: TimeSlot[] = res.data.slots;
        setTimeSlots(slots);
        const firstAvailable = slots.find((s) => s.isAvailable);
        if (firstAvailable) {
          setSelectedTime(firstAvailable.time);
        } else {
          setSelectedTime("");
        }
      }
      setLoadingSlots(false);
    }

    loadSlotAvailability();
  }, [selectedDoctor, selectedDateStr]);

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedTime) {
      setBookingError("Please select a doctor and time.");
      return;
    }

    setBookingError("");
    setIsSubmitting(true);

    try {
      await bookAppointmentApi(selectedDoctor.id, selectedDateStr, selectedTime);
      setIsSubmitting(false);
      router.push("/confirmation");
    } catch (err) {
      setIsSubmitting(false);
      setBookingError(err instanceof Error ? err.message : "Failed to book. Please try another time.");
    }
  };

  if (loadingDoctors) {
    return (
      <PageContainer title="Book Appointment" showBack={true}>
        <LoadingState message="Loading doctors..." />
      </PageContainer>
    );
  }

  if (doctorsError || doctors.length === 0) {
    return (
      <PageContainer title="Book Appointment" showBack={true}>
        <ErrorState
          title="No Doctors Available"
          message={doctorsError || "Please check with reception desk."}
          onRetry={() => window.location.reload()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={
        currentStep === "doctor"
          ? "Choose a Doctor"
          : currentStep === "date"
          ? "Choose a Date"
          : currentStep === "time"
          ? "Choose a Time"
          : "Confirm Appointment"
      }
      subtitle={
        currentStep === "doctor"
          ? "Select a doctor below."
          : currentStep === "date"
          ? "Select any date within the next 6 months."
          : "Select an available time slot."
      }
      stepIndicator={
        currentStep === "doctor"
          ? "Step 1 of 4"
          : currentStep === "date"
          ? "Step 2 of 4"
          : currentStep === "time"
          ? "Step 3 of 4"
          : "Step 4 of 4"
      }
      showBack={true}
    >
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        {/* Selected Context Summary Bar */}
        {currentStep !== "doctor" && selectedDoctor && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-950 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Selected:
            </p>
            <p className="text-base font-bold flex flex-wrap gap-x-4 gap-y-1 text-slate-900">
              <span>{selectedDoctor.name} ({selectedDoctor.department})</span>
              {currentStep !== "date" && <span>Date: {selectedDateDisplay}</span>}
              {currentStep === "review" && <span>Time: {selectedTime}</span>}
            </p>
          </div>
        )}

        {/* Step 1: Select Doctor */}
        {currentStep === "doctor" && (
          <div className="space-y-3">
            {doctors.map((doc) => (
              <OptionCard
                key={doc.id}
                title={doc.name}
                subtitle={`${doc.department} • Room ${doc.room}`}
                selected={selectedDoctor?.id === doc.id}
                onClick={() => setSelectedDoctor(doc)}
              />
            ))}
          </div>
        )}

        {/* Step 2: Select Date via 6-Month Visual Calendar */}
        {currentStep === "date" && (
          <div className="space-y-4">
            <DatePicker
              selectedDate={selectedDateStr}
              onSelectDate={(dateStr, displayLabel) => {
                setSelectedDateStr(dateStr);
                setSelectedDateDisplay(displayLabel);
              }}
            />
          </div>
        )}

        {/* Step 3: Select Time Slot */}
        {currentStep === "time" && (
          <div className="space-y-4">
            {loadingSlots ? (
              <LoadingState message="Checking available times..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`p-5 rounded-2xl border-3 text-left font-black text-xl transition-all ${
                      !slot.isAvailable
                        ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                        : selectedTime === slot.time
                        ? "bg-emerald-600 border-emerald-700 text-white shadow-md cursor-pointer"
                        : "bg-white border-slate-300 text-slate-800 hover:border-slate-400 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{slot.time}</span>
                      {!slot.isAvailable && (
                        <span className="text-xs uppercase px-2 py-0.5 bg-rose-100 text-rose-900 rounded-md font-bold">
                          Booked
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review Booking */}
        {currentStep === "review" && selectedDoctor && (
          <Card variant="highlight" className="space-y-4 border-2 border-emerald-300">
            <h3 className="text-2xl font-black text-slate-900 border-b border-emerald-200 pb-2">
              Appointment Summary
            </h3>

            <div className="space-y-2.5 text-lg text-slate-800">
              <p><strong>Patient:</strong> {patient.name || "Patient"}</p>
              <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
              <p><strong>Department:</strong> {selectedDoctor.department}</p>
              <p><strong>Room:</strong> {selectedDoctor.room}</p>
              <p><strong>Date:</strong> {selectedDateDisplay}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
            </div>

            {bookingError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 font-bold text-lg">
                {bookingError}
              </div>
            )}
          </Card>
        )}

        {/* Navigation Action Buttons */}
        <div className="space-y-3 pt-4">
          {currentStep === "doctor" && (
            <Button
              variant="primary"
              size="xl"
              onClick={() => setCurrentStep("date")}
            >
              Choose Date
            </Button>
          )}

          {currentStep === "date" && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="xl"
                onClick={() => setCurrentStep("time")}
              >
                Choose Time
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("doctor")}
              >
                Back
              </Button>
            </div>
          )}

          {currentStep === "time" && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="xl"
                disabled={!selectedTime}
                onClick={() => setCurrentStep("review")}
              >
                Review & Confirm
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("date")}
              >
                Back
              </Button>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="xl"
                onClick={handleConfirm}
                isLoading={isSubmitting}
              >
                Confirm Appointment
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("time")}
                disabled={isSubmitting}
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
