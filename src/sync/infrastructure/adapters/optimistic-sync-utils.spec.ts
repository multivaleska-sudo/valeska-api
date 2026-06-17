import { splitOptimisticConflicts } from './optimistic-sync-utils';

describe('splitOptimisticConflicts', () => {
  const insertMock = jest.fn();
  const queryBuilderMock = {
    withDeleted: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const managerMock = {
    getRepository: jest.fn(() => ({
      createQueryBuilder: jest.fn(() => queryBuilderMock),
    })),
    insert: insertMock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a conflict and rejects an unsafe existing record with baseVersion zero', async () => {
    queryBuilderMock.getMany.mockResolvedValueOnce([
      {
        id: 'cliente-id',
        version: 3,
        updatedByDeviceMac: 'AA:BB',
        numeroDocumento: '12345678',
      },
    ]);

    const result = await splitOptimisticConflicts(
      managerMock as never,
      class Cliente {},
      'clientes',
      [
        {
          id: 'cliente-id',
          version: 1,
          baseVersion: 0,
          updatedByDeviceMac: 'CC:DD',
        },
      ],
      (record) => String(record.id),
    );

    expect(result.accepted).toEqual([]);
    expect(result.result).toMatchObject({
      conflictCount: 1,
      acceptedRecordIds: [],
      conflictedRecordIds: ['cliente-id'],
    });
    expect(result.result.conflictIds).toHaveLength(1);
    expect(queryBuilderMock.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(insertMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.objectContaining({
          id: result.result.conflictIds[0],
          tablaAfectada: 'clientes',
          registroId: 'cliente-id',
          resuelto: false,
        }),
      ]),
    );
  });

  it('accepts a record whose baseVersion matches the locked server version', async () => {
    queryBuilderMock.getMany.mockResolvedValueOnce([
      {
        id: 'tramite-id',
        version: 2,
        updatedByDeviceMac: 'AA:BB',
      },
    ]);

    const result = await splitOptimisticConflicts(
      managerMock as never,
      class Tramite {},
      'tramites',
      [
        {
          id: 'tramite-id',
          version: 2,
          baseVersion: 2,
          updatedByDeviceMac: 'CC:DD',
        },
      ],
      (record) => String(record.id),
    );

    expect(result.accepted).toEqual([
      expect.objectContaining({
        id: 'tramite-id',
        version: 3,
        baseVersion: 2,
      }),
    ]);
    expect(result.result).toMatchObject({
      conflictCount: 0,
      acceptedRecordIds: ['tramite-id'],
      conflictedRecordIds: [],
      conflictIds: [],
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.objectContaining({
          entityName: 'tramites',
          recordId: 'tramite-id',
          operation: 'UPDATE',
        }),
      ]),
    );
  });
});
