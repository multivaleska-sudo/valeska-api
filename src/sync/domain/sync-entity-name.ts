export const SYNC_ENTITY_NAMES = [
  'tramite',
  'tramite_detalle',
  'catalogo_tipo_tramite',
  'catalogo_situacion',
  'cliente',
  'vehiculo',
  'empresa_gestora',
  'plantilla_documento',
  'presentante',
  'representante_legal',
  'perfil_gestor',
  'message_template',
  'usuario',
  'dispositivo',
  'sucursal',
  'sync_conflicto',
] as const;

export type SyncEntityName = (typeof SYNC_ENTITY_NAMES)[number];

export function isSyncEntityName(value: string): value is SyncEntityName {
  return (SYNC_ENTITY_NAMES as readonly string[]).includes(value);
}
