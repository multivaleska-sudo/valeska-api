import {
  CATALOGO_SITUACION_UPSERT_COLUMNS,
  CATALOGO_TIPO_TRAMITE_UPSERT_COLUMNS,
} from './typeorm-catalogos-sync.adapter';

describe('TypeOrmCatalogosSyncAdapter upsert columns', () => {
  it.each([
    ['catalogo_tipos_tramite', CATALOGO_TIPO_TRAMITE_UPSERT_COLUMNS],
    ['catalogo_situaciones', CATALOGO_SITUACION_UPSERT_COLUMNS],
  ])('persists soft deletes when updating existing %s', (_tableName, columns) => {
    expect(columns).toContain('deleted_at');
  });
});
