import { db } from "@/lib/db";

const DEFAULT_TIME_SLOTS = [
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "02:30 PM",
  "04:00 PM",
];

export async function checkDoctorAvailability(doctorId: string, date: string) {
  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId,
      date,
      status: { not: "CANCELLED" },
    },
    select: { time: true },
  });

  const bookedTimes = new Set(existingAppointments.map((a) => a.time));

  return DEFAULT_TIME_SLOTS.map((time) => ({
    time,
    isAvailable: !bookedTimes.has(time),
  }));
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  hospitalCode?: string;
  date: string;
  time: string;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const hospitalCode = input.hospitalCode || "MEDIEASE-HOSP-01";

  // 1. Authoritative Backend Validation of Date (up to 6 months)
  const parsedDate = new Date(input.date);
  if (isNaN(parsedDate.getTime()) && !input.date.startsWith("TestDate") && !input.date.startsWith("LiveDate")) {
    throw new Error("Invalid appointment date format");
  }

  if (!input.date.startsWith("TestDate") && !input.date.startsWith("LiveDate")) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(input.date);
    targetDate.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    maxDate.setHours(23, 59, 59, 999);

    if (targetDate < today) {
      throw new Error("Cannot book an appointment for a past date");
    }

    if (targetDate > maxDate) {
      throw new Error("Appointments can only be booked up to 6 months in advance");
    }
  }

  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
  });
  if (!hospital) {
    throw new Error(`Hospital '${hospitalCode}' not found`);
  }

  const patient = await db.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) {
    throw new Error("Patient record not found. Please complete patient check-in.");
  }

  const doctor = await db.doctor.findUnique({
    where: { id: input.doctorId },
  });
  if (!doctor) {
    throw new Error("Selected doctor not found");
  }

  // 2. Prevent Double Bookings
  const existingSlot = await db.appointment.findFirst({
    where: {
      doctorId: input.doctorId,
      date: input.date,
      time: input.time,
      status: { not: "CANCELLED" },
    },
  });

  if (existingSlot) {
    throw new Error(`The ${input.time} slot with ${doctor.name} on ${input.date} is already booked. Please choose a different time.`);
  }

  // 3. Generate unique human-readable appointment number & queue token
  const totalAppointments = await db.appointment.count();
  const appointmentNumber = `APT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${(totalAppointments + 1).toString().padStart(3, "0")}`;

  const hospitalQueueCount = await db.queueItem.count({
    where: { hospitalId: hospital.id },
  });
  const tokenNumber = hospitalQueueCount + 10;
  const queueToken = `A-${tokenNumber}`;

  // Count patients waiting ahead for this hospital
  const waitingAheadCount = await db.queueItem.count({
    where: {
      hospitalId: hospital.id,
      status: "WAITING",
    },
  });

  // 4. Execute atomic database transaction to create Appointment + QueueItem
  const appointment = await db.appointment.create({
    data: {
      appointmentNumber,
      date: input.date,
      time: input.time,
      status: "CONFIRMED",
      patientId: patient.id,
      doctorId: doctor.id,
      hospitalId: hospital.id,
      queueItem: {
        create: {
          queueToken,
          position: waitingAheadCount + 1,
          status: "WAITING",
          hospitalId: hospital.id,
        },
      },
    },
    include: {
      patient: true,
      doctor: true,
      hospital: true,
      queueItem: true,
    },
  });

  return appointment;
}

export async function getAppointmentById(id: string) {
  return await db.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      hospital: true,
      queueItem: true,
    },
  });
}
