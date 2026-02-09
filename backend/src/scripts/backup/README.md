# Database Backup System

## Overview
Automated PostgreSQL backup system for Smart Hostel Management Application.

## Features
- ✅ **Automated Daily Backups** - Runs at 2:00 AM IST
- ✅ **Manual Backups** - On-demand backup creation
- ✅ **Easy Restoration** - Restore from any backup file
- ✅ **Retention Policy** - Automatically cleans old backups
- ✅ **Backup Statistics** - View backup usage and counts

## Backup Schedule
- **Daily**: Keep last 7 backups
- **Weekly**: Keep last 4 backups (optional)
- **Monthly**: Keep last 3 backups (optional)

## Available Commands

### Create Manual Backup
```bash
cd backend
npm run db:backup
```

### List Available Backups
```bash
cd backend
npm run db:restore:list
```

### Restore from Backup
```bash
cd backend
# Restore without dropping existing database
npm run db:restore -- /path/to/backup-2026-02-09.sql

# Drop and restore (WARNING: Deletes all current data)
npm run db:restore -- /path/to/backup-2026-02-09.sql --drop
```

### Clean Old Backups
```bash
cd backend
npm run db:cleanup
```

### Start Automated Scheduler
```bash
cd backend
npm run db:backup:schedule
```
> This will run in the background and perform daily backups at 2:00 AM.
> Press Ctrl+C to stop the scheduler.

## Backup Locations

Backups are stored in `backend/backups/`:
```
backend/
  backups/
    daily/
      backup-2026-02-09.sql
      backup-2026-02-08.sql
    weekly/
    monthly/
```

## Environment Variables

Make sure these are set in your `.env` file:
```env
DB_NAME=smart_hostel
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Production Deployment

### Option 1: PM2 (Recommended)
Install PM2 to keep the scheduler running:
```bash
npm install -g pm2

# Start scheduler with PM2
pm2 start "npm run db:backup:schedule" --name backup-scheduler
pm2 save
pm2 startup
```

### Option 2: System Cron Job
Alternatively, set up a system cron job:
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/backend && npm run db:backup
```

## Cloud Backup (Optional)

For production, upload backups to cloud storage:

### AWS S3 Example
```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Upload backup to S3
aws s3 cp backend/backups/daily/backup-2026-02-09.sql s3://your-bucket/backups/
```

### Google Cloud Storage Example
```bash
# Install gcloud CLI
# Upload backup
gsutil cp backend/backups/daily/backup-2026-02-09.sql gs://your-bucket/backups/
```

## Backup Verification

Test your backup system regularly:
```bash
# 1. Create a test backup
npm run db:backup

# 2. Create a test database
psql -U postgres -c "CREATE DATABASE test_restore;"

# 3. Restore to test database (modify script to use test_restore)
# Edit restore.ts temporarily or restore manually:
psql -U postgres -d test_restore -f backups/daily/backup-2026-02-09.sql

# 4. Verify data
psql -U postgres -d test_restore -c "SELECT COUNT(*) FROM students;"

# 5. Drop test database
psql -U postgres -c "DROP DATABASE test_restore;"
```

## Monitoring & Alerts

### Add Email Alerts (TODO)
Modify `scheduler.ts` to send emails on backup failure:
```typescript
import nodemailer from 'nodemailer';

// After backup fails
const transporter = nodemailer.createTransport({...});
await transporter.sendMail({
    to: 'admin@example.com',
    subject: '❌ Database Backup Failed',
    text: `Backup failed: ${error.message}`
});
```

### Add Slack Alerts (TODO)
```typescript
import axios from 'axios';

// Send to Slack webhook
await axios.post(SLACK_WEBHOOK_URL, {
    text: '❌ Database backup failed!'
});
```

## Troubleshooting

### pg_dump not found
Install PostgreSQL client tools:
```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# Windows
# Ensure PostgreSQL bin directory is in PATH
```

### Permission denied
Ensure the backup directory is writable:
```bash
chmod 755 backend/backups
```

### Backup file is empty
Check database credentials in `.env` file.

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to Git
- Encrypt backups for sensitive data
- Store backups in secure location
- Restrict access to backup files
- Use strong database passwords

## Restore Procedure (Emergency)

If your database is corrupted:
```bash
# 1. List available backups
npm run db:restore:list

# 2. Stop your backend server
pm2 stop backend

# 3. Restore from most recent backup
npm run db:restore -- backups/daily/backup-2026-02-09.sql --drop

# 4. Restart backend
pm2 start backend
```

## File Structure
```
backend/src/scripts/backup/
├── backup.ts      - Create backups
├── restore.ts     - Restore from backups
├── cleanup.ts     - Remove old backups
└── scheduler.ts   - Automated scheduling
```
