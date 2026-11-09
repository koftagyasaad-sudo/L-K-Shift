import { pbkdf2 as pbkdf2Callback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const pbkdf2 = promisify(pbkdf2Callback);
const BCRYPT_ROUNDS = 12;
const LEGACY_SALT = "LK_SHIFT_SECURE_SALT_2026";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function equalHex(actual: Buffer, expectedHex: string): boolean {
  if (!/^[a-f0-9]+$/i.test(expectedHex) || expectedHex.length % 2 !== 0) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!password || !storedHash) {
    return { isValid: false, needsRehash: false };
  }

  if (/^\$2[aby]\$/.test(storedHash)) {
    const isValid = await bcrypt.compare(password, storedHash);
    const rounds = isValid ? bcrypt.getRounds(storedHash) : BCRYPT_ROUNDS;
    return { isValid, needsRehash: isValid && rounds < BCRYPT_ROUNDS };
  }

  if (storedHash.startsWith("pbkdf2$")) {
    const [, iterationText, salt, expectedHex] = storedHash.split("$");
    const iterations = Number(iterationText);
    if (
      !Number.isSafeInteger(iterations) ||
      iterations < 1_000 ||
      iterations > 1_000_000 ||
      !salt ||
      !/^[a-f0-9]{128}$/i.test(expectedHex || "")
    ) {
      return { isValid: false, needsRehash: false };
    }

    const derived = await pbkdf2(password, salt, iterations, 64, "sha512");
    return { isValid: equalHex(derived, expectedHex), needsRehash: true };
  }

  if (/^[a-f0-9]{128}$/i.test(storedHash)) {
    const derived = await pbkdf2(password, LEGACY_SALT, 1_000, 64, "sha512");
    return { isValid: equalHex(derived, storedHash), needsRehash: true };
  }

  const passwordBytes = Buffer.from(password);
  const storedBytes = Buffer.from(storedHash);
  const isValid =
    passwordBytes.length === storedBytes.length &&
    timingSafeEqual(passwordBytes, storedBytes);

  return { isValid, needsRehash: isValid };
}