import { Tramite, TramiteDetalle } from '../../../tramites/entities/tramite.entity';

export const TRAMITES_SYNC_REPOSITORY_TOKEN = Symbol('ITramitesSyncRepository');

export interface ITramitesSyncRepository {
    /**
     * Realiza un UPSERT por lotes de los trámites mitigando bloqueos transaccionales largos.
     */
    upsertTramites(manager: any, tramites: Partial<Tramite>[]): Promise<void>;

    /**
     * Realiza un UPSERT por lotes de los detalles de trámites.
     */
    upsertTramiteDetalles(manager: any, detalles: Partial<TramiteDetalle>[]): Promise<void>;

    /**
     * Obtiene trámites modificados a partir de un cursor compuesto (updatedAt, lastId)
     * para garantizar consumo de memoria plano O(1).
     */
    fetchTramitesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Tramite[]>;

    /**
     * Obtiene detalles de trámites modificados a partir de un cursor compuesto.
     */
    fetchTramiteDetallesCursor(cursorDate: Date, lastId: string, limit: number): Promise<TramiteDetalle[]>;
}