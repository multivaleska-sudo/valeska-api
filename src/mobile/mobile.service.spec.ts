import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MobileTramitesService } from './mobile.service';

describe('MobileTramitesService', () => {
  const listQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    clone: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
  };
  const countQueryBuilder = {
    getCount: jest.fn(),
  };
  const detailQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const tramiteRepository = {
    createQueryBuilder: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn(() => tramiteRepository),
  } as unknown as DataSource;

  let service: MobileTramitesService;

  beforeEach(() => {
    jest.clearAllMocks();
    listQueryBuilder.clone.mockReturnValue(countQueryBuilder);
    countQueryBuilder.getCount.mockResolvedValue(25);
    service = new MobileTramitesService(dataSource);
  });

  it('returns paginated tramite rows with the exact mobile snake_case contract', async () => {
    tramiteRepository.createQueryBuilder.mockReturnValueOnce(listQueryBuilder);
    listQueryBuilder.getRawMany.mockResolvedValueOnce([
      {
        id: 'tramite-id',
        n_titulo: 'T-2026-100',
        cliente: 'Juan Perez',
        dni: '12345678',
        placa: 'ABC-123',
        tramite: 'INMATRICULACION',
        situacion: 'EN PROCESO',
        fecha_presentacion: '2026-07-05',
        empresa_gestiona: 'VALESKA',
        creador: 'Admin',
        motor: 'MOTOR123',
        chasis_vin: 'VIN123',
        timestamp: new Date('2026-07-05T00:00:00.000Z'),
      },
    ]);

    await expect(service.findAll({ page: 2, limit: 20 })).resolves.toEqual({
      data: [
        {
          id: 'tramite-id',
          n_titulo: 'T-2026-100',
          cliente: 'Juan Perez',
          dni: '12345678',
          placa: 'ABC-123',
          tramite: 'INMATRICULACION',
          situacion: 'EN PROCESO',
          fecha_presentacion: '2026-07-05',
          empresa_gestiona: 'VALESKA',
          creador: 'Admin',
          motor: 'MOTOR123',
          chasis_vin: 'VIN123',
          timestamp: 1783209600000,
        },
      ],
      total: 25,
    });
    expect(listQueryBuilder.select).toHaveBeenCalledWith([
      't.id AS id',
      't.n_titulo AS n_titulo',
      'c.razon_social_nombres AS cliente',
      'c.numero_documento AS dni',
      'v.placa AS placa',
      'v.motor AS motor',
      'v.chasis_vin AS chasis_vin',
      'ctt.nombre AS tramite',
      'cs.nombre AS situacion',
      't.fecha_presentacion AS fecha_presentacion',
      'eg.razon_social AS empresa_gestiona',
      'u.nombre_completo AS creador',
      't.updated_at AS timestamp',
    ]);
    expect(listQueryBuilder.skip).toHaveBeenCalledWith(20);
    expect(listQueryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('applies quick search across the fields required by the mobile app', async () => {
    tramiteRepository.createQueryBuilder.mockReturnValueOnce(listQueryBuilder);
    listQueryBuilder.getRawMany.mockResolvedValueOnce([]);

    await service.findAll({ page: 1, limit: 20, searchBusquedaRapida: 'abc' });

    expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('c.razon_social_nombres ILIKE :search'),
      { search: '%abc%' },
    );
    expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('v.chasis_vin ILIKE :search'),
      { search: '%abc%' },
    );
  });

  it('returns a flat tramite detail object compatible with TramiteDetail', async () => {
    tramiteRepository.createQueryBuilder.mockReturnValueOnce(detailQueryBuilder);
    detailQueryBuilder.getRawOne.mockResolvedValueOnce({
      id: 'tramite-id',
      tramite_anio: '2026',
      cliente: 'Juan Perez',
      telefono: '999888777',
      dni: '12345678',
      n_titulo: 'T-2026-100',
      tipo_tramite: 'INMATRICULACION',
      estado_tramite: 'EN PROCESO',
      observaciones: 'Sin novedades',
      fecha_presentacion: '2026-07-05',
      check_tarjeta_oficina: true,
      fecha_tarjeta_oficina: '2026-07-06',
      check_placa_oficina: false,
      fecha_placa_oficina: null,
      check_entrega_tarjeta: false,
      fecha_entrega_tarjeta: null,
      metodo_entrega_tarjeta: null,
      check_entrega_placa: false,
      fecha_entrega_placa: null,
      metodo_entrega_placa: null,
      codigo_verificacion: '12345',
      vehiculo_marca: 'TOYOTA',
      vehiculo_motor: 'MOTOR123',
      vehiculo_chasis: 'VIN123',
      vehiculo_anio: '2026',
      vehiculo_color: 'ROJO',
      vehiculo_carroceria: 'SEDAN',
      vehiculo_placa: 'ABC-123',
      vehiculo_modelo: 'YARIS',
      presentante_empresa: 'VALESKA',
      presentante_persona: 'Pedro Perez',
      tipo_boleta: 'Factura',
      numero_boleta: 'F001',
      fecha_boleta: '2026-07-01',
      dua: 'DUA123',
      num_formato_inmatriculacion: 'FI123',
      numero_recibo_tramite: 'R123',
      clausula_monto: '150.00',
      clausula_forma_pago: 'EFECTIVO',
      clausula_pago_bancarizado: 'NO',
      aclaracion_dice: null,
      aclaracion_debe_decir: null,
      fecha_impresion: '2026-07-05',
    });

    await expect(service.findOne('tramite-id')).resolves.toMatchObject({
      id: 'tramite-id',
      tramite_anio: '2026',
      cliente: 'Juan Perez',
      fecha_placa_oficina: '',
      metodo_entrega_tarjeta: '',
      vehiculo_chasis: 'VIN123',
      presentante_persona: 'Pedro Perez',
      aclaracion_dice: '',
    });
    expect(detailQueryBuilder.where).toHaveBeenCalledWith('t.id = :id', { id: 'tramite-id' });
  });

  it('throws NotFoundException when the tramite detail does not exist', async () => {
    tramiteRepository.createQueryBuilder.mockReturnValueOnce(detailQueryBuilder);
    detailQueryBuilder.getRawOne.mockResolvedValueOnce(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});
