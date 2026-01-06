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

const SKSL_SHADER = `
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scanlineDensity;
uniform float u_scanlineIntensity;
uniform float u_vignetteStrength;
uniform float u_noiseIntensity;
uniform float u_chromaticAberration;
uniform float u_flickerIntensity;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 main(vec2 fragCoord) {
    vec2 uv = fragCoord.xy / u_resolution.xy;

    // Vignette
    float dist = distance(uv, vec2(0.5));
    float vignette = smoothstep(0.4, 0.8, dist) * u_vignetteStrength;

    // Scanline
    // Generate horizontal scanlines
    float scanline = sin(uv.y * u_scanlineDensity * 3.14159 + u_time * 5.0) * 0.5 + 0.5;
    float alphaScan = scanline * u_scanlineIntensity;

    // Noise
    // Fix: Add time as a vector to avoid vec2 + float error
    float noise = rand(uv + vec2(u_time * 1.0)) * u_noiseIntensity;

    // Flicker
    float flicker = sin(u_time * 10.0) * 0.05 * u_flickerIntensity;

    // Combine Alpha
    // We want a dark overlay, so we sum up the "darkening" factors.
    // Scanlines, Vignette, Noise (as dark grain), and Flicker all contribute to opacity of black.
    float finalAlpha = alphaScan + vignette + noise + flicker;
    
    // Clamp
    finalAlpha = clamp(finalAlpha, 0.0, 1.0);
    
    return vec4(0.0, 0.0, 0.0, finalAlpha);
}
`;

export const CRTOverlayShader = () => {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);

  // Uniforms configuration - adjustable for look and feel
  const scanlineDensity = 150.0;
  const scanlineIntensity = 0.2;
  const vignetteStrength = 0.5;
  const noiseIntensity = 0.05;
  const chromaticAberration = 0.005; // Placeholder for future color effects
  const flickerIntensity = 0.3;

  useEffect(() => {
    // Animate time indefinitely
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
      u_vignetteStrength: vignetteStrength,
      u_noiseIntensity: noiseIntensity,
      u_chromaticAberration: chromaticAberration,
      u_flickerIntensity: flickerIntensity,
    };
  }, [width, height]);

  // Compile shader once
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
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  canvas: {
    flex: 1,
  },
});