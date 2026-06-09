import { Controller, Get, HttpCode, HttpStatus, Param, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { basename } from 'path';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { DesktopUpdatesService } from './desktop-updates.service';

@Public()
@Controller('api/desktop-updates')
export class DesktopUpdatesController {
  constructor(private readonly desktopUpdatesService: DesktopUpdatesService) {}

  @Get(':target/:arch/:currentVersion')
  checkUpdate(
    @Param('target') target: string,
    @Param('arch') arch: string,
    @Param('currentVersion') currentVersion: string,
    @Res() response: Response,
  ): Response {
    const updateManifest = this.desktopUpdatesService.findUpdate(target, arch, currentVersion);

    if (!updateManifest) {
      return response.status(HttpStatus.NO_CONTENT).send();
    }

    return response.status(HttpStatus.OK).json(updateManifest);
  }

  @Get('download/:fileName')
  @HttpCode(HttpStatus.OK)
  downloadInstaller(@Param('fileName') fileName: string, @Res() response: Response): void {
    const installerPath = this.desktopUpdatesService.getInstallerPath(fileName);
    const installerName = basename(installerPath);

    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('Content-Disposition', `attachment; filename="${installerName}"`);
    createReadStream(installerPath).pipe(response);
  }
}