import { getCardsForSession, loadSessions, isDueForReview } from '../utils/storage';
import { getSessionStatistics } from './CardActionService';

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
 * Calculates statistics for a session using card actions
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
    
    // Get action-based statistics from CardActionService
    const actionStats = await getSessionStatistics(sessionId);
    
    // Count cards in each box
    const boxCounts = [0, 0, 0, 0, 0];
    
    // Calculate due cards using isDueForReview
    let dueCount = 0;
    
    // Fill the box counts from the cards
    for (const card of cards) {
      // Adjust for 0-based array and 1-based boxLevel
      const boxIndex = Math.max(0, Math.min(card.boxLevel - 1, 4));
      boxCounts[boxIndex]++;
      
      // Check if the card is due for review based on its box level and last reviewed date
      const isDue = await isDueForReview(card, allSessions);
      if (isDue) {
        dueCount++;
      }
    }
    
    // Calculate total stats from box stats
    let totalCorrect = 0;
    let totalIncorrect = 0;
    
    if (actionStats && actionStats.boxStats) {
      for (const boxStat of actionStats.boxStats) {
        totalCorrect += boxStat.correct;
        totalIncorrect += boxStat.incorrect;
      }
    }
    
    return { 
      total: cards.length,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      due: dueCount,
      promoted: 0, // Not tracked in action stats yet
      demoted: 0, // Not tracked in action stats yet
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
      try {
        const stats = await getSessionStats(session.id);
        statsMap.set(session.id, stats);
      } catch (error) {
        console.error(`Error getting stats for session ${session.id}:`, error);
        statsMap.set(session.id, {
          total: 0,
          correct: 0,
          incorrect: 0,
          due: 0,
          promoted: 0,
          demoted: 0,
          boxCounts: [0, 0, 0, 0, 0]
        });
      }
    }
    
    return statsMap;
  } catch (e) {
    console.error('Error getting stats for all sessions:', e);
    return new Map();
  }
}; 