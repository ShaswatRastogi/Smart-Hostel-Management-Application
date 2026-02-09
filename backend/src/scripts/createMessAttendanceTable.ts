
import { pool } from '../config/db';

const createMessAttendanceTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mess_attendance (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL, -- No FK constraint as students.id is not unique
                date DATE NOT NULL,
                meal VARCHAR(20) NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'snacks', 'dinner')),
                status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'skipping')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, date, meal)
            );
        `);
        console.log('Mess attendance table created successfully');
    } catch (error) {
        console.error('Error creating mess attendance table:', error);
    } finally {
        pool.end();
    }
};

createMessAttendanceTable();
