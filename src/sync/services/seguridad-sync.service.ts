import { Injectable, Inject, Logger } from '@nestjs/common';
import { type ISeguridadSyncRepository, SEGURIDAD_SYNC_REPOSITORY_TOKEN } from '../domain/ports/seguridad-sync-repository.interface';
import { Usuario } from '../entities/usuario.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { Sucursal } from '../entities/sucursal.entity';

/**
 * Servicio encargado de procesar la sincronización de Usuarios, Sucursales y Dispositivos de Origen.
 * Integra de forma nativa la tolerancia multidispositivo solicitada por el cliente.
 */
@Injectable()
export class SeguridadSyncService {
    private readonly logger = new Logger(SeguridadSyncService.name);

    constructor(
        @Inject(SEGURIDAD_SYNC_REPOSITORY_TOKEN)
        private readonly seguridadSyncRepo: ISeguridadSyncRepository,
    ) { }

    /**
     * Ejecuta el push de seguridad.
     */
    async push(tx: any, payload: {
        usuarios?: Partial<Usuario>[];
        dispositivos?: Partial<Dispositivo>[];
        sucursales?: Partial<Sucursal>[];
    }): Promise<void> {
        if (payload.usuarios && payload.usuarios.length > 0) {
            await this.seguridadSyncRepo.upsertUsuarios(tx, payload.usuarios);
        }
        if (payload.dispositivos && payload.dispositivos.length > 0) {
            await this.seguridadSyncRepo.upsertDispositivos(tx, payload.dispositivos);
        }
        if (payload.sucursales && payload.sucursales.length > 0) {
            await this.seguridadSyncRepo.upsertSucursales(tx, payload.sucursales);
        }
    }

    /**
     * Retorna usuarios, dispositivos y sucursales de forma segura mediante cursor.
     */
    async pull(cursorTimestamp: Date, lastId: string, limit: number) {
        this.logger.debug(`Ejecutando pull secuencial de datos de seguridad y accesos.`);

        const [usuarios, dispositivos, sucursales] = await Promise.all([
            this.seguridadSyncRepo.fetchUsuariosCursor(cursorTimestamp, lastId, limit),
            this.seguridadSyncRepo.fetchDispositivosCursor(cursorTimestamp, lastId, limit),
            this.seguridadSyncRepo.fetchSucursalesCursor(cursorTimestamp, lastId, limit),
        ]);

        return {
            usuarios,
            dispositivos,
            sucursales,
        };
    }
}