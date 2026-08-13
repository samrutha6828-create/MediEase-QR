import { db } from "@/lib/db";

export interface CreateAssistanceInput {
  patientId: string;
  hospitalCode?: string;
  requestType: string;
}

export async function createOrUpdateAssistanceRequest(input: CreateAssistanceInput) {
  const hospitalCode = input.hospitalCode || "MEDIEASE-HOSP-01";

  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
  });
  if (!hospital) {
    throw new Error(`Hospital with code '${hospitalCode}' not found`);
  }

  const patient = await db.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) {
    throw new Error("Patient record not found");
  }

  // 1. Prevent duplicate active requests by updating existing active request if found
  const existingActive = await db.assistanceRequest.findFirst({
    where: {
      patientId: patient.id,
      hospitalId: hospital.id,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActive) {
    return await db.assistanceRequest.update({
      where: { id: existingActive.id },
      data: {
        requestType: input.requestType,
      },
      include: {
        patient: true,
        hospital: true,
      },
    });
  }

  // 2. Otherwise create new assistance request
  return await db.assistanceRequest.create({
    data: {
      requestType: input.requestType,
      status: "PENDING",
      patientId: patient.id,
      hospitalId: hospital.id,
    },
    include: {
      patient: true,
      hospital: true,
    },
  });
}

export async function getActiveAssistanceForPatient(patientId: string) {
  return await db.assistanceRequest.findFirst({
    where: {
      patientId,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      hospital: true,
    },
  });
}

export async function getHospitalAssistanceRequests(hospitalCode = "MEDIEASE-HOSP-01") {
  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
  });
  if (!hospital) {
    throw new Error(`Hospital with code '${hospitalCode}' not found`);
  }

  return await db.assistanceRequest.findMany({
    where: { hospitalId: hospital.id },
    include: {
      patient: {
        include: {
          appointments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { queueItem: true, doctor: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAssistanceStatus(requestId: string, newStatus: "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED") {
  const allowed = ["PENDING", "ACKNOWLEDGED", "RESOLVED", "CANCELLED"];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid assistance status: ${newStatus}`);
  }

  return await db.assistanceRequest.update({
    where: { id: requestId },
    data: { status: newStatus },
    include: {
      patient: true,
    },
  });
}
