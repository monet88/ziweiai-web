import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const requestIdHeader = 'x-request-id';
export interface RequestWithRequestId extends Request {
  requestId?: string;
}

const safeRequestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

function resolveRequestId(rawRequestId: string | undefined): string {
  const requestId = rawRequestId?.trim();

  if (requestId && safeRequestIdPattern.test(requestId)) {
    return requestId;
  }

  return randomUUID();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestId = resolveRequestId(request.header(requestIdHeader));

    (request as RequestWithRequestId).requestId = requestId;
    response.setHeader(requestIdHeader, requestId);
    next();
  }
}
