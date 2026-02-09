import { pool } from '../config/db';

const updateSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('Adding password column to students table...');

        // Add password column to students (for admin reference of plain text)
        await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
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
