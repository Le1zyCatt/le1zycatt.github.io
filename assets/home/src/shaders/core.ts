export const coreVertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aRandom;

  uniform float uTime;
  uniform float uMorph;
  uniform float uPointScale;
  uniform float uEnergy;
  uniform vec3 uPointer;

  varying float vAlpha;
  varying float vRandom;

  void main() {
    float morph = smoothstep(0.0, 1.0, uMorph);
    vec3 p = mix(position, aTarget, morph);

    float drift = sin(uTime * (0.19 + aRandom * 0.13) + p.y * 1.7 + aRandom * 8.0);
    float crossDrift = cos(uTime * 0.16 + p.x * 1.35 + aRandom * 5.0);
    vec3 normalDirection = normalize(position + vec3(0.0001));
    p += normalDirection * drift * (0.035 + aRandom * 0.025) * (1.0 - morph * 0.55) * uEnergy;
    p.x += crossDrift * 0.018 * uEnergy;
    p.y += sin(uTime * 0.11 + aRandom * 12.0) * 0.014 * uEnergy;

    vec2 pointerPosition = uPointer.xy;
    vec2 delta = p.xy - pointerPosition;
    float pointerField = exp(-length(delta) * 0.95) * uPointer.z;
    p.xy += normalize(delta + vec2(0.0001)) * pointerField * 0.16 * (0.55 + aRandom * 0.45);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float perspective = clamp(5.8 / max(1.0, -mvPosition.z), 0.45, 2.4);
    gl_PointSize = uPointScale * (0.7 + aRandom * 1.55) * perspective;
    gl_Position = projectionMatrix * mvPosition;

    vRandom = aRandom;
    vAlpha = mix(0.52 + aRandom * 0.35, 0.34 + aRandom * 0.46, morph);
  }
`;

export const coreFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColorSecondary;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vRandom;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float softPoint = 1.0 - smoothstep(0.08, 0.5, radius);
    float core = 1.0 - smoothstep(0.0, 0.12, radius);
    vec3 color = mix(uColor, uColorSecondary, step(0.91, vRandom) * 0.28);
    color += core * 0.2;
    float alpha = softPoint * vAlpha * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;
