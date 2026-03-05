import { resolveImageSource, normalizeImagePath } from "./image-source-manager";
import * as FileSystem from "expo-file-system";

describe("image-source-manager", () => {
  describe("normalizeImagePath", () => {
    const mockDocDir = "file:///mock/docs/";

    it("leaves placeholders unchanged", () => {
      const path = "placeholder:pistol-placeholder.png";
      expect(normalizeImagePath(path)).toBe(path);
    });

    it("leaves http/https URLs unchanged", () => {
      const path = "https://example.com/image.jpg";
      expect(normalizeImagePath(path)).toBe(path);
    });

    it("normalizes local file paths containing 'images/'", () => {
      const oldPath = "file:///old-uuid/Documents/images/firearm_123.jpg";
      const expected = `${FileSystem.documentDirectory}images/firearm_123.jpg`;
      expect(normalizeImagePath(oldPath)).toBe(expected);
    });

    it("handles paths with multiple 'images/' occurrences by taking the last one", () => {
      const complexPath = "/some/path/images/sub/images/photo.jpg";
      const expected = `${FileSystem.documentDirectory}images/photo.jpg`;
      expect(normalizeImagePath(complexPath)).toBe(expected);
    });

    it("returns original path if 'images/' is not present", () => {
      const randomPath = "/some/random/path/photo.jpg";
      expect(normalizeImagePath(randomPath)).toBe(randomPath);
    });

    it("handles empty or null paths gracefully", () => {
      expect(normalizeImagePath("")).toBe("");
      expect(normalizeImagePath(null as any)).toBeNull();
    });
  });

  describe("resolveImageSource", () => {
    it("returns URI object for non-placeholder images with normalization", () => {
      const input = "file:///old-path/images/test.jpg";
      const expectedUri = `${FileSystem.documentDirectory}images/test.jpg`;
      
      const result = resolveImageSource(input);
      expect(result).toEqual({ uri: expectedUri });
    });

    it("returns original URI if normalization doesn't apply", () => {
      const input = "https://example.com/image.jpg";
      const result = resolveImageSource(input);
      expect(result).toEqual({ uri: input });
    });

    it("handles empty strings", () => {
      const result = resolveImageSource("");
      expect(result).toEqual({ uri: "" });
    });

    it("handles placeholder identifiers correctly", () => {
      // Note: We can't easily test actual require() values here, 
      // but we can test that it doesn't return a {uri} object for valid placeholders
      const result = resolveImageSource("placeholder:pistol-placeholder.png");
      expect(result).not.toEqual({ uri: expect.any(String) });
    });
  });
});
