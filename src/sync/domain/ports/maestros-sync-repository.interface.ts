import {
    Cliente,
    Vehiculo,
    EmpresaGestora,
    PlantillaDocumento,
    Presentante,
    RepresentanteLegal
} from '../../../tramites/entities/maestros.entity';
import { PerfilGestor } from '../../../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../../../tramites/entities/plantillas.entity';

export const MAESTROS_SYNC_REPOSITORY_TOKEN = Symbol('IMaestrosSyncRepository');

/**
 * Puerto de dominio unificado para todas las entidades maestras y de configuración global.
 */
export interface IMaestrosSyncRepository {
    // --- MÉTODOS DE ESCRITURA POR LOTES (UPSERT) ---
    upsertClientes(tx: any, clientes: Partial<Cliente>[]): Promise<void>;
    upsertVehiculos(tx: any, vehiculos: Partial<Vehiculo>[]): Promise<void>;
    upsertEmpresasGestoras(tx: any, empresas: Partial<EmpresaGestora>[]): Promise<void>;
    upsertPlantillasDocumentos(tx: any, plantillas: Partial<PlantillaDocumento>[]): Promise<void>;
    upsertPresentantes(tx: any, presentantes: Partial<Presentante>[]): Promise<void>;
    upsertRepresentantesLegales(tx: any, representantes: Partial<RepresentanteLegal>[]): Promise<void>;
    upsertPerfilesGestor(tx: any, perfiles: Partial<PerfilGestor>[]): Promise<void>;
    upsertMessageTemplates(tx: any, templates: Partial<MessageTemplate>[]): Promise<void>;

    // --- MÉTODOS DE LECTURA PAGINADA (PULL CURSOR-BASED) ---
    fetchClientesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Cliente[]>;
    fetchVehiculosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Vehiculo[]>;
    fetchEmpresasGestorasCursor(cursorDate: Date, lastId: string, limit: number): Promise<EmpresaGestora[]>;
    fetchPlantillasCursor(cursorDate: Date, lastId: string, limit: number): Promise<PlantillaDocumento[]>;
    fetchPresentantesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Presentante[]>;
    fetchRepresentantesCursor(cursorDate: Date, lastId: string, limit: number): Promise<RepresentanteLegal[]>;
    fetchPerfilesGestorCursor(cursorDate: Date, lastId: string, limit: number): Promise<PerfilGestor[]>;
    fetchMessageTemplatesCursor(cursorDate: Date, lastId: string, limit: number): Promise<MessageTemplate[]>;
}