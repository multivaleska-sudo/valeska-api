import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchemasToMatchFrontend1774411142391 implements MigrationInterface {
    name = 'UpdateSchemasToMatchFrontend1774411142391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "presentantes" ("id" uuid NOT NULL, "partida_registral" character varying, "oficina_registral" character varying, "domicilio" character varying, "dni" character varying NOT NULL, "primer_apellido" character varying NOT NULL, "segundo_apellido" character varying, "nombres" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sync_status" character varying NOT NULL DEFAULT 'SYNCED', CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0" UNIQUE ("dni"), CONSTRAINT "PK_2efd4986a2050ef837cb94de22c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP COLUMN "es_representante"`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP COLUMN "presentante_persona"`);
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" DROP COLUMN "representantes"`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "tarjeta_en_oficina" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "fecha_tarjeta_en_oficina" character varying`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "placa_en_oficina" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "fecha_placa_en_oficina" character varying`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "metodo_entrega_tarjeta" character varying`);
        await queryRunner.query(`ALTER TABLE "tramites" ADD "metodo_entrega_placa" character varying`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD "presentante_id" character varying`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD "numero_recibo_tramite" character varying`);
        await queryRunner.query(`ALTER TABLE "sucursales" ADD "sync_status" character varying NOT NULL DEFAULT 'LOCAL_INSERT'`);
        await queryRunner.query(`ALTER TABLE "dispositivos" ADD "sync_status" character varying NOT NULL DEFAULT 'LOCAL_INSERT'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "sync_status" character varying NOT NULL DEFAULT 'LOCAL_INSERT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "sync_status"`);
        await queryRunner.query(`ALTER TABLE "dispositivos" DROP COLUMN "sync_status"`);
        await queryRunner.query(`ALTER TABLE "sucursales" DROP COLUMN "sync_status"`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP COLUMN "numero_recibo_tramite"`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP COLUMN "presentante_id"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "metodo_entrega_placa"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "metodo_entrega_tarjeta"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "fecha_placa_en_oficina"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "placa_en_oficina"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "fecha_tarjeta_en_oficina"`);
        await queryRunner.query(`ALTER TABLE "tramites" DROP COLUMN "tarjeta_en_oficina"`);
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" ADD "representantes" text`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD "presentante_persona" character varying`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD "es_representante" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "presentantes"`);
    }

}
