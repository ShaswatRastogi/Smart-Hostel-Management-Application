import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
    id: number;
    email: string;
    role: string;
}



export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Auth Middleware: No token provided');
        res.status(401).json({ error: 'Not authorized: No token' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as UserPayload;
        (req as any).currentUser = payload;
        next();
    } catch (err) {
        console.log('Auth Middleware: Verification failed', err);
        res.status(401).json({ error: 'Not authorized: Invalid token' });
    }
};

export const requireStaffOrHigher = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).currentUser;
    const staffRoles = ['owner', 'warden', 'staff', 'admin', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'];
    if (!user || !staffRoles.includes(user.role)) {
        console.log(`Auth Middleware: Access denied for user ${user?.email || 'unknown'} with role ${user?.role || 'none'}`);
        res.status(403).json({ error: 'Forbidden: Staff or higher only' });
        return;
    }
    next();
};

export const requireWardenOrOwner = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).currentUser;
    if (!user || !['owner', 'warden', 'admin'].includes(user.role)) {
        console.log(`Auth Middleware: Access denied for user ${user?.email || 'unknown'} with role ${user?.role || 'none'}`);
        res.status(403).json({ error: 'Forbidden: Warden or Owner only' });
        return;
    }
    next();
};

export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).currentUser;
    if (!user || !['owner', 'admin'].includes(user.role)) {
        console.log(`Auth Middleware: Access denied for user ${user?.email || 'unknown'} with role ${user?.role || 'none'}`);
        res.status(403).json({ error: 'Forbidden: Owner only' });
        return;
    }
    next();
};

export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).currentUser;
    if (!user || !roles.includes(user.role)) {
        res.status(403).json({ error: `Forbidden: One of these roles required: ${roles.join(', ')}` });
        return;
    }
    next();
};


