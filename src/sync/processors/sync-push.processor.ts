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
  ) {
    super();
  }

  async process(job: Job<SyncPushJobData>): Promise<void> {
    await this.tracer.startActiveSpan('sync.push.process', async (span) => {
      const outbox = await this.outboxService.findById(job.data.outboxId);
      const stopTimer = this.observability.startSyncPushTimer(outbox.entityName);

      try {
        if (['COMPLETED', 'COMPLETED_WITH_CONFLICTS'].includes(outbox.status)) {
          return;
        }

        await this.outboxService.markProcessing(outbox.id, job.attemptsMade + 1);

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
      } catch (error) {
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        const status = isLastAttempt ? 'DEAD_LETTER' : 'FAILED';
        await this.outboxService.markFailed(outbox.id, status, error);
        this.observability.incrementSyncPushJob(outbox.entityName, status);
        this.logger.error(`Fallo procesando outbox ${outbox.id}: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      } finally {
        stopTimer();
        span.end();
      }
    });
  }
}
