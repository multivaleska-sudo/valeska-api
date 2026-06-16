import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncNoDataLossGuarantees1784000000000 implements MigrationInterface {
  name = 'AddSyncNoDataLossGuarantees1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      ALTER TABLE "sync_outbox_jobs"
      ADD COLUMN IF NOT EXISTS "accepted_record_ids" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "sync_outbox_jobs"
      ADD COLUMN IF NOT EXISTS "conflicted_record_ids" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "sync_outbox_jobs"
      ADD COLUMN IF NOT EXISTS "conflict_ids" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sync_change_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_name" character varying NOT NULL,
        "record_id" character varying NOT NULL,
        "operation" character varying NOT NULL,
        "before_json" jsonb,
        "after_json" jsonb,
        "user_id" uuid,
        "device_mac" character varying,
        "outbox_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_change_log_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sync_change_log_entity_record_idx"
      ON "sync_change_log" ("entity_name", "record_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sync_change_log_outbox_idx"
      ON "sync_change_log" ("outbox_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sync_change_log_outbox_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sync_change_log_entity_record_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sync_change_log"`);
    await queryRunner.query(`ALTER TABLE "sync_outbox_jobs" DROP COLUMN IF EXISTS "conflict_ids"`);
    await queryRunner.query(`ALTER TABLE "sync_outbox_jobs" DROP COLUMN IF EXISTS "conflicted_record_ids"`);
    await queryRunner.query(`ALTER TABLE "sync_outbox_jobs" DROP COLUMN IF EXISTS "accepted_record_ids"`);
  }
}
