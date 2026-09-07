import { Pressable, View } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type Props<T extends string> = {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  testIDPrefix?: string;
};

/**
 * Large radio-style choice control. Used for mutually-exclusive, materially
 * different options (cleaning type, part baseline, replacement reason) where a
 * tiny dropdown would hide the business effect of the choice.
 */
export const ChoiceGroup = <T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testIDPrefix = "choice-",
}: Props<T>) => (
  <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          className={`border-2 p-3 mb-2 ${
            selected ? "border-terminal-green" : "border-terminal-border/40"
          }`}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ selected }}
          testID={`${testIDPrefix}${option.value}`}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <View className="flex-row items-start">
            <TerminalText className="mr-2">
              {selected ? "●" : "○"}
            </TerminalText>
            <View className="flex-1">
              <TerminalText>{option.label}</TerminalText>
              {option.description ? (
                <TerminalText className="text-terminal-muted text-sm mt-0.5">
                  {option.description}
                </TerminalText>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    })}
  </View>
);
