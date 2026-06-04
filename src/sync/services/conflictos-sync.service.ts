import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SyncConflicto } from '../entities/sync-conflict.entity';
import {
  CONFLICTOS_SYNC_REPOSITORY_TOKEN,
} from '../domain/ports/conflictos-sync-repository.interface';
import type { IConflictosSyncRepository } from '../domain/ports/conflictos-sync-repository.interface';

@Injectable()
export class ConflictosSyncService {
  private readonly logger = new Logger(ConflictosSyncService.name);

  constructor(
    @Inject(CONFLICTOS_SYNC_REPOSITORY_TOKEN)
    private readonly conflictosSyncRepo: IConflictosSyncRepository,
  ) {}

  async push(tx: EntityManager, payload: { conflictos?: Partial<SyncConflicto>[] }): Promise<void> {
    if (payload.conflictos?.length) {
      this.logger.debug(`Registrando ${payload.conflictos.length} conflictos.`);
      await this.conflictosSyncRepo.upsertConflictos(tx, payload.conflictos);
    }
  }

  async pullConflictos(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<SyncConflicto[]> {
    return this.conflictosSyncRepo.fetchConflictosCursor(cursorTimestamp, lastId, limit);
  }
}
