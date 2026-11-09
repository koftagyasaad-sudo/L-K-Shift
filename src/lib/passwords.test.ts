import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("password storage", () => {
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
