import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controlador raíz encargado de exponer métricas del sistema y probes de infraestructura.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * Endpoint de telemetría completa para auditorías SRE y monitoreo interno.
   * Si la base de datos está desconectada, retorna HTTP 503 Service Unavailable para Cloudflare.
   */
  @Get()
  async getSystemStatus() {
    const status = await this.appService.getSystemStatus();

    if (status.status === 'DEGRADED') {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }

  /**
   * Endpoint ligero de liveness probe para orquestadores tipo Kubernetes o AWS ECS.
   */
  @Get('health')
  async getLiveness() {
    const status = await this.appService.getSystemStatus();

    if (status.status === 'DEGRADED') {
      throw new ServiceUnavailableException({ status: 'UNHEALTHY' });
    }

    return { status: 'UP' };
  }
}