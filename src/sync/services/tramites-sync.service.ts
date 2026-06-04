import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Tramite, TramiteDetalle } from '../../tramites/entities/tramite.entity';
import {
  TRAMITES_SYNC_REPOSITORY_TOKEN,
} from '../domain/ports/tramites-sync-repository.interface';
import type { ITramitesSyncRepository } from '../domain/ports/tramites-sync-repository.interface';

@Injectable()
export class TramitesSyncService {
  private readonly logger = new Logger(TramitesSyncService.name);

  constructor(
    @Inject(TRAMITES_SYNC_REPOSITORY_TOKEN)
    private readonly tramitesSyncRepo: ITramitesSyncRepository,
  ) {}

  async push(
    tx: EntityManager,
    payload: { tramites?: Partial<Tramite>[]; tramiteDetalles?: Partial<TramiteDetalle>[] },
  ): Promise<void> {
    if (payload.tramites?.length) {
      this.logger.debug(`Procesando UPSERT de ${payload.tramites.length} tramites.`);
      await this.tramitesSyncRepo.upsertTramites(tx, payload.tramites);
    }

    if (payload.tramiteDetalles?.length) {
      this.logger.debug(`Procesando UPSERT de ${payload.tramiteDetalles.length} detalles de tramites.`);
      await this.tramitesSyncRepo.upsertTramiteDetalles(tx, payload.tramiteDetalles);
    }
  }

  async pullTramites(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<Tramite[]> {
    return this.tramitesSyncRepo.fetchTramitesCursor(cursorTimestamp, lastId, limit);
  }

  async pullTramiteDetalles(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<TramiteDetalle[]> {
    return this.tramitesSyncRepo.fetchTramiteDetallesCursor(cursorTimestamp, lastId, limit);
  }
}
