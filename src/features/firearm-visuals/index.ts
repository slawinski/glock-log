export { FirearmArtwork } from "./FirearmArtwork";
export {
  resolveFirearmVisualLayers,
} from "./firearmVisualResolver";
export { FIREARM_VISUAL_ASSETS } from "./firearmVisualAssets";
export {
  FIREARM_VISUAL_SLOTS,
  DEFAULT_CATEGORY_VISUAL_SLOT,
} from "./visualSlots";
export {
  getMountedAccessoriesForFirearmAt,
  deriveCurrentMounts,
  toMountedAccessoryVisuals,
  toCurrentMountedAccessoryVisuals,
} from "./mounts";
export {
  inferLegacyFirearmType,
  isPlaceholderPhoto,
  stripPlaceholderPhotos,
} from "./legacy";
export type {
  FirearmVisualSlot,
  FirearmVisualLayerAsset,
  FirearmVisualProfile,
  FirearmVisualAssetManifest,
  MountedAccessoryVisual,
  FirearmVisualState,
  ResolvedFirearmVisualLayer,
  ResolvedFirearmVisual,
} from "./types";
