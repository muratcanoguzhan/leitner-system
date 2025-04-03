export interface Card {
  id: string;
  front: string;
  back: string;
  boxLevel: number; // 1-5 representing the 5 slots in the Leitner System
  lastReviewed: Date | null;
  createdAt: Date;
  leitnerSystemId: string; // Reference to which Leitner system this card belongs to
}

export interface LeitnerSystem {
  id: string;
  name: string;
  createdAt: Date;
} 