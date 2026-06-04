import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CatalogoSituacion, CatalogoTipoTramite } from '../../tramites/entities/catalogos.entity';
import {
  CATALOGOS_SYNC_REPOSITORY_TOKEN,
} from '../domain/ports/catalogos-sync-repository.interface';
import type { ICatalogosSyncRepository } from '../domain/ports/catalogos-sync-repository.interface';

@Injectable()
export class CatalogosSyncService {
  private readonly logger = new Logger(CatalogosSyncService.name);

  constructor(
    @Inject(CATALOGOS_SYNC_REPOSITORY_TOKEN)
    private readonly catalogosSyncRepo: ICatalogosSyncRepository,
  ) {}

  async push(
    tx: EntityManager,
    payload: { catalogosTipos?: Partial<CatalogoTipoTramite>[]; catalogosSituaciones?: Partial<CatalogoSituacion>[] },
  ): Promise<void> {
    if (payload.catalogosTipos?.length) {
      this.logger.debug(`Procesando UPSERT de ${payload.catalogosTipos.length} tipos de tramite.`);
      await this.catalogosSyncRepo.upsertTiposTramite(tx, payload.catalogosTipos);
    }

    if (payload.catalogosSituaciones?.length) {
      this.logger.debug(`Procesando UPSERT de ${payload.catalogosSituaciones.length} situaciones.`);
      await this.catalogosSyncRepo.upsertSituaciones(tx, payload.catalogosSituaciones);
    }
  }

  async pullTiposTramite(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<CatalogoTipoTramite[]> {
    return this.catalogosSyncRepo.fetchTiposTramiteCursor(cursorTimestamp, lastId, limit);
  }

  async pullSituaciones(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<CatalogoSituacion[]> {
    return this.catalogosSyncRepo.fetchSituacionesCursor(cursorTimestamp, lastId, limit);
  }
}
