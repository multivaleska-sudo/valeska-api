import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SEGURIDAD_SYNC_REPOSITORY_TOKEN } from './domain/ports/seguridad-sync-repository.interface';
import { CatalogosSyncService } from './services/catalogos-sync.service';
import { ConflictosSyncService } from './services/conflictos-sync.service';
import { MaestrosSyncService } from './services/maestros-sync.service';
import { SeguridadSyncService } from './services/seguridad-sync.service';
import { TramitesSyncService } from './services/tramites-sync.service';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let maestrosSyncMock: { push: jest.Mock };

  const seguridadRepoMock = {
    findOperatorById: jest.fn().mockResolvedValue({
      id: 'user-id',
      estaActivo: true,
      dispositivos: [{ macAddress: 'AA:BB', autorizado: true }],
    }),
  };

  beforeEach(async () => {
    maestrosSyncMock = {
      push: jest.fn().mockResolvedValue({
        conflictCount: 0,
        acceptedRecordIds: ['cliente-id'],
        conflictedRecordIds: [],
        conflictIds: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(async (callback) => callback({})),
          },
        },
        { provide: SEGURIDAD_SYNC_REPOSITORY_TOKEN, useValue: seguridadRepoMock },
        { provide: TramitesSyncService, useValue: { push: jest.fn(), pullTramites: jest.fn().mockResolvedValue([]), pullTramiteDetalles: jest.fn().mockResolvedValue([]) } },
        { provide: CatalogosSyncService, useValue: { push: jest.fn(), pullTiposTramite: jest.fn().mockResolvedValue([]), pullSituaciones: jest.fn().mockResolvedValue([]) } },
        { provide: MaestrosSyncService, useValue: { ...maestrosSyncMock, pullClientes: jest.fn().mockResolvedValue([]), pullVehiculos: jest.fn().mockResolvedValue([]), pullEmpresasGestoras: jest.fn().mockResolvedValue([]), pullPlantillas: jest.fn().mockResolvedValue([]), pullPresentantes: jest.fn().mockResolvedValue([]), pullRepresentantes: jest.fn().mockResolvedValue([]), pullPerfilesGestor: jest.fn().mockResolvedValue([]), pullMessageTemplates: jest.fn().mockResolvedValue([]) } },
        { provide: SeguridadSyncService, useValue: { push: jest.fn(), pullUsuarios: jest.fn().mockResolvedValue([]), pullDispositivos: jest.fn().mockResolvedValue([]), pullSucursales: jest.fn().mockResolvedValue([]) } },
        { provide: ConflictosSyncService, useValue: { push: jest.fn(), pullConflictos: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects push chunks without syncProtocolVersion 2', async () => {
    await expect(service.processPushChunkNow('user-id', 'AA:BB', {
      syncSessionId: '11111111-1111-4111-8111-111111111111',
      entityName: 'cliente',
      chunkIndex: 0,
      totalChunks: 1,
      records: [{ id: 'cliente-id' }],
    } as never)).rejects.toThrow('syncProtocolVersion 2');

    expect(maestrosSyncMock.push).not.toHaveBeenCalled();
  });

  it('returns accepted and conflicted record ids from a protocol v2 push', async () => {
    await expect(service.processPushChunkNow('user-id', 'AA:BB', {
      syncProtocolVersion: 2,
      syncSessionId: '11111111-1111-4111-8111-111111111111',
      entityName: 'cliente',
      chunkIndex: 0,
      totalChunks: 1,
      records: [{ id: 'cliente-id', baseVersion: 1 }],
    })).resolves.toMatchObject({
      success: true,
      conflictCount: 0,
      acceptedRecordIds: ['cliente-id'],
      conflictedRecordIds: [],
      conflictIds: [],
    });
  });
});
