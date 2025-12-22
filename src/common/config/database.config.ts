import path from 'node:path';
import { type DataSourceOptions } from 'typeorm';
import { env } from './env.config';

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: env.get<string>('DB_HOST', 'localhost'),
  port: env.get<number>('DB_PORT', 5432),
  username: env.get<string>('DB_USERNAME', 'postgres'),
  password: env.get<string>('DB_PASSWORD', 'postgres'),
  database: env.get<string>('DB_NAME', 'postgres'),
  entities: [path.resolve(__dirname + '/../../**/*.orm-entity{.ts,.js}')],
  migrations: [path.resolve(__dirname + '/../../**/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
};
