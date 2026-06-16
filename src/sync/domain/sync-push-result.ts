export interface SyncPushResult {
  conflictCount: number;
}

export const emptySyncPushResult = (): SyncPushResult => ({ conflictCount: 0 });

export const mergeSyncPushResults = (...results: Array<SyncPushResult | void>): SyncPushResult => ({
  conflictCount: results.reduce((total, result) => total + (result?.conflictCount ?? 0), 0),
});
