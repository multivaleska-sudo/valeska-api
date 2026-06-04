import { InjectQueue } from '@nestjs/bullmq';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { SYNC_PUSH_QUEUE } from '../../queue/queue.constants';
import { ObservabilityService } from '../../observability/observability.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { PushSyncChunkDto } from '../infrastructure/http/dtos/common/base-chunk.dto';
import { SyncOutboxService } from './sync-outbox.service';

export interface SyncPushJobData {
  outboxId: string;
}

@Injectable()
export class SyncPushProducerService {
  private readonly tracer = trace.getTracer('sync-push-producer');

  constructor(
    @InjectQueue(SYNC_PUSH_QUEUE)
    private readonly syncPushQueue: Queue<SyncPushJobData>,
    private readonly outboxService: SyncOutboxService,
    private readonly observability: ObservabilityService,
  ) {}

  async enqueue(userId: string, macAddress: string, dto: PushSyncChunkDto) {
    return this.tracer.startActiveSpan('sync.push.enqueue', async (span) => {
      try {
        const existing = await this.outboxService.findByNaturalKey({
          syncSessionId: dto.syncSessionId,
          entityName: dto.entityName,
          chunkIndex: dto.chunkIndex,
        });

        if (existing?.status === 'COMPLETED') {
          return {
            accepted: true,
            jobId: existing.queueJobId,
            outboxId: existing.id,
            syncSessionId: existing.syncSessionId,
            entityName: existing.entityName,
            chunkIndex: existing.chunkIndex,
            status: existing.status,
          };
        }

        const outbox = existing ?? (await this.outboxService.createPending({
          syncSessionId: dto.syncSessionId,
          entityName: dto.entityName,
          chunkIndex: dto.chunkIndex,
          totalChunks: dto.totalChunks,
          payloadHash: this.hashPayload(dto),
          payload: dto.records,
          userId,
          macAddress,
        }));

        const queueJob = await this.syncPushQueue.add(
          'process-sync-push',
          { outboxId: outbox.id },
          {
            jobId: outbox.id,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: false,
          },
        );

        const queuedOutbox = outbox.status === 'COMPLETED'
          ? outbox
          : await this.outboxService.markQueued(outbox.id, String(queueJob.id));

        await this.refreshQueueMetrics();

        return {
          accepted: true,
          jobId: queuedOutbox.queueJobId,
          outboxId: queuedOutbox.id,
          syncSessionId: queuedOutbox.syncSessionId,
          entityName: queuedOutbox.entityName,
          chunkIndex: queuedOutbox.chunkIndex,
          status: queuedOutbox.status,
        };
      } finally {
        span.end();
      }
    });
  }

  async getStatus(outboxId: string, user: AuthenticatedUser) {
    const outbox = await this.outboxService.findById(outboxId);
    if (outbox.userId !== user.sub && user.rol !== 'ADMIN') {
      throw new ForbiddenException('No autorizado para consultar este job de sincronizacion');
    }

    return this.outboxService.toStatusResponse(outbox);
  }

  async refreshQueueMetrics(): Promise<void> {
    const counts = await this.syncPushQueue.getJobCounts('waiting', 'active', 'failed');
    this.observability.setSyncPushQueueCounts({
      waiting: counts.waiting,
      active: counts.active,
      failed: counts.failed,
    });
  }

  private hashPayload(dto: PushSyncChunkDto): string {
    return createHash('sha256')
      .update(JSON.stringify({
        syncSessionId: dto.syncSessionId,
        entityName: dto.entityName,
        chunkIndex: dto.chunkIndex,
        totalChunks: dto.totalChunks,
        records: dto.records,
      }))
      .digest('hex');
  }
}
