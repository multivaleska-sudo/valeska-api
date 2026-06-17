import {
  DISPOSITIVO_UPSERT_COLUMNS,
  SUCURSAL_UPSERT_COLUMNS,
  USUARIO_UPSERT_COLUMNS,
} from './typeorm-seguridad-sync.adapter';

describe('TypeOrmSeguridadSyncAdapter upsert columns', () => {
  it.each([
    ['usuarios', USUARIO_UPSERT_COLUMNS],
    ['dispositivos', DISPOSITIVO_UPSERT_COLUMNS],
    ['sucursales', SUCURSAL_UPSERT_COLUMNS],
  ])('persists soft deletes when updating existing %s', (_tableName, columns) => {
    expect(columns).toContain('deleted_at');
  });
});
