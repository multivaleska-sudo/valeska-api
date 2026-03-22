import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ResetCode } from './auth/entities/reset-code.entity';
import { SyncModule } from './sync/sync.module';
import { Sucursal } from './sync/entities/sucursal.entity';
import { Dispositivo } from './sync/entities/dispositivo.entity';
import { Usuario } from './sync/entities/usuario.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [ResetCode, Sucursal, Dispositivo, Usuario],
      synchronize: true,
    }),
    AuthModule,
    SyncModule,
  ],
})
export class AppModule { }