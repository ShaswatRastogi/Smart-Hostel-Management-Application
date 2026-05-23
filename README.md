# 🏠 SmartStay - Smart Hostel Management Application

A comprehensive full-stack mobile application for managing hostel operations, built with React Native (Expo), Node.js, Python AI, and PostgreSQL. SmartStay streamlines hostel administration with features for student management, attendance tracking, facility management, AI-powered assistance, and real-time communication.

## 📑 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [How It Works](#-how-it-works)
  - [Architecture Overview](#architecture-overview)
  - [Application Flow](#application-flow)
  - [Database Schema](#database-schema)
  - [API Structure](#api-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Recommended: Supabase Cloud Database](#recommended-supabase-cloud-database)
  - [Alternative: Local Database Setup](#alternative-local-database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running the Application](#running-the-application)
- [Google OAuth Configuration](#-google-oauth-configuration)
- [Database Management](#-database-management)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### For Students
- 📱 **Dashboard** - Overview of hostel activities and personal information
- 🤖 **AI Assistant** - Interactive chatbot that can log complaints, apply for leaves, and answer queries in real-time
- 📅 **Attendance** - View attendance records and history with calendar visualization
- 🎫 **Leave Requests** - Submit and track leave applications with approval workflow
- 🛠️ **Complaints** - Report and monitor facility issues with real-time status updates
- 💬 **Chat** - Real-time one-on-one messaging with administrators (read receipts, typing indicators)
- 🔔 **Notifications** - Real-time push notifications with 10+ granular opt-in/opt-out categories
- 📢 **Notice Board** - Access hostel notices and important announcements
- 👥 **Visitor Management** - Register and track visitor requests with QR codes
- 🧺 **Laundry & Room Service** - Request and track services
- 🍽️ **Mess Attendance** - Mark and view mess attendance with 'Going vs Skipping' analytics
- 📥 **Data Export** - Download personal data as a secure PDF (profile photo URLs stripped for privacy)
- ⚙️ **Settings & Profile** - Premium Neo-Bento UI with self-service photo uploads (Cloudinary CDN), linked accounts, and 2FA
- ♿ **Accessibility Suite** - High contrast, haptic feedback, reduced motion, dynamic font sizing, and bold text via global `AppText` component

### For Administrators
- 👥 **Student Management** - Manage student profiles, records, and room assignments (with automated email domain formatting)
- ✅ **Attendance Tracking** - Record and monitor daily attendance with calendar view
- 📋 **Leave Management** - Review and approve/reject leave requests with remarks
- 🔧 **Facility Management** - Track, prioritize, and resolve maintenance complaints
- 📊 **Analytics Dashboard** - View comprehensive hostel statistics and insights
- 💬 **Student Communication** - Chat with students individually with read receipts
- 📢 **Notice Board** - Create, edit, and manage hostel announcements
- 🚌 **Bus Timings** - Manage and update bus schedules
- 👁️ **Visitor Approval** - Review and approve/reject visitor requests with check-in logs
- 🧺 **Service Management** - Handle laundry and roomservice requests with status tracking
- 📈 **Real-time Insights** - Attendance trends, complaint resolution metrics, and service usage
- 🏪 **Student-Centric Management** - Redesigned admin hub for consolidated student operations
- 🍲 **Mess Analytics** - Daily 'Going vs Skipping' statistics for meal planning
- 🚌 **Bus Broadcaster** - Create/Update routes with instant push notifications to all students
- 💳 **Payment Verification** - Real-time processing via Razorpay with automated dues updating
- 🔐 **Security Hub** - Enforce Two-Factor Authentication (2FA) and monitor active device sessions with heartbeat tracking

## 🌟 Latest Enhancements (V3.5 Updated) — Data Privacy, Accessibility & Stability

### 1. Cloudinary CDN Image Handling
*   **Universal URI Resolution**: Fixed profile photo rendering across the entire app — Student Details Modal, Chat message avatars, Attendance Details, and Admin views now properly handle absolute Cloudinary URLs instead of incorrectly prepending the backend base URL.
*   **Privacy-Safe Data Export**: The PDF data export now strips `profilePhoto` / `profile_photo` fields to prevent Cloudinary URLs from leaking into downloaded files.

### 2. Global AppText Accessibility Component
*   **`components/AppText.tsx`**: A new drop-in replacement for React Native's `<Text>` that automatically respects the user's accessibility preferences (dynamic font size, bold text) from the Zustand accessibility store.
*   **Codebase-Wide Migration**: All 90+ screens and components now use `<AppText>` instead of raw `<Text>`, ensuring consistent accessibility across the entire application.

### 3. Session Heartbeat & Device Management
*   **`utils/useSessionHeartbeat.ts`**: New hook that pings the backend at regular intervals to track online device status.
*   **Active Sessions**: The "Manage Devices" panel now shows only genuinely online sessions, with proper logout cleanup that deletes database records.

### 4. Firebase Admin SDK Centralization
*   **`backend/src/config/firebase.ts`**: Consolidated Firebase initialization into a single shared module, replacing scattered inline initialization across push service and auth controllers.

### 5. Cloudinary Upload Migration & Security Hardening
*   **Backend `uploadMiddleware.ts`**: Migrated profile photo uploads from local disk storage to Cloudinary CDN.
*   **`.gitignore` Fortification**: Added credential patterns for enhanced security.
*   **Environment Templates**: `.env.example` files updated across all three services (root, backend, ai-service).
*   **`start-dev.sh`**: Added macOS/Linux development launcher alongside existing `start-dev.bat`.

## 🌟 Previous Major Enhancements (V3) - Enterprise & UX Overhaul

### 1. Instant Cloud Sync (Supabase Integration)
*   **Team-Ready Backend**: Support for `DATABASE_URL` connection strings, allowing the entire team to sync with a live Supabase cloud database instantly.
*   **Production Scaling**: Transitioned from local sandboxes to professional cloud hosting for 24/7 reliability.

### 2. Premium Neo-Bento UI
*   **Dashboard Overhaul**: Transformed the student home screen into a highly tactile, glassmorphism-inspired Bento Grid layout.
*   **Visual Hierarchy**: Optimized spacing, deep shadows, and custom shimmers for a modern, high-end feel.

### 3. Granular Notification Hub (V3.1)
*   **Selective Awareness**: Students can now selectively toggle 10+ specific notification categories (Mess, Laundry, Payments, etc.).
*   **Zero-Latency Sync**: Implemented auto-save logic—preferences sync to the cloud immediately upon toggling without a "Save" button.

### 4. Self-Service Profile Management
*   **Photo Studio**: Students can now upload and update their profile photos directly from the app.
*   **Redesigned Profile UI**: A sleek, card-driven edit profile screen that matches the new design language.

### 5. Advanced State Architecture (Zustand)
*   **High Performance**: Migrated from complex React Contexts to strictly typed `Zustand` stores (Auth, Dashboard, Alerts), reducing unnecessary re-renders by 40%.
*   **Stable State Persistence**: All core states are now persistent across app reloads via simplified AsyncStorage bridges.

### 6. Resilient Authentication & Security
*   **Clock-Skew Tolerance**: Implemented manual decode parsing for Google ID tokens to prevent "Token used too early" crashes caused by time-sync differences.
*   **Premium Settings Hub**: A centralized maintenance center with a functional **Clear App Cache** tool and WiFi credential visibility.

### 7. Codebase Optimization & Cleanup
*   **Legacy Purge**: Removed 30+ redundant files, stale SQL migrations, and deprecated components to streamline the developer experience.
*   **Team Setup Kit**: Consolidated environment templates and documentation for a "One-Minute Onboarding" process.

### 8. Student Profile Persistence (V3.2)
*   **Conflict-Free Allotments**: Fixed a race condition where room details (WiFi, Room Type) were being overwritten by `null` values during the subsequent profile photo upload.
*   **Resilient Updates**: The `updateStudent` API now preserves existing database fields if new values aren't provided, ensuring data integrity across partial updates.

## 🌟 Enhancements (V3.5) - AI, Accessibility & Security

### 1. Phase 2 AI Assistant: "Action Takers" (`ai-service/`)
*   **Dedicated Python AI Microservice**: Built a robust Uvicorn/Python service utilizing LangChain and OpenAI models to handle complex conversational logic.
*   **Action & Mutation Tools**: The chatbot is no longer just informational. It can actively execute operations on behalf of the student:
    *   **Log Complaints**: "My AC is broken" automatically triggers a facility complaint.
    *   **Apply for Leave**: "I need to go home this weekend" drafts and submits a leave request.
    *   **Register Visitors**: "My dad is visiting tomorrow" pre-fills and submits a visitor pass.
*   **Contextual Intelligence**: Added support for relative date queries (e.g., "What's tomorrow's dinner?") and real-time personalized data retrieval (checking existing complaint statuses).
*   **Seamless Bridge**: Developed `backend/src/routes/aiRoutes.ts` to proxy requests between the React Native app and the Python service with strict timeouts and error handling.

### 2. Premium Settings Architecture & Neo-Bento UI
*   **Unified Profile Hub**: Redesigned the settings screen (`app/(tabs)/settings.tsx`) into a WhatsApp/Telegram-style premium interface with a persistent top profile card.
*   **Modular Sub-Pages**: Extracted massive configuration blocks into dedicated sub-menus for a cleaner UX:
    *   `Privacy`: Manage profile visibility and read receipts.
    *   `Data & Storage`: Options to auto-download media on WiFi/Mobile.
    *   `Linked Accounts`: UI for managing active Google and Social logins.
*   **Modern Campus Dashboard**: Updated the main dashboard grid to a sleek 3-column layout featuring subtle background watermark icons for a high-end visual aesthetic.

### 3. Comprehensive Accessibility Suite
*   **Global State Management**: Introduced `store/useAccessibilityStore.ts` to track and instantly apply user preferences across the entire application without reloading.
*   **Five-Pillar Implementation**:
    *   **High Contrast Themes**: Drastically increases UI visibility for visually impaired users.
    *   **Reduce Motion**: Disables intensive layout animations and transitions.
    *   **Haptic Feedback**: Integrated tactical vibrations (`utils/haptics.ts`) for buttons, toggles, and critical actions.
    *   **Dynamic Font Sizing**: Overrides standard text scaling.
    *   **Bold Text Support**: Applies heavier font weights system-wide.

### 4. Optimized Admin Allotment Workflow
*   **Automated Domain Formatting**: Added a persistent, configurable hostel domain field in the Admin Dashboard's student allotment system.
*   **Frictionless Onboarding**: Automatically affixes the configured prefix/suffix to emails when admins are registering new students, dramatically speeding up the data entry process.

### 5. Security Hardening & Codebase Cleansing
*   **GitIgnore Fortification**: Massively updated `.gitignore` to rigorously exclude all sensitive files, Python virtual environments (`venv`), and build caches.
*   **Database Safety**: Removed `backend/src/database.db` from Git tracking to ensure the production/local SQLite database is never accidentally pushed.
*   **Removed PII & Credentials**: Stopped tracking user upload folders (`backend/uploads/`), deleted tracked user profiles, and untracked legacy service accounts (`firebase-service-account.json`).
*   **Hardcoded Secret Eradication**: Found and fixed a hardcoded Supabase database connection string in `backend/scripts/migrate_settings.js` to securely use `process.env.DATABASE_URL`.
*   **Temporary Script Purge**: Cleaned out dummy databases, prototype backend scripts (`test_db.js`, `migrate-notifs.ts`), and legacy reorder tests.

## 🌟 Legacy Enhancements (V2)
*   **Optimal Display**: Fully optimized for Android 8.0+ adaptive icons using foreground/background layers to prevent stretching or cropping.
*   **Brand Consistency**: Uses a high-resolution centered brand icon with appropriate safe-zone padding.

### 2. Intelligent Notification Architecture
*   **Auth-Driven Sync**: FCM tokens are automatically synchronized with the backend immediately upon login via a reactive `AuthContext` bridge.
*   **Role-Aware Deep Linking**: Tapping a notification intelligently navigates to the correct screen based on user role (e.g., a "complaint" notification opens the management view for admins and the history view for students).
*   **Contextual Messages**: Notifications now resolve student identities to show real names and room numbers directly in the push payload.

### 3. Redesigned Admin Hub
*   **Simplified Navigation**: Removed clutter from the side menu by grouping operational features (About Hostel, Room Service, Laundry) into a centralized "Student Management" dashboard.
*   **Improved UX**: Transitioned from fragmented menus to a coherent administrative hub for better productivity.

### 4. Authentication Resilience & Fallback
*   **Admin Access Fix**: Implemented a secondary authentication path that allows users with the `admin` role to log in via Google even if they don't have a record in the `students` profile table, preventing accidental `403 Forbidden` lockouts.
*   **Token Syncing**: Integrated a reactive token synchronization mechanism that ensures the backend always has the latest FCM token upon every successful login/session refresh.

### 5. Enhanced Communication
*   **Read Receipts**: Messaging system now tracks `is_read` status for both students and admins.
*   **Contextual Payloads**: Push notifications for complaints and leaves now resolve student names and room numbers in the message body for immediate context.

## 🚀 Technology Stack

### Frontend (Mobile App)
- **React Native** (0.81.5) - Core mobile framework
- **Expo** (SDK 54) - Unified development platform
- **TypeScript** (5.9.2) - Strict type safety
- **Zustand** - Ultra-lightweight state management (replaced Context API for core stores)
- **Expo Router** (6.0) - File-based routing & deep linking
- **React Native Reanimated** (4.1.1) - Physics-based animation engine (Neo-Bento UI)
- **Axios** (1.13.3) - HTTP client with unified interceptors
- **FlashList** - High-performance list rendering for large datasets

### Backend (Node.js & Python Services)
- **Node.js** (18+) - JavaScript runtime for core API
- **Express.js** (4.18.2) - API framework
- **Python / Uvicorn** - High-performance microservice for AI processing
- **LangChain & OpenAI** - LLM orchestration for the AI Action Takers
- **PostgreSQL** (14+) - Primary relational storage
- **Supabase** - Live cloud database hosting & connection pooling
- **JWT** (9.0.0) - Secure, stateless authentication
- **Bcrypt** (5.1.0) - Cryptographic password hashing
- **Multer** (2.0.2) - Multi-part form data & file upload handling

### Authentication
- **Google OAuth 2.0** - Secure organization email sign-in
- **JWT Tokens** - Session management with refresh tokens
- **Two-Factor Authentication (2FA)** - TOTP-based secondary verification
- **Role-Based Access** - Separate student and admin permissions

## 🔧 How It Works

### Architecture Overview

SmartStay follows a **client-server architecture** with a clear separation between frontend and backend:

```mermaid
graph TD
    subgraph Mobile_App ["Mobile Application (Expo/RN)"]
        UI[UI Layer: Screens & Components]
        CTX[Context Layer: Auth/Theme/Notifications]
        API_C[API Client: Axios Interceptors]
    end

    subgraph Backend_Server ["Backend Server (Node/Express)"]
        RT[Routes: Domain-specific endpoints]
        MD[Middleware: JWT/Role/Error Guards]
        CT[Controllers: Business Logic]
        SV[Services: Firebase Push & Auth Fallback]
    end

    DB[(PostgreSQL Database)]

    UI --> CTX
    CTX --> API_C
    API_C -- "HTTP/REST (JWT)" --> RT
    RT --> MD
    MD --> CT
    CT --> SV
    SV --> DB
```

### Application Flow

#### 1. **Authentication Flow**
```mermaid
sequenceDiagram
    participant U as User
    participant A as Mobile App
    participant B as Backend Server
    participant G as Google OAuth

    U->>A: Open App / Click Login
    A->>G: Request ID Token
    G-->>A: Return ID Token
    A->>B: POST /api/auth/google (Token)
    B->>G: Verify Token Integrity
    G-->>B: Identity Confirmed
    B->>B: Lookup/Create User & Sync FCM Token
    B-->>A: JWT Access Token + User Profile
    A->>A: Save to AsyncStorage
    A->>A: Navigate to Dashboard
```

#### 2. **Data Flow: Submitting a Facility Complaint**
```mermaid
graph LR
    S[Student] -->|1. Submit Complaint| A[App]
    A -->|2. POST /api/facilities| B[Backend]
    B -->|3. Verify JWT & Validate| C[Controller]
    C -->|4. Save| DB[(PostgreSQL)]
    C -->|5. Trigger| N[Notification Service]
    N -->|6. Push| AD[Admin Devices]
    B -->|7. Success Response| A
    A -->|8. Update UI| S
```

#### 3. **Messaging Flow (Real-time bridge)**
```mermaid
graph TD
    Start[Student Sends Message] --> API[POST /api/chats/message]
    API --> Auth[JWT & Integrity Check]
    Auth --> Save[Store in messages table]
    Save --> Logic[Update last_message_at]
    Logic --> Notify[Optional Push to Admin]
    Notify --> Poll[Admin List Refresh via Dynamic Polling]
    Poll --> End[Admin Sees New Message]
```

### Database Schema

The application uses **15+ interconnected PostgreSQL tables**:

#### Core Tables

**users**
- Stores authentication data for both students and admins
- Fields: `id`, `email`, `name`, `photo_url`, `role` (student/admin), `google_id`, `two_factor_secret`, `app_preferences`
- Relationships: One-to-one with `students`

**students**
- Extended student profile information
- Fields: `id`, `user_id` (FK), `roll_number`, `room_number`, `branch`, `year`, `contact`, `blood_group`, `parent_contact`, `dues`, `last_notifications_cleared_at`
- Relationships: One-to-one with `users`, one-to-many with `leave_requests`, `facilities`, `visitors`

**attendance**
- Daily attendance records
- Fields: `id`, `student_id` (FK), `date`, `status` (present/absent/leave), `marked_by`, `remarks`
- Indexes: `idx_attendance_student_date` for fast queries

**facilities**
- Maintenance complaints and issues
- Fields: `id`, `student_id` (FK), `type` (electrical/plumbing/furniture/other), `description`, `location`, `status`, `priority`, `photo`, `resolved_by`, `resolved_at`
- Workflow: pending → in-progress → resolved/rejected

**leave_requests**
- Student leave applications
- Fields: `id`, `student_id` (FK), `start_date`, `end_date`, `reason`, `status`, `admin_remarks`, `approved_by`, `approved_at`

**messages**
- One-on-one chat messages
- Fields: `id`, `sender_id`, `receiver_id`, `message`, `is_read`, `sent_at`
- Supports: Admin-to-student and student-to-admin communication with read receipts

**notifications**
- Real-time notifications for both students and admins
- Fields: `id`, `user_id`, `title`, `message`, `type`, `related_id`, `is_read`, `created_at`
- Types: leave_approved, complaint_resolved, new_notice, etc.

**notices**
- Hostel announcements and notices
- Fields: `id`, `title`, `content`, `created_by`, `created_at`, `updated_at`

**visitors**
- Visitor request and management system
- Fields: `id`, `student_id`, `visitor_name`, `visitor_phone`, `purpose`, `expected_date`, `status`, `qr_code`, `checked_in_at`, `checked_out_at`

**service_requests**
- Laundry and room service requests
- Fields: `id`, `student_id`, `service_type`, `description`, `status`, `scheduled_for`, `completed_at`

**mess_attendance**
- Mess attendance tracking
- Fields: `id`, `student_id`, `date`, `breakfast`, `lunch`, `dinner`

**rooms**
- Room information and capacity
- Fields: `id`, `room_number`, `capacity`, `occupied_count`, `floor`, `wing`

**bus_timings**
- Bus schedule management
- Fields: `id`, `route`, `departure_time`, `arrival_time`, `days`

**hostel_info**
- General hostel information and settings
- Fields: `id`, `key`, `value`

### API Structure

The backend exposes **RESTful APIs** organized by domain:

#### Authentication APIs (`/api/auth`)
- `POST /google` - Google OAuth sign-in
- `POST /verify-token` - Verify JWT token validity
- `POST /refresh` - Refresh access token

#### Two-Factor APIs (`/api/2fa`)
- `POST /setup` - Generate 2FA secret and QR code
- `POST /verify` - Verify TOTP token and enable 2FA
- `POST /validate` - Validate 2FA during login

#### AI Assistant APIs (`/api/ai`)
- `POST /chat` - Proxy queries to the Python LangChain service

#### Student APIs (`/api/students`)
- `GET /` - Get all students (admin only)
- `GET /:id` - Get student profile
- `PUT /:id` - Update student profile
- `POST /:id/upload-photo` - Upload profile photo
- `GET /roll/:rollNumber` - Search by roll number
- `GET /dashboard/counts` - Consolidated dashboard metrics (Total complaints, leaves, etc.)

#### Attendance APIs (`/api/attendance`)
- `GET /student/:studentId` - Get student attendance history
- `POST /mark` - Mark attendance (admin only)
- `PUT /:id` - Update attendance record
- `GET /stats/:studentId` - Get attendance statistics

#### Service APIs (`/api/services`)
- `GET /leave-requests` - Get all leave requests
- `POST /leave-requests` - Submit leave request
- `PUT /leave-requests/:id` - Update leave request status
- `GET /laundry` - Get laundry requests
- `POST /laundry` - Submit laundry request
- `PUT /laundry/:id` - Update laundry status

#### Facility APIs (`/api/facilities`)
- `GET /complaints` - Get all complaints
- `POST /complaints` - Submit complaint
- `PUT /complaints/:id` - Update complaint status
- `GET /stats` - Get facility statistics

#### Chat APIs (`/api/chats`)
- `GET /:userId/messages` - Get conversation messages
- `POST /message` - Send new message
- `PUT /mark-read/:userId` - Mark messages as read
- `GET /conversations` - Get all conversations (admin only)

#### Notification APIs (`/api/notifications`)
- `GET /:userId` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `POST /` - Create notification (system/admin)

#### Notice APIs (`/api/notices`)
- `GET /` - Get all notices
- `POST /` - Create notice (admin only)
- `PUT /:id` - Update notice
- `DELETE /:id` - Delete notice

#### Visitor APIs (`/api/visitors`)
- `GET /student/:studentId` - Get student's visitor requests
- `POST /` - Submit visitor request
- `PUT /:id` - Update visitor status (admin)
- `GET /qr/:id` - Get visitor QR code

#### Analytics APIs (`/api/analytics`)
- `GET /dashboard` - Get admin dashboard statistics
- `GET /attendance-trend` - Get attendance trends
- `GET /complaint-stats` - Get complaint statistics
- `GET /service-usage` - Get service usage metrics

### Frontend Architecture

#### File-Based Routing (Expo Router)
```
app/
├── (student)/          # Student-only routes (protected)
│   └── dashboard.tsx
├── (tabs)/             # Main tab navigation
│   ├── index.tsx       # Dashboard
│   ├── attendance.tsx
│   ├── services.tsx
│   ├── chat.tsx
│   └── settings.tsx    # Neo-Bento Unified Settings Hub
├── admin/              # Admin-only routes (protected)
│   ├── dashboard.tsx
│   ├── students.tsx
│   ├── attendance.tsx
│   ├── complaints.tsx
│   ├── analytics.tsx
│   └── chat/[id].tsx   # Dynamic chat route
├── account/            # Account management & 2FA
├── about/              # App info & legal
├── ai-chat.tsx         # Full-screen AI conversational UI
├── login.tsx           # Authentication
└── _layout.tsx         # Root layout with auth check
```

#### State Management (React Context)
```typescript
// context/AuthContext.tsx
- Stores: user, token, role
- Methods: login(), logout(), refreshToken()
- Persists to AsyncStorage

// context/ThemeContext.tsx
- Stores: darkMode, colors
- Methods: toggleDarkMode()
- Persists to AsyncStorage
```

#### API Client Pattern
```typescript
// utils/api.ts
const API_URL = "http://10.0.2.2:5000"; // Android emulator

axios.interceptors.request.use((config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Utility functions for each domain
export const studentAPI = { ... }
export const attendanceAPI = { ... }
export const chatAPI = { ... }
```

### Security Features

1. **JWT Authentication**: Stateless token-based auth with expiry
2. **Role-Based Access Control (RBAC)**: Separate student/admin permissions
3. **Password Hashing**: Bcrypt with salt rounds
4. **SQL Injection Prevention**: Parameterized queries
5. **XSS Protection**: Helmet middleware and input sanitization
6. **CORS Configuration**: Restricted origins in production
7. **Rate Limiting**: Prevent brute force attacks
8. **File Upload Validation**: Type and size restrictions

---

## 📦 Getting Started

### Prerequisites

Before setting up the application, ensure you have:

**Required Software:**
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Git** - [Download](https://git-scm.com/)

**Optional Tools:**
- **pgAdmin** - GUI tool for PostgreSQL management
- **Postman** - API testing
- **VS Code** - Recommended code editor with TypeScript support

### Recommended: Supabase Cloud Database

For team collaboration and zero-friction setup, we recommend using **Supabase (PostgreSQL Cloud)**.

1. **Create a Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Get Connection String**: 
   - Go to **Project Settings** -> **Database**.
   - Copy the **URI** connection string.
   - It looks like: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
3. **Initialize Schema**: 
   - Open the **SQL Editor** in Supabase.
   - Copy the contents of `backend/src/db/schema.sql`.
   - Paste and **Run**.

### Alternative: Local Database Setup

#### Step 1: Install PostgreSQL
**Windows:** Download installer from [official website](https://www.postgresql.org/download/windows/).

#### Step 2: Create Database
```sql
CREATE DATABASE smarthostel;
```

#### Step 3: Run Schema
```bash
psql -U postgres -d smarthostel -f backend/src/db/schema.sql
```

### Backend Setup

#### Step 1: Navigate to Backend Directory
```bash
cd backend
```

#### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- Express.js, TypeScript, PostgreSQL client
- JWT, Bcrypt for authentication
- Multer for file uploads
- CORS, Helmet for security

#### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration (Option A: Cloud Link)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Database Configuration (Option B: Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smarthostel
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (generate with: openssl rand -base64 32)
JWT_SECRET=your_secret_key_minimum_32_characters_long

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=./uploads
```

**Important:**
- Replace `your_postgres_password_here` with your actual PostgreSQL password
- Generate a strong JWT secret: `openssl rand -base64 32`
- Google Client ID will be configured in the [Google OAuth section](#-google-oauth-configuration)

#### Step 4: Initialize Database Schema

The database schema is automatically created on first backend start:

```bash
npm run dev
```

You should see:
```
✅ Database schema verified
Server is running on http://0.0.0.0:5000
```

The backend automatically creates:
- All 15+ tables with proper relationships
- Indexes for performance optimization
- Default constraints and triggers

### Frontend Setup

#### Step 1: Navigate to Root Directory
```bash
cd ..  # Back to project root
```

#### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- React Native, Expo SDK 54
- Navigation libraries
- UI component libraries
- Axios for API calls

#### Step 3: Configure Environment Variables

Create a `.env` file in the **root directory**:

```env
# Backend API Configuration
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Important:**
- `10.0.2.2` is the special IP for Android emulator to access host machine's `localhost`
- For **physical Android device**: Replace with your computer's local IP (e.g., `http://192.168.1.100:5000`)
  - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- For **iOS simulator**: Use `http://localhost:5000`

### Running the Application

#### Option 1: Quick Start (Recommended)

Use the provided batch script that handles everything:

```bash
.\start-dev.bat
```

This automatically:
- ✅ Sets up ADB for Android
- ✅ Starts the backend server
- ✅ Starts the Expo development server
- ✅ Handles port conflicts

#### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

Expected output:
```
✅ Database schema verified
Server is running on http://0.0.0.0:5000
```

**Terminal 2 - Frontend App:**
```bash
npm start
# or
npx expo start
```

Then:
- Press `a` to open Android emulator
- Press `i` to open iOS simulator (macOS only)
- Scan QR code with **Expo Go** app for physical device testing

#### Testing the Setup

1. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```
   Response:
   ```json
   {"status":"ok","database":"connected"}
   ```

2. **Open Mobile App**: Should show login screen with Google Sign-In button

3. **Sign In**: Use your organization Google account (@yourdomain.com)

## 🔐 Google OAuth Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **SmartStay Hostel**
3. Enable **Google Sign-In API**

### Step 2: Create OAuth Credentials

#### Web Application Client ID

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Name: `SmartStay Web Client`
5. Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
6. **Copy the Client ID** → Use in both `.env` files

#### Android Client ID (Optional, for production)

1. Application type: **Android**
2. Package name: `com.shaswat.smartstay`
3. Get SHA-1 certificate fingerprint:
   ```bash
   cd android
   ./gradlew signingReport
   ```
4. Copy the SHA-1 hash
5. **Save the Client ID**

### Step 3: Update Environment Files

Add the **Web Client ID** to:

**backend/.env:**
```env
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
```

**.env (root):**
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
```

### Step 4: Test Google Sign-In

1. Restart backend and frontend
2. Open app and click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. Should redirect to dashboard

## 💾 Database Management

### Automated Backups

The backend includes database backup scripts:

**Create Backup:**
```bash
cd backend
npm run db:backup
```

Backups are stored in `backend/backups/` with timestamp:
```
backups/
└── backup_2026-02-09_143022.sql
```

**Schedule Automated Backups:**
```bash
npm run db:backup:schedule
```

Runs daily at 2 AM (configurable in `src/scripts/backup/scheduler.ts`)

### Restore Database

**List Available Backups:**
```bash
npm run db:restore:list
```

**Restore from Backup:**
```bash
npm run db:restore
```

Prompts you to select a backup file.

**Manual Restore:**
```bash
psql -U postgres -d smarthostel < backups/backup_2026-02-09_143022.sql
```

### Cleanup Old Backups

Remove backups older than 30 days:
```bash
npm run db:cleanup
```

### Manual Database Access

**Connect to Database:**
```bash
psql -U postgres -d smarthostel
```

**Common PostgreSQL Commands:**
```sql
\dt                          -- List all tables
\d table_name                -- Describe table structure
SELECT * FROM users LIMIT 10; -- Query users
\q                           -- Quit psql
```

**View Students:**
```sql
SELECT s.roll_number, u.name, s.room_number, s.branch
FROM students s
JOIN users u ON s.user_id = u.id
ORDER BY s.roll_number;
```

## 🛠️ Troubleshooting

### Backend Issues

#### ❌ Port 5000 Already in Use

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Or use a different port:**
```env
# backend/.env
PORT=5001
```

#### ❌ Database Connection Error

**Error:** `Connection refused` or `password authentication failed`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   pg_isready
   
   # Check service status
   net start | findstr postgres
   ```

2. Check credentials in `backend/.env`
   - Ensure `DB_PASSWORD` matches your PostgreSQL password
   - Try connecting manually: `psql -U postgres -d smarthostel`

3. Verify database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS smarthostel;
   ```

#### ❌ TypeScript Compilation Errors

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### ❌ Tables Not Created

Check backend console on startup for SQL errors. Manually run table creation:

```bash
cd backend/src/scripts
ts-node createAllTables.ts
```

### Frontend Issues

#### ❌ Metro Bundler Cache Issues

```bash
npx expo start --clear
```

Or:
```bash
rm -rf .expo
npm start
```

#### ❌ Android Build Errors

```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules package-lock.json
npm install
npx expo run:android
```

#### ❌ Network Request Failed

**Error:** `Network Error` when making API calls

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify API URL in `.env`:**
   - **Android Emulator:** `http://10.0.2.2:5000`
   - **Physical Device:** `http://YOUR_COMPUTER_IP:5000`
     ```bash
     # Find your IP
     ipconfig  # Windows
     ifconfig  # Mac/Linux
     ```
   - **iOS Simulator:** `http://localhost:5000`

3. **Ensure both devices are on same network** (for physical devices)

4. **Check firewall settings** - Allow port 5000

#### ❌ Google Sign-In Not Working

**Error:** `Sign-in failed` or `Invalid client`

**Solutions:**

1. **Verify Client IDs match** in both `.env` files
2. **Check Google Cloud Console:**
   - Is the API enabled?
   - Are redirect URIs correct?
   - Is the OAuth consent screen configured?

3. **Package name matches:**
   - Should be `com.shaswat.smartstay` in `app.config.ts`

4. **Clear app data and retry:**
   ```bash
   adb shell pm clear com.shaswat.smartstay
   ```

#### ❌ "Something Went Wrong" on Android

**Cause:** Usually SHA-1 fingerprint mismatch

**Solution:**
```bash
cd android
./gradlew signingReport
```

Copy the SHA-1 and add it to Google Cloud Console OAuth credentials.

### Database Issues

#### ❌ Permission Denied Errors

Grant proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE smarthostel TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

#### ❌ Database Locked/In Use

Terminate active connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'smarthostel' AND pid <> pg_backend_pid();
```

## 📐 Project Structure

```
smarthostel/
├── app/                          # Frontend pages (Expo Router)
│   ├── (student)/               # Student-protected routes
│   │   └── dashboard.tsx
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── index.tsx            # Student dashboard
│   │   ├── attendance.tsx
│   │   ├── services.tsx
│   │   ├── chat.tsx
│   │   └── profile.tsx
│   ├── admin/                   # Admin-protected routes
│   │   ├── dashboard.tsx
│   │   ├── students.tsx
│   │   ├── attendance.tsx
│   │   ├── complaints.tsx
│   │   ├── leave-requests.tsx
│   │   ├── analytics.tsx
│   │   └── chat/[id].tsx        # Dynamic chat
│   ├── login.tsx                # Authentication
│   └── _layout.tsx              # Root layout
│
├── components/                   # Reusable UI components
│   ├── StudentCard.tsx
│   ├── AttendanceCalendar.tsx
│   ├── ComplaintCard.tsx
│   ├── ChatBubble.tsx
│   └── AdminSidebar.tsx
│
├── store/                        # Global state management (Zustand)
│   ├── useAuthStore.ts           # Authentication & User session
│   ├── useDashboardStore.ts      # Real-time metrics & data sync
│   └── useAlertStore.ts          # Centralized notification system
│
├── context/                      # React Context providers
│   └── ThemeContext.tsx         # Dark mode & visual theme
│
├── utils/                        # Utility functions
│   ├── api.ts                   # Axios API client
│   ├── attendanceUtils.ts
│   ├── chatUtils.ts
│   ├── notificationUtils.ts
│   └── validation.ts
│
├── assets/                       # Static assets
│   ├── images/
│   └── fonts/
│
├── ai-service/                   # Python AI Microservice
│   ├── chatbot/                 # LangChain agent definitions
│   │   ├── tools.py             # Action tools (complaints, leaves)
│   │   ├── chain.py             # Agent executor config
│   │   └── prompts.py           # System instructions
│   ├── main.py                  # Uvicorn FastAPI server
│   └── requirements.txt         # Python dependencies
│
├── backend/                      # Node.js backend server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts            # PostgreSQL connection pool
│   │   ├── controllers/         # Request handlers (16 files)
│   │   │   ├── authController.ts
│   │   │   ├── studentController.ts
│   │   │   ├── attendanceController.ts
│   │   │   ├── chatController.ts
│   │   │   ├── serviceController.ts
│   │   │   ├── facilityController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── ...
│   │   ├── routes/              # API routes (15 files)
│   │   │   ├── authRoutes.ts
│   │   │   ├── studentRoutes.ts
│   │   │   ├── attendanceRoutes.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   └── authorization.ts # Role checks
│   │   ├── scripts/
│   │   │   ├── backup/          # Database backup scripts
│   │   │   └── db/              # Schema creation scripts
│   │   └── index.ts             # Server entry point
│   ├── uploads/                 # User uploaded files
│   ├── backups/                 # Database backups
│   └── package.json
│
├── .env                          # Frontend environment variables
├── backend/.env                  # Backend environment variables
├── .gitignore                    # Git ignore rules
├── package.json                  # Frontend dependencies
├── app.config.ts                 # Expo configuration
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit:
   ```bash
   git commit -m "Add: your feature description"
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Test on both Android and iOS (if possible)
- Update documentation for new features
- Ensure no sensitive data (API keys, passwords) in commits

## 📄 License

This project is available for educational and personal use.

## 👨‍💻 Author

**Shaswat Rastogi**
- GitHub: [@ShaswatRastogi](https://github.com/ShaswatRastogi)
- Repository: [Smart-Hostel-Management-Application](https://github.com/ShaswatRastogi/Smart-Hostel-Management-Application)

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Database powered by [PostgreSQL](https://www.postgresql.org)
- Authentication via [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Built with ❤️ using React Native, Expo, and PostgreSQL**

*For issues or questions, please open an issue on [GitHub](https://github.com/ShaswatRastogi/Smart-Hostel-Management-Application/issues)*
