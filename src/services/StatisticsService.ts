import { getCardsForSession, loadSessions, isDueForReview } from '../utils/storage';

export interface CardStats {
  total: number;
  correct: number;
  incorrect: number;
  due: number;
  promoted: number;
  demoted: number;
}

export interface SessionStats extends CardStats {
  boxCounts: number[];  // Count of cards in each box (1-5)
}

/**
 * Calculates statistics for a session
 */
export const getSessionStats = async (sessionId: string): Promise<SessionStats> => {
  if (!sessionId) {
    console.warn('getSessionStats called with null or empty sessionId');
    return {
      total: 0,
      correct: 0,
      incorrect: 0,
      due: 0,
      promoted: 0,
      demoted: 0,
      boxCounts: [0, 0, 0, 0, 0]
    };
  }
  
  try {
    // Get all cards for this session
    const cards = await getCardsForSession(sessionId);
    
    // Get all sessions for due date calculation
    const allSessions = await loadSessions();
    
    // Count total cards
    const total = cards.length;
    
    // Count cards that were answered correctly (box level > 1)
    const correct = cards.filter(card => card.boxLevel > 1).length;
    
    // Count cards that were answered incorrectly (in box 1 and reviewed at least once)
    const incorrect = cards.filter(card => card.boxLevel === 1 && card.lastReviewed !== null).length;
    
    // Count cards in each box
    const boxCounts = [0, 0, 0, 0, 0];
    let dueCount = 0;
    
    // Check each card if it's due for review
    for (const card of cards) {
      // Adjust for 0-based array and 1-based boxLevel
      const boxIndex = Math.max(0, Math.min(card.boxLevel - 1, 4));
      boxCounts[boxIndex]++;
      
      // Check if card is due for review
      const isDue = await isDueForReview(card, allSessions);
      if (isDue) {
        dueCount++;
      }
    }
    
    // We can't accurately track promoted/demoted counts without session history
    // so we'll set them to 0 for now
    const promoted = 0;
    const demoted = 0;
    
    return { 
      total, 
      correct, 
      incorrect,
      due: dueCount,
      promoted,
      demoted,
      boxCounts
    };
  } catch (e) {
    console.error('Error getting card stats for session:', e);
    return {
      total: 0,
      correct: 0,
      incorrect: 0,
      due: 0,
      promoted: 0,
      demoted: 0,
      boxCounts: [0, 0, 0, 0, 0]
    };
  }
};

/**
 * Gets stats for all sessions
 */
export const getAllSessionsStats = async (): Promise<Map<string, SessionStats>> => {
  try {
    const sessions = await loadSessions();
    const statsMap = new Map<string, SessionStats>();
    
    for (const session of sessions) {
      const stats = await getSessionStats(session.id);
      statsMap.set(session.id, stats);
    }
    
    return statsMap;
  } catch (e) {
    console.error('Error getting stats for all sessions:', e);
    return new Map();
  }
}; 