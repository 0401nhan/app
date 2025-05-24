require('dotenv').config();
const next = require('next');
const http = require('http');

const createDatabase = require('./createDataBase');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';

async function start() {
  try {
    // 1. Tạo database (nếu chưa có)
    await createDatabase();

    // 2. Chuẩn bị Next.js app
    const app = next({ dev });
    const handle = app.getRequestHandler();

    await app.prepare();

    // 3. Tạo HTTP server
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, () => {
      console.log(`> Server ready at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
