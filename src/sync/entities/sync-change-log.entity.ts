import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { SyncEntityName } from '../domain/sync-entity-name';

export type SyncChangeOperation = 'INSERT' | 'UPDATE' | 'CONFLICT';

@Entity('sync_change_log')
@Index('sync_change_log_entity_record_idx', ['entityName', 'recordId'])
@Index('sync_change_log_outbox_idx', ['outboxId'])
export class SyncChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entity_name', type: 'varchar' })
  entityName!: SyncEntityName | string;

  @Column({ name: 'record_id', type: 'varchar' })
  recordId!: string;

  @Column({ type: 'varchar' })
  operation!: SyncChangeOperation;

  @Column({ name: 'before_json', type: 'jsonb', nullable: true })
  beforeJson!: Record<string, unknown> | null;

  @Column({ name: 'after_json', type: 'jsonb', nullable: true })
  afterJson!: Record<string, unknown> | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'device_mac', type: 'varchar', nullable: true })
  deviceMac!: string | null;

  @Column({ name: 'outbox_id', type: 'uuid', nullable: true })
  outboxId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
