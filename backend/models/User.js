import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const createUser = async (email, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    connection.release();
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    connection.release();
    return rows[0];
  } catch (error) {
    throw error;
  }
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
