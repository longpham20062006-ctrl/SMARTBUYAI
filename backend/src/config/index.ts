import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://smartbuy:smartbuy_secret_password@localhost:5432/smartbuy_fashion',
  jwtSecret: process.env.JWT_SECRET || 'smartbuy_super_secure_jwt_secret_key_2026',
  aiServerUrl: process.env.AI_SERVER_URL || 'http://127.0.0.1:8000',
};

