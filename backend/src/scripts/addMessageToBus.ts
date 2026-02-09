
import { query } from '../config/db';

const addMessageColumn = async () => {
    try {
        await query('ALTER TABLE bus_timings ADD COLUMN IF NOT EXISTS message TEXT');
        console.log('Successfully added message column to bus_timings table');
    } catch (error) {
        console.error('Error adding message column:', error);
    }
};

addMessageColumn();
