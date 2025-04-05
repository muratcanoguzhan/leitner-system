import { Card, LearningSession, BoxIntervals } from '../models/Card';
import uuid from 'react-native-uuid';
import { 
  getDatabase, 
  mapResultSetToObjects, 
  objectToAppFormat, 
  objectToDatabaseFormat 
} from './database';

// Default box intervals
export const DEFAULT_BOX_INTERVALS: BoxIntervals = {
  box1Days: 1,  // Every day
  box2Days: 3,  // Every 3 days
  box3Days: 7,  // Every week
  box4Days: 14, // Every 2 weeks
  box5Days: 30, // Every month
};

// Card operations
export const saveCard = async (card: Card): Promise<void> => {
  if (!card) {
    throw new Error('Cannot save null card');
  }
  
  if (!card.id) {
    throw new Error('Card must have an ID');
  }
  
  if (!card.learningSessionId) {
    throw new Error('Card must have a learning session ID');
  }
  
  try {
    const db = await getDatabase();
    const dbCard = objectToDatabaseFormat(card);
    
    // Insert or replace the card
    await db.executeSql(
      `INSERT OR REPLACE INTO cards (
        id, front, back, box_level, last_reviewed, created_at, learning_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dbCard.id,
        dbCard.front,
        dbCard.back,
        dbCard.box_level,
        dbCard.last_reviewed,
        dbCard.created_at,
        dbCard.learning_session_id
      ]
    );
  } catch (e) {
    console.error('Error saving card:', e);
    throw e;
  }
};

export const loadCards = async (): Promise<Card[]> => {
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql('SELECT * FROM cards');
    
    if (!results) {
      console.warn('No results returned from database when loading cards');
      return [];
    }
    
    const dbCards = mapResultSetToObjects<Record<string, any>>(results);
    return dbCards
      .map(dbCard => {
        try {
          if (!dbCard) {
            console.warn('Found null card in database results');
            return null;
          }
          return objectToAppFormat(dbCard) as Card;
        } catch (error) {
          console.error('Error processing card data:', error);
          return null;
        }
      })
      .filter(card => card !== null) as Card[]; // Filter out null values
  } catch (e) {
    console.error('Error loading cards:', e);
    return [];
  }
};

export const getCardsForSession = async (sessionId: string): Promise<Card[]> => {
  if (!sessionId) {
    console.warn('getCardsForSession called with null or empty sessionId');
    return [];
  }
  
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM cards WHERE learning_session_id = ?',
      [sessionId]
    );
    
    if (!results) {
      console.warn('No results returned from database when loading cards for session');
      return [];
    }
    
    const dbCards = mapResultSetToObjects<Record<string, any>>(results);
    return dbCards
      .map(dbCard => {
        try {
          if (!dbCard) {
            console.warn('Found null card in database results');
            return null;
          }
          return objectToAppFormat(dbCard) as Card;
        } catch (error) {
          console.error('Error processing card data:', error);
          return null;
        }
      })
      .filter(card => card !== null) as Card[]; // Filter out null values
  } catch (e) {
    console.error('Error loading cards for session:', e);
    return [];
  }
};

// Learning Session operations
export const saveSession = async (session: LearningSession): Promise<void> => {
  try {
    const db = await getDatabase();
    
    // Separate boxIntervals from other session properties for database storage
    const { boxIntervals, ...sessionData } = session;
    
    // Transform to flat structure for database
    const dbSession = objectToDatabaseFormat({
      ...sessionData,
      ...boxIntervals
    });
    
    await db.executeSql(
      `INSERT OR REPLACE INTO learning_sessions (
        id, name, created_at, box1_days, box2_days, box3_days, box4_days, box5_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dbSession.id,
        dbSession.name,
        dbSession.created_at,
        dbSession.box1_days,
        dbSession.box2_days,
        dbSession.box3_days,
        dbSession.box4_days,
        dbSession.box5_days
      ]
    );
  } catch (e) {
    console.error('Error saving session:', e);
    throw e;
  }
};

export const saveSessions = async (sessions: LearningSession[]): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.transaction(async (tx) => {
      // Insert or replace each session
      for (const session of sessions) {
        const { boxIntervals, ...sessionData } = session;
        
        const dbSession = objectToDatabaseFormat({
          ...sessionData,
          ...boxIntervals
        });
        
        await tx.executeSql(
          `INSERT OR REPLACE INTO learning_sessions (
            id, name, created_at, box1_days, box2_days, box3_days, box4_days, box5_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dbSession.id,
            dbSession.name,
            dbSession.created_at,
            dbSession.box1_days,
            dbSession.box2_days,
            dbSession.box3_days,
            dbSession.box4_days,
            dbSession.box5_days
          ]
        );
      }
    });
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
};

export const loadSessions = async (): Promise<LearningSession[]> => {
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql('SELECT * FROM learning_sessions');
    
    if (!results) {
      console.warn('No results returned from database when loading sessions');
      return [];
    }
    
    const dbSessions = mapResultSetToObjects<Record<string, any>>(results);
    
    return dbSessions.map(dbSession => {
      try {
        if (!dbSession) {
          console.warn('Found null session in database results');
          return null;
        }
        
        const appSession = objectToAppFormat(dbSession);
        
        // Create boxIntervals from flat properties
        const boxIntervals: BoxIntervals = {
          box1Days: appSession.box1Days ?? DEFAULT_BOX_INTERVALS.box1Days,
          box2Days: appSession.box2Days ?? DEFAULT_BOX_INTERVALS.box2Days,
          box3Days: appSession.box3Days ?? DEFAULT_BOX_INTERVALS.box3Days,
          box4Days: appSession.box4Days ?? DEFAULT_BOX_INTERVALS.box4Days,
          box5Days: appSession.box5Days ?? DEFAULT_BOX_INTERVALS.box5Days
        };
        
        // Remove flat boxDay properties
        delete appSession.box1Days;
        delete appSession.box2Days;
        delete appSession.box3Days;
        delete appSession.box4Days;
        delete appSession.box5Days;
        
        return {
          ...appSession,
          boxIntervals
        } as LearningSession;
      } catch (error) {
        console.error('Error processing session data:', error);
        return null;
      }
    }).filter(session => session !== null) as LearningSession[];
  } catch (e) {
    console.error('Error loading sessions:', e);
    return [];
  }
};

export const createLearningSession = async (name: string, boxIntervals?: BoxIntervals): Promise<LearningSession> => {
  try {
    const newSession: LearningSession = {
      id: uuid.v4().toString(),
      name,
      createdAt: new Date(),
      boxIntervals: boxIntervals || DEFAULT_BOX_INTERVALS
    };
    
    await saveSession(newSession);
    return newSession;
  } catch (error) {
    console.error('Error creating learning session:', error);
    throw error;
  }
};

export const deleteLearningSession = async (sessionId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.transaction(async (tx) => {
      // Delete all cards associated with this session
      await tx.executeSql('DELETE FROM cards WHERE learning_session_id = ?', [sessionId]);
      
      // Delete the session
      await tx.executeSql('DELETE FROM learning_sessions WHERE id = ?', [sessionId]);
    });
  } catch (error) {
    console.error('Error deleting learning session:', error);
    throw error;
  }
};

// Helper to determine if a card is due for review based on its box level
export const isDueForReview = async (card: Card, sessions?: LearningSession[]): Promise<boolean> => {
  if (!card) {
    console.warn('isDueForReview called with null card');
    return false;
  }
  
  if (!card.lastReviewed) return true; // New card, never reviewed
  
  const today = new Date();
  const lastReview = new Date(card.lastReviewed);
  const daysSinceReview = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  let session: LearningSession | undefined | null;
  
  // Find the relevant session
  if (sessions && sessions.length > 0) {
    session = sessions.find(s => s && s.id === card.learningSessionId);
  } else if (card.learningSessionId) {
    session = await getSession(card.learningSessionId);
  }
  
  if (session?.boxIntervals) {
    // Use custom intervals from session
    switch (card.boxLevel) {
      case 1: return daysSinceReview >= session.boxIntervals.box1Days;
      case 2: return daysSinceReview >= session.boxIntervals.box2Days;
      case 3: return daysSinceReview >= session.boxIntervals.box3Days;
      case 4: return daysSinceReview >= session.boxIntervals.box4Days;
      case 5: return daysSinceReview >= session.boxIntervals.box5Days;
      default: return true;
    }
  }
  
  // Fallback to default intervals
  switch (card.boxLevel) {
    case 1: return daysSinceReview >= DEFAULT_BOX_INTERVALS.box1Days;
    case 2: return daysSinceReview >= DEFAULT_BOX_INTERVALS.box2Days;
    case 3: return daysSinceReview >= DEFAULT_BOX_INTERVALS.box3Days;
    case 4: return daysSinceReview >= DEFAULT_BOX_INTERVALS.box4Days;
    case 5: return daysSinceReview >= DEFAULT_BOX_INTERVALS.box5Days;
    default: return true;
  }
};

export const getCard = async (cardId: string): Promise<Card | null> => {
  if (!cardId) {
    console.warn('getCard called with null or empty cardId');
    return null;
  }
  
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM cards WHERE id = ?',
      [cardId]
    );
    
    if (!results || results.rows.length === 0) {
      console.warn(`No card found with id: ${cardId}`);
      return null;
    }
    
    const dbCard = results.rows.item(0);
    if (!dbCard) {
      console.warn(`Card with id ${cardId} is null or undefined`);
      return null;
    }
    
    try {
      return objectToAppFormat(dbCard) as Card;
    } catch (error) {
      console.error(`Error processing card data for id ${cardId}:`, error);
      return null;
    }
  } catch (e) {
    console.error('Error getting card:', e);
    return null;
  }
};

export const deleteCard = async (cardId: string): Promise<boolean> => {
  try {
    const db = await getDatabase();
    await db.executeSql('DELETE FROM cards WHERE id = ?', [cardId]);
    return true;
  } catch (e) {
    console.error('Error deleting card:', e);
    return false;
  }
};

export const getSession = async (sessionId: string): Promise<LearningSession | null> => {
  if (!sessionId) {
    console.warn('getSession called with null or empty sessionId');
    return null;
  }
  
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql(
      'SELECT * FROM learning_sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!results || results.rows.length === 0) {
      console.warn(`No session found with id: ${sessionId}`);
      return null;
    }
    
    const dbSession = results.rows.item(0);
    if (!dbSession) {
      console.warn(`Session with id ${sessionId} is null or undefined`);
      return null;
    }
    
    const appSession = objectToAppFormat(dbSession);
    
    // Create a boxIntervals object from the flat properties
    const boxIntervals: BoxIntervals = {
      box1Days: appSession.box1Days ?? DEFAULT_BOX_INTERVALS.box1Days,
      box2Days: appSession.box2Days ?? DEFAULT_BOX_INTERVALS.box2Days,
      box3Days: appSession.box3Days ?? DEFAULT_BOX_INTERVALS.box3Days,
      box4Days: appSession.box4Days ?? DEFAULT_BOX_INTERVALS.box4Days,
      box5Days: appSession.box5Days ?? DEFAULT_BOX_INTERVALS.box5Days
    };
    
    // Remove the individual box day fields from the session object
    delete appSession.box1Days;
    delete appSession.box2Days;
    delete appSession.box3Days;
    delete appSession.box4Days;
    delete appSession.box5Days;
    
    return {
      ...appSession,
      boxIntervals
    } as LearningSession;
  } catch (e) {
    console.error('Error getting session:', e);
    return null;
  }
};

export const getCardStatsForSession = async (sessionId: string): Promise<{ total: number, correct: number, incorrect: number }> => {
  if (!sessionId) {
    console.warn('getCardStatsForSession called with null or empty sessionId');
    return { total: 0, correct: 0, incorrect: 0 };
  }
  
  try {
    // Get all cards for this session
    const cards = await getCardsForSession(sessionId);
    
    // Count total cards
    const total = cards.length;
    
    // Count cards that were answered correctly (box level > 1)
    const correct = cards.filter(card => card.boxLevel > 1).length;
    
    // Count cards that were answered incorrectly (in box 1)
    const incorrect = cards.filter(card => card.boxLevel === 1 && card.lastReviewed !== null).length;
    
    return { 
      total, 
      correct, 
      incorrect 
    };
  } catch (e) {
    console.error('Error getting card stats for session:', e);
    return { total: 0, correct: 0, incorrect: 0 };
  }
};

export const updateLearningSession = async (sessionId: string, name: string): Promise<void> => {
  if (!sessionId) {
    throw new Error('Cannot update learning session with null ID');
  }
  
  try {
    // Get the existing session first
    const session = await getSession(sessionId);
    
    if (!session) {
      throw new Error(`Learning session with ID ${sessionId} not found`);
    }
    
    // Update the name
    session.name = name;
    
    // Save the updated session
    await saveSession(session);
  } catch (e) {
    console.error('Error updating learning session:', e);
    throw e;
  }
}; 