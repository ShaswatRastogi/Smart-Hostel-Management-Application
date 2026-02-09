
import { pool } from '../config/db';

async function addCollegeEmailColumn() {
    const client = await pool.connect();
    try {
        console.log('Checking for college_email column...');

        // Check if column exists
        const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='students' AND column_name='college_email'
        `);

        if (checkRes.rows.length === 0) {
            console.log('Adding college_email column...');
            await client.query(`
                ALTER TABLE students 
                ADD COLUMN college_email VARCHAR(255)
            `);
            console.log('✅ college_email column added successfully');
        } else {
            console.log('ℹ️ college_email column already exists');
        }

    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        client.release();
        process.exit();
    }
}

addCollegeEmailColumn();
