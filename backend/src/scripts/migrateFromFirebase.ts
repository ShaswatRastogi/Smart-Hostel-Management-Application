import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { query } from '../config/db';
import { serviceAccount } from '../config/firebaseServiceAccount'; // You need to create this

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

const migrateUsersAndStudents = async () => {
    console.log('Migrating Users and Students...');
    const snapshot = await db.collection('allocations').get(); // Assuming 'allocations' holds main student data

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const email = doc.id; // Email is the doc ID in allocations based on your utils

        // 1. Create/Update User
        let userId: number;
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
        } else {
            const newUser = await query(
                'INSERT INTO users (email, full_name, role) VALUES ($1, $2, $3) RETURNING id',
                [email, data.name || 'Unknown', 'student']
            );
            userId = newUser.rows[0].id;
        }

        // 2. Create Student Profile
        // Map fields from 'allocations' to 'students' table
        await query(
            `INSERT INTO students (
        user_id, roll_no, college_name, hostel_name, dob, phone, 
        personal_email, address, father_name, father_phone, mother_name, 
        mother_phone, blood_group, medical_history, emergency_contact_name, 
        emergency_contact_phone, status, dues
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (roll_no) DO NOTHING`,
            [
                userId,
                data.rollNo || null,
                data.collegeName || null,
                data.hostelName || null,
                data.dob || null,
                data.phone || null,
                data.personalEmail || null,
                data.address || null,
                data.fatherName || null,
                data.fatherPhone || null,
                data.motherName || null,
                data.motherPhone || null,
                data.bloodGroup || null,
                data.medicalHistory || null,
                data.emergencyContactName || null,
                data.emergencyContactPhone || null,
                data.status || 'active',
                data.dues || 0
            ]
        );

        // 3. Handle Room Allocation
        if (data.room) {
            // Ensure room exists
            const roomRes = await query('SELECT id FROM rooms WHERE room_number = $1', [data.room]);
            let roomId;

            if (roomRes.rows.length === 0) {
                const newRoom = await query(
                    'INSERT INTO rooms (room_number, status) VALUES ($1, $2) RETURNING id',
                    [data.room, 'occupied']
                );
                roomId = newRoom.rows[0].id;
            } else {
                roomId = roomRes.rows[0].id;
            }

            // Get student ID
            const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
            const studentId = studentRes.rows[0].id;

            // Create allocation
            await query(
                'INSERT INTO room_allocations (student_id, room_id, is_active) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [studentId, roomId, true]
            );
        }
    }
    console.log('Users and Students migrated.');
};

const migrateRooms = async () => {
    console.log('Migrating Rooms metadata...');
    const snapshot = await db.collection('rooms').get();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const roomNo = doc.id;

        // Update room details if exists, or insert
        await query(
            `INSERT INTO rooms (room_number, capacity, status, wifi_ssid, wifi_password)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (room_number) DO UPDATE SET
             capacity = EXCLUDED.capacity,
             status = EXCLUDED.status,
             wifi_ssid = EXCLUDED.wifi_ssid,
             wifi_password = EXCLUDED.wifi_password`,
            [
                roomNo,
                data.capacity || 2,
                data.status || 'vacant',
                data.wifiSSID || null,
                data.wifiPassword || null
            ]
        );
    }
    console.log('Rooms migrated.');
};

const runMigration = async () => {
    try {
        await migrateRooms(); // Migrate rooms first to ensure FK integrity if needed, though Users creation handles room creation mostly.
        await migrateUsersAndStudents();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
