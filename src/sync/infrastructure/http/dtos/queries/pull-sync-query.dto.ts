import { IsOptional, IsString, IsISO8601, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para peticiones de descarga (pull) seguro.
 * Protege al servidor contra la inyección masiva de solicitudes que agoten la RAM (OOM).
 */
export class PullSyncQueryDto {
    @IsOptional()
    @IsISO8601({}, { message: 'cursorTimestamp debe ser una fecha con formato ISO8601 válido' })
    readonly cursorTimestamp?: string;

    @IsOptional()
    @IsUUID('4', { message: 'lastId debe ser un UUID v4 válido para el cursor de desempate' })
    readonly lastId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1, { message: 'El límite mínimo de lectura es de 1 registro' })
    @Max(100, { message: 'El límite máximo se restringe a 100 para proteger el Garbage Collector del servidor' })
    readonly limit: number = 50;
}