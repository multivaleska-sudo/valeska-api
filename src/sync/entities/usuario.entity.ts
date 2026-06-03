import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Dispositivo } from './dispositivo.entity';

@Entity('usuarios')
export class Usuario {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ name: 'password_hash' })
    passwordHash!: string;

    @Column({ default: 'OPERADOR' })
    rol!: string;

    @Column({ name: 'nombre_completo' })
    nombreCompleto!: string;

    @Column({ name: 'esta_activo', default: true })
    estaActivo!: boolean;

    @Column({ name: 'dispositivo_id', nullable: true })
    dispositivoId!: string | null;

    @ManyToOne(() => Dispositivo, { nullable: true })
    @JoinColumn({ name: 'dispositivo_id' })
    dispositivo!: Dispositivo | null;

    @OneToMany(() => Dispositivo, (dispositivo) => dispositivo.usuario)
    dispositivos!: Dispositivo[];

    @Column({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt!: Date;

    @Column({ name: 'sync_status', default: 'LOCAL_INSERT' })
    syncStatus!: string;
}