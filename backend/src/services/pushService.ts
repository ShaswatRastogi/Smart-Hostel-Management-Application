import { firebaseAdmin as admin, firebaseInitialized } from '../config/firebase';
import { query } from '../config/db';

// Auto-clear a bad token from the database
async function clearInvalidToken(token: string) {
    try {
        await query(`UPDATE users SET push_token = NULL WHERE push_token = $1`, [token]);
        console.log(`[Push] 🧹 Cleared invalid token from DB: ${token.substring(0, 20)}...`);
    } catch (e) {
        console.error('[Push] Failed to clear invalid token:', e);
    }
}

// ─── Send Push Notification ───────────────────────────────────────────────────
export const sendPushNotification = async (
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {}
) => {
    if (!firebaseInitialized) {
        console.warn(`[Push] ⚠️  Firebase not initialized — skipping: "${title}"`);
        return;
    }

    // Filter out stale Expo tokens — they will never work with FCM V1
    const validTokens = tokens.filter(t => t && t.length > 10 && !t.startsWith('ExponentPushToken'));
    const expoTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));

    // Auto-clear any stale Expo tokens from DB
    for (const stale of expoTokens) {
        console.warn(`[Push] ⚠️  Skipping stale Expo token, clearing from DB: ${stale}`);
        await clearInvalidToken(stale);
    }

    if (validTokens.length === 0) {
        console.warn(`[Push] ⚠️  No valid FCM tokens to send "${title}" to. App needs to reload to register a new token.`);
        return;
    }

    console.log(`[Push] Sending "${title}" to ${validTokens.length} token(s)`);

    const results = await Promise.allSettled(
        validTokens.map(token =>
            admin.messaging().send({
                token,
                notification: { title, body },
                android: {
                    priority: 'high',
                    notification: { sound: 'default', channelId: 'default' },
                },
                data: Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
            })
        )
    );

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            console.log(`[Push] ✅ Delivered to token #${i + 1}`);
        } else {
            const errMsg: string = result.reason?.message ?? '';
            console.error(`[Push] ❌ Failed for token #${i + 1}:`, errMsg);
            // Auto-clear unregistered/invalid tokens
            if (
                errMsg.includes('registration-token-not-registered') ||
                errMsg.includes('invalid registration token') ||
                errMsg.includes('not a valid FCM') ||
                errMsg.includes('Requested entity was not found') ||
                errMsg.includes('messaging/invalid-argument')
            ) {
                clearInvalidToken(validTokens[i]);
            }
        }
    });
};

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const getAdminTokens = async (): Promise<string[]> => {
    const res = await query(`SELECT push_token FROM users WHERE role = 'admin' AND push_token IS NOT NULL`);
    return res.rows.map(r => r.push_token).filter(Boolean);
};

export const getUserToken = async (userId: number, category?: string): Promise<string[]> => {
    let sql = `SELECT push_token, notification_preferences FROM users WHERE id = $1 AND push_token IS NOT NULL`;
    const res = await query(sql, [userId]);

    if (res.rows.length === 0) return [];

    const user = res.rows[0];
    if (user.notification_preferences) {
        if (user.notification_preferences.master === false) {
            console.log(`[Push] 🔇 User ${userId} has disabled ALL notifications (master toggle). Skipping.`);
            return [];
        }

        if (category && user.notification_preferences[category] === false) {
            console.log(`[Push] 🔇 User ${userId} has disabled "${category}" notifications. Skipping.`);
            return [];
        }
    }

    return [user.push_token].filter(Boolean);
};

export const getAllStudentTokens = async (category?: string): Promise<string[]> => {
    let sql = `SELECT push_token, notification_preferences FROM users WHERE role = 'student' AND push_token IS NOT NULL`;
    const res = await query(sql);

    return res.rows
        .filter(row => {
            if (row.notification_preferences) {
                if (row.notification_preferences.master === false) return false;
                if (category && row.notification_preferences[category] === false) return false;
            }
            return true;
        })
        .map(r => r.push_token)
        .filter(Boolean);
};
