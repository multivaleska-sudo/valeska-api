import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource, MoreThan } from 'typeorm';
import { Tramite, TramiteDetalle } from '../../tramites/entities/tramite.entity';

@Injectable()
export class TramitesSyncService {
    constructor(private dataSource: DataSource) { }

    async push(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.tramites?.length) {
            await manager.upsert(Tramite, payload.tramites, ['id']);
            count += payload.tramites.length;
        }
        if (payload.tramiteDetalles?.length) {
            await manager.upsert(TramiteDetalle, payload.tramiteDetalles, ['id']);
            count += payload.tramiteDetalles.length;
        }
        return count;
    }

    async pull(syncDate: Date) {
        return {
            tramites: await this.dataSource.getRepository(Tramite).find({ where: { updatedAt: MoreThan(syncDate) } }),
            tramiteDetalles: await this.dataSource.getRepository(TramiteDetalle).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}