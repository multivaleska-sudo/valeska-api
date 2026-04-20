import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('clientes')
export class Cliente {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'tipo_documento' }) tipoDocumento!: string;
    @Column({ name: 'numero_documento', unique: true }) numeroDocumento!: string;
    @Column({ name: 'razon_social_nombres' }) razonSocialNombres!: string;
    @Column({ name: 'estado_civil', nullable: true, default: 'SOLTERO(A)' }) estadoCivil!: string;
    @Column({ nullable: true }) domicilio!: string;
    @Column({ nullable: true }) telefono!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('vehiculos')
export class Vehiculo {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'chasis_vin', unique: true }) chasisVin!: string;
    @Column({ nullable: true }) placa!: string;
    @Column({ nullable: true }) motor!: string;
    @Column() marca!: string;
    @Column({ nullable: true }) modelo!: string;
    @Column({ nullable: true }) color!: string;
    @Column({ nullable: true, default: 'L3 - B' }) categoria!: string;
    @Column({ name: 'anio_fabricacion', nullable: true }) anioFabricacion!: string;
    @Column({ name: 'anio_modelo', nullable: true }) anioModelo!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('empresas_gestoras')
export class EmpresaGestora {
    @PrimaryColumn('uuid') id!: string;
    @Column({ unique: true, nullable: true }) ruc!: string;
    @Column({ name: 'razon_social' }) razonSocial!: string;
    @Column({ nullable: true }) direccion!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('plantillas_documentos')
export class PlantillaDocumento {
    @PrimaryColumn({ type: 'varchar', length: 50 }) id!: string;
    @Column({ name: 'nombre_documento', unique: true }) nombreDocumento!: string;
    @Column({ name: 'contenido_html', type: 'text' }) contenidoHtml!: string;
    @Column({ name: 'orientacion_papel', default: 'PORTRAIT' }) orientacionPapel!: string;
    @Column({ default: true }) activo!: boolean;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('presentantes')
export class Presentante {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'partida_registral', nullable: true }) partidaRegistral!: string;
    @Column({ name: 'oficina_registral', nullable: true }) oficinaRegistral!: string;
    @Column({ nullable: true }) domicilio!: string;
    @Column({ unique: true }) dni!: string;
    @Column({ name: 'primer_apellido' }) primerApellido!: string;
    @Column({ name: 'segundo_apellido', nullable: true }) segundoApellido!: string;
    @Column() nombres!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}