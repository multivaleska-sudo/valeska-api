import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { ObservabilityService } from './observability.service';
import { PrometheusHttpInterceptor } from './prometheus-http.interceptor';

@Module({
  controllers: [MetricsController],
  providers: [
    ObservabilityService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusHttpInterceptor,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
