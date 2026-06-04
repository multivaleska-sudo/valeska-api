import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { IConflictosSyncRepository } from '../../domain/ports/conflictos-sync-repository.interface';
import { SyncConflicto } from '../../entities/sync-conflict.entity';

/**
 * Adaptador concreto para registrar y leer las colisiones de sincronización.
 */
@Injectable()
export class TypeOrmConflictosSyncAdapter implements IConflictosSyncRepository {
    constructor(
        @InjectRepository(SyncConflicto)
        private readonly defaultConflictoRepo: Repository<SyncConflicto>,
    ) { }

    private getManager(tx?: EntityManager): EntityManager {
        return (tx as EntityManager) || this.defaultConflictoRepo.manager;
    }

    async upsertConflictos(tx: EntityManager, conflictos: Partial<SyncConflicto>[]): Promise<void> {
        if (!conflictos || conflictos.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(SyncConflicto)
            .values(conflictos)
            .orUpdate(
                [
                    'tablaAfectada',
                    'registroId',
                    'identificadorVisual',
                    'datosLocales',
                    'datosRemotos',
                    'resuelto',
                    'fechaConflicto',
                ],
                ['id'],
            )
            .execute();
    }

    async fetchConflictosCursor(cursorDate: Date, lastId: string, limit: number): Promise<SyncConflicto[]> {
        return this.defaultConflictoRepo
            .createQueryBuilder('conflicto')
            .where(
                new Brackets((qb) => {
                    qb.where('conflicto.fechaConflicto > :cursorDate', { cursorDate })
                        .orWhere('conflicto.fechaConflicto = :cursorDate AND conflicto.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy('conflicto.fechaConflicto', 'ASC')
            .addOrderBy('conflicto.id', 'ASC')
            .take(limit)
            .getMany();
    }
}
