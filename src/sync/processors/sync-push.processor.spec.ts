import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityService } from '../../observability/observability.service';
import { SyncOutboxService } from '../services/sync-outbox.service';
import { SyncService } from '../sync.service';
import { SyncPushProcessor } from './sync-push.processor';

describe('SyncPushProcessor', () => {
  let processor: SyncPushProcessor;

  const outbox = {
    id: 'outbox-id',
    syncSessionId: '11111111-1111-4111-8111-111111111111',
    entityName: 'cliente',
    chunkIndex: 0,
    totalChunks: 1,
    payload: [{ id: 'cliente-id' }],
    userId: 'user-id',
    macAddress: 'AA:BB',
    status: 'QUEUED',
  };
  const outboxServiceMock = {
    findById: jest.fn().mockResolvedValue(outbox),
    markProcessing: jest.fn(),
    markCompleted: jest.fn(),
    markCompletedWithConflicts: jest.fn(),
    markFailed: jest.fn(),
  };
  const syncServiceMock = {
    processPushChunkNow: jest.fn(),
  };
  const observabilityMock = {
    startSyncPushTimer: jest.fn(() => jest.fn()),
    incrementSyncPushJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncPushProcessor,
        { provide: SyncOutboxService, useValue: outboxServiceMock },
        { provide: SyncService, useValue: syncServiceMock },
        { provide: ObservabilityService, useValue: observabilityMock },
      ],
    }).compile();

    processor = module.get(SyncPushProcessor);
  });

  it('marks job as completed after processing', async () => {
    syncServiceMock.processPushChunkNow.mockResolvedValueOnce({
      success: true,
      processedRecords: 1,
      conflictCount: 0,
      acceptedRecordIds: ['cliente-id'],
      conflictedRecordIds: [],
      conflictIds: [],
    });

    await processor.process({
      data: { outboxId: 'outbox-id' },
      attemptsMade: 0,
      opts: { attempts: 5 },
    } as never);

    expect(syncServiceMock.processPushChunkNow).toHaveBeenCalled();
    expect(outboxServiceMock.markCompleted).toHaveBeenCalledWith('outbox-id', expect.objectContaining({
      acceptedRecordIds: ['cliente-id'],
    }));
  });

  it('marks job as completed with conflicts when optimistic conflicts are detected', async () => {
    syncServiceMock.processPushChunkNow.mockResolvedValueOnce({
      success: true,
      processedRecords: 1,
      conflictCount: 1,
      acceptedRecordIds: [],
      conflictedRecordIds: ['cliente-id'],
      conflictIds: ['conflict-id'],
    });

    await processor.process({
      data: { outboxId: 'outbox-id' },
      attemptsMade: 0,
      opts: { attempts: 5 },
    } as never);

    expect(outboxServiceMock.markCompletedWithConflicts).toHaveBeenCalledWith('outbox-id', expect.objectContaining({
      conflictCount: 1,
      acceptedRecordIds: [],
      conflictedRecordIds: ['cliente-id'],
      conflictIds: ['conflict-id'],
    }));
    expect(outboxServiceMock.markCompleted).not.toHaveBeenCalled();
    expect(observabilityMock.incrementSyncPushJob).toHaveBeenCalledWith('cliente', 'COMPLETED_WITH_CONFLICTS');
  });

  it('does not reprocess jobs already completed with conflicts', async () => {
    outboxServiceMock.findById.mockResolvedValueOnce({
      ...outbox,
      status: 'COMPLETED_WITH_CONFLICTS',
    });

    await processor.process({
      data: { outboxId: 'outbox-id' },
      attemptsMade: 0,
      opts: { attempts: 5 },
    } as never);

    expect(syncServiceMock.processPushChunkNow).not.toHaveBeenCalled();
    expect(outboxServiceMock.markProcessing).not.toHaveBeenCalled();
  });

  it('marks dead letter on final failure', async () => {
    syncServiceMock.processPushChunkNow.mockRejectedValueOnce(new Error('boom'));

    await expect(processor.process({
      data: { outboxId: 'outbox-id' },
      attemptsMade: 4,
      opts: { attempts: 5 },
    } as never)).rejects.toThrow('boom');

    expect(outboxServiceMock.markFailed).toHaveBeenCalledWith('outbox-id', 'DEAD_LETTER', expect.any(Error));
  });
});
