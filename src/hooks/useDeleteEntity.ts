import { Alert } from "react-native";
import { useCallback } from "react";
import { handleError } from "../services/error-handler";

export type UseDeleteEntityOptions = {
  /**
   * Capitalized entity label used to derive the dialog copy, e.g. "Firearm".
   * Derives the confirm title `Delete ${label}` and the message
   * `Are you sure you want to delete this ${label.toLowerCase()}? This action
   * cannot be undone.` unless overridden below.
   */
  label: string;
  /** Override the confirm dialog title. */
  confirmTitle?: string;
  /** Override the confirm dialog message. */
  confirmMessage?: string;
  /** Context string passed to handleError, e.g. "FirearmDetails.handleDelete". */
  errorContext: string;
  /** User-facing message shown when deletion fails. */
  errorUserMessage: string;
  /**
   * Optionally map a thrown error to a specific user-facing message. When it
   * returns `undefined`, {@link errorUserMessage} is used instead.
   */
  resolveErrorMessage?: (error: unknown) => string | undefined;
};

/**
 * Shared delete-confirmation flow for detail screens.
 *
 * Shows a terminal-styled confirm Alert, runs `deleteFn` when the user
 * confirms, calls `onSuccess` afterwards, and routes failures through
 * handleError with a user-facing alert.
 */
export const useDeleteEntity = (
  deleteFn: () => Promise<void>,
  options: UseDeleteEntityOptions,
  onSuccess: () => void
): { confirmDelete: () => void } => {
  const {
    label,
    confirmTitle,
    confirmMessage,
    errorContext,
    errorUserMessage,
    resolveErrorMessage,
  } = options;

  const confirmDelete = useCallback(() => {
    Alert.alert(
      confirmTitle ?? `Delete ${label}`,
      confirmMessage ??
        `Are you sure you want to delete this ${label.toLowerCase()}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "default",
          onPress: async () => {
            try {
              await deleteFn();
              onSuccess();
            } catch (error) {
              handleError(error, errorContext, {
                isUserFacing: true,
                userMessage: resolveErrorMessage?.(error) ?? errorUserMessage,
              });
            }
          },
        },
      ]
    );
  }, [
    deleteFn,
    onSuccess,
    label,
    confirmTitle,
    confirmMessage,
    errorContext,
    errorUserMessage,
    resolveErrorMessage,
  ]);

  return { confirmDelete };
};
