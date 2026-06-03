import { Injectable, Inject, Logger } from '@nestjs/common';
import { type IMaestrosSyncRepository, MAESTROS_SYNC_REPOSITORY_TOKEN } from '../domain/ports/maestros-sync-repository.interface';
import {
    Cliente,
    Vehiculo,
    EmpresaGestora,
    PlantillaDocumento,
    Presentante,
    RepresentanteLegal
} from '../../tramites/entities/maestros.entity';
import { PerfilGestor } from '../../tramites/entities/perfil-gestor.entity';
import { MessageTemplate } from '../../tramites/entities/plantillas.entity';

/**
 * Servicio para sincronizar de manera fragmentada e indexada las 8 entidades Maestras globales.
 */
@Injectable()
export class MaestrosSyncService {
    private readonly logger = new Logger(MaestrosSyncService.name);

    constructor(
        @Inject(MAESTROS_SYNC_REPOSITORY_TOKEN)
        private readonly maestrosSyncRepo: IMaestrosSyncRepository,
    ) { }

    /**
     * Consolida todos los cambios de maestros aplicando UPSERTs atómicos.
     */
    async push(tx: any, payload: {
        clientes?: Partial<Cliente>[];
        vehiculos?: Partial<Vehiculo>[];
        empresasGestoras?: Partial<EmpresaGestora>[];
        plantillas?: Partial<PlantillaDocumento>[];
        presentantes?: Partial<Presentante>[];
        representantes?: Partial<RepresentanteLegal>[];
        perfiles?: Partial<PerfilGestor>[];
        templates?: Partial<MessageTemplate>[];
    }): Promise<void> {
        if (payload.clientes && payload.clientes.length > 0) {
            await this.maestrosSyncRepo.upsertClientes(tx, payload.clientes);
        }
        if (payload.vehiculos && payload.vehiculos.length > 0) {
            await this.maestrosSyncRepo.upsertVehiculos(tx, payload.vehiculos);
        }
        if (payload.empresasGestoras && payload.empresasGestoras.length > 0) {
            await this.maestrosSyncRepo.upsertEmpresasGestoras(tx, payload.empresasGestoras);
        }
        if (payload.plantillas && payload.plantillas.length > 0) {
            await this.maestrosSyncRepo.upsertPlantillasDocumentos(tx, payload.plantillas);
        }
        if (payload.presentantes && payload.presentantes.length > 0) {
            await this.maestrosSyncRepo.upsertPresentantes(tx, payload.presentantes);
        }
        if (payload.representantes && payload.representantes.length > 0) {
            await this.maestrosSyncRepo.upsertRepresentantesLegales(tx, payload.representantes);
        }
        if (payload.perfiles && payload.perfiles.length > 0) {
            await this.maestrosSyncRepo.upsertPerfilesGestor(tx, payload.perfiles);
        }
        if (payload.templates && payload.templates.length > 0) {
            await this.maestrosSyncRepo.upsertMessageTemplates(tx, payload.templates);
        }
    }

    /**
     * Obtiene lotes cerrados de datos maestros para evitar saturación de RAM (OOM).
     */
    async pull(cursorTimestamp: Date, lastId: string, limit: number) {
        this.logger.debug(`Ejecutando pull secuencial de datos maestros.`);

        const [
            clientes,
            vehiculos,
            empresasGestoras,
            plantillas,
            presentantes,
            representantes,
            perfiles,
            templates,
        ] = await Promise.all([
            this.maestrosSyncRepo.fetchClientesCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchVehiculosCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchEmpresasGestorasCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchPlantillasCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchPresentantesCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchRepresentantesCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchPerfilesGestorCursor(cursorTimestamp, lastId, limit),
            this.maestrosSyncRepo.fetchMessageTemplatesCursor(cursorTimestamp, lastId, limit),
        ]);

        return {
            clientes,
            vehiculos,
            empresasGestoras,
            plantillas,
            presentantes,
            representantes,
            perfiles,
            templates,
        };
    }
}