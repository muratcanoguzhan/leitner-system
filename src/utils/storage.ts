import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, LearningSession, BoxIntervals } from '../models/Card';
import uuid from 'react-native-uuid';

const CARDS_STORAGE_KEY = 'leitner_cards';
const SESSIONS_STORAGE_KEY = 'learning_sessions';

// Default box intervals
export const DEFAULT_BOX_INTERVALS: BoxIntervals = {
  box1Days: 1,  // Every day
  box2Days: 3,  // Every 3 days
  box3Days: 7,  // Every week
  box4Days: 14, // Every 2 weeks
  box5Days: 30, // Every month
};

// Card operations
export const saveCards = async (cards: Card[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(cards);
    await AsyncStorage.setItem(CARDS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving cards:', e);
  }
};

export const loadCards = async (): Promise<Card[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
    if (jsonValue) {
      // Parse the JSON and convert date strings to Date objects
      const cards: Card[] = JSON.parse(jsonValue);
      return cards.map(card => ({
        ...card,
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null,
        createdAt: new Date(card.createdAt)
      }));
    }
    return [];
  } catch (e) {
    console.error('Error loading cards:', e);
    return [];
  }
};

export const getCardsForSession = async (sessionId: string): Promise<Card[]> => {
  const allCards = await loadCards();
  return allCards.filter(card => card.learningSessionId === sessionId);
};

export const clearAllCards = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CARDS_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing cards:', e);
  }
};

// Learning Session operations
export const saveSessions = async (sessions: LearningSession[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(sessions);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
};

export const loadSessions = async (): Promise<LearningSession[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
    if (jsonValue) {
      // Parse the JSON and convert date strings to Date objects
      const sessions: LearningSession[] = JSON.parse(jsonValue);
      return sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt)
      }));
    }
    return [];
  } catch (e) {
    console.error('Error loading sessions:', e);
    return [];
  }
};

export const createLearningSession = async (name: string, boxIntervals?: BoxIntervals): Promise<LearningSession> => {
  try {
    const sessions = await loadSessions();
    const newSession: LearningSession = {
      id: uuid.v4().toString(),
      name,
      createdAt: new Date(),
      boxIntervals: boxIntervals || DEFAULT_BOX_INTERVALS
    };
    
    await saveSessions([...sessions, newSession]);
    return newSession;
  } catch (error) {
    console.error('Error creating learning session:', error);
    throw error; // Re-throw to allow the caller to handle it
  }
};

export const deleteLearningSession = async (sessionId: string): Promise<void> => {
  // Delete the session
  const sessions = await loadSessions();
  const updatedSessions = sessions.filter(session => session.id !== sessionId);
  await saveSessions(updatedSessions);
  
  // Delete all cards associated with this session
  const allCards = await loadCards();
  const remainingCards = allCards.filter(card => card.learningSessionId !== sessionId);
  await saveCards(remainingCards);
};

// Helper to determine if a card is due for review based on its box level
export const isDueForReview = (card: Card, sessions?: LearningSession[]): boolean => {
  if (!card.lastReviewed) return true; // New card, never reviewed
  
  const today = new Date();
  const lastReview = new Date(card.lastReviewed);
  const daysSinceReview = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if we have sessions and find the one for this card
  if (sessions) {
    const session = sessions.find(s => s.id === card.learningSessionId);
    if (session && session.boxIntervals) {
      // Use custom box intervals from the session
      switch (card.boxLevel) {
        case 1: return daysSinceReview >= session.boxIntervals.box1Days;
        case 2: return daysSinceReview >= session.boxIntervals.box2Days;
        case 3: return daysSinceReview >= session.boxIntervals.box3Days;
        case 4: return daysSinceReview >= session.boxIntervals.box4Days;
        case 5: return daysSinceReview >= session.boxIntervals.box5Days;
        default: return true;
      }
    }
  }
  
  // Fallback to default box intervals if no sessions provided or session not found
  switch (card.boxLevel) {
    case 1: return daysSinceReview >= 1; // Every day
    case 2: return daysSinceReview >= 3; // Every 3 days
    case 3: return daysSinceReview >= 7; // Every week
    case 4: return daysSinceReview >= 14; // Every 2 weeks
    case 5: return daysSinceReview >= 30; // Every month
    default: return true;
  }
}; 