import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CatalogoSituacion, CatalogoTipoTramite } from '../tramites/entities/catalogos.entity';
import {
  Cliente,
  EmpresaGestora,
  PlantillaDocumento,
  Presentante,
  RepresentanteLegal,
  Vehiculo,
} from '../tramites/entities/maestros.entity';
import { PerfilGestor } from '../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../tramites/entities/plantillas.entity';
import { Tramite, TramiteDetalle } from '../tramites/entities/tramite.entity';
import { PushSyncChunkDto } from './infrastructure/http/dtos/common/base-chunk.dto';
import { PullSyncQueryDto } from './infrastructure/http/dtos/queries/pull-sync-query.dto';
import { isSyncEntityName } from './domain/sync-entity-name';
import type { SyncEntityName } from './domain/sync-entity-name';
import {
  SEGURIDAD_SYNC_REPOSITORY_TOKEN,
} from './domain/ports/seguridad-sync-repository.interface';
import type { ISeguridadSyncRepository } from './domain/ports/seguridad-sync-repository.interface';
import { ConflictosSyncService } from './services/conflictos-sync.service';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { TramitesSyncService } from './services/tramites-sync.service';
import { Dispositivo } from './entities/dispositivo.entity';
import { Sucursal } from './entities/sucursal.entity';
import { SyncConflicto } from './entities/sync-conflict.entity';
import { Usuario } from './entities/usuario.entity';
import type { SyncPushResult, SyncWriteContext } from './domain/sync-push-result';
import { emptySyncPushResult } from './domain/sync-push-result';

type SyncRecord = Record<string, unknown>;
type CursorRecord = { id: string; updatedAt?: Date; fechaConflicto?: Date };

interface SyncHandler<TRecord extends CursorRecord = CursorRecord> {
  push: (tx: EntityManager, records: SyncRecord[], context: SyncWriteContext) => Promise<SyncPushResult | void>;
  pull: (cursorTimestamp: Date, lastId: string | undefined, limit: number) => Promise<TRecord[]>;
  cursorTimestamp: (record: TRecord) => Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly handlers: Record<SyncEntityName, SyncHandler>;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(SEGURIDAD_SYNC_REPOSITORY_TOKEN)
    private readonly seguridadSyncRepo: ISeguridadSyncRepository,
    private readonly tramitesSync: TramitesSyncService,
    private readonly catalogosSync: CatalogosSyncService,
    private readonly maestrosSync: MaestrosSyncService,
    private readonly seguridadSync: SeguridadSyncService,
    private readonly conflictosSync: ConflictosSyncService,
  ) {
    this.handlers = this.buildHandlers();
  }

  async processPushSync(userId: string, macAddress: string, dto: PushSyncChunkDto) {
    return this.processPushChunkNow(userId, macAddress, dto);
  }

  async processPushChunkNow(userId: string, macAddress: string, dto: PushSyncChunkDto) {
    await this.validateOperatorDevice(userId, macAddress);

    if (dto.syncProtocolVersion !== 2) {
      throw new BadRequestException('syncProtocolVersion 2 es requerido para subir cambios sin perdida de datos');
    }

    const entityName = dto.entityName.toLowerCase();
    if (!isSyncEntityName(entityName)) {
      throw new BadRequestException(`La entidad '${dto.entityName}' no es reconocida por el sincronizador`);
    }

    const records = dto.records.map((record) => ({
      ...record,
      syncStatus: 'SYNCED',
      updatedByUserId: record.updatedByUserId ?? userId,
      updatedByDeviceMac: record.updatedByDeviceMac ?? macAddress.trim().toLowerCase(),
    }));
    const processedCount = records.length;
    this.logger.log(
      `[PUSH CHUNK] Sesion: ${dto.syncSessionId} | Entidad: ${entityName} | Chunk: ${dto.chunkIndex + 1}/${dto.totalChunks} | Lote: ${processedCount}`,
    );

    const result = await this.dataSource.transaction(async (manager) => {
      return this.handlers[entityName].push(manager, records, {
        userId,
        deviceMac: macAddress.trim().toLowerCase(),
        outboxId: dto.outboxId ?? null,
      });
    });
    const pushResult = result ?? emptySyncPushResult();

    return {
      success: true,
      syncSessionId: dto.syncSessionId,
      entityName,
      chunkIndex: dto.chunkIndex,
      processedRecords: processedCount,
      conflictCount: pushResult.conflictCount,
      acceptedRecordIds: pushResult.acceptedRecordIds,
      conflictedRecordIds: pushResult.conflictedRecordIds,
      conflictIds: pushResult.conflictIds,
    };
  }

  async processPullSync(userId: string, macAddress: string, query: PullSyncQueryDto) {
    await this.validateOperatorDevice(userId, macAddress);

    const entityName = query.entityName.toLowerCase();
    if (!isSyncEntityName(entityName)) {
      throw new BadRequestException(`Filtro de entidad '${query.entityName}' no soportado`);
    }

    const cursorTimestamp = query.cursorTimestamp ? new Date(query.cursorTimestamp) : new Date(0);
    const lastId = query.lastId?.trim() || undefined;
    const limit = query.limit;
    const handler = this.handlers[entityName];
    const records = await handler.pull(cursorTimestamp, lastId, limit);
    const lastRecord = records.at(-1);

    return {
      entityName,
      records,
      nextCursor: lastRecord
        ? {
            cursorTimestamp: handler.cursorTimestamp(lastRecord).toISOString(),
            lastId: lastRecord.id,
          }
        : null,
      hasMore: records.length === limit,
      timestamp: new Date().toISOString(),
    };
  }
  private getTableInfo(entityName: SyncEntityName): { table: string, col: string } | null {
    switch (entityName) {
      case 'tramite': return { table: 'tramites', col: 'updated_at' };
      case 'tramite_detalle': return { table: 'tramite_detalles', col: 'updated_at' };
      case 'catalogo_tipo_tramite': return { table: 'catalogo_tipos_tramite', col: 'updated_at' };
      case 'catalogo_situacion': return { table: 'catalogo_situaciones', col: 'updated_at' };
      case 'cliente': return { table: 'clientes', col: 'updated_at' };
      case 'vehiculo': return { table: 'vehiculos', col: 'updated_at' };
      case 'empresa_gestora': return { table: 'empresas_gestoras', col: 'updated_at' };
      case 'plantilla_documento': return { table: 'plantillas_documentos', col: 'updated_at' };
      case 'presentante': return { table: 'presentantes', col: 'updated_at' };
      case 'representante_legal': return { table: 'representantes_legales', col: 'updated_at' };
      case 'perfil_gestor': return { table: 'perfiles_gestor', col: 'updated_at' };
      case 'message_template': return { table: 'message_templates', col: 'updated_at' };
      case 'dispositivo': return { table: 'dispositivos', col: 'updated_at' };
      case 'sucursal': return { table: 'sucursales', col: 'updated_at' };
      case 'usuario': return { table: 'usuarios', col: 'updated_at' };
      case 'sync_conflicto': return { table: 'sync_conflictos', col: 'fecha_conflicto' };
      default: return null;
    }
  }

  async getSyncState(userId: string, macAddress: string, entities: string[]) {
    await this.validateOperatorDevice(userId, macAddress);

    const validEntities = entities.filter(isSyncEntityName);
    const result: any[] = [];

    for (const entityName of validEntities) {
      const info = this.getTableInfo(entityName);
      if (!info) continue;

      const rows = await this.dataSource.query(`
        SELECT ${info.col} as timestamp, id 
        FROM ${info.table} 
        ORDER BY ${info.col} DESC, id DESC 
        LIMIT 1
      `);

      if (rows && rows.length > 0) {
        result.push({
          entityName,
          maxTimestamp: rows[0].timestamp,
          lastIdAtMaxTimestamp: rows[0].id,
          approxCountSinceCursor: 0,
        });
      } else {
        result.push({
          entityName,
          maxTimestamp: new Date(0).toISOString(),
          lastIdAtMaxTimestamp: null,
          approxCountSinceCursor: 0,
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      entities: result,
    };
  }

  private async validateOperatorDevice(userId: string, macAddress: string): Promise<void> {
    const user = await this.seguridadSyncRepo.findOperatorById(userId);
    if (!user || !user.estaActivo) {
      throw new UnauthorizedException('Operador inactivo o no registrado en el servidor central');
    }

    const normalizedMac = macAddress.trim().toLowerCase();
    const isDeviceAuthorized = user.dispositivos?.some(
      (device) => device.macAddress.toLowerCase() === normalizedMac && device.autorizado,
    );

    if (!isDeviceAuthorized) {
      this.logger.warn(`[ACCESO RECHAZADO] Operador: ${userId} | MAC no autorizada: ${macAddress}`);
      throw new UnauthorizedException('Terminal de hardware no autorizado para sincronizar cambios');
    }
  }

  private buildHandlers(): Record<SyncEntityName, SyncHandler> {
    const updatedAt = <T extends CursorRecord>(record: T) => record.updatedAt ?? new Date(0);
    const fechaConflicto = (record: CursorRecord) => record.fechaConflicto ?? new Date(0);

    return {
      tramite: {
        push: (tx, records, context) => this.tramitesSync.push(tx, { tramites: records as Partial<Tramite>[] }, context),
        pull: (cursor, lastId, limit) => this.tramitesSync.pullTramites(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      tramite_detalle: {
        push: (tx, records, context) => this.tramitesSync.push(tx, { tramiteDetalles: records as Partial<TramiteDetalle>[] }, context),
        pull: (cursor, lastId, limit) => this.tramitesSync.pullTramiteDetalles(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      catalogo_tipo_tramite: {
        push: (tx, records) => this.catalogosSync.push(tx, { catalogosTipos: records as Partial<CatalogoTipoTramite>[] }),
        pull: (cursor, lastId, limit) => this.catalogosSync.pullTiposTramite(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      catalogo_situacion: {
        push: (tx, records) => this.catalogosSync.push(tx, { catalogosSituaciones: records as Partial<CatalogoSituacion>[] }),
        pull: (cursor, lastId, limit) => this.catalogosSync.pullSituaciones(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      cliente: {
        push: (tx, records, context) => this.maestrosSync.push(tx, { clientes: records as Partial<Cliente>[] }, context),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullClientes(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      vehiculo: {
        push: (tx, records, context) => this.maestrosSync.push(tx, { vehiculos: records as Partial<Vehiculo>[] }, context),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullVehiculos(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      empresa_gestora: {
        push: (tx, records) => this.maestrosSync.push(tx, { empresasGestoras: records as Partial<EmpresaGestora>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullEmpresasGestoras(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      plantilla_documento: {
        push: (tx, records) => this.maestrosSync.push(tx, { plantillas: records as Partial<PlantillaDocumento>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullPlantillas(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      presentante: {
        push: (tx, records) => this.maestrosSync.push(tx, { presentantes: records as Partial<Presentante>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullPresentantes(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      representante_legal: {
        push: (tx, records) => this.maestrosSync.push(tx, { representantes: records as Partial<RepresentanteLegal>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullRepresentantes(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      perfil_gestor: {
        push: (tx, records) => this.maestrosSync.push(tx, { perfiles: records as Partial<PerfilGestor>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullPerfilesGestor(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      message_template: {
        push: (tx, records) => this.maestrosSync.push(tx, { templates: records as Partial<MessageTemplate>[] }),
        pull: (cursor, lastId, limit) => this.maestrosSync.pullMessageTemplates(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      usuario: {
        push: (tx, records) => this.seguridadSync.push(tx, { usuarios: records as Partial<Usuario>[] }),
        pull: (cursor, lastId, limit) => this.seguridadSync.pullUsuarios(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      dispositivo: {
        push: (tx, records) => this.seguridadSync.push(tx, { dispositivos: records as Partial<Dispositivo>[] }),
        pull: (cursor, lastId, limit) => this.seguridadSync.pullDispositivos(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      sucursal: {
        push: (tx, records) => this.seguridadSync.push(tx, { sucursales: records as Partial<Sucursal>[] }),
        pull: (cursor, lastId, limit) => this.seguridadSync.pullSucursales(cursor, lastId, limit),
        cursorTimestamp: updatedAt,
      },
      sync_conflicto: {
        push: (tx, records) => this.conflictosSync.push(tx, { conflictos: records as Partial<SyncConflicto>[] }),
        pull: (cursor, lastId, limit) => this.conflictosSync.pullConflictos(cursor, lastId, limit),
        cursorTimestamp: fechaConflicto,
      },
    };
  }
}
