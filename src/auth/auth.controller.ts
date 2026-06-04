import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from './decorators/roles.decorator';
import { LoginDto, ProvisionDeviceDto, RegisterDto, RequestResetCodeDto, ResetPasswordDto } from './dto/auth-flow.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';
import { SreTraceInterceptor } from '../sync/infrastructure/http/interceptors/sre-trace.interceptor';

@Controller('auth')
@UseInterceptors(SreTraceInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }

  @Post('provision-device')
  @HttpCode(HttpStatus.OK)
  async provisionDevice(@Body() provisionDto: ProvisionDeviceDto) {
    return this.authService.provisionDevice(provisionDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register({
        username: registerDto.username,
        passwordHash: registerDto.password,
        nombreCompleto: registerDto.nombreCompleto,
        rol: registerDto.rol || 'OPERADOR',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar el registro del operador.';
      throw new BadRequestException(message);
    }
  }

  @Post('reset-code')
  @HttpCode(HttpStatus.OK)
  async generateResetCode(@Body() resetDto: RequestResetCodeDto) {
    await this.authService.generateResetCode(resetDto.username);
    return {
      success: true,
      message: 'Si la cuenta existe, se enviara un codigo de restablecimiento valido por 15 minutos.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetDto.username, resetDto.code, resetDto.newPassword);
    return {
      success: true,
      message: 'Contrasena actualizada correctamente.',
    };
  }
}
