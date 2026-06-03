import { IsOptional, IsString, IsISO8601, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Validador para descargas (pull) seguro de datos locales.
 * Permite filtrar de forma opcional por entidad para lograr descargas elásticas.
 */
export class PullSyncQueryDto {
    @IsOptional()
    @IsISO8601({}, { message: 'cursorTimestamp debe ser una fecha con formato ISO8601 válido' })
    readonly cursorTimestamp?: string;

    @IsOptional()
    @IsUUID('4', { message: 'lastId debe ser un UUID v4 válido para desempate del cursor' })
    readonly lastId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1, { message: 'El límite mínimo de lectura es de 1 registro' })
    @Max(100, { message: 'El límite máximo se restringe a 100 para proteger la RAM' })
    readonly limit: number = 50;

    /**
     * Filtro opcional por entidad:
     * Permite descargar datos de forma secuencial entidad por entidad (ej: 'tramite', 'cliente')
     * reduciendo drásticamente la latencia de red y el consumo de base de datos.
     */
    @IsOptional()
    @IsString({ message: 'entityName debe ser una cadena de texto válida' })
    readonly entityName?: string;
}