import { Request, Response } from 'express';
import pool from '../config/db';

// How long (in minutes) before a session is considered offline
const ONLINE_THRESHOLD_MINUTES = 1;

// Get all ONLINE sessions for the current user (active within the last 5 minutes)
export const getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).currentUser?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Accept the caller's refresh token to dynamically identify which session is "current"
        const callerRefreshToken = req.query.refreshToken as string | undefined;

        // Only fetch sessions that have been active within the threshold
        const result = await pool.query(
            `SELECT id, device_name, app_version, ip_address, location, last_active, refresh_token 
             FROM user_sessions 
             WHERE user_id = $1 AND last_active > NOW() - INTERVAL '${ONLINE_THRESHOLD_MINUTES} minutes'
             ORDER BY last_active DESC`,
            [userId]
        );

        // Dynamically compute is_current by matching the caller's refresh token
        const sessions = result.rows.map(row => ({
            id: row.id,
            device_name: row.device_name,
            app_version: row.app_version,
            ip_address: row.ip_address,
            location: row.location,
            last_active: row.last_active,
            is_current: callerRefreshToken ? row.refresh_token === callerRefreshToken : false,
        }));

        // Also update last_active for the current session
        if (callerRefreshToken) {
            await pool.query(
                'UPDATE user_sessions SET last_active = NOW() WHERE user_id = $1 AND refresh_token = $2',
                [userId, callerRefreshToken]
            );
        }

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

// Heartbeat: update last_active for the current session to keep it "online"
export const heartbeat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).currentUser?.id;
        const { refreshToken } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!refreshToken) {
            res.status(400).json({ error: 'refreshToken is required' });
            return;
        }

        const result = await pool.query(
            'UPDATE user_sessions SET last_active = NOW() WHERE user_id = $1 AND refresh_token = $2',
            [userId, refreshToken]
        );

        // If no rows updated, the session was terminated by another device
        if (result.rowCount === 0) {
            res.json({ ok: true, valid: false });
            return;
        }

        res.json({ ok: true, valid: true });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
};

// Logout: delete the current session from the database
export const logoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).currentUser?.id;
        const { refreshToken } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (refreshToken) {
            await pool.query(
                'DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token = $2',
                [userId, refreshToken]
            );
        }

        res.json({ message: 'Session logged out successfully' });
    } catch (error) {
        console.error('Error logging out session:', error);
        res.status(500).json({ error: 'Failed to logout session' });
    }
};

// Revoke a specific session
export const revokeSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).currentUser?.id;
        const sessionId = req.params.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await pool.query(
            'DELETE FROM user_sessions WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Error revoking session:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
};

// Revoke all other sessions except the current one
export const revokeAllOtherSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).currentUser?.id;
        const currentSessionToken = req.body.refreshToken;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (currentSessionToken) {
            await pool.query(
                'DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token != $2',
                [userId, currentSessionToken]
            );
        } else {
            await pool.query(
                'DELETE FROM user_sessions WHERE user_id = $1 AND is_current = false',
                [userId]
            );
        }

        res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
        console.error('Error revoking all other sessions:', error);
        res.status(500).json({ error: 'Failed to revoke sessions' });
    }
};
