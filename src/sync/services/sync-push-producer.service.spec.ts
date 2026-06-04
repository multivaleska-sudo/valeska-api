import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { SYNC_PUSH_QUEUE } from '../../queue/queue.constants';
import { ObservabilityService } from '../../observability/observability.service';
import { SyncPushProducerService } from './sync-push-producer.service';
import { SyncOutboxService } from './sync-outbox.service';

describe('SyncPushProducerService', () => {
  let service: SyncPushProducerService;
  const outbox = {
    id: 'outbox-id',
    queueJobId: 'outbox-id',
    syncSessionId: '11111111-1111-4111-8111-111111111111',
    entityName: 'cliente',
    chunkIndex: 0,
    status: 'QUEUED',
  };

  const queueMock = {
    add: jest.fn().mockResolvedValue({ id: 'outbox-id' }),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 1, active: 0, failed: 0 }),
  };
  const outboxServiceMock = {
    findByNaturalKey: jest.fn(),
    createPending: jest.fn().mockResolvedValue(outbox),
    markQueued: jest.fn().mockResolvedValue(outbox),
  };
  const observabilityMock = {
    setSyncPushQueueCounts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncPushProducerService,
        { provide: getQueueToken(SYNC_PUSH_QUEUE), useValue: queueMock },
        { provide: SyncOutboxService, useValue: outboxServiceMock },
        { provide: ObservabilityService, useValue: observabilityMock },
      ],
    }).compile();

    service = module.get(SyncPushProducerService);
  });

  it('creates and queues an outbox job', async () => {
    outboxServiceMock.findByNaturalKey.mockResolvedValueOnce(null);

    await expect(service.enqueue('user-id', 'AA:BB', {
      syncSessionId: outbox.syncSessionId,
      entityName: 'cliente',
      chunkIndex: 0,
      totalChunks: 1,
      records: [{ id: '1' }],
    })).resolves.toMatchObject({
      accepted: true,
      outboxId: 'outbox-id',
      status: 'QUEUED',
    });

    expect(queueMock.add).toHaveBeenCalledWith(
      'process-sync-push',
      { outboxId: 'outbox-id' },
      expect.objectContaining({ jobId: 'outbox-id', attempts: 5 }),
    );
  });

  it('returns completed duplicate without enqueueing again', async () => {
    outboxServiceMock.findByNaturalKey.mockResolvedValueOnce({ ...outbox, status: 'COMPLETED' });

    await service.enqueue('user-id', 'AA:BB', {
      syncSessionId: outbox.syncSessionId,
      entityName: 'cliente',
      chunkIndex: 0,
      totalChunks: 1,
      records: [{ id: '1' }],
    });

    expect(queueMock.add).not.toHaveBeenCalled();
  });
});
