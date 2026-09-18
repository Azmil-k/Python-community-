import crypto from "crypto";

export function generateRandomPassword(byteLength = 9) {
  return crypto.randomBytes(byteLength).toString("base64url");
}
