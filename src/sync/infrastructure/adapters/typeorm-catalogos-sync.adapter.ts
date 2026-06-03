import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { ICatalogosSyncRepository } from '../../domain/ports/catalogos-sync-repository.interface';
import { CatalogoTipoTramite, CatalogoSituacion } from '../../../tramites/entities/catalogos.entity';

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

    private getManager(tx?: any): EntityManager {
        return (tx as EntityManager) || this.defaultTipoRepo.manager;
    }

    async upsertTiposTramite(tx: any, tipos: Partial<CatalogoTipoTramite>[]): Promise<void> {
        if (!tipos || tipos.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(CatalogoTipoTramite)
            .values(tipos)
            .orUpdate(['nombre', 'activo', 'updatedAt', 'syncStatus'], ['id'])
            .execute();
    }

    async upsertSituaciones(tx: any, situaciones: Partial<CatalogoSituacion>[]): Promise<void> {
        if (!situaciones || situaciones.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(CatalogoSituacion)
            .values(situaciones)
            .orUpdate(['nombre', 'colorHex', 'activo', 'updatedAt', 'syncStatus'], ['id'])
            .execute();
    }

    async fetchTiposTramiteCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoTipoTramite[]> {
        return this.defaultTipoRepo
            .createQueryBuilder('tipo')
            .where(
                new Brackets((qb) => {
                    qb.where('tipo.updatedAt > :cursorDate', { cursorDate })
                        .orWhere('tipo.updatedAt = :cursorDate AND tipo.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy('tipo.updatedAt', 'ASC')
            .addOrderBy('tipo.id', 'ASC')
            .take(limit)
            .getMany();
    }

    async fetchSituacionesCursor(cursorDate: Date, lastId: string, limit: number): Promise<CatalogoSituacion[]> {
        return this.defaultSituacionRepo
            .createQueryBuilder('situacion')
            .where(
                new Brackets((qb) => {
                    qb.where('situacion.updatedAt > :cursorDate', { cursorDate })
                        .orWhere('situacion.updatedAt = :cursorDate AND situacion.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy('situacion.updatedAt', 'ASC')
            .addOrderBy('situacion.id', 'ASC')
            .take(limit)
            .getMany();
    }
}