import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'postgres',
  entities: [User],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  // Only enable SSL when explicitly requested by env.
  // (Some local/docker Postgres setups reject SSL, even in NODE_ENV=production.)
  ssl: (() => {
    const raw = (process.env.DATABASE_SSL ?? '').trim().toLowerCase();
    const enabled = raw === '1' || raw === 'true' || raw === 'yes';
    return enabled ? { rejectUnauthorized: false } : false;
  })(),
});
