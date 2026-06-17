import {
  TRAMITE_DETALLE_UPSERT_COLUMNS,
  TRAMITE_UPSERT_COLUMNS,
} from './typeorm-tramites-sync.adapter';

describe('TypeOrmTramitesSyncAdapter upsert columns', () => {
  it('persists soft deletes when updating existing tramites', () => {
    expect(TRAMITE_UPSERT_COLUMNS).toContain('deleted_at');
  });

  it('persists soft deletes when updating existing tramite detalles', () => {
    expect(TRAMITE_DETALLE_UPSERT_COLUMNS).toContain('deleted_at');
  });
});
