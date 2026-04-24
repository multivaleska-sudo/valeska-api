import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeColumnToNotUnique1777074907415 implements MigrationInterface {
    name = 'ChangeColumnToNotUnique1777074907415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tramites" DROP CONSTRAINT "UQ_f9d5de31b9842746cf6809ba014"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tramites" ADD CONSTRAINT "UQ_f9d5de31b9842746cf6809ba014" UNIQUE ("codigo_verificacion")`);
    }

}
