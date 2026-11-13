import { randomUUID } from 'node:crypto';
import { ProductionSetupError } from './provision-superadmin.mjs';

// This collection is independent of operational data and is not removed by clear-db.
// A durable receipt also prevents a later deployment from recreating a deleted identity.
export function createProvisioningLedger(collection, id, clock = () => new Date()) {
  const expires = () => new Date(clock().getTime() + 120000);
  async function write(claim, fields, complete = false) {
    const result = await collection.updateOne({ _id: id, status: 'pending', leaseToken: claim.token,
      leaseUntil: { $gt: clock() } }, {
      $set: { ...fields, ...(complete ? { status: 'completed', completedAt: clock() } : { leaseUntil: expires() }) },
      ...(complete ? { $unset: { leaseToken: '', leaseUntil: '' } } : {}),
    });
    if (result.matchedCount !== 1) throw new ProductionSetupError('El alta de Julio perdió su bloqueo de ejecución. Vuelve a desplegar para comprobar su estado.');
  }
  return {
    async claim() {
      const current = await collection.findOne({ _id: id });
      if (current?.status === 'completed') return null;
      const token = randomUUID();
      try {
        await collection.updateOne({ _id: id, status: { $ne: 'completed' }, $or: [
          { leaseUntil: { $exists: false } }, { leaseUntil: { $lte: clock() } },
        ] }, { $set: { status: 'pending', leaseToken: token, leaseUntil: expires() },
          $setOnInsert: { createdAt: clock() } }, { upsert: true });
      } catch (error) {
        if (error.code !== 11000) throw error;
        if ((await collection.findOne({ _id: id }))?.status === 'completed') return null;
        throw new ProductionSetupError('Otro despliegue está preparando la cuenta de Julio. Reintenta cuando termine.');
      }
      const record = await collection.findOne({ _id: id, leaseToken: token });
      if (!record) throw new ProductionSetupError('No se pudo reservar el alta de Julio.');
      return { token, userId: record.userId, creationStarted: record.creationStarted === true };
    },
    record: (claim, fields) => write(claim, fields),
    complete: (claim, fields) => write(claim, fields, true),
    release: claim => collection.updateOne({ _id: id, status: 'pending', leaseToken: claim.token },
      { $unset: { leaseToken: '', leaseUntil: '' } }),
  };
}
