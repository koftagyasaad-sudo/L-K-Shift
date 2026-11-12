export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    noSpaces: boolean;
  };
}

export const STRONG_PASSWORD_POLICY_MESSAGE =
  "كلمة المرور يجب أن لا تقل عن 6 مكونات وتحتوي على: حرف كبير (A-Z)، حرف صغير (a-z)، رقم (0-9)، ورمز خاص (!@#$%...) بدون مسافات.";

export function validateStrongPassword(password: string): PasswordValidationResult {
  const value = typeof password === "string" ? password : "";
  const checks = {
    minLength: value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9\s]/.test(value),
    noSpaces: value.length > 0 && !/\s/.test(value),
  };
  const valid = Object.values(checks).every(Boolean);
  return {
    valid,
    message: valid ? "" : STRONG_PASSWORD_POLICY_MESSAGE,
    checks,
  };
}

export function meetsPasswordMinimum(password: string): boolean {
  return validateStrongPassword(password).valid;
}
