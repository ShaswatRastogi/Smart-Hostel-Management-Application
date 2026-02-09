
import { query } from '../config/db';

const createLaundryTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS laundry_settings (
                id SERIAL PRIMARY KEY,
                pickup_day VARCHAR(50) DEFAULT 'Monday',
                pickup_time VARCHAR(50) DEFAULT '09:00',
                pickup_period VARCHAR(10) DEFAULT 'AM',
                dropoff_day VARCHAR(50) DEFAULT 'Wednesday',
                dropoff_time VARCHAR(50) DEFAULT '05:00',
                dropoff_period VARCHAR(10) DEFAULT 'PM',
                status VARCHAR(50) DEFAULT 'On Schedule',
                message TEXT DEFAULT 'Regular service available',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Laundry settings table created.');

        // Ensure at least one row exists
        const res = await query('SELECT * FROM laundry_settings LIMIT 1');
        if (res.rows.length === 0) {
            await query(`
                INSERT INTO laundry_settings (status) VALUES ('On Schedule')
            `);
            console.log('Default laundry settings inserted.');
        } else {
            console.log('Laundry settings already exist.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating laundry table:', error);
        process.exit(1);
    }
};

createLaundryTable();
