import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hospital = await db.hospital.upsert({
    where: { code: "MEDIEASE-HOSP-01" },
    update: {},
    create: {
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

  console.log("Seed complete! Created/Found hospital:", hospital.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
