import { IsUUID, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad real "MessageTemplate" de plantillas.entity.ts.
 */
export class MessageTemplateSyncDto {
    @IsUUID('4', { message: 'El id de MessageTemplate debe ser un UUID v4 válido' })
    @IsNotEmpty({ message: 'El id es obligatorio' })
    readonly id!: string;

    @IsString({ message: 'El nombre de la plantilla debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre de la plantilla (name) es obligatorio' })
    readonly name!: string;

    @IsString({ message: 'El contenido de la plantilla debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El contenido de la plantilla (content) es obligatorio' })
    readonly content!: string;

    @IsDateString({}, { message: 'updatedAt debe ser un formato de fecha ISO8601 válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string; // Por defecto 'SYNCED'
}