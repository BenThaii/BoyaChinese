/**
 * Admin API Routes
 * 
 * Provides password-protected REST API endpoints for database backup and restore:
 * - POST /api/admin/authenticate - Authenticate with password
 * - GET /api/admin/backup - Export database backup (requires authentication)
 * - POST /api/admin/restore - Import and restore database (requires authentication)
 */

import { Router, Request, Response } from 'express';
import { DatabaseBackupManager } from '../services/DatabaseBackupManager';

const router = Router();
const backupManager = new DatabaseBackupManager();

// In-memory session storage for authenticated sessions
// In production, use Redis or similar for distributed sessions
interface Session {
  token: string;
  expiresAt: number;
  timeoutId?: NodeJS.Timeout;
}

const authenticatedSessions = new Map<string, Session>();

/**
 * Generate a simple session token
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Clean up expired session
 */
function cleanupSession(token: string) {
  const session = authenticatedSessions.get(token);
  if (session?.timeoutId) {
    clearTimeout(session.timeoutId);
  }
  authenticatedSessions.delete(token);
}

/**
 * Clean up all sessions (for testing)
 */
export function cleanupAllSessions() {
  for (const [token] of authenticatedSessions) {
    cleanupSession(token);
  }
  authenticatedSessions.clear();
}

/**
 * Middleware to check authentication
 */
function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const session = authenticatedSessions.get(token);
  
  if (!session || Date.now() > session.expiresAt) {
    if (session) {
      cleanupSession(token);
    }
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  next();
}

/**
 * POST /api/admin/authenticate
 * 
 * Authenticate with password and receive session token
 */
router.post('/admin/authenticate', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const isValid = backupManager.authenticate(password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate session token
    const token = generateSessionToken();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now
    
    const session: Session = {
      token,
      expiresAt
    };

    // Set token expiration (1 hour)
    const timeoutId = setTimeout(() => {
      cleanupSession(token);
    }, 60 * 60 * 1000);
    
    session.timeoutId = timeoutId;
    authenticatedSessions.set(token, session);

    res.json({ 
      success: true,
      token,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/admin/backup
 * 
 * Export complete database backup (requires authentication)
 */
router.get('/admin/backup', requireAuth, async (req: Request, res: Response) => {
  try {
    const backupFile = await backupManager.exportDatabase();

    // Set headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `chinese-learning-backup-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(backupFile);
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

/**
 * POST /api/admin/restore
 * 
 * Import and restore database from backup file (requires authentication)
 */
router.post('/admin/restore', requireAuth, async (req: Request, res: Response) => {
  try {
    const backupFile = req.body;

    if (!backupFile || typeof backupFile !== 'object') {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    const result = await backupManager.importDatabase(backupFile);

    if (!result.success) {
      return res.status(400).json({ 
        error: 'Failed to restore database',
        details: result.errors
      });
    }

    res.json({
      success: true,
      message: 'Database restored successfully',
      entriesRestored: result.entriesRestored
    });
  } catch (error) {
    console.error('Error restoring database:', error);
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

export default router;
