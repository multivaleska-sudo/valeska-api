import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { ITramitesSyncRepository } from '../../domain/ports/tramites-sync-repository.interface';
import { Tramite, TramiteDetalle } from '../../../tramites/entities/tramite.entity';
import type { SyncPushResult, SyncWriteContext } from '../../domain/sync-push-result';
import { emptySyncPushResult } from '../../domain/sync-push-result';
import { splitOptimisticConflicts } from './optimistic-sync-utils';

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

    private getManager(tx?: EntityManager): EntityManager {
        return (tx as EntityManager) || this.defaultTramiteRepo.manager;
    }

    async upsertTramites(tx: EntityManager, tramites: Partial<Tramite>[], context: SyncWriteContext): Promise<SyncPushResult> {
        if (!tramites || tramites.length === 0) return emptySyncPushResult();
        const manager = this.getManager(tx);
        const { accepted, result } = await splitOptimisticConflicts(
            manager,
            Tramite,
            'tramites',
            tramites,
            (record) => String(record.nTitulo || record.codigoVerificacion || record.id || 'Tramite'),
            context,
        );
        if (accepted.length === 0) return result;

        // Ejecuta UPSERT masivo atómico en PostgreSQL
        await manager
            .createQueryBuilder()
            .insert()
            .into(Tramite)
            .values(accepted)
            .orUpdate(
                [
                    'codigo_verificacion',
                    'tramite_anio',
                    'cliente_id',
                    'vehiculo_id',
                    'tipo_tramite_id',
                    'situacion_id',
                    'n_titulo',
                    'n_formato',
                    'fecha_presentacion',
                    'observaciones_generales',
                    'tarjeta_en_oficina',
                    'fecha_tarjeta_en_oficina',
                    'placa_en_oficina',
                    'fecha_placa_en_oficina',
                    'entrego_tarjeta',
                    'fecha_entrega_tarjeta',
                    'metodo_entrega_tarjeta',
                    'entrego_placa',
                    'fecha_entrega_placa',
                    'metodo_entrega_placa',
                    'observacion_placa',
                    'updated_at',
                    'sync_status',
                    'version',
                    'base_version',
                    'updated_by_user_id',
                    'updated_by_device_mac',
                ],
                ['id'],
            )
            .execute();
        return result;
    }

    async upsertTramiteDetalles(tx: EntityManager, detalles: Partial<TramiteDetalle>[], context: SyncWriteContext): Promise<SyncPushResult> {
        if (!detalles || detalles.length === 0) return emptySyncPushResult();
        const manager = this.getManager(tx);
        const { accepted, result } = await splitOptimisticConflicts(
            manager,
            TramiteDetalle,
            'tramite_detalles',
            detalles,
            (record) => String(record.tramiteId || record.id || 'Detalle de tramite'),
            context,
        );
        if (accepted.length === 0) return result;

        await manager
            .createQueryBuilder()
            .insert()
            .into(TramiteDetalle)
            .values(accepted)
            .orUpdate(
                [
                    'tramite_id',
                    'empresa_gestora_id',
                    'representante_legal_id',
                    'presentante_id',
                    'tipo_boleta',
                    'numero_boleta',
                    'fecha_boleta',
                    'dua',
                    'num_formato_inmatriculacion',
                    'numero_recibo_tramite',
                    'clausula_monto',
                    'clausula_forma_pago',
                    'clausula_pago_bancarizado',
                    'aclaracion_dice',
                    'aclaracion_debe_decir',
                    'updated_at',
                    'sync_status',
                    'version',
                    'base_version',
                    'updated_by_user_id',
                    'updated_by_device_mac',
                ],
                ['id'],
            )
            .execute();
        return result;
    }

    async fetchTramitesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<Tramite[]> {
        return this.defaultTramiteRepo
            .createQueryBuilder('tramite')
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where('tramite.updatedAt > :cursorDate', { cursorDate });

                    if (lastId) {
                        qb.orWhere('tramite.updatedAt = :cursorDate AND tramite.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                    }
                }),
            )
            .orderBy('tramite.updatedAt', 'ASC')
            .addOrderBy('tramite.id', 'ASC')
            .take(limit)
            .getMany();
    }

    async fetchTramiteDetallesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<TramiteDetalle[]> {
        return this.defaultDetalleRepo
            .createQueryBuilder('detalle')
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where('detalle.updatedAt > :cursorDate', { cursorDate });

                    if (lastId) {
                        qb.orWhere('detalle.updatedAt = :cursorDate AND detalle.id > :lastId', {
                            cursorDate,
                            lastId,
                        });
                    }
                }),
            )
            .orderBy('detalle.updatedAt', 'ASC')
            .addOrderBy('detalle.id', 'ASC')
            .take(limit)
            .getMany();
    }
}
