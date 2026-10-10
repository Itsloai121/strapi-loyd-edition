'use strict';

const http = require('http');
const path = require('path');
const fse = require('fs-extra');

const config = {
  host: process.env.OPENAPI_HOST || '127.0.0.1',
  port: Number(process.env.OPENAPI_PORT ?? process.env.PORT ?? 1339),
};

const args = process.argv.slice(2);

if (!args[0]) {
  console.error('Missing required parameter <package-name>');
  process.exit(1);
}

async function run() {
  const openAPISpecPath = path.join(__dirname, '../../packages', args[0], 'oas.yml');
  const indexPagePath = path.join(__dirname, 'public', 'index.html');

  if (!(await fse.pathExists(openAPISpecPath))) {
    throw new Error(`No OAS configuration found at ${openAPISpecPath}`);
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/spec.yml') {
      return fse.createReadStream(openAPISpecPath).pipe(res);
    }

    return fse.createReadStream(indexPagePath).pipe(res);
  });

  const port = config.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('OPENAPI_PORT must be 1-65535');

  server.listen(port, config.host, () => {
    console.log(`Server available at http://${config.host}:${port}`);
  });
}

run().catch((error) => {
  console.log('Unexpected Error:', error);
  process.exit(1);
});
