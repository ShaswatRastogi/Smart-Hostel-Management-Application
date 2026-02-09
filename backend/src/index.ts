import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';

dotenv.config();

import path from 'path';
import { query } from './config/db';
import analyticsRoutes from './routes/analytics';
import attendanceRoutes from './routes/attendanceRoutes';
import authRoutes from './routes/authRoutes';
import busRoutes from './routes/busRoutes';
import chatRoutes from './routes/chatRoutes';
import facilityRoutes from './routes/facilityRoutes';
import hostelRoutes from './routes/hostelRoutes';
import messAttendanceRoutes from './routes/messAttendanceRoutes';
import noticeRoutes from './routes/noticeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import roomRoutes from './routes/roomRoutes';
import searchRoutes from './routes/searchRoutes';
import serviceRoutes from './routes/serviceRoutes';
import studentRoutes from './routes/studentRoutes';
import visitorRoutes from './routes/visitorRoutes';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Files (Profile Photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/hostel-info', hostelRoutes);
app.use('/api/mess', messAttendanceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('SmartStay API is running');
});

// Health Check
app.get('/health', async (req: Request, res: Response) => {
    try {
        await query('SELECT NOW()');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});

// Start Server
const startServer = async () => {
    try {
        console.log('Checking database schema...');
        await query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS last_notifications_cleared_at BIGINT DEFAULT 0;
            
            ALTER TABLE messages
            ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
            
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
            
            CREATE TABLE IF NOT EXISTS visitors (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                visitor_name VARCHAR(255) NOT NULL,
                visitor_phone VARCHAR(15) NOT NULL,
                visitor_relation VARCHAR(100),
                purpose VARCHAR(500) NOT NULL,
                room_number VARCHAR(10) NOT NULL,
                expected_date DATE NOT NULL,
                expected_time_in TIME,
                expected_time_out TIME,
                status VARCHAR(20) DEFAULT 'pending',
                admin_remarks TEXT,
                approved_by INTEGER REFERENCES users(id),
                approved_at TIMESTAMP,
                checked_in_at TIMESTAMP,
                checked_out_at TIMESTAMP,
                visitor_photo TEXT,
                id_proof_type VARCHAR(50),
                id_proof_number VARCHAR(50),
                qr_code TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_visitors_student ON visitors(student_id);
            CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
            CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(expected_date);
            CREATE INDEX IF NOT EXISTS idx_visitors_room ON visitors(room_number);
        `);
        console.log('✅ Database schema verified');

        app.listen(+port, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();
