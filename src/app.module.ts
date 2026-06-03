import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { TramitesModule } from './tramites/tramites.module';
import { dataSourceOptions } from './db/data-source';
import { Usuario } from './sync/entities/usuario.entity';
import { Dispositivo } from './sync/entities/dispositivo.entity';
import { Sucursal } from './sync/entities/sucursal.entity';
import { SyncConflicto } from './sync/entities/sync-conflict.entity';
import { Tramite, TramiteDetalle } from './tramites/entities/tramite.entity';
import { CatalogoTipoTramite, CatalogoSituacion } from './tramites/entities/catalogos.entity';
import {
  Cliente,
  Vehiculo,
  EmpresaGestora,
  PlantillaDocumento,
  Presentante,
  RepresentanteLegal
} from './tramites/entities/maestros.entity';
import { PerfilGestor } from './tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from './tramites/entities/plantillas.entity';

/**
 * Módulo raíz de la aplicación Valeska API.
 * Integra de forma cohesiva la configuración unificada de TypeORM de src/db/data-source.ts.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      entities: [
        Usuario,
        Dispositivo,
        Sucursal,
        SyncConflicto,
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
      ],
    }),

    AuthModule,
    SyncModule,
    TramitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }