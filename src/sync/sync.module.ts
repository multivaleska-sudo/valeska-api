import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ObservabilityModule } from '../observability/observability.module';
import { QueueModule } from '../queue/queue.module';
import { SYNC_PUSH_QUEUE } from '../queue/queue.constants';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncPushProcessor } from './processors/sync-push.processor';
import { TramitesSyncService } from './services/tramites-sync.service';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { ConflictosSyncService } from './services/conflictos-sync.service';
import { SyncOutboxService } from './services/sync-outbox.service';
import { SyncPushProducerService } from './services/sync-push-producer.service';
import { SyncHealthService } from './services/sync-health.service';
import { Usuario } from './entities/usuario.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Sucursal } from './entities/sucursal.entity';
import { SyncConflicto } from './entities/sync-conflict.entity';
import { SyncOutboxJob } from './entities/sync-outbox-job.entity';
import { SyncChangeLog } from './entities/sync-change-log.entity';
import { Tramite, TramiteDetalle } from '../tramites/entities/tramite.entity';
import { CatalogoTipoTramite, CatalogoSituacion } from '../tramites/entities/catalogos.entity';
import {
  Cliente,
  Vehiculo,
  EmpresaGestora,
  PlantillaDocumento,
  Presentante,
  RepresentanteLegal
} from '../tramites/entities/maestros.entity';
import { PerfilGestor } from '../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../tramites/entities/plantillas.entity';

import { SEGURIDAD_SYNC_REPOSITORY_TOKEN } from './domain/ports/seguridad-sync-repository.interface';
import { TypeOrmSeguridadSyncAdapter } from './infrastructure/adapters/typeorm-seguridad-sync.adapter';

import { TRAMITES_SYNC_REPOSITORY_TOKEN } from './domain/ports/tramites-sync-repository.interface';
import { TypeOrmTramitesSyncAdapter } from './infrastructure/adapters/typeorm-tramites-sync.adapter';

import { CATALOGOS_SYNC_REPOSITORY_TOKEN } from './domain/ports/catalogos-sync-repository.interface';
import { TypeOrmCatalogosSyncAdapter } from './infrastructure/adapters/typeorm-catalogos-sync.adapter';

import { MAESTROS_SYNC_REPOSITORY_TOKEN } from './domain/ports/maestros-sync-repository.interface';
import { TypeOrmMaestrosSyncAdapter } from './infrastructure/adapters/typeorm-maestros-sync.adapter';

import { CONFLICTOS_SYNC_REPOSITORY_TOKEN } from './domain/ports/conflictos-sync-repository.interface';
import { TypeOrmConflictosSyncAdapter } from './infrastructure/adapters/typeorm-conflictos-sync.adapter';

/**
 * Módulo de Sincronización que unifica y provee inyección de dependencias desacoplada.
 */
@Module({
  imports: [
    AuthModule,
    ObservabilityModule,
    QueueModule,
    BullModule.registerQueue({
      name: SYNC_PUSH_QUEUE,
    }),
    TypeOrmModule.forFeature([
      Usuario,
      Dispositivo,
      Sucursal,
      SyncConflicto,
      SyncOutboxJob,
      SyncChangeLog,
      Tramite,
      TramiteDetalle,
      CatalogoTipoTramite,
      CatalogoSituacion,
      Cliente,
      Vehiculo,
      EmpresaGestora,
      PlantillaDocumento,
      Presentante,
      RepresentanteLegal,
      PerfilGestor,
      MessageTemplate,
    ]),
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    TramitesSyncService,
    CatalogosSyncService,
    MaestrosSyncService,
    SeguridadSyncService,
    ConflictosSyncService,
    SyncOutboxService,
    SyncPushProducerService,
    SyncHealthService,
    SyncPushProcessor,
    {
      provide: SEGURIDAD_SYNC_REPOSITORY_TOKEN,
      useClass: TypeOrmSeguridadSyncAdapter,
    },
    {
      provide: TRAMITES_SYNC_REPOSITORY_TOKEN,
      useClass: TypeOrmTramitesSyncAdapter,
    },
    {
      provide: CATALOGOS_SYNC_REPOSITORY_TOKEN,
      useClass: TypeOrmCatalogosSyncAdapter,
    },
    {
      provide: MAESTROS_SYNC_REPOSITORY_TOKEN,
      useClass: TypeOrmMaestrosSyncAdapter,
    },
    {
      provide: CONFLICTOS_SYNC_REPOSITORY_TOKEN,
      useClass: TypeOrmConflictosSyncAdapter,
    },
  ],
  exports: [SyncService],
})
export class SyncModule { }
