import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad real "PerfilGestor" de perfil-gestor.entity.ts.
 */
export class PerfilGestorSyncDto {
    @IsUUID('4', { message: 'El id de PerfilGestor debe ser un UUID v4 válido' })
    @IsOptional()
    readonly id!: string;

    @IsString({ message: 'El campo calidad debe ser una cadena de texto' })
    @IsOptional()
    readonly calidad?: string | null;

    @IsString({ message: 'El campo nombre debe ser una cadena de texto' })
    @IsOptional()
    readonly nombre?: string | null;

    @IsString({ message: 'El campo concesionario debe ser una cadena de texto' })
    @IsOptional()
    readonly concesionario?: string | null;

    @IsString({ message: 'El campo importador debe ser una cadena de texto' })
    @IsOptional()
    readonly importador?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser un formato de fecha ISO8601 válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string; // Por defecto 'SYNCED'
}