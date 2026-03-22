import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class SyncService {
    private readonly logger = new Logger('SyncMotor');

    constructor(
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Dispositivo) private dispRepo: Repository<Dispositivo>,
        @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
    ) { }

    async processPushSync(userId: string, payload: any) {
        const userRequesting = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['dispositivo']
        });

        if (!userRequesting) throw new UnauthorizedException('USER_NOT_FOUND');
        if (!userRequesting.estaActivo) throw new UnauthorizedException('USER_BLOCKED');

        const nombrePc = userRequesting.dispositivo?.nombreEquipo || 'PC-DESCONOCIDA';
        const userName = userRequesting.nombreCompleto;

        this.logger.log(`📥 [PUSH INICIADO] Máquina: ${nombrePc} | Operador: ${userName}`);

        const { sucursales, dispositivos, usuarios } = payload;
        let recordsSynced = 0;

        await this.sucursalRepo.manager.transaction(async (transactionalEntityManager) => {
            if (sucursales && sucursales.length > 0) {
                await transactionalEntityManager.upsert(Sucursal, sucursales, ['id']);
                recordsSynced += sucursales.length;
            }
            if (dispositivos && dispositivos.length > 0) {
                await transactionalEntityManager.upsert(Dispositivo, dispositivos, ['id']);
                recordsSynced += dispositivos.length;
            }
            if (usuarios && usuarios.length > 0) {
                await transactionalEntityManager.upsert(Usuario, usuarios, ['id']);
                recordsSynced += usuarios.length;
            }
        });

        this.logger.log(`✅ [PUSH COMPLETADO] ${nombrePc} sincronizó -> Usuarios: ${usuarios?.length || 0} | Dispositivos: ${dispositivos?.length || 0} | Sucursales: ${sucursales?.length || 0}`);

        return {
            success: true,
            recordsSynced,
            timestamp: new Date().toISOString()
        };
    }

    async processPullSync(userId: string, lastSyncIso: string) {
        const userRequesting = await this.userRepo.findOne({
            where: { id: userId }, relations: ['dispositivo']
        });

        if (!userRequesting) throw new UnauthorizedException('USER_NOT_FOUND');
        if (!userRequesting.estaActivo) throw new UnauthorizedException('USER_BLOCKED');

        const nombrePc = userRequesting.dispositivo?.nombreEquipo || 'PC-DESCONOCIDA';

        const syncDate = lastSyncIso ? new Date(lastSyncIso) : new Date(0);

        const sucursales = await this.sucursalRepo.find({ where: { updatedAt: MoreThan(syncDate) } });
        const dispositivos = await this.dispRepo.find({ where: { updatedAt: MoreThan(syncDate) } });
        const usuarios = await this.userRepo.find({ where: { updatedAt: MoreThan(syncDate) } });

        this.logger.log(`📤 [PULL COMPLETADO] ${nombrePc} descargó -> Usuarios: ${usuarios.length} | Dispositivos: ${dispositivos.length} | Sucursales: ${sucursales.length}`);

        return {
            sucursales,
            dispositivos,
            usuarios,
            serverTimestamp: new Date().toISOString()
        };
    }
}