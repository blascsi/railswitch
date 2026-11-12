import type { Connect, Plugin } from "vite";

const DEV_DEFAULTS = { FRONTEND_API_URL: "http://localhost:4000/gql" };

export function serveFrontendEnv(): Plugin {
  const serveConfig: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.split("?")[0] !== "/config.js") {
      next();
      return;
    }

    const frontendEnv = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key, value]) => key.startsWith("FRONTEND_") && value !== "",
      ),
    );

    res.setHeader("Content-Type", "text/javascript");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      `window.__ENV__ = ${JSON.stringify({ ...DEV_DEFAULTS, ...frontendEnv })};`,
    );
  };

  return {
    name: "serve-frontend-env",
    configureServer(server) {
      server.middlewares.use(serveConfig);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveConfig);
    },
  };
}
