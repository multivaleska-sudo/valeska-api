import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncOutboxJob, SyncOutboxStatus } from '../entities/sync-outbox-job.entity';

@Injectable()
export class SyncOutboxService {
  constructor(
    @InjectRepository(SyncOutboxJob)
    private readonly outboxRepo: Repository<SyncOutboxJob>,
  ) {}

  async findById(id: string): Promise<SyncOutboxJob> {
    const job = await this.outboxRepo.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException('Outbox job no encontrado');
    }

    return job;
  }

  async findByNaturalKey(input: {
    syncSessionId: string;
    entityName: string;
    chunkIndex: number;
  }): Promise<SyncOutboxJob | null> {
    return this.outboxRepo.findOne({
      where: {
        syncSessionId: input.syncSessionId,
        entityName: input.entityName as SyncOutboxJob['entityName'],
        chunkIndex: input.chunkIndex,
      },
    });
  }

  async createPending(input: {
    syncSessionId: string;
    entityName: SyncOutboxJob['entityName'];
    chunkIndex: number;
    totalChunks: number;
    payloadHash: string;
    payload: Record<string, unknown>[];
    userId: string;
    macAddress: string;
  }): Promise<SyncOutboxJob> {
    const entity = this.outboxRepo.create({
      ...input,
      status: 'PENDING',
      attempts: 0,
      queueJobId: null,
      lastError: null,
      queuedAt: null,
      processingStartedAt: null,
      completedAt: null,
      failedAt: null,
    });

    try {
      return await this.outboxRepo.save(entity);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existing = await this.findByNaturalKey(input);
        if (existing) return existing;
      }

      throw error;
    }
  }

  async markQueued(id: string, queueJobId: string): Promise<SyncOutboxJob> {
    await this.outboxRepo.update(
      { id },
      {
        status: 'QUEUED',
        queueJobId,
        queuedAt: new Date(),
      },
    );
    return this.findById(id);
  }

  async markProcessing(id: string, attempts: number): Promise<void> {
    await this.outboxRepo.update(
      { id },
      {
        status: 'PROCESSING',
        attempts,
        processingStartedAt: new Date(),
        lastError: null,
      },
    );
  }

  async markCompleted(id: string): Promise<void> {
    await this.outboxRepo.update(
      { id },
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        failedAt: null,
        lastError: null,
      },
    );
  }

  async markFailed(id: string, status: Extract<SyncOutboxStatus, 'FAILED' | 'DEAD_LETTER'>, error: unknown): Promise<void> {
    await this.outboxRepo.update(
      { id },
      {
        status,
        failedAt: new Date(),
        lastError: this.sanitizeError(error),
      },
    );
  }

  toStatusResponse(job: SyncOutboxJob) {
    return {
      outboxId: job.id,
      jobId: job.queueJobId,
      syncSessionId: job.syncSessionId,
      entityName: job.entityName,
      chunkIndex: job.chunkIndex,
      totalChunks: job.totalChunks,
      status: job.status,
      attempts: job.attempts,
      queuedAt: job.queuedAt,
      processingStartedAt: job.processingStartedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      lastError: job.lastError,
    };
  }

  private sanitizeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 2000);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
