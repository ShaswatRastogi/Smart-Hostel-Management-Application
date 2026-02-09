import { Request, Response } from 'express';
import { query } from '../config/db';

export const getAllRooms = async (req: Request, res: Response) => {
    try {
        // Fetch rooms
        const roomsResult = await query('SELECT * FROM rooms ORDER BY room_number ASC');
        const rooms = roomsResult.rows;

        // Fetch active allocations to get occupants
        const allocationsResult = await query(`
            SELECT ra.room_id, s.roll_no, u.full_name
            FROM room_allocations ra
            JOIN students s ON ra.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE ra.is_active = true
        `);

        // Map occupants to rooms
        const roomsWithOccupants = rooms.map(room => {
            const occupants = allocationsResult.rows.filter(a => a.room_id === room.id);
            return {
                id: room.id,
                number: room.room_number,
                capacity: room.capacity,
                status: room.status,
                occupantDetails: occupants.map(o => ({
                    name: o.full_name,
                    rollNo: o.roll_no
                })),
                occupants: occupants.map(o => o.full_name), // Legacy support if needed
                wifiSSID: room.wifi_ssid,
                wifiPassword: room.wifi_password
            };
        });

        res.json(roomsWithOccupants);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    const { id } = req.params; // Expecting ID, but frontend might send room Number. Let's support ID.
    // Actually frontend handleDeleteRoom passes roomNo. We should probably support deleting by ID if we update frontend,
    // or by room_number.
    // Best practice: use ID. I will update frontend to use ID.

    try {
        await query('DELETE FROM rooms WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
