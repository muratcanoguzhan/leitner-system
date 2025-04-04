import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

// Enable SQLite debugging in development
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// Set proper configuration for Android vs iOS
export const DATABASE = {
  name: 'leitner.db',
  location: Platform.OS === 'android' ? 'default' : 'Library'
};

// Database instance
let db: SQLite.SQLiteDatabase;

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Opening SQLite database...');
    
    // Check if database is already initialized
    if (db) {
      console.log('Database already initialized');
      return;
    }
    
    // Open database with more detailed error handling
    try {
      db = await SQLite.openDatabase(DATABASE);
      console.log('Database opened successfully');
    } catch (openError) {
      console.error('Failed to open database:', openError);
      throw new Error(`Failed to open database: ${openError instanceof Error ? openError.message : String(openError)}`);
    }
    
    // Create tables with more detailed error handling
    try {
      await createTables();
      console.log('Tables created successfully');
    } catch (tableError) {
      console.error('Error creating database tables:', tableError);
      throw new Error(`Failed to create tables: ${tableError instanceof Error ? tableError.message : String(tableError)}`);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create tables if they don't exist
const createTables = async (): Promise<void> => {
  // Create learning sessions table
  const sessionsTableQuery = `
    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      box1_days INTEGER NOT NULL,
      box2_days INTEGER NOT NULL,
      box3_days INTEGER NOT NULL,
      box4_days INTEGER NOT NULL,
      box5_days INTEGER NOT NULL
    );
  `;

  // Create cards table
  const cardsTableQuery = `
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      box_level INTEGER NOT NULL,
      last_reviewed INTEGER,
      created_at INTEGER NOT NULL,
      learning_session_id TEXT NOT NULL,
      FOREIGN KEY (learning_session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE
    );
  `;

  try {
    await db.executeSql(sessionsTableQuery);
    await db.executeSql(cardsTableQuery);
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Get database instance (ensure it's initialized)
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    console.log('Database not initialized, initializing now...');
    await initDatabase();
    
    // Double-check that db is now initialized
    if (!db) {
      console.error('Database failed to initialize properly');
      throw new Error('Database failed to initialize properly');
    }
  }
  return db;
};

// Helper to convert SQL results to objects
export const mapResultSetToObjects = <T>(results: SQLite.ResultSet): T[] => {
  if (!results) {
    console.error('mapResultSetToObjects received null results');
    return [];
  }
  
  if (!results.rows) {
    console.error('mapResultSetToObjects: results.rows is null or undefined');
    return [];
  }
  
  const items: T[] = [];
  const len = results.rows.length;
  
  for (let i = 0; i < len; i++) {
    try {
      const row = results.rows.item(i);
      if (row) {
        items.push(row as unknown as T);
      } else {
        console.warn(`Row at index ${i} is null or undefined`);
      }
    } catch (error) {
      console.error(`Error accessing row ${i}:`, error);
    }
  }
  
  return items;
};

// Convert camelCase to snake_case for DB columns
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase for JS properties
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, match => match[1].toUpperCase());
};

// Convert object keys from camelCase to snake_case
export const objectToDatabaseFormat = (obj: Record<string, any>): Record<string, any> => {
  if (!obj) {
    console.error('objectToDatabaseFormat received null or undefined object');
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = camelToSnake(key);
    let value = obj[key];
    
    // Handle Date objects
    if (value instanceof Date) {
      value = value.getTime();
    }
    
    result[snakeKey] = value;
  });
  
  return result;
};

// Convert object keys from snake_case to camelCase
export const objectToAppFormat = (obj: Record<string, any>): Record<string, any> => {
  if (!obj) {
    console.error('objectToAppFormat received null or undefined object');
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = snakeToCamel(key);
    let value = obj[key];
    
    // Special handling for Date fields
    if (
      (camelKey === 'lastReviewed' || camelKey === 'createdAt') && 
      typeof value === 'number'
    ) {
      value = value ? new Date(value) : null;
    }
    
    result[camelKey] = value;
  });
  
  return result;
};

// Close database
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null as unknown as SQLite.SQLiteDatabase;
  }
}; 