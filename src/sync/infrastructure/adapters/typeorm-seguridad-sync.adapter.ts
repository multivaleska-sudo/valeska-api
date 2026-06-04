import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Brackets } from 'typeorm';
import { ISeguridadSyncRepository } from '../../domain/ports/seguridad-sync-repository.interface';
import { Usuario } from '../../entities/usuario.entity';
import { Dispositivo } from '../../entities/dispositivo.entity';
import { Sucursal } from '../../entities/sucursal.entity';

/**
 * RUTA: src/sync/infrastructure/adapters/typeorm-seguridad-sync.adapter.ts
 * Adaptador concreto para resolver el flujo de accesos, dispositivos de origen y sucursales.
 */
@Injectable()
export class TypeOrmSeguridadSyncAdapter implements ISeguridadSyncRepository {
    constructor(
        @InjectRepository(Usuario) private readonly defaultUsuarioRepo: Repository<Usuario>,
        @InjectRepository(Dispositivo) private readonly defaultDispositivoRepo: Repository<Dispositivo>,
        @InjectRepository(Sucursal) private readonly defaultSucursalRepo: Repository<Sucursal>,
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

    async findOperatorById(userId: string): Promise<Usuario | null> {
        return this.defaultUsuarioRepo.findOne({
            where: { id: userId },
            relations: ['dispositivos'], // Carga el conjunto multidispositivo asociado
        });
    }

    // --- MÉTODOS DE ESCRITURA POR LOTES (UPSERT) ---

    async upsertUsuarios(tx: EntityManager, usuarios: Partial<Usuario>[]): Promise<void> {
        if (!usuarios || usuarios.length === 0) return;
        const manager = this.getManager(tx, this.defaultUsuarioRepo);
        await manager.createQueryBuilder().insert().into(Usuario).values(usuarios)
            .orUpdate(['username', 'passwordHash', 'rol', 'nombreCompleto', 'estaActivo', 'dispositivoId', 'updatedAt', 'syncStatus'], ['id'])
            .execute();
    }

    async upsertDispositivos(tx: EntityManager, dispositivos: Partial<Dispositivo>[]): Promise<void> {
        if (!dispositivos || dispositivos.length === 0) return;
        const manager = this.getManager(tx, this.defaultDispositivoRepo);
        await manager.createQueryBuilder().insert().into(Dispositivo).values(dispositivos)
            .orUpdate(['macAddress', 'nombreEquipo', 'autorizado', 'provisionId', 'sucursalId', 'usuarioId', 'updatedAt', 'syncStatus'], ['id'])
            .execute();
    }

    async upsertSucursales(tx: EntityManager, sucursales: Partial<Sucursal>[]): Promise<void> {
        if (!sucursales || sucursales.length === 0) return;
        const manager = this.getManager(tx, this.defaultSucursalRepo);
        await manager.createQueryBuilder().insert().into(Sucursal).values(sucursales)
            .orUpdate(['nombre', 'codigo', 'direccion', 'updatedAt', 'syncStatus'], ['id'])
            .execute();
    }

    // --- MÉTODOS DE LECTURA PAGINADA (PULL CURSOR) ---

    private buildCursorQuery(repo: Repository<any>, alias: string, cursorDate: Date, lastId: string, limit: number) {
        return repo.createQueryBuilder(alias)
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where(`${alias}.updatedAt > :cursorDate`, { cursorDate })
                        .orWhere(`${alias}.updatedAt = :cursorDate AND ${alias}.id > :lastId`, {
                            cursorDate,
                            lastId,
                        });
                }),
            )
            .orderBy(`${alias}.updatedAt`, 'ASC')
            .addOrderBy(`${alias}.id`, 'ASC')
            .take(limit);
    }

    async fetchUsuariosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Usuario[]> {
        return this.buildCursorQuery(this.defaultUsuarioRepo, 'usuario', cursorDate, lastId, limit).getMany();
    }

    async fetchDispositivosCursor(cursorDate: Date, lastId: string, limit: number): Promise<Dispositivo[]> {
        return this.buildCursorQuery(this.defaultDispositivoRepo, 'dispositivo', cursorDate, lastId, limit).getMany();
    }

    async fetchSucursalesCursor(cursorDate: Date, lastId: string, limit: number): Promise<Sucursal[]> {
        return this.buildCursorQuery(this.defaultSucursalRepo, 'sucursal', cursorDate, lastId, limit).getMany();
    }
}
