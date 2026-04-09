import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { Sucursal } from './entities/sucursal.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Usuario } from './entities/usuario.entity';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { TramitesSyncService } from './services/tramites-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { SyncConflicto } from './entities/sync-conflict.entity';
import { ConflictosSyncService } from './services/conflictos-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal, Dispositivo, Usuario, SyncConflicto])],
  controllers: [SyncController],
  providers: [
    SyncService,
    SeguridadSyncService,
    CatalogosSyncService,
    MaestrosSyncService,
    TramitesSyncService,
    ConflictosSyncService
  ],
  exports: [SyncService],
})
export class SyncModule { }