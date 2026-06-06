import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { createTransport } from 'nodemailer';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ProvisionDeviceDto } from './dto/auth-flow.dto';
import { ResetCode } from './entities/reset-code.entity';
import { Dispositivo } from '../sync/entities/dispositivo.entity';
import { Sucursal } from '../sync/entities/sucursal.entity';
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
    @InjectRepository(Dispositivo)
    private readonly dispositivoRepo: Repository<Dispositivo>,
    @InjectRepository(Sucursal)
    private readonly sucursalRepo: Repository<Sucursal>,
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

  async provisionDevice(dto: ProvisionDeviceDto) {
    const username = dto.username || dto.email;
    if (!username) {
      throw new BadRequestException('username o email es requerido para aprovisionar el dispositivo');
    }

    if (!dto.password && !dto.passwordHash) {
      throw new BadRequestException('password o passwordHash es requerido para aprovisionar el dispositivo');
    }

    const user = dto.password
      ? await this.validateUser(username, dto.password)
      : await this.bootstrapUserFromProvisionFile(username, dto);
    const macAddress = this.normalizeMac(dto.macAddress);
    const sucursal = await this.resolveSucursalForProvision(user, dto);
    const now = new Date();

    let dispositivo = await this.dispositivoRepo
      .createQueryBuilder('dispositivo')
      .where('LOWER(dispositivo.macAddress) = :macAddress', { macAddress })
      .getOne();

    if (!dispositivo) {
      dispositivo = this.dispositivoRepo.create({
        id: dto.deviceId || randomUUID(),
        macAddress,
        nombreEquipo: dto.nombreEquipo || 'EQUIPO-VALESKA',
        autorizado: true,
        provisionId: dto.provisionId || null,
        sucursalId: sucursal.id,
        usuarioId: user.id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'SYNCED',
      });
    } else {
      dispositivo.macAddress = macAddress;
      dispositivo.nombreEquipo = dto.nombreEquipo || dispositivo.nombreEquipo || 'EQUIPO-VALESKA';
      dispositivo.autorizado = true;
      dispositivo.sucursalId = dto.sucursalId || dispositivo.sucursalId || sucursal.id;
      dispositivo.usuarioId = user.id;
      dispositivo.provisionId = dto.provisionId || dispositivo.provisionId || null;
      dispositivo.updatedAt = now;
      dispositivo.syncStatus = 'SYNCED';
    }

    const savedDevice = await this.dispositivoRepo.save(dispositivo);
    const responseSucursal =
      (await this.sucursalRepo.findOne({ where: { id: savedDevice.sucursalId } })) || sucursal;
    const effectiveDispositivoId = user.dispositivoId || savedDevice.id;

    await this.usuarioRepo.update(
      { id: user.id },
      {
        dispositivoId: effectiveDispositivoId,
        updatedAt: now,
      },
    );

    const freshUser = await this.usuarioRepo.findOneOrFail({ where: { id: user.id } });
    const { passwordHash, ...publicUser } = freshUser;

    return {
      ...(await this.login(publicUser)),
      dispositivo: {
        id: savedDevice.id,
        macAddress: savedDevice.macAddress,
        nombreEquipo: savedDevice.nombreEquipo,
        autorizado: savedDevice.autorizado,
        provisionId: savedDevice.provisionId,
        sucursalId: savedDevice.sucursalId,
        usuarioId: savedDevice.usuarioId,
        createdAt: savedDevice.createdAt,
        updatedAt: savedDevice.updatedAt,
        deletedAt: savedDevice.deletedAt,
        syncStatus: savedDevice.syncStatus,
      },
      sucursal: responseSucursal,
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

  private async bootstrapUserFromProvisionFile(
    username: string,
    dto: ProvisionDeviceDto,
  ): Promise<PublicUser> {
    const normalizedUsername = username.trim();
    if (!dto.passwordHash) {
      throw new BadRequestException('passwordHash es requerido para provisionar desde archivo .valeska');
    }

    const now = new Date();
    let user = await this.usuarioRepo.findOne({
      where: { username: normalizedUsername },
      relations: ['dispositivos'],
    });

    if (!user) {
      user = this.usuarioRepo.create({
        id: dto.userId || randomUUID(),
        username: normalizedUsername,
        passwordHash: dto.passwordHash,
        rol: dto.rol || 'OPERADOR',
        nombreCompleto: dto.nombreCompleto || normalizedUsername,
        estaActivo: true,
        dispositivoId: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'SYNCED',
      });
    } else {
      user.rol = dto.rol || user.rol || 'OPERADOR';
      user.nombreCompleto = dto.nombreCompleto || user.nombreCompleto || normalizedUsername;
      user.estaActivo = true;
      user.deletedAt = null;
      user.updatedAt = now;
      user.syncStatus = 'SYNCED';
    }

    const savedUser = await this.usuarioRepo.save(user);
    const freshUser = await this.usuarioRepo.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['dispositivos'],
    });
    const { passwordHash, ...publicUser } = freshUser;
    return publicUser;
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

  private normalizeMac(value: string): string {
    const macAddress = value.trim().toLowerCase();
    if (!macAddress) {
      throw new BadRequestException('La MAC del dispositivo no puede estar vacia');
    }
    return macAddress;
  }

  private async resolveSucursalForProvision(user: PublicUser, dto: ProvisionDeviceDto): Promise<Sucursal> {
    const requestedSucursalId = dto.sucursalId || dto.sucursal?.id;

    if (dto.sucursal) {
      const now = new Date();
      let sucursal = await this.sucursalRepo.findOne({ where: { id: dto.sucursal.id } });

      if (!sucursal) {
        sucursal = this.sucursalRepo.create({
          id: dto.sucursal.id,
          nombre: dto.sucursal.nombre,
          codigo: dto.sucursal.codigo || null,
          direccion: dto.sucursal.direccion || null,
          esCentral: dto.sucursal.esCentral || false,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          syncStatus: 'SYNCED',
        });
      } else {
        sucursal.nombre = dto.sucursal.nombre || sucursal.nombre;
        sucursal.codigo = dto.sucursal.codigo ?? sucursal.codigo ?? null;
        sucursal.direccion = dto.sucursal.direccion ?? sucursal.direccion ?? null;
        sucursal.esCentral = dto.sucursal.esCentral ?? sucursal.esCentral;
        sucursal.updatedAt = now;
        sucursal.deletedAt = null;
        sucursal.syncStatus = 'SYNCED';
      }

      return this.sucursalRepo.save(sucursal);
    }

    if (requestedSucursalId) {
      const requested = await this.sucursalRepo.findOne({ where: { id: requestedSucursalId } });
      if (requested) return requested;
      throw new BadRequestException('La sucursal solicitada para el dispositivo no existe');
    }

    if (user.dispositivoId) {
      const currentDevice = await this.dispositivoRepo.findOne({ where: { id: user.dispositivoId } });
      if (currentDevice?.sucursalId) {
        const currentSucursal = await this.sucursalRepo.findOne({ where: { id: currentDevice.sucursalId } });
        if (currentSucursal) return currentSucursal;
      }
    }

    const relatedDevice = user.dispositivos?.find((device) => device.sucursalId);
    if (relatedDevice?.sucursalId) {
      const relatedSucursal = await this.sucursalRepo.findOne({ where: { id: relatedDevice.sucursalId } });
      if (relatedSucursal) return relatedSucursal;
    }

    const fallbackSucursal = await this.sucursalRepo.findOne({ order: { nombre: 'ASC' } });
    if (!fallbackSucursal) {
      throw new BadRequestException('No existe una sucursal central para aprovisionar el dispositivo');
    }

    return fallbackSucursal;
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
      text: 'Tu codigo de restablecimiento es ' + code + '. Expira en 15 minutos.',
    });
  }
}
