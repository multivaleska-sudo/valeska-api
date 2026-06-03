import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as os from 'os';

/**
 * Servicio raíz encargado de recolectar telemetría y salud de la infraestructura en caliente.
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) { }

  /**
   * Realiza un diagnóstico del estado transaccional y la telemetría del sistema operativo.
   */
  async getSystemStatus() {
    let dbStatus = 'CONNECTED';

    try {
      await this.dataSource.query('SELECT 1');
    } catch (error: any) {
      this.logger.error(`🚨 [DATABASE UNHEALTHY] Heartbeat fallido en PostgreSQL: ${error.message}`);
      dbStatus = 'DISCONNECTED';
    }

    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      version: '1.0.0-hexagonal',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
        },
        synchronizer: {
          status: 'ACTIVE',
          protocol: 'Cursor-Based Polimorphic Chunks',
        },
      },
      telemetry: {
        uptime: this.formatUptime(uptimeSeconds),
        nodeVersion: process.version,
        platform: process.platform,
        cpuLoadAvg: os.loadavg(),
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        },
      },
    };
  }

  /**
   * Formatea los segundos de uptime en una cadena de texto legible.
   */
  private formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  }
}