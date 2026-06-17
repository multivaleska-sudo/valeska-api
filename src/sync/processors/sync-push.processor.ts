import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Job } from 'bullmq';
import { SYNC_PUSH_QUEUE } from '../../queue/queue.constants';
import { ObservabilityService } from '../../observability/observability.service';
import { PushSyncChunkDto } from '../infrastructure/http/dtos/common/base-chunk.dto';
import { SyncService } from '../sync.service';
import { SyncOutboxService } from '../services/sync-outbox.service';
import { SyncPushJobData } from '../services/sync-push-producer.service';
import { DataSource } from 'typeorm';

@Injectable()
@Processor(SYNC_PUSH_QUEUE, {
  concurrency: parseInt(process.env.SYNC_QUEUE_CONCURRENCY || '5', 10),
})
export class SyncPushProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncPushProcessor.name);
  private readonly tracer = trace.getTracer('sync-push-processor');

  constructor(
    private readonly outboxService: SyncOutboxService,
    private readonly syncService: SyncService,
    private readonly observability: ObservabilityService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<SyncPushJobData>): Promise<void> {
    await this.tracer.startActiveSpan('sync.push.process', async (span) => {
      const isBatch = job.data.isBatch === true;
      const outboxIds = isBatch ? (job.data.outboxIds || []) : [job.data.outboxId as string];
      
      const outboxes: any[] = [];
      for (const id of outboxIds) {
        outboxes.push(await this.outboxService.findById(id));
      }

      if (outboxes.length === 0) return;

      const stopTimer = this.observability.startSyncPushTimer(isBatch ? 'batch' : outboxes[0].entityName);

      try {
        const pendingOutboxes = outboxes.filter(o => !['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(o.status));
        if (pendingOutboxes.length === 0) return;

        for (const outbox of pendingOutboxes) {
          await this.outboxService.markProcessing(outbox.id, job.attemptsMade + 1);
        }

        if (isBatch) {
          let hasConflicts = false;
          await this.dataSource.transaction(async (manager) => {
            for (const outbox of pendingOutboxes) {
              const dto: PushSyncChunkDto = {
                syncProtocolVersion: 2,
                outboxId: outbox.id,
                syncSessionId: outbox.syncSessionId,
                entityName: outbox.entityName,
                chunkIndex: outbox.chunkIndex,
                totalChunks: outbox.totalChunks,
                records: outbox.payload,
              };

              const result = await this.syncService.processPushChunkWithTx(manager, outbox.userId, outbox.macAddress, dto);
              
              if (result && result.conflictCount > 0) {
                hasConflicts = true;
                await this.outboxService.markCompletedWithConflicts(outbox.id, result);
                this.observability.incrementSyncPushJob(outbox.entityName, 'COMPLETED_WITH_CONFLICTS');
              } else {
                await this.outboxService.markCompleted(outbox.id, result || { conflictCount: 0, conflictIds: [], acceptedRecordIds: [], conflictedRecordIds: [] });
                this.observability.incrementSyncPushJob(outbox.entityName, 'COMPLETED');
              }
            }
          });
        } else {
          const outbox = pendingOutboxes[0];
          const dto: PushSyncChunkDto = {
            syncProtocolVersion: 2,
            outboxId: outbox.id,
            syncSessionId: outbox.syncSessionId,
            entityName: outbox.entityName,
            chunkIndex: outbox.chunkIndex,
            totalChunks: outbox.totalChunks,
            records: outbox.payload,
          };

          const result = await this.syncService.processPushChunkNow(outbox.userId, outbox.macAddress, dto);
          if (result.conflictCount > 0) {
            await this.outboxService.markCompletedWithConflicts(outbox.id, result);
            this.observability.incrementSyncPushJob(outbox.entityName, 'COMPLETED_WITH_CONFLICTS');
          } else {
            await this.outboxService.markCompleted(outbox.id, result);
            this.observability.incrementSyncPushJob(outbox.entityName, 'COMPLETED');
          }
        }
      } catch (error) {
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        const status = isLastAttempt ? 'DEAD_LETTER' : 'FAILED';
        for (const outbox of outboxes) {
          if (['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(outbox.status)) continue;
          await this.outboxService.markFailed(outbox.id, status, error);
          this.observability.incrementSyncPushJob(outbox.entityName, status);
        }
        this.logger.error(`Fallo procesando job ${job.id}: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      } finally {
        stopTimer();
        span.end();
      }
    });
  }
}
