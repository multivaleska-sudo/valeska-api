import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncPushProducerService } from './services/sync-push-producer.service';
import { SyncHealthService } from './services/sync-health.service';
import { ImportExcelService } from '../tramites/services/import-excel.service';
import { SyncConflictResolutionService } from './services/sync-conflict-resolution.service';

describe('SyncController', () => {
  let controller: SyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: {
            processPushSync: jest.fn(),
            processPullSync: jest.fn(),
          },
        },
        {
          provide: SyncPushProducerService,
          useValue: {
            enqueue: jest.fn(),
            enqueueBatch: jest.fn(),
            getStatus: jest.fn(),
          },
        },
        {
          provide: SyncHealthService,
          useValue: {
            getHealthSummary: jest.fn(),
          },
        },
        {
          provide: SyncConflictResolutionService,
          useValue: {
            resolve: jest.fn(),
          },
        },
        {
          provide: ImportExcelService,
          useValue: {
            checkMaintenanceMode: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
