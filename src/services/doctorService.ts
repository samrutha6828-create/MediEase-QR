import { db } from "@/lib/db";

export async function getDoctors(hospitalCode = "MEDIEASE-HOSP-01") {
  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
    include: {
      doctors: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!hospital) {
    throw new Error(`Hospital with code '${hospitalCode}' not found`);
  }

  return hospital.doctors;
}

export async function getDoctorById(id: string) {
  return await db.doctor.findUnique({
    where: { id },
    include: { hospital: true },
  });
}
