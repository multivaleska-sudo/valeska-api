import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SreTraceInterceptor } from '../sync/infrastructure/http/interceptors/sre-trace.interceptor';
import { MobileTramitesQueryDto } from './dto/mobile-tramites-query.dto';
import { MobileTramitesService } from './mobile.service';

@Controller('mobile/tramites')
@UseGuards(JwtAuthGuard)
@UseInterceptors(SreTraceInterceptor)
export class MobileTramitesController {
  constructor(private readonly mobileTramitesService: MobileTramitesService) {}

  @Get()
  findAll(@Query() query: MobileTramitesQueryDto) {
    return this.mobileTramitesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mobileTramitesService.findOne(id);
  }
}
