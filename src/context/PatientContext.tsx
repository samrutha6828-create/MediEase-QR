"use client";

import React, { createContext, useContext, useState } from "react";
import { fetchApi } from "@/lib/api-client";

export interface PatientInfo {
  id?: string;
  name: string;
  phone: string;
  age: string;
  patientId: string;
  hospitalCode?: string;
}

export interface BookingInfo {
  id?: string;
  appointmentNumber?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  room: string;
  date: string;
  time: string;
  token: string;
}

export interface QueueInfo {
  appointmentId?: string;
  token: string;
  servingToken: string;
  patientsAhead: number;
  room: string;
  estimatedWait: string;
  status: "Waiting" | "Next in Line" | "Serving" | "Completed";
}

interface PatientContextType {
  patient: PatientInfo;
  setPatient: React.Dispatch<React.SetStateAction<PatientInfo>>;
  setPatientData: (data: Partial<PatientInfo>) => void;
  booking: BookingInfo;
  setBooking: React.Dispatch<React.SetStateAction<BookingInfo>>;
  queue: QueueInfo;
  setQueue: React.Dispatch<React.SetStateAction<QueueInfo>>;
  assistanceHelpType: string;
  setAssistanceHelpType: (type: string) => void;
  assistanceAlertSent: boolean;
  setAssistanceAlertSent: (sent: boolean) => void;
  identifyPatientApi: (name: string, phone: string, age?: string) => Promise<PatientInfo>;
  bookAppointmentApi: (doctorId: string, date: string, time: string) => Promise<BookingInfo>;
  refreshQueueApi: (appointmentId?: string) => Promise<QueueInfo>;
}

const defaultPatient: PatientInfo = {
  name: "Mary Smith",
  phone: "9876543210",
  age: "68",
  patientId: "ME-84920",
};

const defaultBooking: BookingInfo = {
  doctorId: "doc-1",
  doctorName: "Dr. Sarah Smith",
  department: "General Medicine",
  room: "Room 102",
  date: "Today",
  time: "10:30 AM",
  token: "A-24",
};

const defaultQueue: QueueInfo = {
  token: "A-24",
  servingToken: "A-21",
  patientsAhead: 3,
  room: "Room 102",
  estimatedWait: "~15 mins",
  status: "Waiting",
};

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patient, setPatient] = useState<PatientInfo>(defaultPatient);
  const [booking, setBooking] = useState<BookingInfo>(defaultBooking);
  const [queue, setQueue] = useState<QueueInfo>(defaultQueue);
  const [assistanceHelpType, setAssistanceHelpType] = useState<string>("Wheelchair Support");
  const [assistanceAlertSent, setAssistanceAlertSent] = useState<boolean>(false);

  const setPatientData = (data: Partial<PatientInfo>) => {
    setPatient((prev) => ({ ...prev, ...data }));
  };

  // Real Backend Integration Method 1: Patient Identification
  const identifyPatientApi = async (name: string, phone: string, age?: string): Promise<PatientInfo> => {
    const res = await fetchApi<PatientInfo>("/patients", {
      method: "POST",
      body: JSON.stringify({ name, phone, age }),
    });

    if (res.success && res.data) {
      const updatedPatient: PatientInfo = {
        id: res.data.id,
        name: res.data.name,
        phone: res.data.phone,
        age: res.data.age ? String(res.data.age) : age || "",
        patientId: res.data.patientId,
      };
      setPatient(updatedPatient);
      return updatedPatient;
    } else {
      throw new Error(res.error || "Failed to identify patient");
    }
  };

  // Real Backend Integration Method 2: Appointment Booking
  const bookAppointmentApi = async (doctorId: string, date: string, time: string): Promise<BookingInfo> => {
    if (!patient.id) {
      await identifyPatientApi(patient.name, patient.phone, patient.age);
    }

    const res = await fetchApi<any>("/appointments", {
      method: "POST",
      body: JSON.stringify({
        patientId: patient.id,
        doctorId,
        date,
        time,
      }),
    });

    if (res.success && res.data) {
      const appt = res.data;
      const updatedBooking: BookingInfo = {
        id: appt.id,
        appointmentNumber: appt.appointmentNumber,
        doctorId: appt.doctor.id,
        doctorName: appt.doctor.name,
        department: appt.doctor.department,
        room: appt.doctor.room,
        date: appt.date,
        time: appt.time,
        token: appt.queueItem?.queueToken || `A-${Math.floor(10 + Math.random() * 80)}`,
      };
      setBooking(updatedBooking);

      const updatedQueue: QueueInfo = {
        appointmentId: appt.id,
        token: appt.queueItem?.queueToken || "A-24",
        servingToken: "A-10",
        patientsAhead: appt.queueItem?.position || 1,
        room: appt.doctor.room,
        estimatedWait: `~${(appt.queueItem?.position || 1) * 5} mins`,
        status: "Waiting",
      };
      setQueue(updatedQueue);

      return updatedBooking;
    } else {
      throw new Error(res.error || "Failed to book appointment");
    }
  };

  // Real Backend Integration Method 3: Live Queue Polling
  const refreshQueueApi = async (appointmentId?: string): Promise<QueueInfo> => {
    const targetId = appointmentId || booking.id || queue.appointmentId;
    if (!targetId) return queue;

    const res = await fetchApi<any>(`/queue/${targetId}`);
    if (res.success && res.data) {
      const updatedQueue: QueueInfo = {
        appointmentId: res.data.appointmentId,
        token: res.data.queueToken,
        servingToken: res.data.servingToken,
        patientsAhead: res.data.patientsAhead,
        room: res.data.room,
        estimatedWait: res.data.estimatedWait,
        status: res.data.status,
      };
      setQueue(updatedQueue);
      return updatedQueue;
    }
    return queue;
  };

  return (
    <PatientContext.Provider
      value={{
        patient,
        setPatient,
        setPatientData,
        booking,
        setBooking,
        queue,
        setQueue,
        assistanceHelpType,
        setAssistanceHelpType,
        assistanceAlertSent,
        setAssistanceAlertSent,
        identifyPatientApi,
        bookAppointmentApi,
        refreshQueueApi,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
};
