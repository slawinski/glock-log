import {
  firearmStorageSchema,
  ammunitionStorageSchema,
  rangeVisitStorageSchema,
} from "../storageSchemas";

describe("Firearm Storage Schema", () => {
  it("validates correct firearm storage data", () => {
    const validFirearm = {
      id: "123",
      modelName: "Glock 19",
      caliber: "9mm",
      datePurchased: new Date().toISOString(),
      amountPaid: 599.99,
      photos: ["photo1.jpg", "photo2.jpg"],
      roundsFired: 500,
      notes: "My first Glock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = firearmStorageSchema.safeParse(validFirearm);
    expect(result.success).toBe(true);
  });

  it("rejects invalid firearm storage data", () => {
    const invalidFirearm = {
      id: "", // Empty ID
      modelName: "", // Empty model name
      caliber: "", // Empty caliber
      datePurchased: "not-a-date",
      amountPaid: -100, // Negative amount
      roundsFired: -1, // Negative rounds
      createdAt: "not-a-date",
      updatedAt: "not-a-date",
    };

    const result = firearmStorageSchema.safeParse(invalidFirearm);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
        ])
      );
    }
  });
});

describe("Ammunition Storage Schema", () => {
  it("validates correct ammunition storage data", () => {
    const validAmmo = {
      id: "123",
      caliber: "9mm",
      brand: "Federal",
      grain: 115,
      quantity: 50,
      datePurchased: new Date().toISOString(),
      amountPaid: 24.99,
      notes: "Range ammo",
      photos: ["photo1.jpg"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = ammunitionStorageSchema.safeParse(validAmmo);
    expect(result.success).toBe(true);
  });

  it("rejects invalid ammunition storage data", () => {
    const invalidAmmo = {
      id: "", // Empty ID
      caliber: "", // Empty caliber
      brand: "", // Empty brand
      grain: -1, // Negative grain
      quantity: -1, // Negative quantity
      datePurchased: "not-a-date",
      amountPaid: -1, // Negative amount
      createdAt: "not-a-date",
      updatedAt: "not-a-date",
    };

    const result = ammunitionStorageSchema.safeParse(invalidAmmo);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
        ])
      );
    }
  });
});

describe("Range Visit Storage Schema", () => {
  it("validates correct range visit storage data", () => {
    const validVisit = {
      id: "123",
      date: new Date().toISOString(),
      location: "Local Range",
      notes: "Great session",
      firearmsUsed: ["firearm1", "firearm2"],
      roundsPerFirearm: {
        firearm1: 50,
        firearm2: 100,
      },
      ammunitionUsed: {
        ammo1: 50,
        ammo2: 100,
      },
      photos: ["photo1.jpg"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = rangeVisitStorageSchema.safeParse(validVisit);
    expect(result.success).toBe(true);
  });

  it("rejects invalid range visit storage data", () => {
    const invalidVisit = {
      id: "", // Empty ID
      date: "not-a-date",
      location: "", // Empty location
      firearmsUsed: [], // Empty firearms array
      roundsPerFirearm: {
        firearm1: -1, // Negative rounds
      },
      ammunitionUsed: {
        ammo1: -1, // Negative rounds
      },
      createdAt: "not-a-date",
      updatedAt: "not-a-date",
    };

    const result = rangeVisitStorageSchema.safeParse(invalidVisit);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
          expect.objectContaining({ message: "Invalid datetime" }),
        ])
      );
    }
  });
});
