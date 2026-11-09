import { pbkdf2Sync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";
import { meetsPasswordMinimum } from "./password-policy";

describe("password storage", () => {
  it("accepts passwords with at least six characters", () => {
    expect(meetsPasswordMinimum("12345")).toBe(false);
    expect(meetsPasswordMinimum("123456")).toBe(true);
  });

  it("hashes passwords and verifies them without exposing the original value", async () => {
    const password = "strong-password-for-test";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toEqual({
      isValid: true,
      needsRehash: false,
    });
    await expect(verifyPassword("incorrect-password", hash)).resolves.toEqual({
      isValid: false,
      needsRehash: false,
    });
  });

  it("marks a legacy plaintext password for rehash after a successful login", async () => {
    await expect(verifyPassword("legacy-password", "legacy-password")).resolves.toEqual({
      isValid: true,
      needsRehash: true,
    });
  });

  it("verifies legacy PBKDF2 passwords and marks them for rehash", async () => {
    const password = "legacy-pbkdf2-password";
    const salt = "0123456789abcdef0123456789abcdef";
    const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

    await expect(
      verifyPassword(password, `pbkdf2$100000$${salt}$${hash}`)
    ).resolves.toEqual({ isValid: true, needsRehash: true });
    await expect(
      verifyPassword("incorrect-password", `pbkdf2$100000$${salt}$${hash}`)
    ).resolves.toEqual({ isValid: false, needsRehash: false });
  });

  it("rejects malformed or empty password records safely", async () => {
    await expect(verifyPassword("", "stored-value")).resolves.toEqual({
      isValid: false,
      needsRehash: false,
    });
    await expect(verifyPassword("password", "pbkdf2$invalid$hash$format")).resolves.toEqual({
      isValid: false,
      needsRehash: false,
    });
  });
});
