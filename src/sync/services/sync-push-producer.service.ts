import { InjectQueue } from '@nestjs/bullmq';
import { ForbiddenException, Injectable, ConflictException } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { SYNC_PUSH_QUEUE } from '../../queue/queue.constants';
import { ObservabilityService } from '../../observability/observability.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { PushSyncChunkDto } from '../infrastructure/http/dtos/common/base-chunk.dto';
import { SyncOutboxService } from './sync-outbox.service';
import { PushSyncBatchDto } from '../infrastructure/http/dtos/common/base-chunk.dto';

export interface SyncPushJobData {
  outboxId?: string;
  isBatch?: boolean;
  outboxIds?: string[];
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
        if (existing && existing.payloadHash !== this.hashPayload(dto)) {
          throw new ConflictException('Outbox payloadHash no coincide. Intento de reusar chunkIndex con datos distintos en la misma sesion.');
        }

        if (existing && ['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(existing.status)) {
          return {
            accepted: true,
            jobId: existing.queueJobId,
            outboxId: existing.id,
            syncSessionId: existing.syncSessionId,
            entityName: existing.entityName,
            chunkIndex: existing.chunkIndex,
            status: existing.status,
            conflictCount: existing.conflictCount,
            acceptedRecordIds: existing.acceptedRecordIds ?? [],
            conflictedRecordIds: existing.conflictedRecordIds ?? [],
            conflictIds: existing.conflictIds ?? [],
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
          conflictCount: queuedOutbox.conflictCount,
          acceptedRecordIds: queuedOutbox.acceptedRecordIds ?? [],
          conflictedRecordIds: queuedOutbox.conflictedRecordIds ?? [],
          conflictIds: queuedOutbox.conflictIds ?? [],
        };
      } finally {
        span.end();
      }
    });
  }

  async enqueueBatch(userId: string, macAddress: string, dto: PushSyncBatchDto) {
    return this.tracer.startActiveSpan('sync.push.enqueueBatch', async (span) => {
      try {
        const outboxes: any[] = [];
        for (const chunk of dto.chunks) {
          const existing = await this.outboxService.findByNaturalKey({
            syncSessionId: chunk.syncSessionId,
            entityName: chunk.entityName,
            chunkIndex: chunk.chunkIndex,
          });

          if (existing && existing.payloadHash !== this.hashPayload(chunk)) {
            throw new ConflictException(`Outbox payloadHash no coincide para ${chunk.entityName}. Intento de reusar chunkIndex.`);
          }

          if (existing && ['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(existing.status)) {
            outboxes.push(existing);
            continue;
          }

          const outbox = existing ?? (await this.outboxService.createPending({
            syncSessionId: chunk.syncSessionId,
            entityName: chunk.entityName,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            payloadHash: this.hashPayload(chunk),
            payload: chunk.records,
            userId,
            macAddress,
          }));
          outboxes.push(outbox);
        }

        const pendingOutboxes = outboxes.filter(o => !['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(o.status));
        
        let queueJobId = '';
        if (pendingOutboxes.length > 0) {
          const queueJob = await this.syncPushQueue.add(
            'process-sync-push-batch',
            { isBatch: true, outboxIds: pendingOutboxes.map(o => o.id) },
            {
              jobId: pendingOutboxes[0].syncSessionId + '-batch',
              attempts: 5,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: { count: 1000 },
              removeOnFail: false,
            },
          );
          queueJobId = String(queueJob.id);

          for (const outbox of pendingOutboxes) {
            await this.outboxService.markQueued(outbox.id, queueJobId);
            outbox.queueJobId = queueJobId;
            outbox.status = 'QUEUED';
          }
        }

        await this.refreshQueueMetrics();

        return {
          accepted: true,
          isBatch: true,
          outboxes: outboxes.map(o => ({
            jobId: o.queueJobId,
            outboxId: o.id,
            syncSessionId: o.syncSessionId,
            entityName: o.entityName,
            status: o.status,
            conflictCount: o.conflictCount,
          })),
        };
      } finally {
        span.end();
      }
    });
  }

  async getStatus(outboxId: string, user: AuthenticatedUser) {
    const outbox = await this.outboxService.findById(outboxId);
    const canReadAnyJob = ['ADMIN', 'ADMIN_CENTRAL'].includes(user.rol);
    if (outbox.userId !== user.sub && !canReadAnyJob) {
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
        syncProtocolVersion: dto.syncProtocolVersion,
        entityName: dto.entityName,
        chunkIndex: dto.chunkIndex,
        totalChunks: dto.totalChunks,
        records: dto.records,
      }))
      .digest('hex');
  }
}
