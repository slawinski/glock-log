import { Canvas, Rect, Shader, Skia } from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Based on CRT-Royale Spec:
// 1. Scanline Effect (Pass 4)
// 2. Phosphor Mask Overlay (Pass 5 - Procedural approximation)
// Note: Bloom (Pass 1-3) requires background texture access which is restricted in this overlay mode.
// We focus on the physical CRT structure simulation (Mask + Scanlines).

const SKSL_SHADER = `
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scanlineDensity;
uniform float u_scanlineIntensity;
uniform float u_maskDensity;
uniform float u_maskIntensity;
uniform float u_noiseIntensity;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 main(vec2 fragCoord) {
    vec2 uv = fragCoord.xy / u_resolution.xy;

    // --- Pass 4: Scanline Effect ---
    // Spec: float scan = sin(uv.y * uScanlineFrequency * 3.14159);
    // Spec: c.rgb *= 1.0 - (scan * uScanlineIntensity);
    
    // We adjust for overlay logic (drawing black with alpha):
    // sin oscillates -1 to 1. We want lines.
    float scan = sin(uv.y * u_scanlineDensity * 3.14159 + u_time * 0.5); // Added slow roll
    float scanVal = (scan * 0.5 + 0.5); // 0 to 1
    float scanAlpha = scanVal * u_scanlineIntensity;

    // --- Pass 5: Phosphor Mask Overlay ---
    // Spec: half4 mask = sample(uMaskTexture, uv);
    // Procedural Aperture Grille (Vertical lines)
    float mask = sin(fragCoord.x * u_maskDensity * 3.14159);
    float maskVal = (mask * 0.5 + 0.5); // 0 to 1
    // Sharpen the mask to simulate RGB strips
    maskVal = smoothstep(0.2, 0.8, maskVal);
    float maskAlpha = (1.0 - maskVal) * u_maskIntensity;

    // --- Noise (Optional but good for CRT feel) ---
    float noise = rand(uv + vec2(u_time * 2.0)) * u_noiseIntensity;

    // Combine Alphas (Darkening the screen)
    // We assume the scanlines and mask block light (add to black opacity)
    float finalAlpha = scanAlpha + maskAlpha + noise;
    
    return vec4(0.0, 0.0, 0.0, clamp(finalAlpha, 0.0, 1.0));
}
`;

export const CRTOverlayShader = () => {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);

  // Configuration matching Spec concepts
  // uScanlineFrequency -> u_scanlineDensity
  // uScanlineIntensity -> u_scanlineIntensity
  const scanlineDensity = 200.0; // Higher for finer lines
  const scanlineIntensity = 0.15;
  const maskDensity = 1.0; // Per-pixel density for aperture grille
  const maskIntensity = 0.25;
  const noiseIntensity = 0.03;

  useEffect(() => {
    time.value = withRepeat(
      withTiming(1000, { duration: 100000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(time);
    };
  }, [time]);

  const uniforms = useDerivedValue(() => {
    return {
      u_resolution: [width, height],
      u_time: time.value,
      u_scanlineDensity: scanlineDensity,
      u_scanlineIntensity: scanlineIntensity,
      u_maskDensity: maskDensity,
      u_maskIntensity: maskIntensity,
      u_noiseIntensity: noiseIntensity,
    };
  }, [width, height]);

  const runtimeEffect = useMemo(() => {
    const effect = Skia.RuntimeEffect.Make(SKSL_SHADER);
    if (!effect) {
      console.error("Failed to compile shader");
      return null;
    }
    return effect;
  }, []);

  if (!runtimeEffect) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Rect x={0} y={0} width={width} height={height}>
          <Shader source={runtimeEffect} uniforms={uniforms} />
        </Rect>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});