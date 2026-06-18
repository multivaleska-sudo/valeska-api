import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SyncConflicto } from '../entities/sync-conflict.entity';
import { SyncChangeLog } from '../entities/sync-change-log.entity';
import { ResolveSyncConflictDto } from '../infrastructure/http/dtos/conflicts/resolve-sync-conflict.dto';


// We map tableName to the actual TypeORM entity if needed, or we use raw queries.
// Since we have a dynamic table name from sync_conflictos, it's safer to use query builder or raw queries for the update,
// or we can find the Entity metadata using DataSource.

@Injectable()
export class SyncConflictResolutionService {
    constructor(private readonly dataSource: DataSource) { }

    async resolve(
        userId: string,
        macAddress: string,
        conflictId: string,
        dto: ResolveSyncConflictDto,
    ) {
        return this.dataSource.transaction(async (manager) => {
            // Leer con lock pesimista
            const conflicto = await manager
                .createQueryBuilder(SyncConflicto, 'c')
                .setLock('pessimistic_write')
                .where('c.id = :id', { id: conflictId })
                .getOne();

            if (!conflicto) {
                throw new NotFoundException(`Conflicto con ID ${conflictId} no encontrado`);
            }

            if (conflicto.resuelto) {
                // Idempotente
                return { success: true, message: 'El conflicto ya estaba resuelto', conflicto };
            }

            const now = new Date();

            if (dto.strategy === 'ACCEPT_LOCAL' || dto.strategy === 'MERGE') {
                if (!dto.resolvedData) {
                    throw new ConflictException('resolvedData es requerido para estrategias ACCEPT_LOCAL o MERGE');
                }

                const tableName = conflicto.tablaAfectada;
                const recordId = conflicto.registroId;

                // Necesitamos saber qué Entidad es para actualizarla.
                // Podemos usar query builder para la tabla directamente.

                // Asignamos metadatos de autoría y timestamps
                const updateData: Record<string, any> = { ...dto.resolvedData };

                // Removemos id para no intentar actualizar la primary key
                delete updateData.id;

                const setClauses: string[] = [];
                const parameters: any[] = [];
                let paramIndex = 1;

                // Convertimos camelCase a snake_case si estamos usando raw queries, pero es mejor que el dto traiga las claves correctas o usar TypeORM.
                // Asumiremos que el frontend envía los campos listos o los actualizamos vía raw query.
                // Mejor, busquemos el EntityMetadata asociado a la tabla
                const metadata = this.dataSource.entityMetadatas.find(m => m.tableName === tableName);

                if (!metadata) {
                    throw new ConflictException(`No se encontró metadatos para la tabla ${tableName}`);
                }

                // Limpiamos updateData para asegurar que coincida con las columnas
                const columnNames = metadata.columns.map(c => c.propertyName);
                const dbColumnNames = metadata.columns.map(c => c.databaseName);

                // Mapeamos updateData a las propiedades de la entidad
                // Aquí asumimos que resolvedData viene como se guarda en la bd o entidad.
                const entityUpdate: any = {};
                for (const [key, value] of Object.entries(updateData)) {
                    const col = metadata.columns.find(c => c.propertyName === key || c.databaseName === key);
                    if (col) {
                        entityUpdate[col.propertyName] = value;
                    }
                }

                entityUpdate.updatedAt = now;
                entityUpdate.updatedByUserId = userId;
                entityUpdate.updatedByDeviceMac = macAddress;
                entityUpdate.syncStatus = 'SYNCED';

                // Increment version based on expectedRecordVersion if provided, or read current
                let baseVersion = dto.expectedRecordVersion;
                if (baseVersion === undefined) {
                    const currentRecord = await manager.createQueryBuilder()
                        .select(metadata.target as any, 'r')
                        .where(`r.id = :id`, { id: recordId })
                        .getOne() as any;
                    baseVersion = currentRecord?.version || 0;
                }

                entityUpdate.baseVersion = baseVersion || 0;
                entityUpdate.version = (baseVersion || 0) + 1;

                await manager
                    .createQueryBuilder()
                    .update(metadata.target)
                    .set(entityUpdate)
                    .where("id = :id", { id: recordId })
                    .execute();

                // Registrar SyncChangeLog
                const changeLog = new SyncChangeLog();
                changeLog.id = require('crypto').randomUUID();
                changeLog.entityName = metadata.name;
                changeLog.recordId = recordId;
                changeLog.operation = 'UPDATE';
                changeLog.userId = userId;
                changeLog.deviceMac = macAddress;
                changeLog.createdAt = now;
                changeLog.afterJson = entityUpdate;
                await manager.save(changeLog);
            }

            // Marcar conflicto como resuelto
            conflicto.resuelto = true;
            conflicto.resolvedAt = now;
            conflicto.resolvedByUserId = userId;
            conflicto.resolvedByDeviceMac = macAddress;
            conflicto.resolutionStrategy = dto.strategy;
            conflicto.resolutionPayload = dto.resolvedData || null;
            conflicto.resolutionNote = dto.resolutionNote || null;

            await manager.save(conflicto);

            return { success: true, message: 'Conflicto resuelto exitosamente', conflicto };
        });
    }
}