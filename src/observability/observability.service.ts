import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class ObservabilityService {
  private readonly registry = new Registry();
  private readonly syncPushJobsTotal: Counter<string>;
  private readonly syncPushJobDuration: Histogram<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly queueWaiting: Gauge<string>;
  private readonly queueActive: Gauge<string>;
  private readonly queueFailed: Gauge<string>;

  constructor() {
    this.registry.setDefaultLabels({ app: 'valeska-api' });
    collectDefaultMetrics({ register: this.registry });

    this.syncPushJobsTotal = new Counter({
      name: 'sync_push_jobs_total',
      help: 'Total de jobs de push sync procesados por entidad y estado',
      labelNames: ['entity', 'status'],
      registers: [this.registry],
    });

    this.syncPushJobDuration = new Histogram({
      name: 'sync_push_job_duration_seconds',
      help: 'Duracion de procesamiento de jobs push sync',
      labelNames: ['entity'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duracion de requests HTTP',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.queueWaiting = this.createQueueGauge('sync_push_queue_waiting', 'Jobs sync-push esperando');
    this.queueActive = this.createQueueGauge('sync_push_queue_active', 'Jobs sync-push activos');
    this.queueFailed = this.createQueueGauge('sync_push_queue_failed', 'Jobs sync-push fallidos');
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  observeHttpRequest(method: string, route: string, status: number, durationSeconds: number): void {
    this.httpRequestDuration.observe({ method, route, status: String(status) }, durationSeconds);
  }

  incrementSyncPushJob(entity: string, status: string): void {
    this.syncPushJobsTotal.inc({ entity, status });
  }

  startSyncPushTimer(entity: string): () => number {
    return this.syncPushJobDuration.startTimer({ entity });
  }

  setSyncPushQueueCounts(counts: { waiting?: number; active?: number; failed?: number }): void {
    if (typeof counts.waiting === 'number') this.queueWaiting.set(counts.waiting);
    if (typeof counts.active === 'number') this.queueActive.set(counts.active);
    if (typeof counts.failed === 'number') this.queueFailed.set(counts.failed);
  }

  private createQueueGauge(name: string, help: string): Gauge<string> {
    return new Gauge({
      name,
      help,
      registers: [this.registry],
    });
  }
}
