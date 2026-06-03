import { Injectable, Inject, Logger } from '@nestjs/common';
import { type ICatalogosSyncRepository, CATALOGOS_SYNC_REPOSITORY_TOKEN } from '../domain/ports/catalogos-sync-repository.interface';
import { CatalogoTipoTramite, CatalogoSituacion } from '../../tramites/entities/catalogos.entity';

/**
 * Servicio encargado de orquestar la sincronización de catálogos y situaciones operativas.
 */
@Injectable()
export class CatalogosSyncService {
    private readonly logger = new Logger(CatalogosSyncService.name);

    constructor(
        @Inject(CATALOGOS_SYNC_REPOSITORY_TOKEN)
        private readonly catalogosSyncRepo: ICatalogosSyncRepository,
    ) { }

    /**
     * Realiza la sincronización ascendente (push) de catálogos en el servidor central.
     */
    async push(
        tx: any,
        payload: { catalogosTipos?: Partial<CatalogoTipoTramite>[]; catalogosSituaciones?: Partial<CatalogoSituacion>[] },
    ): Promise<void> {
        if (payload.catalogosTipos && payload.catalogosTipos.length > 0) {
            this.logger.debug(`Procesando UPSERT de ${payload.catalogosTipos.length} tipos de trámites del catálogo.`);
            await this.catalogosSyncRepo.upsertTiposTramite(tx, payload.catalogosTipos);
        }

        if (payload.catalogosSituaciones && payload.catalogosSituaciones.length > 0) {
            this.logger.debug(`Procesando UPSERT de ${payload.catalogosSituaciones.length} situaciones del catálogo.`);
            await this.catalogosSyncRepo.upsertSituaciones(tx, payload.catalogosSituaciones);
        }
    }

    /**
     * Extrae los catálogos modificados de forma paginada para los clientes locales.
     */
    async pull(cursorTimestamp: Date, lastId: string, limit: number) {
        this.logger.debug(`Ejecutando pull de Catálogos. Cursor: ${cursorTimestamp.toISOString()} | Límite: ${limit}`);

        const [catalogosTipos, catalogosSituaciones] = await Promise.all([
            this.catalogosSyncRepo.fetchTiposTramiteCursor(cursorTimestamp, lastId, limit),
            this.catalogosSyncRepo.fetchSituacionesCursor(cursorTimestamp, lastId, limit),
        ]);

        return {
            catalogosTipos,
            catalogosSituaciones,
        };
    }
}