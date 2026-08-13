import { db } from "@/lib/db";

export interface HealthCheckResult {
  status: "ok" | "error";
  environment: string;
  database: "connected" | "disconnected";
  counts: {
    hospitals: number;
    patients: number;
    doctors: number;
    appointments: number;
  };
}

export async function checkSystemHealth(): Promise<HealthCheckResult> {
  try {
    const hospitalCount = await db.hospital.count();
    const patientCount = await db.patient.count();
    const doctorCount = await db.doctor.count();
    const appointmentCount = await db.appointment.count();

    return {
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      counts: {
        hospitals: hospitalCount,
        patients: patientCount,
        doctors: doctorCount,
        appointments: appointmentCount,
      },
    };
  } catch (err) {
    console.error("Health check error:", err);
    return {
      status: "error",
      environment: process.env.NODE_ENV || "development",
      database: "disconnected",
      counts: {
        hospitals: 0,
        patients: 0,
        doctors: 0,
        appointments: 0,
      },
    };
  }
}
