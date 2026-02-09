import { pool } from '../config/db';

const addFooterColumn = async () => {
    try {
        await pool.query(`
            ALTER TABLE hostel_info 
            ADD COLUMN IF NOT EXISTS footer_text TEXT;
        `);
        console.log('Added footer_text column to hostel_info');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        pool.end();
    }
};

addFooterColumn();
