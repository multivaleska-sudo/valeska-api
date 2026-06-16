import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SyncHealthService } from './sync-health.service';

describe('SyncHealthService', () => {
  const queryMock = jest.fn();
  let service: SyncHealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SyncHealthService({ query: queryMock } as unknown as DataSource);
  });

  it('returns sync health summary for ADMIN_CENTRAL', async () => {
    queryMock
      .mockResolvedValueOnce([{ tramitesSinDetalle: 12, tramitesSinCliente: 0, tramitesSinVehiculo: 0 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ entityName: 'cliente', status: 'DEAD_LETTER', count: 25 }])
      .mockResolvedValueOnce([{
        id: 'outbox-id',
        entityName: 'cliente',
        status: 'DEAD_LETTER',
        attempts: 5,
        lastError: 'column excluded.tipoDocumento does not exist',
        createdAt: new Date('2026-06-16T10:00:00.000Z'),
        failedAt: null,
      }]);

    await expect(service.getHealthSummary({
      sub: 'admin-id',
      username: 'admin@valeska.local',
      rol: 'ADMIN_CENTRAL',
    })).resolves.toMatchObject({
      orphanCounts: {
        tramitesSinDetalle: 12,
        detallesSinTramite: 1,
        tramitesSinCliente: 0,
        tramitesSinVehiculo: 0,
      },
      outbox: {
        byStatusAndEntity: [{ entityName: 'cliente', status: 'DEAD_LETTER', count: 25 }],
        recentFailures: [{ id: 'outbox-id', entityName: 'cliente', status: 'DEAD_LETTER' }],
      },
    });
  });

  it('rejects non-admin users', async () => {
    await expect(service.getHealthSummary({
      sub: 'operator-id',
      username: 'operador@valeska.local',
      rol: 'OPERADOR',
    })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
