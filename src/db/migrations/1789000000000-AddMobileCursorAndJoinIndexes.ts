import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileCursorAndJoinIndexes1789000000000 implements MigrationInterface {
  name = 'AddMobileCursorAndJoinIndexes1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_mobile_active_updated_id_idx"
      ON "tramites" ("updated_at" DESC, "id" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_cliente_id_mobile_idx"
      ON "tramites" ("cliente_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_vehiculo_id_mobile_idx"
      ON "tramites" ("vehiculo_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_tipo_tramite_id_mobile_idx"
      ON "tramites" ("tipo_tramite_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_situacion_id_mobile_idx"
      ON "tramites" ("situacion_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_usuario_creador_id_mobile_idx"
      ON "tramites" ("usuario_creador_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramite_detalles_tramite_id_mobile_idx"
      ON "tramite_detalles" ("tramite_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramite_detalles_empresa_gestora_id_mobile_idx"
      ON "tramite_detalles" ("empresa_gestora_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramite_detalles_presentante_id_mobile_idx"
      ON "tramite_detalles" ("presentante_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "clientes_id_text_mobile_idx"
      ON "clientes" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "vehiculos_id_text_mobile_idx"
      ON "vehiculos" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "tramites_id_text_mobile_idx"
      ON "tramites" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "empresas_gestoras_id_text_mobile_idx"
      ON "empresas_gestoras" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "presentantes_id_text_mobile_idx"
      ON "presentantes" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "usuarios_id_text_mobile_idx"
      ON "usuarios" (("id"::text))
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "catalogo_tipos_tramite_id_text_mobile_idx"
      ON "catalogo_tipos_tramite" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "catalogo_situaciones_id_text_mobile_idx"
      ON "catalogo_situaciones" (("id"::text))
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "catalogo_situaciones_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "catalogo_tipos_tramite_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "usuarios_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "presentantes_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "empresas_gestoras_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "vehiculos_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clientes_id_text_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramite_detalles_presentante_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramite_detalles_empresa_gestora_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramite_detalles_tramite_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_usuario_creador_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_situacion_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_tipo_tramite_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_vehiculo_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_cliente_id_mobile_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "tramites_mobile_active_updated_id_idx"`);
  }
}
