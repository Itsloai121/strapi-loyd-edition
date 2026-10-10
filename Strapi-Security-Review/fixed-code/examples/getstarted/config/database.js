'use strict';

// Retain DB selection compatibility while avoiding checked-in SQL credentials.
module.exports = ({ env }) => {
  const client = env('DB', 'sqlite');
  if (client === 'sqlite') {
    return { connection: { client: 'sqlite', connection: { filename: env('DATABASE_FILENAME', '.tmp/data.db') }, useNullAsDefault: true } };
  }
  const defaults = { postgres: 5432, mysql: 3306, mariadb: 3307 };
  if (!Object.prototype.hasOwnProperty.call(defaults, client)) throw new Error('Unsupported DB client');
  const password = env('DATABASE_PASSWORD');
  if (!password) throw new Error('DATABASE_PASSWORD is required for SQL databases');
  const port = env.int('DATABASE_PORT', defaults[client]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DATABASE_PORT must be 1-65535');
  return { connection: { client: client === 'mariadb' ? 'mysql' : client, connection: {
    database: env('DATABASE_NAME', 'strapi'), user: env('DATABASE_USERNAME', 'strapi'), password,
    port, host: env('DATABASE_HOST', '127.0.0.1'),
  } } };
};
