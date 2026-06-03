import { Injectable, Inject, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { type ISeguridadSyncRepository, SEGURIDAD_SYNC_REPOSITORY_TOKEN } from './domain/ports/seguridad-sync-repository.interface';
import { TramitesSyncService } from './services/tramites-sync.service';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { ConflictosSyncService } from './services/conflictos-sync.service';
import { PushSyncChunkDto } from './infrastructure/http/dtos/common/base-chunk.dto';
import { PullSyncQueryDto } from './infrastructure/http/dtos/queries/pull-sync-query.dto';

/**
 * Orquestador central de sincronización para Valeska API.
 * - Despachador polimórfico en transacciones atómicas ultracortas.
 * - Soporte nativo para acceso multidispositivo de operadores.
 * - Pull segmentado e indexado que previene caídas por OOM.
 */
@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private readonly dataSource: DataSource,
        @Inject(SEGURIDAD_SYNC_REPOSITORY_TOKEN)
        private readonly seguridadSyncRepo: ISeguridadSyncRepository,
        private readonly tramitesSync: TramitesSyncService,
        private readonly catalogosSync: CatalogosSyncService,
        private readonly maestrosSync: MaestrosSyncService,
        private readonly seguridadSync: SeguridadSyncService,
        private readonly conflictosSync: ConflictosSyncService,
    ) { }

    /**
     * Valida la identidad y el dispositivo del operador de forma compatible con la relación 1:N.
     */
    private async validateOperatorDevice(userId: string, macAddress: string): Promise<void> {
        const user = await this.seguridadSyncRepo.findOperatorById(userId);
        if (!user || !user.estaActivo) {
            throw new UnauthorizedException('Operador inactivo o no registrado en el servidor central');
        }

        // Buscamos si la dirección MAC está autorizada en la colección multidispositivo del usuario
        const isDeviceAuthorized = user.dispositivos.some(
            (d) => d.macAddress === macAddress && d.autorizado,
        );

        if (!isDeviceAuthorized) {
            this.logger.warn(`🛑 [ACCESO RECHAZADO] Operador: ${userId} | Intento desde MAC no autorizada: ${macAddress}`);
            throw new UnauthorizedException('Terminal de hardware no autorizado para sincronizar cambios');
        }
    }

    /**
     * Procesa la inserción atómica de un chunk polimórfico desviándolo al subservicio correspondiente.
     */
    async processPushSync(userId: string, macAddress: string, dto: PushSyncChunkDto) {
        // 1. Validación de seguridad perimetral multidispositivo
        await this.validateOperatorDevice(userId, macAddress);

        const { entityName, records, syncSessionId, chunkIndex, totalChunks } = dto;
        let processedCount = records.length;

        this.logger.log(
            `📥 [PUSH CHUNK] Sesión: ${syncSessionId} | Entidad: ${entityName} | Chunk: ${chunkIndex + 1}/${totalChunks} | Lote: ${processedCount}`,
        );

        // 2. Transacción de base de datos ultracorta enfocada únicamente en el dominio en tránsito
        await this.dataSource.transaction(async (manager) => {
            switch (entityName.toLowerCase()) {
                case 'tramite':
                    await this.tramitesSync.push(manager, { tramites: records });
                    break;

                case 'tramite_detalle':
                    await this.tramitesSync.push(manager, { tramiteDetalles: records });
                    break;

                case 'catalogo_tipo_tramite':
                    await this.catalogosSync.push(manager, { catalogosTipos: records });
                    break;

                case 'catalogo_situacion':
                    await this.catalogosSync.push(manager, { catalogosSituaciones: records });
                    break;

                case 'cliente':
                    await this.maestrosSync.push(manager, { clientes: records });
                    break;

                case 'vehiculo':
                    await this.maestrosSync.push(manager, { vehiculos: records });
                    break;

                case 'empresa_gestora':
                    await this.maestrosSync.push(manager, { empresasGestoras: records });
                    break;

                case 'plantilla_documento':
                    await this.maestrosSync.push(manager, { plantillas: records });
                    break;

                case 'presentante':
                    await this.maestrosSync.push(manager, { presentantes: records });
                    break;

                case 'representante_legal':
                    await this.maestrosSync.push(manager, { representantes: records });
                    break;

                case 'perfil_gestor':
                    await this.maestrosSync.push(manager, { perfiles: records });
                    break;

                case 'message_template':
                    await this.maestrosSync.push(manager, { templates: records });
                    break;

                case 'usuario':
                    await this.seguridadSync.push(manager, { usuarios: records });
                    break;

                case 'dispositivo':
                    await this.seguridadSync.push(manager, { dispositivos: records });
                    break;

                case 'sucursal':
                    await this.seguridadSync.push(manager, { sucursales: records });
                    break;

                case 'sync_conflicto':
                    await this.conflictosSync.push(manager, { conflictos: records });
                    break;

                default:
                    throw new BadRequestException(`La entidad '${entityName}' no es reconocida por el despachador de sincronización`);
            }
        });

        return {
            success: true,
            syncSessionId,
            entityName,
            chunkIndex,
            processedRecords: processedCount,
        };
    }

    /**
     * Orquesta la descarga de datos de forma elástica y segura utilizando paginación por cursores.
     */
    async processPullSync(userId: string, macAddress: string, query: PullSyncQueryDto) {
        // 1. Validación de seguridad multidispositivo
        await this.validateOperatorDevice(userId, macAddress);

        const baseDate = query.cursorTimestamp ? new Date(query.cursorTimestamp) : new Date(0);
        const lastId = query.lastId || '00000000-0000-0000-0000-000000000000';
        const limit = query.limit;
        const entityFilter = query.entityName?.toLowerCase();

        this.logger.debug(
            `📤 [PULL SOLICITADO] Operador: ${userId} | Cursor: ${baseDate.toISOString()} | Límite: ${limit} | Filtro: ${entityFilter || 'Ninguno'}`,
        );

        // 2. Si el cliente solicita una entidad específica (Diseño recomendado de alta velocidad)
        if (entityFilter) {
            let segmentResult: any = {};
            switch (entityFilter) {
                case 'tramite':
                case 'tramite_detalle':
                    segmentResult = await this.tramitesSync.pull(baseDate, lastId, limit);
                    break;
                case 'catalogo_tipo_tramite':
                case 'catalogo_situacion':
                    segmentResult = await this.catalogosSync.pull(baseDate, lastId, limit);
                    break;
                case 'cliente':
                case 'vehiculo':
                case 'empresa_gestora':
                case 'plantilla_documento':
                case 'presentante':
                case 'representante_legal':
                case 'perfil_gestor':
                case 'message_template':
                    segmentResult = await this.maestrosSync.pull(baseDate, lastId, limit);
                    break;
                case 'usuario':
                case 'dispositivo':
                case 'sucursal':
                    segmentResult = await this.seguridadSync.pull(baseDate, lastId, limit);
                    break;
                case 'sync_conflicto':
                    segmentResult = await this.conflictosSync.pull(baseDate, lastId, limit);
                    break;
                default:
                    throw new BadRequestException(`Filtro de entidad '${entityFilter}' no soportado`);
            }

            return {
                ...segmentResult,
                timestamp: new Date().toISOString(),
            };
        }

        // 3. Fallback: Barrido global secuencial de todas las tablas con límite estrictamente controlado
        const [seguridad, catalogos, maestros, tramites, conflictos] = await Promise.all([
            this.seguridadSync.pull(baseDate, lastId, limit),
            this.catalogosSync.pull(baseDate, lastId, limit),
            this.maestrosSync.pull(baseDate, lastId, limit),
            this.tramitesSync.pull(baseDate, lastId, limit),
            this.conflictosSync.pull(baseDate, lastId, limit),
        ]);

        return {
            ...seguridad,
            ...catalogos,
            ...maestros,
            ...tramites,
            ...conflictos,
            timestamp: new Date().toISOString(),
        };
    }
}