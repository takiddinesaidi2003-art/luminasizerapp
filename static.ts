import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // sw.js and manifest.json must NEVER be cached by the browser so updates
  // propagate immediately. A stale cached SW is the #1 cause of "site stops
  // working after second visit" bugs.
  app.get("/sw.js", (_req, res) => {
    res.set({
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  app.get("/manifest.json", (_req, res) => {
    res.set({
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store, no-cache",
    });
    res.sendFile(path.resolve(distPath, "manifest.json"));
  });

  // All other static assets (JS/CSS bundles have fingerprinted names → safe to cache)
  app.use(
    express.static(distPath, {
      maxAge: "1y",
      immutable: true,
      index: false, // we handle index ourselves below
    })
  );

  // SPA catch-all: serve index.html for any route the client router handles
  app.use("/{*path}", (_req, res) => {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
