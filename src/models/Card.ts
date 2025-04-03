export interface Card {
  id: string;
  front: string;
  back: string;
  boxLevel: number; // 1-5 representing the 5 slots in the Learning Session
  lastReviewed: Date | null;
  createdAt: Date;
  learningSessionId: string; // Reference to which Learning session this card belongs to
}

export interface LearningSession {
  id: string;
  name: string;
  createdAt: Date;
} 