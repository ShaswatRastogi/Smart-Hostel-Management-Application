import cron from 'node-cron';
import { createBackup } from './backup';
import { cleanupOldBackups } from './cleanup';

/**
 * Schedule automated database backups
 * Runs daily at 2:00 AM
 */
export function scheduleBackups() {
    console.log('🕐 Backup scheduler started');
    console.log('📅 Schedule: Daily at 2:00 AM\n');

    // Run backup daily at 2:00 AM
    // Pattern: minute hour day month weekday
    cron.schedule('0 2 * * *', async () => {
        console.log('\n⏰ Scheduled backup starting...');
        console.log(`🕒 Time: ${new Date().toLocaleString()}\n`);

        try {
            // Create backup
            await createBackup();

            // Clean up old backups
            console.log('\n🧹 Running cleanup...');
            await cleanupOldBackups();

            console.log('\n✅ Scheduled backup completed successfully!');
        } catch (error) {
            console.error('\n❌ Scheduled backup failed:', error);
            // TODO: Send alert notification (email, Slack, etc.)
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // Adjust to your timezone
    });

    console.log('✅ Scheduler is running. Waiting for schedule...');
}

// Start scheduler if run directly
if (require.main === module) {
    scheduleBackups();

    // Keep the process running
    console.log('\n💡 Press Ctrl+C to stop the scheduler\n');

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Backup scheduler stopped');
        process.exit(0);
    });
}
