import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExcelService } from '../services/import-excel.service';

@Controller('tramites')
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
    
    // Suponemos que tienes req.user poblado por JWTGuard
    const userId = req.user?.sub || req.user?.id || 'admin-user-id';
    // Aqui se deberia sacar el sucursalId del usuario. En un caso real, el JWT lo tiene o se busca en BD.
    const sucursalId = req.user?.sucursalId || 'default-sucursal-id';

    const result = await this.importExcelService.importExcel(file.buffer, userId, sucursalId);
    return {
      success: true,
      summary: result
    };
  }
}
