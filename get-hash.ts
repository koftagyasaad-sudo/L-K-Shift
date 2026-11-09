import { hashPassword } from './src/lib/passwords';

async function main() {
  const hash = await hashPassword('16932@@Omar');
  console.log('\n' + `UPDATE users SET password_hash = '${hash}', password = '${hash}', is_active = true WHERE phone = '01068390982' RETURNING id, full_name_ar, phone, is_active;` + '\n');
}

main().catch(console.error);
