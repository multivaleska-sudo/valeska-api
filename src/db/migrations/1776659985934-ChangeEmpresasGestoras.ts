import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEmpresasGestoras1776659985934 implements MigrationInterface {
    name = 'ChangeEmpresasGestoras1776659985934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "representantes_legales" ("id" uuid NOT NULL, "empresa_gestora_id" uuid NOT NULL, "dni" character varying(20) NOT NULL, "nombres" character varying(100) NOT NULL, "primer_apellido" character varying(100) NOT NULL, "segundo_apellido" character varying(100), "partida_registral" character varying(50), "oficina_registral" character varying(100), "domicilio" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sync_status" character varying NOT NULL DEFAULT 'SYNCED', CONSTRAINT "UQ_713058aa90d6e6d537d97014ced" UNIQUE ("dni"), CONSTRAINT "PK_702c17162a0b66efeede922b91f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_templates" ("id" uuid NOT NULL, "name" character varying NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sync_status" character varying NOT NULL DEFAULT 'SYNCED', CONSTRAINT "UQ_87ceb46338feac77623f4bad9a7" UNIQUE ("name"), CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "partida_registral"`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "oficina_registral"`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "domicilio"`);

        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD "representante_legal_id" uuid`);

        await queryRunner.query(`ALTER TABLE "presentantes" DROP CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "dni" TYPE character varying(20)`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0" UNIQUE ("dni")`);

        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "nombres" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "primer_apellido" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "segundo_apellido" TYPE character varying(100)`);

        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD CONSTRAINT "FK_a0b4ce877c71963d19c4d990dff" FOREIGN KEY ("empresa_gestora_id") REFERENCES "empresas_gestoras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tramite_detalles" ADD CONSTRAINT "FK_bf8bf9ed7f8c2ca11cf4c8ea6f3" FOREIGN KEY ("representante_legal_id") REFERENCES "representantes_legales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP CONSTRAINT "FK_bf8bf9ed7f8c2ca11cf4c8ea6f3"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP CONSTRAINT "FK_a0b4ce877c71963d19c4d990dff"`);

        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "segundo_apellido" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "primer_apellido" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "nombres" TYPE character varying`);

        await queryRunner.query(`ALTER TABLE "presentantes" DROP CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "dni" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0" UNIQUE ("dni")`);

        await queryRunner.query(`ALTER TABLE "tramite_detalles" DROP COLUMN "representante_legal_id"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "domicilio" character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "oficina_registral" character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "partida_registral" character varying`);
        await queryRunner.query(`DROP TABLE "message_templates"`);
        await queryRunner.query(`DROP TABLE "representantes_legales"`);
    }
}