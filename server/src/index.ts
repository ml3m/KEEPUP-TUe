// ============================================================
// Express Entry Point for KEEPUP Server
// TU/e CSE Master Study Planner Application
// ============================================================

import express from 'express';
import cors from 'cors';
import { getDb } from './db/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import coursesRouter from './routes/courses.js';
import planRouter from './routes/plan.js';
import settingsRouter from './routes/settings.js';
import validationRouter from './routes/validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Optional Password Protection for Public Cloud Deployments
// If APP_PASSWORD env var is set, browser prompts for password
if (process.env.APP_PASSWORD) {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' || req.path === '/api/health') return next();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic realm="KEEPUP Study Planner"');
      return res.status(401).send('Authentication required');
    }

    const auth = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString().split(':');
    const password = auth[1];

    if (password === process.env.APP_PASSWORD) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="KEEPUP Study Planner"');
    return res.status(401).send('Invalid credentials');
  });
}

// Initialize database connection & seed schema if not present
getDb();

// Mount API routes
app.use('/api/courses', coursesRouter);
app.use('/api/plan', planRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/validation', validationRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'keepup-server', timestamp: new Date().toISOString() });
});

// Serve static React client build in production if available
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving static client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 KEEPUP Server running on http://localhost:${PORT}`);
});

export default app;
