import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncOutboxJobs1782000000000 implements MigrationInterface {
  name = 'AddSyncOutboxJobs1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sync_outbox_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sync_session_id" uuid NOT NULL,
        "entity_name" character varying NOT NULL,
        "chunk_index" integer NOT NULL,
        "total_chunks" integer NOT NULL,
        "payload_hash" character varying(64) NOT NULL,
        "payload" jsonb NOT NULL,
        "user_id" uuid NOT NULL,
        "mac_address" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "queue_job_id" character varying,
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "queued_at" TIMESTAMP,
        "processing_started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "failed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_outbox_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "sync_outbox_dedup_idx"
      ON "sync_outbox_jobs" ("sync_session_id", "entity_name", "chunk_index")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sync_outbox_status_idx"
      ON "sync_outbox_jobs" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sync_outbox_status_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sync_outbox_dedup_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sync_outbox_jobs"`);
  }
}
