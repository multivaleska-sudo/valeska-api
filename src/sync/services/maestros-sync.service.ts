import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource, MoreThan } from 'typeorm';
import { Cliente, Vehiculo, EmpresaGestora, PlantillaDocumento, Presentante } from '../../tramites/entities/maestros.entity';

@Injectable()
export class MaestrosSyncService {
    constructor(private dataSource: DataSource) { }

    async push(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.clientes?.length) {
            await manager.upsert(Cliente, payload.clientes, ['id']);
            count += payload.clientes.length;
        }
        if (payload.vehiculos?.length) {
            await manager.upsert(Vehiculo, payload.vehiculos, ['id']);
            count += payload.vehiculos.length;
        }
        if (payload.empresasGestoras?.length) {
            await manager.upsert(EmpresaGestora, payload.empresasGestoras, ['id']);
            count += payload.empresasGestoras.length;
        }
        if (payload.plantillasDocumentos?.length) {
            await manager.upsert(PlantillaDocumento, payload.plantillasDocumentos, ['id']);
            count += payload.plantillasDocumentos.length;
        }
        if (payload.presentantes?.length) {
            await manager.upsert(Presentante, payload.presentantes, ['id']);
            count += payload.presentantes.length;
        }
        return count;
    }

    async pull(syncDate: Date) {
        return {
            clientes: await this.dataSource.getRepository(Cliente).find({ where: { updatedAt: MoreThan(syncDate) } }),
            vehiculos: await this.dataSource.getRepository(Vehiculo).find({ where: { updatedAt: MoreThan(syncDate) } }),
            empresasGestoras: await this.dataSource.getRepository(EmpresaGestora).find({ where: { updatedAt: MoreThan(syncDate) } }),
            plantillasDocumentos: await this.dataSource.getRepository(PlantillaDocumento).find({ where: { updatedAt: MoreThan(syncDate) } }),
            presentantes: await this.dataSource.getRepository(Presentante).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}