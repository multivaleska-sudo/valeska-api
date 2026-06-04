import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ResetCode } from './entities/reset-code.entity';
import { Usuario } from '../sync/entities/usuario.entity';

describe('AuthService', () => {
  let service: AuthService;

  const repositoryMock = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: repositoryMock },
        { provide: getRepositoryToken(ResetCode), useValue: repositoryMock },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'token') } },
        { provide: ConfigService, useValue: { get: jest.fn((_: string, fallback?: string) => fallback ?? '10') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
