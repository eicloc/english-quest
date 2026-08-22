#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => index % 2 === 0 ? [...pairs, [value.replace(/^--/, ""), all[index + 1]]] : pairs, []));
const port = Number(args.port ?? 4173);
const basePath = String(args["base-path"] ?? "").replace(/\/$/, "");
const outputRoot = resolve(args.dir ?? "out");
const mimeTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".wasm": "application/wasm", ".ico": "image/x-icon", ".webp": "image/webp" };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (basePath && !url.pathname.startsWith(`${basePath}/`) && url.pathname !== basePath) {
      response.writeHead(url.pathname === "/" ? 302 : 404, url.pathname === "/" ? { location: `${basePath}/` } : undefined);
      response.end();
      return;
    }
    let pathname = decodeURIComponent(basePath ? url.pathname.slice(basePath.length) : url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = resolve(outputRoot, `.${pathname}`);
    if (filePath !== outputRoot && !filePath.startsWith(`${outputRoot}${sep}`)) throw new Error("Invalid path");
    const fileStat = await stat(filePath);
    const finalPath = fileStat.isDirectory() ? resolve(filePath, "index.html") : filePath;
    response.writeHead(200, { "content-type": mimeTypes[extname(finalPath)] ?? "application/octet-stream", "cache-control": "no-store" });
    response.end(await readFile(finalPath));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Static export: http://127.0.0.1:${port}${basePath}/`));
