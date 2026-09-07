import { storage } from "../storage-new";
import { StorageFactory } from "../storage-factory";
import { AccessoryInput, FirearmInput } from "../../validation/inputSchemas";
import { createMemoryStorage, MemoryStorage } from "../test-utils/memory-storage";

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

const now = "2026-01-15T10:00:00.000Z";

const firearmInput = (photos?: string[]): FirearmInput => ({
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: now,
  amountPaid: 0,
  ownership: "mine",
  ...(photos ? { photos } : {}),
});

const accessoryInput = (
  overrides: Partial<AccessoryInput> = {}
): AccessoryInput => ({
  category: "red_dot",
  modelName: "Holosun 507Comp",
  initialRounds: 0,
  ...overrides,
});

describe("accessory placeholder sync", () => {
  let memoryStorage: MemoryStorage;
  let getStorageSpy: jest.SpyInstance;

  beforeAll(() => {
    getStorageSpy = jest.spyOn(StorageFactory, "getStorage");
  });

  afterAll(() => {
    getStorageSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    memoryStorage = createMemoryStorage();
    getStorageSpy.mockReturnValue(memoryStorage);
  });

  const thumbnailOf = async (firearmId: string): Promise<string | undefined> =>
    (await storage.getFirearms()).find((f) => f.id === firearmId)?.photos?.[0];

  it("swaps pistol placeholder for red-dot variant on mount, back on unmount", async () => {
    const firearmId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, firearmId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-reddot-placeholder.png"
    );

    await storage.unmountAccessory(accessoryId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-placeholder.png"
    );
  });

  it("materializes a red-dot placeholder onto a photo-less pistol, then reverts", async () => {
    const firearmId = await storage.saveFirearm(firearmInput());
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, firearmId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-reddot-placeholder.png"
    );

    await storage.unmountAccessory(accessoryId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-placeholder.png"
    );
  });

  it("ignores non-red-dot accessories", async () => {
    const firearmId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const accessoryId = await storage.saveAccessory(
      accessoryInput({ category: "flashlight", modelName: "TLR-1 HL" })
    );

    await storage.mountAccessory(accessoryId, firearmId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-placeholder.png"
    );
  });

  it("ignores non-pistol placeholders", async () => {
    const firearmId = await storage.saveFirearm(
      firearmInput(["placeholder:revolver-placeholder.png"])
    );
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, firearmId, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:revolver-placeholder.png"
    );
  });

  it("keeps the variant while another red dot remains mounted", async () => {
    const firearmId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const a1 = await storage.saveAccessory(accessoryInput({ modelName: "RMR" }));
    const a2 = await storage.saveAccessory(accessoryInput({ modelName: "507Comp" }));

    await storage.mountAccessory(a1, firearmId, now);
    await storage.mountAccessory(a2, firearmId, now);

    await storage.unmountAccessory(a1, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-reddot-placeholder.png"
    );

    await storage.unmountAccessory(a2, now);
    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-placeholder.png"
    );
  });

  it("moves the variant to the destination and reverts the source", async () => {
    const sourceId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const destId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, sourceId, now);
    await storage.moveAccessory(accessoryId, destId, now);

    expect(await thumbnailOf(sourceId)).toBe("placeholder:pistol-placeholder.png");
    expect(await thumbnailOf(destId)).toBe(
      "placeholder:pistol-reddot-placeholder.png"
    );
  });

  it("reverts the placeholder when a mounted red dot is archived", async () => {
    const firearmId = await storage.saveFirearm(
      firearmInput(["placeholder:pistol-placeholder.png"])
    );
    const accessoryId = await storage.saveAccessory(accessoryInput());

    await storage.mountAccessory(accessoryId, firearmId, now);
    await storage.archiveAccessory(accessoryId);

    expect(await thumbnailOf(firearmId)).toBe(
      "placeholder:pistol-placeholder.png"
    );
  });
});
