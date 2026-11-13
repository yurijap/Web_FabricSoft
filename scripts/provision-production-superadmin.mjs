import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { createIdentityProvider } from '../server/clerk.js';
import { deploymentSuperadmin } from './deployment-superadmin-account.mjs';
import { frontendHost, isProductionDeployment, matchingSigningKeys, ProductionSetupError, provisionSuperadmin } from './lib/provision-superadmin.mjs';
import { createProvisioningLedger } from './lib/provisioning-ledger.mjs';

async function connectLedger(uri, id) {
  const connection = await mongoose.createConnection(uri, { maxPoolSize: 1, serverSelectionTimeoutMS: 10000 }).asPromise();
  return { ledger: createProvisioningLedger(connection.db.collection('fabric_admin_provisioning'), id),
    close: () => connection.close() };
}

export async function prepareProductionSuperadmin({ env = process.env, providerFactory = createIdentityProvider,
  openLedger = connectLedger, fetchPublic = fetch, log = message => console.info(message) } = {}) {
  if (!isProductionDeployment(env)) {
    log('[production-setup] Alta de Julio omitida fuera de Vercel Production.');
    return { status: 'skipped' };
  }
  if (!/^sk_(test|live)_\S+$/.test(env.CLERK_SECRET_KEY || '')) throw new ProductionSetupError('Falta CLERK_SECRET_KEY en el entorno Production de Vercel.');
  if (!env.MONGODB_URI) throw new ProductionSetupError('Falta MONGODB_URI en el entorno Production de Vercel.');
  const host = frontendHost(env.VITE_CLERK_PUBLISHABLE_KEY);
  const provider = providerFactory(env.CLERK_SECRET_KEY);
  // Verify that the server and the deployed browser use the same Clerk instance.
  // Only public signing keys go to the Frontend API; the secret stays at api.clerk.com.
  const [instance, backendKeys, frontendResponse] = await Promise.all([
    provider.getInstance(), provider.getJwks(),
    fetchPublic(`https://${host}/.well-known/jwks.json`, { signal: AbortSignal.timeout(10000), redirect: 'error' }),
  ]);
  if (!/^ins_[\w-]+$/.test(instance?.id || '') || !frontendResponse.ok || !matchingSigningKeys(backendKeys, await frontendResponse.json())) {
    throw new ProductionSetupError('Las claves pública y secreta de Clerk en Production no corresponden a la misma instancia. No se creó ni modificó la cuenta.');
  }
  const store = await openLedger(env.MONGODB_URI, `${deploymentSuperadmin.migration}:${instance.id}`);
  try {
    const result = await provisionSuperadmin({ provider, ledger: store.ledger, account: deploymentSuperadmin });
    log(`[production-setup] ${deploymentSuperadmin.email}: ${result.status}.`);
    return result;
  } finally { await store.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await prepareProductionSuperadmin(); }
  catch (error) {
    // Do not print provider response bodies, environment values or password digests.
    const safe = error.status ? `Clerk rechazó el alta (estado ${error.status}). Revisa las claves y que el acceso por contraseña esté habilitado.`
      : error instanceof ProductionSetupError ? error.message
        : 'No se pudo preparar la cuenta de Julio. Revisa la conexión y configuración de Clerk/MongoDB y vuelve a desplegar.';
    console.error(`[production-setup] ${safe}`);
    process.exitCode = 1;
  }
}
