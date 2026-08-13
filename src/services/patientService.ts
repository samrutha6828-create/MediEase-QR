import { db } from "@/lib/db";

export interface CreatePatientInput {
  name: string;
  phone: string;
  age?: number;
}

export async function identifyOrCreatePatient(input: CreatePatientInput) {
  const cleanName = input.name.trim();
  const cleanPhone = input.phone.trim().replace(/\D/g, "");

  if (!cleanName || cleanName.length < 2) {
    throw new Error("Patient full name is required and must be at least 2 characters");
  }

  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new Error("Mobile phone number must be exactly 10 digits");
  }

  // Check if patient already exists by phone number
  let patient = await db.patient.findUnique({
    where: { phone: cleanPhone },
  });

  if (patient) {
    // Update name and age if provided
    patient = await db.patient.update({
      where: { id: patient.id },
      data: {
        name: cleanName,
        age: input.age ?? patient.age,
      },
    });
  } else {
    // Create new patient record with unique patientId
    const patientCount = await db.patient.count();
    const patientId = `ME-${84900 + patientCount + 1}`;

    patient = await db.patient.create({
      data: {
        name: cleanName,
        phone: cleanPhone,
        age: input.age,
        patientId,
      },
    });
  }

  return patient;
}

export async function getPatientById(id: string) {
  return await db.patient.findUnique({
    where: { id },
  });
}
