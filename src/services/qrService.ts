import QRCode from "qrcode";
import { db } from "@/lib/db";

export async function resolveHospitalByCode(code: string) {
  const cleanCode = code.trim();
  const hospital = await db.hospital.findUnique({
    where: { code: cleanCode },
  });

  if (!hospital) {
    throw new Error(`Hospital with QR identifier '${cleanCode}' was not found`);
  }

  return hospital;
}

export async function generateHospitalQrCode(code: string) {
  const hospital = await resolveHospitalByCode(code);

  const qrPayload = JSON.stringify({
    type: "mediease_hospital",
    code: hospital.code,
    name: hospital.name,
  });

  // Generate Data URL PNG
  const dataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });

  return {
    hospital,
    qrPayload,
    qrDataUrl: dataUrl,
  };
}
