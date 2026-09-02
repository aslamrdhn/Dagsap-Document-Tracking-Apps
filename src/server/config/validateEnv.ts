import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  REDIS_URL: z.string().optional(),
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const validateEnv = () => {
  // We can skip validation if running purely unit tests without full env setup
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Environment variable validation failed');
  }
};
