export interface SyncPushResult {
  conflictCount: number;
  acceptedRecordIds: string[];
  conflictedRecordIds: string[];
  conflictIds: string[];
}

export interface SyncWriteContext {
  userId: string;
  deviceMac: string;
  outboxId?: string | null;
}

export const emptySyncPushResult = (): SyncPushResult => ({
  conflictCount: 0,
  acceptedRecordIds: [],
  conflictedRecordIds: [],
  conflictIds: [],
});

export const mergeSyncPushResults = (...results: Array<SyncPushResult | void>): SyncPushResult => ({
  conflictCount: results.reduce((total, result) => total + (result?.conflictCount ?? 0), 0),
  acceptedRecordIds: results.flatMap((result) => result?.acceptedRecordIds ?? []),
  conflictedRecordIds: results.flatMap((result) => result?.conflictedRecordIds ?? []),
  conflictIds: results.flatMap((result) => result?.conflictIds ?? []),
});
