import dotenv from 'dotenv';

dotenv.config();

export const config = {
    tiktok: {
        signApiKey: process.env.TIKTOK_SIGN_API_KEY || undefined,
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'streamly_db',
    },

    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    logging: {
        level: 'info',
    }
};

export type Config = typeof config;
