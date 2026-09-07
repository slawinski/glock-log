import {
  firearmInputSchema,
  ammunitionInputSchema,
  rangeVisitInputSchema,
} from "../inputSchemas";

describe("Firearm Input Schema", () => {
  it("validates correct firearm input data and coerces numeric strings", () => {
    const validFirearm = {
      modelName: "Glock 19",
      caliber: "9mm",
      datePurchased: new Date().toISOString(),
      amountPaid: "599.99",
      initialRoundsFired: "500",
      firearmType: "pistol",
      photos: ["photo1.jpg", "photo2.jpg"],
      notes: "My first Glock",
    };

    const result = firearmInputSchema.safeParse(validFirearm);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountPaid).toBe(599.99);
      expect(result.data.initialRoundsFired).toBe(500);
    }
  });

  it("coerces an empty amount and initial rounds to 0", () => {
    const result = firearmInputSchema.safeParse({
      modelName: "Glock 19",
      caliber: "9mm",
      datePurchased: new Date().toISOString(),
      amountPaid: "",
      initialRoundsFired: "",
      firearmType: "pistol",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountPaid).toBe(0);
      expect(result.data.initialRoundsFired).toBe(0);
    }
  });

  it("rejects invalid firearm input data", () => {
    const invalidFirearm = {
      modelName: "",
      caliber: "",
      datePurchased: "not-a-date",
      amountPaid: "-100",
    };

    const result = firearmInputSchema.safeParse(invalidFirearm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Enter a model name." }),
          expect.objectContaining({ message: "Enter a caliber." }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Enter a valid amount." }),
        ])
      );
    }
  });
});

describe("Ammunition Input Schema", () => {
  it("validates correct ammunition input data and coerces numeric strings", () => {
    const validAmmo = {
      caliber: "9mm",
      brand: "Federal",
      grain: "115",
      quantity: "50",
      datePurchased: new Date().toISOString(),
      amountPaid: "24.99",
      notes: "Range ammo",
      photos: ["photo1.jpg"],
    };

    const result = ammunitionInputSchema.safeParse(validAmmo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(50);
      expect(result.data.amountPaid).toBe(24.99);
    }
  });

  it("rejects invalid ammunition input data", () => {
    const invalidAmmo = {
      caliber: "",
      brand: "",
      grain: "",
      quantity: "-1",
      datePurchased: "not-a-date",
      amountPaid: "-1",
    };

    const result = ammunitionInputSchema.safeParse(invalidAmmo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Enter a caliber." }),
          expect.objectContaining({ message: "Enter a brand." }),
          expect.objectContaining({ message: "Enter a grain." }),
          expect.objectContaining({
            message: "Quantity cannot be negative.",
          }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Enter a valid amount." }),
        ])
      );
    }
  });
});

describe("Range Visit Input Schema", () => {
  it("validates correct range visit input data and coerces rounds", () => {
    const validVisit = {
      date: new Date().toISOString(),
      location: "Local Range",
      notes: "Great session",
      firearmsUsed: ["firearm1", "firearm2"],
      ammunitionUsed: {
        firearm1: { ammunitionId: "ammo1", rounds: "50" },
        firearm2: { ammunitionId: "ammo2", rounds: "100" },
      },
      photos: ["photo1.jpg"],
    };

    const result = rangeVisitInputSchema.safeParse(validVisit);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ammunitionUsed?.firearm1.rounds).toBe(50);
    }
  });

  it("rejects invalid range visit input data", () => {
    const invalidVisit = {
      date: "not-a-date",
      location: "",
      firearmsUsed: [],
      ammunitionUsed: {
        firearm1: { ammunitionId: "ammo1", rounds: "0" },
      },
    };

    const result = rangeVisitInputSchema.safeParse(invalidVisit);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Enter a location." }),
          expect.objectContaining({
            message: "Rounds used must be greater than 0.",
          }),
        ])
      );
    }
  });
});
