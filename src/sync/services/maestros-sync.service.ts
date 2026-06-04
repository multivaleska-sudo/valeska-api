import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  Cliente,
  EmpresaGestora,
  PlantillaDocumento,
  Presentante,
  RepresentanteLegal,
  Vehiculo,
} from '../../tramites/entities/maestros.entity';
import { PerfilGestor } from '../../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../../tramites/entities/plantillas.entity';
import {
  MAESTROS_SYNC_REPOSITORY_TOKEN,
} from '../domain/ports/maestros-sync-repository.interface';
import type { IMaestrosSyncRepository } from '../domain/ports/maestros-sync-repository.interface';

@Injectable()
export class MaestrosSyncService {
  private readonly logger = new Logger(MaestrosSyncService.name);

  constructor(
    @Inject(MAESTROS_SYNC_REPOSITORY_TOKEN)
    private readonly maestrosSyncRepo: IMaestrosSyncRepository,
  ) {}

  async push(
    tx: EntityManager,
    payload: {
      clientes?: Partial<Cliente>[];
      vehiculos?: Partial<Vehiculo>[];
      empresasGestoras?: Partial<EmpresaGestora>[];
      plantillas?: Partial<PlantillaDocumento>[];
      presentantes?: Partial<Presentante>[];
      representantes?: Partial<RepresentanteLegal>[];
      perfiles?: Partial<PerfilGestor>[];
      templates?: Partial<MessageTemplate>[];
    },
  ): Promise<void> {
    if (payload.clientes?.length) await this.maestrosSyncRepo.upsertClientes(tx, payload.clientes);
    if (payload.vehiculos?.length) await this.maestrosSyncRepo.upsertVehiculos(tx, payload.vehiculos);
    if (payload.empresasGestoras?.length) await this.maestrosSyncRepo.upsertEmpresasGestoras(tx, payload.empresasGestoras);
    if (payload.plantillas?.length) await this.maestrosSyncRepo.upsertPlantillasDocumentos(tx, payload.plantillas);
    if (payload.presentantes?.length) await this.maestrosSyncRepo.upsertPresentantes(tx, payload.presentantes);
    if (payload.representantes?.length) await this.maestrosSyncRepo.upsertRepresentantesLegales(tx, payload.representantes);
    if (payload.perfiles?.length) await this.maestrosSyncRepo.upsertPerfilesGestor(tx, payload.perfiles);
    if (payload.templates?.length) await this.maestrosSyncRepo.upsertMessageTemplates(tx, payload.templates);
  }

  async pullClientes(cursorTimestamp: Date, lastId: string, limit: number): Promise<Cliente[]> {
    return this.maestrosSyncRepo.fetchClientesCursor(cursorTimestamp, lastId, limit);
  }

  async pullVehiculos(cursorTimestamp: Date, lastId: string, limit: number): Promise<Vehiculo[]> {
    return this.maestrosSyncRepo.fetchVehiculosCursor(cursorTimestamp, lastId, limit);
  }

  async pullEmpresasGestoras(cursorTimestamp: Date, lastId: string, limit: number): Promise<EmpresaGestora[]> {
    return this.maestrosSyncRepo.fetchEmpresasGestorasCursor(cursorTimestamp, lastId, limit);
  }

  async pullPlantillas(cursorTimestamp: Date, lastId: string, limit: number): Promise<PlantillaDocumento[]> {
    return this.maestrosSyncRepo.fetchPlantillasCursor(cursorTimestamp, lastId, limit);
  }

  async pullPresentantes(cursorTimestamp: Date, lastId: string, limit: number): Promise<Presentante[]> {
    return this.maestrosSyncRepo.fetchPresentantesCursor(cursorTimestamp, lastId, limit);
  }

  async pullRepresentantes(cursorTimestamp: Date, lastId: string, limit: number): Promise<RepresentanteLegal[]> {
    return this.maestrosSyncRepo.fetchRepresentantesCursor(cursorTimestamp, lastId, limit);
  }

  async pullPerfilesGestor(cursorTimestamp: Date, lastId: string, limit: number): Promise<PerfilGestor[]> {
    return this.maestrosSyncRepo.fetchPerfilesGestorCursor(cursorTimestamp, lastId, limit);
  }

  async pullMessageTemplates(cursorTimestamp: Date, lastId: string, limit: number): Promise<MessageTemplate[]> {
    return this.maestrosSyncRepo.fetchMessageTemplatesCursor(cursorTimestamp, lastId, limit);
  }
}
