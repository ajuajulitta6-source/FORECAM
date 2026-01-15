import { AuthenticatedRequest } from './auth';
import { VercelResponse } from '@vercel/node';

export function hasPermission(user: any, permission: string): boolean {
    return user.role === 'ADMIN' || user.permissions?.includes(permission);
}

export function hasRole(user: any, roles: string[]): boolean {
    return user.role === 'ADMIN' || roles.includes(user.role);
}

export function requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: VercelResponse, next: () => void) => {
        if (!hasPermission(req.user!, permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: permission
            });
        }
        next();
    };
}

export function requireRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: VercelResponse, next: () => void) => {
        if (!hasRole(req.user!, roles)) {
            return res.status(403).json({
                error: 'Insufficient role',
                required: roles
            });
        }
        next();
    };
}
