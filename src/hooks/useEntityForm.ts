import { useCallback, useState } from "react";
import {
  DefaultValues,
  FieldValues,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType, ZodTypeDef } from "zod";
import { handleError } from "../services/error-handler";

export type UseEntityFormOptions<TFormValues extends FieldValues> = {
  defaultValues: DefaultValues<TFormValues>;
  /**
   * Human-readable action phrase used to build the user-facing error
   * message, e.g. "create firearm" -> "Failed to create firearm. Please try
   * again."
   */
  entityName?: string;
};

export type UseEntityFormReturn<
  TFormValues extends FieldValues,
  TFormData extends FieldValues = TFormValues
> = {
  form: UseFormReturn<TFormValues, unknown, TFormData>;
  isSaving: boolean;
  onSubmit: () => Promise<void>;
};

// zodResolver expects the zod v3 shape `{ _output; _input; _def: { typeName } }`.
// The base ZodTypeDef in zod v3 does not declare `typeName`, so refine the
// parameter type to match what real zod schemas provide.
type EntitySchema<TFormData extends FieldValues, TFormValues extends FieldValues> =
  ZodType<TFormData, ZodTypeDef, TFormValues> & {
    _def: { typeName: string };
  };

/**
 * Shared entity form flow for the Add/Edit screens.
 *
 * Wraps react-hook-form with a zodResolver: validation runs through the
 * resolver, `saveFn` is only invoked with validated (parsed/transformed)
 * data, `isSaving` tracks the async save, and storage failures surface a
 * single user-facing alert.
 */
export const useEntityForm = <
  TFormData extends FieldValues,
  TFormValues extends FieldValues = TFormData
>(
  schema: EntitySchema<TFormData, TFormValues>,
  saveFn: (data: TFormData) => Promise<void>,
  options: UseEntityFormOptions<TFormValues>
): UseEntityFormReturn<TFormValues, TFormData> => {
  const [isSaving, setIsSaving] = useState(false);
  const entityName = options.entityName ?? "data";

  // TContext is `unknown`: this hook never passes a form context to
  // react-hook-form, so callers cannot (and should not) rely on one.
  const form = useForm<TFormValues, unknown, TFormData>({
    resolver: zodResolver(schema),
    defaultValues: options.defaultValues,
  });

  const { handleSubmit } = form;

  const onSubmit = useCallback(() => {
    const handleValid: SubmitHandler<TFormData> = async (data) => {
      setIsSaving(true);
      try {
        await saveFn(data);
      } catch (error) {
        handleError(error, `${entityName}.handleSubmit`, {
          isUserFacing: true,
          userMessage: `Failed to ${entityName}. Please try again.`,
        });
      } finally {
        setIsSaving(false);
      }
    };

    return handleSubmit(handleValid)().catch(() => undefined);
  }, [handleSubmit, saveFn, entityName]);

  return { form, isSaving, onSubmit };
};
