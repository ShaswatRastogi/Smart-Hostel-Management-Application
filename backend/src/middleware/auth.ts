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

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).currentUser || (req as any).currentUser.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden: Admins only' });
        return;
    }
    next();
};
