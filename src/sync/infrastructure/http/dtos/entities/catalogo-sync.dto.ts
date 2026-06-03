import { IsString, IsNotEmpty, IsBoolean, IsHexColor, IsOptional, IsDateString } from 'class-validator';

/**
 * * DTO específico para la entidad CatalogoTipoTramite.
 */
export class CatalogoTipoTramiteSyncDto {
    @IsString()
    @IsNotEmpty({ message: 'El id de tipo de trámite es mandatorio' })
    readonly id!: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre del tipo de trámite es mandatorio' })
    readonly nombre!: string;

    @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
    @IsOptional()
    readonly activo: boolean = true;

    @IsDateString({}, { message: 'updatedAt debe ser un formato de fecha ISO válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

/**
 * DTO específico para la entidad CatalogoSituacion.
 */
export class CatalogoSituacionSyncDto {
    @IsString()
    @IsNotEmpty({ message: 'El id de la situación es mandatorio' })
    readonly id!: string;

    @IsString()
    @IsNotEmpty({ message: 'El nombre de la situación es mandatorio' })
    readonly nombre!: string;

    @IsHexColor({ message: 'colorHex debe ser un código hexadecimal de color válido (ej: #CCCCCC)' })
    @IsOptional()
    readonly colorHex?: string;

    @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
    @IsOptional()
    readonly activo: boolean = true;

    @IsDateString({}, { message: 'updatedAt debe ser un formato de fecha ISO válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}