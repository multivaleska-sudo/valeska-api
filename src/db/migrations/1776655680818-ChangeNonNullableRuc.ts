import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeNonNullableRuc1776655680818 implements MigrationInterface {
    name = 'ChangeNonNullableRuc1776655680818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" ALTER COLUMN "ruc" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "empresas_gestoras" ALTER COLUMN "ruc" SET NOT NULL`);
    }

}
