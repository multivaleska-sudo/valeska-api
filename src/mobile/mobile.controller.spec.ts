import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { MobileTramitesController } from './mobile.controller';
import { MobileTramitesService } from './mobile.service';

describe('MobileTramitesController', () => {
  let controller: MobileTramitesController;
  const mobileTramitesServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MobileTramitesController],
      providers: [
        { provide: MobileTramitesService, useValue: mobileTramitesServiceMock },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    controller = module.get(MobileTramitesController);
  });

  it('delegates paginated list queries to the mobile tramites service', async () => {
    mobileTramitesServiceMock.findAll.mockResolvedValueOnce({ data: [], total: 0 });

    await expect(controller.findAll({ page: 1, limit: 20 })).resolves.toEqual({ data: [], total: 0 });

    expect(mobileTramitesServiceMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('delegates detail queries to the mobile tramites service', async () => {
    mobileTramitesServiceMock.findOne.mockResolvedValueOnce({ id: 'tramite-id' });

    await expect(controller.findOne('tramite-id')).resolves.toEqual({ id: 'tramite-id' });

    expect(mobileTramitesServiceMock.findOne).toHaveBeenCalledWith('tramite-id');
  });
});
