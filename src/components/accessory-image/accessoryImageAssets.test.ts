import { ACCESSORY_IMAGE_ASSETS } from "./accessoryImageAssets";
import { accessoryCategorySchema } from "../../validation/storageSchemas";

jest.mock("../../../assets/images/accessories/red-dot.svg", () => 1);
jest.mock("../../../assets/images/accessories/scope.svg", () => 2);
jest.mock("../../../assets/images/accessories/magnifier.svg", () => 3);
jest.mock("../../../assets/images/accessories/iron-sights.svg", () => 4);
jest.mock("../../../assets/images/accessories/flashlight.svg", () => 5);
jest.mock("../../../assets/images/accessories/laser.svg", () => 6);
jest.mock("../../../assets/images/accessories/suppressor.svg", () => 7);
jest.mock("../../../assets/images/accessories/bipod.svg", () => 8);
jest.mock("../../../assets/images/accessories/grip.svg", () => 9);
jest.mock("../../../assets/images/accessories/stock-brace.svg", () => 10);
jest.mock("../../../assets/images/accessories/sling.svg", () => 11);
jest.mock("../../../assets/images/accessories/mount-adapter.svg", () => 12);
jest.mock("../../../assets/images/accessories/other.svg", () => 13);

describe("ACCESSORY_IMAGE_ASSETS", () => {
  it("covers every accessory category exactly once", () => {
    expect(Object.keys(ACCESSORY_IMAGE_ASSETS).sort()).toEqual(
      [...accessoryCategorySchema.options].sort()
    );
  });

  it("maps each category to its standalone bundled asset", () => {
    expect(ACCESSORY_IMAGE_ASSETS).toEqual({
      red_dot: 1,
      scope: 2,
      magnifier: 3,
      iron_sights: 4,
      flashlight: 5,
      laser: 6,
      suppressor: 7,
      bipod: 8,
      grip: 9,
      stock_brace: 10,
      sling: 11,
      mount_adapter: 12,
      other: 13,
    });
  });
});
