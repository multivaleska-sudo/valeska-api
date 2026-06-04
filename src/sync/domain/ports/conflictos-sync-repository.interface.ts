import { EntityManager } from 'typeorm';
import { SyncConflicto } from '../../entities/sync-conflict.entity';

export const CONFLICTOS_SYNC_REPOSITORY_TOKEN = Symbol('IConflictosSyncRepository');

/**
 * Puerto de dominio para registrar colisiones lógicas durante la sincronización activa.
 */
export interface IConflictosSyncRepository {
    /**
     * Inserta o actualiza colisiones lógicas encontradas.
     */
    upsertConflictos(tx: EntityManager, conflictos: Partial<SyncConflicto>[]): Promise<void>;

    /**
     * Obtiene el listado de colisiones registradas a partir de un cursor de desempate.
     */
    fetchConflictosCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<SyncConflicto[]>;
}
