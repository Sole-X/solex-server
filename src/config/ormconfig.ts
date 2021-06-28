import { CustomLogger } from '../loaders/typeormLogger';
import { ConnectionOptions, DatabaseType } from 'typeorm';
const postgresDatabase: DatabaseType = 'mysql';
const dotEnv = require('dotenv-flow');
const logging: ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration')[] = ['error', 'warn'];

var rootDir = process.env.PWD;
dotEnv.config();

if (process.argv[0].includes('ts-node')) {
  rootDir += '/src';
} else {
  rootDir += '/dist';
}

export default {
  name: 'default',
  type: postgresDatabase,
  charset: 'utf8mb4_unicode_ci',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  logging: process.env.NODE_ENV === 'local' ? true : logging,
  logger: new CustomLogger(),
  synchronize: false,
  dropSchema: false,
  maxQueryExecutionTime: 5000,
  entities: [`${rootDir}/entities/*{.ts,.js}`],
  migrations: [`${rootDir}/migrations/*{.ts,.js}`],
  subscribers: [`${rootDir}/entities/hooks/*{.ts,.js}`],
  cli: {
    entitiesDir: `${rootDir}/entities`,
    migrationsDir: `src/migrations`,
  },
};
