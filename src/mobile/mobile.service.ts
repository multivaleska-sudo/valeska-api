import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Tramite } from '../tramites/entities/tramite.entity';
import { MobileTramitesQueryDto } from './dto/mobile-tramites-query.dto';

type MobileTramiteRowRaw = {
  id?: string | null;
  n_titulo?: string | null;
  cliente?: string | null;
  dni?: string | null;
  placa?: string | null;
  tramite?: string | null;
  situacion?: string | null;
  fecha_presentacion?: string | Date | null;
  empresa_gestiona?: string | null;
  creador?: string | null;
  motor?: string | null;
  chasis_vin?: string | null;
  timestamp?: string | Date | number | null;
};

type MobileTramiteDetailRaw = Record<string, string | number | boolean | Date | null | undefined>;

type MobileCursor = {
  cursorTimestamp: string;
  cursorId: string;
};

@Injectable()
export class MobileTramitesService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: MobileTramitesQueryDto) {
    const limit = query.limit ?? 20;
    const search = query.searchBusquedaRapida?.trim();
    const repository = this.dataSource.getRepository(Tramite);

    if (query.page !== undefined) {
      return this.findAllLegacy(repository, query.page, limit, search);
    }

    return this.findAllCursor(repository, query, limit, search);
  }

  private async findAllLegacy(
    repository: Repository<Tramite>,
    page: number,
    limit: number,
    search?: string,
  ) {
    const offset = (page - 1) * limit;
    const queryBuilder = this.buildListDataQuery(repository);

    this.applySearch(queryBuilder, search);

    const rows = await queryBuilder
      .orderBy('t.updated_at', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany<MobileTramiteRowRaw>();
    const total = await this.buildLegacyCountQuery(repository, search).getCount();

    return {
      data: this.mapListRows(rows),
      total,
    };
  }

  private async findAllCursor(
    repository: Repository<Tramite>,
    query: MobileTramitesQueryDto,
    limit: number,
    search?: string,
  ) {
    const queryBuilder = this.buildListDataQuery(repository);

    this.applySearch(queryBuilder, search);
    this.applyCursor(queryBuilder, query);

    const rows = await queryBuilder
      .orderBy('t.updated_at', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .take(limit + 1)
      .getRawMany<MobileTramiteRowRaw>();
    const pageRows = rows.slice(0, limit);
    const hasMore = rows.length > limit;

    return {
      data: this.mapListRows(pageRows),
      has_more: hasMore,
      next_cursor: hasMore ? this.buildNextCursor(pageRows.at(-1)) : null,
    };
  }

  private buildListDataQuery(repository: Repository<Tramite>): SelectQueryBuilder<Tramite> {
    return repository
      .createQueryBuilder('t')
      .select([
        't.id AS id',
        't.n_titulo AS n_titulo',
        'c.razon_social_nombres AS cliente',
        'c.numero_documento AS dni',
        'v.placa AS placa',
        'v.motor AS motor',
        'v.chasis_vin AS chasis_vin',
        'ctt.nombre AS tramite',
        'cs.nombre AS situacion',
        't.fecha_presentacion AS fecha_presentacion',
        'eg.razon_social AS empresa_gestiona',
        'u.nombre_completo AS creador',
        't.updated_at AS timestamp',
      ])
      .leftJoin('clientes', 'c', 'c.id::text = t.cliente_id::text')
      .leftJoin('vehiculos', 'v', 'v.id::text = t.vehiculo_id::text')
      .leftJoin('catalogo_tipos_tramite', 'ctt', 'ctt.id::text = t.tipo_tramite_id::text')
      .leftJoin('catalogo_situaciones', 'cs', 'cs.id::text = t.situacion_id::text')
      .leftJoin('tramite_detalles', 'td', 'td.tramite_id::text = t.id::text AND td.deleted_at IS NULL')
      .leftJoin('empresas_gestoras', 'eg', 'eg.id::text = td.empresa_gestora_id::text')
      .leftJoin('usuarios', 'u', 'u.id::text = t.usuario_creador_id::text')
      .where('t.deleted_at IS NULL');
  }

  private buildLegacyCountQuery(repository: Repository<Tramite>, search?: string): SelectQueryBuilder<Tramite> {
    const queryBuilder = repository.createQueryBuilder('t').where('t.deleted_at IS NULL');

    if (search) {
      queryBuilder
        .leftJoin('clientes', 'c', 'c.id::text = t.cliente_id::text')
        .leftJoin('vehiculos', 'v', 'v.id::text = t.vehiculo_id::text');
      this.applySearch(queryBuilder, search);
    }

    return queryBuilder;
  }

  private applySearch(queryBuilder: SelectQueryBuilder<Tramite>, search?: string): void {
    if (!search) return;

    const searchCondition = [
      'c.razon_social_nombres ILIKE :search',
      't.n_titulo ILIKE :search',
      'c.numero_documento ILIKE :search',
      'v.placa ILIKE :search',
      'v.motor ILIKE :search',
      'v.chasis_vin ILIKE :search',
    ].join(' OR ');
    queryBuilder.andWhere(`(${searchCondition})`, { search: `%${search}%` });
  }

  private applyCursor(queryBuilder: SelectQueryBuilder<Tramite>, query: MobileTramitesQueryDto): void {
    if (!query.cursorTimestamp && !query.cursorId) return;

    if (!query.cursorTimestamp || !query.cursorId) {
      throw new BadRequestException('cursorTimestamp y cursorId deben enviarse juntos');
    }

    if (!this.isUuid(query.cursorId)) {
      throw new BadRequestException('cursorId debe ser un UUID valido');
    }

    queryBuilder.andWhere('(t.updated_at < :cursorTimestamp OR (t.updated_at = :cursorTimestamp AND t.id < :cursorId))', {
      cursorTimestamp: query.cursorTimestamp,
      cursorId: query.cursorId,
    });
  }

  private mapListRows(rows: MobileTramiteRowRaw[]) {
    return rows.map((row) => ({
      id: this.toStringValue(row.id),
      n_titulo: this.toStringValue(row.n_titulo),
      cliente: this.toStringValue(row.cliente),
      dni: this.toStringValue(row.dni),
      placa: this.toStringValue(row.placa),
      tramite: this.toStringValue(row.tramite),
      situacion: this.toStringValue(row.situacion),
      fecha_presentacion: this.toDateString(row.fecha_presentacion),
      empresa_gestiona: this.toStringValue(row.empresa_gestiona),
      creador: this.toStringValue(row.creador),
      motor: this.toStringValue(row.motor),
      chasis_vin: this.toStringValue(row.chasis_vin),
      timestamp: this.toEpochMillis(row.timestamp),
    }));
  }

  private buildNextCursor(row: MobileTramiteRowRaw | undefined): MobileCursor | null {
    if (!row?.id || !row.timestamp) return null;

    return {
      cursorTimestamp: this.toIsoTimestamp(row.timestamp),
      cursorId: this.toStringValue(row.id),
    };
  }

  async findOne(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('id debe ser un UUID valido');
    }

    const repository = this.dataSource.getRepository(Tramite);
    const row = await repository
      .createQueryBuilder('t')
      .select([
        't.id AS id',
        't.tramite_anio AS tramite_anio',
        'c.razon_social_nombres AS cliente',
        'c.telefono AS telefono',
        'c.numero_documento AS dni',
        't.n_titulo AS n_titulo',
        'ctt.nombre AS tipo_tramite',
        'cs.nombre AS estado_tramite',
        't.observaciones_generales AS observaciones',
        't.fecha_presentacion AS fecha_presentacion',
        't.tarjeta_en_oficina AS check_tarjeta_oficina',
        't.fecha_tarjeta_en_oficina AS fecha_tarjeta_oficina',
        't.placa_en_oficina AS check_placa_oficina',
        't.fecha_placa_en_oficina AS fecha_placa_oficina',
        't.entrego_tarjeta AS check_entrega_tarjeta',
        't.fecha_entrega_tarjeta AS fecha_entrega_tarjeta',
        't.metodo_entrega_tarjeta AS metodo_entrega_tarjeta',
        't.entrego_placa AS check_entrega_placa',
        't.fecha_entrega_placa AS fecha_entrega_placa',
        't.metodo_entrega_placa AS metodo_entrega_placa',
        't.codigo_verificacion AS codigo_verificacion',
        'v.marca AS vehiculo_marca',
        'v.motor AS vehiculo_motor',
        'v.chasis_vin AS vehiculo_chasis',
        'v.anio_fabricacion AS vehiculo_anio',
        'v.color AS vehiculo_color',
        'v.carroceria AS vehiculo_carroceria',
        'v.placa AS vehiculo_placa',
        'v.modelo AS vehiculo_modelo',
        'eg.razon_social AS presentante_empresa',
        "TRIM(CONCAT_WS(' ', p.nombres, p.primer_apellido, p.segundo_apellido)) AS presentante_persona",
        'td.tipo_boleta AS tipo_boleta',
        'td.numero_boleta AS numero_boleta',
        'td.fecha_boleta AS fecha_boleta',
        'td.dua AS dua',
        'td.num_formato_inmatriculacion AS num_formato_inmatriculacion',
        'td.numero_recibo_tramite AS numero_recibo_tramite',
        'td.clausula_monto AS clausula_monto',
        'td.clausula_forma_pago AS clausula_forma_pago',
        'td.clausula_pago_bancarizado AS clausula_pago_bancarizado',
        'td.aclaracion_dice AS aclaracion_dice',
        'td.aclaracion_debe_decir AS aclaracion_debe_decir',
        'CURRENT_DATE AS fecha_impresion',
      ])
      .leftJoin('clientes', 'c', 'c.id::text = t.cliente_id::text')
      .leftJoin('vehiculos', 'v', 'v.id::text = t.vehiculo_id::text')
      .leftJoin('catalogo_tipos_tramite', 'ctt', 'ctt.id::text = t.tipo_tramite_id::text')
      .leftJoin('catalogo_situaciones', 'cs', 'cs.id::text = t.situacion_id::text')
      .leftJoin('tramite_detalles', 'td', 'td.tramite_id::text = t.id::text AND td.deleted_at IS NULL')
      .leftJoin('empresas_gestoras', 'eg', 'eg.id::text = td.empresa_gestora_id::text')
      .leftJoin('presentantes', 'p', 'p.id::text = td.presentante_id::text')
      .where('t.id = :id', { id })
      .getRawOne<MobileTramiteDetailRaw>();

    if (!row) {
      throw new NotFoundException('Tramite no encontrado');
    }

    return {
      id: this.toStringValue(row.id),
      tramite_anio: this.toStringValue(row.tramite_anio),
      cliente: this.toStringValue(row.cliente),
      telefono: this.toStringValue(row.telefono),
      dni: this.toStringValue(row.dni),
      n_titulo: this.toStringValue(row.n_titulo),
      tipo_tramite: this.toStringValue(row.tipo_tramite),
      estado_tramite: this.toStringValue(row.estado_tramite),
      observaciones: this.toStringValue(row.observaciones),
      fecha_presentacion: this.toDateString(row.fecha_presentacion),
      check_tarjeta_oficina: row.check_tarjeta_oficina === true,
      fecha_tarjeta_oficina: this.toDateString(row.fecha_tarjeta_oficina),
      check_placa_oficina: row.check_placa_oficina === true,
      fecha_placa_oficina: this.toDateString(row.fecha_placa_oficina),
      check_entrega_tarjeta: row.check_entrega_tarjeta === true,
      fecha_entrega_tarjeta: this.toDateString(row.fecha_entrega_tarjeta),
      metodo_entrega_tarjeta: this.toStringValue(row.metodo_entrega_tarjeta),
      check_entrega_placa: row.check_entrega_placa === true,
      fecha_entrega_placa: this.toDateString(row.fecha_entrega_placa),
      metodo_entrega_placa: this.toStringValue(row.metodo_entrega_placa),
      codigo_verificacion: this.toStringValue(row.codigo_verificacion),
      vehiculo_marca: this.toStringValue(row.vehiculo_marca),
      vehiculo_motor: this.toStringValue(row.vehiculo_motor),
      vehiculo_chasis: this.toStringValue(row.vehiculo_chasis),
      vehiculo_anio: this.toStringValue(row.vehiculo_anio),
      vehiculo_color: this.toStringValue(row.vehiculo_color),
      vehiculo_carroceria: this.toStringValue(row.vehiculo_carroceria),
      vehiculo_placa: this.toStringValue(row.vehiculo_placa),
      vehiculo_modelo: this.toStringValue(row.vehiculo_modelo),
      presentante_empresa: this.toStringValue(row.presentante_empresa),
      presentante_persona: this.toStringValue(row.presentante_persona),
      tipo_boleta: this.toStringValue(row.tipo_boleta),
      numero_boleta: this.toStringValue(row.numero_boleta),
      fecha_boleta: this.toDateString(row.fecha_boleta),
      dua: this.toStringValue(row.dua),
      num_formato_inmatriculacion: this.toStringValue(row.num_formato_inmatriculacion),
      numero_recibo_tramite: this.toStringValue(row.numero_recibo_tramite),
      clausula_monto: this.toStringValue(row.clausula_monto),
      clausula_forma_pago: this.toStringValue(row.clausula_forma_pago),
      clausula_pago_bancarizado: this.toStringValue(row.clausula_pago_bancarizado),
      aclaracion_dice: this.toStringValue(row.aclaracion_dice),
      aclaracion_debe_decir: this.toStringValue(row.aclaracion_debe_decir),
      fecha_impresion: this.toDateString(row.fecha_impresion),
    };
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private toDateString(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const stringValue = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) return stringValue.slice(0, 10);
    return stringValue;
  }

  private toEpochMillis(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const timestamp = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private toIsoTimestamp(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    const timestamp = new Date(String(value)).getTime();
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : String(value);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
