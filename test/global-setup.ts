import { DataSource } from 'typeorm';
import AppDataSource from '../src/data-source';

export default async function globalSetup() {
  const dataSource: DataSource = await AppDataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
