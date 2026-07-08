import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class MobileTramitesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un numero entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un numero entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede superar 100 registros' })
  readonly limit: number = 20;

  @IsOptional()
  @IsString({ message: 'searchBusquedaRapida debe ser texto' })
  readonly searchBusquedaRapida?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'cursorTimestamp debe ser una fecha ISO8601 valida' })
  readonly cursorTimestamp?: string;

  @IsOptional()
  @IsString({ message: 'cursorId debe ser texto' })
  readonly cursorId?: string;
}
