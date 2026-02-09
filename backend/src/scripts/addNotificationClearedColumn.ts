import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { pool } from '../config/db';

async function run() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Add last_notifications_cleared_at to students table');

        await client.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS last_notifications_cleared_at BIGINT DEFAULT 0;
        `);

        console.log('✅ Migration successful');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

run();
