import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// ─── Connection Configs ─────────────────────────────────────────────────────

const supabaseConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
    : null;

const localConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smarthostel',
    password: process.env.DB_PASSWORD || 'hello123',
    port: parseInt(process.env.DB_PORT || '5432'),
};

const poolOptions = {
    max: 15,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30000,
};

// ─── State ──────────────────────────────────────────────────────────────────

let supabasePool: Pool | null = null;
let localPool: Pool | null = null;
let activePool!: Pool;
let usingLocal = false;
let switchPromise: Promise<void> | null = null; // Prevent concurrent switches

function createPool(config: any, label: string): Pool {
    const p = new Pool({ ...config, ...poolOptions });
    p.on('error', (err) => {
        console.error(`[${label}] Idle client error:`, err.message);
    });
    return p;
}

function isConnectionError(err: any): boolean {
    const msg = err?.message || '';
    return (
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ECONNREFUSED' ||
        msg.includes('Connection terminated') ||
        msg.includes('connection timeout') ||
        msg.includes('timeout exceeded')
    );
}

// ─── Switch to local (deduplicated — only one switch at a time) ─────────────

async function switchToLocal(): Promise<void> {
    // If already switching, wait for that to finish
    if (switchPromise) return switchPromise;
    if (usingLocal) return;

    switchPromise = (async () => {
        if (!localPool) {
            localPool = createPool(localConfig, 'Local');
        }
        try {
            await localPool.query('SELECT 1');
            activePool = localPool;
            usingLocal = true;
            console.log('');
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║  ⚠️  SWITCHED to LOCAL DB (Supabase unstable)   ║');
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
        } catch (err: any) {
            console.error('❌ Local DB also unavailable:', err.message);
        } finally {
            switchPromise = null;
        }
    })();

    return switchPromise;
}

// ─── Initialization ─────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
    if (supabaseConfig) {
        supabasePool = createPool(supabaseConfig, 'Supabase');
        try {
            await supabasePool.query('SELECT 1');
            activePool = supabasePool;
            usingLocal = false;
            console.log('');
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║  🌐  Connected to SUPABASE (remote database)   ║');
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
            // Pre-create local pool for instant failover
            localPool = createPool(localConfig, 'Local');
            localPool.query('SELECT 1').catch(() => {
                console.warn('⚠️  Local DB not available for failover');
                localPool = null;
            });
            return;
        } catch (err: any) {
            console.warn('⚠️  Supabase connection failed:', err.message);
            await supabasePool.end().catch(() => {});
            supabasePool = null;
        }
    }

    localPool = createPool(localConfig, 'Local');
    try {
        await localPool.query('SELECT 1');
        activePool = localPool;
        usingLocal = true;
        console.log('');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║  🏠  Using LOCAL PostgreSQL database            ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');
    } catch (err: any) {
        console.error('❌ BOTH databases failed!');
        process.exit(1);
    }
}

// ─── Query with instant failover + retry on local ───────────────────────────

export const query = async (text: string, params?: any[]) => {
    if (!activePool) throw new Error('Database not initialized.');

    try {
        return await activePool.query(text, params);
    } catch (err: any) {
        // On ANY connection error, switch and retry (even if already usingLocal from another query)
        if (isConnectionError(err)) {
            if (!usingLocal) {
                console.warn('⚠️  Supabase query failed, switching to local...', err.message);
                await switchToLocal();
            }
            // Retry on whatever pool is now active (local)
            if (usingLocal) {
                return await activePool.query(text, params);
            }
        }
        throw err;
    }
};

// ─── Pool proxy with failover ───────────────────────────────────────────────

export const pool = new Proxy({} as Pool, {
    get(_target, prop) {
        if (!activePool) {
            throw new Error('Database not initialized. Call initDatabase() first.');
        }

        if (prop === 'query') {
            return async (...args: [string, any[]?]) => {
                try {
                    return await activePool.query(...args);
                } catch (err: any) {
                    if (isConnectionError(err)) {
                        if (!usingLocal) {
                            console.warn('⚠️  Supabase pool.query failed, switching to local...', err.message);
                            await switchToLocal();
                        }
                        if (usingLocal) {
                            return await activePool.query(...args);
                        }
                    }
                    throw err;
                }
            };
        }

        const value = (activePool as any)[prop];
        return typeof value === 'function' ? value.bind(activePool) : value;
    },
});

export const getClient = () => {
    if (!activePool) throw new Error('Database not initialized.');
    return activePool.connect();
};

export const isUsingLocalDB = () => usingLocal;

export default pool;
