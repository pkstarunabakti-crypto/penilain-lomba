export interface LKBBRecord {
  id: string;
  juriName: string;
  participantNumber: string;
  schoolName: string;
  category: string;
  scores: Record<number, number>;
  date: string;
  totalScore: number;
}

