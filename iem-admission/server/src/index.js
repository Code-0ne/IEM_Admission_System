import app from './app.js';
import config from './config.js';
import { probeSupabase } from './db/supabase.js';
import { connectGridFS, probeGridFS, closeGridFS } from './db/gridfs.js';

async function startServer() {
  console.log(`[Startup] Environment: ${config.nodeEnv}`);

  // 1. Probe Supabase PostgreSQL
  try {
    const supabaseProbe = await probeSupabase();
    if (supabaseProbe.ok) {
      console.log('✓ Supabase PostgreSQL connected and responsive');
    } else {
      console.warn(`! Supabase probe: ${supabaseProbe.message}`);
    }
  } catch (err) {
    console.warn(`! Supabase probe failed: ${err.message}`);
  }

  // 2. Connect and probe MongoDB GridFS
  if (config.mongodb.uri) {
    try {
      await connectGridFS();
      const gridfsProbe = await probeGridFS();
      if (gridfsProbe.ok) {
        console.log('✓ MongoDB GridFS connected and ready for file streaming');
      } else {
        console.warn(`! MongoDB GridFS probe: ${gridfsProbe.message}`);
      }
    } catch (err) {
      console.warn(`! MongoDB GridFS connection failed: ${err.message}`);
    }
  } else {
    console.warn('! MONGODB_URI not configured; GridFS storage in standby mode');
  }

  // 3. Start HTTP server
  const server = app.listen(config.port, () => {
    console.log(`✓ API server running on port ${config.port} (target: http://localhost:${config.port})`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await closeGridFS();
        console.log('✓ Database connections closed cleanly');
      } catch (err) {
        console.error('Error during database disconnect:', err.message);
      }
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('Forcefully terminating process after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
