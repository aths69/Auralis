import { serve } from "@hono/node-server";
import serverEntry from "./dist/server/server.js";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Starting Node server on port ${port}...`);

serve({
  fetch: serverEntry.default ? serverEntry.default.fetch : serverEntry.fetch,
  port,
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
