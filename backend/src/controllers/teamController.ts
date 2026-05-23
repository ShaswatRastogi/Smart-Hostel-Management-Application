import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';

// --- Get All Team Members ---
export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT id, email, full_name as "fullName", role, last_seen as "lastSeen", created_at as "createdAt"
            FROM users 
            WHERE role IN ('owner', 'warden', 'staff', 'admin', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff')
            ORDER BY created_at DESC
        `);

        // normalize 'admin' to 'owner' for frontend compatibility
        const team = result.rows.map(row => ({
            ...row,
            role: row.role === 'admin' ? 'owner' : row.role
        }));

        res.json(team);
    } catch (error) {
        console.error("Error fetching team members:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Get Wardens for Students (limited info) ---
export const getWardensForStudents = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT id, full_name as "fullName", role, last_seen as "lastSeen", phone_number as "phoneNumber"
            FROM users 
            WHERE role = 'warden'
            ORDER BY role ASC, full_name ASC
        `);

        const wardens = result.rows;

        res.json(wardens);
    } catch (error) {
        console.error("Error fetching wardens for students:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Create Team Member ---
export const createTeamMember = async (req: Request, res: Response) => {
    const creatorRole = (req as any).currentUser?.role;
    // Treat legacy 'admin' as 'owner'
    const isOwner = creatorRole === 'owner' || creatorRole === 'admin'; 

    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!['warden', 'staff', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be warden or a staff role.' });
        }

        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: `User with email ${email} already exists` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userRes = await query(
            'INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, fullName, role, hashedPassword]
        );

        res.status(201).json({ success: true, id: userRes.rows[0].id });
    } catch (error: any) {
        console.error("Error creating team member:", error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// --- Update Team Member ---
export const updateTeamMember = async (req: Request, res: Response) => {
    const creatorRole = (req as any).currentUser?.role;
    const isOwner = creatorRole === 'owner' || creatorRole === 'admin';
    const { id } = req.params;

    try {
        const targetRes = await query('SELECT role FROM users WHERE id = $1', [id]);
        if (targetRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const targetRole = targetRes.rows[0].role === 'admin' ? 'owner' : targetRes.rows[0].role;

        // Wardens cannot edit owners
        if (!isOwner && targetRole === 'owner') {
            return res.status(403).json({ error: 'Wardens cannot edit Owner details' });
        }

        const { fullName, email, password, role } = req.body;
        
        const updates: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (fullName) {
            updates.push(`full_name = $${paramIdx++}`);
            values.push(fullName);
        }
        if (email) {
            updates.push(`email = $${paramIdx++}`);
            values.push(email);
        }
        if (role && ['warden', 'staff', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'].includes(role)) {
            // Cannot change someone to owner, nor change an owner to something else via this endpoint easily
            if (targetRole !== 'owner') {
                updates.push(`role = $${paramIdx++}`);
                values.push(role);
            }
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${paramIdx++}`);
            values.push(hashedPassword);
        }

        if (updates.length > 0) {
            values.push(id);
            await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error updating team member:", error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// --- Delete Team Member ---
export const deleteTeamMember = async (req: Request, res: Response) => {
    const creatorRole = (req as any).currentUser?.role;
    const isOwner = creatorRole === 'owner' || creatorRole === 'admin';
    const { id } = req.params;

    try {
        const targetRes = await query('SELECT role FROM users WHERE id = $1', [id]);
        if (targetRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const targetRole = targetRes.rows[0].role === 'admin' ? 'owner' : targetRes.rows[0].role;

        // Wardens cannot delete owners
        if (!isOwner && targetRole === 'owner') {
            return res.status(403).json({ error: 'Wardens cannot delete an Owner' });
        }

        // Prevent deleting oneself?
        if (id == (req as any).currentUser.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting team member:", error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
