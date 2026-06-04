import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto valida' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  readonly username!: string;

  @IsString({ message: 'La contrasena debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  readonly password!: string;
}

export class RegisterDto {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto valida' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @Length(4, 20, { message: 'El nombre de usuario debe tener entre 4 y 20 caracteres' })
  readonly username!: string;

  @IsString({ message: 'La contrasena debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @Length(6, 100, { message: 'La contrasena debe tener al menos 6 caracteres' })
  readonly password!: string;

  @IsString({ message: 'El nombre completo debe ser una cadena de texto valida' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  readonly nombreCompleto!: string;

  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsOptional()
  readonly rol?: string;
}

export class ProvisionDeviceDto {
  @IsString({ message: 'El usuario o correo debe ser una cadena de texto valida' })
  @IsOptional()
  readonly username?: string;

  @IsString({ message: 'El correo debe ser una cadena de texto valida' })
  @IsOptional()
  readonly email?: string;

  @IsString({ message: 'La contrasena debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  readonly password!: string;

  @IsString({ message: 'macAddress debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La MAC del dispositivo es obligatoria' })
  readonly macAddress!: string;

  @IsString({ message: 'nombreEquipo debe ser una cadena de texto' })
  @IsOptional()
  readonly nombreEquipo?: string;

  @IsString({ message: 'sucursalId debe ser una cadena de texto' })
  @IsOptional()
  readonly sucursalId?: string;
}

export class RequestResetCodeDto {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto valida' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio para generar el codigo de restauracion' })
  readonly username!: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto valida' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  readonly username!: string;

  @IsString({ message: 'El codigo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El codigo es obligatorio' })
  @Length(6, 6, { message: 'El codigo debe tener 6 digitos' })
  readonly code!: string;

  @IsString({ message: 'La nueva contrasena debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La nueva contrasena es obligatoria' })
  @Length(6, 100, { message: 'La nueva contrasena debe tener al menos 6 caracteres' })
  readonly newPassword!: string;
}
