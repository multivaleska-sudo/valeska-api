import { randomUUID } from 'crypto';
import { EntityManager, EntityTarget } from 'typeorm';
import { SyncConflicto } from '../../entities/sync-conflict.entity';
import { SyncChangeLog } from '../../entities/sync-change-log.entity';
import type { SyncPushResult, SyncWriteContext } from '../../domain/sync-push-result';
import { emptySyncPushResult } from '../../domain/sync-push-result';

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
  context?: SyncWriteContext,
): Promise<{ accepted: Partial<T>[]; result: SyncPushResult }> {
  const ids = records.map((record) => record.id).filter(Boolean) as string[];
  if (ids.length === 0) {
    return { accepted: records, result: emptySyncPushResult() };
  }

  const existingRows = await manager
    .getRepository(entity)
    .createQueryBuilder('record')
    .withDeleted()
    .setLock('pessimistic_write')
    .where('record.id IN (:...ids)', { ids })
    .getMany();
  const existingById = new Map(existingRows.map((record: any) => [record.id, record]));
  const accepted: Partial<T>[] = [];
  const conflicts: Partial<SyncConflicto>[] = [];
  const changeLogs: Partial<SyncChangeLog>[] = [];
  const acceptedRecordIds: string[] = [];
  const conflictedRecordIds: string[] = [];
  const conflictIds: string[] = [];

  for (const record of records) {
    const existing = existingById.get(record.id);
    const baseVersion = Number(record.baseVersion ?? 0);
    const serverVersion = Number(existing?.version ?? 0);

    if (existing && baseVersion !== serverVersion) {
      const conflictId = randomUUID();
      conflicts.push({
        id: conflictId,
        tablaAfectada: tableName,
        registroId: record.id!,
        identificadorVisual: identify(record),
        datosLocales: JSON.stringify(record),
        datosRemotos: JSON.stringify(existing),
        resuelto: false,
        fechaConflicto: new Date(),
      });
      conflictedRecordIds.push(record.id!);
      conflictIds.push(conflictId);
      changeLogs.push(buildChangeLog(tableName, record.id!, 'CONFLICT', existing, record, context));
      continue;
    }

    const acceptedRecord = {
      ...record,
      version: existing ? serverVersion + 1 : 1,
      baseVersion: existing ? serverVersion : 0,
    };
    accepted.push(acceptedRecord);
    acceptedRecordIds.push(record.id!);
    changeLogs.push(buildChangeLog(
      tableName,
      record.id!,
      existing ? 'UPDATE' : 'INSERT',
      existing ?? null,
      acceptedRecord,
      context,
    ));
  }

  if (conflicts.length > 0) {
    await manager.insert(SyncConflicto, conflicts);
  }

  if (changeLogs.length > 0) {
    await manager.insert(SyncChangeLog, changeLogs as any);
  }

  return {
    accepted,
    result: {
      conflictCount: conflicts.length,
      acceptedRecordIds,
      conflictedRecordIds,
      conflictIds,
    },
  };
}

const buildChangeLog = (
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'CONFLICT',
  beforeValue: unknown,
  afterValue: unknown,
  context?: SyncWriteContext,
): Partial<SyncChangeLog> => ({
  entityName: tableName,
  recordId,
  operation,
  beforeJson: toJsonObject(beforeValue),
  afterJson: toJsonObject(afterValue),
  userId: context?.userId ?? null,
  deviceMac: context?.deviceMac ?? null,
  outboxId: context?.outboxId ?? null,
});

const toJsonObject = (value: unknown): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
};
