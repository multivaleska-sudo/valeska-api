import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { createTransport } from 'nodemailer';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ResetCode } from './entities/reset-code.entity';
import { Usuario } from '../sync/entities/usuario.entity';

type PublicUser = Omit<Usuario, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(ResetCode)
    private readonly resetCodeRepo: Repository<ResetCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, plainPassword: string): Promise<PublicUser> {
    const user = await this.usuarioRepo.findOne({
      where: { username },
      relations: ['dispositivos'],
    });

    if (!user || !user.estaActivo) {
      throw new UnauthorizedException('Credenciales invalidas o cuenta inactiva');
    }

    const isPasswordValid = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas o cuenta inactiva');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: PublicUser) {
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

  async register(userData: Partial<Usuario>): Promise<PublicUser> {
    const existing = await this.usuarioRepo.findOne({
      where: { username: userData.username },
    });

    if (existing) {
      throw new BadRequestException('El nombre de usuario ya se encuentra registrado');
    }

    if (!userData.passwordHash) {
      throw new BadRequestException('La contrasena es mandatoria para registrar un usuario');
    }

    const secureHash = await bcrypt.hash(userData.passwordHash, this.getSaltRounds());

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

  async generateResetCode(username: string): Promise<void> {
    const user = await this.usuarioRepo.findOne({ where: { username } });
    if (!user) {
      return;
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const codeHash = await bcrypt.hash(code, this.getSaltRounds());

    await this.resetCodeRepo.update(
      { email: user.username, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const resetEntity = this.resetCodeRepo.create({
      email: user.username,
      codeHash,
      expiresAt,
      usedAt: null,
    });

    await this.resetCodeRepo.save(resetEntity);
    await this.sendResetCodeEmail(user.username, code);
  }

  async resetPassword(username: string, code: string, newPassword: string): Promise<void> {
    const resetEntity = await this.resetCodeRepo.findOne({
      where: {
        email: username,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!resetEntity) {
      throw new BadRequestException('Codigo invalido o expirado');
    }

    const isCodeValid = await bcrypt.compare(code, resetEntity.codeHash);
    if (!isCodeValid) {
      throw new BadRequestException('Codigo invalido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.getSaltRounds());
    await this.usuarioRepo.update({ username }, { passwordHash, updatedAt: new Date() });
    await this.resetCodeRepo.update({ id: resetEntity.id }, { usedAt: new Date() });
  }

  private getSaltRounds(): number {
    return parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
  }

  private async sendResetCodeEmail(recipient: string, code: string): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP no configurado; codigo de restablecimiento generado pero no enviado.');
      return;
    }

    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to: recipient,
      subject: 'Codigo de restablecimiento Valeska',
      text: `Tu codigo de restablecimiento es ${code}. Expira en 15 minutos.`,
    });
  }
}
