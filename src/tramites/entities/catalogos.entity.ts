import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity('catalogo_tipos_tramite')
@Index('catalogo_tipos_tramite_updated_at_id_idx', ['updatedAt', 'id'])
export class CatalogoTipoTramite {
    @PrimaryColumn({ type: 'varchar', length: 50 }) id!: string;

    @Column() nombre!: string;
    @Column({ default: true }) activo!: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('catalogo_situaciones')
@Index('catalogo_situaciones_updated_at_id_idx', ['updatedAt', 'id'])
export class CatalogoSituacion {
    @PrimaryColumn({ type: 'varchar', length: 50 }) id!: string;

    @Column() nombre!: string;
    @Column({ name: 'color_hex', nullable: true, default: '#CCCCCC' }) colorHex!: string;
    @Column({ default: true }) activo!: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}
