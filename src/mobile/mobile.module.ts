import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Tramite } from '../tramites/entities/tramite.entity';
import { MobileTramitesController } from './mobile.controller';
import { MobileTramitesService } from './mobile.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Tramite])],
  controllers: [MobileTramitesController],
  providers: [MobileTramitesService],
})
export class MobileModule {}
