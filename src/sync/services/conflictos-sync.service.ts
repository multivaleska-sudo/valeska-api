import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThanOrEqual } from 'typeorm';
import { SyncConflicto } from '../entities/sync-conflict.entity';

@Injectable()
export class ConflictosSyncService {
    constructor(
        @InjectRepository(SyncConflicto)
        private conflictoRepo: Repository<SyncConflicto>,
    ) { }

    async push(manager: EntityManager, payload: any): Promise<number> {
        const conflictos = payload.conflictos;
        if (!conflictos || !Array.isArray(conflictos) || conflictos.length === 0) {
            return 0;
        }

        let recordsSynced = 0;

        for (const item of conflictos) {
            const existing = await manager.findOne(SyncConflicto, {
                where: { id: item.id }
            });

            if (!existing || (item.resuelto && !existing.resuelto)) {
                await manager.save(SyncConflicto, {
                    id: item.id,
                    tablaAfectada: item.tablaAfectada,
                    registroId: item.registroId,
                    identificadorVisual: item.identificadorVisual,
                    datosLocales: item.datosLocales,
                    datosRemotos: item.datosRemotos,
                    resuelto: Boolean(item.resuelto),
                    fechaConflicto: new Date(item.fechaConflicto),
                });
                recordsSynced++;
            }
        }

        return recordsSynced;
    }

    async pull(lastSyncDate: Date) {
        const conflictos = await this.conflictoRepo.find({
            where: [
                { resuelto: false },
                { fechaConflicto: MoreThanOrEqual(lastSyncDate) }
            ],
            order: {
                fechaConflicto: 'DESC'
            }
        });

        return {
            conflictos
        };
    }
}