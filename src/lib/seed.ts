import { db } from "./db";

export async function initializeDatabaseSeed() {
  const existingHospital = await db.hospital.findUnique({
    where: { code: "MEDIEASE-HOSP-01" },
  });

  if (!existingHospital) {
    const hospital = await db.hospital.create({
      data: {
        name: "MediEase General Hospital",
        code: "MEDIEASE-HOSP-01",
        address: "100 Healthcare Way, Medical District",
        phone: "+1-800-MEDIEASE",
        doctors: {
          create: [
            {
              name: "Dr. Sarah Smith",
              specialty: "Fever, Cough & General Health",
              department: "General Medicine",
              room: "Room 102 (1st Floor)",
            },
            {
              name: "Dr. Robert Chen",
              specialty: "Heart, Chest & Blood Pressure",
              department: "Cardiology",
              room: "Room 204 (2nd Floor)",
            },
            {
              name: "Dr. Anita Patel",
              specialty: "Bones, Joints & Back Pain",
              department: "Orthopedics",
              room: "Room 108 (1st Floor)",
            },
          ],
        },
      },
    });

    console.log("Database initialized with seed hospital & doctors:", hospital.name);
    return hospital;
  }

  return existingHospital;
}
