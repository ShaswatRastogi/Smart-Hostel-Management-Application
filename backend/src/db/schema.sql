-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'student', -- 'student', 'admin'
    push_token VARCHAR(255),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_temp_token VARCHAR(255),
    password_hash VARCHAR(255),
    notification_preferences JSONB DEFAULT '{"notices": true, "complaints": true, "leaves": true, "services": true, "payments": true, "mess": true, "laundry": true, "bus": true, "visitors": true}'::jsonb,
    app_preferences JSONB DEFAULT '{"auto_download_wifi": true, "auto_download_mobile": false, "data_saver": false, "reduce_motion": false, "haptic_feedback": true, "high_contrast": false, "bold_text": false, "font_size": "default"}'::jsonb,
    last_notifications_cleared_at TIMESTAMPTZ DEFAULT to_timestamp(0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    roll_no VARCHAR(50) UNIQUE,
    college_name VARCHAR(255),
    hostel_name VARCHAR(255),
    dob DATE,
    phone VARCHAR(20),
    address TEXT,
    father_name VARCHAR(255),
    father_phone VARCHAR(20),
    mother_name VARCHAR(255),
    mother_phone VARCHAR(20),
    blood_group VARCHAR(10),
    medical_history TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    dues DECIMAL(10, 2) DEFAULT 0,
    hostel_fee DECIMAL(10, 2) DEFAULT 0,
    mess_fee DECIMAL(10, 2) DEFAULT 0,
    password VARCHAR(255),
    profile_photo VARCHAR(255),
    fee_frequency VARCHAR(50) DEFAULT 'Monthly',
    last_notifications_cleared_at BIGINT DEFAULT 0,
    google_email VARCHAR(255) UNIQUE,
    personal_email VARCHAR(255),
    college_email VARCHAR(255),
    total_fee DECIMAL(10, 2) DEFAULT 0,
    campus_status VARCHAR(20) DEFAULT 'in_campus',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'vacant', -- 'vacant', 'occupied', 'full'
    wifi_ssid VARCHAR(100),
    wifi_password VARCHAR(100),
    room_type VARCHAR(100),
    facilities TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Allocations Table
CREATE TABLE IF NOT EXISTS room_allocations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deallocated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(student_id, is_active) -- One active allocation per student
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP,
    admin_unread INTEGER DEFAULT 0,
    student_unread INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    text TEXT NOT NULL,
    sent BOOLEAN DEFAULT TRUE,
    received BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in-progress', 'resolved'
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    purpose VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Laundry Requests Table
CREATE TABLE IF NOT EXISTS laundry_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    pickup_date DATE NOT NULL,
    delivery_date DATE,
    items_count INTEGER,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'picked', 'delivered'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_response TEXT,
    qr_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Movements Table (Trip Tracking)
CREATE TABLE IF NOT EXISTS student_movements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    in_time TIMESTAMP,
    duration_minutes INTEGER,
    recorded_by_out INTEGER REFERENCES users(id),
    recorded_by_in INTEGER REFERENCES users(id)
);

-- Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Bus Timings Table
CREATE TABLE IF NOT EXISTS bus_timings (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    departure_time TIME NOT NULL,
    destination VARCHAR(255),
    message TEXT,
    schedule_type VARCHAR(50) DEFAULT 'everyday',
    valid_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Mess Schedule Table
CREATE TABLE IF NOT EXISTS mess_schedule (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER, -- 0=Sunday, 6=Saturday
    meal_type VARCHAR(20), -- 'breakfast', 'lunch', 'dinner'
    menu TEXT,
    timings VARCHAR(100), -- '08:00 AM - 09:30 AM'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mess Attendance Table
CREATE TABLE IF NOT EXISTS mess_attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    date DATE NOT NULL,
    meal VARCHAR(20) NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'snacks', 'dinner')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'skipping')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date, meal)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late', 'leave'
    marked_by INTEGER REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Hostel Info Table
CREATE TABLE IF NOT EXISTS hostel_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    warden_name VARCHAR(255) NOT NULL,
    total_capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    established_year INTEGER,
    description TEXT,
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facilities Table
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Laundry Settings Table
CREATE TABLE IF NOT EXISTS laundry_settings (
    id SERIAL PRIMARY KEY,
    max_items_per_request INTEGER DEFAULT 10,
    allowed_days VARCHAR(50)[] DEFAULT '{"Monday", "Wednesday", "Friday"}',
    pickup_schedule TEXT,
    delivery_schedule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, completed, rejected
    estimated_time VARCHAR(100),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitors Table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    app_version VARCHAR(50),
    ip_address VARCHAR(45),
    location VARCHAR(255),
    is_current BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Security (Row Level Security) ───────────────────────────────────────────
-- Enable RLS for all tables to clear Supabase security warnings.
-- Note: Your Node.js backend uses the 'postgres' superuser role, so it
-- bypasses these policies and maintains full access automatically.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
