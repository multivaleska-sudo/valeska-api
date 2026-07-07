import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileSearchIndexes1788000000000 implements MigrationInterface {
  name = 'AddMobileSearchIndexes1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "clientes_razon_social_mobile_trgm_idx"
      ON "clientes" USING gin ("razon_social_nombres" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "clientes_numero_documento_mobile_trgm_idx"
      ON "clientes" USING gin ("numero_documento" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_n_titulo_mobile_trgm_idx"
      ON "tramites" USING gin ("n_titulo" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "vehiculos_placa_mobile_trgm_idx"
      ON "vehiculos" USING gin ("placa" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "vehiculos_motor_mobile_trgm_idx"
      ON "vehiculos" USING gin ("motor" gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "vehiculos_chasis_vin_mobile_trgm_idx"
      ON "vehiculos" USING gin ("chasis_vin" gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "vehiculos_chasis_vin_mobile_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "vehiculos_motor_mobile_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "vehiculos_placa_mobile_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_n_titulo_mobile_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clientes_numero_documento_mobile_trgm_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clientes_razon_social_mobile_trgm_idx"`);
  }
}
