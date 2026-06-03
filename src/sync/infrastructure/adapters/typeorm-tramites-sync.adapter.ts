import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { ITramitesSyncRepository } from '../../domain/ports/tramites-sync-repository.interface';
import { Tramite, TramiteDetalle } from '../../../tramites/entities/tramite.entity';

/**
 * Adaptador concreto para la persistencia transaccional y lectura indexada de Trámites.
 */
@Injectable()
export class TypeOrmTramitesSyncAdapter implements ITramitesSyncRepository {
    constructor(
        @InjectRepository(Tramite)
        private readonly defaultTramiteRepo: Repository<Tramite>,
        @InjectRepository(TramiteDetalle)
        private readonly defaultDetalleRepo: Repository<TramiteDetalle>,
    ) { }

    private getManager(tx?: any): EntityManager {
        return (tx as EntityManager) || this.defaultTramiteRepo.manager;
    }

    async upsertTramites(tx: any, tramites: Partial<Tramite>[]): Promise<void> {
        if (!tramites || tramites.length === 0) return;
        const manager = this.getManager(tx);

        // Ejecuta UPSERT masivo atómico en PostgreSQL
        await manager
            .createQueryBuilder()
            .insert()
            .into(Tramite)
            .values(tramites)
            .orUpdate(
                [
                    'codigoVerificacion',
                    'tramiteAnio',
                    'clienteId',
                    'vehiculoId',
                    'tipoTramiteId',
                    'situacionId',
                    'nTitulo',
                    'nFormato',
                    'fechaPresentacion',
                    'observacionesGenerales',
                    'tarjetaEnOficina',
                    'fechaTarjetaEnOficina',
                    'placaEnOficina',
                    'fechaPlacaEnOficina',
                    'entregoTarjeta',
                    'fechaEntregaTarjeta',
                    'metodoEntregaTarjeta',
                    'entregoPlaca',
                    'fechaEntregaPlaca',
                    'metodoEntregaPlaca',
                    'observacionPlaca',
                    'updatedAt',
                    'syncStatus',
                ],
                ['id'],
            )
            .execute();
    }

    async upsertTramiteDetalles(tx: any, detalles: Partial<TramiteDetalle>[]): Promise<void> {
        if (!detalles || detalles.length === 0) return;
        const manager = this.getManager(tx);

        await manager
            .createQueryBuilder()
            .insert()
            .into(TramiteDetalle)
            .values(detalles)
            .orUpdate(
                [
                    'tramiteId',
                    'empresaGestoraId',
                    'representanteLegalId',
                    'presentanteId',
                    'tipoBoleta',
                    'numeroBoleta',
                    'fechaBoleta',
                    'dua',
                    'numFormatoInmatriculacion',
                    'numeroReciboTramite',
                    'clausulaMonto',
                    'clausulaFormaPago',
                    'clausulaPagoBancarizado',
                    'aclaracionDice',
                    'aclaracionDebeDecir',
                    'updatedAt',
                    'syncStatus',
                ],
                ['id'],
            )
            .execute();
    }

    async fetchTramitesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Tramite[]> {
        return this.defaultTramiteRepo
            .createQueryBuilder('tramite')
            .where(
                new Brackets((qb) => {
                    qb.where('tramite.updatedAt > :cursorDate', { cursorDate })
                        .orWhere('tramite.updatedAt = :cursorDate AND tramite.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy('tramite.updatedAt', 'ASC')
            .addOrderBy('tramite.id', 'ASC')
            .take(limit)
            .getMany();
    }

    async fetchTramiteDetallesCursor(cursorDate: Date, lastId: string, limit: number): Promise<TramiteDetalle[]> {
        return this.defaultDetalleRepo
            .createQueryBuilder('detalle')
            .where(
                new Brackets((qb) => {
                    qb.where('detalle.updatedAt > :cursorDate', { cursorDate })
                        .orWhere('detalle.updatedAt = :cursorDate AND detalle.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy('detalle.updatedAt', 'ASC')
            .addOrderBy('detalle.id', 'ASC')
            .take(limit)
            .getMany();
    }
}