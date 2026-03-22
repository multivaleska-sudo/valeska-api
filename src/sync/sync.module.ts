import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { Sucursal } from './entities/sucursal.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal, Dispositivo, Usuario])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule { }