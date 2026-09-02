import { useCallback, useState } from "react";
import { Asset, launchImageLibrary } from "react-native-image-picker";

export type UseImagePickerOptions = {
  /** Number of images the user may select in one picker session. */
  selectionLimit?: number;
};

export type UseImagePickerReturn = {
  /**
   * Opens the image library (photos only) and resolves with the picked
   * assets, or an empty array when the user cancels or nothing is selected.
   */
  pickImages: () => Promise<Asset[]>;
  /** True while the picker is open. */
  isPicking: boolean;
};

/**
 * Wraps the callback-based launchImageLibrary API so the Add/Edit screens
 * share one implementation while keeping their individual selection
 * behaviour (single vs. multiple images) at the call site.
 */
export const useImagePicker = (
  options: UseImagePickerOptions = {}
): UseImagePickerReturn => {
  const [isPicking, setIsPicking] = useState(false);

  const pickImages = useCallback(
    () =>
      new Promise<Asset[]>((resolve) => {
        setIsPicking(true);
        launchImageLibrary(
          {
            mediaType: "photo",
            quality: 0.8,
            selectionLimit: options.selectionLimit,
          },
          (response) => {
            setIsPicking(false);
            resolve(response.assets ?? []);
          }
        );
      }),
    [options.selectionLimit]
  );

  return { pickImages, isPicking };
};
