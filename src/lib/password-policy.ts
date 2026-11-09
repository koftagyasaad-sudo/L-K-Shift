export const MIN_PASSWORD_LENGTH = 6;

export function meetsPasswordMinimum(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
