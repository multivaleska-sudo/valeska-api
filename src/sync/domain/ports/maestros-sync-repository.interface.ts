import {
    Cliente,
    Vehiculo,
    EmpresaGestora,
    PlantillaDocumento,
    Presentante,
    RepresentanteLegal
} from '../../../tramites/entities/maestros.entity';

export const MAESTROS_SYNC_REPOSITORY_TOKEN = Symbol('IMaestrosSyncRepository');

export interface IMaestrosSyncRepository {
    /**
     * Realiza UPSERTs segmentados por lotes para cada entidad maestra.
     */
    upsertClientes(manager: any, clientes: Partial<Cliente>[]): Promise<void>;
    upsertVehiculos(manager: any, vehiculos: Partial<Vehiculo>[]): Promise<void>;
    upsertEmpresasGestoras(manager: any, empresas: Partial<EmpresaGestora>[]): Promise<void>;
    upsertPlantillasDocumentos(manager: any, plantillas: Partial<PlantillaDocumento>[]): Promise<void>;
    upsertPresentantes(manager: any, presentantes: Partial<Presentante>[]): Promise<void>;
    upsertRepresentantesLegales(manager: any, representantes: Partial<RepresentanteLegal>[]): Promise<void>;

    /**
     * Consultas paginadas basadas en cursor compuesto (updatedAt, lastId) para cada entidad.
     */
    fetchClientesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Cliente[]>;
    fetchVehiculosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Vehiculo[]>;
    fetchEmpresasGestorasCursor(cursorDate: Date, lastId: string, limit: number): Promise<EmpresaGestora[]>;
    fetchPlantillasCursor(cursorDate: Date, lastId: string, limit: number): Promise<PlantillaDocumento[]>;
    fetchPresentantesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Presentante[]>;
    fetchRepresentantesCursor(cursorDate: Date, lastId: string, limit: number): Promise<RepresentanteLegal[]>;
}