import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@ziweiai/contracts';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.authenticatedUser) {
    throw new Error('Authenticated user was not attached to the request.');
  }

  return request.authenticatedUser;
});
