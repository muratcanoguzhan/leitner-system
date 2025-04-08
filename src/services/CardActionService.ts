import { CardActionType } from '../models/Card';
import SQLite from 'react-native-sqlite-storage';
import uuid from 'react-native-uuid';
import { getCardsForSession } from '../utils/storage';

// Initialize SQLite
SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase;

/**
 * Initialize the database
 */
export const initCardActionDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabase({
      name: 'leitner_system.db',
      location: 'default'
    });
    
    // Create CardActions table if it doesn't exist
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS card_actions (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        from_box_level INTEGER,
        to_box_level INTEGER,
        learning_session_id TEXT NOT NULL
      )
    `);
    
    // Create indexes for faster queries
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_card_actions_card_id ON card_actions (card_id)
    `);
    
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_card_actions_session_id ON card_actions (learning_session_id)
    `);
    
    console.log('CardActions database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize CardActions database:', error);
  }
};

/**
 * Log a card action
 */
export const logCardAction = async (
  cardId: string,
  actionType: CardActionType,
  sessionId: string,
  fromBoxLevel: number,
  toBoxLevel?: number
): Promise<void> => {
  try {
    if (!db) {
      await initCardActionDatabase();
    }
    
    const actionId = uuid.v4().toString();
    const timestamp = new Date().toISOString();
    
    await db.executeSql(
      `INSERT INTO card_actions (
        id, 
        card_id, 
        action_type, 
        timestamp, 
        from_box_level, 
        to_box_level, 
        learning_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actionId,
        cardId,
        actionType,
        timestamp,
        fromBoxLevel || null,
        toBoxLevel || null,
        sessionId
      ]
    );
    
    console.log(`Logged card action: ${actionType} for card ${cardId}`);
  } catch (error) {
    console.error('Error logging card action:', error);
  }
};

/**
 * Get box statistics for a session
 */
export const getBoxStatistics = async (sessionId: string, boxLevel: number): Promise<{
  total: number;
  correct: number;
  incorrect: number;
  notAnswered: number;
}> => {
  try {
    if (!db) {
      await initCardActionDatabase();
    }
    
    // Get all cards in this box for this session
    const allSessionCards = await getCardsForSession(sessionId);
    const cardsInBox = allSessionCards.filter(card => card.boxLevel === boxLevel);
    
    const totalCards = cardsInBox.length;
    
    if (totalCards === 0) {
      return { total: 0, correct: 0, incorrect: 0, notAnswered: 0 };
    }
    
    // Get card IDs
    const cardIds = cardsInBox.map(card => card.id);
    const placeholders = cardIds.map(() => '?').join(',');
    
    // Efficient approach using a correlated subquery
    const [actionsResult] = await db.executeSql(
      `SELECT ca.card_id, ca.action_type
       FROM card_actions ca
       WHERE ca.card_id IN (${placeholders})
       AND (ca.action_type = '${CardActionType.CORRECT}' OR ca.action_type = '${CardActionType.INCORRECT}')
       AND ca.timestamp = (
         SELECT MAX(timestamp) 
         FROM card_actions 
         WHERE card_id = ca.card_id
         AND (action_type = '${CardActionType.CORRECT}' OR action_type = '${CardActionType.INCORRECT}')
       )`,
      [...cardIds]
    );
    
    // Create a map of card IDs to their most recent action
    const cardActionMap = new Map<string, string>();
    
    for (let i = 0; i < actionsResult.rows.length; i++) {
      const row = actionsResult.rows.item(i);
      cardActionMap.set(row.card_id, row.action_type);
    }
    
    // Count based on the map
    let correct = 0;
    let incorrect = 0;
    
    for (const cardId of cardIds) {
      const action = cardActionMap.get(cardId);
      if (action === CardActionType.CORRECT) {
        correct++;
      } else if (action === CardActionType.INCORRECT) {
        incorrect++;
      }
    }
    
    // Cards that have no CORRECT or INCORRECT actions are considered not answered
    const notAnswered = totalCards - correct - incorrect;
    
    return {
      total: totalCards,
      correct,
      incorrect,
      notAnswered
    };
  } catch (error) {
    console.error('Error getting box statistics:', error);
    return { total: 0, correct: 0, incorrect: 0, notAnswered: 0 };
  }
};

/**
 * Get session statistics from card actions
 */
export const getSessionStatistics = async (sessionId: string): Promise<{
  boxStats: Array<{
    boxLevel: number;
    total: number;
    correct: number;
    incorrect: number;
    notAnswered: number;
  }>;
}> => {
  try {
    if (!db) {
      await initCardActionDatabase();
    }
    
    // Get statistics for each box
    const boxStats = [];
    
    for (let boxLevel = 1; boxLevel <= 5; boxLevel++) {
      const stats = await getBoxStatistics(sessionId, boxLevel);
      boxStats.push({
        boxLevel,
        ...stats
      });
    }
    
    return { boxStats };
  } catch (error) {
    console.error('Error getting session statistics:', error);
    return {
      boxStats: []
    };
  }
}; 