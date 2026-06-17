import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('sync_conflictos')
@Index('conflicto_resuelto_idx', ['resuelto'])
@Index('conflicto_registro_idx', ['registroId'])
@Index('sync_conflictos_fecha_id_idx', ['fechaConflicto', 'id'])
export class SyncConflicto {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'tabla_afectada', type: 'varchar' })
    tablaAfectada!: string;

    @Column({ name: 'registro_id', type: 'varchar' })
    registroId!: string;

    @Column({ name: 'identificador_visual', type: 'varchar', nullable: true })
    identificadorVisual!: string | null;

    @Column({ name: 'datos_locales', type: 'text' })
    datosLocales!: string;

    @Column({ name: 'datos_remotos', type: 'text' })
    datosRemotos!: string;

    @Column({ type: 'boolean', default: false })
    resuelto!: boolean;

    @Column({ name: 'fecha_conflicto', type: 'timestamp' })
    fechaConflicto!: Date;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt!: Date | null;

    @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
    resolvedByUserId!: string | null;

    @Column({ name: 'resolved_by_device_mac', type: 'varchar', nullable: true })
    resolvedByDeviceMac!: string | null;

    @Column({ name: 'resolution_strategy', type: 'varchar', nullable: true })
    resolutionStrategy!: string | null;

    @Column({ name: 'resolution_payload', type: 'jsonb', nullable: true })
    resolutionPayload!: Record<string, any> | null;

    @Column({ name: 'resolution_note', type: 'text', nullable: true })
    resolutionNote!: string | null;
}