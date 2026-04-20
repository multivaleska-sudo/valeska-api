import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('message_templates')
export class MessageTemplate {
    @PrimaryColumn('uuid') id!: string;
    @Column({ name: 'name', unique: true }) name!: string;
    @Column({ name: 'content', type: 'text' }) content!: string;

    @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
    @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date;
    @Column({ name: 'sync_status', default: 'SYNCED' }) syncStatus!: string;
}