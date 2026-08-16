import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../services/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    is_admin: boolean;
  };
}

export const authenticateWebApp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const initData = authHeader.split(' ')[1];

  if (process.env.NODE_ENV === 'development' && initData.startsWith('MOCK_')) {
     const mockUserId = initData.replace('MOCK_', '');
     const adminIds = (process.env.ADMIN_IDS || '').split(',');
     req.user = {
         id: parseInt(mockUserId),
         first_name: 'Mock',
         last_name: 'User',
         is_admin: adminIds.includes(mockUserId)
     };
     return next();
  }

  try {
    const parsedData = new URLSearchParams(initData);
    const hash = parsedData.get('hash');
    parsedData.delete('hash');

    // Sort keys alphabetically
    const keys = Array.from(parsedData.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${parsedData.get(key)}`).join('\n');

    const token = process.env.TELEGRAM_BOT_TOKEN || '';

    // HMAC-SHA-256 for secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();

    // HMAC-SHA-256 for hash calculation
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
       res.status(401).json({ error: 'Unauthorized: Invalid hash' });
       return;
    }

    const userJson = parsedData.get('user');
    if (!userJson) {
        res.status(401).json({ error: 'Unauthorized: No user data' });
        return;
    }

    const user = JSON.parse(userJson);
    const adminIds = (process.env.ADMIN_IDS || '').split(',');

    const is_admin = adminIds.includes(user.id.toString());

    // Sync user with database
    await supabase.from('users').upsert({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      is_admin
    }, { onConflict: 'id' });

    req.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      is_admin
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid initData format' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.is_admin) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};
