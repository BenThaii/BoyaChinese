/**
 * User Model
 * 
 * Data access layer for user management
 */

import { getPool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRow extends RowDataPacket {
  username: string;
  created_at: Date;
  updated_at: Date;
}

export class UserDAO {
  /**
   * Get all users
   */
  static async getAllUsers(): Promise<string[]> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      'SELECT username FROM users ORDER BY username ASC'
    );
    return rows.map(row => row.username);
  }

  /**
   * Create a new user
   */
  static async createUser(username: string): Promise<void> {
    const pool = getPool();
    await pool.query<ResultSetHeader>(
      'INSERT INTO users (username) VALUES (?) ON DUPLICATE KEY UPDATE username = username',
      [username]
    );
  }

  /**
   * Check if user exists
   */
  static async userExists(username: string): Promise<boolean> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      'SELECT username FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0;
  }

  /**
   * Delete a user
   */
  static async deleteUser(username: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE username = ?',
      [username]
    );
    return result.affectedRows > 0;
  }
}
