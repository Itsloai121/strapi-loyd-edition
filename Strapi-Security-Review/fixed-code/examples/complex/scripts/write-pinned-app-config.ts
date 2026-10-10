/**
 * Version-agnostic configs for pinned published Strapi apps.
 *
 * The live examples/complex/config/*.ts targets the monorepo (new types / helpers
 * like isDatabaseClientKind, admin.flags.docLinks). Those break compileStrapi when
 * the app depends on an older npm release (e.g. 5.30.0).
 *
 * These are untyped .ts so `compileStrapi` emits them into dist/config (Strapi loads
 * config from dist/, not the source config/ folder).
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILES = {
  'database.ts': `import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    mysql: {
      client: 'mysql',
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    postgres: {
      client: 'postgres',
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      client: 'sqlite',
      connection: {
        filename: (() => {
          const f = env('DATABASE_FILENAME', path.join('.tmp', 'data.db'));
          return path.isAbsolute(f) ? f : path.join(process.cwd(), f);
        })(),
      },
      useNullAsDefault: true,
    },
  };

  if (!connections[client]) {
    throw new Error(
      \`Unsupported DATABASE_CLIENT: \${client}. Use "postgres", "mysql", or "sqlite".\`
    );
  }

  if (client !== 'sqlite' && !env('DATABASE_PASSWORD') && !(client === 'postgres' && env('DATABASE_URL'))) throw new Error('DATABASE_PASSWORD or a PostgreSQL DATABASE_URL is required');

  return {
    connection: {
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
`,

  'server.ts': `export default ({ env }) => ({
  host: env('HOST', '127.0.0.1'),
  port: env.int('PORT', 1337),
  app: {
    keys: (() => { const keys = env.array('APP_KEYS', []); if (keys.length < 2 || keys.some((key: string) => typeof key !== 'string' || key.length < 32)) throw new Error('APP_KEYS requires at least two independent 32-character keys'); return keys; })(),
  },
  transfer: {
    remote: {
      enabled: true,
    },
  },
});
`,

  'admin.ts': `export default ({ env }) => ({
  auth: {
    secret: (() => { const value = env('ADMIN_JWT_SECRET'); if (typeof value !== 'string' || value.length < 32) throw new Error('ADMIN_JWT_SECRET must contain at least 32 characters'); return value; })(),
  },
  apiToken: {
    salt: (() => { const value = env('API_TOKEN_SALT'); if (typeof value !== 'string' || value.length < 32) throw new Error('API_TOKEN_SALT must contain at least 32 characters'); return value; })(),
  },
  secrets: {
    encryptionKey: (() => { const value = env('ENCRYPTION_KEY'); if (typeof value !== 'string' || value.length < 32) throw new Error('ENCRYPTION_KEY must contain at least 32 characters'); return value; })(),
  },
  transfer: {
    token: {
      salt: (() => { const value = env('TRANSFER_TOKEN_SALT'); if (typeof value !== 'string' || value.length < 32) throw new Error('TRANSFER_TOKEN_SALT must contain at least 32 characters'); return value; })(),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
`,

  'api.ts': `export default {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
};
`,

  'middlewares.ts': `export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
`,

  'plugins.ts': `export default () => ({});
`,

  'features.ts': `export default () => ({});
`,
};

/**
 * Write pinned-app configs into `appRoot/config`, replacing any copied configs.
 * @param {string} appRoot
 */
function writePinnedAppConfig(appRoot) {
  const configDir = path.join(appRoot, 'config');
  fs.mkdirSync(configDir, { recursive: true });

  for (const entry of fs.readdirSync(configDir)) {
    if (/\.(ts|js|mjs|cjs)$/.test(entry)) {
      fs.unlinkSync(path.join(configDir, entry));
    }
  }

  for (const [filename, contents] of Object.entries(CONFIG_FILES)) {
    fs.writeFileSync(path.join(configDir, filename), contents);
  }
}

module.exports = { writePinnedAppConfig, CONFIG_FILES };
