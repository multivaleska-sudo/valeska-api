import {
    IsUUID,
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsDateString
} from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad real "Tramite" de tramite.entity.ts.
 */
export class TramiteSyncDto {
    @IsUUID('4', { message: 'El id de Trámite debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString()
    @IsOptional()
    readonly codigoVerificacion?: string | null;

    @IsString()
    @IsNotEmpty({ message: 'El año del trámite (tramiteAnio) es requerido' })
    readonly tramiteAnio!: string;

    @IsUUID('4', { message: 'clienteId debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly clienteId!: string;

    @IsUUID('4', { message: 'vehiculoId debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly vehiculoId!: string;

    @IsString()
    @IsNotEmpty({ message: 'tipoTramiteId es requerido para mapear el catálogo' })
    readonly tipoTramiteId!: string;

    @IsString()
    @IsNotEmpty({ message: 'situacionId es requerido para mapear el catálogo' })
    readonly situacionId!: string;

    @IsUUID('4', { message: 'usuarioCreadorId debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly usuarioCreadorId!: string;

    @IsUUID('4', { message: 'sucursalId debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly sucursalId!: string;

    @IsString()
    @IsOptional()
    readonly nTitulo?: string | null;

    @IsString()
    @IsOptional()
    readonly nFormato?: string | null;

    @IsString()
    @IsNotEmpty({ message: 'La fecha de presentación es requerida' })
    readonly fechaPresentacion!: string;

    @IsString()
    @IsOptional()
    readonly observacionesGenerales?: string | null;

    @IsBoolean({ message: 'tarjetaEnOficina debe ser un valor booleano' })
    @IsOptional()
    readonly tarjetaEnOficina: boolean = false;

    @IsString()
    @IsOptional()
    readonly fechaTarjetaEnOficina?: string | null;

    @IsBoolean({ message: 'placaEnOficina debe ser un valor booleano' })
    @IsOptional()
    readonly placaEnOficina: boolean = false;

    @IsString()
    @IsOptional()
    readonly fechaPlacaEnOficina?: string | null;

    @IsBoolean({ message: 'entregoTarjeta debe ser un valor booleano' })
    @IsOptional()
    readonly entregoTarjeta: boolean = false;

    @IsString()
    @IsOptional()
    readonly fechaEntregaTarjeta?: string | null;

    @IsString()
    @IsOptional()
    readonly metodoEntregaTarjeta?: string | null;

    @IsBoolean({ message: 'entregoPlaca debe ser un valor booleano' })
    @IsOptional()
    readonly entregoPlaca: boolean = false;

    @IsString()
    @IsOptional()
    readonly fechaEntregaPlaca?: string | null;

    @IsString()
    @IsOptional()
    readonly metodoEntregaPlaca?: string | null;

    @IsString()
    @IsOptional()
    readonly observacionPlaca?: string | null;

    @IsDateString({}, { message: 'updatedAt del trámite debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}

/**
 * * Mapeo estricto 1:1 con la entidad real "TramiteDetalle" de tramite.entity.ts.
 */
export class TramiteDetalleSyncDto {
    @IsUUID('4', { message: 'El id de TramiteDetalle debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsUUID('4', { message: 'tramiteId debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly tramiteId!: string;

    @IsUUID('4', { message: 'empresaGestoraId debe ser un UUID v4 válido' })
    @IsOptional()
    readonly empresaGestoraId?: string | null;

    @IsUUID('4', { message: 'representanteLegalId debe ser un UUID v4 válido' })
    @IsOptional()
    readonly representanteLegalId?: string | null;

    @IsUUID('4', { message: 'presentanteId debe ser un UUID v4 válido' })
    @IsOptional()
    readonly presentanteId?: string | null;

    @IsString()
    @IsOptional()
    readonly tipoBoleta?: string | null;

    @IsString()
    @IsOptional()
    readonly numeroBoleta?: string | null;

    @IsString()
    @IsOptional()
    readonly fechaBoleta?: string | null;

    @IsString()
    @IsOptional()
    readonly dua?: string | null;

    @IsString()
    @IsOptional()
    readonly numFormatoInmatriculacion?: string | null;

    @IsString()
    @IsOptional()
    readonly numeroReciboTramite?: string | null;

    @IsNumber({}, { message: 'clausulaMonto debe ser un número con coma flotante válido' })
    @IsOptional()
    readonly clausulaMonto?: number | null;

    @IsString()
    @IsOptional()
    readonly clausulaFormaPago?: string | null;

    @IsString()
    @IsOptional()
    readonly clausulaPagoBancarizado?: string | null;

    @IsString()
    @IsOptional()
    readonly aclaracionDice?: string | null;

    @IsString()
    @IsOptional()
    readonly aclaracionDebeDecir?: string | null;

    @IsDateString({}, { message: 'updatedAt de detalle debe ser una fecha ISO8601 válida' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}