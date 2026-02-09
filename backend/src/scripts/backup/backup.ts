import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '../../../backups/daily');
const DB_NAME = process.env.DB_NAME || 'smart_hostel';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_PASSWORD = process.env.DB_PASSWORD;

/**
 * Create PostgreSQL database backup
 * Uses pg_dump to create a compressed SQL dump
 */
export async function createBackup(): Promise<string> {
    try {
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);

        console.log(`🔄 Starting backup: ${filename}`);

        // Set PGPASSWORD environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

        // Run pg_dump command
        const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${filepath}"`;

        await execAsync(command, { env });

        // Verify backup file was created and has content
        const stats = fs.statSync(filepath);
        if (stats.size === 0) {
            throw new Error('Backup file is empty');
        }

        console.log(`✅ Backup created successfully: ${filename}`);
        console.log(`📁 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📍 Location: ${filepath}`);

        return filepath;
    } catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    }
}

/**
 * Compress backup file using gzip (optional)
 */
export async function compressBackup(filepath: string): Promise<string> {
    try {
        const gzipPath = `${filepath}.gz`;
        await execAsync(`gzip -f "${filepath}"`);
        console.log(`🗜️ Backup compressed: ${path.basename(gzipPath)}`);
        return gzipPath;
    } catch (error) {
        console.error('❌ Compression failed:', error);
        throw error;
    }
}

/**
 * Get backup file info
 */
export function getBackupInfo(filepath: string) {
    const stats = fs.statSync(filepath);
    return {
        filename: path.basename(filepath),
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.birthtime,
        path: filepath
    };
}

/**
 * List all available backups
 */
export function listBackups(): string[] {
    if (!fs.existsSync(BACKUP_DIR)) {
        return [];
    }

    return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
        .sort()
        .reverse(); // Most recent first
}

// Run backup if called directly
if (require.main === module) {
    (async () => {
        try {
            console.log('🚀 Starting database backup...');
            console.log(`📊 Database: ${DB_NAME}`);
            console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}`);
            console.log(`👤 User: ${DB_USER}\n`);

            const backupPath = await createBackup();

            // Optional: Compress the backup
            // await compressBackup(backupPath);

            console.log('\n✨ Backup completed successfully!');
            process.exit(0);
        } catch (error) {
            console.error('\n💥 Backup failed!');
            process.exit(1);
        }
    })();
}
