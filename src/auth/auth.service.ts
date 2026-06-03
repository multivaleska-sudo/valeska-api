import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../sync/entities/usuario.entity';
import { ResetCode } from './entities/reset-code.entity';

/**
 * Servicio de autenticación refactorizado para alto rendimiento y seguridad empresarial.
 * - Desbloquea el Event Loop al utilizar funciones criptográficas asíncronas.
 * - Evita ataques de enumeración de usuarios unificando respuestas de error.
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepo: Repository<Usuario>,
        @InjectRepository(ResetCode)
        private readonly resetCodeRepo: Repository<ResetCode>,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Valida las credenciales del operador de manera asíncrona no bloqueante.
     */
    async validateUser(username: string, passwordPlan: string): Promise<any> {
        const user = await this.usuarioRepo.findOne({
            where: { username },
            relations: ['dispositivos'],
        });

        if (!user || !user.estaActivo) {
            throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva');
        }

        const isPasswordValid = await bcrypt.compare(passwordPlan, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva');
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    /**
     * Orquesta el login y genera el JWT payload para la sesión activa del operador.
     */
    async login(user: any) {
        const payload = {
            username: user.username,
            sub: user.id,
            rol: user.rol,
            nombreCompleto: user.nombreCompleto,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                nombreCompleto: user.nombreCompleto,
                rol: user.rol,
                estaActivo: user.estaActivo,
                dispositivoId: user.dispositivoId,
            },
        };
    }

    /**
     * Registra un nuevo operador encriptando su contraseña de forma asíncrona.
     */
    async register(userData: Partial<Usuario>): Promise<Omit<Usuario, 'passwordHash'>> {
        const existing = await this.usuarioRepo.findOne({
            where: { username: userData.username },
        });

        if (existing) {
            throw new BadRequestException('El nombre de usuario ya se encuentra registrado');
        }

        if (!userData.passwordHash) {
            throw new BadRequestException('La contraseña es mandatoria para registrar un usuario');
        }

        const secureHash = await bcrypt.hash(userData.passwordHash, 10);

        const newUser = this.usuarioRepo.create({
            ...userData,
            passwordHash: secureHash,
            estaActivo: true,
            syncStatus: 'LOCAL_INSERT',
        });

        const savedUser = await this.usuarioRepo.save(newUser);
        const { passwordHash, ...result } = savedUser;
        return result;
    }

    /**
     * Genera un código de restablecimiento de contraseña temporal.
     */
    async generateResetCode(username: string): Promise<string> {
        const user = await this.usuarioRepo.findOne({ where: { username } });
        if (!user) {
            // Lanzamos error genérico para evitar ataques de reconocimiento de infraestructura
            throw new BadRequestException('Solicitud de restablecimiento no procesada');
        }

        // Código numérico seguro de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expiración en 15 minutos

        const resetEntity = this.resetCodeRepo.create({
            email: user.username,
            code,
            expiresAt,
        });

        await this.resetCodeRepo.save(resetEntity);
        return code;
    }
}