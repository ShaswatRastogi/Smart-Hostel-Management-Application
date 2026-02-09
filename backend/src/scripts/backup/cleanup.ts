import * as fs from 'fs';
import * as path from 'path';

// Backup retention configuration
const RETENTION_POLICY = {
    daily: 7,    // Keep last 7 daily backups
    weekly: 4,   // Keep last 4 weekly backups
    monthly: 3   // Keep last 3 monthly backups
};

const BACKUP_BASE_DIR = path.join(__dirname, '../../../backups');

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<void> {
    try {
        console.log('🧹 Starting backup cleanup...\n');

        // Clean daily backups
        await cleanupDirectory(
            path.join(BACKUP_BASE_DIR, 'daily'),
            RETENTION_POLICY.daily,
            'daily'
        );

        // Clean weekly backups
        await cleanupDirectory(
            path.join(BACKUP_BASE_DIR, 'weekly'),
            RETENTION_POLICY.weekly,
            'weekly'
        );

        // Clean monthly backups
        await cleanupDirectory(
            path.join(BACKUP_BASE_DIR, 'monthly'),
            RETENTION_POLICY.monthly,
            'monthly'
        );

        console.log('\n✅ Cleanup completed successfully!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

/**
 * Clean up backups in a specific directory
 */
async function cleanupDirectory(
    dirPath: string,
    keepCount: number,
    type: string
): Promise<void> {
    if (!fs.existsSync(dirPath)) {
        console.log(`⏭️  Skipping ${type} backups (directory doesn't exist)`);
        return;
    }

    // Get all backup files sorted by date (newest first)
    const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
        .map(file => ({
            name: file,
            path: path.join(dirPath, file),
            time: fs.statSync(path.join(dirPath, file)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

    console.log(`📁 ${type.charAt(0).toUpperCase() + type.slice(1)} backups: ${files.length} found, keeping ${keepCount}`);

    // Delete old backups (keep only the newest N)
    const filesToDelete = files.slice(keepCount);

    if (filesToDelete.length === 0) {
        console.log(`   ✓ No cleanup needed\n`);
        return;
    }

    let deletedSize = 0;
    for (const file of filesToDelete) {
        const stats = fs.statSync(file.path);
        deletedSize += stats.size;
        fs.unlinkSync(file.path);
        console.log(`   🗑️  Deleted: ${file.name}`);
    }

    console.log(`   ✓ Freed ${(deletedSize / 1024 / 1024).toFixed(2)} MB\n`);
}

/**
 * Get backup statistics
 */
export function getBackupStats() {
    const stats = {
        daily: { count: 0, size: 0 },
        weekly: { count: 0, size: 0 },
        monthly: { count: 0, size: 0 },
        total: { count: 0, size: 0 }
    };

    const dirs = ['daily', 'weekly', 'monthly'];

    for (const dir of dirs) {
        const dirPath = path.join(BACKUP_BASE_DIR, dir);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'));

        stats[dir as 'daily' | 'weekly' | 'monthly'].count = files.length;

        for (const file of files) {
            const filepath = path.join(dirPath, file);
            const fileStats = fs.statSync(filepath);
            stats[dir as 'daily' | 'weekly' | 'monthly'].size += fileStats.size;
            stats.total.size += fileStats.size;
            stats.total.count++;
        }
    }

    return stats;
}

/**
 * Display backup statistics
 */
export function displayStats(): void {
    console.log('📊 Backup Statistics\n');

    const stats = getBackupStats();

    console.log(`Daily backups:   ${stats.daily.count} files, ${(stats.daily.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Weekly backups:  ${stats.weekly.count} files, ${(stats.weekly.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Monthly backups: ${stats.monthly.count} files, ${(stats.monthly.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\nTotal:           ${stats.total.count} files, ${(stats.total.size / 1024 / 1024).toFixed(2)} MB`);
}

// Run cleanup if called directly
if (require.main === module) {
    (async () => {
        try {
            console.log('🚀 Database Backup Cleanup\n');
            console.log(`Retention Policy:`);
            console.log(`  Daily: Keep last ${RETENTION_POLICY.daily} backups`);
            console.log(`  Weekly: Keep last ${RETENTION_POLICY.weekly} backups`);
            console.log(`  Monthly: Keep last ${RETENTION_POLICY.monthly} backups\n`);

            await cleanupOldBackups();

            console.log('\n');
            displayStats();

            process.exit(0);
        } catch (error) {
            console.error('\n💥 Cleanup failed!');
            process.exit(1);
        }
    })();
}
