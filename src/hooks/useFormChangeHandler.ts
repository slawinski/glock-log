import React, { useCallback } from "react";

// Generic type for form data
type FormData = Record<string, any>;

// Type for the field argument: either a key or a function for nested updates
type FieldUpdater<T extends FormData> = keyof T | ((prev: T) => T);

type HandleFormChange<T extends FormData> = {
  (field: keyof T, value: any): void;
  (field: (prev: T) => T): void;
};

export const useFormChangeHandler = <T extends FormData>(
  formData: T | null,
  setFormData: React.Dispatch<React.SetStateAction<T | null>>
) => {
  const handleFormChange: HandleFormChange<T> = useCallback(
    (field: FieldUpdater<T>, value?: any) => {
      if (formData) {
        setFormData((prev) => {
          if (!prev) return null; // Should not happen if formData is not null

          if (typeof field === "function") {
            return field(prev); // If field is a function, it handles the nested update
          } else {
            return { ...prev, [field]: value }; // Otherwise, update top-level field
          }
        });
      }
    },
    [formData, setFormData] // Dependencies for useCallback
  );

  return handleFormChange;
};
