import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * تشفير كلمة المرور بنظام التشفير الأحادي المتقدم مع Salt عشوائي
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2$${ITERATIONS}$${salt}$${derivedKey}`;
}

/**
 * التحقق من صحة كلمة المرور مع دعم الحسابات القديمة وترقيتها تلقائياً
 */
export function verifyPassword(
  passwordAttempt: string,
  storedHash: string | null | undefined
): { isValid: boolean; needsRehash: boolean } {
  if (!storedHash || !passwordAttempt) {
    return { isValid: false, needsRehash: false };
  }

  // 1. إذا كانت كلمة المرور مشفرة بنظام PBKDF2 القياسي
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return { isValid: false, needsRehash: false };

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const derivedKey = crypto.pbkdf2Sync(passwordAttempt, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(originalHash, 'hex'));

    return { isValid, needsRehash: false };
  }

  // 2. إذا كانت كلمة المرور نصاً صريحاً قديماً (Legacy Plain Text)
  // تتم المطابقة المباشرة، مع تعليم الحساب لتشفيره فوراً
  if (storedHash === passwordAttempt) {
    return { isValid: true, needsRehash: true };
  }

  return { isValid: false, needsRehash: false };
}
