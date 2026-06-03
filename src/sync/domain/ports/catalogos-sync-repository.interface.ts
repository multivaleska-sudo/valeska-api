import { CatalogoTipoTramite, CatalogoSituacion } from '../../../tramites/entities/catalogos.entity';

export const CATALOGOS_SYNC_REPOSITORY_TOKEN = Symbol('ICatalogosSyncRepository');

export interface ICatalogosSyncRepository {
    /**
     * Realiza un UPSERT por lotes de los tipos de trámite.
     */
    upsertTiposTramite(manager: any, tipos: Partial<CatalogoTipoTramite>[]): Promise<void>;

    /**
     * Realiza un UPSERT por lotes de las situaciones.
     */
    upsertSituaciones(manager: any, situaciones: Partial<CatalogoSituacion>[]): Promise<void>;

    /**
     * Obtiene tipos de trámite modificados a partir de un cursor de sincronización.
     */
    fetchTiposTramiteCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoTipoTramite[]>;

    /**
     * Obtiene situaciones modificadas a partir de un cursor de sincronización.
     */
    fetchSituacionesCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoSituacion[]>;
}