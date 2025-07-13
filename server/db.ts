// db.ts
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
import * as schema from "@shared/mysql-schema";

dotenv.config();

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mesetudeskp',
  database: process.env.DB_NAME || 'sheamarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(pool, { 
  schema,
  mode: 'default',
  logger: process.env.NODE_ENV === 'development'
});