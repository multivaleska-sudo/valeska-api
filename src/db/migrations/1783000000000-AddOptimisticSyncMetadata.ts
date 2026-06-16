import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOptimisticSyncMetadata1783000000000 implements MigrationInterface {
  name = 'AddOptimisticSyncMetadata1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addVersionColumns(queryRunner, 'tramites');
    await this.addVersionColumns(queryRunner, 'tramite_detalles');
    await this.addVersionColumns(queryRunner, 'clientes');
    await this.addVersionColumns(queryRunner, 'vehiculos');

    await queryRunner.query(`
      ALTER TABLE "sync_outbox_jobs"
      ADD COLUMN IF NOT EXISTS "conflict_count" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sync_outbox_jobs" DROP COLUMN IF EXISTS "conflict_count"`);
    await this.dropVersionColumns(queryRunner, 'vehiculos');
    await this.dropVersionColumns(queryRunner, 'clientes');
    await this.dropVersionColumns(queryRunner, 'tramite_detalles');
    await this.dropVersionColumns(queryRunner, 'tramites');
  }

  private async addVersionColumns(queryRunner: QueryRunner, tableName: string): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ADD COLUMN IF NOT EXISTS "base_version" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ADD COLUMN IF NOT EXISTS "updated_by_user_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ADD COLUMN IF NOT EXISTS "updated_by_device_mac" character varying
    `);
  }

  private async dropVersionColumns(queryRunner: QueryRunner, tableName: string): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "updated_by_device_mac"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "updated_by_user_id"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "base_version"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "version"`);
  }
}
