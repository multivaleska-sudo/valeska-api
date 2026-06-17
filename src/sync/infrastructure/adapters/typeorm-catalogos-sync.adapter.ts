import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { ICatalogosSyncRepository } from '../../domain/ports/catalogos-sync-repository.interface';
import { CatalogoTipoTramite, CatalogoSituacion } from '../../../tramites/entities/catalogos.entity';

export const CATALOGO_TIPO_TRAMITE_UPSERT_COLUMNS = [
    'nombre',
    'activo',
    'updated_at',
    'deleted_at',
    'sync_status',
];

export const CATALOGO_SITUACION_UPSERT_COLUMNS = [
    'nombre',
    'color_hex',
    'activo',
    'updated_at',
    'deleted_at',
    'sync_status',
];

/**
 * Adaptador concreto para la persistencia transaccional y lectura indexada de Catálogos.
 */
@Injectable()
export class TypeOrmCatalogosSyncAdapter implements ICatalogosSyncRepository {
    constructor(
        @InjectRepository(CatalogoTipoTramite)
        private readonly defaultTipoRepo: Repository<CatalogoTipoTramite>,
        @InjectRepository(CatalogoSituacion)
        private readonly defaultSituacionRepo: Repository<CatalogoSituacion>,
    ) { }

    private getManager(tx?: EntityManager): EntityManager {
        return (tx as EntityManager) || this.defaultTipoRepo.manager;
    }

    async upsertTiposTramite(tx: EntityManager, tipos: Partial<CatalogoTipoTramite>[]): Promise<void> {
        if (!tipos || tipos.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(CatalogoTipoTramite)
            .values(tipos)
            .orUpdate(CATALOGO_TIPO_TRAMITE_UPSERT_COLUMNS, ['id'])
            .execute();
    }

    async upsertSituaciones(tx: EntityManager, situaciones: Partial<CatalogoSituacion>[]): Promise<void> {
        if (!situaciones || situaciones.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(CatalogoSituacion)
            .values(situaciones)
            .orUpdate(CATALOGO_SITUACION_UPSERT_COLUMNS, ['id'])
            .execute();
    }

    async fetchTiposTramiteCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<CatalogoTipoTramite[]> {
        return this.defaultTipoRepo
            .createQueryBuilder('tipo')
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where('tipo.updatedAt > :cursorDate', { cursorDate });

                    if (lastId) {
                        qb.orWhere('tipo.updatedAt = :cursorDate AND tipo.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                    }
                }),
            )
            .orderBy('tipo.updatedAt', 'ASC')
            .addOrderBy('tipo.id', 'ASC')
            .take(limit)
            .getMany();
    }

    async fetchSituacionesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<CatalogoSituacion[]> {
        return this.defaultSituacionRepo
            .createQueryBuilder('situacion')
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where('situacion.updatedAt > :cursorDate', { cursorDate });

                    if (lastId) {
                        qb.orWhere('situacion.updatedAt = :cursorDate AND situacion.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                    }
                }),
            )
            .orderBy('situacion.updatedAt', 'ASC')
            .addOrderBy('situacion.id', 'ASC')
            .take(limit)
            .getMany();
    }
}
