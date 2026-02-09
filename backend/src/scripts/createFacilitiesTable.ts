import { pool } from '../config/db';

const createFacilitiesTable = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        icon VARCHAR(50) DEFAULT 'star',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Facilities table created successfully');
    } catch (error) {
        console.error('Error creating facilities table:', error);
    }
};

createFacilitiesTable();
