import {
    IsUUID,
    IsInt,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
    Min,
    IsString,
    IsNotEmpty
} from 'class-validator';

/**
 * DTO Polimórfico para recibir paquetes (chunks) fragmentados de sincronización.
 * Diseñado para validar el encabezado de red a alta velocidad sin bloquear el Event Loop.
 */
export class PushSyncChunkDto {
    @IsUUID('4', { message: 'syncSessionId debe ser un UUID v4 de sesión válido' })
    readonly syncSessionId!: string;

    @IsString({ message: 'entityName debe ser un string correspondiente a una entidad válida' })
    @IsNotEmpty({ message: 'El nombre de la entidad no puede estar vacío' })
    readonly entityName!: string;

    @IsInt({ message: 'chunkIndex debe ser un número entero' })
    @Min(0, { message: 'El índice de chunk no puede ser negativo' })
    readonly chunkIndex!: number;

    @IsInt({ message: 'totalChunks debe ser un número entero' })
    @Min(1, { message: 'El total de chunks debe ser al menos 1' })
    readonly totalChunks!: number;

    @IsArray({ message: 'records debe ser una colección de registros' })
    @ArrayMinSize(1, { message: 'El lote de sincronización no puede estar vacío' })
    @ArrayMaxSize(1000, { message: 'El tamaño de chunk excede el límite de seguridad de 1,000 registros para evitar OOM' })
    readonly records!: Record<string, any>[];
}