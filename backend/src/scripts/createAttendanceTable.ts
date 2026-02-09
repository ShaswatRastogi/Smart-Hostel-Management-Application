
import { query } from '../config/db';

const createAttendanceTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(student_id, date)
            );
        `);
        console.log('Attendance table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating attendance table:', err);
        process.exit(1);
    }
};

createAttendanceTable();
