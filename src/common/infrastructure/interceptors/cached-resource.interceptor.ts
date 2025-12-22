import { env } from '../../../common/config/env.config';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CachedResourceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CachedResourceInterceptor.name);
  readonly traceLogsEnabled: boolean = false;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.traceLogsEnabled = env.get<boolean>('ENABLE_CACHE_TRACE_LOGS', false);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    const cached = await this.cacheManager.get(req.url);
    if (cached) {
      // Interceptor used only for GET requests, so it's safe to return
      // cached response directly, __for now__.
      if (this.traceLogsEnabled) {
        this.logger.debug(`Cache hit for ${req.url}`);
      }
      return of(cached);
    }
    return next.handle();
  }
}
