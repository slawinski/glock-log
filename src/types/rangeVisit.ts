export interface RangeVisit {
  id: string;
  date: Date;
  location: string;
  notes?: string;
  firearmsUsed: string[];
  roundsFired: number;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RangeVisitInput = Omit<
  RangeVisit,
  "id" | "createdAt" | "updatedAt"
>;

export interface RangeVisitStats {
  totalVisits: number;
  totalRoundsFired: number;
  mostVisitedLocation: string;
  averageRoundsPerVisit: number;
}
