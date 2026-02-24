/**
 * DatabaseBackupManager Service
 * 
 * Handles database backup and restore operations with password protection.
 * Provides complete database export/import functionality with data integrity validation.
 */

import { VocabularyEntryDAO, VocabularyEntry } from '../models/VocabularyEntry';
import crypto from 'crypto';

/**
 * Backup file structure containing all vocabulary entries
 */
export interface BackupFile {
  version: string;
  exportedAt: Date;
  users?: string[]; // Optional for backward compatibility
  vocabularyEntries: VocabularyEntry[];
  checksum: string;
}

/**
 * Result of database restore operation
 */
export interface RestoreResult {
  success: boolean;
  entriesRestored: number;
  errors?: string[];
}

/**
 * Result of backup file validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * DatabaseBackupManager handles password-protected backup and restore operations
 */
export class DatabaseBackupManager {
  private static readonly ADMIN_PASSWORD = 'BoyaChineseBach';
  private static readonly BACKUP_VERSION = '1.0';

  /**
   * Authenticate admin access with password
   * @param password - Password to validate
   * @returns True if password is correct
   */
  authenticate(password: string): boolean {
    return password === DatabaseBackupManager.ADMIN_PASSWORD;
  }

  /**
   * Export entire database to backup file
   * @returns Backup file containing all vocabulary entries
   */
  async exportDatabase(): Promise<BackupFile> {
    // Get all users
    const users = await this.getAllUsers();
    
    // Get all vocabulary entries from all users
    const entries = await this.getAllVocabularyEntries();

    const backupFile: BackupFile = {
      version: DatabaseBackupManager.BACKUP_VERSION,
      exportedAt: new Date(),
      users: users,
      vocabularyEntries: entries,
      checksum: ''
    };

    // Calculate checksum for data integrity
    backupFile.checksum = this.calculateChecksum(backupFile);

    return backupFile;
  }

  /**
   * Import and restore database from backup file
   * @param backupFile - Backup file to restore
   * @returns Restore result with success status and entry count
   */
  async importDatabase(backupFile: BackupFile): Promise<RestoreResult> {
    // Validate backup file first
    const validation = await this.validateBackupFile(backupFile);
    if (!validation.valid) {
      return {
        success: false,
        entriesRestored: 0,
        errors: validation.errors
      };
    }

    try {
      // Erase all existing data
      await this.eraseAllUsers();
      await this.eraseAllVocabularyEntries();

      // Extract users from backup (either from users field or from vocabulary entries)
      let usersToRestore: string[];
      if (backupFile.users && backupFile.users.length > 0) {
        usersToRestore = backupFile.users;
      } else {
        // Backward compatibility: extract unique usernames from vocabulary entries
        usersToRestore = [...new Set(backupFile.vocabularyEntries.map(entry => entry.username))];
      }

      // Restore users first
      await this.restoreUsers(usersToRestore);
      
      // Restore all entries from backup
      const restoredCount = await this.restoreVocabularyEntries(backupFile.vocabularyEntries);

      return {
        success: true,
        entriesRestored: restoredCount
      };
    } catch (error) {
      return {
        success: false,
        entriesRestored: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error during restore']
      };
    }
  }

  /**
   * Validate backup file format and integrity
   * @param backupFile - Backup file to validate
   * @returns Validation result with errors if invalid
   */
  async validateBackupFile(backupFile: BackupFile): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check required fields
    if (!backupFile.version) {
      errors.push('Missing version field');
    }

    if (!backupFile.exportedAt) {
      errors.push('Missing exportedAt field');
    }

    // Users field is optional for backward compatibility with old backups
    // If missing, we'll extract users from vocabulary entries

    if (!backupFile.vocabularyEntries) {
      errors.push('Missing vocabularyEntries field');
    }

    if (!backupFile.checksum) {
      errors.push('Missing checksum field');
    }

    // Validate version compatibility
    if (backupFile.version !== DatabaseBackupManager.BACKUP_VERSION) {
      errors.push(`Incompatible backup version: ${backupFile.version} (expected ${DatabaseBackupManager.BACKUP_VERSION})`);
    }

    // Validate checksum
    const calculatedChecksum = this.calculateChecksum(backupFile);
    if (backupFile.checksum !== calculatedChecksum) {
      errors.push('Checksum mismatch - backup file may be corrupted');
    }

    // Validate vocabulary entries structure
    if (Array.isArray(backupFile.vocabularyEntries)) {
      for (let i = 0; i < backupFile.vocabularyEntries.length; i++) {
        const entry = backupFile.vocabularyEntries[i];
        const entryErrors = this.validateVocabularyEntry(entry, i);
        errors.push(...entryErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Calculate checksum for backup file integrity validation
   * @param backupFile - Backup file to calculate checksum for
   * @returns Checksum string
   */
  private calculateChecksum(backupFile: BackupFile): string {
    // Create a copy without checksum for calculation
    const dataForChecksum: any = {
      version: backupFile.version,
      exportedAt: backupFile.exportedAt,
      vocabularyEntries: backupFile.vocabularyEntries
    };

    // Include users field only if it exists (for backward compatibility)
    if (backupFile.users) {
      dataForChecksum.users = backupFile.users;
    }

    const dataString = JSON.stringify(dataForChecksum);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Validate a single vocabulary entry structure
   * @param entry - Entry to validate
   * @param index - Entry index for error reporting
   * @returns Array of validation errors
   */
  private validateVocabularyEntry(entry: any, index: number): string[] {
    const errors: string[] = [];

    if (!entry.id) {
      errors.push(`Entry ${index}: Missing id field`);
    }

    if (!entry.username) {
      errors.push(`Entry ${index}: Missing username field`);
    }

    if (!entry.chineseCharacter) {
      errors.push(`Entry ${index}: Missing chineseCharacter field`);
    }

    if (!entry.pinyin) {
      errors.push(`Entry ${index}: Missing pinyin field`);
    }

    if (entry.chapter === undefined || entry.chapter === null) {
      errors.push(`Entry ${index}: Missing chapter field`);
    }

    return errors;
  }

  /**
   * Get all users from the database
   * @returns Array of usernames
   */
  private async getAllUsers(): Promise<string[]> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    const [rows] = await pool.query<any[]>(
      'SELECT username FROM users ORDER BY username'
    );

    return rows.map(row => row.username);
  }

  /**
   * Get all vocabulary entries from all users
   * @returns Array of all vocabulary entries
   */
  private async getAllVocabularyEntries(): Promise<VocabularyEntry[]> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    const [rows] = await pool.query<any[]>(
      'SELECT * FROM vocabulary_entries ORDER BY username, chapter, created_at'
    );

    return rows.map(row => ({
      id: row.id,
      username: row.username,
      chineseCharacter: row.chinese_character,
      pinyin: row.pinyin,
      hanVietnamese: row.han_vietnamese || undefined,
      modernVietnamese: row.modern_vietnamese || undefined,
      englishMeaning: row.english_meaning || undefined,
      learningNote: row.learning_note || undefined,
      isFavorite: row.is_favorite === 1,
      chapter: row.chapter,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      sharedFrom: row.shared_from || undefined
    }));
  }

  /**
   * Erase all users from database
   */
  private async eraseAllUsers(): Promise<void> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    await pool.query('DELETE FROM users');
  }

  /**
   * Erase all vocabulary entries from database
   */
  private async eraseAllVocabularyEntries(): Promise<void> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    await pool.query('DELETE FROM vocabulary_entries');
  }

  /**
   * Restore users from backup
   * @param users - Array of usernames to restore
   * @returns Number of users restored
   */
  private async restoreUsers(users: string[]): Promise<number> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    let restoredCount = 0;

    for (const username of users) {
      await pool.query(
        `INSERT INTO users (username) VALUES (?)`,
        [username]
      );
      restoredCount++;
    }

    return restoredCount;
  }

  /**
   * Restore vocabulary entries from backup
   * @param entries - Entries to restore
   * @returns Number of entries restored
   */
  private async restoreVocabularyEntries(entries: VocabularyEntry[]): Promise<number> {
    const { getPool } = await import('../config/database');
    const pool = getPool();

    let restoredCount = 0;

    for (const entry of entries) {
      // Convert Date objects or ISO strings to MySQL datetime format
      const createdAt = this.toMySQLDateTime(entry.createdAt);
      const updatedAt = this.toMySQLDateTime(entry.updatedAt);

      await pool.query(
        `INSERT INTO vocabulary_entries 
         (id, username, chinese_character, pinyin, han_vietnamese, modern_vietnamese, 
          english_meaning, learning_note, is_favorite, chapter, created_at, updated_at, shared_from)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.username,
          entry.chineseCharacter,
          entry.pinyin,
          entry.hanVietnamese || null,
          entry.modernVietnamese || null,
          entry.englishMeaning || null,
          entry.learningNote || null,
          entry.isFavorite ? 1 : 0,
          entry.chapter,
          createdAt,
          updatedAt,
          entry.sharedFrom || null
        ]
      );
      restoredCount++;
    }

    return restoredCount;
  }

  /**
   * Convert Date object or ISO string to MySQL datetime format
   * @param date - Date object or ISO string
   * @returns MySQL datetime string (YYYY-MM-DD HH:MM:SS)
   */
  private toMySQLDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
