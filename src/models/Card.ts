export interface Card {
  id: string;
  front: string;
  back: string;
  boxLevel: number; // 1-5 representing the 5 slots in the Learning Session
  lastReviewed: Date | null;
  createdAt: Date;
  learningSessionId: string; // Reference to which Learning session this card belongs to
}

export enum CardActionType {
  CREATED = 'created',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  MOVED = 'moved',
  EDITED = 'edited',
  DELETED = 'deleted'
}

export interface CardAction {
  id: string;
  cardId: string;
  actionType: CardActionType;
  timestamp: Date;
  fromBoxLevel?: number; // For MOVED actions
  toBoxLevel?: number;   // For MOVED and CREATED actions
  learningSessionId: string;
}

export interface LearningSession {
  id: string;
  name: string;
  createdAt: Date;
  boxIntervals?: {
    box1Days: number;
    box2Days: number;
    box3Days: number;
    box4Days: number;
    box5Days: number;
  };
} 