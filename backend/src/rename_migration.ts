
import { query } from './config/db';

const runMigration = async () => {
    try {
        console.log('Renaming students.personal_email to students.google_email...');
        await query('ALTER TABLE students RENAME COLUMN personal_email TO google_email');
        console.log('Success!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
