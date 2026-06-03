import { SyncConflicto } from '../../entities/sync-conflict.entity';

export const CONFLICTOS_SYNC_REPOSITORY_TOKEN = Symbol('IConflictosSyncRepository');

export interface IConflictosSyncRepository {
    /**
     * Inserta o actualiza colisiones de sincronización en el sistema central.
     */
    upsertConflictos(manager: any, conflictos: Partial<SyncConflicto>[]): Promise<void>;

    /**
     * Obtiene logs de conflictos a partir de un cursor.
     */
    fetchConflictosCursor(cursorDate: Date, lastId: string, limit: number): Promise<SyncConflicto[]>;
}