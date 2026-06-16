import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

export interface SyncHealthSummary {
  generatedAt: string;
  orphanCounts: {
    tramitesSinDetalle: number;
    detallesSinTramite: number;
    tramitesSinCliente: number;
    tramitesSinVehiculo: number;
  };
  outbox: {
    byStatusAndEntity: Array<{
      entityName: string;
      status: string;
      count: number;
    }>;
    recentFailures: Array<{
      id: string;
      entityName: string;
      status: string;
      attempts: number;
      lastError: string | null;
      createdAt: string;
      failedAt: string | null;
    }>;
  };
  tramite?: {
    tramite: Record<string, unknown> | null;
    detalle: Record<string, unknown> | null;
    outboxJobs: Array<Record<string, unknown>>;
    openConflicts: Array<Record<string, unknown>>;
  };
}

@Injectable()
export class SyncHealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getHealthSummary(user: AuthenticatedUser, tramiteId?: string): Promise<SyncHealthSummary> {
    if (!['ADMIN', 'ADMIN_CENTRAL'].includes(user.rol)) {
      throw new ForbiddenException('Solo administradores pueden consultar la salud de sincronizacion');
    }

    const [orphanCounts] = await this.dataSource.query(`
      SELECT
        COUNT(*) FILTER (WHERE td.id IS NULL)::int AS "tramitesSinDetalle",
        COUNT(*) FILTER (WHERE c.id IS NULL)::int AS "tramitesSinCliente",
        COUNT(*) FILTER (WHERE v.id IS NULL)::int AS "tramitesSinVehiculo"
      FROM tramites t
      LEFT JOIN tramite_detalles td ON td.tramite_id::text = t.id::text AND td.deleted_at IS NULL
      LEFT JOIN clientes c ON c.id::text = t.cliente_id::text AND c.deleted_at IS NULL
      LEFT JOIN vehiculos v ON v.id::text = t.vehiculo_id::text AND v.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
    `);

    const [detallesSinTramite] = await this.dataSource.query(`
      SELECT COUNT(*)::int AS count
      FROM tramite_detalles td
      LEFT JOIN tramites t ON t.id::text = td.tramite_id::text AND t.deleted_at IS NULL
      WHERE td.deleted_at IS NULL AND t.id IS NULL
    `);

    const byStatusAndEntity = await this.dataSource.query(`
      SELECT
        entity_name AS "entityName",
        status,
        COUNT(*)::int AS count
      FROM sync_outbox_jobs
      GROUP BY entity_name, status
      ORDER BY entity_name ASC, status ASC
    `);

    const recentFailures = await this.dataSource.query(`
      SELECT
        id,
        entity_name AS "entityName",
        status,
        attempts,
        LEFT(last_error, 600) AS "lastError",
        created_at AS "createdAt",
        failed_at AS "failedAt"
      FROM sync_outbox_jobs
      WHERE status IN ('FAILED', 'DEAD_LETTER')
      ORDER BY COALESCE(failed_at, updated_at, created_at) DESC
      LIMIT 25
    `);

    const summary: SyncHealthSummary = {
      generatedAt: new Date().toISOString(),
      orphanCounts: {
        tramitesSinDetalle: Number(orphanCounts?.tramitesSinDetalle ?? 0),
        detallesSinTramite: Number(detallesSinTramite?.count ?? 0),
        tramitesSinCliente: Number(orphanCounts?.tramitesSinCliente ?? 0),
        tramitesSinVehiculo: Number(orphanCounts?.tramitesSinVehiculo ?? 0),
      },
      outbox: {
        byStatusAndEntity: byStatusAndEntity.map((row: any) => ({
          entityName: row.entityName,
          status: row.status,
          count: Number(row.count ?? 0),
        })),
        recentFailures: recentFailures.map((row: any) => ({
          id: row.id,
          entityName: row.entityName,
          status: row.status,
          attempts: Number(row.attempts ?? 0),
          lastError: row.lastError ?? null,
          createdAt: this.toIso(row.createdAt),
          failedAt: row.failedAt ? this.toIso(row.failedAt) : null,
        })),
      },
    };

    if (tramiteId) {
      const [tramite] = await this.dataSource.query(`
        SELECT id, version, base_version AS "baseVersion", updated_by_user_id AS "updatedByUserId",
               updated_by_device_mac AS "updatedByDeviceMac", updated_at AS "updatedAt", sync_status AS "syncStatus"
        FROM tramites
        WHERE id::text = $1
        LIMIT 1
      `, [tramiteId]);

      const [detalle] = await this.dataSource.query(`
        SELECT id, tramite_id AS "tramiteId", version, base_version AS "baseVersion",
               updated_by_user_id AS "updatedByUserId", updated_by_device_mac AS "updatedByDeviceMac",
               updated_at AS "updatedAt", sync_status AS "syncStatus"
        FROM tramite_detalles
        WHERE tramite_id::text = $1
        LIMIT 1
      `, [tramiteId]);

      const outboxJobs = await this.dataSource.query(`
        SELECT id, entity_name AS "entityName", status, attempts, conflict_count AS "conflictCount",
               created_at AS "createdAt", completed_at AS "completedAt", failed_at AS "failedAt", LEFT(last_error, 600) AS "lastError"
        FROM sync_outbox_jobs
        WHERE entity_name IN ('tramite', 'tramite_detalle')
          AND payload::text LIKE $1
        ORDER BY created_at DESC
        LIMIT 20
      `, [`%${tramiteId}%`]);

      const openConflicts = await this.dataSource.query(`
        SELECT id, tabla_afectada AS "tablaAfectada", registro_id AS "registroId",
               identificador_visual AS "identificadorVisual", fecha_conflicto AS "fechaConflicto"
        FROM sync_conflictos
        WHERE resuelto = false
          AND (registro_id = $1 OR datos_locales LIKE $2 OR datos_remotos LIKE $2)
        ORDER BY fecha_conflicto DESC
        LIMIT 20
      `, [tramiteId, `%${tramiteId}%`]);

      summary.tramite = {
        tramite: tramite ?? null,
        detalle: detalle ?? null,
        outboxJobs,
        openConflicts,
      };
    }

    return summary;
  }

  private toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
