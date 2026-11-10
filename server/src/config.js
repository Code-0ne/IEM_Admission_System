import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },

  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    sessionMaxAgeMs: Number(process.env.SESSION_MAX_AGE_MS) || 7200000, // 2 hours
    tokenSecret: process.env.TOKEN_SECRET || 'dev-token-secret',
    lockoutAttempts: 5,
    lockoutDurationMinutes: 15,
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || 'noreply@iem.edu.in',
    pass: process.env.SMTP_PASS || '',
  },

  payment: {
    key: process.env.PAYMENT_GATEWAY_KEY || '',
    secret: process.env.PAYMENT_GATEWAY_SECRET || '',
  },

  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    apiUrl: process.env.LLM_API_URL || 'http://localhost:11434/v1',
  },
};

export default config;
