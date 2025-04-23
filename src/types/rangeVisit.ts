export interface RangeVisit {
  id: string;
  date: Date;
  location: string;
  notes?: string;
  firearmsUsed: string[];
  roundsPerFirearm: Record<string, number>;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RangeVisitInput {
  date: Date;
  location: string;
  notes?: string;
  firearmsUsed: string[];
  roundsPerFirearm: Record<string, number>;
  photos: string[];
}

export interface RangeVisitStats {
  totalVisits: number;
  totalRoundsFired: number;
  mostVisitedLocation: string;
  averageRoundsPerVisit: number;
}
