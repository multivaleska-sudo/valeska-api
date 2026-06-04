# 🚀 Valeska API - Enterprise Sync Engine & Backend

**Valeska API** es una plataforma backend distribuida de alto rendimiento diseñada para orquestar la sincronización de datos masivos entre múltiples sucursales offline y una base de datos PostgreSQL centralizada.

El sistema está construido bajo los más estrictos estándares de:

* Site Reliability Engineering (SRE)
* Domain-Driven Design (DDD)
* Arquitectura Hexagonal (Ports & Adapters)
* Alta disponibilidad
* Tolerancia a fallos
* Sincronización distribuida

---

# 🏗️ Arquitectura y Principios de Diseño

El motor de sincronización de **Valeska API** ha sido diseñado para garantizar resiliencia extrema en entornos de alta concurrencia y tolerancia a cortes de red prolongados.

## Arquitectura Hexagonal

Desacoplamiento absoluto entre dominio e infraestructura.

Los servicios consumen contratos abstractos:

```ts
ITramitesSyncRepository
```

Mientras que la capa de infraestructura implementa dichos contratos mediante adaptadores TypeORM.

---

## Paginación Indexada O(log N)

Se elimina completamente el uso de:

```sql
OFFSET
```

Todas las descargas utilizan cursores compuestos basados en índices B-Tree:

```sql
(updatedAt ASC, id ASC)
```

Beneficios:

* Escalabilidad masiva
* Respuesta consistente
* Rendimiento estable incluso con millones de registros
* Consultas logarítmicas

---

## Protección contra Out Of Memory (OOM)

Las sincronizaciones masivas utilizan el protocolo:

### Polymorphic Chunking

Los registros son procesados en bloques controlados.

Beneficios:

* Heap estable
* Menor presión sobre el Garbage Collector
* Consumo de memoria constante
* Procesamiento seguro de millones de registros

---

## Protección Multidispositivo (1:N)

Un mismo operador puede trabajar simultáneamente desde múltiples terminales.

La autorización se realiza mediante:

* JWT
* Dirección MAC del dispositivo
* Validaciones asíncronas

Esto evita:

* Bloqueos de sesión
* Conflictos lógicos
* Desconexiones innecesarias

---

## Mitigación de Límites de Cloudflare

Todos los procesos de sincronización se fragmentan automáticamente en bloques controlados.

Objetivo:

* Nunca superar el límite de 100 MB por request
* Evitar rechazos del WAF
* Mantener estabilidad en redes lentas

---

# 📂 Estructura del Proyecto

```text
valeska-api/
│
├── src/
│   │
│   ├── app.module.ts
│   ├── app.controller.ts
│   │
│   ├── auth/
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── db/
│   │
│   ├── sync/
│   │   ├── domain/
│   │   │   └── ports/
│   │   │
│   │   ├── infrastructure/
│   │   │
│   │   ├── services/
│   │   │
│   │   └── entities/
│   │
│   └── tramites/
│
└── docker-compose.yml
```

## Descripción de Carpetas

| Carpeta          | Responsabilidad                           |
| ---------------- | ----------------------------------------- |
| `auth`           | Seguridad, autenticación y autorización   |
| `db`             | Configuración TypeORM y migraciones       |
| `sync`           | Motor principal de sincronización         |
| `tramites`       | Entidades del dominio de negocio          |
| `services`       | Casos de uso desacoplados                 |
| `ports`          | Interfaces de persistencia                |
| `infrastructure` | Adaptadores TypeORM, DTOs e interceptores |

---

# 🛠️ Requisitos Previos

## Node.js

```bash
v18.x o superior
```

## Base de Datos

```bash
PostgreSQL 14+
```

## Contenedores

```bash
Docker
Docker Compose
```

## Gestor de paquetes

```bash
npm
```

o

```bash
yarn
```

---

# 🚀 Instalación y Configuración

## 1. Clonar repositorio

```bash
git clone https://github.com/tu-organizacion/valeska-api.git

cd valeska-api
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Configurar variables de entorno

Crear un archivo:

```env
.env
```

Contenido:

```env
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=ingresa_una_clave_secreta_de_alta_entropia
JWT_EXPIRES_IN=12h

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=valeska_db
```

---

## 4. Levantar PostgreSQL

```bash
docker-compose up -d
```

---

## 5. Ejecutar migraciones

```bash
npm run typeorm migration:run
```

---

# 🚦 Ejecución del Servidor

## Desarrollo

```bash
npm run start:dev
```

---

## Producción

```bash
npm run build

npm run start:prod
```

---

# 📡 Endpoints Principales

## Telemetría y Salud del Sistema

### GET /

Retorna:

* Estado de PostgreSQL
* Uso de CPU
* Consumo de Heap
* Uptime
* Métricas SRE

---

### GET /health

Endpoint de verificación para:

* Kubernetes
* AWS ECS
* Docker Swarm
* Balanceadores

Respuesta:

```json
{
  "status": "ok"
}
```

---

# 🔐 Autenticación

## POST /auth/login

Valida credenciales y genera JWT.

### Request

```json
{
  "email": "admin@empresa.com",
  "password": "********"
}
```

---

## POST /auth/register

Registro de usuarios.

Características:

* Bcrypt
* Hash seguro
* Protección contra contraseñas débiles

---

## POST /auth/reset-code

Genera códigos criptográficamente seguros.

Internamente utiliza:

```ts
crypto.randomInt()
```

Ejemplo:

```json
{
  "code": "381942"
}
```

---

# 🔄 Motor de Sincronización Distribuida

Todos los endpoints requieren:

```http
x-user-id
x-device-mac
Authorization: Bearer JWT
```

---

## POST /sync/push

Recibe lotes de sincronización.

### DTO

```ts
PushSyncChunkDto
```

### Características

* Hasta 1000 registros por chunk
* UPSERT atómico
* Resolución automática de conflictos
* Transacciones seguras

Implementación basada en:

```sql
ON CONFLICT DO UPDATE
```

---

## GET /sync/pull

Descarga cambios pendientes.

### Query Params

```http
cursorTimestamp
lastId
limit
entityName
```

Ejemplo:

```http
GET /sync/pull?
cursorTimestamp=2026-01-01T00:00:00Z&
lastId=1200&
limit=500&
entityName=tramites
```

### Beneficios

* Consumo controlado de RAM
* Paginación logarítmica
* Compatible con millones de registros

---

# 🛡️ Observabilidad y Trazabilidad

## Trace IDs

Todo el flujo HTTP es monitoreado mediante:

```ts
SreTraceInterceptor
```

---

## Flujo

Cada petición:

1. Genera un Trace ID
2. Lo registra en logs
3. Lo devuelve al cliente

Header:

```http
X-Trace-Id
```

---

## Monitoreo de Latencia

El interceptor detecta bloqueos del Event Loop.

Si una petición excede:

```text
300ms
```

Se genera automáticamente:

```log
WARN - Critical Latency Detected
```

Permitendo:

* Diagnóstico rápido
* Detección temprana de cuellos de botella
* Monitoreo SRE continuo

---

# 📈 Características Técnicas

* Arquitectura Hexagonal
* Domain Driven Design
* TypeORM
* PostgreSQL
* JWT Authentication
* Bcrypt
* Docker
* Observabilidad SRE
* Paginación por Cursor
* UPSERT Atómico
* Sincronización Offline-First
* Chunking Inteligente
* Escalabilidad Horizontal
* Multi-Sucursal
* Multi-Dispositivo
* Cloudflare Friendly

---

# 🏛️ Filosofía del Proyecto

Valeska API fue diseñado para operar en escenarios empresariales donde la continuidad operativa es crítica.

La plataforma prioriza:

* Disponibilidad
* Consistencia
* Resiliencia
* Escalabilidad
* Observabilidad

permitiendo sincronizar grandes volúmenes de información transaccional incluso bajo condiciones de conectividad limitada o intermitente.

---

## © Valeska API

**Enterprise Sync Engine & Distributed Backend Platform**

Construido para soportar procesamiento masivo de datos transaccionales con estándares modernos de ingeniería de software.
