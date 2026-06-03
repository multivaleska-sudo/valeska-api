import { Usuario } from '../../entities/usuario.entity';

export const SEGURIDAD_SYNC_REPOSITORY_TOKEN = Symbol('ISeguridadSyncRepository');

export interface ISeguridadSyncRepository {
    /**
     * Busca un usuario operador para validar su estado de sincronización.
     * Incluye la relación con su dispositivo de origen para auditoría SRE.
     */
    findOperatorById(userId: string): Promise<Usuario | null>;

    /**
     * Realiza un UPSERT por lotes de los usuarios.
     */
    upsertUsuarios(manager: any, usuarios: Partial<Usuario>[]): Promise<void>;

    /**
     * Obtiene usuarios modificados a partir de un cursor de sincronización.
     */
    fetchUsuariosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Usuario[]>;
}