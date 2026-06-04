import { EntityManager } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { Dispositivo } from '../../entities/dispositivo.entity';
import { Sucursal } from '../../entities/sucursal.entity';

export const SEGURIDAD_SYNC_REPOSITORY_TOKEN = Symbol('ISeguridadSyncRepository');

/**
 * Puerto de dominio para el aislamiento de persistencia de Accesos, Dispositivos y Sucursales.
 */
export interface ISeguridadSyncRepository {
    /**
     * Busca un usuario operador cargando de manera segura su relación multidispositivo.
     */
    findOperatorById(userId: string): Promise<Usuario | null>;

    // --- MÉTODOS DE ESCRITURA POR LOTES (UPSERT) ---
    upsertUsuarios(tx: EntityManager, usuarios: Partial<Usuario>[]): Promise<void>;
    upsertDispositivos(tx: EntityManager, dispositivos: Partial<Dispositivo>[]): Promise<void>;
    upsertSucursales(tx: EntityManager, sucursales: Partial<Sucursal>[]): Promise<void>;

    // --- MÉTODOS DE LECTURA PAGINADA (PULL CURSOR-BASED) ---
    fetchUsuariosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Usuario[]>;
    fetchDispositivosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Dispositivo[]>;
    fetchSucursalesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Sucursal[]>;
}
