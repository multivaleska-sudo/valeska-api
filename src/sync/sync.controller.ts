import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PullSyncQueryDto } from './infrastructure/http/dtos/queries/pull-sync-query.dto';
import { SyncStateQueryDto } from './infrastructure/http/dtos/queries/sync-state-query.dto';
import { PushSyncChunkDto, PushSyncBatchDto } from './infrastructure/http/dtos/common/base-chunk.dto';
import { SreTraceInterceptor } from './infrastructure/http/interceptors/sre-trace.interceptor';
import { SyncService } from './sync.service';
import { SyncPushProducerService } from './services/sync-push-producer.service';
import { SyncHealthService } from './services/sync-health.service';

import { ResolveSyncConflictDto } from './infrastructure/http/dtos/conflicts/resolve-sync-conflict.dto';
import { SyncConflictResolutionService } from './services/sync-conflict-resolution.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('sync')
@UseGuards(JwtAuthGuard)
@UseInterceptors(SreTraceInterceptor)
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly syncPushProducer: SyncPushProducerService,
    private readonly syncHealthService: SyncHealthService,
    private readonly conflictResolution: SyncConflictResolutionService,
  ) { }

  @Post('conflicts/:conflictId/resolve')
  async resolveConflict(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-mac') macAddress: string,
    @Param('conflictId') conflictId: string,
    @Body() body: ResolveSyncConflictDto,
  ) {
    if (!macAddress) {
      throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la resolucion.');
    }
    return this.conflictResolution.resolve(request.user.sub, macAddress, conflictId, body);
  }

  @Post('push')
  @HttpCode(HttpStatus.ACCEPTED)
  async push(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-mac') macAddress: string,
    @Body() body: PushSyncChunkDto,
  ) {
    if (!macAddress) {
      throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la sincronizacion.');
    }

    return this.syncPushProducer.enqueue(request.user.sub, macAddress, body);
  }

  @Post('push/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  async pushBatch(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-mac') macAddress: string,
    @Body() body: PushSyncBatchDto,
  ) {
    if (!macAddress) {
      throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la sincronizacion.');
    }

    return this.syncPushProducer.enqueueBatch(request.user.sub, macAddress, body);
  }

  @Get('state')
  async state(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-mac') macAddress: string,
    @Query() query: SyncStateQueryDto,
  ) {
    if (!macAddress) {
      throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la descarga de datos.');
    }

    const entities = query.entities.split(',').map(e => e.trim());
    return this.syncService.getSyncState(request.user.sub, macAddress, entities);
  }

  @Get('pull')
  async pull(
    @Req() request: AuthenticatedRequest,
    @Headers('x-device-mac') macAddress: string,
    @Query() query: PullSyncQueryDto,
  ) {
    if (!macAddress) {
      throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la descarga de datos.');
    }

    return this.syncService.processPullSync(request.user.sub, macAddress, query);
  }

  @Get('push-status/:outboxId')
  async pushStatus(
    @Req() request: AuthenticatedRequest,
    @Param('outboxId') outboxId: string,
  ) {
    return this.syncPushProducer.getStatus(outboxId, request.user);
  }

  @Get('health')
  async health(
    @Req() request: AuthenticatedRequest,
    @Query('tramiteId') tramiteId?: string,
  ) {
    return this.syncHealthService.getHealthSummary(request.user, tramiteId);
  }
}