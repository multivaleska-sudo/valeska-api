import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('clientes')
@Index('clientes_updated_at_id_idx', ['updatedAt', 'id'])
export class Cliente {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'tipo_documento' }) tipoDocumento!: string;
    @Column({ name: 'numero_documento', unique: true, nullable: true }) numeroDocumento!: string;
    @Column({ name: 'razon_social_nombres', nullable: true }) razonSocialNombres!: string;
    @Column({ name: 'estado_civil', nullable: true, default: 'SOLTERO(A)' }) estadoCivil!: string;
    @Column({ nullable: true }) domicilio!: string;
    @Column({ nullable: true }) telefono!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
    @Column({ type: 'int', default: 1 }) version!: number;
    @Column({ name: 'base_version', type: 'int', default: 0 }) baseVersion!: number;
    @Column({ name: 'updated_by_user_id', type: 'uuid', nullable: true }) updatedByUserId!: string | null;
    @Column({ name: 'updated_by_device_mac', type: 'varchar', nullable: true }) updatedByDeviceMac!: string | null;
}

@Entity('vehiculos')
@Index('vehiculos_updated_at_id_idx', ['updatedAt', 'id'])
export class Vehiculo {
    @PrimaryColumn('uuid') id!: string;

    @Column({ name: 'chasis_vin', nullable: true }) chasisVin!: string;
    @Column({ nullable: true }) placa!: string;
    @Column({ nullable: true }) motor!: string;
    @Column({ nullable: true }) marca!: string;
    @Column({ nullable: true }) modelo!: string;
    @Column({ nullable: true }) color!: string;
    @Column({ nullable: true }) carroceria!: string;
    @Column({ nullable: true, default: 'L3 - B' }) categoria!: string;
    @Column({ name: 'anio_fabricacion', nullable: true }) anioFabricacion!: string;
    @Column({ name: 'anio_modelo', nullable: true }) anioModelo!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
    @Column({ type: 'int', default: 1 }) version!: number;
    @Column({ name: 'base_version', type: 'int', default: 0 }) baseVersion!: number;
    @Column({ name: 'updated_by_user_id', type: 'uuid', nullable: true }) updatedByUserId!: string | null;
    @Column({ name: 'updated_by_device_mac', type: 'varchar', nullable: true }) updatedByDeviceMac!: string | null;
}

@Entity('empresas_gestoras')
@Index('empresas_gestoras_updated_at_id_idx', ['updatedAt', 'id'])
export class EmpresaGestora {
    @PrimaryColumn('uuid') id!: string;
    @Column({ nullable: true }) ruc!: string;
    @Column({ name: 'razon_social' }) razonSocial!: string;
    @Column({ nullable: true }) direccion!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('plantillas_documentos')
@Index('plantillas_documentos_updated_at_id_idx', ['updatedAt', 'id'])
export class PlantillaDocumento {
    @PrimaryColumn({ type: 'varchar', length: 50 }) id!: string;
    @Column({ name: 'nombre_documento', unique: true }) nombreDocumento!: string;
    @Column({ name: 'contenido_html', type: 'text' }) contenidoHtml!: string;
    @Column({ name: 'orientacion_papel', default: 'PORTRAIT' }) orientacionPapel!: string;
    @Column({ default: true }) activo!: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('presentantes')
@Index('presentantes_updated_at_id_idx', ['updatedAt', 'id'])
export class Presentante {
    @PrimaryColumn('uuid') id!: string;

    @Column({ nullable: true }) dni!: string;
    @Column({ nullable: true }) nombres!: string;
    @Column({ name: 'primer_apellido', nullable: true }) primerApellido!: string;
    @Column({ name: 'segundo_apellido', nullable: true }) segundoApellido!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('representantes_legales')
@Index('representantes_legales_updated_at_id_idx', ['updatedAt', 'id'])
export class RepresentanteLegal {
    @PrimaryColumn('uuid') id!: string;

    @Column({ name: 'empresa_gestora_id' })
    empresaGestoraId!: string;

    @ManyToOne(() => EmpresaGestora)
    @JoinColumn({ name: 'empresa_gestora_id' })
    empresaGestora!: EmpresaGestora;

    @Column({ nullable: true }) dni!: string;
    @Column({ nullable: true }) nombres!: string;
    @Column({ name: 'primer_apellido', nullable: true }) primerApellido!: string;
    @Column({ name: 'segundo_apellido', nullable: true }) segundoApellido!: string;
    @Column({ name: 'partida_registral', nullable: true }) partidaRegistral!: string;
    @Column({ name: 'oficina_registral', nullable: true }) oficinaRegistral!: string;
    @Column({ nullable: true }) domicilio!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}
