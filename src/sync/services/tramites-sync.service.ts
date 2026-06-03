import { Injectable, Inject, Logger } from '@nestjs/common';
import { type ITramitesSyncRepository, TRAMITES_SYNC_REPOSITORY_TOKEN } from '../domain/ports/tramites-sync-repository.interface';
import { Tramite, TramiteDetalle } from '../../tramites/entities/tramite.entity';

/**
 * Servicio de sincronización de Trámites y sus Detalles.
 * Consume exclusivamente el puerto abstracto, libre de dependencias rígidas de ORM.
 */
@Injectable()
export class TramitesSyncService {
    private readonly logger = new Logger(TramitesSyncService.name);

    constructor(
        @Inject(TRAMITES_SYNC_REPOSITORY_TOKEN)
        private readonly tramitesSyncRepo: ITramitesSyncRepository,
    ) { }

    /**
     * Procesa la inserción y actualización (UPSERT) de trámites y detalles en transacciones aisladas.
     */
    async push(tx: any, payload: { tramites?: Partial<Tramite>[]; tramiteDetalles?: Partial<TramiteDetalle>[] }): Promise<void> {
        if (payload.tramites && payload.tramites.length > 0) {
            this.logger.debug(`Procesando UPSERT de ${payload.tramites.length} trámites.`);
            await this.tramitesSyncRepo.upsertTramites(tx, payload.tramites);
        }

        if (payload.tramiteDetalles && payload.tramiteDetalles.length > 0) {
            this.logger.debug(`Procesando UPSERT de ${payload.tramiteDetalles.length} detalles de trámites.`);
            await this.tramitesSyncRepo.upsertTramiteDetalles(tx, payload.tramiteDetalles);
        }
    }

    /**
     * Obtiene datos incrementales de trámites y detalles a partir de un cursor de red seguro.
     */
    async pull(cursorTimestamp: Date, lastId: string, limit: number) {
        this.logger.debug(`Ejecutando pull de Trámites. Cursor: ${cursorTimestamp.toISOString()} | ID: ${lastId} | Límite: ${limit}`);

        const [tramites, detalles] = await Promise.all([
            this.tramitesSyncRepo.fetchTramitesCursor(cursorTimestamp, lastId, limit),
            this.tramitesSyncRepo.fetchTramiteDetallesCursor(cursorTimestamp, lastId, limit),
        ]);

        return {
            tramites,
            tramiteDetalles: detalles,
        };
    }
}