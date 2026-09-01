import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { fixOklabScientificNotation } from "./vite-plugin-fix-oklab";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming
const ADMIN_DIRECTORY = path.join(PROJECT_ROOT, "admin");
const UPLOADS_DIRECTORY = path.join(PROJECT_ROOT, "assets", "uploads");

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".yaml": "application/x-yaml; charset=utf-8",
  ".yml": "application/x-yaml; charset=utf-8",
};

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map(entry => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

function getStaticFile(directory: string, relativePath: string) {
  const candidate = path.resolve(directory, relativePath);
  const candidateRelativePath = path.relative(directory, candidate);
  if (
    candidateRelativePath === "" ||
    candidateRelativePath === ".." ||
    candidateRelativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(candidateRelativePath)
  ) {
    return { status: 403 as const };
  }

  try {
    const realDirectory = fs.realpathSync(directory);
    const realCandidate = fs.realpathSync(candidate);
    const realCandidateRelativePath = path.relative(
      realDirectory,
      realCandidate
    );
    if (
      realCandidateRelativePath === ".." ||
      realCandidateRelativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(realCandidateRelativePath)
    ) {
      return { status: 403 as const };
    }

    if (!fs.statSync(realCandidate).isFile()) {
      return { status: 404 as const };
    }

    return { status: 200 as const, path: realCandidate };
  } catch {
    return { status: 404 as const };
  }
}

function vitePluginDecapDevAssets(): Plugin {
  return {
    name: "decap-dev-assets",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          return next();
        }

        const requestPath = req.url?.split("?", 1)[0] ?? "/";
        let directory: string;
        let relativePath: string;

        if (requestPath === "/admin") {
          res.writeHead(302, { Location: "/admin/" });
          res.end();
          return;
        }

        if (requestPath === "/admin/" || requestPath === "/admin/index.html") {
          directory = ADMIN_DIRECTORY;
          relativePath = "index.html";
        } else if (requestPath === "/admin/config.yml") {
          directory = ADMIN_DIRECTORY;
          relativePath = "config.yml";
        } else if (requestPath.startsWith("/admin/")) {
          directory = ADMIN_DIRECTORY;
          try {
            relativePath = decodeURIComponent(
              requestPath.slice("/admin/".length)
            );
          } catch {
            res.statusCode = 400;
            res.end();
            return;
          }
        } else if (requestPath.startsWith("/assets/uploads/")) {
          directory = UPLOADS_DIRECTORY;
          try {
            relativePath = decodeURIComponent(
              requestPath.slice("/assets/uploads/".length)
            );
          } catch {
            res.statusCode = 400;
            res.end();
            return;
          }
        } else {
          return next();
        }

        const file = getStaticFile(directory, relativePath);
        if (file.status !== 200) {
          res.statusCode = file.status;
          res.end();
          return;
        }

        let contents = fs.readFileSync(file.path);
        if (requestPath === "/admin/config.yml") {
          contents = Buffer.from(
            `${contents.toString("utf8").trimEnd()}\n\n# Use the working tree when the CMS is served by Vite.\nlocal_backend: true\n`,
            "utf8"
          );
        }
        res.writeHead(200, {
          "Content-Length": contents.byteLength,
          "Content-Type":
            contentTypes[path.extname(file.path).toLowerCase()] ??
            "application/octet-stream",
        });
        res.end(req.method === "HEAD" ? undefined : contents);
      });
    },
  };
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  vitePluginManusDebugCollector(),
  vitePluginDecapDevAssets(),
  fixOklabScientificNotation(), // Fix scientific notation in oklab colors
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    transformer: "postcss",
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
