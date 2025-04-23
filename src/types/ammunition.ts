export interface Ammunition {
  id: string;
  caliber: string;
  brand: string;
  grain: number;
  quantity: number;
  datePurchased: string;
  amountPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
