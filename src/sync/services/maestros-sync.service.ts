import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource, MoreThan } from 'typeorm';
import {
    Cliente,
    Vehiculo,
    EmpresaGestora,
    RepresentanteLegal,
    Presentante,
    PlantillaDocumento
} from '../../tramites/entities/maestros.entity';
import {
    MessageTemplate
} from '../../tramites/entities/plantillas.entity';
import { PerfilGestor } from '../../tramites/entities/perfil-gestor.entity';

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
        if (payload.representantesLegales?.length) {
            await manager.upsert(RepresentanteLegal, payload.representantesLegales, ['id']);
            count += payload.representantesLegales.length;
        }
        if (payload.presentantes?.length) {
            await manager.upsert(Presentante, payload.presentantes, ['id']);
            count += payload.presentantes.length;
        }
        if (payload.plantillasDocumentos?.length) {
            await manager.upsert(PlantillaDocumento, payload.plantillasDocumentos, ['id']);
            count += payload.plantillasDocumentos.length;
        }
        if (payload.messageTemplates?.length) {
            await manager.upsert(MessageTemplate, payload.messageTemplates, ['id']);
            count += payload.messageTemplates.length;
        }

        if (payload.perfilesGestor?.length) {
            await manager.upsert(PerfilGestor, payload.perfilesGestor, ['id']);
            count += payload.perfilesGestor.length;
        }

        return count;
    }

    async pull(syncDate: Date) {
        return {
            clientes: await this.dataSource.getRepository(Cliente).find({ where: { updatedAt: MoreThan(syncDate) } }),
            vehiculos: await this.dataSource.getRepository(Vehiculo).find({ where: { updatedAt: MoreThan(syncDate) } }),
            empresasGestoras: await this.dataSource.getRepository(EmpresaGestora).find({ where: { updatedAt: MoreThan(syncDate) } }),
            representantesLegales: await this.dataSource.getRepository(RepresentanteLegal).find({ where: { updatedAt: MoreThan(syncDate) } }),
            presentantes: await this.dataSource.getRepository(Presentante).find({ where: { updatedAt: MoreThan(syncDate) } }),
            plantillasDocumentos: await this.dataSource.getRepository(PlantillaDocumento).find({ where: { updatedAt: MoreThan(syncDate) } }),
            messageTemplates: await this.dataSource.getRepository(MessageTemplate).find({ where: { updatedAt: MoreThan(syncDate) } }),
            perfilesGestor: await this.dataSource.getRepository(PerfilGestor).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}