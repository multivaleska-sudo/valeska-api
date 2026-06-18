import { MigrationInterface, QueryRunner } from "typeorm";

export class EliminarUniqueClienteDni1787000000000 implements MigrationInterface {
    name = 'EliminarUniqueClienteDni1787000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ 
            DECLARE 
                constraint_name text; 
            BEGIN 
                SELECT tc.constraint_name INTO constraint_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.constraint_column_usage AS ccu 
                ON tc.constraint_name = ccu.constraint_name 
                WHERE tc.table_name = 'clientes' AND ccu.column_name = 'numero_documento' AND tc.constraint_type = 'UNIQUE'; 

                IF constraint_name IS NOT NULL THEN 
                    EXECUTE 'ALTER TABLE clientes DROP CONSTRAINT "' || constraint_name || '"'; 
                END IF; 
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Para revertir, volvemos a crear la restricción UNIQUE
        await queryRunner.query(`ALTER TABLE "clientes" ADD CONSTRAINT "UQ_numero_documento_clientes" UNIQUE ("numero_documento")`);
    }
}