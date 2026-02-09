import { pool, query } from '../config/db';

const addProfilePhotoColumn = async () => {
    try {
        console.log('Adding profile_photo column to students table...');

        await query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS profile_photo TEXT;
        `);

        console.log('Successfully added profile_photo column.');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        pool.end();
    }
};

addProfilePhotoColumn();
