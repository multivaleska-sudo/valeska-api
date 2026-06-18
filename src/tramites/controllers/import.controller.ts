import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExcelService } from '../services/import-excel.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('tramites')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importExcelService: ImportExcelService) {}

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Req() req: any
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Con JwtAuthGuard, req.user esta garantizado si el token es valido
    const userId = req.user?.sub || req.user?.id;
    const sucursalId = req.user?.sucursalId || req.headers['x-sucursal-id'];

    if (!userId) {
      throw new Error('Token de usuario no contiene userId');
    }

    const result = await this.importExcelService.importExcel(file.buffer, userId, sucursalId);
    return {
      success: true,
      summary: result
    };
  }
}
