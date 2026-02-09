
import { pool } from '../config/db';

const listTables = async () => {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('Tables in DB:', res.rows.map(r => r.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

listTables();
