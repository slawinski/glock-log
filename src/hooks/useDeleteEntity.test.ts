import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useDeleteEntity } from "./useDeleteEntity";
import { handleError } from "../services/error-handler";

jest.mock("../services/error-handler", () => ({
  handleError: jest.fn(),
}));

const alertMock = jest.spyOn(Alert, "alert");

const getAlertButtons = () => {
  const calls = alertMock.mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[2] as Array<{ text: string; style?: string; onPress?: () => void }>;
};

const pressAlertButton = (text: string) => {
  const button = getAlertButtons().find((b) => b.text === text);
  button?.onPress?.();
};

describe("useDeleteEntity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the confirm dialog with derived title and message", () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDeleteEntity(
        deleteFn,
        {
          label: "Firearm",
          errorContext: "FirearmDetails.handleDelete",
          errorUserMessage: "Failed to delete firearm. Please try again.",
        },
        onSuccess
      )
    );

    act(() => {
      result.current.confirmDelete();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Firearm",
      "Are you sure you want to delete this firearm? This action cannot be undone.",
      expect.any(Array)
    );
  });

  it("supports custom confirm dialog copy", () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDeleteEntity(
        deleteFn,
        {
          label: "Range Visit",
          confirmTitle: "Confirm Delete",
          confirmMessage: "Are you sure you want to delete this range visit?",
          errorContext: "RangeVisitDetails.handleDelete",
          errorUserMessage: "Failed to delete range visit.",
        },
        onSuccess
      )
    );

    act(() => {
      result.current.confirmDelete();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Confirm Delete",
      "Are you sure you want to delete this range visit?",
      expect.any(Array)
    );
  });

  it("calls deleteFn then onSuccess when the user confirms", async () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDeleteEntity(
        deleteFn,
        {
          label: "Firearm",
          errorContext: "FirearmDetails.handleDelete",
          errorUserMessage: "Failed to delete firearm. Please try again.",
        },
        onSuccess
      )
    );

    act(() => {
      result.current.confirmDelete();
    });
    expect(deleteFn).not.toHaveBeenCalled();

    await act(async () => {
      pressAlertButton("Delete");
    });

    expect(deleteFn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(handleError).not.toHaveBeenCalled();
  });

  it("does nothing when the user cancels", () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDeleteEntity(
        deleteFn,
        {
          label: "Ammunition",
          errorContext: "AmmunitionDetails.handleDelete",
          errorUserMessage: "Failed to delete ammunition. Please try again.",
        },
        onSuccess
      )
    );

    act(() => {
      result.current.confirmDelete();
    });
    act(() => {
      pressAlertButton("Cancel");
    });

    expect(deleteFn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("reports a user-facing error when deleteFn fails", async () => {
    const deleteFn = jest.fn().mockRejectedValue(new Error("Delete failed"));
    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useDeleteEntity(
        deleteFn,
        {
          label: "Firearm",
          errorContext: "FirearmDetails.handleDelete",
          errorUserMessage: "Failed to delete firearm. Please try again.",
        },
        onSuccess
      )
    );

    act(() => {
      result.current.confirmDelete();
    });

    await act(async () => {
      pressAlertButton("Delete");
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      "FirearmDetails.handleDelete",
      expect.objectContaining({
        isUserFacing: true,
        userMessage: "Failed to delete firearm. Please try again.",
      })
    );
  });
});
