import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './db/data-source';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { TramitesModule } from './tramites/tramites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot(dataSourceOptions),

    AuthModule,
    SyncModule,
    TramitesModule,
  ],
})
export class AppModule { }