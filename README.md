# Valeska API

Backend REST para Valeska ERP con autenticacion JWT, sincronizacion offline-first por chunks, outbox asincronico con BullMQ/Redis, persistencia PostgreSQL/TypeORM y observabilidad Prometheus/OpenTelemetry.

Este README esta orientado a dos usos:

- Levantar y operar la API.
- Integrar el frontend con los contratos actuales de autenticacion y sincronizacion.

## Stack

- NestJS 11
- TypeScript
- TypeORM 0.3
- PostgreSQL
- BullMQ + Redis
- JWT
- Prometheus metrics en `/metrics`
- OpenTelemetry opcional via OTLP

## Estructura Principal

```text
src/
  auth/                 Autenticacion, JWT guards, roles y reset de password
  db/                   DataSource TypeORM y migraciones
  observability/        Prometheus metrics e interceptor HTTP
  queue/                Configuracion BullMQ/Redis
  sync/
    domain/             Nombres de entidades sync y puertos
    entities/           Usuarios, dispositivos, conflictos y outbox
    infrastructure/     DTOs HTTP y adapters TypeORM
    processors/         Worker BullMQ para push asincronico
    services/           Orquestacion de sync, producer y outbox
  tramites/             Entidades operativas del ERP
```

## Configuracion

Variables principales:

```env
PORT=3001
NODE_ENV=development
REQUEST_BODY_LIMIT=10mb
CORS_ORIGINS=http://localhost:5173,tauri://localhost,http://tauri.localhost,https://tauri.localhost

JWT_SECRET=change_me
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=valeska_db
TYPEORM_LOGGING=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
SYNC_QUEUE_CONCURRENCY=5

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

OTEL_SERVICE_NAME=valeska-api
OTEL_EXPORTER_OTLP_ENDPOINT=
```

Notas:

- `OTEL_EXPORTER_OTLP_ENDPOINT` es opcional. Si no existe, la API inicia sin exportar trazas.
- `REQUEST_BODY_LIMIT` controla el limite de Express. El DTO de sync limita cada chunk a 1000 registros.
- `REDIS_HOST=redis` se usa dentro de Docker Compose.

## Instalacion y Ejecucion

```bash
npm install
npm run migration:run
npm run start:dev
```

Con Docker Compose:

```bash
docker compose up -d --build
```

El compose levanta:

- `valeska-api`
- `redis`

PostgreSQL se espera en la red externa configurada por el proyecto.

## Scripts

```bash
npm run build
npm run start:dev
npm run start:prod
npm run test
npm run test:e2e
npm run migration:run
npm run migration:revert
```

## Headers Para Frontend

Endpoints protegidos:

```http
Authorization: Bearer <access_token>
x-device-mac: <mac-del-dispositivo-autorizado>
Content-Type: application/json
```

Importante:

- El usuario se obtiene desde el JWT (`sub`).
- El frontend ya no debe enviar `x-user-id`.
- `x-device-mac` se usa como segundo factor de autorizacion contra los dispositivos asociados al usuario.

## Autenticacion

### POST `/auth/login`

Request:

```json
{
  "username": "operador01",
  "password": "secret123"
}
```

Response:

```json
{
  "access_token": "jwt",
  "user": {
    "id": "uuid",
    "username": "operador01",
    "nombreCompleto": "Operador Uno",
    "rol": "OPERADOR",
    "estaActivo": true,
    "dispositivoId": null
  }
}
```

### POST `/auth/register`

Requiere JWT de usuario `ADMIN`.

Request:

```json
{
  "username": "operador02",
  "password": "secret123",
  "nombreCompleto": "Operador Dos",
  "rol": "OPERADOR"
}
```

### POST `/auth/reset-code`

Genera un codigo temporal y lo envia por SMTP si esta configurado. La API no devuelve el codigo en la respuesta.

Request:

```json
{
  "username": "operador01"
}
```

Response:

```json
{
  "success": true,
  "message": "Si la cuenta existe, se enviara un codigo de restablecimiento valido por 15 minutos."
}
```

### POST `/auth/reset-password`

Request:

```json
{
  "username": "operador01",
  "code": "123456",
  "newPassword": "newSecret123"
}
```

Response:

```json
{
  "success": true,
  "message": "Contrasena actualizada correctamente."
}
```

## Sincronizacion Offline-First

El frontend debe tratar la sincronizacion como dos flujos separados:

- `push`: sube cambios locales por entidad y chunk. Es asincronico.
- `pull`: descarga cambios remotos por entidad y cursor. Es sincronico.

### Entidades Soportadas

Valores validos para `entityName`:

```text
tramite
tramite_detalle
catalogo_tipo_tramite
catalogo_situacion
cliente
vehiculo
empresa_gestora
plantilla_documento
presentante
representante_legal
perfil_gestor
message_template
usuario
dispositivo
sucursal
sync_conflicto
```

### POST `/sync/push`

Requiere:

```http
Authorization: Bearer <access_token>
x-device-mac: <mac>
```

Request:

```json
{
  "syncSessionId": "11111111-1111-4111-8111-111111111111",
  "entityName": "cliente",
  "chunkIndex": 0,
  "totalChunks": 3,
  "records": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "tipoDocumento": "DNI",
      "numeroDocumento": "12345678",
      "razonSocialNombres": "Juan Perez",
      "updatedAt": "2026-06-04T15:00:00.000Z",
      "syncStatus": "LOCAL_UPDATE"
    }
  ]
}
```

Response `202 Accepted`:

```json
{
  "accepted": true,
  "jobId": "outbox-uuid",
  "outboxId": "outbox-uuid",
  "syncSessionId": "11111111-1111-4111-8111-111111111111",
  "entityName": "cliente",
  "chunkIndex": 0,
  "status": "QUEUED"
}
```

Comportamiento:

- La API registra el chunk en `sync_outbox_jobs`.
- BullMQ procesa el chunk en background.
- Hay idempotencia por `(syncSessionId, entityName, chunkIndex)`.
- Reintentos: 5 intentos con backoff exponencial.
- Si el job falla definitivamente, queda en `DEAD_LETTER`.

Estados posibles:

```text
PENDING
QUEUED
PROCESSING
COMPLETED
FAILED
DEAD_LETTER
```

### GET `/sync/push-status/:outboxId`

Requiere:

```http
Authorization: Bearer <access_token>
x-device-mac: <mac>
```

Response:

```json
{
  "outboxId": "outbox-uuid",
  "jobId": "outbox-uuid",
  "syncSessionId": "11111111-1111-4111-8111-111111111111",
  "entityName": "cliente",
  "chunkIndex": 0,
  "totalChunks": 3,
  "status": "COMPLETED",
  "attempts": 1,
  "queuedAt": "2026-06-04T15:00:01.000Z",
  "processingStartedAt": "2026-06-04T15:00:02.000Z",
  "completedAt": "2026-06-04T15:00:03.000Z",
  "failedAt": null,
  "lastError": null
}
```

Uso recomendado en frontend:

1. Enviar cada chunk con `POST /sync/push`.
2. Guardar `outboxId` junto al chunk local.
3. Consultar `push-status` hasta `COMPLETED`.
4. Si queda en `FAILED`, reintentar mas tarde.
5. Si queda en `DEAD_LETTER`, mostrar accion manual o reportar soporte.

### GET `/sync/pull`

Requiere:

```http
Authorization: Bearer <access_token>
x-device-mac: <mac>
```

Query params:

| Param | Requerido | Descripcion |
| --- | --- | --- |
| `entityName` | Si | Una entidad soportada |
| `cursorTimestamp` | No | ISO timestamp del ultimo registro recibido |
| `lastId` | No | ID del ultimo registro recibido para desempate |
| `limit` | No | 1 a 100. Default: 50 |

Ejemplo:

```http
GET /sync/pull?entityName=cliente&cursorTimestamp=2026-06-04T00:00:00.000Z&lastId=22222222-2222-4222-8222-222222222222&limit=50
```

Response:

```json
{
  "entityName": "cliente",
  "records": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "tipoDocumento": "DNI",
      "numeroDocumento": "87654321",
      "razonSocialNombres": "Maria Lopez",
      "updatedAt": "2026-06-04T16:00:00.000Z",
      "deletedAt": null,
      "syncStatus": "SYNCED"
    }
  ],
  "nextCursor": {
    "cursorTimestamp": "2026-06-04T16:00:00.000Z",
    "lastId": "33333333-3333-4333-8333-333333333333"
  },
  "hasMore": false,
  "timestamp": "2026-06-04T16:00:05.000Z"
}
```

Reglas para frontend:

- Hacer pull entidad por entidad.
- Persistir cursor por entidad, no un cursor global.
- Si `hasMore=true`, repetir pull con `nextCursor`.
- Si `nextCursor=null`, conservar el cursor anterior.
- Aplicar registros con `deletedAt != null` como tombstones/eliminaciones locales.

## Flujo Recomendado De Sync En Frontend

1. Login y almacenamiento seguro de `access_token`.
2. Validar o registrar localmente la MAC autorizada del dispositivo.
3. Subir cambios locales pendientes agrupados por `entityName`.
4. Dividir cada entidad en chunks de maximo 1000 registros.
5. Enviar cada chunk con un mismo `syncSessionId`.
6. Guardar `outboxId` y consultar `push-status`.
7. Cuando los pushes criticos esten `COMPLETED`, ejecutar pulls por entidad.
8. Persistir cursores por entidad.
9. Resolver conflictos usando `sync_conflicto` cuando aparezcan.

## Salud y Observabilidad

### GET `/`

Devuelve estado general, PostgreSQL, uptime, memoria y datos de runtime.

### GET `/health`

Response:

```json
{
  "status": "UP"
}
```

### GET `/metrics`

Formato Prometheus. Incluye metricas default de Node.js y metricas de la API.

Metricas relevantes:

```text
sync_push_jobs_total{entity,status}
sync_push_job_duration_seconds{entity}
sync_push_queue_waiting
sync_push_queue_active
sync_push_queue_failed
http_request_duration_seconds{method,route,status}
```

### OpenTelemetry

Para exportar trazas, configurar:

```env
OTEL_SERVICE_NAME=valeska-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318/v1/traces
```

Si `OTEL_EXPORTER_OTLP_ENDPOINT` no existe, la API arranca normalmente sin exportador.

## Validacion Global

La API usa `ValidationPipe` global con:

```ts
whitelist: true
forbidNonWhitelisted: true
transform: true
```

Implicaciones para frontend:

- No enviar propiedades extra en DTOs.
- Enviar `limit`, `chunkIndex` y `totalChunks` como numeros.
- Enviar fechas en formato ISO8601.
- Enviar `entityName` exactamente como esta documentado.

## Migraciones

Ejecutar antes de operar una nueva version:

```bash
npm run migration:run
```

Migraciones recientes relevantes:

- Hardening de auth/sync e indices de cursor.
- Tabla `password_reset_codes`.
- Tabla `sync_outbox_jobs`.

## Consideraciones De Seguridad

- No exponer `/metrics` publicamente sin control de red.
- No enviar `x-user-id`; la identidad viene del JWT.
- No almacenar JWT en localStorage si el cliente tiene una alternativa mas segura.
- No mostrar `lastError` de outbox a usuarios finales sin sanitizar en UI.
- Rotar `JWT_SECRET` y credenciales SMTP/DB fuera del repositorio.

## Verificacion Local

```bash
npm run build
npm run test
docker compose config
```

## Contrato Rapido Para Frontend

```ts
type SyncEntityName =
  | 'tramite'
  | 'tramite_detalle'
  | 'catalogo_tipo_tramite'
  | 'catalogo_situacion'
  | 'cliente'
  | 'vehiculo'
  | 'empresa_gestora'
  | 'plantilla_documento'
  | 'presentante'
  | 'representante_legal'
  | 'perfil_gestor'
  | 'message_template'
  | 'usuario'
  | 'dispositivo'
  | 'sucursal'
  | 'sync_conflicto';

type PushResponse = {
  accepted: true;
  jobId: string | null;
  outboxId: string;
  syncSessionId: string;
  entityName: SyncEntityName;
  chunkIndex: number;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';
};

type PullResponse<T> = {
  entityName: SyncEntityName;
  records: T[];
  nextCursor: null | {
    cursorTimestamp: string;
    lastId: string;
  };
  hasMore: boolean;
  timestamp: string;
};
```
