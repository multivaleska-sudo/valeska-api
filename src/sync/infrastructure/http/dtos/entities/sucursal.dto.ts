import { IsUUID, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad "Sucursal" de sucursal.entity.ts.
 */
export class SucursalSyncDto {
    @IsUUID('4', { message: 'El id de Sucursal debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString({ message: 'El nombre de la sucursal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
    readonly nombre!: string;

    @IsString({ message: 'El código de la sucursal debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El código identificador de la sucursal es obligatorio' })
    readonly codigo!: string;

    @IsString()
    @IsOptional()
    readonly direccion?: string | null;

    @IsDateString({}, { message: 'updatedAt de la sucursal debe ser un formato de fecha ISO8601 válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}