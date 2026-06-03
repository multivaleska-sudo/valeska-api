import {
    IsUUID,
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsDateString,
    MaxLength
} from 'class-validator';

/**
 * * DTOs de Maestros mapeados 1:1 con las entidades reales de maestros.entity.ts.
 */

// =========================================================================
// 1. CLIENTE DTO (Mapeado con Cliente Entity)
// =========================================================================
export class ClienteSyncDto {
    @IsUUID('4', { message: 'El id de Cliente debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString({ message: 'El tipo de documento debe ser un string' })
    @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
    readonly tipoDocumento!: string;

    @IsString()
    @IsOptional()
    readonly numeroDocumento?: string | null;

    @IsString()
    @IsOptional()
    readonly razonSocialNombres?: string | null;

    @IsString()
    @IsOptional()
    readonly estadoCivil?: string | null; // Por defecto 'SOLTERO(A)' en la DB

    @IsString()
    @IsOptional()
    readonly domicilio?: string | null;

    @IsString()
    @IsOptional()
    readonly telefono?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string; // Por defecto 'SYNCED'
}

// =========================================================================
// 2. VEHICULO DTO (Mapeado con Vehiculo Entity)
// =========================================================================
export class VehiculoSyncDto {
    @IsUUID('4', { message: 'El id de Vehículo debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString()
    @IsOptional()
    readonly chasisVin?: string | null;

    @IsString()
    @IsOptional()
    readonly placa?: string | null;

    @IsString()
    @IsOptional()
    readonly motor?: string | null;

    @IsString()
    @IsOptional()
    readonly marca?: string | null;

    @IsString()
    @IsOptional()
    readonly modelo?: string | null;

    @IsString()
    @IsOptional()
    readonly color?: string | null;

    @IsString()
    @IsOptional()
    readonly carroceria?: string | null;

    @IsString()
    @IsOptional()
    readonly categoria?: string | null; // Por defecto 'L3 - B' en la DB

    @IsString()
    @IsOptional()
    readonly anioFabricacion?: string | null;

    @IsString()
    @IsOptional()
    readonly anioModelo?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

// =========================================================================
// 3. EMPRESA GESTORA DTO (Mapeado con EmpresaGestora Entity)
// =========================================================================
export class EmpresaGestoraSyncDto {
    @IsUUID('4', { message: 'El id de Empresa Gestora debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString()
    @IsOptional()
    readonly ruc?: string | null;

    @IsString()
    @IsNotEmpty({ message: 'La razón social de la empresa gestora es obligatoria' })
    readonly razonSocial!: string;

    @IsString()
    @IsOptional()
    readonly direccion?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

// =========================================================================
// 4. PLANTILLA DOCUMENTO DTO (Mapeado con PlantillaDocumento Entity)
// =========================================================================
export class PlantillaDocumentoSyncDto {
    @IsString({ message: 'El id de la plantilla debe ser un string' })
    @MaxLength(50, { message: 'El id de la plantilla no puede exceder los 50 caracteres' })
    @IsNotEmpty()
    readonly id!: string; // PrimaryColumn({ type: 'varchar', length: 50 })

    @IsString()
    @IsNotEmpty({ message: 'El nombre del documento es obligatorio' })
    readonly nombreDocumento!: string;

    @IsString()
    @IsNotEmpty({ message: 'El contenido HTML es obligatorio' })
    readonly contenidoHtml!: string;

    @IsString()
    @IsOptional()
    readonly orientacionPapel: string = 'PORTRAIT';

    @IsBoolean({ message: 'El campo activo debe ser un booleano' })
    @IsOptional()
    readonly activo: boolean = true;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

// =========================================================================
// 5. PRESENTANTE DTO (Mapeado con Presentante Entity)
// =========================================================================
export class PresentanteSyncDto {
    @IsUUID('4', { message: 'El id de Presentante debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString()
    @IsOptional()
    readonly dni?: string | null;

    @IsString()
    @IsOptional()
    readonly nombres?: string | null;

    @IsString()
    @IsOptional()
    readonly primerApellido?: string | null;

    @IsString()
    @IsOptional()
    readonly segundoApellido?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

// =========================================================================
// 6. REPRESENTANTE LEGAL DTO (Mapeado con RepresentanteLegal Entity)
// =========================================================================
export class RepresentanteLegalSyncDto {
    @IsUUID('4', { message: 'El id de Representante Legal debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsUUID('4', { message: 'El empresaGestoraId debe ser un UUID v4 válido' })
    @IsNotEmpty({ message: 'El ID de la empresa gestora asociada es obligatorio' })
    readonly empresaGestoraId!: string;

    @IsString()
    @IsOptional()
    readonly dni?: string | null;

    @IsString()
    @IsOptional()
    readonly nombres?: string | null;

    @IsString()
    @IsOptional()
    readonly primerApellido?: string | null;

    @IsString()
    @IsOptional()
    readonly segundoApellido?: string | null;

    @IsString()
    @IsOptional()
    readonly partidaRegistral?: string | null;

    @IsString()
    @IsOptional()
    readonly oficinaRegistral?: string | null;

    @IsString()
    @IsOptional()
    readonly domicilio?: string | null;

    @IsDateString({}, { message: 'updatedAt debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}