import { CatalogoTipoTramite, CatalogoSituacion } from '../../../tramites/entities/catalogos.entity';

export const CATALOGOS_SYNC_REPOSITORY_TOKEN = Symbol('ICatalogosSyncRepository');

/**
 * Puerto de dominio para aislar la persistencia y lectura de los Catálogos operativos.
 */
export interface ICatalogosSyncRepository {
    /**
     * Realiza un UPSERT por lotes de los Tipos de Trámite.
     */
    upsertTiposTramite(tx: any, tipos: Partial<CatalogoTipoTramite>[]): Promise<void>;

    /**
     * Realiza un UPSERT por lotes de las Situaciones de Trámite.
     */
    upsertSituaciones(tx: any, situaciones: Partial<CatalogoSituacion>[]): Promise<void>;

    /**
     * Recupera tipos de trámite de forma paginada para sincronización pull.
     */
    fetchTiposTramiteCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoTipoTramite[]>;

    /**
     * Recupera situaciones de trámite de forma paginada para sincronización pull.
     */
    fetchSituacionesCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoSituacion[]>;
}