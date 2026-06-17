import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase2ConflictosMetadata1720000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE sync_conflictos
        ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS resolved_by_user_id uuid,
        ADD COLUMN IF NOT EXISTS resolved_by_device_mac varchar,
        ADD COLUMN IF NOT EXISTS resolution_strategy varchar,
        ADD COLUMN IF NOT EXISTS resolution_payload jsonb,
        ADD COLUMN IF NOT EXISTS resolution_note text;
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS sync_conflictos_resolved_at_idx
        ON sync_conflictos (resolved_at);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      DROP INDEX IF EXISTS sync_conflictos_resolved_at_idx;
    `);

        await queryRunner.query(`
      ALTER TABLE sync_conflictos
        DROP COLUMN IF EXISTS resolved_at,
        DROP COLUMN IF EXISTS resolved_by_user_id,
        DROP COLUMN IF EXISTS resolved_by_device_mac,
        DROP COLUMN IF EXISTS resolution_strategy,
        DROP COLUMN IF EXISTS resolution_payload,
        DROP COLUMN IF EXISTS resolution_note;
    `);
    }
}