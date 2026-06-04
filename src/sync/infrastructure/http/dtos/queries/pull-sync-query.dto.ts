import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';
import { SYNC_ENTITY_NAMES } from '../../../../domain/sync-entity-name';
import type { SyncEntityName } from '../../../../domain/sync-entity-name';

export class PullSyncQueryDto {
  @IsOptional()
  @IsISO8601({}, { message: 'cursorTimestamp debe ser una fecha con formato ISO8601 valido' })
  readonly cursorTimestamp?: string;

  @IsOptional()
  @IsString({ message: 'lastId debe ser una cadena valida para desempate del cursor' })
  readonly lastId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero entero' })
  @Min(1, { message: 'El limite minimo de lectura es de 1 registro' })
  @Max(100, { message: 'El limite maximo se restringe a 100 para proteger la RAM' })
  readonly limit: number = 50;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsString({ message: 'entityName debe ser una cadena de texto valida' })
  @IsIn(SYNC_ENTITY_NAMES, { message: 'entityName no es soportado por el sincronizador' })
  readonly entityName!: SyncEntityName;
}
