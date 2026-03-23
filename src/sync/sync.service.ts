import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, MoreThan } from 'typeorm';

import { Sucursal } from './entities/sucursal.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Usuario } from './entities/usuario.entity';
import { CatalogoTipoTramite, CatalogoSituacion } from '../tramites/entities/catalogos.entity';
import { Cliente, Vehiculo, EmpresaGestora, PlantillaDocumento } from '../tramites/entities/maestros.entity';
import { Tramite, TramiteDetalle } from '../tramites/entities/tramite.entity';

@Injectable()
export class SyncService {
    private readonly logger = new Logger('SyncMotor');

    constructor(
        @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
        private dataSource: DataSource,
    ) { }

    private async validateOperator(userId: string) {
        const userRequesting = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['dispositivo']
        });

        if (!userRequesting) throw new UnauthorizedException('USER_NOT_FOUND');
        if (!userRequesting.estaActivo) throw new UnauthorizedException('USER_BLOCKED');

        return {
            nombrePc: userRequesting.dispositivo?.nombreEquipo || 'PC-DESCONOCIDA',
            userName: userRequesting.nombreCompleto
        };
    }

    async processPushSync(userId: string, payload: any) {
        const { nombrePc, userName } = await this.validateOperator(userId);
        this.logger.log(`📥 [PUSH INICIADO] Máquina: ${nombrePc} | Operador: ${userName}`);

        let recordsSynced = 0;

        await this.dataSource.transaction(async (manager) => {
            recordsSynced += await this.pushSeguridad(manager, payload);
            recordsSynced += await this.pushCatalogos(manager, payload);
            recordsSynced += await this.pushMaestros(manager, payload);
            recordsSynced += await this.pushTramites(manager, payload);
        });

        this.logger.log(`✅ [PUSH COMPLETADO] ${nombrePc} sincronizó exitosamente ${recordsSynced} registros en la nube central.`);

        return {
            success: true,
            recordsSynced,
            timestamp: new Date().toISOString()
        };
    }

    async processPullSync(userId: string, lastSyncIso: string) {
        const { nombrePc, userName } = await this.validateOperator(userId);
        this.logger.log(`📤 [PULL INICIADO] Máquina: ${nombrePc} | Operador: ${userName}`);

        const syncDate = lastSyncIso ? new Date(lastSyncIso) : new Date(0);

        const dataSeguridad = await this.pullSeguridad(syncDate);
        const dataCatalogos = await this.pullCatalogos(syncDate);
        const dataMaestros = await this.pullMaestros(syncDate);
        const dataTramites = await this.pullTramites(syncDate);

        const totalDescargados =
            Object.values(dataSeguridad).flat().length +
            Object.values(dataCatalogos).flat().length +
            Object.values(dataMaestros).flat().length +
            Object.values(dataTramites).flat().length;

        this.logger.log(`✅ [PULL COMPLETADO] ${nombrePc} descargó -> ${totalDescargados} registros actualizados.`);

        return {
            ...dataSeguridad,
            ...dataCatalogos,
            ...dataMaestros,
            ...dataTramites,
            serverTimestamp: new Date().toISOString()
        };
    }

    private async pushSeguridad(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.sucursales?.length) { await manager.upsert(Sucursal, payload.sucursales, ['id']); count += payload.sucursales.length; }
        if (payload.dispositivos?.length) { await manager.upsert(Dispositivo, payload.dispositivos, ['id']); count += payload.dispositivos.length; }
        if (payload.usuarios?.length) { await manager.upsert(Usuario, payload.usuarios, ['id']); count += payload.usuarios.length; }
        return count;
    }

    private async pushCatalogos(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.catalogoTiposTramite?.length) { await manager.upsert(CatalogoTipoTramite, payload.catalogoTiposTramite, ['id']); count += payload.catalogoTiposTramite.length; }
        if (payload.catalogoSituaciones?.length) { await manager.upsert(CatalogoSituacion, payload.catalogoSituaciones, ['id']); count += payload.catalogoSituaciones.length; }
        return count;
    }

    private async pushMaestros(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.clientes?.length) { await manager.upsert(Cliente, payload.clientes, ['id']); count += payload.clientes.length; }
        if (payload.vehiculos?.length) { await manager.upsert(Vehiculo, payload.vehiculos, ['id']); count += payload.vehiculos.length; }
        if (payload.empresasGestoras?.length) { await manager.upsert(EmpresaGestora, payload.empresasGestoras, ['id']); count += payload.empresasGestoras.length; }
        if (payload.plantillasDocumentos?.length) { await manager.upsert(PlantillaDocumento, payload.plantillasDocumentos, ['id']); count += payload.plantillasDocumentos.length; }
        return count;
    }

    private async pushTramites(manager: EntityManager, payload: any): Promise<number> {
        let count = 0;
        if (payload.tramites?.length) { await manager.upsert(Tramite, payload.tramites, ['id']); count += payload.tramites.length; }
        if (payload.tramiteDetalles?.length) { await manager.upsert(TramiteDetalle, payload.tramiteDetalles, ['id']); count += payload.tramiteDetalles.length; }
        return count;
    }

    private async pullSeguridad(syncDate: Date) {
        return {
            sucursales: await this.dataSource.getRepository(Sucursal).find({ where: { updatedAt: MoreThan(syncDate) } }),
            dispositivos: await this.dataSource.getRepository(Dispositivo).find({ where: { updatedAt: MoreThan(syncDate) } }),
            usuarios: await this.dataSource.getRepository(Usuario).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }

    private async pullCatalogos(syncDate: Date) {
        return {
            catalogoTiposTramite: await this.dataSource.getRepository(CatalogoTipoTramite).find({ where: { updatedAt: MoreThan(syncDate) } }),
            catalogoSituaciones: await this.dataSource.getRepository(CatalogoSituacion).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }

    private async pullMaestros(syncDate: Date) {
        return {
            clientes: await this.dataSource.getRepository(Cliente).find({ where: { updatedAt: MoreThan(syncDate) } }),
            vehiculos: await this.dataSource.getRepository(Vehiculo).find({ where: { updatedAt: MoreThan(syncDate) } }),
            empresasGestoras: await this.dataSource.getRepository(EmpresaGestora).find({ where: { updatedAt: MoreThan(syncDate) } }),
            plantillasDocumentos: await this.dataSource.getRepository(PlantillaDocumento).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }

    private async pullTramites(syncDate: Date) {
        return {
            tramites: await this.dataSource.getRepository(Tramite).find({ where: { updatedAt: MoreThan(syncDate) } }),
            tramiteDetalles: await this.dataSource.getRepository(TramiteDetalle).find({ where: { updatedAt: MoreThan(syncDate) } }),
        };
    }
}