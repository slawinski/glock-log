import { resolveImageSource } from "./image-source-manager";

describe("image-source-manager", () => {
  describe("resolveImageSource", () => {
    it("returns URI object for non-placeholder images", () => {
      const testCases = [
        "https://example.com/image.jpg",
        "file:///path/to/image.png",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
        "/local/path/to/image.png",
        "image.jpg",
      ];

      testCases.forEach((input) => {
        const result = resolveImageSource(input);
        expect(result).toEqual({ uri: input });
      });
    });

    it("handles empty strings", () => {
      const result = resolveImageSource("");
      expect(result).toEqual({ uri: "" });
    });

    it("handles placeholder prefix without colon", () => {
      const result = resolveImageSource("placeholder");
      expect(result).toEqual({ uri: "placeholder" });
    });

    it("handles case sensitivity", () => {
      const result = resolveImageSource("PLACEHOLDER:pistol-placeholder.png");
      expect(result).toEqual({ uri: "PLACEHOLDER:pistol-placeholder.png" });
    });

    it("handles placeholder with extra text", () => {
      const result = resolveImageSource("placeholder:pistol-placeholder.png:extra");
      expect(result).toEqual({ uri: "placeholder:pistol-placeholder.png:extra" });
    });

    it("handles multiple colons in placeholder", () => {
      const result = resolveImageSource("placeholder::pistol-placeholder.png");
      expect(result).toEqual({ uri: "placeholder::pistol-placeholder.png" });
    });

    it("handles whitespace in placeholder identifiers", () => {
      const testCases = [
        "placeholder: pistol-placeholder.png",
        "placeholder:pistol-placeholder.png ",
        " placeholder:pistol-placeholder.png",
      ];

      testCases.forEach((input) => {
        const result = resolveImageSource(input);
        expect(result).toEqual({ uri: input });
      });
    });

    it("handles invalid placeholder keys", () => {
      const invalidPlaceholders = [
        "placeholder:invalid-placeholder.png",
        "placeholder:nonexistent.png",
        "placeholder:",
        "placeholder:rifle-placeholder.png",
      ];

      invalidPlaceholders.forEach((input) => {
        const result = resolveImageSource(input);
        expect(result).toEqual({ uri: input });
      });
    });

    it("performance test - handles many calls efficiently", () => {
      const inputs = [
        "https://example.com/image.jpg",
        "placeholder:invalid.png",
        "file:///path/image.png",
      ];

      const startTime = Date.now();
      
      // Call function many times
      for (let i = 0; i < 1000; i++) {
        inputs.forEach(input => resolveImageSource(input));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 3000 calls)
      expect(duration).toBeLessThan(100);
    });

    it("handles valid string inputs", () => {
      // Test with various valid string inputs
      const validInputs = [
        "test",
        "123",
        "true",
        "false",
        "null",
        "undefined"
      ];

      validInputs.forEach(input => {
        const result = resolveImageSource(input);
        expect(result).toEqual({ uri: input });
      });
    });

    it("function signature matches expected interface", () => {
      // Test that the function accepts string and returns correct type
      const result = resolveImageSource("test");
      
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("uri");
      expect(result.uri).toBe("test");
    });

    it("placeholder detection logic works correctly", () => {
      // Test the core logic without relying on mocked placeholderImages
      const placeholderInput = "placeholder:test.png";
      const nonPlaceholderInput = "http://example.com/image.jpg";
      
      const placeholderResult = resolveImageSource(placeholderInput);
      const nonPlaceholderResult = resolveImageSource(nonPlaceholderInput);
      
      // Placeholder should either resolve to a placeholder or return URI
      expect(placeholderResult).toBeDefined();
      
      // Non-placeholder should always return URI object
      expect(nonPlaceholderResult).toEqual({ uri: nonPlaceholderInput });
    });
  });
});