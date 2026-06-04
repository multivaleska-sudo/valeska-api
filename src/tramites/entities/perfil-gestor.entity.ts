import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('perfiles_gestor')
@Index('perfiles_gestor_updated_at_id_idx', ['updatedAt', 'id'])
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
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}
