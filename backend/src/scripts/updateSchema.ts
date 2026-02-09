import { pool } from '../config/db';

const updateSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('Checking and updating schema...');

        // Add fee_frequency to students
        await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS fee_frequency VARCHAR(50) DEFAULT 'Monthly';
    `);

        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        process.exit();
    }
};

updateSchema();
