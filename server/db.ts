import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';

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

// Créez l'instance drizzle avec le schéma typé
export const db = drizzle(pool);