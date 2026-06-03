import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ResetCode } from './entities/reset-code.entity';
import { ConfigService } from '@nestjs/config';
import { Usuario } from '../sync/entities/usuario.entity';
import { Dispositivo } from '../sync/entities/dispositivo.entity';
import { Sucursal } from '../sync/entities/sucursal.entity';
import { config } from 'dotenv';

config();

@Module({
  imports: [
    TypeOrmModule.forFeature([ResetCode, Usuario, Dispositivo, Sucursal]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(config.get<string>('JWT_EXPIRES_IN', '3600'), 10)
        },
      }),
    })
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }