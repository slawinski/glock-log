import {
  MountedAccessoryVisual,
  ResolvedFirearmVisual,
  ResolvedFirearmVisualLayer,
  FirearmVisualState,
  FirearmVisualProfile,
} from "./types";
import { FIREARM_VISUAL_ASSETS } from "./firearmVisualAssets";

/**
 * Compares two mounted accessories for slot-conflict resolution: the more
 * recently mounted one wins; on an exact timestamp tie the smaller id wins
 * for determinism.
 */
const isNewerThan = (
  candidate: MountedAccessoryVisual,
  current: MountedAccessoryVisual
): boolean => {
  const delta =
    new Date(candidate.mountedAt).getTime() - new Date(current.mountedAt).getTime();
  if (delta !== 0) return delta > 0;
  return candidate.id < current.id;
};

/**
 * Pure resolver (spec §19): converts domain state (firearm type + mounted
 * accessories) into the derived, layered artwork description. It performs no
 * storage writes and never mutates firearm or accessory records.
 *
 * Composition rules:
 * - accessories without a matching layer are omitted (never an error);
 * - accessories on different visual slots all render together;
 * - accessories competing for the same slot resolve to the most-recently
 *   mounted one (a visual rule only — mount history stays authoritative).
 */
export const resolveFirearmVisualLayers = (
  state: FirearmVisualState
): ResolvedFirearmVisual => {
  const profile: FirearmVisualProfile = FIREARM_VISUAL_ASSETS[state.firearmType];

  const winnersBySlot = new Map<string, MountedAccessoryVisual>();
  for (const accessory of state.accessories) {
    const layerAsset = profile.layers[accessory.category];
    if (!layerAsset) continue;
    const current = winnersBySlot.get(layerAsset.visualSlot);
    if (!current || isNewerThan(accessory, current)) {
      winnersBySlot.set(layerAsset.visualSlot, accessory);
    }
  }

  const layers: ResolvedFirearmVisualLayer[] = [...winnersBySlot.entries()].map(
    ([slot, accessory]) => {
      const layerAsset = profile.layers[accessory.category]!;
      return {
        key: `${slot}:${accessory.id}`,
        source: layerAsset.source,
        visualSlot: layerAsset.visualSlot,
        zIndex: layerAsset.zIndex,
        accessoryId: accessory.id,
      };
    }
  );

  layers.sort((a, b) => a.zIndex - b.zIndex || a.key.localeCompare(b.key));

  return {
    firearmType: state.firearmType,
    base: profile.base,
    layers,
  };
};
