import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { IMaestrosSyncRepository } from '../../domain/ports/maestros-sync-repository.interface';
import {
    Cliente,
    Vehiculo,
    EmpresaGestora,
    PlantillaDocumento,
    Presentante,
    RepresentanteLegal
} from '../../../tramites/entities/maestros.entity';
import { PerfilGestor } from '../../../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../../../tramites/entities/plantillas.entity';
import type { SyncPushResult } from '../../domain/sync-push-result';
import { emptySyncPushResult } from '../../domain/sync-push-result';
import { splitOptimisticConflicts } from './optimistic-sync-utils';

/**
 * Adaptador concreto para resolver el mapeo de persistencia masiva de las 8 entidades Maestras.
 */
@Injectable()
export class TypeOrmMaestrosSyncAdapter implements IMaestrosSyncRepository {
    constructor(
        @InjectRepository(Cliente) private readonly defaultClienteRepo: Repository<Cliente>,
        @InjectRepository(Vehiculo) private readonly defaultVehiculoRepo: Repository<Vehiculo>,
        @InjectRepository(EmpresaGestora) private readonly defaultEmpresaRepo: Repository<EmpresaGestora>,
        @InjectRepository(PlantillaDocumento) private readonly defaultPlantillaDocRepo: Repository<PlantillaDocumento>,
        @InjectRepository(Presentante) private readonly defaultPresentanteRepo: Repository<Presentante>,
        @InjectRepository(RepresentanteLegal) private readonly defaultRepLegalRepo: Repository<RepresentanteLegal>,
        @InjectRepository(PerfilGestor) private readonly defaultPerfilRepo: Repository<PerfilGestor>,
        @InjectRepository(MessageTemplate) private readonly defaultMsgTemplateRepo: Repository<MessageTemplate>,
    ) { }

    private getManager(tx?: EntityManager, fallbackRepo?: Repository<any>): EntityManager {
        if (tx instanceof EntityManager) {
            return tx;
        }

        if (!fallbackRepo) {
            throw new Error(
                'Error de Arquitectura: Se requiere un fallbackRepo cuando no se provee un EntityManager activo.'
            );
        }

        return fallbackRepo.manager;
    }

    // --- IMPLEMENTACIÓN DE ESCRITURAS TRANSACCIONALES POR LOTES (UPSERT) ---

    async upsertClientes(tx: EntityManager, clientes: Partial<Cliente>[]): Promise<SyncPushResult> {
        if (!clientes || clientes.length === 0) return emptySyncPushResult();
        const manager = this.getManager(tx, this.defaultClienteRepo);
        const { accepted, result } = await splitOptimisticConflicts(
            manager,
            Cliente,
            'clientes',
            clientes,
            (record) => String(record.numeroDocumento || record.razonSocialNombres || record.id || 'Cliente'),
        );
        if (accepted.length === 0) return result;
        await manager.createQueryBuilder().insert().into(Cliente).values(accepted)
            .orUpdate(['tipo_documento', 'numero_documento', 'razon_social_nombres', 'estado_civil', 'domicilio', 'telefono', 'updated_at', 'sync_status', 'version', 'base_version', 'updated_by_user_id', 'updated_by_device_mac'], ['id'])
            .execute();
        return result;
    }

    async upsertVehiculos(tx: EntityManager, vehiculos: Partial<Vehiculo>[]): Promise<SyncPushResult> {
        if (!vehiculos || vehiculos.length === 0) return emptySyncPushResult();
        const manager = this.getManager(tx, this.defaultVehiculoRepo);
        const { accepted, result } = await splitOptimisticConflicts(
            manager,
            Vehiculo,
            'vehiculos',
            vehiculos,
            (record) => String(record.placa || record.chasisVin || record.id || 'Vehiculo'),
        );
        if (accepted.length === 0) return result;
        await manager.createQueryBuilder().insert().into(Vehiculo).values(accepted)
            .orUpdate(['chasis_vin', 'placa', 'motor', 'marca', 'modelo', 'color', 'carroceria', 'categoria', 'anio_fabricacion', 'anio_modelo', 'updated_at', 'sync_status', 'version', 'base_version', 'updated_by_user_id', 'updated_by_device_mac'], ['id'])
            .execute();
        return result;
    }

    async upsertEmpresasGestoras(tx: EntityManager, empresas: Partial<EmpresaGestora>[]): Promise<void> {
        if (!empresas || empresas.length === 0) return;
        const manager = this.getManager(tx, this.defaultEmpresaRepo);
        await manager.createQueryBuilder().insert().into(EmpresaGestora).values(empresas)
            .orUpdate(['ruc', 'razon_social', 'direccion', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    async upsertPlantillasDocumentos(tx: EntityManager, plantillas: Partial<PlantillaDocumento>[]): Promise<void> {
        if (!plantillas || plantillas.length === 0) return;
        const manager = this.getManager(tx, this.defaultPlantillaDocRepo);
        await manager.createQueryBuilder().insert().into(PlantillaDocumento).values(plantillas)
            .orUpdate(['nombre_documento', 'contenido_html', 'orientacion_papel', 'activo', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    async upsertPresentantes(tx: EntityManager, presentantes: Partial<Presentante>[]): Promise<void> {
        if (!presentantes || presentantes.length === 0) return;
        const manager = this.getManager(tx, this.defaultPresentanteRepo);
        await manager.createQueryBuilder().insert().into(Presentante).values(presentantes)
            .orUpdate(['dni', 'nombres', 'primer_apellido', 'segundo_apellido', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    async upsertRepresentantesLegales(tx: EntityManager, representantes: Partial<RepresentanteLegal>[]): Promise<void> {
        if (!representantes || representantes.length === 0) return;
        const manager = this.getManager(tx, this.defaultRepLegalRepo);
        await manager.createQueryBuilder().insert().into(RepresentanteLegal).values(representantes)
            .orUpdate(['empresa_gestora_id', 'dni', 'nombres', 'primer_apellido', 'segundo_apellido', 'partida_registral', 'oficina_registral', 'domicilio', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    async upsertPerfilesGestor(tx: EntityManager, perfiles: Partial<PerfilGestor>[]): Promise<void> {
        if (!perfiles || perfiles.length === 0) return;
        const manager = this.getManager(tx, this.defaultPerfilRepo);
        await manager.createQueryBuilder().insert().into(PerfilGestor).values(perfiles)
            .orUpdate(['calidad', 'nombre', 'concesionario', 'importador', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    async upsertMessageTemplates(tx: EntityManager, templates: Partial<MessageTemplate>[]): Promise<void> {
        if (!templates || templates.length === 0) return;
        const manager = this.getManager(tx, this.defaultMsgTemplateRepo);
        await manager.createQueryBuilder().insert().into(MessageTemplate).values(templates)
            .orUpdate(['name', 'content', 'updated_at', 'sync_status'], ['id'])
            .execute();
    }

    // --- IMPLEMENTACIÓN DE LECTURAS INDEXADAS DE ALTA VELOCIDAD (PULL CURSOR) ---

    private buildCursorQuery(repo: Repository<any>, alias: string, cursorDate: Date, lastId: string | undefined, limit: number) {
        return repo.createQueryBuilder(alias)
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where(`${alias}.updatedAt > :cursorDate`, { cursorDate });

                    if (lastId) {
                        qb.orWhere(`${alias}.updatedAt = :cursorDate AND ${alias}.id > :lastId`, {
                            cursorDate,
                            lastId,
                        });
                    }
                }),
            )
            .orderBy(`${alias}.updatedAt`, 'ASC')
            .addOrderBy(`${alias}.id`, 'ASC')
            .take(limit);
    }

    async fetchClientesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<Cliente[]> {
        return this.buildCursorQuery(this.defaultClienteRepo, 'cliente', cursorDate, lastId, limit).getMany();
    }

    async fetchVehiculosCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<Vehiculo[]> {
        return this.buildCursorQuery(this.defaultVehiculoRepo, 'vehiculo', cursorDate, lastId, limit).getMany();
    }

    async fetchEmpresasGestorasCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<EmpresaGestora[]> {
        return this.buildCursorQuery(this.defaultEmpresaRepo, 'empresa', cursorDate, lastId, limit).getMany();
    }

    async fetchPlantillasCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<PlantillaDocumento[]> {
        return this.buildCursorQuery(this.defaultPlantillaDocRepo, 'plantilla', cursorDate, lastId, limit).getMany();
    }

    async fetchPresentantesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<Presentante[]> {
        return this.buildCursorQuery(this.defaultPresentanteRepo, 'presentante', cursorDate, lastId, limit).getMany();
    }

    async fetchRepresentantesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<RepresentanteLegal[]> {
        return this.buildCursorQuery(this.defaultRepLegalRepo, 'repLegal', cursorDate, lastId, limit).getMany();
    }

    async fetchPerfilesGestorCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<PerfilGestor[]> {
        return this.buildCursorQuery(this.defaultPerfilRepo, 'perfil', cursorDate, lastId, limit).getMany();
    }

    async fetchMessageTemplatesCursor(cursorDate: Date, lastId: string | undefined, limit: number): Promise<MessageTemplate[]> {
        return this.buildCursorQuery(this.defaultMsgTemplateRepo, 'template', cursorDate, lastId, limit).getMany();
    }
}
