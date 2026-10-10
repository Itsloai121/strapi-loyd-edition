import type { Core } from '@strapi/strapi';

const serverConfig = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '127.0.0.1'),
  port: env.int('PORT', 1337),
  app: {
    keys: (() => { const keys = env.array('APP_KEYS', []); if (keys.length < 2 || keys.some((key: string) => typeof key !== 'string' || key.length < 32)) throw new Error('APP_KEYS requires at least two independent 32-character keys'); return keys; })(),
  },
});

export default serverConfig;
