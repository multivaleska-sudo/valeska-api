import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';

/**
 * Interceptor de Monitoreo y Confiabilidad (SRE).
 * - Genera un Trace ID único por petición para trazabilidad en logs distribuídos.
 * - Registra métricas de rendimiento y genera alertas ante latencias de CPU.
 */
@Injectable()
export class SreTraceInterceptor implements NestInterceptor {
    private readonly logger = new Logger('SRE-Observabilidad');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();

        const traceId = request.headers['x-trace-id'] || crypto.randomUUID();
        request.traceId = traceId;

        response.setHeader('X-Trace-Id', traceId);

        const startTime = process.hrtime();

        return next.handle().pipe(
            tap({
                next: () => {
                    const diff = process.hrtime(startTime);
                    const responseTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

                    if (parseFloat(responseTimeMs) > 300) {
                        this.logger.warn(
                            `⚠️ [LATENCIA CRÍTICA DETECTADA] URL: ${request.url} | Trace ID: ${traceId} | Latencia: ${responseTimeMs}ms | Event Loop recargado.`,
                        );
                    } else {
                        this.logger.log(
                            `⏱️ [RENDIMIENTO OK] URL: ${request.url} | Trace ID: ${traceId} | Latencia: ${responseTimeMs}ms`,
                        );
                    }
                },
                error: (err) => {
                    const diff = process.hrtime(startTime);
                    const responseTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

                    this.logger.error(
                        `🚨 [FALLO CRÍTICO] URL: ${request.url} | Trace ID: ${traceId} | Tiempo de Falla: ${responseTimeMs}ms | Mensaje: ${err.message}`,
                    );
                },
            }),
        );
    }
}