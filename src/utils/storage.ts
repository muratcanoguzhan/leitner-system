import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, LeitnerSystem } from '../models/Card';
import uuid from 'react-native-uuid';

const CARDS_STORAGE_KEY = 'leitner_cards';
const SYSTEMS_STORAGE_KEY = 'leitner_systems';

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

export const getCardsForSystem = async (systemId: string): Promise<Card[]> => {
  const allCards = await loadCards();
  return allCards.filter(card => card.leitnerSystemId === systemId);
};

export const clearAllCards = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CARDS_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing cards:', e);
  }
};

// Leitner System operations
export const saveSystems = async (systems: LeitnerSystem[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(systems);
    await AsyncStorage.setItem(SYSTEMS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving systems:', e);
  }
};

export const loadSystems = async (): Promise<LeitnerSystem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SYSTEMS_STORAGE_KEY);
    if (jsonValue) {
      // Parse the JSON and convert date strings to Date objects
      const systems: LeitnerSystem[] = JSON.parse(jsonValue);
      return systems.map(system => ({
        ...system,
        createdAt: new Date(system.createdAt)
      }));
    }
    return [];
  } catch (e) {
    console.error('Error loading systems:', e);
    return [];
  }
};

export const createLeitnerSystem = async (name: string): Promise<LeitnerSystem> => {
  try {
    const systems = await loadSystems();
    const newSystem: LeitnerSystem = {
      id: uuid.v4().toString(),
      name,
      createdAt: new Date()
    };
    
    await saveSystems([...systems, newSystem]);
    return newSystem;
  } catch (error) {
    console.error('Error creating Leitner system:', error);
    throw error; // Re-throw to allow the caller to handle it
  }
};

export const deleteLeitnerSystem = async (systemId: string): Promise<void> => {
  // Delete the system
  const systems = await loadSystems();
  const updatedSystems = systems.filter(system => system.id !== systemId);
  await saveSystems(updatedSystems);
  
  // Delete all cards associated with this system
  const allCards = await loadCards();
  const remainingCards = allCards.filter(card => card.leitnerSystemId !== systemId);
  await saveCards(remainingCards);
};

// Helper to determine if a card is due for review based on its box level
export const isDueForReview = (card: Card): boolean => {
  if (!card.lastReviewed) return true; // New card, never reviewed
  
  const today = new Date();
  const lastReview = new Date(card.lastReviewed);
  const daysSinceReview = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  
  switch (card.boxLevel) {
    case 1: return daysSinceReview >= 1; // Every day
    case 2: return daysSinceReview >= 3; // Every 3 days
    case 3: return daysSinceReview >= 7; // Every week
    case 4: return daysSinceReview >= 14; // Every 2 weeks
    case 5: return daysSinceReview >= 30; // Every month
    default: return true;
  }
}; 