import { Request, Response } from 'express';
import { query } from '../config/db';

export const getNotices = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM notices ORDER BY created_at DESC');

        // Transform for frontend if needed (e.g., date formatting)
        const notices = result.rows.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.category, // 'critical', 'general'
            date: n.created_at,
            type: n.priority // Mapping priority to type if frontend expects 'type'
        }));
        res.json(notices);
    } catch (error) {
        console.error('Get Notices Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMessMenu = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM mess_schedule ORDER BY day_of_week ASC');
        // Group by day? Or send flat list?
        // Frontend likely expects objects like { day: 'Monday', breakfast: '...', ... }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const menuMap: any = {};

        result.rows.forEach(row => {
            const dayName = days[row.day_of_week];
            if (!menuMap[dayName]) {
                menuMap[dayName] = { day: dayName };
            }
            menuMap[dayName][row.meal_type] = row.menu;
        });

        // Convert to array
        const menuArray = Object.values(menuMap);
        res.json(menuArray);
    } catch (error) {
        console.error('Get Mess Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getBusTimings = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM bus_timings WHERE is_active = true ORDER BY departure_time ASC');
        const timings = result.rows.map(row => ({
            id: row.id,
            route: row.route_name,
            time: row.departure_time, // Postgres might return HH:MM:SS
            destination: row.destination,
            message: row.message
        }));
        res.json(timings);
    } catch (error) {
        console.error('Get Bus Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ... keep existing ...

export const getEmergencyContacts = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM emergency_contacts ORDER BY name ASC');
        const contacts = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            role: row.designation,
            phone: row.phone,
            type: row.category,
            icon: row.icon
        }));
        res.json(contacts);
    } catch (error) {
        console.error('Get Contacts Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createEmergencyContact = async (req: Request, res: Response) => {
    try {
        const { name, title, number, icon, category } = req.body; // Frontend sends title/number
        // Map title->designation, number->phone
        await query(
            'INSERT INTO emergency_contacts (name, designation, phone, icon, category) VALUES ($1, $2, $3, $4, $5)',
            [name, title, number, icon || 'phone', category || 'General']
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Create Contact Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateEmergencyContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, title, number, icon, category } = req.body;

        // Dynamic update is better but keeping it simple
        await query(
            'UPDATE emergency_contacts SET name = $1, designation = $2, phone = $3, icon = $4, category = $5, updated_at = NOW() WHERE id = $6',
            [name, title, number, icon, category, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Update Contact Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteEmergencyContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM emergency_contacts WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Contact Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateMessMenu = async (req: Request, res: Response) => {
    const { dayOfWeek, mealType, menu } = req.body;
    try {
        // Upsert logic: Update if exists, Insert if not
        // Check if exists
        const check = await query(
            'SELECT id FROM mess_schedule WHERE day_of_week = $1 AND meal_type = $2',
            [dayOfWeek, mealType]
        );

        if (check.rows.length > 0) {
            await query(
                'UPDATE mess_schedule SET menu = $1, updated_at = NOW() WHERE id = $2',
                [menu, check.rows[0].id]
            );
        } else {
            await query(
                'INSERT INTO mess_schedule (day_of_week, meal_type, menu) VALUES ($1, $2, $3)',
                [dayOfWeek, mealType, menu]
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating mess menu:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
