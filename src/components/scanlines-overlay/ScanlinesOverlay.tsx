import { FC } from "react";
import { View } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

export const ScanlinesOverlay: FC = () => {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern
            id="scanlines"
            patternUnits="userSpaceOnUse"
            width="1"
            height="3"
          >
            <Rect
              x="0"
              y="0"
              width="1"
              height="1"
              fill="rgba(0, 255, 0, 0.1)"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scanlines)" />
      </Svg>
    </View>
  );
};
