import { Tramite, TramiteDetalle } from '../../../tramites/entities/tramite.entity';

export const TRAMITES_SYNC_REPOSITORY_TOKEN = Symbol('ITramitesSyncRepository');

/**
 * Puerto de dominio para el aislamiento de persistencia de Trámites y sus Detalles.
 */
export interface ITramitesSyncRepository {
    /**
     * Realiza un UPSERT atómico por lotes de los trámites utilizando el contexto de transacción provisto.
     * @param tx El gestor transaccional de la base de datos (EntityManager o equivalente)
     * @param tramites Lote de entidades de tipo Trámite
     */
    upsertTramites(tx: any, tramites: Partial<Tramite>[]): Promise<void>;

    /**
     * Realiza un UPSERT atómico por lotes de los detalles de trámites.
     * @param tx El gestor transaccional de la base de datos
     * @param detalles Lote de entidades de tipo TramiteDetalle
     */
    upsertTramiteDetalles(tx: any, detalles: Partial<TramiteDetalle>[]): Promise<void>;

    /**
     * Obtiene una página de Trámites modificados utilizando cursor compuesto.
     * Evita fugas de memoria al limitar la transferencia de datos.
     */
    fetchTramitesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Tramite[]>;

    /**
     * Obtiene una página de Detalles de Trámite modificados utilizando cursor compuesto.
     */
    fetchTramiteDetallesCursor(cursorDate: Date, lastId: string, limit: number): Promise<TramiteDetalle[]>;
}