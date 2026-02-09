# Backup System - Quick Reference

## One-Line Commands

```bash
# Create backup NOW
npm run db:backup

# List all backups
npm run db:restore:list

# Restore (safe - no drop)
npm run db:restore -- backups/daily/backup-YYYY-MM-DD.sql

# Restore (dangerous - drops DB first)
npm run db:restore -- backups/daily/backup-YYYY-MM-DD.sql --drop

# Clean old backups
npm run db:cleanup

# Start auto-scheduler (runs at 2 AM daily)
npm run db:backup:schedule
```

## Production Setup (PM2)

```bash
npm install -g pm2
cd backend
pm2 start npm --name "db-backup" -- run db:backup:schedule
pm2 save
pm2 startup
```

---
**Location:** `backend/backups/daily/`
**Schedule:** 2:00 AM daily
**Retention:** 7 daily, 4 weekly, 3 monthly
