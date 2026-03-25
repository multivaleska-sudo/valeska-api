import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource, MoreThan } from 'typeorm';
import { Sucursal } from '../entities/sucursal.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class SeguridadSyncService {
    constructor(private dataSource: DataSource) { }

    async push(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.sucursales?.length) {
            await manager.upsert(Sucursal, payload.sucursales, ['id']);
            count += payload.sucursales.length;
        }
        if (payload.dispositivos?.length) {
            await manager.upsert(Dispositivo, payload.dispositivos, ['id']);
            count += payload.dispositivos.length;
        }
        if (payload.usuarios?.length) {
            await manager.upsert(Usuario, payload.usuarios, ['id']);
            count += payload.usuarios.length;
        }
        return count;
    }

    async pull(syncDate: Date) {
        return {
            sucursales: await this.dataSource.getRepository(Sucursal).find({ where: { updatedAt: MoreThan(syncDate) } }),
            dispositivos: await this.dataSource.getRepository(Dispositivo).find({ where: { updatedAt: MoreThan(syncDate) } }),
            usuarios: await this.dataSource.getRepository(Usuario).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}