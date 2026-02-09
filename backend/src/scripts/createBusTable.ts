
import { pool } from '../config/db';

const createBusTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bus_timings (
                id SERIAL PRIMARY KEY,
                route_name VARCHAR(255) NOT NULL,
                departure_time TIME NOT NULL,
                destination VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Bus timings table created successfully.");
    } catch (error) {
        console.error("Error creating bus timings table:", error);
    } finally {
        pool.end();
    }
};

createBusTable();
