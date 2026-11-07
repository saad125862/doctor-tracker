import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openapi } from './docs/openapi.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/index.js';

const app = express();
app.set('trust proxy', 1); // behind Render / Vercel proxies

// API docs are mounted BEFORE helmet: Swagger UI needs inline scripts that helmet's default CSP would block.
app.get('/api-docs.json', (_req, res) => res.json(openapi));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'Doctor Tracker API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', docExpansion: 'list' },
  })
);

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

// Small landing page so opening the backend URL in a browser shows something useful
app.get('/', (req, res) => {
  if (req.accepts(['json', 'html']) === 'json') return res.json({ name: 'Doctor Tracker API', status: 'ok', docs: '/api-docs' });
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doctor Tracker API</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif}
.c{max-width:460px;padding:32px;border:1px solid #243042;border-radius:16px;background:#131a24}h1{margin:0 0 6px;font-size:26px}
p{color:#8b98a5;margin:0 0 20px}a{display:inline-block;margin:0 10px 8px 0;padding:10px 16px;border-radius:11px;background:#a3e635;color:#0d1117;font-weight:700;text-decoration:none}
a.g{background:transparent;color:#e6edf3;border:1px solid #243042;font-weight:500}</style></head>
<body><div class="c"><h1>Doctor Tracker API</h1><p>The service is running. Explore and try every endpoint in the interactive docs.</p>
<a href="/api-docs">Open API docs</a><a class="g" href="/api/health">Health check</a><a class="g" href="/api-docs.json">OpenAPI JSON</a></div></body></html>`);
});
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
