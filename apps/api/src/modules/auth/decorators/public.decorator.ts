import { SetMetadata } from '@nestjs/common';

export const isPublicRouteKey = 'isPublicRoute';
export const Public = () => SetMetadata(isPublicRouteKey, true);
export const Private = () => SetMetadata(isPublicRouteKey, false);
