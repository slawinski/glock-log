import {
  variantPlaceholderKeyFor,
  basePlaceholderKeyFor,
  effectivePlaceholderKey,
} from "../firearm-placeholder";

describe("firearm-placeholder", () => {
  describe("variantPlaceholderKeyFor", () => {
    it("maps a pistol base to the red-dot variant", () => {
      expect(
        variantPlaceholderKeyFor("pistol-placeholder.png", "red_dot")
      ).toBe("pistol-reddot-placeholder.png");
    });

    it("returns null for a base with no registered variant", () => {
      expect(
        variantPlaceholderKeyFor("revolver-placeholder.png", "red_dot")
      ).toBeNull();
    });

    it("returns null for a category with no mapping", () => {
      expect(
        variantPlaceholderKeyFor("pistol-placeholder.png", "flashlight")
      ).toBeNull();
    });
  });

  describe("basePlaceholderKeyFor", () => {
    it("resolves a variant back to its base", () => {
      expect(basePlaceholderKeyFor("pistol-reddot-placeholder.png")).toBe(
        "pistol-placeholder.png"
      );
    });

    it("passes a base key through unchanged", () => {
      expect(basePlaceholderKeyFor("pistol-placeholder.png")).toBe(
        "pistol-placeholder.png"
      );
    });
  });

  describe("effectivePlaceholderKey", () => {
    it("defaults an empty photo to the pistol placeholder", () => {
      expect(effectivePlaceholderKey(undefined, [])).toBe(
        "pistol-placeholder.png"
      );
    });

    it("applies the red-dot variant to an empty photo", () => {
      expect(effectivePlaceholderKey(undefined, ["red_dot"])).toBe(
        "pistol-reddot-placeholder.png"
      );
    });

    it("applies the red-dot variant to a pistol placeholder", () => {
      expect(
        effectivePlaceholderKey("placeholder:pistol-placeholder.png", ["red_dot"])
      ).toBe("pistol-reddot-placeholder.png");
    });

    it("reverts a red-dot variant to base when no red dot is mounted", () => {
      expect(
        effectivePlaceholderKey("placeholder:pistol-reddot-placeholder.png", [])
      ).toBe("pistol-placeholder.png");
    });

    it("keeps the variant while a red dot remains mounted", () => {
      expect(
        effectivePlaceholderKey(
          "placeholder:pistol-reddot-placeholder.png",
          ["red_dot"]
        )
      ).toBe("pistol-reddot-placeholder.png");
    });

    it("leaves real photos untouched", () => {
      expect(effectivePlaceholderKey("file:///real.jpg", ["red_dot"])).toBeNull();
    });

    it("leaves other firearm types untouched (no variant registered)", () => {
      expect(
        effectivePlaceholderKey("placeholder:revolver-placeholder.png", ["red_dot"])
      ).toBe("revolver-placeholder.png");
    });

    it("prefers the highest-precedence mounted category with a variant", () => {
      expect(
        effectivePlaceholderKey("placeholder:pistol-placeholder.png", [
          "flashlight",
          "red_dot",
        ])
      ).toBe("pistol-reddot-placeholder.png");
    });
  });
});
