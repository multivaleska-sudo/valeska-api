import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * * DTO mapeado 1:1 con la entidad real SyncConflicto de tu base de datos.
 */
export class SyncConflictoSyncDto {
    @IsUUID('4', { message: 'El id de conflicto debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString()
    @IsNotEmpty({ message: 'La tabla afectada es obligatoria' })
    readonly tablaAfectada!: string;

    @IsString()
    @IsNotEmpty({ message: 'El registro ID afectado es obligatorio' })
    readonly registroId!: string;

    @IsString()
    @IsOptional()
    readonly identificadorVisual?: string | null;

    @IsString()
    @IsNotEmpty({ message: 'Los datos locales serializados son obligatorios' })
    readonly datosLocales!: string;

    @IsString()
    @IsNotEmpty({ message: 'Los datos remotos serializados son obligatorios' })
    readonly datosRemotos!: string;

    @IsBoolean({ message: 'El campo resuelto debe ser booleano' })
    @IsOptional()
    readonly resuelto: boolean = false;

    @IsDateString({}, { message: 'fechaConflicto debe ser un formato de fecha ISO válido' })
    readonly fechaConflicto!: string;
}