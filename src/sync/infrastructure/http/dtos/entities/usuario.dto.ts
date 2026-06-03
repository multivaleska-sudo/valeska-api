import { IsUUID, IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * * Mapeo estricto 1:1 con la entidad física "Usuario" de usuario.entity.ts.
 * Integra soporte para el requerimiento de acceso multidispositivo sin bloqueos.
 */
export class UsuarioSyncDto {
    @IsUUID('4', { message: 'El id de Usuario debe ser un UUID v4 válido' })
    @IsNotEmpty()
    readonly id!: string;

    @IsString({ message: 'El username debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El username de acceso es obligatorio' })
    readonly username!: string;

    @IsString({ message: 'El passwordHash debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El hash de contraseña es obligatorio para preservar la seguridad' })
    readonly passwordHash!: string;

    @IsString({ message: 'El rol debe ser una cadena de texto' })
    @IsOptional()
    readonly rol: string = 'OPERADOR';

    @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    readonly nombreCompleto!: string;

    @IsBoolean({ message: 'estaActivo debe ser un valor booleano' })
    @IsOptional()
    readonly estaActivo: boolean = true;

    @IsUUID('4', { message: 'El dispositivoId debe ser un UUID v4 válido' })
    @IsOptional()
    readonly dispositivoId?: string | null;

    @IsDateString({}, { message: 'updatedAt del usuario debe ser un formato de fecha ISO8601 válido' })
    readonly updatedAt!: string;

    @IsString()
    @IsOptional()
    readonly syncStatus?: string;
}