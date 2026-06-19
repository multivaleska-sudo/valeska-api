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

const EXPECTED_HEADERS = [
  "N°", "Nº Titulo", "Año", "Cliente", "Teléfono", "Nº DNI", "Empresa", "Trámite", "Estado", "Obs",
  "F_Presentación", "F_Ent_Tarj.", "F_Ent_Placa", "(vacía)", "Marca", "Chasis", "Color", "Modelo", "Motor", "Año",
  "placa", "(vacía)", "Presentante", "Boleta", "F_Boleta", "DUA", "Form_Inmatriculación", "Nº Boleta", "Cod_Ver", "Monto total",
  "Forma de Pago", "Pago Bancarizado Según", "Dice:", "Debería Decir", "Carrocería", "correo /usuario", "Recepción en Oficina (Gestora)-Tarjeta en Oficina", "Recepción en Oficina (Gestora)-Placa en Oficina", "Entrega al Cliente Final-Método Tarjeta", "Entrega al Cliente Final-Método Placa"
];


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
      const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: null });

      if (rawRows.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío.');
      }

      // Validación estricta de cabeceras
      const actualHeaders = (rawRows[0] || []).map(h => h ? String(h).trim() : "");
      for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
        if (actualHeaders[i] !== EXPECTED_HEADERS[i]) {
          throw new BadRequestException(`Error en la columna ${i + 1} (Letra ${String.fromCharCode(65 + (i > 25 ? (i / 26) - 1 : 0))}${String.fromCharCode(65 + (i % 26))}). Se esperaba cabecera exacta "${EXPECTED_HEADERS[i]}" pero se encontró "${actualHeaders[i] || 'vacía o distinta'}". El formato es estricto.`);
        }
      }
      if (actualHeaders.length > EXPECTED_HEADERS.length) {
        throw new BadRequestException(`El Excel tiene más columnas de las permitidas (${EXPECTED_HEADERS.length}). Por favor, use la plantilla estandarizada.`);
      }

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

        // Los datos empiezan en la fila 2 (índice 1 en AOA)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          // Ignorar filas completamente vacías
          if (!row || row.length === 0 || row.every((c: any) => c === null || c === undefined || String(c).trim() === "")) {
            continue;
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

  private getValAOA(row: any[], index: number): string | null {
    if (!row || index < 0 || index >= row.length) return null;
    const val = row[index];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
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
    row: any[],
    tipoMap: Map<string, string>,
    situacionMap: Map<string, string>,
    userId: string,
    sucursalId: string
  ) {
    const nTitulo = this.getValAOA(row, 1); // B: Nº Titulo
    const tramiteAnio = this.getValAOA(row, 2) || new Date().getFullYear().toString(); // C: Año
    const clienteNombre = this.getValAOA(row, 3) || "S/N"; // D: Cliente
    const telefono = this.getValAOA(row, 4) || "S/N"; // E: Teléfono
    const dni = this.getValAOA(row, 5) || "S/N"; // F: Nº DNI
    const empresaNombre = this.getValAOA(row, 6); // G: Empresa
    const tipoTramiteNombre = this.getValAOA(row, 7); // H: Trámite
    const situacionNombre = this.getValAOA(row, 8); // I: Estado
    const obs = this.getValAOA(row, 9); // J: Obs
    const rawFechaPresentacion = this.getValAOA(row, 10); // K: F_Presentación
    const rawFechaTarjOficina = this.getValAOA(row, 11); // L: F_Ent_Tarj.
    const rawFechaPlacaOficina = this.getValAOA(row, 12); // M: F_Ent_Placa
    // N: (vacía) -> index 13
    const marca = this.getValAOA(row, 14); // O: Marca
    let chasis = this.getValAOA(row, 15); // P: Chasis
    const color = this.getValAOA(row, 16); // Q: Color
    const modelo = this.getValAOA(row, 17); // R: Modelo
    const motor = this.getValAOA(row, 18); // S: Motor
    const vehiculoAnio = this.getValAOA(row, 19); // T: Año (Vehículo)
    const placa = this.getValAOA(row, 20); // U: placa
    // V: (vacía) -> index 21
    const presentanteNombreRaw = this.getValAOA(row, 22); // W: Presentante
    const tipoBoleta = this.getValAOA(row, 23); // X: Boleta
    const rawFechaBoleta = this.getValAOA(row, 24); // Y: F_Boleta
    const dua = this.getValAOA(row, 25); // Z: DUA
    const formInmatriculacion = this.getValAOA(row, 26); // AA: Form_Inmatriculación
    const numeroBoleta = this.getValAOA(row, 27); // AB: Nº Boleta
    const codVer = this.getValAOA(row, 28); // AC: Cod_Ver
    const montoTotal = this.getValAOA(row, 29); // AD: Monto total
    const formaPago = this.getValAOA(row, 30); // AE: Forma de Pago
    const pagoBancarizado = this.getValAOA(row, 31); // AF: Pago Bancarizado Según
    const aclaracionDice = this.getValAOA(row, 32); // AG: Dice:
    const aclaracionDebeDecir = this.getValAOA(row, 33); // AH: Debería Decir
    const carroceria = this.getValAOA(row, 34); // AI: Carrocería
    // AJ: correo /usuario -> index 35 (Normalmente no se importa sobreescribiendo el creador actual, pero se lee)
    const rawRecepTarjeta = this.getValAOA(row, 36); // AK: Recepción en Oficina (Gestora)-Tarjeta en Oficina
    const rawRecepPlaca = this.getValAOA(row, 37); // AL: Recepción en Oficina (Gestora)-Placa en Oficina
    const metodoEntregaTarjeta = this.getValAOA(row, 38); // AM: Entrega al Cliente Final-Método Tarjeta
    const metodoEntregaPlaca = this.getValAOA(row, 39); // AN: Entrega al Cliente Final-Método Placa


    const now = new Date();

    // INSERT Cliente (Independiente)
    const cliente = manager.create(Cliente, {
      id: randomUUID(),
      numeroDocumento: dni,
      tipoDocumento: dni.length === 11 ? 'RUC' : 'DNI',
      razonSocialNombres: clienteNombre,
      telefono: telefono,
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
      placa: placa,
      marca: marca,
      modelo: modelo,
      color: color,
      carroceria: carroceria,
      anioFabricacion: vehiculoAnio,
      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(Vehiculo, vehiculo);

    const tipoId = tipoTramiteNombre ? tipoMap.get(tipoTramiteNombre.toUpperCase()) : null;
    const situacionId = situacionNombre ? situacionMap.get(situacionNombre.toUpperCase()) : null;

    const finalTipoId = tipoId || Array.from(tipoMap.values())[0];
    const finalSituacionId = situacionId || Array.from(situacionMap.values())[0];

    if (!finalTipoId || !finalSituacionId) throw new Error('Catalogos vacios en la base de datos, imposible asignar un default');

    const fechaTarjeta = this.parseDate(rawFechaTarjOficina);
    const fechaPlaca = this.parseDate(rawFechaPlacaOficina);
    const fechaEntregaTarjeta = this.parseDate(rawRecepTarjeta);
    const fechaEntregaPlaca = this.parseDate(rawRecepPlaca);

    const tramite = manager.create(Tramite, {
      id: randomUUID(),
      codigoVerificacion: codVer,
      clienteId: cliente.id,
      vehiculoId: vehiculo.id,
      tipoTramiteId: finalTipoId,
      situacionId: finalSituacionId,
      sucursalId: sucursalId,
      usuarioCreadorId: userId,
      nTitulo: nTitulo,
      observacionesGenerales: obs,
      fechaPresentacion: new Date(this.parseDate(rawFechaPresentacion) || now),
      tramiteAnio: tramiteAnio,

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
      dua: dua,
      numFormatoInmatriculacion: formInmatriculacion,
      tipoBoleta: tipoBoleta,
      numeroBoleta: numeroBoleta,
      fechaBoleta: new Date(this.parseDate(rawFechaBoleta) || now),
      clausulaMonto: Number(montoTotal) || 0,
      clausulaFormaPago: formaPago,
      clausulaPagoBancarizado: pagoBancarizado,
      aclaracionDice: aclaracionDice,
      aclaracionDebeDecir: aclaracionDebeDecir,
      version: 1, baseVersion: 0, syncStatus: 'SYNCED', createdAt: now, updatedAt: now
    } as any);
    await manager.save(TramiteDetalle, detalle);
  }
}