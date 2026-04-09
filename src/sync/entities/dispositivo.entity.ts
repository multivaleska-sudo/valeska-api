import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Sucursal } from './sucursal.entity';

@Entity('dispositivos')
export class Dispositivo {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'mac_address', unique: true })
    macAddress!: string;

    @Column({ name: 'nombre_equipo' })
    nombreEquipo!: string;

    @Column({ default: false })
    autorizado!: boolean;

    @Column({ name: 'provision_id', nullable: true })
    provisionId!: string;

    @Column({ name: 'sucursal_id' })
    sucursalId!: string;

    @ManyToOne(() => Sucursal)
    @JoinColumn({ name: 'sucursal_id' })
    sucursal!: Sucursal;

    @Column({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt!: Date;

    @Column({ name: 'sync_status', default: 'LOCAL_INSERT' })
    syncStatus!: string;
}