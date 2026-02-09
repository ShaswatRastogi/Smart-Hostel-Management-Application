import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hostel_db',
    password: process.env.DB_PASSWORD || 'admin',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function createVisitorsTable() {
    const client = await pool.connect();

    try {
        console.log('Creating visitors table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        visitor_name VARCHAR(255) NOT NULL,
        visitor_phone VARCHAR(15) NOT NULL,
        visitor_relation VARCHAR(100),
        purpose VARCHAR(500) NOT NULL,
        room_number VARCHAR(10) NOT NULL,
        expected_date DATE NOT NULL,
        expected_time_in TIME,
        expected_time_out TIME,
        status VARCHAR(20) DEFAULT 'pending',
        admin_remarks TEXT,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        checked_in_at TIMESTAMP,
        checked_out_at TIMESTAMP,
        visitor_photo TEXT,
        id_proof_type VARCHAR(50),
        id_proof_number VARCHAR(50),
        qr_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('Creating indexes...');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visitors_student ON visitors(student_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(expected_date);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visitors_room ON visitors(room_number);
    `);

        console.log('✅ Visitors table created successfully!');
        console.log('✅ Indexes created successfully!');

        // Add comment to table
        await client.query(`
      COMMENT ON TABLE visitors IS 'Stores visitor registration and tracking information';
    `);

        await client.query(`
      COMMENT ON COLUMN visitors.status IS 'pending, approved, rejected, checked_in, checked_out, cancelled';
    `);

        console.log('✅ Table comments added!');

    } catch (error) {
        console.error('❌ Error creating visitors table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createVisitorsTable();
