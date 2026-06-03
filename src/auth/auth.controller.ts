import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    BadRequestException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RequestResetCodeDto } from './dto/auth-flow.dto';
import { SreTraceInterceptor } from '../sync/infrastructure/http/interceptors/sre-trace.interceptor';

/**
 * Controlador de Autenticación de Alto Rendimiento.
 * - Conectado de forma 100% asíncrona con el AuthService optimizado.
 * - Validación estricta mediante DTOs en el perímetro de entrada.
 * - Auditado mediante SreTraceInterceptor para registrar latencias criptográficas en producción.
 */
@Controller('auth')
@UseInterceptors(SreTraceInterceptor)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Endpoint seguro para el inicio de sesión de operadores de sucursales.
     * Retorna el token JWT y el perfil de usuario validado de forma asíncrona.
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);

        return this.authService.login(user);
    }

    /**
     * Endpoint para el registro perimetral de nuevos operadores.
     * Encripta la contraseña asíncronamente y guarda en base de datos.
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        try {
            const userData = {
                username: registerDto.username,
                passwordHash: registerDto.password,
                nombreCompleto: registerDto.nombreCompleto,
                rol: registerDto.rol || 'OPERADOR',
            };

            return await this.authService.register(userData);
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Error al procesar el registro del operador.');
        }
    }

    /**
     * Endpoint de seguridad para la generación de códigos de restauración de contraseña.
     * Retorna el código seguro de 6 dígitos con expiración controlada en base de datos.
     */
    @Post('reset-code')
    @HttpCode(HttpStatus.OK)
    async generateResetCode(@Body() resetDto: RequestResetCodeDto) {
        const code = await this.authService.generateResetCode(resetDto.username);
        return {
            success: true,
            message: 'Código de restablecimiento generado con éxito. Válido por 15 minutos.',
            code,
        };
    }
}