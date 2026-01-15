import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

export interface AuthenticatedRequest extends VercelRequest {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        permissions: string[];
        status: string;
    };
}

export type ApiHandler = (
    req: AuthenticatedRequest,
    res: VercelResponse
) => Promise<void | VercelResponse>;

/**
 * Authentication middleware wrapper
 * Validates JWT token and attaches user to request
 */
export function withAuth(handler: ApiHandler) {
    return async (req: AuthenticatedRequest, res: VercelResponse) => {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'No authorization token provided'
                });
            }

            const token = authHeader.replace('Bearer ', '');

            // Verify JWT with Supabase
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !user) {
                return res.status(401).json({
                    error: 'Invalid or expired token'
                });
            }

            // Fetch user profile from database
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                return res.status(403).json({
                    error: 'User profile not found'
                });
            }

            // Check if user is active
            if (profile.status !== 'ACTIVE') {
                return res.status(403).json({
                    error: 'User account is not active'
                });
            }

            // Attach user to request
            req.user = profile;

            // Call the actual handler
            return handler(req, res);
        } catch (error: any) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                error: 'Authentication failed',
                message: error.message
            });
        }
    };
}
