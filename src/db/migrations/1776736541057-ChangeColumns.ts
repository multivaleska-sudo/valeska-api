import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumns1776736541057 implements MigrationInterface {
    name = 'ChangeColumns1776736541057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clientes" ALTER COLUMN "numero_documento" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clientes" ALTER COLUMN "razon_social_nombres" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ALTER COLUMN "chasis_vin" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ALTER COLUMN "marca" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "dni" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tramites" ALTER COLUMN "codigo_verificacion" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tramites" ALTER COLUMN "codigo_verificacion" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "presentantes" ALTER COLUMN "dni" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ALTER COLUMN "marca" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ALTER COLUMN "chasis_vin" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clientes" ALTER COLUMN "razon_social_nombres" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clientes" ALTER COLUMN "numero_documento" SET NOT NULL`);
    }

}
