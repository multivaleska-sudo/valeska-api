import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SyncEntityName } from '../domain/sync-entity-name';

export const SYNC_OUTBOX_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'COMPLETED_WITH_CONFLICTS',
  'FAILED',
  'DEAD_LETTER',
] as const;

export type SyncOutboxStatus = (typeof SYNC_OUTBOX_STATUSES)[number];

@Entity('sync_outbox_jobs')
@Index('sync_outbox_dedup_idx', ['syncSessionId', 'entityName', 'chunkIndex'], { unique: true })
@Index('sync_outbox_status_idx', ['status'])
export class SyncOutboxJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sync_session_id', type: 'uuid' })
  syncSessionId!: string;

  @Column({ name: 'entity_name', type: 'varchar' })
  entityName!: SyncEntityName;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex!: number;

  @Column({ name: 'total_chunks', type: 'int' })
  totalChunks!: number;

  @Column({ name: 'payload_hash', type: 'varchar', length: 64 })
  payloadHash!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>[];

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'mac_address', type: 'varchar' })
  macAddress!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: SyncOutboxStatus;

  @Column({ name: 'queue_job_id', type: 'varchar', nullable: true })
  queueJobId!: string | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'conflict_count', type: 'int', default: 0 })
  conflictCount!: number;

  @Column({ name: 'accepted_record_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  acceptedRecordIds!: string[];

  @Column({ name: 'conflicted_record_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  conflictedRecordIds!: string[];

  @Column({ name: 'conflict_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  conflictIds!: string[];

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'queued_at', type: 'timestamp', nullable: true })
  queuedAt!: Date | null;

  @Column({ name: 'processing_started_at', type: 'timestamp', nullable: true })
  processingStartedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
