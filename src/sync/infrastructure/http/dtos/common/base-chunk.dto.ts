import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SYNC_ENTITY_NAMES } from '../../../../domain/sync-entity-name';
import type { SyncEntityName } from '../../../../domain/sync-entity-name';

export class PushSyncChunkDto {
  @IsInt({ message: 'syncProtocolVersion debe ser un numero entero' })
  @Min(2, { message: 'syncProtocolVersion 2 es requerido para subir cambios sin perdida de datos' })
  @Max(2, { message: 'syncProtocolVersion 2 es la version soportada actualmente' })
  readonly syncProtocolVersion!: number;

  @IsOptional()
  @IsUUID('4', { message: 'outboxId debe ser un UUID v4 valido cuando sea provisto internamente' })
  readonly outboxId?: string;

  @IsUUID('4', { message: 'syncSessionId debe ser un UUID v4 de sesion valido' })
  readonly syncSessionId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsString({ message: 'entityName debe ser un string correspondiente a una entidad valida' })
  @IsNotEmpty({ message: 'El nombre de la entidad no puede estar vacio' })
  @IsIn(SYNC_ENTITY_NAMES, { message: 'entityName no es soportado por el sincronizador' })
  readonly entityName!: SyncEntityName;

  @IsInt({ message: 'chunkIndex debe ser un numero entero' })
  @Min(0, { message: 'El indice de chunk no puede ser negativo' })
  readonly chunkIndex!: number;

  @IsInt({ message: 'totalChunks debe ser un numero entero' })
  @Min(1, { message: 'El total de chunks debe ser al menos 1' })
  readonly totalChunks!: number;

  @IsArray({ message: 'records debe ser una coleccion de registros' })
  @ArrayMinSize(1, { message: 'El lote de sincronizacion no puede estar vacio' })
  @ArrayMaxSize(1000, { message: 'El tamano de chunk excede el limite de seguridad de 1,000 registros para evitar OOM' })
  readonly records!: Record<string, unknown>[];
}

import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PushSyncBatchDto {
  @IsArray({ message: 'chunks debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => PushSyncChunkDto)
  readonly chunks!: PushSyncChunkDto[];
}
