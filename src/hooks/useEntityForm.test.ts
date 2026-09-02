import { renderHook, act, waitFor } from "@testing-library/react-native";
import { z } from "zod";
import { useEntityForm } from "./useEntityForm";
import { handleError } from "../services/error-handler";

jest.mock("../services/error-handler", () => ({
  handleError: jest.fn(),
}));

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  count: z
    .number()
    .min(0, "Count must be non-negative")
    .nullish()
    .transform((value) => value ?? 0),
});
type TestData = z.infer<typeof testSchema>;
type TestFormValues = z.input<typeof testSchema>;

const renderEntityForm = (saveFn: jest.Mock) =>
  renderHook(() => {
    const entityForm = useEntityForm<TestData, TestFormValues>(testSchema, saveFn, {
      defaultValues: { name: "", count: null },
      entityName: "create firearm",
    });
    // Read errors during render so react-hook-form's formState proxy
    // subscribes to them (otherwise `errors` stays empty outside render).
    const errors = entityForm.form.formState.errors;
    return { ...entityForm, errors };
  });

describe("useEntityForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls saveFn with parsed data when the form is valid", async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderEntityForm(saveFn);

    act(() => {
      result.current.form.setValue("name", "Glock 19");
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() => {
      expect(saveFn).toHaveBeenCalledWith({ name: "Glock 19", count: 0 });
    });
    expect(handleError).not.toHaveBeenCalled();
  });

  it("blocks saveFn and exposes field errors when validation fails", async () => {
    const saveFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderEntityForm(saveFn);

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(saveFn).not.toHaveBeenCalled();
    expect(result.current.errors.name?.message).toBe("Name is required");
    expect(result.current.errors.count).toBeUndefined();
  });

  it("reports a user-facing error and clears isSaving when saveFn fails", async () => {
    const saveFn = jest.fn().mockRejectedValue(new Error("Save failed"));
    const { result } = renderEntityForm(saveFn);

    act(() => {
      result.current.form.setValue("name", "Glock 19");
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "create firearm.handleSubmit",
        expect.objectContaining({
          isUserFacing: true,
          userMessage: "Failed to create firearm. Please try again.",
        })
      );
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("toggles isSaving while the save is in flight", async () => {
    let resolveSave!: () => void;
    const saveFn = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { result } = renderEntityForm(saveFn);

    act(() => {
      result.current.form.setValue("name", "Glock 19");
      void result.current.onSubmit();
    });

    await waitFor(() => {
      expect(saveFn).toHaveBeenCalled();
      expect(result.current.isSaving).toBe(true);
    });

    await act(async () => {
      resolveSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
  });
});
