import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('sucursales')
@Index('sucursales_updated_at_id_idx', ['updatedAt', 'id'])
export class Sucursal {
    @PrimaryColumn('uuid')
    id!: string;

    @Column()
    nombre!: string;

    @Column({ type: 'varchar', nullable: true })
    codigo!: string | null;

    @Column({ type: 'varchar', nullable: true })
    direccion!: string | null;

    @Column({ name: 'es_central', default: false })
    esCentral!: boolean;

    @Column({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt!: Date | null;

    @Column({ name: 'sync_status', default: 'LOCAL_INSERT' })
    syncStatus!: string;
}
