import {
  firearmInputSchema,
  ammunitionInputSchema,
  rangeVisitInputSchema,
} from "../inputSchemas";

describe("Firearm Input Schema", () => {
  it("validates correct firearm input data", () => {
    const validFirearm = {
      modelName: "Glock 19",
      caliber: "9mm",
      datePurchased: new Date().toISOString(),
      amountPaid: 599.99,
      photos: ["photo1.jpg", "photo2.jpg"],
      notes: "My first Glock",
    };

    const result = firearmInputSchema.safeParse(validFirearm);
    expect(result.success).toBe(true);
  });

  it("rejects invalid firearm input data", () => {
    const invalidFirearm = {
      modelName: "", // Empty model name
      caliber: "", // Empty caliber
      datePurchased: "not-a-date",
      amountPaid: -100, // Negative amount
    };

    const result = firearmInputSchema.safeParse(invalidFirearm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Model name is required" }),
          expect.objectContaining({ message: "Caliber is required" }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({
            message: "Amount paid must be greater than or equal to 0",
          }),
        ])
      );
    }
  });
});

describe("Ammunition Input Schema", () => {
  it("validates correct ammunition input data", () => {
    const validAmmo = {
      caliber: "9mm",
      brand: "Federal",
      grain: "115",
      quantity: 50,
      datePurchased: new Date().toISOString(),
      amountPaid: 24.99,
      notes: "Range ammo",
      photos: ["photo1.jpg"],
    };

    const result = ammunitionInputSchema.safeParse(validAmmo);
    expect(result.success).toBe(true);
  });

  it("rejects invalid ammunition input data", () => {
    const invalidAmmo = {
      caliber: "", // Empty caliber
      brand: "", // Empty brand
      grain: "", // Empty grain
      quantity: 0, // Zero quantity
      datePurchased: "not-a-date",
      amountPaid: -1, // Negative amount
    };

    const result = ammunitionInputSchema.safeParse(invalidAmmo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Caliber is required" }),
          expect.objectContaining({ message: "Brand is required" }),
          expect.objectContaining({ message: "Grain is required" }),
          expect.objectContaining({
            message: "Quantity must be greater than 0",
          }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({
            message: "Amount paid must be greater than or equal to 0",
          }),
        ])
      );
    }
  });
});

describe("Range Visit Input Schema", () => {
  it("validates correct range visit input data", () => {
    const validVisit = {
      date: new Date().toISOString(),
      location: "Local Range",
      notes: "Great session",
      firearmsUsed: ["firearm1", "firearm2"],
      ammunitionUsed: {
        firearm1: { ammunitionId: "ammo1", rounds: 50 },
        firearm2: { ammunitionId: "ammo2", rounds: 100 },
      },
      photos: ["photo1.jpg"],
    };

    const result = rangeVisitInputSchema.safeParse(validVisit);
    expect(result.success).toBe(true);
  });

  it("rejects invalid range visit input data", () => {
    const invalidVisit = {
      date: "not-a-date",
      location: "", // Empty location
      firearmsUsed: [], // Empty firearms array
      ammunitionUsed: {
        firearm1: { ammunitionId: "ammo1", rounds: 0 }, // Zero rounds
      },
    };

    const result = rangeVisitInputSchema.safeParse(invalidVisit);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Location is required" }),
          expect.objectContaining({
            message: "At least one firearm must be selected",
          }),
          expect.objectContaining({
            message: "Rounds used must be greater than 0",
          }),
        ])
      );
    }
  });
});
