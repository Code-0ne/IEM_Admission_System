import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './errors.js';
import { probeSupabase } from './db/supabase.js';
import { probeGridFS } from './db/gridfs.js';
import authRouter from './modules/auth/routes.js';
import coursesRouter from './modules/courses/routes.js';
import { applicationsRouter, adminApplicationsRouter } from './modules/applications/routes.js';
import { authenticate } from './middleware/auth.js';
import { requireAdmin } from './middleware/rbac.js';

export const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration (restricted to client origin with cookie credentials)
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

// Cookie parsing
app.use(cookieParser(config.auth.sessionSecret));

// JSON body parser with size limit
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const [supabaseStatus, gridfsStatus] = await Promise.all([
      probeSupabase(),
      probeGridFS(),
    ]);

    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      services: {
        supabase: supabaseStatus,
        mongodb_gridfs: gridfsStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Root / API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'UEM Admission Management System API',
    version: '0.1.0',
    documentation: '/api/docs',
  });
});

// Mount Module 1: Auth router
app.use('/api/auth', authRouter);

// Mount Courses catalogue
app.use('/api/courses', coursesRouter);

// Mount Module 2 & 3: Applications & Document management
app.use('/api/applications', applicationsRouter);
app.use('/api/admin/applications', adminApplicationsRouter);

// Protected Admin Ping (sample endpoint to verify RBAC)
app.get('/api/admin/ping', authenticate, requireAdmin, (req, res) => {
  res.json({
    status: 'ok',
    message: 'Admin access granted',
    adminId: req.user.id,
    role: req.user.role,
  });
});

// 404 handler for unknown routes under /api and root
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler
app.use(errorHandler);

export default app;
