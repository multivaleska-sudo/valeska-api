import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad real "Dispositivo" de dispositivo.entity.ts.
 * Incluye soporte para el requerimiento multidispositivo (usuarioId).
 */
export class DispositivoSyncDto {
    @IsUUID('4', { message: 'El id de Dispositivo debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString({ message: 'macAddress debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La dirección MAC es obligatoria para control de hardware' })
    readonly macAddress!: string;

    @IsString({ message: 'nombreEquipo debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre del equipo es obligatorio' })
    readonly nombreEquipo!: string;

    @IsBoolean({ message: 'El campo autorizado debe ser un valor booleano' })
    @IsOptional()
    readonly autorizado: boolean = false;

    @IsString()
    @IsOptional()
    readonly provisionId?: string | null;

    @IsUUID('4', { message: 'sucursalId debe ser un UUID v4 válido' })
    @IsNotEmpty({ message: 'El ID de la sucursal de origen es obligatorio' })
    readonly sucursalId!: string;

    @IsUUID('4', { message: 'El usuarioId asociado al dispositivo debe ser un UUID v4 válido' })
    @IsOptional()
    readonly usuarioId?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser un formato de fecha ISO8601 válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string; // Por defecto 'LOCAL_INSERT' o 'SYNCED'
}