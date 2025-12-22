import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { traceId: string }>();

    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof Error) {
          const { method, url } = request;
          const traceId = request.traceId || 'N/A';

          // Can be extended to log to external monitoring services
          this.logger.debug(
            `[TraceID: ${traceId}] ${method} ${url} : ${err.message}`,
          );
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
