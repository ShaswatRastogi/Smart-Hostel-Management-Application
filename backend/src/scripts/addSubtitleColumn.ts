import { query } from '../config/db';

const addSubtitleColumn = async () => {
    try {
        console.log('Adding subtitle column to hostel_info table...');
        await query(`
            ALTER TABLE hostel_info 
            ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255) DEFAULT 'Home Away From Home';
        `);
        console.log('Subtitle column added successfully.');
    } catch (error) {
        console.error('Error adding subtitle column:', error);
    }
};

addSubtitleColumn();
