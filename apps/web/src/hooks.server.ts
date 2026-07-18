import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '',
  tracesSampleRate: 0,
});

export const handleError = Sentry.handleErrorWithSentry();
