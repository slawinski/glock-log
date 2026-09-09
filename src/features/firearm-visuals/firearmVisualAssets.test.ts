import { FIREARM_VISUAL_ASSETS } from "./firearmVisualAssets";
import { FIREARM_VISUAL_SLOTS } from "./visualSlots";
import { FirearmVisualAssetManifest, FirearmVisualSlot } from "./types";
import {
  accessoryCategorySchema,
  firearmTypeSchema,
  FirearmType,
} from "../../validation/storageSchemas";

const VALID_SLOTS = new Set<FirearmVisualSlot>(
  Object.values(FIREARM_VISUAL_SLOTS)
);
const VALID_CATEGORIES = new Set<string>(accessoryCategorySchema.options);

describe("FIREARM_VISUAL_ASSETS manifest", () => {
  const types = firearmTypeSchema.options as FirearmType[];

  it("declares a base asset for every firearm type", () => {
    for (const type of types) {
      expect(FIREARM_VISUAL_ASSETS[type].base).toBeDefined();
    }
  });

  it("maps every layer to a valid accessory category", () => {
    for (const type of types) {
      for (const category of Object.keys(FIREARM_VISUAL_ASSETS[type].layers)) {
        expect(VALID_CATEGORIES.has(category)).toBe(true);
      }
    }
  });

  it("uses only valid visual slots", () => {
    for (const type of types) {
      for (const layer of Object.values(FIREARM_VISUAL_ASSETS[type].layers)) {
        expect(VALID_SLOTS.has(layer.visualSlot)).toBe(true);
      }
    }
  });

  it("assigns a finite numeric zIndex to every layer", () => {
    for (const type of types) {
      for (const layer of Object.values(FIREARM_VISUAL_ASSETS[type].layers)) {
        expect(Number.isFinite(layer.zIndex)).toBe(true);
      }
    }
  });

  it("supports red dot + magnifier on the rifle profile", () => {
    const rifle = FIREARM_VISUAL_ASSETS.rifle.layers;
    expect(rifle.red_dot?.visualSlot).toBe("primary_optic");
    expect(rifle.magnifier?.visualSlot).toBe("optic_auxiliary");
  });

  it("ships the complete layered asset pack for every firearm type", () => {
    const layerKeys = (type: FirearmType) =>
      Object.keys(FIREARM_VISUAL_ASSETS[type].layers).sort();

    expect(layerKeys("pistol")).toEqual(
      ["flashlight", "laser", "red_dot", "suppressor"].sort()
    );
    expect(layerKeys("revolver")).toEqual([]);
    expect(layerKeys("pcc")).toEqual(
      ["flashlight", "grip", "laser", "magnifier", "red_dot", "scope", "suppressor"].sort()
    );
    expect(layerKeys("rifle")).toEqual(
      ["bipod", "flashlight", "grip", "laser", "magnifier", "red_dot", "scope", "suppressor"].sort()
    );
    expect(layerKeys("bolt_action_rifle")).toEqual(
      ["bipod", "scope", "suppressor"].sort()
    );
    expect(layerKeys("shotgun")).toEqual(["flashlight", "red_dot"].sort());
    expect(layerKeys("other")).toEqual([]);
  });

  it("stacks muzzle and support layers beneath optics", () => {
    const manifest: FirearmVisualAssetManifest = FIREARM_VISUAL_ASSETS;
    for (const type of types) {
      const layers = manifest[type].layers;
      const optic = layers.red_dot ?? layers.scope;
      if (!optic) continue;
      for (const low of [layers.suppressor, layers.bipod]) {
        if (low) expect(low.zIndex).toBeLessThan(optic.zIndex);
      }
    }
  });
});
