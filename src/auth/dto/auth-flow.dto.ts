import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

/**
 * DTOs de validación estricta para la capa perimetral de autenticación.
 * Bloquea cualquier propiedad basura o inyección no autorizada (Mass Assignment).
 */

export class LoginDto {
    @IsString({ message: 'El nombre de usuario debe ser una cadena de texto válida' })
    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
    readonly username!: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    readonly password!: string;
}

export class RegisterDto {
    @IsString({ message: 'El nombre de usuario debe ser una cadena de texto válida' })
    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
    @Length(4, 20, { message: 'El nombre de usuario debe tener entre 4 y 20 caracteres' })
    readonly username!: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @Length(6, 100, { message: 'La contraseña debe tener al menos 6 caracteres' })
    readonly password!: string; // El cliente envía 'password', el servicio la procesará y encriptará asíncronamente

    @IsString({ message: 'El nombre completo debe ser una cadena de texto válida' })
    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    readonly nombreCompleto!: string;

    @IsString({ message: 'El rol debe ser una cadena de texto' })
    @IsOptional()
    readonly rol?: string;
}

export class RequestResetCodeDto {
    @IsString({ message: 'El nombre de usuario debe ser una cadena de texto válida' })
    @IsNotEmpty({ message: 'El nombre de usuario es obligatorio para generar el código de restauración' })
    readonly username!: string;
}