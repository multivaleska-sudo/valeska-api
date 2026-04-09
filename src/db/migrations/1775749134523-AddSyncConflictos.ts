import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncConflictos1775749134523 implements MigrationInterface {
    name = 'AddSyncConflictos1775749134523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sync_conflictos" ("id" uuid NOT NULL, "tabla_afectada" character varying NOT NULL, "registro_id" character varying NOT NULL, "identificador_visual" character varying, "datos_locales" text NOT NULL, "datos_remotos" text NOT NULL, "resuelto" boolean NOT NULL DEFAULT false, "fecha_conflicto" TIMESTAMP NOT NULL, CONSTRAINT "PK_8f914da51ee246acb33cf3665d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "conflicto_registro_idx" ON "sync_conflictos" ("registro_id") `);
        await queryRunner.query(`CREATE INDEX "conflicto_resuelto_idx" ON "sync_conflictos" ("resuelto") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."conflicto_resuelto_idx"`);
        await queryRunner.query(`DROP INDEX "public"."conflicto_registro_idx"`);
        await queryRunner.query(`DROP TABLE "sync_conflictos"`);
    }

}
