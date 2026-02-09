import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ANDROID_CLIENT_ID = process.env.ANDROID_CLIENT_ID; // We will add this to .env

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    try {
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        // Check if password matches
        // For migration: If password_hash is null, we might want to allow setting it or fail
        // Assuming we are setting a default password for migrated users: 'password123'
        // In a real app, we'd use bcrypt.compare

        const { default: bcrypt } = await import('bcrypt');
        const match = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

        if (!match) {
            // FALLBACK FOR MIGRATED USERS (Ideally you shouldn't do this in prod, but for this task)
            if (password === 'password123' && !user.password_hash) {
                // Auto-hash and save
                const hash = await bcrypt.hash(password, 10);
                await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
                // Proceed
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
                return;
            }
        }

        const userJwt = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
            token: userJwt
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }

    try {
        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                process.env.GOOGLE_CLIENT_ID!,
                process.env.ANDROID_CLIENT_ID!
            ],
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ error: 'Invalid Google Token' });
            return;
        }

        const { email } = payload;

        // STRICT: Only look for Google Email in the Student Records (personal_email)
        // We do NOT check the users table directly.
        // We do NOT check google_id.

        const studentResult = await query('SELECT user_id FROM students WHERE google_email = $1', [email]);
        let user = null;

        if (studentResult.rows.length > 0) {
            // Found a match in Student Records
            const userId = studentResult.rows[0].user_id;
            const linkedUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
            user = linkedUserResult.rows[0];
        }

        if (!user) {
            res.status(403).json({ error: 'Google account not found, try again or use google mail' });
            return;
        }

        // Generate JWT
        const userJwt = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
            },
            token: userJwt,
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(400).json({ error: 'Login failed' });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    // req.currentUser is set by requireAuth middleware
    if (!(req as any).currentUser) {
        res.status(401).json({ error: 'Not authorized' });
        return;
    }

    try {
        const userResult = await query('SELECT id, email, full_name, role FROM users WHERE id = $1', [(req as any).currentUser.id]);
        const user = userResult.rows[0];

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}


export const changePassword = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.currentUser?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const { default: bcrypt } = await import('bcrypt');

        // Verify current password
        // Handle migration fallback case if needed, but for security, enforce hash check if hash exists
        let match = false;
        if (user.password_hash) {
            match = await bcrypt.compare(currentPassword, user.password_hash);
        } else {
            // Migration fallback: if no hash, check against plain text (if strictly needed) or default
            match = currentPassword === 'password123';
        }

        if (!match) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

        // Sync with Students table (for Admin view) if user is a student
        if (user.role === 'student') {
            await query('UPDATE students SET password = $1 WHERE user_id = $2', [newPassword, userId]);
        }

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};
