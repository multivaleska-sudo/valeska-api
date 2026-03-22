import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { ResetCode } from './entities/reset-code.entity';
import { Usuario } from '../sync/entities/usuario.entity';
import { Dispositivo } from '../sync/entities/dispositivo.entity';
import { Sucursal } from '../sync/entities/sucursal.entity';

@Injectable()
export class AuthService {
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectRepository(ResetCode) private resetCodeRepository: Repository<ResetCode>,
        @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
        @InjectRepository(Dispositivo) private dispRepo: Repository<Dispositivo>,
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>,
    ) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: {
                user: process.env.SMTP_USER || process.env.GMAIL_APP_EMAIL,
                pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
            },
        });
    }

    async generateAndSendCode(email: string): Promise<{ message: string }> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const resetCode = this.resetCodeRepository.create({ email, code, expiresAt });
        await this.resetCodeRepository.save(resetCode);

        const senderEmail = process.env.SMTP_USER || process.env.GMAIL_APP_EMAIL;

        await this.transporter.sendMail({
            from: `"Valeska Central" <${senderEmail}>`,
            to: email,
            subject: 'Código de Recuperación de Contraseña',
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Recuperación de Acceso</h2>
          <p>Has solicitado restablecer tu contraseña en el Sistema Valeska.</p>
          <p>Tu código de seguridad es: <strong style="font-size: 24px; color: #2563EB;">${code}</strong></p>
          <p>Este código expirará en 15 minutos.</p>
        </div>
      `,
        });

        return { message: 'Código enviado exitosamente al correo proporcionado.' };
    }

    async verifyCode(email: string, code: string): Promise<{ isValid: boolean }> {
        const record = await this.resetCodeRepository.findOne({
            where: { email, code },
            order: { createdAt: 'DESC' },
        });

        if (!record) {
            throw new BadRequestException('El código es incorrecto.');
        }

        if (new Date() > record.expiresAt) {
            throw new BadRequestException('El código ha expirado. Solicite uno nuevo.');
        }

        await this.resetCodeRepository.remove(record);

        return { isValid: true };
    }

    async provisionDevice(email: string, passwordPlain: string, macAddress: string) {
        const user = await this.userRepo.findOne({
            where: { username: email },
            relations: ['dispositivo', 'dispositivo.sucursal'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado en la nube central.');
        }
        if (!user.estaActivo) {
            throw new UnauthorizedException('El usuario está bloqueado por el administrador.');
        }

        const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Contraseña incorrecta.');
        }

        let sucursal: Sucursal | null | undefined = user.dispositivo?.sucursal;

        if (!sucursal) {
            sucursal = await this.sucursalRepo.findOne({ where: { esCentral: true } });
            if (!sucursal) throw new NotFoundException('Error crítico: No hay sucursal central definida.');
        }

        let dispositivo = await this.dispRepo.findOne({ where: { macAddress } });

        if (!dispositivo) {
            dispositivo = this.dispRepo.create({
                id: uuidv4(),
                macAddress: macAddress,
                nombreEquipo: 'PC-REMOTA-' + macAddress.substring(0, 5),
                autorizado: true,
                sucursalId: sucursal.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.dispRepo.save(dispositivo);
        }

        user.dispositivoId = dispositivo.id;
        await this.userRepo.save(user);

        return {
            sucursal: {
                id: sucursal.id,
                nombre: sucursal.nombre,
                direccion: sucursal.direccion,
                es_central: sucursal.esCentral,
            },
            dispositivo: {
                id: dispositivo.id,
                macAddress: dispositivo.macAddress,
            },
            usuario: {
                id: user.id,
                username: user.username,
                passwordHash: user.passwordHash,
                rol: user.rol,
                nombreCompleto: user.nombreCompleto,
            },
        };
    }
}