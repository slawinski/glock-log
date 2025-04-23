export interface Firearm {
  id: string;
  modelName: string;
  caliber: string;
  datePurchased: Date;
  amountPaid: number;
  photos: string[];
  roundsFired: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FirearmInput = Omit<Firearm, "id" | "createdAt" | "updatedAt">;

export interface FirearmStats {
  totalFirearms: number;
  totalValue: number;
  mostUsedCaliber: string;
}
