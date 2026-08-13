interface OtpSession {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// In-memory cache for temporary OTP records (cleared after expiration / verification)
const otpStore = new Map<string, OtpSession>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 3;

/**
 * Sends / Generates an OTP for a given phone number.
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; devOtp?: string; message?: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    throw new Error("Please enter a valid 10-digit mobile number");
  }

  const now = Date.now();
  const existing = otpStore.get(cleanPhone);

  // Check resend cooldown
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
  }

  // Generate a random 6-digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(cleanPhone, {
    phone: cleanPhone,
    code,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: now,
  });

  // Log in development console for easy local testing
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n========================================`);
    console.log(`  [MediEase OTP Service]`);
    console.log(`  Mobile Phone: ${cleanPhone}`);
    console.log(`  Verification Code: ${code}`);
    console.log(`  Valid for: 5 minutes`);
    console.log(`========================================\n`);
  }

  // In development, we return devOtp for seamless local UI testing without SMS costs
  const isDev = process.env.NODE_ENV !== "production";
  return {
    success: true,
    devOtp: isDev ? code : undefined,
    message: "Verification code sent successfully",
  };
}

/**
 * Verifies an OTP code for a given phone number.
 */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, "");
  const cleanCode = code.trim();

  const session = otpStore.get(cleanPhone);
  if (!session) {
    throw new Error("No active verification code found. Please request a new code.");
  }

  const now = Date.now();

  // Check expiration
  if (now > session.expiresAt) {
    otpStore.delete(cleanPhone);
    throw new Error("Verification code has expired. Please request a new code.");
  }

  // Check max attempts
  if (session.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanPhone);
    throw new Error("Too many failed attempts. Please request a new code.");
  }

  // Verify code matching
  if (session.code !== cleanCode) {
    session.attempts += 1;
    const remaining = MAX_ATTEMPTS - session.attempts;
    if (remaining <= 0) {
      otpStore.delete(cleanPhone);
      throw new Error("Too many failed attempts. Please request a new code.");
    }
    throw new Error(`Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`);
  }

  // Successful verification -> cleanup temporary OTP
  otpStore.delete(cleanPhone);
  return true;
}
