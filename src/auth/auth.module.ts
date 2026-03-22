import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ResetCode } from './entities/reset-code.entity';

import { Usuario } from '../sync/entities/usuario.entity';
import { Dispositivo } from '../sync/entities/dispositivo.entity';
import { Sucursal } from '../sync/entities/sucursal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResetCode, Usuario, Dispositivo, Sucursal])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }