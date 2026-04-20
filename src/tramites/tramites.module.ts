import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cliente, Vehiculo, EmpresaGestora, PlantillaDocumento, RepresentanteLegal, Presentante } from './entities/maestros.entity';
import { CatalogoTipoTramite, CatalogoSituacion } from './entities/catalogos.entity';
import { Tramite, TramiteDetalle } from './entities/tramite.entity';
import { MessageTemplate } from './entities/plantillas.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Cliente,
            Vehiculo,
            EmpresaGestora,
            RepresentanteLegal,
            Presentante,
            PlantillaDocumento,
            CatalogoTipoTramite,
            CatalogoSituacion,
            Tramite,
            TramiteDetalle,
            MessageTemplate
        ])
    ],
    exports: [TypeOrmModule],
})
export class TramitesModule { }