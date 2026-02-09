import fs from 'fs';
import path from 'path';
import pool from '../config/db';

const initDb = async () => {
    const client = await pool.connect();
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema initialization...');
        await client.query(schema);
        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

initDb();
