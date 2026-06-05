import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5173;

app.use(express.json());

const apiHandlers = {
  "/api/send-otp": "./api/send-otp.js",
  "/api/verify-otp": "./api/verify-otp.js",
  "/api/check-user": "./api/check-user.js",
};

Object.entries(apiHandlers).forEach(([route, handlerPath]) => {
  app.all(route, async (req, res, next) => {
    try {
      const handlerModule = await import(handlerPath);
      return handlerModule.default(req, res);
    } catch (error) {
      next(error);
    }
  });
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: "ssr" },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const indexHtmlPath = path.resolve(__dirname, "index.html");
      let html = fs.readFileSync(indexHtmlPath, "utf-8");
      html = await vite.transformIndexHtml(url, html);
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });

  app.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});