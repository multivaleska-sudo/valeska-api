import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { TramitesSyncService } from './services/tramites-sync.service';
import { ConflictosSyncService } from './services/conflictos-sync.service';

@Injectable()
export class SyncService {
    private readonly logger = new Logger('SyncMotor');

    constructor(
        @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
        private dataSource: DataSource,
        private seguridadSync: SeguridadSyncService,
        private catalogosSync: CatalogosSyncService,
        private maestrosSync: MaestrosSyncService,
        private tramitesSync: TramitesSyncService,
        private conflictosSync: ConflictosSyncService,
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
            recordsSynced += await this.seguridadSync.push(manager, payload);
            recordsSynced += await this.catalogosSync.push(manager, payload);
            recordsSynced += await this.maestrosSync.push(manager, payload);
            recordsSynced += await this.tramitesSync.push(manager, payload);
            recordsSynced += await this.conflictosSync.push(manager, payload);
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

        const dataSeguridad = await this.seguridadSync.pull(syncDate);
        const dataCatalogos = await this.catalogosSync.pull(syncDate);
        const dataMaestros = await this.maestrosSync.pull(syncDate);
        const dataTramites = await this.tramitesSync.pull(syncDate);
        const dataConflictos = await this.conflictosSync.pull(syncDate);

        const totalDescargados =
            Object.values(dataSeguridad).flat().length +
            Object.values(dataCatalogos).flat().length +
            Object.values(dataMaestros).flat().length +
            Object.values(dataTramites).flat().length +
            Object.values(dataConflictos).flat().length;

        this.logger.log(`✅ [PULL COMPLETADO] ${nombrePc} descargó -> ${totalDescargados} registros actualizados.`);

        return {
            ...dataSeguridad,
            ...dataCatalogos,
            ...dataMaestros,
            ...dataTramites,
            ...dataConflictos,
            serverTimestamp: new Date().toISOString()
        };
    }
}