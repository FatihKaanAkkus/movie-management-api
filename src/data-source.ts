import { env } from './common/config/env.config';
import { DataSource } from 'typeorm';

/**
 * Using dotenv to manage environment variables for database configuration is a temporary
 * solution. But the issue origantes from TypeORM CLI commands. @todo Later.
 */

export default new DataSource({
  type: 'postgres',
  host: env.get<string>('DB_HOST', 'localhost'),
  port: env.get<number>('DB_PORT', 5432),
  username: env.get<string>('DB_USERNAME', 'postgres'),
  password: env.get<string>('DB_PASSWORD', 'postgres'),
  database: env.get<string>('DB_NAME', 'postgres'),
  migrations: ['dist/modules/**/infrastructure/database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});
