
import { pool } from '../config/db';

const debugSchema = async () => {
    try {
        const res = await pool.query(`
            SELECT c.column_name, tc.constraint_type
            FROM information_schema.table_constraints tc 
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.columns c ON c.table_name = tc.table_name AND c.column_name = ccu.column_name
            WHERE tc.table_name = 'students' AND c.column_name = 'id';
        `);
        console.log('Constraints on ID:', res.rows);

        const res2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students';
        `);
        console.log('All Columns:', res2.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

debugSchema();
