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

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal, Dispositivo, Usuario])],
  controllers: [SyncController],
  providers: [
    SyncService,
    SeguridadSyncService,
    CatalogosSyncService,
    MaestrosSyncService,
    TramitesSyncService,
  ],
  exports: [SyncService],
})
export class SyncModule { }