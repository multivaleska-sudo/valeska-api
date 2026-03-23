import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('catalogo_tipos_tramite')
export class CatalogoTipoTramite {
    @PrimaryColumn('uuid') id: string;
    @Column() nombre: string;
    @Column({ default: true }) activo: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus: string;
}

@Entity('catalogo_situaciones')
export class CatalogoSituacion {
    @PrimaryColumn('uuid') id: string;
    @Column() nombre: string;
    @Column({ name: 'color_hex', nullable: true, default: '#CCCCCC' }) colorHex: string;
    @Column({ default: true }) activo: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus: string;
}