import { randomUUID } from 'crypto';
import { EntityManager, EntityTarget, In } from 'typeorm';
import { SyncConflicto } from '../../entities/sync-conflict.entity';
import type { SyncPushResult } from '../../domain/sync-push-result';

export interface VersionedSyncRecord {
  id?: string;
  version?: number | null;
  baseVersion?: number | null;
  updatedByUserId?: string | null;
  updatedByDeviceMac?: string | null;
}

export async function splitOptimisticConflicts<T extends VersionedSyncRecord>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  tableName: string,
  records: Partial<T>[],
  identify: (record: Partial<T>) => string,
): Promise<{ accepted: Partial<T>[]; result: SyncPushResult }> {
  const ids = records.map((record) => record.id).filter(Boolean) as string[];
  if (ids.length === 0) {
    return { accepted: records, result: { conflictCount: 0 } };
  }

  const existingRows = await manager.find(entity, {
    where: { id: In(ids) } as any,
    withDeleted: true,
  });
  const existingById = new Map(existingRows.map((record: any) => [record.id, record]));
  const accepted: Partial<T>[] = [];
  const conflicts: Partial<SyncConflicto>[] = [];

  for (const record of records) {
    const existing = existingById.get(record.id);
    const baseVersion = Number(record.baseVersion ?? 0);
    const serverVersion = Number(existing?.version ?? 0);
    const incomingDevice = normalizeDevice(record.updatedByDeviceMac);
    const serverDevice = normalizeDevice(existing?.updatedByDeviceMac);
    const sameDevice = Boolean(incomingDevice && serverDevice && incomingDevice === serverDevice);

    if (existing && baseVersion > 0 && serverVersion > baseVersion && !sameDevice) {
      conflicts.push({
        id: randomUUID(),
        tablaAfectada: tableName,
        registroId: record.id!,
        identificadorVisual: identify(record),
        datosLocales: JSON.stringify(record),
        datosRemotos: JSON.stringify(existing),
        resuelto: false,
        fechaConflicto: new Date(),
      });
      continue;
    }

    accepted.push({
      ...record,
      version: existing
        ? Math.max(serverVersion, Number(record.version ?? 0)) + 1
        : Math.max(Number(record.version ?? 1), 1),
      baseVersion: baseVersion || serverVersion || 0,
    });
  }

  if (conflicts.length > 0) {
    await manager.insert(SyncConflicto, conflicts);
  }

  return {
    accepted,
    result: { conflictCount: conflicts.length },
  };
}

const normalizeDevice = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';
