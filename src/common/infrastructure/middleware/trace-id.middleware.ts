import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request & { traceId?: string }, res: Response, next: () => void) {
    // Generate a trace ID if not already present
    req.traceId = req.traceId ?? uuidv4();
    res.setHeader('X-Trace-Id', req.traceId);
    next();
  }
}
