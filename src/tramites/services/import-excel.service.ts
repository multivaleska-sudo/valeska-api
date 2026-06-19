import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
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

  constructor(private readonly dataSource: DataSource) { }

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

        // Obtener una sucursal de fallback si no viene en el token o headers
        let finalSucursalId = sucursalId;
        if (!finalSucursalId) {
          const firstSucursal = await manager.query('SELECT id FROM sucursales LIMIT 1');
          finalSucursalId = firstSucursal.length > 0 ? firstSucursal[0].id : 'default-sucursal-id';
        }

        for (let i = 0; i < rawRows.length; i++) {
          const rawRow: any = rawRows[i];
          const row: any = {};
          for (const k of Object.keys(rawRow)) {
            const cleanKey = k.trim().toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
            row[cleanKey] = rawRow[k];
          }

          try {
            await this.processRow(manager, row, tipoMap, situacionMap, userId, finalSucursalId);
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
      // 1. Intentar con la llave tal cual
      let val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }

      // 2. Intentar con la llave normalizada (minúsculas, sin tildes ni espacios)
      const cleanKey = key.trim().toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
      val = row[cleanKey];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return null;
  }

  private parseDate(val: string | null): string | null {
    if (!val) return null;
    const match = val.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
    if (!match) return null;
    let d = match[1];
    let m = match[2];
    let y = match[3];
    if (d.length === 4) { y = match[1]; m = match[2]; d = match[3]; }
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  private getMetodo(val: string | null): string | null {
    if (!val) return null;
    const upper = val.toUpperCase();
    if (upper.includes("RECIBO")) return "Recibo";
    if (upper.includes("DNI")) return "DNI";
    return null;
  }

  private parsePresentanteName(raw: string): { nombres: string, primerApellido: string, segundoApellido: string } {
    let clean = raw.replace(/S\/N/ig, '').trim();
    clean = clean.replace(/\s+/g, ' ').trim();

    if (!clean) {
      return { nombres: 'S/N', primerApellido: 'S/N', segundoApellido: 'S/N' };
    }

    const parts = clean.split(' ');
    if (parts.length === 1) {
      return { nombres: parts[0], primerApellido: 'S/N', segundoApellido: 'S/N' };
    } else if (parts.length === 2) {
      return { nombres: parts[0], primerApellido: parts[1], segundoApellido: 'S/N' };
    } else {
      const segundoApellido = parts.pop()!;
      const primerApellido = parts.pop()!;
      const nombres = parts.join(' ');
      return { nombres, primerApellido, segundoApellido };
    }
  }

  private async processRow(
    manager: EntityManager,
    row: any,
    tipoMap: Map<string, string>,
    situacionMap: Map<string, string>,
    userId: string,
    sucursalId: string
  ) {
    const clienteNombre = this.getVal(row, "cliente", "clientenombre", "nombrecliente", "razonsocial") || "S/N";
    const dni = this.getVal(row, "ndni", "dni", "nodni", "documento", "numerodni") || "S/N";
    let chasis = this.getVal(row, "chasis", "chasisvin", "vin");
    const motor = this.getVal(row, "motor", "nromotor");

    // Si tipo de tramite falta, intentamos agarrar el primero del mapa o poner 'OTROS'
    let tipoTramiteNombre = this.getVal(row, "tramite", "tipotramite");
    let situacionNombre = this.getVal(row, "estado", "situacion");

    const now = new Date();

    // INSERT Cliente (Independiente)
    const cliente = manager.create(Cliente, {
      id: randomUUID(),
      numeroDocumento: dni,
      tipoDocumento: dni.length === 11 ? 'RUC' : 'DNI',
      razonSocialNombres: clienteNombre,
      telefono: this.getVal(row, "telefono") || "S/N",
      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(Cliente, cliente);

    // Si faltan chasis y motor, generamos un chasis dummy para asegurar que se cree un Vehiculo
    // Esto previene violaciones de llave foránea NOT NULL en Tramite
    if (!chasis && !motor) {
      chasis = "S/N";
    }

    // INSERT Vehiculo (Independiente)
    const vehiculo = manager.create(Vehiculo, {
      id: randomUUID(),
      chasisVin: chasis, motor: motor,
      placa: this.getVal(row, "placa", "nroplaca"),
      marca: this.getVal(row, "marca"),
      modelo: this.getVal(row, "modelo"),
      color: this.getVal(row, "color"),
      carroceria: this.getVal(row, "carroceria", "carrocería", "Carrocería"),
      anioFabricacion: this.getVal(row, "ano1", "año1", "ano", "año"),
      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(Vehiculo, vehiculo);

    const tipoId = tipoTramiteNombre ? tipoMap.get(tipoTramiteNombre.toUpperCase()) : null;
    const situacionId = situacionNombre ? situacionMap.get(situacionNombre.toUpperCase()) : null;

    const finalTipoId = tipoId || Array.from(tipoMap.values())[0];
    const finalSituacionId = situacionId || Array.from(situacionMap.values())[0];

    if (!finalTipoId || !finalSituacionId) throw new Error('Catalogos vacios en la base de datos, imposible asignar un default');

    // INSERT Tramite (Independiente)
    let nTitulo = this.getVal(row, "ntitulo", "notitulo", "titulo");

    const rawFechaTarjeta = this.getVal(row, "recepcionenoficinagestoratarjetaenoficina", "recepciónenoficinagestoratarjetaenoficina", "recepciontarjeta");
    const fechaTarjeta = this.parseDate(rawFechaTarjeta);

    const rawFechaPlaca = this.getVal(row, "recepcionenoficinagestoraplacaenoficina", "recepciónenoficinagestoraplacaenoficina", "recepcionplaca");
    const fechaPlaca = this.parseDate(rawFechaPlaca);

    const rawEntregaTarjeta = this.getVal(row, "entregaalclientefinalentregotarjeta", "entregaalclientefinalentregótarjeta", "entregatarjeta", "fenttarj");
    const fechaEntregaTarjeta = this.parseDate(rawEntregaTarjeta);
    const metodoEntregaTarjeta = this.getMetodo(rawEntregaTarjeta);

    const rawEntregaPlaca = this.getVal(row, "entregaalclientefinalentregoplaca", "entregaalclientefinalentregóplaca", "entregaplaca", "fentplaca");
    const fechaEntregaPlaca = this.parseDate(rawEntregaPlaca);
    const metodoEntregaPlaca = this.getMetodo(rawEntregaPlaca);

    const tramite = manager.create(Tramite, {
      id: randomUUID(),
      codigoVerificacion: this.getVal(row, "codver", "codigoverificacion"),
      clienteId: cliente.id,
      vehiculoId: vehiculo.id,
      tipoTramiteId: finalTipoId,
      situacionId: finalSituacionId,
      sucursalId: sucursalId,
      usuarioCreadorId: userId,
      nTitulo: nTitulo,
      observacionesGenerales: this.getVal(row, "obs", "observaciones", "correo", "correousuario", "usuario"),
      fechaPresentacion: new Date(this.parseDate(this.getVal(row, "fpresentacion", "fechapresentacion")) || now),
      tramiteAnio: this.getVal(row, "ano", "año") || new Date().getFullYear().toString(),

      tarjetaEnOficina: !!fechaTarjeta,
      fechaTarjetaEnOficina: fechaTarjeta,
      placaEnOficina: !!fechaPlaca,
      fechaPlacaEnOficina: fechaPlaca,

      entregoTarjeta: !!fechaEntregaTarjeta,
      fechaEntregaTarjeta: fechaEntregaTarjeta,
      metodoEntregaTarjeta: metodoEntregaTarjeta,

      entregoPlaca: !!fechaEntregaPlaca,
      fechaEntregaPlaca: fechaEntregaPlaca,
      metodoEntregaPlaca: metodoEntregaPlaca,

      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(Tramite, tramite);

    // UPSERT EmpresaGestora (Unica por nombre) si existe
    let empresaId: string | null = null;
    const empresaNombre = this.getVal(row, "empresa", "empresagestora", "concesionario");
    if (empresaNombre) {
      let empresa = await manager.findOne(EmpresaGestora, { where: { razonSocial: empresaNombre } });
      if (!empresa) {
        empresa = manager.create(EmpresaGestora, {
          id: randomUUID(),
          ruc: "S/N",
          razonSocial: empresaNombre,
          direccion: "S/N",
          syncStatus: 'SYNCED', createdAt: now, updatedAt: now
        });
        await manager.save(EmpresaGestora, empresa);
      }
      empresaId = empresa.id;
    }

    // UPSERT Presentante (Unico por nombre) si existe
    let presentanteId: string | null = null;
    const presentanteNombreRaw = this.getVal(row, "presentante", "nombrepresentante", "gestor");
    if (presentanteNombreRaw) {
      const { nombres, primerApellido, segundoApellido } = this.parsePresentanteName(presentanteNombreRaw);
      
      if (nombres !== 'S/N' || primerApellido !== 'S/N' || segundoApellido !== 'S/N') {
        let presentante = await manager.findOne(Presentante, { 
          where: { nombres, primerApellido, segundoApellido } 
        });
        if (!presentante) {
          presentante = manager.create(Presentante, {
            id: randomUUID(),
            dni: "S/N",
            nombres,
            primerApellido,
            segundoApellido,
            syncStatus: 'SYNCED', createdAt: now, updatedAt: now
          });
          await manager.save(Presentante, presentante);
        }
        presentanteId = presentante.id;
      }
    }

    // INSERT Tramite Detalle (Independiente)
    const detalle = manager.create(TramiteDetalle, {
      id: randomUUID(),
      tramiteId: tramite.id,
      empresaGestoraId: empresaId,
      presentanteId: presentanteId,
      dua: this.getVal(row, "dua"),
      numFormatoInmatriculacion: this.getVal(row, "forminmatriculacion", "formatoinmatriculacion", "forminmatriculación"),
      tipoBoleta: this.getVal(row, "boleta", "tipoboleta"),
      numeroBoleta: this.getVal(row, "nboleta", "noboleta", "numeroboleta", "nºboleta", "n°boleta"),
      fechaBoleta: new Date(this.parseDate(this.getVal(row, "fboleta", "fechaboleta")) || now),
      clausulaMonto: Number(this.getVal(row, "montototal", "monto")) || 0,
      clausulaFormaPago: this.getVal(row, "formadepago", "formapago"),
      clausulaPagoBancarizado: this.getVal(row, "pagobancarizadosegun", "pagobancarizado"),
      aclaracionDice: this.getVal(row, "dice"),
      aclaracionDebeDecir: this.getVal(row, "deberiadecir", "deberíadecir"),
      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(TramiteDetalle, detalle);
  }
}