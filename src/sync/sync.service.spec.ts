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

  const seguridadRepoMock = {
    findOperatorById: jest.fn().mockResolvedValue({
      id: 'user-id',
      estaActivo: true,
      dispositivos: [{ macAddress: 'AA:BB', autorizado: true }],
    }),
  };

  beforeEach(async () => {
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
        { provide: MaestrosSyncService, useValue: { push: jest.fn(), pullClientes: jest.fn().mockResolvedValue([]), pullVehiculos: jest.fn().mockResolvedValue([]), pullEmpresasGestoras: jest.fn().mockResolvedValue([]), pullPlantillas: jest.fn().mockResolvedValue([]), pullPresentantes: jest.fn().mockResolvedValue([]), pullRepresentantes: jest.fn().mockResolvedValue([]), pullPerfilesGestor: jest.fn().mockResolvedValue([]), pullMessageTemplates: jest.fn().mockResolvedValue([]) } },
        { provide: SeguridadSyncService, useValue: { push: jest.fn(), pullUsuarios: jest.fn().mockResolvedValue([]), pullDispositivos: jest.fn().mockResolvedValue([]), pullSucursales: jest.fn().mockResolvedValue([]) } },
        { provide: ConflictosSyncService, useValue: { push: jest.fn(), pullConflictos: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
