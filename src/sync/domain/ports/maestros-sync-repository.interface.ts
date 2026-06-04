import { EntityManager } from 'typeorm';
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
    upsertClientes(tx: EntityManager, clientes: Partial<Cliente>[]): Promise<void>;
    upsertVehiculos(tx: EntityManager, vehiculos: Partial<Vehiculo>[]): Promise<void>;
    upsertEmpresasGestoras(tx: EntityManager, empresas: Partial<EmpresaGestora>[]): Promise<void>;
    upsertPlantillasDocumentos(tx: EntityManager, plantillas: Partial<PlantillaDocumento>[]): Promise<void>;
    upsertPresentantes(tx: EntityManager, presentantes: Partial<Presentante>[]): Promise<void>;
    upsertRepresentantesLegales(tx: EntityManager, representantes: Partial<RepresentanteLegal>[]): Promise<void>;
    upsertPerfilesGestor(tx: EntityManager, perfiles: Partial<PerfilGestor>[]): Promise<void>;
    upsertMessageTemplates(tx: EntityManager, templates: Partial<MessageTemplate>[]): Promise<void>;

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
