import { DataSource } from 'typeorm';
import AppDataSource from '../src/data-source';

export default async function globalTeardown() {
  const dataSource: DataSource = await AppDataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.destroy();
}
