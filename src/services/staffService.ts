import { db } from "@/lib/db";

export async function getStaffDashboardData(hospitalCode = "MEDIEASE-HOSP-01") {
  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
  });

  if (!hospital) {
    throw new Error(`Hospital with code '${hospitalCode}' not found`);
  }

  // Fetch all queue items for today
  const queueItems = await db.queueItem.findMany({
    where: { hospitalId: hospital.id },
    include: {
      appointment: {
        include: {
          patient: true,
          doctor: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate status metrics
  const counts = {
    total: queueItems.length,
    waiting: queueItems.filter((q) => q.status === "WAITING").length,
    serving: queueItems.filter((q) => q.status === "SERVING").length,
    completed: queueItems.filter((q) => q.status === "COMPLETED").length,
    cancelled: queueItems.filter((q) => q.status === "CANCELLED").length,
  };

  const currentlyServing = queueItems.find((q) => q.status === "SERVING") || null;
  const nextInLine = queueItems.find((q) => q.status === "WAITING") || null;

  return {
    hospital,
    counts,
    currentlyServing,
    nextInLine,
    queueItems,
  };
}

export async function callNextPatient(hospitalCode = "MEDIEASE-HOSP-01") {
  const hospital = await db.hospital.findUnique({
    where: { code: hospitalCode },
  });

  if (!hospital) {
    throw new Error(`Hospital with code '${hospitalCode}' not found`);
  }

  return await db.$transaction(async (tx) => {
    // 1. Mark currently serving patient as COMPLETED if present
    const currentServing = await tx.queueItem.findFirst({
      where: {
        hospitalId: hospital.id,
        status: "SERVING",
      },
    });

    if (currentServing) {
      await tx.queueItem.update({
        where: { id: currentServing.id },
        data: { status: "COMPLETED" },
      });
      await tx.appointment.update({
        where: { id: currentServing.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    // 2. Find next WAITING patient
    const nextWaiting = await tx.queueItem.findFirst({
      where: {
        hospitalId: hospital.id,
        status: "WAITING",
      },
      orderBy: { createdAt: "asc" },
    });

    if (!nextWaiting) {
      return null; // No waiting patients
    }

    // 3. Update next patient to SERVING
    const updatedNext = await tx.queueItem.update({
      where: { id: nextWaiting.id },
      data: {
        status: "SERVING",
        position: 0,
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    });

    await tx.appointment.update({
      where: { id: nextWaiting.appointmentId },
      data: { status: "IN_PROGRESS" },
    });

    // 4. Recalculate position integers for remaining WAITING patients
    const remainingWaiting = await tx.queueItem.findMany({
      where: {
        hospitalId: hospital.id,
        status: "WAITING",
      },
      orderBy: { createdAt: "asc" },
    });

    for (let i = 0; i < remainingWaiting.length; i++) {
      await tx.queueItem.update({
        where: { id: remainingWaiting[i].id },
        data: { position: i + 1 },
      });
    }

    return updatedNext;
  });
}

export async function updateQueueStatus(queueItemId: string, newStatus: "WAITING" | "SERVING" | "COMPLETED" | "CANCELLED") {
  const allowedStatuses = ["WAITING", "SERVING", "COMPLETED", "CANCELLED"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid queue status: ${newStatus}`);
  }

  const existingItem = await db.queueItem.findUnique({
    where: { id: queueItemId },
  });

  if (!existingItem) {
    throw new Error("Queue item not found");
  }

  return await db.$transaction(async (tx) => {
    const updatedQueueItem = await tx.queueItem.update({
      where: { id: queueItemId },
      data: { status: newStatus },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    });

    const apptStatusMap: Record<string, string> = {
      WAITING: "CONFIRMED",
      SERVING: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED",
    };

    await tx.appointment.update({
      where: { id: existingItem.appointmentId },
      data: { status: apptStatusMap[newStatus] || "CONFIRMED" },
    });

    return updatedQueueItem;
  });
}
