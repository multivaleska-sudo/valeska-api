import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('perfiles_gestor')
export class PerfilGestor {
    @PrimaryColumn('uuid') id!: string;

    @Column({ type: 'varchar', nullable: true })
    calidad!: string;

    @Column({ type: 'varchar', nullable: true })
    nombre!: string;

    @Column({ type: 'varchar', nullable: true })
    concesionario!: string;

    @Column({ type: 'varchar', nullable: true })
    importador!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}