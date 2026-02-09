import 'express';

declare module 'express' {
    interface Request {
        currentUser?: {
            id: number;
            email: string;
            role: string;
        };
    }
}
