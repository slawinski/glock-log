import { useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * Blocks back navigation while a form has unsaved changes, showing a confirm
 * dialog that lets the user keep editing or discard their changes.
 *
 * Reads dirtiness from a mutable ref so the leave-gate always sees the
 * current value synchronously (react-hook-form's `isDirty` updates after a
 * re-render, but navigation can fire in the same tick as `reset`).
 */
export const useUnsavedChanges = (dirtyRef: { current: boolean }): void => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (!dirtyRef.current) {
        return;
      }

      event.preventDefault();

      Alert.alert("Discard changes?", "Your changes haven't been saved.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "default",
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, dirtyRef]);
};
