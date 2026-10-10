import type { Core } from '@strapi/strapi';

const adminConfig = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: (() => { const value = env('ADMIN_JWT_SECRET'); if (typeof value !== 'string' || value.length < 32) throw new Error('ADMIN_JWT_SECRET must contain at least 32 characters'); return value; })(),
  },
  apiToken: {
    salt: (() => { const value = env('API_TOKEN_SALT'); if (typeof value !== 'string' || value.length < 32) throw new Error('API_TOKEN_SALT must contain at least 32 characters'); return value; })(),
  },
  transfer: {
    token: {
      salt: (() => { const value = env('TRANSFER_TOKEN_SALT'); if (typeof value !== 'string' || value.length < 32) throw new Error('TRANSFER_TOKEN_SALT must contain at least 32 characters'); return value; })(),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default adminConfig;
