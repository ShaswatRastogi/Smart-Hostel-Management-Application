import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { pool } from '../config/db';

const checkStudent = async () => {
    try {
        console.log('Connecting...');
        const res = await pool.query(`
            SELECT s.*, u.email, u.full_name 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            LIMIT 1
        `);
        if (res.rows.length === 0) {
            console.log('No students found');
        } else {
            const row = res.rows[0];
            console.log('--- Student Data ---');
            console.log('ID:', row.id);
            console.log('Full Name:', row.full_name);
            console.log('College:', row.college_name);
            console.log('Hostel:', row.hostel_name);
            console.log('Father Name:', row.father_name);
            console.log('Mother Name:', row.mother_name);
            console.log('DOB:', row.dob);
            console.log('Address:', row.address);
            console.log('Blood Group:', row.blood_group);
            console.log('Emergency Contact:', row.emergency_contact_name);
            console.log('--------------------');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
};

checkStudent();
