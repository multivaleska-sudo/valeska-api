import { MigrationInterface, QueryRunner } from "typeorm";

export class AjustarMultiplataformaUsuarios1780450413611 implements MigrationInterface {
    name = 'AjustarMultiplataformaUsuarios1780450413611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dispositivos" ADD "usuario_id" uuid`);
        await queryRunner.query(`ALTER TABLE "dispositivos" ADD CONSTRAINT "FK_8e1ab92ee60373dfa266103c9b3" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dispositivos" DROP CONSTRAINT "FK_8e1ab92ee60373dfa266103c9b3"`);
        await queryRunner.query(`ALTER TABLE "dispositivos" DROP COLUMN "usuario_id"`);
    }

}
