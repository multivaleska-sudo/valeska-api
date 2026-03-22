import { Controller, Post, Get, Body, Headers, Query, UnauthorizedException } from '@nestjs/common'; 
import { SyncService } from './sync.service';

@Controller('api/sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post('push')
    async pushData(
        @Headers('x-user-id') userId: string,
        @Body() payload: any
    ) {
        if (!userId) {
            throw new UnauthorizedException('Falta el identificador de usuario.');
        }
        return this.syncService.processPushSync(userId, payload);
    }

    @Get('pull')
    async pullData(
        @Headers('x-user-id') userId: string,
        @Query('lastSync') lastSync: string
    ) {
        if (!userId) throw new UnauthorizedException('Falta el identificador de usuario.');
        return this.syncService.processPullSync(userId, lastSync);
    }
}