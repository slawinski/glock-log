import { up } from "./001_convert_grain_to_string";

export async function runMigrations(): Promise<void> {
  try {
    console.log("Running migrations...");
    await up();
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
