import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, Index } from 'typeorm';
import { RepresentanteLegal } from './maestros.entity';

@Entity('tramites')
@Index('tramites_updated_at_id_idx', ['updatedAt', 'id'])
export class Tramite {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'codigo_verificacion', nullable: true }) codigoVerificacion!: string;
    @Column({ name: 'tramite_anio' }) tramiteAnio!: string;

    @Column({ name: 'cliente_id' }) clienteId!: string;
    @Column({ name: 'vehiculo_id' }) vehiculoId!: string;
    @Column({ name: 'tipo_tramite_id' }) tipoTramiteId!: string;
    @Column({ name: 'situacion_id' }) situacionId!: string;
    @Column({ name: 'usuario_creador_id' }) usuarioCreadorId!: string;
    @Column({ name: 'sucursal_id' }) sucursalId!: string;

    @Column({ name: 'n_titulo', nullable: true }) nTitulo!: string;
    @Column({ name: 'n_formato', nullable: true }) nFormato!: string;
    @Column({ name: 'fecha_presentacion' }) fechaPresentacion!: string;
    @Column({ name: 'observaciones_generales', type: 'text', nullable: true }) observacionesGenerales!: string;

    @Column({ name: 'tarjeta_en_oficina', default: false }) tarjetaEnOficina!: boolean;
    @Column({ name: 'fecha_tarjeta_en_oficina', nullable: true }) fechaTarjetaEnOficina!: string;

    @Column({ name: 'placa_en_oficina', default: false }) placaEnOficina!: boolean;
    @Column({ name: 'fecha_placa_en_oficina', nullable: true }) fechaPlacaEnOficina!: string;

    @Column({ name: 'entrego_tarjeta', default: false }) entregoTarjeta!: boolean;
    @Column({ name: 'fecha_entrega_tarjeta', nullable: true }) fechaEntregaTarjeta!: string;
    @Column({ name: 'metodo_entrega_tarjeta', nullable: true }) metodoEntregaTarjeta!: string;

    @Column({ name: 'entrego_placa', default: false }) entregoPlaca!: boolean;
    @Column({ name: 'fecha_entrega_placa', nullable: true }) fechaEntregaPlaca!: string;
    @Column({ name: 'metodo_entrega_placa', nullable: true }) metodoEntregaPlaca!: string;

    @Column({ name: 'observacion_placa', type: 'text', nullable: true }) observacionPlaca!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}

@Entity('tramite_detalles')
@Index('tramite_detalles_updated_at_id_idx', ['updatedAt', 'id'])
export class TramiteDetalle {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'tramite_id', unique: true }) tramiteId!: string;

    @Column({ name: 'empresa_gestora_id', nullable: true })
    empresaGestoraId!: string;

    @ManyToOne(() => RepresentanteLegal, { nullable: true })
    @JoinColumn({ name: 'representante_legal_id' })
    representanteLegal!: RepresentanteLegal;

    @Column({ name: 'representante_legal_id', nullable: true })
    representanteLegalId!: string;

    @Column({ name: 'presentante_id', nullable: true })
    presentanteId!: string;

    @Column({ name: 'tipo_boleta', nullable: true }) tipoBoleta!: string;
    @Column({ name: 'numero_boleta', nullable: true }) numeroBoleta!: string;
    @Column({ name: 'fecha_boleta', nullable: true }) fechaBoleta!: string;
    @Column({ nullable: true }) dua!: string;
    @Column({ name: 'num_formato_inmatriculacion', nullable: true }) numFormatoInmatriculacion!: string;
    @Column({ name: 'numero_recibo_tramite', nullable: true }) numeroReciboTramite!: string;

    @Column({ name: 'clausula_monto', type: 'real', nullable: true }) clausulaMonto!: number;
    @Column({ name: 'clausula_forma_pago', nullable: true }) clausulaFormaPago!: string;
    @Column({ name: 'clausula_pago_bancarizado', nullable: true }) clausulaPagoBancarizado!: string;
    @Column({ name: 'aclaracion_dice', type: 'text', nullable: true }) aclaracionDice!: string;
    @Column({ name: 'aclaracion_debe_decir', type: 'text', nullable: true }) aclaracionDebeDecir!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}
