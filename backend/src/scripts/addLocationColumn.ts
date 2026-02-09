import pool from '../config/db';

const addLocationColumn = async () => {
    const client = await pool.connect();
    try {
        console.log('Adding location column to hostel_info table...');

        await client.query(`
            ALTER TABLE hostel_info 
            ADD COLUMN IF NOT EXISTS location TEXT;
        `);

        console.log('Successfully added location column!');
    } catch (error) {
        console.error('Error adding location column:', error);
    } finally {
        client.release();
        process.exit();
    }
};

addLocationColumn();
