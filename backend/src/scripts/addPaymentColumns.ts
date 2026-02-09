import { query } from '../config/db';

const migrate = async () => {
    try {
        console.log('Adding missing columns to payments table...');

        await query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS method VARCHAR(50);
        `);

        console.log('Successfully added columns to payments table.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
