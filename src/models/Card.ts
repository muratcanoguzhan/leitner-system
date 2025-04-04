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
  boxIntervals: BoxIntervals;
}

export interface BoxIntervals {
  box1Days: number; // days for Box 1 (typically 1 day)
  box2Days: number; // days for Box 2 (typically 3 days)
  box3Days: number; // days for Box 3 (typically 7 days)
  box4Days: number; // days for Box 4 (typically 14 days)
  box5Days: number; // days for Box 5 (typically 30 days)
} 