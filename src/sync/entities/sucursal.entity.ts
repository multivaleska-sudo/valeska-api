import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sucursales')
export class Sucursal {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ name: 'es_central', default: false })
    esCentral: boolean;

    @Column({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;

    @Column({ name: 'sync_status', default: 'LOCAL_INSERT' })
    syncStatus: string;
}