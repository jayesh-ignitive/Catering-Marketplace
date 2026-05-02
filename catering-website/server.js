/**
 * Custom Next server. Loads `.env` before `next` so `PORT` and server-side env
 * are set. For the browser, `NEXT_PUBLIC_*` values are baked in at `next build`
 * — run build on the server (or CI) with the same `.env` / env vars you use in production.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
