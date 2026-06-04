import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenAuthAndSync1781000000000 implements MigrationInterface {
  name = 'HardenAuthAndSync1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "code_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_codes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "password_reset_codes" ADD COLUMN IF NOT EXISTS "code_hash" character varying`);
    await queryRunner.query(`ALTER TABLE "password_reset_codes" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "password_reset_codes" ADD COLUMN IF NOT EXISTS "used_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "password_reset_codes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "password_reset_lookup_idx" ON "password_reset_codes" ("email", "used_at", "expires_at")`);

    await queryRunner.query(`ALTER TABLE "sucursales" ADD COLUMN IF NOT EXISTS "codigo" character varying`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "usuarios_updated_at_id_idx" ON "usuarios" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "dispositivos_updated_at_id_idx" ON "dispositivos" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "sucursales_updated_at_id_idx" ON "sucursales" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "tramites_updated_at_id_idx" ON "tramites" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "tramite_detalles_updated_at_id_idx" ON "tramite_detalles" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "catalogo_tipos_tramite_updated_at_id_idx" ON "catalogo_tipos_tramite" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "catalogo_situaciones_updated_at_id_idx" ON "catalogo_situaciones" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "clientes_updated_at_id_idx" ON "clientes" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "vehiculos_updated_at_id_idx" ON "vehiculos" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "empresas_gestoras_updated_at_id_idx" ON "empresas_gestoras" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "plantillas_documentos_updated_at_id_idx" ON "plantillas_documentos" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "presentantes_updated_at_id_idx" ON "presentantes" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "representantes_legales_updated_at_id_idx" ON "representantes_legales" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "perfiles_gestor_updated_at_id_idx" ON "perfiles_gestor" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "message_templates_updated_at_id_idx" ON "message_templates" ("updated_at", "id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "sync_conflictos_fecha_id_idx" ON "sync_conflictos" ("fecha_conflicto", "id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sync_conflictos_fecha_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "message_templates_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "perfiles_gestor_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "representantes_legales_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "presentantes_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "plantillas_documentos_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "empresas_gestoras_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "vehiculos_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clientes_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "catalogo_situaciones_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "catalogo_tipos_tramite_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramite_detalles_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sucursales_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "dispositivos_updated_at_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "usuarios_updated_at_id_idx"`);
    await queryRunner.query(`ALTER TABLE "sucursales" DROP COLUMN IF EXISTS "codigo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "password_reset_lookup_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_codes"`);
  }
}
