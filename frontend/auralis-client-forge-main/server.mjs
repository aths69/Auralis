import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import serverEntry from "./dist/server/server.js";

const app = new Hono();

// 1. Serve static files from the client build directory first
app.use("/*", serveStatic({ root: "./dist/client" }));

// 2. Fallback all other requests to TanStack Start's SSR handler
app.all("*", (c) => {
  const handler = serverEntry.default ? serverEntry.default.fetch : serverEntry.fetch;
  return handler(c.req.raw, process.env, undefined);
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Starting Node server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
