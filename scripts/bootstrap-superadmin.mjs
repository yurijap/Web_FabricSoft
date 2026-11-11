import fs from 'node:fs';
import { createIdentityProvider } from '../server/clerk.js';

// Explicit, one-time server-side provisioning. There is no public bootstrap endpoint.
for (const filename of ['.env.local', '.env']) {
  if (!fs.existsSync(filename)) continue;
  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
}
const id = process.argv[2];
const expectedEmail = process.argv[3]?.trim().toLowerCase();
if (!process.env.CLERK_SECRET_KEY || !/^user_[\w-]+$/.test(id || '') || !expectedEmail) {
  console.error('Configura CLERK_SECRET_KEY en .env.local y ejecuta: node scripts/bootstrap-superadmin.mjs user_ID correo@empresa.com');
  process.exit(1);
}
try {
  const provider = createIdentityProvider(process.env.CLERK_SECRET_KEY);
  const user = await provider.getUser(id);
  const verified = user.email_addresses?.some(e => e.email_address.toLowerCase() === expectedEmail && e.verification?.status === 'verified');
  if (!verified || user.banned) throw new Error('El correo verificado no coincide con la cuenta indicada.');
  await provider.setAccess(id, { email: expectedEmail, role: 'superadmin', status: 'active', grantedBy: 'local-bootstrap', updatedAt: new Date().toISOString() });
  console.log('Superadmin autorizado. El panel exigirá configurar y verificar el autenticador antes de permitir el acceso.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
