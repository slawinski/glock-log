import { jest } from "@jest/globals";

export const storage = {
  getFirearms: jest.fn(),
  deleteFirearm: jest.fn(),
  getRangeVisits: jest.fn(),
  deleteRangeVisit: jest.fn(),
  getAmmunition: jest.fn(),
  deleteAmmunition: jest.fn(),
};
