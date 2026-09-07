import {
  FirearmVisualAssetManifest,
  FirearmVisualLayerAsset,
  FirearmVisualSlot,
} from "./types";

/**
 * Statically-typed manifest mapping each firearm type to its base silhouette
 * and supported accessory layers. Static `require()` calls mean a missing or
 * misnamed asset fails at bundle time, not at runtime — never construct
 * `require()` paths dynamically.
 */
const layer = (
  source: number,
  visualSlot: FirearmVisualSlot,
  zIndex: number
): FirearmVisualLayerAsset => ({ source, visualSlot, zIndex });

export const FIREARM_VISUAL_ASSETS = {
  pistol: {
    base: require("../../../assets/images/firearms/pistol/base.png"),
    layers: {
      red_dot: layer(
        require("../../../assets/images/firearms/pistol/layers/red-dot.png"),
        "primary_optic",
        40
      ),
      flashlight: layer(
        require("../../../assets/images/firearms/pistol/layers/flashlight.png"),
        "side_rail",
        20
      ),
    },
  },
  revolver: {
    base: require("../../../assets/images/firearms/revolver/base.png"),
    layers: {},
  },
  pcc: {
    base: require("../../../assets/images/firearms/pcc/base.png"),
    layers: {
      red_dot: layer(
        require("../../../assets/images/firearms/pcc/layers/red-dot.png"),
        "primary_optic",
        40
      ),
      magnifier: layer(
        require("../../../assets/images/firearms/pcc/layers/magnifier.png"),
        "optic_auxiliary",
        35
      ),
      flashlight: layer(
        require("../../../assets/images/firearms/pcc/layers/flashlight.png"),
        "side_rail",
        20
      ),
    },
  },
  rifle: {
    base: require("../../../assets/images/firearms/rifle/base.png"),
    layers: {
      red_dot: layer(
        require("../../../assets/images/firearms/rifle/layers/red-dot.png"),
        "primary_optic",
        40
      ),
      magnifier: layer(
        require("../../../assets/images/firearms/rifle/layers/magnifier.png"),
        "optic_auxiliary",
        35
      ),
      scope: layer(
        require("../../../assets/images/firearms/rifle/layers/scope.png"),
        "primary_optic",
        40
      ),
      flashlight: layer(
        require("../../../assets/images/firearms/rifle/layers/flashlight.png"),
        "side_rail",
        20
      ),
      suppressor: layer(
        require("../../../assets/images/firearms/rifle/layers/suppressor.png"),
        "muzzle",
        10
      ),
      grip: layer(
        require("../../../assets/images/firearms/rifle/layers/grip.png"),
        "underbarrel",
        20
      ),
    },
  },
  bolt_action_rifle: {
    base: require("../../../assets/images/firearms/bolt-action-rifle/base.png"),
    layers: {
      scope: layer(
        require("../../../assets/images/firearms/bolt-action-rifle/layers/scope.png"),
        "primary_optic",
        40
      ),
      bipod: layer(
        require("../../../assets/images/firearms/bolt-action-rifle/layers/bipod.png"),
        "support",
        15
      ),
    },
  },
  shotgun: {
    base: require("../../../assets/images/firearms/shotgun/base.png"),
    layers: {
      red_dot: layer(
        require("../../../assets/images/firearms/shotgun/layers/red-dot.png"),
        "primary_optic",
        40
      ),
      flashlight: layer(
        require("../../../assets/images/firearms/shotgun/layers/flashlight.png"),
        "side_rail",
        20
      ),
    },
  },
  other: {
    base: require("../../../assets/images/firearms/other/base.png"),
    layers: {},
  },
} satisfies FirearmVisualAssetManifest;
