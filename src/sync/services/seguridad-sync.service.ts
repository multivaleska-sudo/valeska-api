import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Dispositivo } from '../entities/dispositivo.entity';
import { Sucursal } from '../entities/sucursal.entity';
import { Usuario } from '../entities/usuario.entity';
import {
  SEGURIDAD_SYNC_REPOSITORY_TOKEN,
} from '../domain/ports/seguridad-sync-repository.interface';
import type { ISeguridadSyncRepository } from '../domain/ports/seguridad-sync-repository.interface';

@Injectable()
export class SeguridadSyncService {
  private readonly logger = new Logger(SeguridadSyncService.name);

  constructor(
    @Inject(SEGURIDAD_SYNC_REPOSITORY_TOKEN)
    private readonly seguridadSyncRepo: ISeguridadSyncRepository,
  ) {}

  async push(
    tx: EntityManager,
    payload: {
      usuarios?: Partial<Usuario>[];
      dispositivos?: Partial<Dispositivo>[];
      sucursales?: Partial<Sucursal>[];
    },
  ): Promise<void> {
    if (payload.usuarios?.length) await this.seguridadSyncRepo.upsertUsuarios(tx, payload.usuarios);
    if (payload.dispositivos?.length) await this.seguridadSyncRepo.upsertDispositivos(tx, payload.dispositivos);
    if (payload.sucursales?.length) await this.seguridadSyncRepo.upsertSucursales(tx, payload.sucursales);
  }

  async pullUsuarios(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<Usuario[]> {
    this.logger.debug('Ejecutando pull de usuarios.');
    return this.seguridadSyncRepo.fetchUsuariosCursor(cursorTimestamp, lastId, limit);
  }

  async pullDispositivos(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<Dispositivo[]> {
    return this.seguridadSyncRepo.fetchDispositivosCursor(cursorTimestamp, lastId, limit);
  }

  async pullSucursales(cursorTimestamp: Date, lastId: string | undefined, limit: number): Promise<Sucursal[]> {
    return this.seguridadSyncRepo.fetchSucursalesCursor(cursorTimestamp, lastId, limit);
  }
}
