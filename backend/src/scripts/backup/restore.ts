import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Database configuration
const DB_NAME = process.env.DB_NAME || 'smart_hostel';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_PASSWORD = process.env.DB_PASSWORD;

/**
 * Restore PostgreSQL database from backup file
 * @param backupFilePath - Full path to the backup file (.sql or .sql.gz)
 * @param dropExisting - Whether to drop existing database before restore
 */
export async function restoreBackup(
    backupFilePath: string,
    dropExisting: boolean = false
): Promise<void> {
    try {
        // Check if backup file exists
        if (!fs.existsSync(backupFilePath)) {
            throw new Error(`Backup file not found: ${backupFilePath}`);
        }

        console.log(`🔄 Starting restore from: ${path.basename(backupFilePath)}`);
        console.log(`📊 Database: ${DB_NAME}`);
        console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}\n`);

        const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

        // If compressed, decompress first
        let sqlFilePath = backupFilePath;
        if (backupFilePath.endsWith('.gz')) {
            console.log('🗜️ Decompressing backup...');
            await execAsync(`gunzip -k "${backupFilePath}"`);
            sqlFilePath = backupFilePath.replace('.gz', '');
        }

        // Drop existing database if requested
        if (dropExisting) {
            console.log('⚠️  Dropping existing database...');
            const dropCommand = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"`;
            await execAsync(dropCommand, { env });

            const createCommand = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`;
            await execAsync(createCommand, { env });
            console.log('✅ Database recreated');
        }

        // Restore the backup
        console.log('📥 Restoring database...');
        const restoreCommand = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${sqlFilePath}"`;

        await execAsync(restoreCommand, { env });

        // Clean up decompressed file if we created it
        if (backupFilePath.endsWith('.gz') && sqlFilePath !== backupFilePath) {
            fs.unlinkSync(sqlFilePath);
        }

        console.log('\n✅ Database restored successfully!');
    } catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    }
}

/**
 * List available backups for restoration
 */
export function listAvailableBackups(): Array<{ filename: string; path: string; size: string; date: Date }> {
    const backupDirs = [
        path.join(__dirname, '../../../backups/daily'),
        path.join(__dirname, '../../../backups/weekly'),
        path.join(__dirname, '../../../backups/monthly'),
    ];

    const backups: Array<{ filename: string; path: string; size: string; date: Date }> = [];

    for (const dir of backupDirs) {
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir)
            .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'));

        for (const file of files) {
            const filepath = path.join(dir, file);
            const stats = fs.statSync(filepath);
            backups.push({
                filename: file,
                path: filepath,
                size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                date: stats.birthtime
            });
        }
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--list') {
        console.log('📋 Available backups:\n');
        const backups = listAvailableBackups();

        if (backups.length === 0) {
            console.log('No backups found.');
            process.exit(0);
        }

        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.filename}`);
            console.log(`   Path: ${backup.path}`);
            console.log(`   Size: ${backup.size}`);
            console.log(`   Date: ${backup.date.toLocaleString()}\n`);
        });

        console.log('\nTo restore a backup, run:');
        console.log('npm run db:restore -- <backup-file-path>');
        console.log('\nTo drop and restore:');
        console.log('npm run db:restore -- <backup-file-path> --drop');

    } else {
        const backupPath = args[0];
        const shouldDrop = args.includes('--drop');

        (async () => {
            try {
                if (shouldDrop) {
                    console.log('⚠️  WARNING: This will DROP the existing database and restore from backup!');
                    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }

                await restoreBackup(backupPath, shouldDrop);
                console.log('\n✨ Restore completed successfully!');
                process.exit(0);
            } catch (error) {
                console.error('\n💥 Restore failed!');
                process.exit(1);
            }
        })();
    }
}
