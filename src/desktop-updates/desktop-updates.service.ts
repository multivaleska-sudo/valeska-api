import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { DesktopUpdatesManifest, TauriUpdateManifest } from './desktop-updates.types';

@Injectable()
export class DesktopUpdatesService {
  private readonly updatesDir: string;
  private readonly manifestPath: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const cwd = process.cwd();
    this.updatesDir = resolve(
      cwd,
      this.configService.get<string>('DESKTOP_UPDATES_DIR') || 'storage/desktop-updates/files',
    );
    this.manifestPath = resolve(
      cwd,
      this.configService.get<string>('DESKTOP_UPDATES_MANIFEST') || 'storage/desktop-updates/releases.json',
    );
    this.publicBaseUrl = (
      this.configService.get<string>('DESKTOP_UPDATES_PUBLIC_BASE_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '3001'}`
    ).replace(/\/$/, '');
  }

  findUpdate(target: string, arch: string, currentVersion: string): TauriUpdateManifest | null {
    const normalizedTarget = this.normalizeTarget(target);
    const normalizedArch = this.normalizeArch(arch);
    const manifest = this.readManifest();

    const latestRelease = manifest.releases
      .filter((release) => release.enabled !== false)
      .filter((release) => this.normalizeTarget(release.target) === normalizedTarget)
      .filter((release) => this.normalizeArch(release.arch) === normalizedArch)
      .filter((release) => this.compareVersions(release.version, currentVersion) > 0)
      .sort((a, b) => this.compareVersions(b.version, a.version))[0];

    if (!latestRelease) {
      return null;
    }

    this.validateInstallerFileName(latestRelease.fileName);

    return {
      version: latestRelease.version,
      notes: latestRelease.notes || '',
      pub_date: latestRelease.pubDate || new Date().toISOString(),
      url: `${this.publicBaseUrl}/api/desktop-updates/download/${encodeURIComponent(latestRelease.fileName)}`,
      signature: latestRelease.signature,
    };
  }

  getInstallerPath(fileName: string): string {
    this.validateInstallerFileName(fileName);

    const installerPath = resolve(this.updatesDir, fileName);
    if (!installerPath.startsWith(this.updatesDir) || !existsSync(installerPath)) {
      throw new NotFoundException('Instalador de actualizacion no encontrado');
    }

    return installerPath;
  }

  private readManifest(): DesktopUpdatesManifest {
    if (!existsSync(this.manifestPath)) {
      return { releases: [] };
    }

    const rawManifest = readFileSync(this.manifestPath, 'utf8');
    const parsed = JSON.parse(rawManifest) as DesktopUpdatesManifest;

    if (!Array.isArray(parsed.releases)) {
      throw new BadRequestException('Manifest de actualizaciones invalido');
    }

    return parsed;
  }

  private validateInstallerFileName(fileName: string): void {
    const safeName = basename(fileName);
    const hasPathSeparator = fileName.includes('/') || fileName.includes('\\');

    if (safeName !== fileName || hasPathSeparator || fileName.includes('..') || !fileName.endsWith('.msi')) {
      throw new BadRequestException('Nombre de instalador invalido');
    }
  }

  private normalizeTarget(target: string): string {
    const value = target.toLowerCase().trim();
    if (['windows', 'win32'].includes(value)) return 'windows';
    return value;
  }

  private normalizeArch(arch: string): string {
    const value = arch.toLowerCase().trim();
    if (['x64', 'x86_64', 'amd64'].includes(value)) return 'x86_64';
    return value;
  }

  private compareVersions(left: string, right: string): number {
    const leftParts = this.toVersionParts(left);
    const rightParts = this.toVersionParts(right);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const leftPart = leftParts[index] || 0;
      const rightPart = rightParts[index] || 0;
      if (leftPart > rightPart) return 1;
      if (leftPart < rightPart) return -1;
    }

    return 0;
  }

  private toVersionParts(version: string): number[] {
    return version
      .split(/[.-]/)
      .map((part) => Number.parseInt(part, 10))
      .filter((part) => Number.isFinite(part));
  }
}