import {
  inferLegacyFirearmType,
  isPlaceholderPhoto,
  stripPlaceholderPhotos,
} from "./legacy";

describe("inferLegacyFirearmType", () => {
  it("maps a pistol placeholder to pistol", () => {
    expect(
      inferLegacyFirearmType(["placeholder:pistol-placeholder.png"])
    ).toBe("pistol");
  });

  it("maps a red-dot placeholder to pistol (never infers a mount)", () => {
    expect(
      inferLegacyFirearmType(["placeholder:pistol-reddot-placeholder.png"])
    ).toBe("pistol");
  });

  it("maps carbine to rifle", () => {
    expect(inferLegacyFirearmType(["placeholder:carbine-placeholder.png"])).toBe(
      "rifle"
    );
  });

  it("maps the remaining known placeholders", () => {
    expect(inferLegacyFirearmType(["placeholder:revolver-placeholder.png"])).toBe(
      "revolver"
    );
    expect(inferLegacyFirearmType(["placeholder:pcc-placeholder.png"])).toBe(
      "pcc"
    );
    expect(inferLegacyFirearmType(["placeholder:shotgun-placeholder.png"])).toBe(
      "shotgun"
    );
  });

  it("returns null for unknown or non-placeholder photos", () => {
    expect(inferLegacyFirearmType(["file:///real.jpg"])).toBeNull();
    expect(inferLegacyFirearmType(["placeholder:unknown.png"])).toBeNull();
    expect(inferLegacyFirearmType(undefined)).toBeNull();
  });

  it("never infers from model names", () => {
    expect(inferLegacyFirearmType(["file:///glock.jpg"])).toBeNull();
  });
});

describe("stripPlaceholderPhotos", () => {
  it("removes placeholder entries and keeps real photos in order", () => {
    expect(
      stripPlaceholderPhotos([
        "file:///one.jpg",
        "placeholder:pistol-placeholder.png",
        "file:///two.jpg",
      ])
    ).toEqual(["file:///one.jpg", "file:///two.jpg"]);
  });

  it("handles undefined and empty lists", () => {
    expect(stripPlaceholderPhotos(undefined)).toEqual([]);
    expect(stripPlaceholderPhotos([])).toEqual([]);
  });
});

describe("isPlaceholderPhoto", () => {
  it("recognizes placeholder entries", () => {
    expect(isPlaceholderPhoto("placeholder:x")).toBe(true);
    expect(isPlaceholderPhoto("file:///x.jpg")).toBe(false);
  });
});
