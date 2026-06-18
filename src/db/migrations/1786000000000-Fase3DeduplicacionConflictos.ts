import { MigrationInterface, QueryRunner } from "typeorm";

export class Fase3DeduplicacionConflictos1786000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH ranked AS (
                SELECT id,
                ROW_NUMBER() OVER (
                    PARTITION BY tabla_afectada, registro_id
                    ORDER BY fecha_conflicto DESC, id DESC
                ) AS rn
                FROM sync_conflictos
                WHERE resuelto = false
            )
            UPDATE sync_conflictos c
            SET resuelto = true,
                resolved_at = now(),
                resolution_strategy = 'DEDUPED',
                resolution_note = 'Conflicto abierto duplicado cerrado por migracion de deduplicacion'
            FROM ranked r
            WHERE c.id = r.id AND r.rn > 1;
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS sync_conflictos_open_unique_idx
            ON sync_conflictos (tabla_afectada, registro_id)
            WHERE resuelto = false;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS sync_conflictos_open_unique_idx;
        `);
    }
}
