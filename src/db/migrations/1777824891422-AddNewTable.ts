import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewTable1777824891422 implements MigrationInterface {
    name = 'AddNewTable1777824891422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "perfiles_gestor" ("id" uuid NOT NULL, "calidad" character varying, "nombre" character varying, "concesionario" character varying, "importador" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sync_status" character varying NOT NULL DEFAULT 'SYNCED', CONSTRAINT "PK_482b3226d249721f3bbab48bd56" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "perfiles_gestor"`);
    }

}
