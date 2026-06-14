import type { AuthenticatedUser } from '@ziweiai/contracts';
import type { RequestWithRequestId } from '../../../common/request-id.middleware';

export interface AuthenticatedRequest extends RequestWithRequestId {
  authenticatedUser?: AuthenticatedUser;
}
