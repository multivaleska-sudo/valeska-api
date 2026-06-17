import { IsNotEmpty, IsString } from 'class-validator';

export class SyncStateQueryDto {
  @IsNotEmpty({ message: 'El parámetro entities es mandatorio' })
  @IsString()
  entities!: string;
}
