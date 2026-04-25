import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnsAgain1777092112808 implements MigrationInterface {
    name = 'ChangeColumnsAgain1777092112808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehiculos" ADD "carroceria" character varying`);
        await queryRunner.query(`ALTER TABLE "vehiculos" DROP CONSTRAINT "UQ_7d3937c1296ab0209a00d07af36"`);
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" DROP CONSTRAINT "UQ_2792a9260288ad2b474808fe118"`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0"`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "dni"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "dni" character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "nombres"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "nombres" character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "primer_apellido"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "primer_apellido" character varying`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "segundo_apellido"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "segundo_apellido" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP CONSTRAINT "UQ_713058aa90d6e6d537d97014ced"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "dni"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "dni" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "nombres"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "nombres" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "primer_apellido"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "primer_apellido" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "segundo_apellido"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "segundo_apellido" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "partida_registral"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "partida_registral" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "oficina_registral"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "oficina_registral" character varying`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "domicilio"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "domicilio" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "domicilio"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "domicilio" text`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "oficina_registral"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "oficina_registral" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "partida_registral"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "partida_registral" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "segundo_apellido"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "segundo_apellido" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "primer_apellido"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "primer_apellido" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "nombres"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "nombres" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" DROP COLUMN "dni"`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD "dni" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "representantes_legales" ADD CONSTRAINT "UQ_713058aa90d6e6d537d97014ced" UNIQUE ("dni")`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "segundo_apellido"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "segundo_apellido" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "primer_apellido"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "primer_apellido" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "nombres"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "nombres" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "presentantes" DROP COLUMN "dni"`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD "dni" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "presentantes" ADD CONSTRAINT "UQ_694af382d4896b4608fd47c8dd0" UNIQUE ("dni")`);
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" ADD CONSTRAINT "UQ_2792a9260288ad2b474808fe118" UNIQUE ("ruc")`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ADD CONSTRAINT "UQ_7d3937c1296ab0209a00d07af36" UNIQUE ("chasis_vin")`);
        await queryRunner.query(`ALTER TABLE "vehiculos" DROP COLUMN "carroceria"`);
    }

}
