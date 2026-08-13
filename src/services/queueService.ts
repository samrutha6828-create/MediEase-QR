import { db } from "@/lib/db";

export interface RealQueueStatus {
  appointmentId: string;
  queueToken: string;
  servingToken: string;
  patientsAhead: number;
  room: string;
  estimatedWait: string;
  status: "Waiting" | "Next in Line" | "Serving" | "Completed";
  doctorName: string;
  patientName: string;
}

export async function getRealQueueStatus(appointmentId: string): Promise<RealQueueStatus> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      hospital: true,
      queueItem: true,
    },
  });

  if (!appointment || !appointment.queueItem) {
    throw new Error("Queue item for this appointment was not found");
  }

  const patientQueueItem = appointment.queueItem;

  // Find currently serving token for this hospital
  const currentlyServingItem = await db.queueItem.findFirst({
    where: {
      hospitalId: appointment.hospitalId,
      status: "SERVING",
    },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate patients ahead in queue
  const patientsAheadCount = await db.queueItem.count({
    where: {
      hospitalId: appointment.hospitalId,
      status: "WAITING",
      createdAt: {
        lt: patientQueueItem.createdAt,
      },
    },
  });

  let status: "Waiting" | "Next in Line" | "Serving" | "Completed" = "Waiting";
  if (patientQueueItem.status === "COMPLETED") {
    status = "Completed";
  } else if (patientQueueItem.status === "SERVING") {
    status = "Serving";
  } else if (patientsAheadCount <= 1) {
    status = "Next in Line";
  } else {
    status = "Waiting";
  }

  const servingToken = currentlyServingItem
    ? currentlyServingItem.queueToken
    : patientQueueItem.status === "SERVING"
    ? patientQueueItem.queueToken
    : "--";

  const estimatedWait =
    patientQueueItem.status === "SERVING"
      ? "Now Serving!"
      : patientQueueItem.status === "COMPLETED"
      ? "Visit Completed"
      : `~${Math.max(1, patientsAheadCount) * 5} mins`;

  return {
    appointmentId: appointment.id,
    queueToken: patientQueueItem.queueToken,
    servingToken,
    patientsAhead: patientQueueItem.status === "SERVING" ? 0 : patientsAheadCount,
    room: appointment.doctor.room,
    estimatedWait,
    status,
    doctorName: appointment.doctor.name,
    patientName: appointment.patient.name,
  };
}
