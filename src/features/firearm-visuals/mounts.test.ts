import {
  getMountedAccessoriesForFirearmAt,
  deriveCurrentMounts,
  toMountedAccessoryVisuals,
  toCurrentMountedAccessoryVisuals,
} from "./mounts";
import {
  AccessoryCategory,
  AccessoryMountSession,
  AccessoryStorage,
} from "../../validation/storageSchemas";

const session = (
  id: string,
  firearmId: string,
  mountedAt: string,
  unmountedAt?: string
): AccessoryMountSession => ({
  id,
  firearmId,
  firearmNameSnapshot: firearmId,
  mountedAt,
  unmountedAt,
  createdAt: mountedAt,
  updatedAt: mountedAt,
});

const accessory = (
  id: string,
  category: AccessoryCategory,
  mountHistory: AccessoryMountSession[]
): AccessoryStorage => ({
  id,
  category,
  modelName: id,
  initialRounds: 0,
  status: "active",
  mountHistory,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("getMountedAccessoriesForFirearmAt", () => {
  const AUG_1 = "2026-08-01T00:00:00.000Z";
  const AUG_5 = "2026-08-05T00:00:00.000Z";
  const AUG_10 = "2026-08-10T00:00:00.000Z";
  const AUG_12 = "2026-08-12T00:00:00.000Z";

  it("is mounted when unmountedAt is absent", () => {
    const list = [accessory("a", "red_dot", [session("s1", "f1", AUG_1)])];
    expect(getMountedAccessoriesForFirearmAt(list, "f1", AUG_5)).toHaveLength(1);
  });

  it("is mounted within a closed interval", () => {
    const list = [
      accessory("a", "red_dot", [session("s1", "f1", AUG_1, AUG_10)]),
    ];
    expect(getMountedAccessoriesForFirearmAt(list, "f1", AUG_5)).toHaveLength(1);
  });

  it("is not mounted after the interval closes", () => {
    const list = [
      accessory("a", "red_dot", [session("s1", "f1", AUG_1, AUG_10)]),
    ];
    expect(getMountedAccessoriesForFirearmAt(list, "f1", AUG_12)).toHaveLength(0);
  });

  it("is not mounted before the interval starts", () => {
    const list = [accessory("a", "red_dot", [session("s1", "f1", AUG_10)])];
    expect(getMountedAccessoriesForFirearmAt(list, "f1", AUG_5)).toHaveLength(0);
  });

  it("only includes accessories mounted on the requested firearm", () => {
    const list = [
      accessory("a", "red_dot", [session("s1", "f1", AUG_1)]),
      accessory("b", "flashlight", [session("s2", "f2", AUG_1)]),
    ];
    expect(getMountedAccessoriesForFirearmAt(list, "f1", AUG_5)).toEqual([
      list[0],
    ]);
  });
});

describe("deriveCurrentMounts", () => {
  it("groups currently-mounted accessories by firearm id", () => {
    const AUG_1 = "2026-08-01T00:00:00.000Z";
    const list = [
      accessory("a", "red_dot", [session("s1", "f1", AUG_1)]),
      accessory("b", "flashlight", [session("s2", "f1", AUG_1)]),
      accessory("c", "scope", [session("s3", "f2", AUG_1)]),
    ];
    const at = "2026-08-05T00:00:00.000Z";
    const map = deriveCurrentMounts(list, at);
    expect(map.get("f1")?.map((a) => a.id)).toEqual(["a", "b"]);
    expect(map.get("f2")?.map((a) => a.id)).toEqual(["c"]);
  });

  it("excludes unmounted accessories", () => {
    const AUG_1 = "2026-08-01T00:00:00.000Z";
    const AUG_2 = "2026-08-02T00:00:00.000Z";
    const list = [
      accessory("a", "red_dot", [session("s1", "f1", AUG_1, AUG_2)]),
    ];
    const at = "2026-08-05T00:00:00.000Z";
    expect(deriveCurrentMounts(list, at).size).toBe(0);
  });
});

describe("toMountedAccessoryVisuals", () => {
  it("carries the effective mountedAt of the covering interval", () => {
    const AUG_1 = "2026-08-01T00:00:00.000Z";
    const AUG_3 = "2026-08-03T00:00:00.000Z";
    const AUG_5 = "2026-08-05T00:00:00.000Z";
    const list = [
      accessory("a", "red_dot", [
        session("s1", "f0", AUG_1, AUG_3),
        session("s2", "f1", AUG_3),
      ]),
    ];
    const visuals = toMountedAccessoryVisuals(list, "f1", AUG_5);
    expect(visuals).toHaveLength(1);
    expect(visuals[0].category).toBe("red_dot");
    expect(visuals[0].mountedAt).toBe(AUG_3);
  });

  it("uses the active mount for currently-mounted accessories", () => {
    const AUG_1 = "2026-08-01T00:00:00.000Z";
    const list = [accessory("a", "red_dot", [session("s1", "f1", AUG_1)])];
    const visuals = toCurrentMountedAccessoryVisuals(list);
    expect(visuals).toHaveLength(1);
    expect(visuals[0].mountedAt).toBe(AUG_1);
  });
});
