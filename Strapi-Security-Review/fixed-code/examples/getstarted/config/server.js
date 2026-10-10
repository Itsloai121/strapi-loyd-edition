'use strict';

const cronTasks = require('./src/cron-tasks');

module.exports = ({ env }) => ({
  host: env('HOST', '127.0.0.1'),
  port: env.int('PORT', 1337),
  cron: {
    enabled: true,
    tasks: cronTasks,
  },
  app: {
    keys: (() => { const keys = env.array('APP_KEYS', []); if (keys.length < 2 || keys.some((key) => typeof key !== 'string' || key.length < 32)) throw new Error('APP_KEYS requires at least two independent 32-character keys'); return keys; })(),
  },
  webhooks: {
    // TODO: V5, set to false by default
    // Receive populated relations in webhook and db lifecycle payloads
    // This only populates relations in all content-manager endpoints
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', true),
  },
  // ℹ️ http_proxy is the env var used by system to set proxy globally
  proxy: {
    global: env('http_proxy'),
  },
  http: {
    serverOptions: {
      requestTimeout: 1000 * 60 * 10, // set request timeout to 600000ms (10 minutes)
    },
  },
  transfer: {
    remote: {
      // enabled: false,
    },
  },
  logger: {
    config: {
      level: 'silly',
    },
    updates: {
      // enabled: false,
    },
    startup: {
      // enabled: false,
    },
  },
  mcp: {
    enabled: true,
  },
});
