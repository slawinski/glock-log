import {
  resolveFirearmVisualLayers,
} from "./firearmVisualResolver";
import {
  MountedAccessoryVisual,
} from "./types";
import { AccessoryCategory } from "../../validation/storageSchemas";

const acc = (
  id: string,
  category: AccessoryCategory,
  mountedAt: string
): MountedAccessoryVisual => ({ id, category, mountedAt });

describe("resolveFirearmVisualLayers", () => {
  it("returns only the base for a pistol with no accessories", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "pistol",
      accessories: [],
    });
    expect(visual.base).toBeDefined();
    expect(visual.layers).toHaveLength(0);
  });

  it("renders the red-dot layer for a pistol + red_dot", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "pistol",
      accessories: [acc("a1", "red_dot", "2026-08-01T00:00:00.000Z")],
    });
    expect(visual.layers).toHaveLength(1);
    expect(visual.layers[0].visualSlot).toBe("primary_optic");
  });

  it("renders red-dot and flashlight layers together for a pistol", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "pistol",
      accessories: [
        acc("a1", "red_dot", "2026-08-01T00:00:00.000Z"),
        acc("a2", "flashlight", "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(2);
    const slots = visual.layers.map((l) => l.visualSlot).sort();
    expect(slots).toEqual(["primary_optic", "side_rail"]);
  });

  it("renders red dot + magnifier together on a rifle (different slots)", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("a1", "red_dot", "2026-08-01T00:00:00.000Z"),
        acc("a2", "magnifier", "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(2);
    const slots = visual.layers.map((l) => l.visualSlot).sort();
    expect(slots).toEqual(["optic_auxiliary", "primary_optic"]);
  });

  it("renders a full rifle loadout", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("a1", "red_dot", "2026-08-01T00:00:00.000Z"),
        acc("a2", "magnifier", "2026-08-01T00:00:00.000Z"),
        acc("a3", "flashlight", "2026-08-01T00:00:00.000Z"),
        acc("a4", "suppressor", "2026-08-01T00:00:00.000Z"),
        acc("a5", "grip", "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(5);
  });

  it("omits an unsupported category without error (shotgun + magnifier)", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "shotgun",
      accessories: [acc("a1", "magnifier", "2026-08-01T00:00:00.000Z")],
    });
    expect(visual.layers).toHaveLength(0);
  });

  it("deduplicates two accessories of the same category", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("a1", "flashlight", "2026-08-01T00:00:00.000Z"),
        acc("a2", "flashlight", "2026-08-02T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(1);
    expect(visual.layers[0].accessoryId).toBe("a2");
  });

  it("resolves a primary_optic conflict to the most recently mounted", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("scope", "scope", "2026-08-01T00:00:00.000Z"),
        acc("red-dot", "red_dot", "2026-08-05T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(1);
    expect(visual.layers[0].visualSlot).toBe("primary_optic");
    expect(visual.layers[0].accessoryId).toBe("red-dot");
  });

  it("composes four accessories across different slots", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("a1", "red_dot", "2026-08-01T00:00:00.000Z"),
        acc("a2", "magnifier", "2026-08-01T00:00:00.000Z"),
        acc("a3", "flashlight", "2026-08-01T00:00:00.000Z"),
        acc("a4", "suppressor", "2026-08-01T00:00:00.000Z"),
      ],
    });
    expect(visual.layers).toHaveLength(4);
  });

  it("sorts layers by zIndex ascending", () => {
    const visual = resolveFirearmVisualLayers({
      firearmType: "rifle",
      accessories: [
        acc("a1", "red_dot", "2026-08-01T00:00:00.000Z"),
        acc("a2", "suppressor", "2026-08-01T00:00:00.000Z"),
      ],
    });
    const zIndexes = visual.layers.map((l) => l.zIndex);
    expect(zIndexes).toEqual([...zIndexes].sort((a, b) => a - b));
  });
});
