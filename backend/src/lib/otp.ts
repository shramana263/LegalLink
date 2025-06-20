import { generateTOTP, verifyTOTP } from "@oslojs/otp";

const key = process.env.TOTP_SECRET;

const keyBytes = new TextEncoder().encode(key);

const expireTime = 15 * 60,
  digits = 6;

export function generateOTP() {
  return generateTOTP(keyBytes, expireTime, digits);
}

export function verifyOTP(otp: string) {
  return verifyTOTP(keyBytes, expireTime, digits, otp);
}
