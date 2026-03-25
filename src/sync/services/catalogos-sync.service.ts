import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource, MoreThan } from 'typeorm';
import { CatalogoTipoTramite, CatalogoSituacion } from '../../tramites/entities/catalogos.entity';

@Injectable()
export class CatalogosSyncService {
    constructor(private dataSource: DataSource) { }

    async push(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.catalogoTiposTramite?.length) {
            await manager.upsert(CatalogoTipoTramite, payload.catalogoTiposTramite, ['id']);
            count += payload.catalogoTiposTramite.length;
        }
        if (payload.catalogoSituaciones?.length) {
            await manager.upsert(CatalogoSituacion, payload.catalogoSituaciones, ['id']);
            count += payload.catalogoSituaciones.length;
        }
        return count;
    }

    async pull(syncDate: Date) {
        return {
            catalogoTiposTramite: await this.dataSource.getRepository(CatalogoTipoTramite).find({ where: { updatedAt: MoreThan(syncDate) } }),
            catalogoSituaciones: await this.dataSource.getRepository(CatalogoSituacion).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}