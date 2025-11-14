import { View } from "react-native";
import Svg, {
  Defs,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { styles } from "./styles";

export const ScanlinesOverlay = () => {
  return (
    <View style={styles.overlay} testID="scanlines-overlay">
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
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="50%" ry="70%">
            <Stop offset="50%" stopColor="#000" stopOpacity="0" />
            <Stop offset="100%" stopColor="#000" stopOpacity="0.4" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scanlines)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
      </Svg>
    </View>
  );
};
