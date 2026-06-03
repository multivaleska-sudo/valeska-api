import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
    BadRequestException,
    UseInterceptors,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { PushSyncChunkDto } from './infrastructure/http/dtos/common/base-chunk.dto';
import { PullSyncQueryDto } from './infrastructure/http/dtos/queries/pull-sync-query.dto';
import { SreTraceInterceptor } from './infrastructure/http/interceptors/sre-trace.interceptor';

/**
 * Controlador de sincronización optimizado para alto rendimiento y seguridad de red.
 * - Validación estricta con DTOs en el perímetro de entrada.
 * - Interceptor SRE para auditoría de latencia y tracing.
 * - Extracción y validación obligatoria de cabeceras de hardware y usuario.
 */
@Controller('sync')
@UseInterceptors(SreTraceInterceptor)
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    /**
     * Recibe y procesa de forma asíncrona un lote fragmentado de registros (Push Chunk).
     */
    @Post('push')
    @HttpCode(HttpStatus.ACCEPTED)
    async push(
        @Headers('x-user-id') userId: string,
        @Headers('x-device-mac') macAddress: string,
        @Body() body: PushSyncChunkDto,
    ) {
        if (!userId) {
            throw new BadRequestException('Cabecera "x-user-id" es mandatoria para autorizar la sincronización.');
        }
        if (!macAddress) {
            throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la sincronización.');
        }

        return this.syncService.processPushSync(userId, macAddress, body);
    }

    /**
     * Descarga de forma elástica y segura datos modificados (Pull Cursor-Based).
     */
    @Get('pull')
    async pull(
        @Headers('x-user-id') userId: string,
        @Headers('x-device-mac') macAddress: string,
        @Query() query: PullSyncQueryDto,
    ) {
        if (!userId) {
            throw new BadRequestException('Cabecera "x-user-id" es mandatoria para autorizar la descarga de datos.');
        }
        if (!macAddress) {
            throw new BadRequestException('Cabecera "x-device-mac" es mandatoria para autorizar la descarga de datos.');
        }

        return this.syncService.processPullSync(userId, macAddress, query);
    }
}