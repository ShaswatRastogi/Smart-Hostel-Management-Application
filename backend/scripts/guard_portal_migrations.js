const { Pool } = require('pg');
require('dotenv').config();

const queries = `
    -- Add qr_code to leave_requests if it doesn't exist
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);

    -- Add campus_status to students if it doesn't exist
    ALTER TABLE students ADD COLUMN IF NOT EXISTS campus_status VARCHAR(20) DEFAULT 'in_campus';

    -- Create student_movements table
    CREATE TABLE IF NOT EXISTS student_movements (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        movement_type VARCHAR(10) NOT NULL, -- 'in', 'out'
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recorded_by INTEGER REFERENCES users(id) -- guard user ID
    );
`;

async function runMigration(pool, name) {
    try {
        console.log(`Running migration on ${name}...`);
        await pool.query(queries);
        console.log(`✅ Migration successful on ${name}`);
    } catch (err) {
        console.error(`❌ Migration failed on ${name}:`, err.message);
    }
}

async function main() {
    // 1. Supabase
    if (process.env.DATABASE_URL) {
        const supabasePool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await runMigration(supabasePool, 'Supabase DB');
        await supabasePool.end();
    } else {
        console.log("No DATABASE_URL found for Supabase.");
    }

    // 2. Local Database
    if (process.env.DB_NAME && process.env.DB_USER) {
        const localPool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
        await runMigration(localPool, 'Local DB');
        await localPool.end();
    } else {
        console.log("No Local DB credentials found.");
    }
}

main();
