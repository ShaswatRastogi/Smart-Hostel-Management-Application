import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { query } from '../config/db';
import { serviceAccount } from '../config/firebaseServiceAccount';

dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

// Helpers
const getStudentIdByEmail = async (email: string) => {
    if (!email) return null;
    const res = await query('SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = $1', [email]);
    return res.rows.length > 0 ? res.rows[0].id : null;
};

const migrateComplaints = async () => {
    console.log('Migrating Complaints...');
    const snapshot = await db.collection('complaints').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const studentId = await getStudentIdByEmail(data.studentEmail);

        if (studentId) {
            await query(
                `INSERT INTO complaints (student_id, title, description, category, status, admin_response, created_at, resolved_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    studentId,
                    data.title || 'Complaint',
                    data.description || '',
                    data.category || 'General',
                    data.status || 'pending',
                    data.adminReply || null,
                    data.timestamp?.toDate() || new Date(),
                    data.resolvedAt?.toDate() || null
                ]
            );
        }
    }
    console.log(`Migrated ${snapshot.size} complaints.`);
};

const migratePayments = async () => {
    console.log('Migrating Payments...');
    const snapshot = await db.collection('payments').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        // Payments in Firebase might be keyed differently, assuming studentEmail exists
        const studentId = await getStudentIdByEmail(data.studentEmail);

        if (studentId) {
            await query(
                `INSERT INTO payments (student_id, amount, purpose, status, due_date, paid_at, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    studentId,
                    data.amount || 0,
                    data.type || 'Fee',
                    data.status || 'pending',
                    data.dueDate?.toDate() || null,
                    data.paidAt?.toDate() || null,
                    data.createdAt?.toDate() || new Date()
                ]
            );
        }
    }
    console.log(`Migrated ${snapshot.size} payments.`);
};

const migrateLaundry = async () => {
    console.log('Migrating Laundry Requests...');
    const snapshot = await db.collection('laundry').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const studentId = await getStudentIdByEmail(data.email);

        if (studentId) {
            await query(
                `INSERT INTO laundry_requests (student_id, pickup_date, delivery_date, items_count, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    studentId,
                    data.pickupDate?.toDate() || new Date(),
                    data.deliveryDate?.toDate() || null,
                    data.clothesCount || 0,
                    data.status || 'pending',
                    data.date?.toDate() || new Date()
                ]
            );
        }
    }
    console.log(`Migrated ${snapshot.size} laundry requests.`);
};

const migrateLeaves = async () => {
    console.log('Migrating Leave Requests...');
    const snapshot = await db.collection('leaves').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const studentId = await getStudentIdByEmail(data.email);

        if (studentId) {
            await query(
                `INSERT INTO leave_requests (student_id, start_date, end_date, reason, status, admin_response, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    studentId,
                    data.startDate?.toDate() || new Date(),
                    data.endDate?.toDate() || new Date(),
                    data.reason || '',
                    data.status || 'pending',
                    data.adminComment || null,
                    data.appliedAt?.toDate() || new Date()
                ]
            );
        }
    }
    console.log(`Migrated ${snapshot.size} leave requests.`);
};

const migrateNotices = async () => {
    console.log('Migrating Notices...');
    const snapshot = await db.collection('notices').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        await query(
            `INSERT INTO notices (title, content, category, priority, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                data.title || 'Notice',
                data.content || '',
                data.type || 'General',
                'normal', // Default priority
                data.date?.toDate() || new Date()
            ]
        );
    }
    console.log(`Migrated ${snapshot.size} notices.`);
};

const migrateBusTimings = async () => {
    console.log('Migrating Bus Timings...');
    const snapshot = await db.collection('bustimings').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        await query(
            `INSERT INTO bus_timings (route_name, departure_time, destination)
             VALUES ($1, $2, $3)`,
            [
                data.route || 'Route',
                data.time || '00:00', // Assuming string time format
                data.destination || ''
            ]
        );
    }
    console.log(`Migrated ${snapshot.size} bus timings.`);
};

const migrateMess = async () => {
    console.log('Migrating Mess Menu...');
    const snapshot = await db.collection('mess').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        // Mess data structure varies, assuming day/meal type mapping
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayIndex = days.indexOf(data.day);

        if (dayIndex !== -1) {
            const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
            for (const meal of meals) {
                if (data[meal] || data[meal.toLowerCase()]) {
                    await query(
                        `INSERT INTO mess_schedule (day_of_week, meal_type, menu) VALUES ($1, $2, $3)`,
                        [dayIndex, meal.toLowerCase(), data[meal] || data[meal.toLowerCase()]]
                    );
                }
            }
        }
    }
    console.log(`Migrated Mess Menu.`);
};

const migrateEmergencyContacts = async () => {
    console.log('Migrating Emergency Contacts...');
    const snapshot = await db.collection('emergencyContacts').get();
    for (const doc of snapshot.docs) {
        const data = doc.data();
        await query(
            `INSERT INTO emergency_contacts (name, designation, phone, category)
             VALUES ($1, $2, $3, $4)`,
            [
                data.name,
                data.role || 'Staff',
                data.phone || '0000000000', // Default phone to avoid NOT NULL violation
                data.type || 'General'
            ]
        );
    }
    console.log(`Migrated ${snapshot.size} emergency contacts.`);
};

const runFullMigration = async () => {
    try {
        await migrateComplaints();
        await migratePayments();
        await migrateLaundry();
        await migrateLeaves();
        await migrateNotices();
        await migrateBusTimings();
        await migrateMess();
        await migrateEmergencyContacts();
        console.log('FULL MIGRATION COMPLETED SUCCESSFULLY');
        process.exit(0);
    } catch (error) {
        console.error('Full Migration Failed:', error);
        process.exit(1);
    }
};

runFullMigration();
