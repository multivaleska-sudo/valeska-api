import { Injectable, Inject, Logger } from '@nestjs/common';
import { type IConflictosSyncRepository, CONFLICTOS_SYNC_REPOSITORY_TOKEN } from '../domain/ports/conflictos-sync-repository.interface';
import { SyncConflicto } from '../entities/sync-conflict.entity';

/**
 * Servicio para procesar el registro y conciliación de colisiones lógicas de sincronización.
 */
@Injectable()
export class ConflictosSyncService {
    private readonly logger = new Logger(ConflictosSyncService.name);

    constructor(
        @Inject(CONFLICTOS_SYNC_REPOSITORY_TOKEN)
        private readonly conflictosSyncRepo: IConflictosSyncRepository,
    ) { }

    /**
     * Almacena las colisiones encontradas durante el proceso distributivo en el servidor principal.
     */
    async push(tx: any, payload: { conflictos?: Partial<SyncConflicto>[] }): Promise<void> {
        if (payload.conflictos && payload.conflictos.length > 0) {
            this.logger.debug(`Registrando ${payload.conflictos.length} colisiones en la base de datos central.`);
            await this.conflictosSyncRepo.upsertConflictos(tx, payload.conflictos);
        }
    }

    /**
     * Obtiene de manera paginada los logs de conflictos activos.
     */
    async pull(cursorTimestamp: Date, lastId: string, limit: number) {
        this.logger.debug(`Ejecutando pull de colisiones activas.`);

        const conflictos = await this.conflictosSyncRepo.fetchConflictosCursor(cursorTimestamp, lastId, limit);

        return {
            conflictos,
        };
    }
}