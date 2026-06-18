import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';

import { Cliente, Vehiculo, EmpresaGestora, Presentante } from '../entities/maestros.entity';
import { CatalogoTipoTramite, CatalogoSituacion } from '../entities/catalogos.entity';
import { Tramite, TramiteDetalle } from '../entities/tramite.entity';

export interface ImportSummary {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: number;
}

@Injectable()
export class ImportExcelService {
  private isImporting = false;

  constructor(private readonly dataSource: DataSource) {}

  public get isMaintenanceMode(): boolean {
    return this.isImporting;
  }

  public checkMaintenanceMode() {
    if (this.isImporting) {
      throw new ServiceUnavailableException('El sistema está en mantenimiento importando datos masivos. Por favor, intente de nuevo en unos minutos.');
    }
  }

  async importExcel(buffer: Buffer, userId: string, sucursalId: string): Promise<ImportSummary> {
    if (this.isImporting) {
      throw new BadRequestException('Ya hay una importación en progreso.');
    }

    this.isImporting = true;
    try {
      const summary: ImportSummary = { totalRows: 0, imported: 0, skipped: 0, errors: 0 };
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { raw: false, defval: null });
      
      summary.totalRows = rawRows.length;

      await this.dataSource.transaction(async (manager) => {
        // Cache catalogos
        const tipos = await manager.find(CatalogoTipoTramite);
        const tipoMap = new Map(tipos.map(t => [t.nombre.toUpperCase(), t.id]));
        const situaciones = await manager.find(CatalogoSituacion);
        const situacionMap = new Map(situaciones.map(s => [s.nombre.toUpperCase(), s.id]));

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          try {
            await this.processRow(manager, row, tipoMap, situacionMap, userId, sucursalId);
            summary.imported++;
          } catch (e) {
            console.error(`Error importing row ${i + 2}:`, e);
            summary.errors++;
          }
        }
      });

      return summary;
    } finally {
      this.isImporting = false;
    }
  }

  private getVal(row: any, ...keys: string[]): string | null {
    for (const key of keys) {
      const val = row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()];
      if (val !== undefined && val !== null && val !== "") {
        return String(val).trim();
      }
    }
    return null;
  }

  private parseDate(val: string | null): string | null {
    if (!val) return null;
    const parts = val.split(/[-/]/);
    if (parts.length < 3) return null;
    let d = parts[0];
    let m = parts[1];
    let y = parts[2];
    if (d.length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  private async processRow(
    manager: EntityManager, 
    row: any, 
    tipoMap: Map<string, string>, 
    situacionMap: Map<string, string>, 
    userId: string, 
    sucursalId: string
  ) {
    const clienteNombre = this.getVal(row, "cliente", "clientenombre", "nombrecliente", "razonsocial");
    const dni = this.getVal(row, "ndni", "dni", "nodni", "documento", "numerodni");
    const chasis = this.getVal(row, "chasis", "chasisvin", "vin");
    const motor = this.getVal(row, "motor", "nromotor");
    const tipoTramiteNombre = this.getVal(row, "tramite", "tipotramite");
    const situacionNombre = this.getVal(row, "estado", "situacion");

    if (!clienteNombre || !dni || !tipoTramiteNombre || !situacionNombre) {
      throw new Error('Faltan campos obligatorios en la fila');
    }

    const now = new Date();

    // UPSERT Cliente
    let cliente = await manager.findOne(Cliente, { where: { numeroDocumento: dni } });
    if (!cliente) {
      cliente = manager.create(Cliente, {
        id: randomUUID(),
        numeroDocumento: dni,
        tipoDocumento: dni.length === 11 ? 'RUC' : 'DNI',
        razonSocialNombres: clienteNombre,
        telefono: this.getVal(row, "telefono"),
        version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
      } as any);
      await manager.save(Cliente, cliente);
    } else {
      await manager.update(Cliente, { id: cliente.id }, {
        razonSocialNombres: clienteNombre,
        telefono: this.getVal(row, "telefono") || cliente.telefono,
        version: cliente.version + 1, baseVersion: cliente.version, syncStatus: 'SYNCED', updatedAt: now
      } as any);
    }

    // UPSERT Vehiculo
    let vehiculo: Vehiculo | null = null;
    if (chasis || motor) {
      if (chasis) vehiculo = await manager.findOne(Vehiculo, { where: { chasisVin: chasis } });
      if (!vehiculo && motor) vehiculo = await manager.findOne(Vehiculo, { where: { motor: motor } });

      if (!vehiculo) {
        vehiculo = manager.create(Vehiculo, {
          id: randomUUID(),
          chasisVin: chasis, motor: motor,
          placa: this.getVal(row, "placa", "nroplaca"),
          marca: this.getVal(row, "marca"),
          modelo: this.getVal(row, "modelo"),
          color: this.getVal(row, "color"),
          anioFabricacion: this.getVal(row, "año", "ano"),
          version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
        } as any);
        await manager.save(Vehiculo, vehiculo);
      } else {
        await manager.update(Vehiculo, { id: vehiculo.id }, {
          placa: this.getVal(row, "placa", "nroplaca") || vehiculo.placa,
          version: vehiculo.version + 1, baseVersion: vehiculo.version, syncStatus: 'SYNCED', updatedAt: now
        } as any);
      }
    }

    const tipoId = tipoMap.get(tipoTramiteNombre.toUpperCase());
    const situacionId = situacionMap.get(situacionNombre.toUpperCase());
    if (!tipoId || !situacionId) throw new Error('Tipo o situacion no encontrados');

    // UPSERT Tramite
    let tramite = await manager.findOne(Tramite, { 
      where: { clienteId: cliente.id, vehiculoId: vehiculo?.id || IsNull(), tipoTramiteId: tipoId } 
    });

    let nTitulo = this.getVal(row, "ntitulo", "notitulo", "titulo");

    if (!tramite) {
      tramite = manager.create(Tramite, {
        id: randomUUID(),
        clienteId: cliente.id,
        vehiculoId: vehiculo?.id || null,
        tipoTramiteId: tipoId,
        situacionId: situacionId,
        sucursalId: sucursalId,
        usuarioCreadorId: userId,
        nTitulo: nTitulo,
        observacionesGenerales: this.getVal(row, "obs", "observaciones"),
        fechaPresentacion: new Date(this.parseDate(this.getVal(row, "fpresentacion")) || now),
        tramiteAnio: new Date().getFullYear().toString(),
        version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
      } as any);
      await manager.save(Tramite, tramite);
    } else {
      await manager.update(Tramite, { id: tramite.id }, {
        situacionId: situacionId,
        nTitulo: nTitulo || tramite.nTitulo,
        observacionesGenerales: this.getVal(row, "obs", "observaciones") || tramite.observacionesGenerales,
        version: tramite.version + 1, baseVersion: tramite.version, syncStatus: 'SYNCED', updatedAt: now
      } as any);
    }

    // UPSERT Tramite Detalle
    let detalle = await manager.findOne(TramiteDetalle, { where: { tramiteId: tramite.id } });
    if (!detalle) {
      detalle = manager.create(TramiteDetalle, {
        id: randomUUID(),
        tramiteId: tramite.id,
        tipoBoleta: this.getVal(row, "boleta", "tipoboleta"),
        numeroBoleta: this.getVal(row, "noboleta", "numeroboleta"),
        fechaBoleta: new Date(this.parseDate(this.getVal(row, "fboleta")) || now),
        clausulaMonto: Number(this.getVal(row, "montototal", "monto")) || null,
        clausulaFormaPago: this.getVal(row, "formadepago"),
        version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
      } as any);
      await manager.save(TramiteDetalle, detalle);
    } else {
      await manager.update(TramiteDetalle, { id: detalle.id }, {
        tipoBoleta: this.getVal(row, "boleta", "tipoboleta") || detalle.tipoBoleta,
        numeroBoleta: this.getVal(row, "noboleta", "numeroboleta") || detalle.numeroBoleta,
        version: detalle.version + 1, baseVersion: detalle.version, syncStatus: 'SYNCED', updatedAt: now
      } as any);
    }
  }
}
