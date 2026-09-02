import * as FileSystem from "expo-file-system";
import { zipWithPassword } from "react-native-zip-archive";
import {
  MAX_IMPORT_FILE_SIZE_BYTES,
  ImportFileTooLargeError,
  checkImportFileSize,
  cleanPath,
  exportData,
  isImportData,
  isPathInside,
  resolveArchivePath,
} from "../data-transfer-service";
import { firearmService } from "../firearm-service";
import { ammunitionService } from "../ammunition-service";
import { rangeVisitService } from "../range-visit-service";
import { handleError } from "../error-handler";

// The global setup mock does not cover the password-aware zip APIs.
jest.mock("react-native-zip-archive", () => ({
  zip: jest.fn(),
  unzip: jest.fn(),
  zipWithPassword: jest.fn().mockResolvedValue("zip-path"),
  unzipWithPassword: jest.fn(),
  isPasswordProtected: jest.fn(),
  subscribe: jest.fn(),
}));

jest.mock("../error-handler", () => {
  const actual = jest.requireActual("../error-handler");
  return { ...actual, handleError: jest.fn() };
});

jest.mock("../image-storage", () => ({
  cleanupOrphanedImages: jest.fn(),
}));

jest.mock("../firearm-service", () => ({
  firearmService: { getFirearms: jest.fn() },
}));
jest.mock("../ammunition-service", () => ({
  ammunitionService: { getAmmunition: jest.fn() },
}));
jest.mock("../range-visit-service", () => ({
  rangeVisitService: { getRangeVisits: jest.fn() },
}));
jest.mock("../settings-service", () => ({
  settingsService: { clearAllData: jest.fn() },
}));

describe("data-transfer-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(firearmService.getFirearms).mockResolvedValue([]);
    jest.mocked(ammunitionService.getAmmunition).mockResolvedValue([]);
    jest.mocked(rangeVisitService.getRangeVisits).mockResolvedValue([]);
  });

  describe("resolveArchivePath / isPathInside (zip-slip defense)", () => {
    it("resolves '.' and '..' segments", () => {
      expect(resolveArchivePath("/a/b/../c")).toBe("/a/c");
      expect(resolveArchivePath("/a/b/../../c")).toBe("/c");
      expect(resolveArchivePath("/a/./b")).toBe("/a/b");
      expect(resolveArchivePath("file:///a/b/../../c")).toBe("file:///c");
    });

    it("keeps segments that would climb above the URI root", () => {
      // Deliberately conservative: unresolved ".." segments are preserved so
      // the path can never be mistaken for a descendant of a checked root.
      expect(resolveArchivePath("/../../etc/passwd")).toBe("/../../etc/passwd");
    });

    it("accepts files inside the root and rejects escapes", () => {
      expect(isPathInside("/a/b", "/a/b/file.txt")).toBe(true);
      expect(isPathInside("/a/b", "/a/b/nested/deep.png")).toBe(true);
      expect(isPathInside("/a/b", "/a/b")).toBe(true);
      expect(isPathInside("/a/b", "/a/b/")).toBe(true);

      expect(isPathInside("/a/b", "/a/bc")).toBe(false);
      expect(isPathInside("/a/b", "/a/b/../evil.txt")).toBe(false);
      expect(isPathInside("/a/b", "/a/b/images/../../evil.txt")).toBe(false);
      expect(isPathInside("/a/b", "/a/evil.txt")).toBe(false);
    });

    it("handles file:// URIs", () => {
      const root = "file:///cache/triggernote_import_123";
      expect(
        isPathInside(root, "file:///cache/triggernote_import_123/images/ok.png")
      ).toBe(true);
      expect(
        isPathInside(root, "file:///cache/triggernote_import_123/images/../../evil.png")
      ).toBe(false);
      expect(isPathInside(root, "file:///cache/triggernote_import_1234/evil.png")).toBe(false);
    });

    it("rejects archive entries that escape the images directory", () => {
      const imagesRoot = "file:///cache/triggernote_import_123/images/";
      expect(isPathInside(imagesRoot, `${imagesRoot}../../evil.png`)).toBe(false);
      expect(isPathInside(imagesRoot, `${imagesRoot}ok.png`)).toBe(true);
    });
  });

  describe("checkImportFileSize (C19)", () => {
    it("rejects archives larger than the 100 MB limit", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: MAX_IMPORT_FILE_SIZE_BYTES + 1,
      });

      await expect(checkImportFileSize("file:///big.zip")).rejects.toThrow(
        ImportFileTooLargeError
      );
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith("file:///big.zip", {
        size: true,
      });
    });

    it("allows archives at or under the limit", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: MAX_IMPORT_FILE_SIZE_BYTES,
      });

      await expect(checkImportFileSize("file:///ok.zip")).resolves.toBeUndefined();
    });

    it("allows files whose size is unknown", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      await expect(checkImportFileSize("file:///unknown.zip")).resolves.toBeUndefined();
    });
  });

  describe("exportData (B7)", () => {
    it("zips the bundle with AES-256 and the given passphrase", async () => {
      jest.mocked(firearmService.getFirearms).mockResolvedValue([
        {
          id: "firearm-1",
          modelName: "Glock 19",
          caliber: "9mm",
          datePurchased: "2026-01-15T10:00:00.000Z",
          amountPaid: 550,
          roundsFired: 10,
          createdAt: "2026-01-15T10:00:00.000Z",
          updatedAt: "2026-01-15T10:00:00.000Z",
        },
      ]);
      jest.mocked(zipWithPassword).mockResolvedValue("file:///test-cache/out.zip");

      const zipPath = await exportData("s3cret-pass");

      // The service returns the archive path it created in the cache dir.
      expect(zipPath).toMatch(/triggernote_backup_.*\.zip$/);
      expect(zipWithPassword).toHaveBeenCalledTimes(1);

      const [source, target, password, encryptionMethod] =
        jest.mocked(zipWithPassword).mock.calls[0];
      expect(source).toEqual(expect.stringContaining("triggernote_export_"));
      expect(target).toEqual(expect.stringContaining("triggernote_backup_"));
      expect(password).toBe("s3cret-pass");
      expect(encryptionMethod).toBe("AES-256");

      // The passphrase must never be written to disk (B7).
      const writeCalls = jest.mocked(FileSystem.writeAsStringAsync).mock.calls;
      expect(writeCalls.length).toBeGreaterThan(0);
      const writtenPayloads = writeCalls
        .map((call) => String(call[1]))
        .join("\n");
      expect(writtenPayloads).toContain('"version": "1.1.0"');
      expect(writtenPayloads).toContain("firearm-1");
      expect(writtenPayloads).not.toContain("s3cret-pass");

      // The staging directory is cleaned up after the archive is created.
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining("triggernote_export_"),
        { idempotent: true }
      );
    });

    it("logs and rethrows when archive creation fails", async () => {
      jest.mocked(zipWithPassword).mockRejectedValue(new Error("zip boom"));

      await expect(exportData("s3cret-pass")).rejects.toThrow("zip boom");
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "Storage.exportData",
        { userMessage: "Failed to export data." }
      );
    });
  });

  describe("isImportData", () => {
    it("accepts a well-formed bundle", () => {
      expect(
        isImportData({ firearms: [], ammunition: [], rangeVisits: [] })
      ).toBe(true);
    });

    it("rejects malformed payloads", () => {
      expect(isImportData(null)).toBe(false);
      expect(isImportData("nope")).toBe(false);
      expect(isImportData([])).toBe(false);
      expect(isImportData({ firearms: [] })).toBe(false);
      expect(
        isImportData({ firearms: "nope", ammunition: [], rangeVisits: [] })
      ).toBe(false);
      expect(
        isImportData({ firearms: [], ammunition: [], rangeVisits: {} })
      ).toBe(false);
    });
  });

  describe("cleanPath", () => {
    it("leaves file:// URIs untouched on iOS", () => {
      expect(cleanPath("file:///tmp/archive.zip")).toBe("file:///tmp/archive.zip");
    });
  });
});
