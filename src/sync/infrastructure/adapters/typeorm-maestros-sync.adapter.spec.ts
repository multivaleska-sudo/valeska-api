import {
  CLIENTE_UPSERT_COLUMNS,
  EMPRESA_GESTORA_UPSERT_COLUMNS,
  MESSAGE_TEMPLATE_UPSERT_COLUMNS,
  PERFIL_GESTOR_UPSERT_COLUMNS,
  PLANTILLA_DOCUMENTO_UPSERT_COLUMNS,
  PRESENTANTE_UPSERT_COLUMNS,
  REPRESENTANTE_LEGAL_UPSERT_COLUMNS,
  VEHICULO_UPSERT_COLUMNS,
} from './typeorm-maestros-sync.adapter';

describe('TypeOrmMaestrosSyncAdapter upsert columns', () => {
  it.each([
    ['clientes', CLIENTE_UPSERT_COLUMNS],
    ['vehiculos', VEHICULO_UPSERT_COLUMNS],
    ['empresas_gestoras', EMPRESA_GESTORA_UPSERT_COLUMNS],
    ['plantillas_documentos', PLANTILLA_DOCUMENTO_UPSERT_COLUMNS],
    ['presentantes', PRESENTANTE_UPSERT_COLUMNS],
    ['representantes_legales', REPRESENTANTE_LEGAL_UPSERT_COLUMNS],
    ['perfiles_gestor', PERFIL_GESTOR_UPSERT_COLUMNS],
    ['message_templates', MESSAGE_TEMPLATE_UPSERT_COLUMNS],
  ])('persists soft deletes when updating existing %s', (_tableName, columns) => {
    expect(columns).toContain('deleted_at');
  });
});
