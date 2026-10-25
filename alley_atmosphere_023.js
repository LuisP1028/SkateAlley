import * as THREE from 'three';

// ============================================================================
// Pillar 1: Running Mode Speed Effects & Cyber-Techno Binary Trail (Spec 023 §3)
// ============================================================================

export const BINARY_TRAIL_PALETTE = Object.freeze({
  burntAmberStr: '#92400e',
  burntAmberHex: 0x92400e,
  darkAmberStr: '#b45309',
  darkAmberHex: 0xb45309,
  richAmberStr: '#d97706',
  richAmberHex: 0xd97706,
  warmCyberAmberStr: '#f59e0b',
  warmCyberAmberHex: 0xf59e0b,
  incandescentGoldStr: '#fbbf24',
  incandescentGoldHex: 0xfbbf24,
  allowedHexColors: Object.freeze(['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24']),
  allowedGlyphs: Object.freeze(['0', '1']),
});

export const RUNNING_EFFECTS_SPEC = Object.freeze({
  freeRoamRunThresholdMpS: 1.815, // WALK_SPEED (1.65) * 1.1
  scrollRunThresholdMpS: 2.55,    // SCROLL_RUN_THRESHOLD
  nominalRunSpeedMpS: 4.50,       // RUN_SPEED
  rampUpDurationSec: 0.16,        // within [0.12s, 0.22s]
  decayDurationSec: 0.16,         // smooth sub-second decay to 0.0
  speedStreakCount: 28,
  streakLengthMin: 0.65,
  streakLengthMax: 1.60,
  streakWidthMin: 0.004,
  streakWidthMax: 0.012,
  streakRadialClearanceMin: 0.30, // >= 0.28m spine centerline clearance
  streakRadialClearanceMax: 1.25,
  streakRelativeSpeedMin: 8.0,
  streakRelativeSpeedMax: 18.0,
  streakOpacityMin: 0.22,
  streakOpacityMax: 0.58,
  maxBinaryGlyphPool: 72,
  spawnRatePerSec: 68.0,
  spawnLongitudinalMin: 0.18,
  spawnLongitudinalMax: 0.55,
  spawnVerticalRelMin: 0.22,
  spawnVerticalRelMax: 1.98,
  spawnLateralHalfSpan: 0.48,
  wakeBackwardDriftMin: 0.35,
  wakeBackwardDriftMax: 0.90,
  wakeUpwardBuoyancyMin: 0.12,
  wakeUpwardBuoyancyMax: 0.28,
  glyphLifeMinSec: 0.45,
  glyphLifeMaxSec: 0.95,
  bitFlipFreqMinHz: 6.0,
  bitFlipFreqMaxHz: 14.0,
});

export function evaluateRunningModeIntensity({
  charState,
  planarSpeed,
  mode,
  prevIntensity = 0.0,
  dt = 1 / 60,
}) {
  const threshold = mode === 'scroll' ? 2.55 : 1.815;
  const isRunning =
    charState === 'Run' && mode !== 'mount-focus' && planarSpeed >= threshold - 0.05;

  let s = 0.0;
  let nextIntensity = 0.0;

  if (isRunning) {
    s = Math.max(0.0, Math.min(1.0, (planarSpeed - threshold) / (4.50 - threshold)));
    const targetIntensity = Math.max(0.35, Math.min(1.0, 0.35 + 0.65 * s));
    nextIntensity = Math.min(
      1.0,
      Math.max(0.28, prevIntensity + (dt / 0.16) * Math.max(0.45, targetIntensity))
    );
  } else {
    s = 0.0;
    nextIntensity = Math.max(0.0, prevIntensity - dt / 0.16);
    if (nextIntensity < 0.005) {
      nextIntensity = 0.0;
    }
  }

  return {
    active: isRunning,
    intensity: Number(nextIntensity.toFixed(4)),
    speedRatio: isRunning ? Number(s.toFixed(4)) : 0.0,
    streakLength: Number((0.65 + (1.60 - 0.65) * (isRunning ? s : 0.0)).toFixed(4)),
    streakSpeed: Number((8.0 + (18.0 - 8.0) * (isRunning ? s : 0.0)).toFixed(4)),
    streakMaxOpacity: Number(
      ((0.22 + (0.58 - 0.22) * (isRunning ? s : 0.0)) * nextIntensity).toFixed(4)
    ),
  };
}

export function evaluateBinaryGlyphLifecycleAlpha(normAge) {
  if (normAge < 0.0 || normAge > 1.0) return 0.0;
  if (normAge < 0.15) {
    return Math.max(0.0, Math.min(1.0, normAge / 0.15));
  }
  if (normAge <= 0.55) {
    return 1.0;
  }
  const u = (normAge - 0.55) / 0.45;
  const alpha = Math.exp(-5.5 * u) * (1.0 - u);
  return Math.max(0.0, Math.min(1.0, alpha));
}

export function buildRunningEffectsSubsystem({
  rootGroup,
  floorY = 0.0,
  uTimeUniform,
  applyStencilReject,
}) {
  const spec = RUNNING_EFFECTS_SPEC;
  const palette = BINARY_TRAIL_PALETTE;

  // 1. Kinetic Speed Streaks Mesh (Annular slipstream cylinder around character)
  const streakCount = spec.speedStreakCount;
  const streakGeom = new THREE.BufferGeometry();
  const streakPositions = new Float32Array(streakCount * 4 * 3);
  const streakUvs = new Float32Array(streakCount * 4 * 2);
  const streakIndices = new Uint16Array(streakCount * 6);

  for (let i = 0; i < streakCount; i++) {
    const vOffset = i * 4;
    const iOffset = i * 6;
    streakIndices[iOffset + 0] = vOffset + 0;
    streakIndices[iOffset + 1] = vOffset + 1;
    streakIndices[iOffset + 2] = vOffset + 2;
    streakIndices[iOffset + 3] = vOffset + 0;
    streakIndices[iOffset + 4] = vOffset + 2;
    streakIndices[iOffset + 5] = vOffset + 3;

    streakUvs[vOffset * 2 + 0] = 0.0;
    streakUvs[vOffset * 2 + 1] = 0.0;
    streakUvs[(vOffset + 1) * 2 + 0] = 1.0;
    streakUvs[(vOffset + 1) * 2 + 1] = 0.0;
    streakUvs[(vOffset + 2) * 2 + 0] = 1.0;
    streakUvs[(vOffset + 2) * 2 + 1] = 1.0;
    streakUvs[(vOffset + 3) * 2 + 0] = 0.0;
    streakUvs[(vOffset + 3) * 2 + 1] = 1.0;
  }

  streakGeom.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
  streakGeom.setAttribute('uv', new THREE.BufferAttribute(streakUvs, 2));
  streakGeom.setIndex(new THREE.BufferAttribute(streakIndices, 1));

  const streakMat = new THREE.ShaderMaterial({
    name: 'RunningSpeedStreakMaterial',
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
      uIntensity: { value: 0.0 },
      uMaxOpacity: { value: 0.45 },
      uCoreColor: { value: new THREE.Color(0xfbbf24) },
      uAuraColor: { value: new THREE.Color(0xb45309) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      uniform float uMaxOpacity;
      uniform vec3 uCoreColor;
      uniform vec3 uAuraColor;
      varying vec2 vUv;
      void main() {
        if (uIntensity <= 0.001) discard;
        float tipFade = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);
        float edgeFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float alpha = tipFade * edgeFade * uMaxOpacity * uIntensity;
        if (alpha < 0.005) discard;
        vec3 col = mix(uAuraColor, uCoreColor, pow(edgeFade, 2.0));
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  if (applyStencilReject) applyStencilReject(streakMat);

  const speedStreaksMesh = new THREE.Mesh(streakGeom, streakMat);
  speedStreaksMesh.name = 'RunningSpeedStreaksMesh';
  speedStreaksMesh.frustumCulled = false;
  speedStreaksMesh.renderOrder = 11;
  speedStreaksMesh.raycast = () => {};
  speedStreaksMesh.visible = false;
  rootGroup.add(speedStreaksMesh);

  // Pre-configured annular streak seeds around runner
  const streakSeeds = [];
  for (let i = 0; i < streakCount; i++) {
    const angle = (i / streakCount) * Math.PI * 2 + (i % 3) * 0.45;
    const radius = 0.32 + ((i * 17) % 100) / 100 * (1.20 - 0.32);
    streakSeeds.push({
      angle,
      radialDist: radius,
      relY: 0.35 + ((i * 23) % 100) / 100 * 1.50,
      phase: (i * 0.37) % 1.0,
      width: 0.005 + ((i * 13) % 100) / 100 * 0.006,
    });
  }

  // 2. Binary Trail Mesh (72 Quads in world wake)
  const maxGlyphs = spec.maxBinaryGlyphPool;
  const glyphGeom = new THREE.BufferGeometry();
  const glyphPositions = new Float32Array(maxGlyphs * 4 * 3);
  const glyphUvs = new Float32Array(maxGlyphs * 4 * 2);
  const glyphAlphas = new Float32Array(maxGlyphs * 4);
  const glyphBitValues = new Float32Array(maxGlyphs * 4);
  const glyphColors = new Float32Array(maxGlyphs * 4 * 3);
  const glyphIndices = new Uint16Array(maxGlyphs * 6);

  for (let i = 0; i < maxGlyphs; i++) {
    const vOffset = i * 4;
    const iOffset = i * 6;
    glyphIndices[iOffset + 0] = vOffset + 0;
    glyphIndices[iOffset + 1] = vOffset + 1;
    glyphIndices[iOffset + 2] = vOffset + 2;
    glyphIndices[iOffset + 3] = vOffset + 0;
    glyphIndices[iOffset + 4] = vOffset + 2;
    glyphIndices[iOffset + 5] = vOffset + 3;

    glyphUvs[vOffset * 2 + 0] = 0.0;
    glyphUvs[vOffset * 2 + 1] = 0.0;
    glyphUvs[(vOffset + 1) * 2 + 0] = 1.0;
    glyphUvs[(vOffset + 1) * 2 + 1] = 0.0;
    glyphUvs[(vOffset + 2) * 2 + 0] = 1.0;
    glyphUvs[(vOffset + 2) * 2 + 1] = 1.0;
    glyphUvs[(vOffset + 3) * 2 + 0] = 0.0;
    glyphUvs[(vOffset + 3) * 2 + 1] = 1.0;
  }

  glyphGeom.setAttribute('position', new THREE.BufferAttribute(glyphPositions, 3));
  glyphGeom.setAttribute('uv', new THREE.BufferAttribute(glyphUvs, 2));
  glyphGeom.setAttribute('aAlpha', new THREE.BufferAttribute(glyphAlphas, 1));
  glyphGeom.setAttribute('aBitValue', new THREE.BufferAttribute(glyphBitValues, 1));
  glyphGeom.setAttribute('aColor', new THREE.BufferAttribute(glyphColors, 3));
  glyphGeom.setIndex(new THREE.BufferAttribute(glyphIndices, 1));

  const glyphMat = new THREE.ShaderMaterial({
    name: 'RunningBinaryGlyphMaterial',
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
    },
    vertexShader: `
      attribute float aAlpha;
      attribute float aBitValue;
      attribute vec3 aColor;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vBitValue;
      varying vec3 vColor;
      void main() {
        vUv = uv;
        vAlpha = aAlpha;
        vBitValue = aBitValue;
        vColor = aColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vBitValue;
      varying vec3 vColor;

      float drawBinaryDigit(vec2 p, float isOne) {
        vec2 uv = p;
        if (isOne > 0.5) {
          // Monospace digital '1'
          float stem = step(0.42, uv.x) * step(uv.x, 0.58) * step(0.12, uv.y) * step(uv.y, 0.88);
          float serif = step(0.28, uv.x) * step(uv.x, 0.44) * step(0.74, uv.y) * step(uv.y, 0.88);
          float base = step(0.30, uv.x) * step(uv.x, 0.70) * step(0.12, uv.y) * step(uv.y, 0.22);
          return clamp(stem + serif + base, 0.0, 1.0);
        } else {
          // Monospace digital '0' with interior cutout and digital slash
          float outerBox = step(0.26, uv.x) * step(uv.x, 0.74) * step(0.12, uv.y) * step(uv.y, 0.88);
          float innerHole = step(0.38, uv.x) * step(uv.x, 0.62) * step(0.24, uv.y) * step(uv.y, 0.76);
          float outer = outerBox - innerHole;
          float slash = step(abs((uv.x - 0.26) / 0.48 - (uv.y - 0.12) / 0.76), 0.08) * innerHole;
          return clamp(outer + slash, 0.0, 1.0);
        }
      }

      void main() {
        if (vAlpha <= 0.005) discard;
        float digit = drawBinaryDigit(vUv, vBitValue);
        if (digit < 0.1) discard;
        float scanline = 0.82 + 0.18 * sin(vUv.y * 56.0 - uTime * 18.0);
        vec3 col = vColor * scanline;
        gl_FragColor = vec4(col, vAlpha * digit);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  if (applyStencilReject) applyStencilReject(glyphMat);

  const binaryTrailMesh = new THREE.Mesh(glyphGeom, glyphMat);
  binaryTrailMesh.name = 'RunningBinaryTrailMesh';
  binaryTrailMesh.frustumCulled = false;
  binaryTrailMesh.renderOrder = 12;
  binaryTrailMesh.raycast = () => {};
  binaryTrailMesh.visible = false;
  rootGroup.add(binaryTrailMesh);

  // Internal state tracking
  const glyphPool = [];
  for (let i = 0; i < maxGlyphs; i++) {
    glyphPool.push({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      ageSec: 0,
      lifeSec: 0.75,
      char: '0',
      initialBit: i % 2,
      flipFreqHz: 8.0,
      colorHex: palette.darkAmberStr,
      colorRgb: new THREE.Color(palette.darkAmberHex),
      size: 0.14,
    });
  }

  let spawnAccumulator = 0.0;
  let activeGlyphCount = 0;
  let activeStreakCount = 0;
  let currentIntensity = 0.0;
  let currentSpeedRatio = 0.0;
  let isCurrentlyActive = false;

  function spawnGlyph(pos, backDir, isCompanion = false) {
    let slot = glyphPool.find((g) => !g.active);
    if (!slot) {
      let maxAge = -1;
      let oldestIdx = 0;
      for (let i = 0; i < glyphPool.length; i++) {
        if (glyphPool[i].ageSec > maxAge) {
          maxAge = glyphPool[i].ageSec;
          oldestIdx = i;
        }
      }
      slot = glyphPool[oldestIdx];
    }

    const rnd = Math.random;
    const longDist = 0.20 + rnd() * 0.30; // [0.20m, 0.50m] inside [0.18m, 0.55m]
    const lateralDist = (rnd() - 0.5) * 2.0 * spec.spawnLateralHalfSpan;
    const relY = isCompanion
      ? 1.55 + rnd() * 0.40
      : spec.spawnVerticalRelMin + rnd() * (spec.spawnVerticalRelMax - spec.spawnVerticalRelMin);

    const perpX = -backDir.z;
    const perpZ = backDir.x;

    slot.active = true;
    slot.x = pos.x + backDir.x * longDist + perpX * lateralDist;
    slot.y = pos.y + relY;
    slot.z = pos.z + backDir.z * longDist + perpZ * lateralDist;

    const driftSpeed = spec.wakeBackwardDriftMin + rnd() * (spec.wakeBackwardDriftMax - spec.wakeBackwardDriftMin);
    const buoyancy = spec.wakeUpwardBuoyancyMin + rnd() * (spec.wakeUpwardBuoyancyMax - spec.wakeUpwardBuoyancyMin);
    slot.vx = backDir.x * driftSpeed + (rnd() - 0.5) * 0.08;
    slot.vy = buoyancy;
    slot.vz = backDir.z * driftSpeed + (rnd() - 0.5) * 0.08;

    slot.ageSec = 0.0;
    slot.lifeSec = spec.glyphLifeMinSec + rnd() * (spec.glyphLifeMaxSec - spec.glyphLifeMinSec);
    slot.initialBit = rnd() > 0.5 ? 1 : 0;
    slot.flipFreqHz = spec.bitFlipFreqMinHz + rnd() * (spec.bitFlipFreqMaxHz - spec.bitFlipFreqMinHz);
    slot.char = slot.initialBit === 1 ? '1' : '0';

    const colorIdx = Math.floor(rnd() * palette.allowedHexColors.length);
    slot.colorHex = palette.allowedHexColors[colorIdx];
    slot.colorRgb.set(slot.colorHex);
    slot.size = 0.12 + rnd() * 0.06;
  }

  function quiesceImmediately() {
    isCurrentlyActive = false;
    currentIntensity = 0.0;
    currentSpeedRatio = 0.0;
    activeGlyphCount = 0;
    activeStreakCount = 0;
    for (let i = 0; i < glyphPool.length; i++) {
      glyphPool[i].active = false;
      glyphAlphas[i * 4 + 0] = 0.0;
      glyphAlphas[i * 4 + 1] = 0.0;
      glyphAlphas[i * 4 + 2] = 0.0;
      glyphAlphas[i * 4 + 3] = 0.0;
    }
    glyphGeom.attributes.aAlpha.needsUpdate = true;
    streakMat.uniforms.uIntensity.value = 0.0;
    speedStreaksMesh.visible = false;
    binaryTrailMesh.visible = false;
  }

  function update(dt, timeSec, activeChar, mode) {
    if (!activeChar) return;
    const vel = activeChar.velocity || { x: 0, z: 0 };
    const planarSpeed = Math.hypot(vel.x, vel.z);

    const evalResult = evaluateRunningModeIntensity({
      charState: activeChar.state,
      planarSpeed,
      mode,
      prevIntensity: currentIntensity,
      dt,
    });

    isCurrentlyActive = evalResult.active;
    currentIntensity = evalResult.intensity;
    currentSpeedRatio = evalResult.speedRatio;

    let speedHeadingX = vel.x;
    let speedHeadingZ = vel.z;
    if (planarSpeed < 0.1) {
      const yaw = activeChar.yaw || 0.0;
      speedHeadingX = -Math.sin(yaw);
      speedHeadingZ = -Math.cos(yaw);
    } else {
      speedHeadingX /= planarSpeed;
      speedHeadingZ /= planarSpeed;
    }

    const backDir = {
      x: -speedHeadingX,
      z: -speedHeadingZ,
    };

    // 1. Update Speed Streaks
    if (currentIntensity > 0.001) {
      speedStreaksMesh.visible = true;
      streakMat.uniforms.uIntensity.value = currentIntensity;
      streakMat.uniforms.uMaxOpacity.value = evalResult.streakMaxOpacity;
      activeStreakCount = spec.speedStreakCount;

      const charPos = activeChar.position;
      const sLen = evalResult.streakLength;
      const streakPositionsAttr = streakGeom.attributes.position;
      const sArr = streakPositionsAttr.array;

      for (let i = 0; i < streakCount; i++) {
        const seed = streakSeeds[i];
        const rad = seed.radialDist;
        const streakAngle = seed.angle;
        const lateralX = -backDir.z * Math.cos(streakAngle) * rad;
        const lateralZ = backDir.x * Math.cos(streakAngle) * rad;
        const baseY = charPos.y + seed.relY + Math.sin(streakAngle) * rad * 0.45;

        const travel = ((timeSec * evalResult.streakSpeed * 0.4 + seed.phase) % 1.0) * 2.8 - 0.8;
        const headX = charPos.x + backDir.x * travel + lateralX;
        const headZ = charPos.z + backDir.z * travel + lateralZ;
        const tailX = headX + backDir.x * sLen;
        const tailZ = headZ + backDir.z * sLen;

        const hw = seed.width * 0.5;
        const px = -backDir.z * hw;
        const pz = backDir.x * hw;

        const vBase = i * 12;
        sArr[vBase + 0] = headX - px;
        sArr[vBase + 1] = baseY;
        sArr[vBase + 2] = headZ - pz;
        sArr[vBase + 3] = headX + px;
        sArr[vBase + 4] = baseY;
        sArr[vBase + 5] = headZ + pz;
        sArr[vBase + 6] = tailX + px;
        sArr[vBase + 7] = baseY;
        sArr[vBase + 8] = tailZ + pz;
        sArr[vBase + 9] = tailX - px;
        sArr[vBase + 10] = baseY;
        sArr[vBase + 11] = tailZ - pz;
      }
      streakPositionsAttr.needsUpdate = true;
    } else {
      activeStreakCount = 0;
      speedStreaksMesh.visible = false;
      streakMat.uniforms.uIntensity.value = 0.0;
    }

    // 2. Spawn New Binary Glyphs when running
    if (isCurrentlyActive && currentIntensity > 0.05) {
      spawnAccumulator += dt * spec.spawnRatePerSec * currentIntensity;
      const spawnCount = Math.floor(spawnAccumulator);
      if (spawnCount > 0) {
        spawnAccumulator -= spawnCount;
        const toSpawn = Math.min(spawnCount, 16);
        for (let s = 0; s < toSpawn; s++) {
          spawnGlyph(activeChar.position, backDir, false);
          if (activeChar.id === 'hoodie' && Math.random() > 0.55) {
            spawnGlyph(activeChar.position, backDir, true);
          }
        }
      }
    }

    // Guarantee immediate burst of glyphs on first frame of Run
    if (isCurrentlyActive && activeGlyphCount < 12) {
      for (let s = activeGlyphCount; s < 14; s++) {
        spawnGlyph(activeChar.position, backDir, s % 3 === 0);
      }
    }

    // 3. Update Existing Glyphs
    const posAttr = glyphGeom.attributes.position;
    const alphaAttr = glyphGeom.attributes.aAlpha;
    const bitAttr = glyphGeom.attributes.aBitValue;
    const colAttr = glyphGeom.attributes.aColor;
    const pArr = posAttr.array;
    const aArr = alphaAttr.array;
    const bArr = bitAttr.array;
    const cArr = colAttr.array;

    let livingCount = 0;

    for (let i = 0; i < maxGlyphs; i++) {
      const g = glyphPool[i];
      const vOffset = i * 4;

      if (!g.active || (!isCurrentlyActive && currentIntensity <= 0.001)) {
        g.active = false;
        aArr[vOffset + 0] = 0.0;
        aArr[vOffset + 1] = 0.0;
        aArr[vOffset + 2] = 0.0;
        aArr[vOffset + 3] = 0.0;
        continue;
      }

      g.ageSec += dt;
      if (g.ageSec >= g.lifeSec) {
        g.active = false;
        aArr[vOffset + 0] = 0.0;
        aArr[vOffset + 1] = 0.0;
        aArr[vOffset + 2] = 0.0;
        aArr[vOffset + 3] = 0.0;
        continue;
      }

      livingCount++;

      // Kinematic drift
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;

      // Bit flip
      const currentBit = Math.floor(g.ageSec * g.flipFreqHz + g.initialBit) % 2 === 0 ? 0 : 1;
      g.char = currentBit === 1 ? '1' : '0';

      const normAge = g.ageSec / g.lifeSec;
      const alpha = evaluateBinaryGlyphLifecycleAlpha(normAge) * Math.min(1.0, currentIntensity * 1.25);

      const hs = g.size * 0.5;
      const pIdx = vOffset * 3;
      pArr[pIdx + 0] = g.x - hs;
      pArr[pIdx + 1] = g.y - hs;
      pArr[pIdx + 2] = g.z;

      pArr[pIdx + 3] = g.x + hs;
      pArr[pIdx + 4] = g.y - hs;
      pArr[pIdx + 5] = g.z;

      pArr[pIdx + 6] = g.x + hs;
      pArr[pIdx + 7] = g.y + hs;
      pArr[pIdx + 8] = g.z;

      pArr[pIdx + 9] = g.x - hs;
      pArr[pIdx + 10] = g.y + hs;
      pArr[pIdx + 11] = g.z;

      for (let j = 0; j < 4; j++) {
        aArr[vOffset + j] = alpha;
        bArr[vOffset + j] = currentBit;
        cArr[(vOffset + j) * 3 + 0] = g.colorRgb.r;
        cArr[(vOffset + j) * 3 + 1] = g.colorRgb.g;
        cArr[(vOffset + j) * 3 + 2] = g.colorRgb.b;
      }
    }

    activeGlyphCount = livingCount;
    binaryTrailMesh.visible = activeGlyphCount > 0;

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    bitAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  function getState() {
    return {
      active: isCurrentlyActive,
      intensity: Number(currentIntensity.toFixed(4)),
      speedRatio: Number(currentSpeedRatio.toFixed(4)),
      activeBinaryGlyphCount: activeGlyphCount,
      activeSpeedStreakCount: activeStreakCount,
      palette,
      spec,
    };
  }

  return {
    get active() {
      return isCurrentlyActive;
    },
    get intensity() {
      return currentIntensity;
    },
    get speedRatio() {
      return currentSpeedRatio;
    },
    get activeBinaryGlyphCount() {
      return activeGlyphCount;
    },
    get activeSpeedStreakCount() {
      return activeStreakCount;
    },
    palette,
    spec,
    glyphs: glyphPool,
    streaks: streakSeeds,
    speedStreaksMesh,
    binaryTrailMesh,
    update,
    quiesceImmediately,
    getState,
  };
}

// ============================================================================
// Pillar 2: Unified Holographic Effect Parity on SCREEN_MOUNT (Spec 023 §4)
// ============================================================================

export const HOLO_SCREEN_GLITCH_FLICKER_SPEC = Object.freeze({
  carrierHumFreqHzMin: 6.0,
  carrierHumFreqHzMax: 19.0,
  carrierHumAmpMin: 0.04,
  carrierHumAmpMax: 0.09,
  sputterPeriodMinSec: 2.2,
  sputterPeriodMaxSec: 5.5,
  sputterDurationMinSec: 0.04,
  sputterDurationMaxSec: 0.14,
  dropoutMultMin: 0.55,
  dropoutMultMax: 0.72,
  surgeMultMin: 1.15,
  surgeMultMax: 1.28,
  glitchShearMin: 0.008,
  glitchShearMax: 0.035,
  glitchDurationSec: 0.18,
  scanbeamPeriodSec: 4.0,
  diffusedGlowMin: 0.14,
  diffusedGlowMax: 0.30,
});

export function evaluateHologramScreenFlickerAndGlitch(
  timeSec,
  stationIndex = 1,
  interactiveBoost = 0.0
) {
  const idx = Number(stationIndex) || 1;
  const phase = idx * 1.6180339;
  const t = (Number(timeSec) || 0.0) + phase;

  // 1. Baseline phosphor hum
  const carrierHum =
    1.0 +
    0.045 * Math.sin(t * 2.0 * Math.PI * 7.5) +
    0.032 * Math.cos(t * 2.0 * Math.PI * 14.2 + idx);

  // 2. Intermittent micro-dropouts and surges
  const P_sputter = 2.6 + (idx % 3) * 0.85;
  const u_cycle = ((t % P_sputter) + P_sputter) % P_sputter;
  let sputterMult = 1.0;
  if (u_cycle >= 0.10 && u_cycle <= 0.19) {
    const cycleIdx = Math.floor(t / P_sputter);
    sputterMult = cycleIdx % 2 === 0 ? 0.62 : 1.21;
  }
  const flickerGain = Math.max(0.55, Math.min(1.28, carrierHum * sputterMult));

  // 3. Periodic and interactive glitch tear bands
  const P_glitch = 2.8 + (idx % 2) * 0.9;
  const u_glitch = ((t % P_glitch) + P_glitch) % P_glitch;
  const periodicGlitch = u_glitch <= 0.14 ? 1.0 - u_glitch / 0.14 : 0.0;
  const glitchIntensity = Math.max(0.0, Math.min(1.0, Math.max(periodicGlitch, interactiveBoost)));

  // 4. Horizontal tear shear
  const shearMag = 0.008 + (0.035 - 0.008) * glitchIntensity;
  const tearOffsetUvX = shearMag * (Math.sin(t * 43.0 + idx) > 0 ? 1 : -1);

  // 5. Sweeping scanbeam
  const scanbeamY = 1.0 - (((t / 4.0) % 1.0 + 1.0) % 1.0);

  // 6. Restrained non-conical slight diffusive glow intensity coupled with flicker
  const diffusedGlowIntensity = Number(
    Math.max(0.14, Math.min(0.30, 0.22 * flickerGain + 0.03 * glitchIntensity)).toFixed(4)
  );

  return {
    flickerGain: Number(flickerGain.toFixed(4)),
    glitchIntensity: Number(glitchIntensity.toFixed(4)),
    tearOffsetUvX: Number(tearOffsetUvX.toFixed(4)),
    scanbeamY: Number(scanbeamY.toFixed(4)),
    diffusedGlowIntensity,
    isFlickering: true,
    hasGlitchEffect: true,
    isConical: false,
  };
}

export function createScreenMountHolographicMaterial(
  station,
  screenTexture,
  uTimeUniform,
  applyStencilReject
) {
  const opacityUniform = { value: 0.32 };
  const mat = new THREE.ShaderMaterial({
    name: `${station.mountName}_HoloDisplayShaderMat`,
    uniforms: {
      uMap: { value: screenTexture },
      uTime: uTimeUniform || { value: 0.0 },
      uStationIndex: { value: station.index },
      uOpacity: opacityUniform,
      uGlassOpacity: opacityUniform,
      uFlickerGain: { value: 1.0 },
      uGlitchIntensity: { value: 0.0 },
      uTearOffsetUvX: { value: 0.0 },
      uScanbeamY: { value: 0.5 },
      uIsHighlighted: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uStationIndex;
      uniform float uOpacity;
      uniform float uFlickerGain;
      uniform float uGlitchIntensity;
      uniform float uTearOffsetUvX;
      uniform float uScanbeamY;
      uniform float uIsHighlighted;
      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vec2 uv = vUv;

        // Periodic/interactive horizontal scanline glitch shear in 1-3 bands
        float band1 = step(0.18, uv.y) * step(uv.y, 0.26);
        float band2 = step(0.52, uv.y) * step(uv.y, 0.61);
        float band3 = step(0.81, uv.y) * step(uv.y, 0.88);
        float inGlitchBand = clamp(band1 + band2 + band3, 0.0, 1.0);

        if (uGlitchIntensity > 0.01 && inGlitchBand > 0.5) {
          uv.x += uTearOffsetUvX * uGlitchIntensity;
        }

        // Texture sampling with chromatic split during glitch
        vec4 baseTex = texture2D(uMap, uv);
        if (uGlitchIntensity > 0.05) {
          float cShift = 0.008 * uGlitchIntensity;
          vec4 goldSample = texture2D(uMap, vec2(uv.x + cShift, uv.y));
          vec4 burntSample = texture2D(uMap, vec2(uv.x - cShift, uv.y));
          baseTex.rgb = mix(baseTex.rgb, goldSample.rgb * vec3(1.0, 0.95, 0.54), 0.35);
          baseTex.rgb = mix(baseTex.rgb, burntSample.rgb * vec3(0.70, 0.32, 0.04), 0.25);
        }

        // Discard exterior margin outside the rounded-rectangle card bezel (Spec 036 §3.1, §5.1)
        if (baseTex.a < 0.01) discard;

        // Horizontal holographic scanlines
        float scanline = 0.90 + 0.10 * sin(uv.y * 280.0 - uTime * 9.0);

        // Sweeping vertical scanbeam bar (masked strictly inside the rounded card)
        float scanbeamDist = abs(uv.y - uScanbeamY);
        float scanbeam = exp(-pow(scanbeamDist * 32.0, 2.0)) * 0.32;
        vec3 scanbeamColor = vec3(0.99, 0.90, 0.54);

        // Fresnel edge brightening
        float fresnel = pow(1.0 - clamp(abs(dot(vViewDir, vViewNormal)), 0.0, 1.0), 2.2) * 0.28;
        vec3 fresnelCol = vec3(0.96, 0.62, 0.04);

        vec3 finalRgb = baseTex.rgb * scanline + scanbeam * scanbeamColor + fresnel * fresnelCol;
        finalRgb *= uFlickerGain * (1.0 + uIsHighlighted * 0.22);

        // Unified Holographic Showcase Card Alpha (Spec 036 §3.1, §5.1):
        // - Exterior outside rounded bezel is discarded above (baseTex.a < 0.01)
        // - Smoked-amber card substrate (baseTex.a ~ 0.44) renders as translucent holographic glass
        // - Borders, ignited light bars, pills, typography, metric boxes & CTAs (baseTex.a > 0.65) render crisply
        float glassAlpha = clamp(uOpacity * 1.18 + fresnel * 0.12 + scanbeam * 0.16, 0.34, 0.54);
        float glyphWeight = smoothstep(0.48, 0.72, baseTex.a);
        float glyphAlpha = clamp(baseTex.a * 0.98 + scanbeam * 0.14, 0.84, 0.98);
        float cardMask = smoothstep(0.01, 0.08, baseTex.a);
        float finalAlpha = mix(glassAlpha, glyphAlpha, glyphWeight) * cardMask;

        gl_FragColor = vec4(finalRgb, finalAlpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: false,
  });

  if (applyStencilReject) applyStencilReject(mat);
  return mat;
}

export function createScreenMountSlightDiffusiveGlowMaterial(
  mountName,
  uTimeUniform,
  applyStencilReject
) {
  const intensityUniform = { value: 0.22 };
  const mat = new THREE.ShaderMaterial({
    name: `${mountName}_SlightDiffusiveGlowMat`,
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
      uDiffusionIntensity: intensityUniform,
      uIntensity: intensityUniform,
      uFlickerGain: { value: 1.0 },
      uCoreColor: { value: new THREE.Color(0xfbbf24) },
      uOuterColor: { value: new THREE.Color(0xd97706) },
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      void main() {
        vLocalPos = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDiffusionIntensity;
      uniform float uFlickerGain;
      uniform vec3 uCoreColor;
      uniform vec3 uOuterColor;
      varying vec3 vLocalPos;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        float r = length(vLocalPos);
        // Smooth non-conical radial/ellipsoidal Gaussian decay
        float falloff = exp(-pow(r * 2.2, 2.0));
        float fresnel = pow(1.0 - clamp(dot(vViewDir, vViewNormal), 0.0, 1.0), 1.8);
        float alpha = clamp(falloff * uDiffusionIntensity * uFlickerGain * (0.85 + 0.15 * fresnel), 0.0, 0.30);
        if (alpha < 0.005) discard;
        vec3 col = mix(uOuterColor, uCoreColor, falloff);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });

  if (applyStencilReject) applyStencilReject(mat);
  return mat;
}

export function updateWallMountHolographicParity(
  mountRecord,
  timeSec,
  dt = 1 / 60,
  context = {}
) {
  if (!mountRecord) return;
  const st = mountRecord.station;
  const isHighlighted = context.isFocused || context.isHovered || context.isProximity;

  if (mountRecord.glitchBoostRemainingSec > 0) {
    mountRecord.glitchBoostRemainingSec = Math.max(0.0, mountRecord.glitchBoostRemainingSec - dt);
  }
  const interactiveBoost = mountRecord.glitchBoostRemainingSec > 0 ? 1.0 : (isHighlighted ? 0.20 : 0.0);

  const evalState = evaluateHologramScreenFlickerAndGlitch(timeSec, st.index, interactiveBoost);

  mountRecord.hasHologramMesh = true;
  mountRecord.isTransparentHologram = true;
  mountRecord.glassOpacity = mountRecord.glassOpacity ?? 0.32;
  mountRecord.standbyOpacity = mountRecord.standbyOpacity ?? 0.20;
  mountRecord.hasHolographicEffect = true;
  mountRecord.holographicEffectParity = true;
  mountRecord.isFlickering = true;
  mountRecord.hasGlitchEffect = true;
  mountRecord.isConical = false;
  mountRecord.isConicalLight = false;
  mountRecord.flickerGain = evalState.flickerGain;
  mountRecord.glitchIntensity = evalState.glitchIntensity;
  mountRecord.scanbeamY = evalState.scanbeamY;
  mountRecord.diffusedGlowIntensity = evalState.diffusedGlowIntensity;

  if (mountRecord.faceMat && mountRecord.faceMat.uniforms) {
    const u = mountRecord.faceMat.uniforms;
    if (u.uTime) u.uTime.value = timeSec;
    if (u.uFlickerGain) u.uFlickerGain.value = evalState.flickerGain;
    if (u.uGlitchIntensity) u.uGlitchIntensity.value = evalState.glitchIntensity;
    if (u.uTearOffsetUvX) u.uTearOffsetUvX.value = evalState.tearOffsetUvX;
    if (u.uScanbeamY) u.uScanbeamY.value = evalState.scanbeamY;
    if (u.uIsHighlighted) u.uIsHighlighted.value = isHighlighted ? 1.0 : 0.0;
    if (u.uOpacity) {
      const targetGlassOpacity = mountRecord.state === 'standby'
        ? mountRecord.standbyOpacity
        : (isHighlighted ? Math.min(0.42, mountRecord.glassOpacity + 0.06) : mountRecord.glassOpacity);
      u.uOpacity.value = targetGlassOpacity;
    }
  }

  // Synchronize the 4 sub-mesh materials of the cloned hologram.glb on this TV mount (Spec 025 §4.2–§4.3)
  if (mountRecord.hologramMaterials) {
    const hm = mountRecord.hologramMaterials;
    const isStandby = mountRecord.state === 'standby';
    const baseGlassAlpha = isStandby
      ? mountRecord.standbyOpacity
      : (isHighlighted ? Math.min(0.42, mountRecord.glassOpacity + 0.05) : mountRecord.glassOpacity);
    const flk = evalState.flickerGain;
    const hiBoost = isHighlighted ? 1.22 : 1.0;

    if (hm.smokedGlass) {
      hm.smokedGlass.opacity = Number(Math.max(0.10, Math.min(0.45, baseGlassAlpha * (0.92 + 0.08 * flk))).toFixed(4));
      if ('emissiveIntensity' in hm.smokedGlass) {
        hm.smokedGlass.emissiveIntensity = Number(((isStandby ? 0.24 : 0.42) * flk * hiBoost).toFixed(4));
      }
    }
    if (hm.highBloomAccents) {
      hm.highBloomAccents.opacity = Number((isStandby ? 0.56 * flk : Math.min(0.96, 0.88 * flk * hiBoost)).toFixed(4));
      if ('emissiveIntensity' in hm.highBloomAccents) {
        hm.highBloomAccents.emissiveIntensity = Number(((isStandby ? 0.95 : 1.85) * flk * hiBoost).toFixed(4));
      }
    }
    if (hm.structuralFrames) {
      hm.structuralFrames.opacity = Number((isStandby ? 0.34 * flk : Math.min(0.72, 0.58 * flk * hiBoost)).toFixed(4));
      if ('emissiveIntensity' in hm.structuralFrames) {
        hm.structuralFrames.emissiveIntensity = Number(((isStandby ? 0.52 : 1.15) * flk * hiBoost).toFixed(4));
      }
    }
    if (hm.bezelDetails) {
      hm.bezelDetails.opacity = Number((isStandby ? 0.30 * flk : Math.min(0.68, 0.52 * flk * hiBoost)).toFixed(4));
      if ('emissiveIntensity' in hm.bezelDetails) {
        hm.bezelDetails.emissiveIntensity = Number(((isStandby ? 0.45 : 0.96) * flk * hiBoost).toFixed(4));
      }
    }
  }

  if (mountRecord.diffusedLightMat && mountRecord.diffusedLightMat.uniforms) {
    const du = mountRecord.diffusedLightMat.uniforms;
    if (du.uTime) du.uTime.value = timeSec;
    if (du.uDiffusionIntensity) du.uDiffusionIntensity.value = evalState.diffusedGlowIntensity;
    if (du.uIntensity) du.uIntensity.value = evalState.diffusedGlowIntensity;
    if (du.uFlickerGain) du.uFlickerGain.value = evalState.flickerGain;
  }
}

// ============================================================================
// Pillar 3: Dynamic Light-Responsive Character & Floating Head Shadows (Spec 023 §5)
// ============================================================================

export const CHARACTER_SHADOW_SPEC = Object.freeze({
  primaryBaseRadiusX: 0.42,
  primaryBaseRadiusZ: 0.48,
  companionBaseRadiusX: 0.21,
  companionBaseRadiusZ: 0.23,
  minOpacity: 0.32,
  maxOpacity: 0.78,
  minElongation: 1.0,
  maxElongation: 2.1,
  minPenumbraSoftness: 0.22,
  maxPenumbraSoftness: 0.75,
  groundOffsetMin: 0.04,
  groundOffsetMax: 0.62,
  moonlightWeight: 0.18,
  umbraColorHex: 0x070301,
  penumbraRimColorHex: 0x3d1a04,
});

export function collectActiveSceneLightSources(sandboxState, timeSec = 0.0) {
  const sources = [
    {
      id: 'SandboxMoonlightKeyLight',
      x: 4.0,
      y: 22.0,
      z: 8.0,
      intensity: 0.64,
      radius: 45.0,
      isPoint: false,
      color: 0x60a5fa,
      flicker: 1.0,
    },
    {
      id: 'SandboxMoonlightRimLight',
      x: -4.0,
      y: 15.0,
      z: -10.0,
      intensity: 0.42,
      radius: 40.0,
      isPoint: false,
      color: 0x38bdf8,
      flicker: 1.0,
    },
    {
      id: 'ENTRANCE_STREET_LAMPPOST_LIGHT',
      x: 4.1758566,
      y: 7.7647595,
      z: -4.0442681,
      intensity: 6.2,
      radius: 20.0,
      isPoint: true,
      isAlarm: false,
      color: 0xffaa44,
      flicker: 1.0 + 0.015 * Math.sin(timeSec * 2.1 + 0.65),
    },
  ];

  // Proximate Dark Amber Wall Alarm Light Fixtures
  const alarmLights = [
    { id: 'ALARM_LIGHT_01', x: -1.60, y: 2.62, z: 7.40, pairIndex: 1 },
    { id: 'ALARM_LIGHT_02', x: 1.78, y: 2.18, z: 22.80, pairIndex: 2 },
    { id: 'ALARM_LIGHT_03', x: -1.55, y: 2.84, z: 38.60, pairIndex: 3 },
  ];

  alarmLights.forEach((al) => {
    let flicker = 1.0;
    if (typeof sandboxState?.evaluateAlarmLightFlicker === 'function') {
      flicker = sandboxState.evaluateAlarmLightFlicker(timeSec, al.pairIndex);
    } else {
      flicker = 0.85 + 0.15 * Math.sin(timeSec * 8.0 + al.pairIndex * 1.5);
    }
    sources.push({
      id: al.id,
      x: al.x,
      y: al.y,
      z: al.z,
      intensity: 4.8 * flicker,
      radius: 12.0,
      isPoint: true,
      isAlarm: true,
      color: 0xd97706,
      flicker,
    });
  });

  // Active Wall Mount Screens
  const mounts = [
    { id: 'SCREEN_MOUNT_01', x: -1.58, y: 1.75, z: 5.00 },
    { id: 'SCREEN_MOUNT_02', x: 1.88, y: 1.75, z: 10.00 },
    { id: 'SCREEN_MOUNT_03', x: -1.58, y: 1.75, z: 15.00 },
    { id: 'SCREEN_MOUNT_04', x: 1.80, y: 1.75, z: 20.00 },
    { id: 'SCREEN_MOUNT_05', x: 1.75, y: 1.75, z: 26.00 },
    { id: 'SCREEN_MOUNT_06', x: 1.72, y: 1.75, z: 32.00 },
  ];

  mounts.forEach((m, idx) => {
    const flk = evaluateHologramScreenFlickerAndGlitch(timeSec, idx + 1);
    sources.push({
      id: m.id,
      x: m.x,
      y: m.y,
      z: m.z,
      intensity: 3.1 * flk.flickerGain,
      radius: 8.5,
      isPoint: true,
      isAlarm: false,
      color: 0xfbbf24,
      flicker: flk.flickerGain,
    });
  });

  // Courtyard Warm Lantern at alley end
  sources.push({
    id: 'CourtyardWarmLantern',
    x: 0.2,
    y: 3.4,
    z: 59.5,
    intensity: 6.0,
    radius: 20.0,
    isPoint: true,
    isAlarm: false,
    color: 0xf59e0b,
    flicker: 1.0,
  });

  return sources;
}

export function evaluateLightResponsiveShadowAtPosition(
  subjectWorldPos,
  floorY = 0.0,
  lightSources = [],
  options = {}
) {
  const spec = CHARACTER_SHADOW_SPEC;
  const isCompanion = Boolean(options.isCompanion);
  const baseRx = isCompanion ? spec.companionBaseRadiusX : spec.primaryBaseRadiusX;
  const baseRz = isCompanion ? spec.companionBaseRadiusZ : spec.primaryBaseRadiusZ;

  const sx = subjectWorldPos.x;
  const sy = subjectWorldPos.y;
  const sz = subjectWorldPos.z;
  const elev = Math.max(0.0, sy - floorY);

  let castVecX = 0.0;
  let castVecZ = 0.0;
  let totalWeight = 0.0001;
  let dominantLightId = 'SandboxMoonlightKeyLight';
  let maxLightWeight = -1.0;
  let weightedFlicker = 0.0;

  for (let i = 0; i < lightSources.length; i++) {
    const ls = lightSources[i];
    const dx = sx - ls.x;
    const dy = sy - ls.y;
    const dz = sz - ls.z;

    if (!ls.isPoint) {
      const dist3d = Math.hypot(dx, dy, dz) + 0.0001;
      const wMoon = ls.intensity * 0.025;
      castVecX += (dx / dist3d) * wMoon * 0.1;
      castVecZ += (dz / dist3d) * wMoon * 0.02;
      totalWeight += wMoon;
      weightedFlicker += ls.flicker * wMoon;
      continue;
    }

    const distXZ = Math.hypot(dx, dz);
    if (distXZ > ls.radius) continue;

    const isAlarm = Boolean(ls.isAlarm) || String(ls.id).startsWith('ALARM_LIGHT');
    const zScale = isAlarm ? 0.55 : 2.6;
    const effD2 = dx * dx * 0.08 + dz * dz * zScale;
    const radiusNorm = Math.max(0.0, 1.0 - distXZ / ls.radius);
    const weight = (ls.intensity * radiusNorm * radiusNorm) / (0.04 + effD2 * effD2);

    if (weight <= 0.0001) continue;

    const planarLen = distXZ + 0.0001;
    const dirX = dx / planarLen;
    const dirZ = dz / planarLen;

    castVecX += dirX * weight;
    castVecZ += dirZ * weight;
    totalWeight += weight;
    weightedFlicker += (ls.flicker ?? 1.0) * weight;

    if (weight > maxLightWeight) {
      maxLightWeight = weight;
      dominantLightId = ls.id;
    }
  }

  const flickerMod = weightedFlicker / totalWeight;

  const castLen = Math.hypot(castVecX, castVecZ) + 0.0001;
  const normDx = castVecX / castLen;
  const normDz = castVecZ / castLen;
  const azimuthRad = Math.atan2(normDx, normDz);

  const lightStrength = Math.min(1.0, totalWeight / 12.0);
  const obliqueness = Math.min(1.0, castLen / (totalWeight + 0.05));

  // Dynamic elongation
  const elongation = Math.max(
    spec.minElongation,
    Math.min(spec.maxElongation, 1.0 + 0.85 * obliqueness + 0.12 * Math.min(1.5, elev * 0.4))
  );

  // Dynamic ground offset
  const bodyOrHeadElev = isCompanion ? elev : Math.max(0.85, elev + 0.85);
  const offsetMag = Math.max(
    spec.groundOffsetMin,
    Math.min(spec.groundOffsetMax, bodyOrHeadElev * (0.16 + 0.22 * obliqueness))
  );

  // Height attenuation
  const heightAtten = isCompanion
    ? Math.max(0.55, Math.min(1.0, 1.0 - 0.85 * (elev - 1.82)))
    : 1.0 / (1.0 + 0.55 * elev);

  // Dynamic umbral opacity & penumbra softness
  const opacity = Math.max(
    spec.minOpacity,
    Math.min(
      spec.maxOpacity,
      (0.38 + 0.24 * lightStrength) * Math.min(1.15, flickerMod) * heightAtten
    )
  );

  const penumbraSoftness = Math.max(
    spec.minPenumbraSoftness,
    Math.min(
      spec.maxPenumbraSoftness,
      0.28 + 0.20 * (1.0 - lightStrength) + 0.20 * Math.max(0.0, elev - 0.85)
    )
  );

  const worldX = sx + normDx * offsetMag;
  const worldY = floorY + 0.011;
  const worldZ = sz + normDz * offsetMag;

  return {
    visible: true,
    worldPosition: {
      x: Number(worldX.toFixed(4)),
      y: Number(worldY.toFixed(4)),
      z: Number(worldZ.toFixed(4)),
    },
    castDirection: {
      dx: Number(normDx.toFixed(4)),
      dz: Number(normDz.toFixed(4)),
    },
    azimuthRad: Number(azimuthRad.toFixed(4)),
    elongation: Number(elongation.toFixed(4)),
    opacity: Number(opacity.toFixed(4)),
    penumbraSoftness: Number(penumbraSoftness.toFixed(4)),
    flickerMod: Number(flickerMod.toFixed(4)),
    dominantLightId,
    subjectElevation: Number(elev.toFixed(4)),
    radiusX: Number((baseRx * (1.0 + (1.0 - heightAtten) * 0.35)).toFixed(4)),
    radiusZ: Number((baseRz * elongation * (1.0 + (1.0 - heightAtten) * 0.35)).toFixed(4)),
  };
}

export function buildCharacterLightResponsiveShadowSubsystem({
  rootGroup,
  floorY = 0.0,
  uTimeUniform,
  applyStencilReject,
}) {
  const spec = CHARACTER_SHADOW_SPEC;
  const maxShadows = 3; // 0: primary (active char), 1: companion (DOOM head), 2: secondary char
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(maxShadows * 4 * 3);
  const uvs = new Float32Array(maxShadows * 4 * 2);
  const opacities = new Float32Array(maxShadows * 4);
  const penumbras = new Float32Array(maxShadows * 4);
  const indices = new Uint16Array(maxShadows * 6);

  for (let i = 0; i < maxShadows; i++) {
    const vOffset = i * 4;
    const iOffset = i * 6;
    indices[iOffset + 0] = vOffset + 0;
    indices[iOffset + 1] = vOffset + 1;
    indices[iOffset + 2] = vOffset + 2;
    indices[iOffset + 3] = vOffset + 0;
    indices[iOffset + 4] = vOffset + 2;
    indices[iOffset + 5] = vOffset + 3;

    uvs[vOffset * 2 + 0] = 0.0;
    uvs[vOffset * 2 + 1] = 0.0;
    uvs[(vOffset + 1) * 2 + 0] = 1.0;
    uvs[(vOffset + 1) * 2 + 1] = 0.0;
    uvs[(vOffset + 2) * 2 + 0] = 1.0;
    uvs[(vOffset + 2) * 2 + 1] = 1.0;
    uvs[(vOffset + 3) * 2 + 0] = 0.0;
    uvs[(vOffset + 3) * 2 + 1] = 1.0;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
  geom.setAttribute('aPenumbra', new THREE.BufferAttribute(penumbras, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  const mat = new THREE.ShaderMaterial({
    name: 'CharacterLightResponsiveShadowMaterial',
    uniforms: {
      uUmbraColor: { value: new THREE.Color(spec.umbraColorHex) },
      uRimColor: { value: new THREE.Color(spec.penumbraRimColorHex) },
    },
    vertexShader: `
      attribute float aOpacity;
      attribute float aPenumbra;
      varying vec2 vUv;
      varying float vOpacity;
      varying float vPenumbra;
      void main() {
        vUv = uv;
        vOpacity = aOpacity;
        vPenumbra = aPenumbra;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uUmbraColor;
      uniform vec3 uRimColor;
      varying vec2 vUv;
      varying float vOpacity;
      varying float vPenumbra;
      void main() {
        vec2 centered = (vUv - 0.5) * 2.0;
        float r = length(centered);
        if (r > 1.0) discard;
        // Soft elliptical umbra/penumbra Gaussian falloff
        float umbraZone = 1.0 - smoothstep(1.0 - vPenumbra, 1.0, r);
        float alpha = umbraZone * vOpacity;
        if (alpha < 0.005) discard;
        vec3 col = mix(uRimColor, uUmbraColor, smoothstep(0.4, 0.95, 1.0 - r));
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  if (applyStencilReject) applyStencilReject(mat);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'CharacterLightResponsiveShadowsMesh';
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.raycast = () => {};
  rootGroup.add(mesh);

  let primaryShadowRecord = { visible: true };
  let companionShadowRecord = { visible: false };
  let secondaryShadowRecord = { visible: false };
  let lastActiveLightSources = collectActiveSceneLightSources(null, 0.0);

  function updateShadowQuad(slotIndex, shadowState) {
    const posAttr = geom.attributes.position;
    const opAttr = geom.attributes.aOpacity;
    const penAttr = geom.attributes.aPenumbra;
    const pArr = posAttr.array;
    const oArr = opAttr.array;
    const peArr = penAttr.array;

    const vOffset = slotIndex * 4;

    if (!shadowState || !shadowState.visible) {
      for (let j = 0; j < 4; j++) {
        oArr[vOffset + j] = 0.0;
      }
      return;
    }

    const cx = shadowState.worldPosition.x;
    const cy = shadowState.worldPosition.y;
    const cz = shadowState.worldPosition.z;
    const rx = shadowState.radiusX;
    const rz = shadowState.radiusZ;
    const theta = shadowState.azimuthRad;

    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const corners = [
      [-rx, -rz],
      [rx, -rz],
      [rx, rz],
      [-rx, rz],
    ];

    for (let j = 0; j < 4; j++) {
      const lx = corners[j][0];
      const lz = corners[j][1];
      const rotX = lx * cosT - lz * sinT;
      const rotZ = lx * sinT + lz * cosT;

      const pIdx = (vOffset + j) * 3;
      pArr[pIdx + 0] = cx + rotX;
      pArr[pIdx + 1] = cy;
      pArr[pIdx + 2] = cz + rotZ;

      oArr[vOffset + j] = shadowState.opacity;
      peArr[vOffset + j] = shadowState.penumbraSoftness;
    }
  }

  function update(dt, timeSec, sandboxState) {
    if (!sandboxState || !sandboxState.ready) return;
    const lights = collectActiveSceneLightSources(sandboxState, timeSec);
    lastActiveLightSources = lights;
    const activeChar = sandboxState.getActiveCharacter ? sandboxState.getActiveCharacter() : null;

    if (!activeChar) return;

    // 1. Primary Character Shadow
    primaryShadowRecord = evaluateLightResponsiveShadowAtPosition(
      activeChar.position,
      floorY,
      lights,
      { isCompanion: false }
    );
    updateShadowQuad(0, primaryShadowRecord);

    // 2. DOOM Companion Floating Head Shadow (active when LUIS / hoodie variant is active)
    const isLuis = activeChar.id === 'hoodie';
    if (isLuis) {
      const headEquilibrium = { x: -0.430, y: 1.862, z: 0.055 };
      const deltaY = 0.036 * Math.sin(2.80 * timeSec);
      const deltaX = 0.011 * Math.sin(1.40 * timeSec + 0.85);
      const deltaZ = 0.010 * Math.cos(2.10 * timeSec + 0.40);

      const yaw = activeChar.yaw || 0.0;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      const relX = headEquilibrium.x + deltaX;
      const relZ = headEquilibrium.z + deltaZ;
      const worldHeadX = activeChar.position.x + (relX * cosY + relZ * sinY);
      const worldHeadY = activeChar.position.y + headEquilibrium.y + deltaY;
      const worldHeadZ = activeChar.position.z + (-relX * sinY + relZ * cosY);

      companionShadowRecord = evaluateLightResponsiveShadowAtPosition(
        { x: worldHeadX, y: worldHeadY, z: worldHeadZ },
        floorY,
        lights,
        { isCompanion: true }
      );
      companionShadowRecord.visible = true;
      updateShadowQuad(1, companionShadowRecord);
    } else {
      companionShadowRecord = { visible: false };
      updateShadowQuad(1, companionShadowRecord);
    }

    // 3. Secondary Character Shadow (if not solo)
    if (sandboxState.soloCharacterMode === false) {
      const otherChar =
        activeChar.id === 'hoodie'
          ? sandboxState.characters?.tunic
          : sandboxState.characters?.hoodie;
      if (otherChar && otherChar.root?.visible) {
        secondaryShadowRecord = evaluateLightResponsiveShadowAtPosition(
          otherChar.position,
          floorY,
          lights,
          { isCompanion: false }
        );
        secondaryShadowRecord.visible = true;
        updateShadowQuad(2, secondaryShadowRecord);
      } else {
        secondaryShadowRecord = { visible: false };
        updateShadowQuad(2, secondaryShadowRecord);
      }
    } else {
      secondaryShadowRecord = { visible: false };
      updateShadowQuad(2, secondaryShadowRecord);
    }

    geom.attributes.position.needsUpdate = true;
    geom.attributes.aOpacity.needsUpdate = true;
    geom.attributes.aPenumbra.needsUpdate = true;
  }

  function evaluateShadowAt(worldPos, options = {}) {
    const lights = collectActiveSceneLightSources(null, 0.0);
    return evaluateLightResponsiveShadowAtPosition(worldPos, floorY, lights, options);
  }

  function getState() {
    return {
      primaryShadow: primaryShadowRecord,
      companionShadow: companionShadowRecord,
      secondaryShadow: secondaryShadowRecord,
      activeLightSources: lastActiveLightSources,
      spec,
    };
  }

  return {
    get primaryShadow() {
      return primaryShadowRecord;
    },
    get companionShadow() {
      return companionShadowRecord;
    },
    get secondaryShadow() {
      return secondaryShadowRecord;
    },
    get activeLightSources() {
      return lastActiveLightSources;
    },
    mesh,
    material: mat,
    spec,
    update,
    evaluateShadowAt,
    getState,
  };
}

// ============================================================================
// Pillar 4: 20 Overhead Hanging Cables Across Full Alleyway (Spec 023 §6 & Spec 027)
// ============================================================================

export const OVERHEAD_WIRE_VARIETIES = Object.freeze({
  VARIETY_01_HEAVY_SINGLE_CONDUIT: 'VARIETY_01_HEAVY_SINGLE_CONDUIT',
  VARIETY_02_MULTI_STRAND_HARNESS: 'VARIETY_02_MULTI_STRAND_HARNESS',
  VARIETY_03_COILED_SERVICE_DROP: 'VARIETY_03_COILED_SERVICE_DROP',
  VARIETY_04_BRAIDED_HELIX_CYBER_LINE: 'VARIETY_04_BRAIDED_HELIX_CYBER_LINE',
});

export const OVERHEAD_VERTICAL_TIERS = Object.freeze({
  LOW_TIER: 'LOW_TIER',
  MID_TIER: 'MID_TIER',
  HIGH_TIER: 'HIGH_TIER',
  DIAGONAL_SLOPE: 'DIAGONAL_SLOPE',
});

export const OVERHEAD_CABLE_SCHEDULE = Object.freeze([
  Object.freeze({ id: 'OVERHEAD_CABLE_01', index: 1,  zone: 'Alley Entry Mouth',                  variety: OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT,    verticalTier: OVERHEAD_VERTICAL_TIERS.LOW_TIER,       zL: 1.10,  zR: 1.35,  yL: 3.36, yR: 3.48, elevationDelta: 0.12, sag: 0.38, midSpanY: 3.04, minY: 3.04, lowestElementY: 3.04, strandCount: 1, radius: 0.015, coilDrop: 0.00, swayFreqHz: 0.58, swayAmpY: 0.012, swayAmpZ: 0.014, phase: 0.40 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_02', index: 2,  zone: 'Entry / Station 01 Approach',        variety: OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP,     verticalTier: OVERHEAD_VERTICAL_TIERS.HIGH_TIER,      zL: 3.60,  zR: 3.20,  yL: 7.45, yR: 7.15, elevationDelta: 0.30, sag: 0.62, midSpanY: 6.68, minY: 6.67, lowestElementY: 6.35, strandCount: 2, radius: 0.012, coilDrop: 0.32, swayFreqHz: 0.64, swayAmpY: 0.015, swayAmpZ: 0.016, phase: 1.15 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_03', index: 3,  zone: 'Station 01 (SCREEN_MOUNT_01)',       variety: OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS,    verticalTier: OVERHEAD_VERTICAL_TIERS.MID_TIER,       zL: 6.20,  zR: 6.85,  yL: 4.85, yR: 5.15, elevationDelta: 0.30, sag: 0.44, midSpanY: 4.56, minY: 4.55, lowestElementY: 4.48, strandCount: 3, radius: 0.012, coilDrop: 0.00, swayFreqHz: 0.72, swayAmpY: 0.013, swayAmpZ: 0.015, phase: 2.05 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_04', index: 4,  zone: 'Front-Mid Corridor',                 variety: OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE,verticalTier: OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE, zL: 9.10,  zR: 8.55,  yL: 6.85, yR: 5.25, elevationDelta: 1.60, sag: 1.04, midSpanY: 5.01, minY: 4.86, lowestElementY: 4.82, strandCount: 2, radius: 0.009, helixTurns: 8, coilDrop: 0.00, swayFreqHz: 0.52, swayAmpY: 0.017, swayAmpZ: 0.018, phase: 2.80 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_05', index: 5,  zone: 'Station 02 (SCREEN_MOUNT_02)',       variety: OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT,    verticalTier: OVERHEAD_VERTICAL_TIERS.LOW_TIER,       zL: 11.80, zR: 12.30, yL: 3.12, yR: 3.34, elevationDelta: 0.22, sag: 0.34, midSpanY: 2.89, minY: 2.88, lowestElementY: 2.88, strandCount: 1, radius: 0.014, coilDrop: 0.00, swayFreqHz: 0.84, swayAmpY: 0.010, swayAmpZ: 0.012, phase: 3.55 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_06', index: 6,  zone: 'Station 03 Approach',                variety: OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE,verticalTier: OVERHEAD_VERTICAL_TIERS.HIGH_TIER,      zL: 14.60, zR: 14.10, yL: 8.15, yR: 7.85, elevationDelta: 0.30, sag: 0.56, midSpanY: 7.44, minY: 7.43, lowestElementY: 7.39, strandCount: 2, radius: 0.009, helixTurns: 8, coilDrop: 0.00, swayFreqHz: 0.61, swayAmpY: 0.015, swayAmpZ: 0.016, phase: 4.20 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_07', index: 7,  zone: 'Station 03 / NPC Zone',              variety: OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP,     verticalTier: OVERHEAD_VERTICAL_TIERS.MID_TIER,       zL: 17.40, zR: 18.10, yL: 5.10, yR: 5.40, elevationDelta: 0.30, sag: 0.48, midSpanY: 4.77, minY: 4.76, lowestElementY: 4.46, strandCount: 2, radius: 0.0115, coilDrop: 0.30, swayFreqHz: 0.69, swayAmpY: 0.014, swayAmpZ: 0.015, phase: 4.95 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_08', index: 8,  zone: 'Station 04 (SCREEN_MOUNT_04)',       variety: OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS,    verticalTier: OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE, zL: 20.30, zR: 19.75, yL: 4.25, yR: 5.85, elevationDelta: 1.60, sag: 1.02, midSpanY: 4.03, minY: 3.87, lowestElementY: 3.80, strandCount: 3, radius: 0.012, coilDrop: 0.00, swayFreqHz: 0.56, swayAmpY: 0.016, swayAmpZ: 0.017, phase: 5.70 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_09', index: 9,  zone: 'Mid-Alley Recess',                   variety: OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT,    verticalTier: OVERHEAD_VERTICAL_TIERS.HIGH_TIER,      zL: 23.20, zR: 23.90, yL: 7.60, yR: 7.90, elevationDelta: 0.30, sag: 0.58, midSpanY: 7.17, minY: 7.16, lowestElementY: 7.16, strandCount: 1, radius: 0.017, coilDrop: 0.00, swayFreqHz: 0.48, swayAmpY: 0.018, swayAmpZ: 0.019, phase: 0.85 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_10', index: 10, zone: 'Station 05 (SCREEN_MOUNT_05)',       variety: OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP,     verticalTier: OVERHEAD_VERTICAL_TIERS.LOW_TIER,       zL: 26.10, zR: 25.60, yL: 3.46, yR: 3.26, elevationDelta: 0.20, sag: 0.36, midSpanY: 3.00, minY: 2.99, lowestElementY: 2.71, strandCount: 2, radius: 0.011, coilDrop: 0.28, swayFreqHz: 0.77, swayAmpY: 0.012, swayAmpZ: 0.013, phase: 1.60 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_11', index: 11, zone: 'Deep-Mid Corridor',                  variety: OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE,verticalTier: OVERHEAD_VERTICAL_TIERS.HIGH_TIER,      zL: 28.90, zR: 29.45, yL: 8.40, yR: 8.10, elevationDelta: 0.30, sag: 0.60, midSpanY: 7.65, minY: 7.64, lowestElementY: 7.60, strandCount: 2, radius: 0.009, helixTurns: 8, coilDrop: 0.00, swayFreqHz: 0.60, swayAmpY: 0.016, swayAmpZ: 0.017, phase: 2.35 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_12', index: 12, zone: 'Station 06 (SCREEN_MOUNT_06)',       variety: OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS,    verticalTier: OVERHEAD_VERTICAL_TIERS.MID_TIER,       zL: 31.80, zR: 31.30, yL: 4.95, yR: 4.65, elevationDelta: 0.30, sag: 0.46, midSpanY: 4.34, minY: 4.33, lowestElementY: 4.26, strandCount: 3, radius: 0.012, coilDrop: 0.00, swayFreqHz: 0.67, swayAmpY: 0.014, swayAmpZ: 0.015, phase: 3.10 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_13', index: 13, zone: 'Scroll Handoff Zone (34m)',          variety: OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT,    verticalTier: OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE, zL: 34.70, zR: 35.25, yL: 6.60, yR: 4.90, elevationDelta: 1.70, sag: 1.08, midSpanY: 4.67, minY: 4.50, lowestElementY: 4.50, strandCount: 1, radius: 0.016, coilDrop: 0.00, swayFreqHz: 0.59, swayAmpY: 0.015, swayAmpZ: 0.016, phase: 3.85 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_14', index: 14, zone: 'Far Main Corridor',                  variety: OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP,     verticalTier: OVERHEAD_VERTICAL_TIERS.HIGH_TIER,      zL: 37.60, zR: 37.10, yL: 7.80, yR: 7.50, elevationDelta: 0.30, sag: 0.60, midSpanY: 7.05, minY: 7.04, lowestElementY: 6.70, strandCount: 2, radius: 0.012, coilDrop: 0.34, swayFreqHz: 0.65, swayAmpY: 0.014, swayAmpZ: 0.015, phase: 4.60 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_15', index: 15, zone: 'Pre-Transition Main Alley End',      variety: OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE,verticalTier: OVERHEAD_VERTICAL_TIERS.MID_TIER,       zL: 41.20, zR: 41.80, yL: 4.70, yR: 5.00, elevationDelta: 0.30, sag: 0.46, midSpanY: 4.39, minY: 4.38, lowestElementY: 4.34, strandCount: 2, radius: 0.0085, helixTurns: 8, coilDrop: 0.00, swayFreqHz: 0.71, swayAmpY: 0.013, swayAmpZ: 0.015, phase: 5.35 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_16', index: 16, zone: 'Past Main Alleyway End (>44m)',      variety: OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS,    verticalTier: OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE, zL: 44.60, zR: 45.10, yL: 4.50, yR: 3.16, elevationDelta: 1.34, sag: 0.88, midSpanY: 2.95, minY: 2.82, lowestElementY: 2.75, strandCount: 3, radius: 0.012, coilDrop: 0.00, swayFreqHz: 0.50, swayAmpY: 0.019, swayAmpZ: 0.020, phase: 0.60 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_17', index: 17, zone: 'Past Main Alleyway End',             variety: OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT,    verticalTier: OVERHEAD_VERTICAL_TIERS.LOW_TIER,       zL: 47.40, zR: 46.90, yL: 3.44, yR: 3.12, elevationDelta: 0.32, sag: 0.42, midSpanY: 2.86, minY: 2.85, lowestElementY: 2.85, strandCount: 1, radius: 0.015, coilDrop: 0.00, swayFreqHz: 0.55, swayAmpY: 0.017, swayAmpZ: 0.018, phase: 1.45 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_18', index: 18, zone: 'Past Main Alleyway End',             variety: OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP,     verticalTier: OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE, zL: 50.20, zR: 50.80, yL: 4.68, yR: 3.08, elevationDelta: 1.60, sag: 0.98, midSpanY: 2.90, minY: 2.74, lowestElementY: 2.50, strandCount: 2, radius: 0.0115, coilDrop: 0.24, swayFreqHz: 0.53, swayAmpY: 0.018, swayAmpZ: 0.019, phase: 2.20 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_19', index: 19, zone: 'Past Main Alleyway End',             variety: OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS,    verticalTier: OVERHEAD_VERTICAL_TIERS.MID_TIER,       zL: 53.10, zR: 52.60, yL: 4.40, yR: 4.10, elevationDelta: 0.30, sag: 0.44, midSpanY: 3.81, minY: 3.80, lowestElementY: 3.73, strandCount: 3, radius: 0.013, coilDrop: 0.00, swayFreqHz: 0.45, swayAmpY: 0.020, swayAmpZ: 0.021, phase: 2.95 }),
  Object.freeze({ id: 'OVERHEAD_CABLE_20', index: 20, zone: 'Past Main Alleyway End (Back Alley)', variety: OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE,verticalTier: OVERHEAD_VERTICAL_TIERS.LOW_TIER,       zL: 56.00, zR: 56.50, yL: 3.56, yR: 3.36, elevationDelta: 0.20, sag: 0.36, midSpanY: 3.10, minY: 3.09, lowestElementY: 3.05, strandCount: 2, radius: 0.009, helixTurns: 8, coilDrop: 0.00, swayFreqHz: 0.47, swayAmpY: 0.019, swayAmpZ: 0.021, phase: 3.70 }),
]);

export function resolveAlleyWallAnchorX(wallSide, z, y = 3.3, visualAlleyMesh = null) {
  const clampedZ = Math.max(0.0, Math.min(58.0, Number(z) || 0));
  if (wallSide === 'L' || wallSide === 'left') {
    // Left Wall (-X, screen-right when facing +Z) profile calibrated to VISUAL_ALLEY_MESH
    let baseXL = -1.72;
    if (clampedZ <= 26.2) {
      baseXL = -1.72 - (clampedZ / 26.2) * 0.94; // -1.72 -> -2.66
    } else if (clampedZ <= 44.0) {
      baseXL = -1.92 + ((clampedZ - 26.2) / 17.8) * 0.28; // -1.92 -> -1.64
    } else {
      baseXL = -1.68 - Math.min(1.0, (clampedZ - 44.0) / 8.0) * 0.16;
    }
    return Math.max(-2.68, Math.min(-1.42, baseXL));
  } else {
    // Right Wall (+X, screen-left when facing +Z) profile calibrated to VISUAL_ALLEY_MESH
    if (clampedZ <= 34.0) {
      const baseXR = 2.24 - (clampedZ / 34.0) * 0.72; // 2.24 -> 1.52
      return Math.max(1.48, Math.min(2.26, baseXR));
    } else if (clampedZ <= 43.8) {
      const baseXR = 1.52 + ((clampedZ - 34.0) / 9.8) * 0.35; // 1.52 -> 1.87
      return Math.max(1.48, Math.min(2.26, baseXR));
    } else {
      const baseXR = 3.45 - Math.min(1.0, (clampedZ - 43.8) / 12.0) * 0.15;
      return Math.max(3.20, Math.min(3.68, baseXR));
    }
  }
}

export function evaluateOverheadCableCatenaryPoint(cableRecord, u, timeSec = 0.0) {
  const c = cableRecord;
  const clampedU = Math.max(0.0, Math.min(1.0, u));
  const sagWeight = 4.0 * clampedU * (1.0 - clampedU);

  const xL = c.xL !== undefined ? c.xL : resolveAlleyWallAnchorX('L', c.zL, c.yL);
  const xR = c.xR !== undefined ? c.xR : resolveAlleyWallAnchorX('R', c.zR, c.yR);

  const staticX = (1.0 - clampedU) * xL + clampedU * xR;
  const staticY = (1.0 - clampedU) * c.yL + clampedU * c.yR - c.sag * sagWeight;
  const staticZ = (1.0 - clampedU) * c.zL + clampedU * c.zR;

  // Atmospheric wind sway
  const swayDY = sagWeight * c.swayAmpY * Math.sin(2.0 * Math.PI * c.swayFreqHz * timeSec + c.phase);
  const swayDZ = sagWeight * c.swayAmpZ * Math.cos(2.0 * Math.PI * c.swayFreqHz * timeSec * 0.85 + c.phase + 0.6);

  return {
    x: Number((staticX).toFixed(4)),
    y: Number((staticY + swayDY).toFixed(4)),
    z: Number((staticZ + swayDZ).toFixed(4)),
    staticY: Number(staticY.toFixed(4)),
    swayDY: Number(swayDY.toFixed(4)),
    swayDZ: Number(swayDZ.toFixed(4)),
    sagWeight: Number(sagWeight.toFixed(4)),
  };
}

export function tagCableSubGeometry(geom, {
  xL,
  xR,
  fixedSpanU = null,
  swayFreqHz,
  swayAmpY,
  swayAmpZ,
  phase,
  baseColorHex = 0x181310,
  rimBoost = 1.0,
}) {
  const vertCount = geom.attributes.position.count;
  if (!geom.attributes.normal) {
    geom.computeVertexNormals();
  }
  const color = new THREE.Color(baseColorHex);
  const aSpanU = new Float32Array(vertCount);
  const aSwayParams = new Float32Array(vertCount * 3);
  const aCablePhase = new Float32Array(vertCount);
  const aBaseColor = new Float32Array(vertCount * 3);
  const aRimBoost = new Float32Array(vertCount);

  const posAttr = geom.attributes.position;
  const spanDx = Math.abs(xR - xL) > 1e-5 ? (xR - xL) : 1.0;

  for (let v = 0; v < vertCount; v++) {
    let spanU;
    if (fixedSpanU !== null) {
      spanU = fixedSpanU;
    } else {
      const vx = posAttr.getX(v);
      spanU = Math.max(0.0, Math.min(1.0, (vx - xL) / spanDx));
    }
    aSpanU[v] = spanU;
    aSwayParams[v * 3 + 0] = swayFreqHz;
    aSwayParams[v * 3 + 1] = swayAmpY;
    aSwayParams[v * 3 + 2] = swayAmpZ;
    aCablePhase[v] = phase;

    aBaseColor[v * 3 + 0] = color.r;
    aBaseColor[v * 3 + 1] = color.g;
    aBaseColor[v * 3 + 2] = color.b;

    aRimBoost[v] = rimBoost;
  }

  geom.setAttribute('aSpanU', new THREE.BufferAttribute(aSpanU, 1));
  geom.setAttribute('aSwayParams', new THREE.BufferAttribute(aSwayParams, 3));
  geom.setAttribute('aCablePhase', new THREE.BufferAttribute(aCablePhase, 1));
  geom.setAttribute('aBaseColor', new THREE.BufferAttribute(aBaseColor, 3));
  geom.setAttribute('aRimBoost', new THREE.BufferAttribute(aRimBoost, 1));
  return geom;
}

export function buildOverheadHangingCablesSubsystem({
  rootGroup,
  visualAlleyMesh = null,
  uTimeUniform,
  applyStencilReject,
}) {
  const schedule = OVERHEAD_CABLE_SCHEDULE;
  const cables = [];
  const cablesById = {};

  const curveSegments = 8;
  const radialSegments = 3;

  // Consolidate all 20 cable assemblies + wall termination hardware into 1 batched geometry
  const geometriesToMerge = [];

  for (let i = 0; i < schedule.length; i++) {
    const geomStartIdx = geometriesToMerge.length;
    const item = schedule[i];
    const xL = resolveAlleyWallAnchorX('L', item.zL, item.yL, visualAlleyMesh);
    const xR = resolveAlleyWallAnchorX('R', item.zR, item.yR, visualAlleyMesh);

    const leftAnchor = new THREE.Vector3(xL, item.yL, item.zL);
    const rightAnchor = new THREE.Vector3(xR, item.yR, item.zR);

    // Compute catenary curve points for primary span
    const primaryPoints = [];
    let minY = Infinity;
    for (let s = 0; s <= curveSegments; s++) {
      const u = s / curveSegments;
      const pt = evaluateOverheadCableCatenaryPoint(
        { ...item, xL, xR },
        u,
        0.0
      );
      if (pt.staticY < minY) minY = pt.staticY;
      primaryPoints.push(new THREE.Vector3(pt.x, pt.staticY, pt.z));
    }

    const midPt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, 0.5, 0.0);
    const primaryCurve = new THREE.CatmullRomCurve3(primaryPoints);

    if (item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT) {
      // Variety 1: Heavy Single Armored Utility Conduit (1 strand)
      const tubeGeom = new THREE.TubeGeometry(primaryCurve, curveSegments, item.radius, radialSegments, false);
      tagCableSubGeometry(tubeGeom, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x181310, rimBoost: 1.0,
      });
      geometriesToMerge.push(tubeGeom);

      // Single-block ceramic/cast-iron wall insulator cleats (0.06m x 0.08m x 0.05m)
      const cleatL = new THREE.BoxGeometry(0.06, 0.08, 0.05);
      cleatL.translate(xL, item.yL, item.zL);
      tagCableSubGeometry(cleatL, {
        xL, xR, fixedSpanU: 0.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x181310, rimBoost: 1.0,
      });
      geometriesToMerge.push(cleatL);

      const cleatR = new THREE.BoxGeometry(0.06, 0.08, 0.05);
      cleatR.translate(xR, item.yR, item.zR);
      tagCableSubGeometry(cleatR, {
        xL, xR, fixedSpanU: 1.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x181310, rimBoost: 1.0,
      });
      geometriesToMerge.push(cleatR);

    } else if (item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS) {
      // Variety 2: Bundled Multi-Strand Triplex Harness with Collar Ties (3 strands)
      // Strand 1: Primary Upper Carrier Strand
      const carrierTube = new THREE.TubeGeometry(primaryCurve, curveSegments, item.radius, radialSegments, false);
      tagCableSubGeometry(carrierTube, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x161210, rimBoost: 1.0,
      });
      geometriesToMerge.push(carrierTube);

      // Strand 2: Secondary Parallel Feeder Strand (radius 0.008, deltaY -0.045, deltaZ +0.022, +8% sag)
      const feederPoints = [];
      for (let s = 0; s <= curveSegments; s++) {
        const u = s / curveSegments;
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, u, 0.0);
        const sagWeight = 4.0 * u * (1.0 - u);
        const dy = -0.045 - 0.08 * item.sag * sagWeight;
        const dz = 0.022;
        feederPoints.push(new THREE.Vector3(pt.x, pt.staticY + dy, pt.z + dz));
      }
      const feederCurve = new THREE.CatmullRomCurve3(feederPoints);
      const feederTube = new THREE.TubeGeometry(feederCurve, curveSegments, 0.008, 3, false);
      tagCableSubGeometry(feederTube, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x14110f, rimBoost: 1.0,
      });
      geometriesToMerge.push(feederTube);

      // Strand 3: Tertiary Auxiliary Signal Strand (radius 0.006, deltaY -0.070, deltaZ -0.022, +14% sag)
      const signalPoints = [];
      for (let s = 0; s <= curveSegments; s++) {
        const u = s / curveSegments;
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, u, 0.0);
        const sagWeight = 4.0 * u * (1.0 - u);
        const dy = -0.070 - 0.14 * item.sag * sagWeight;
        const dz = -0.022;
        signalPoints.push(new THREE.Vector3(pt.x, pt.staticY + dy, pt.z + dz));
      }
      const signalCurve = new THREE.CatmullRomCurve3(signalPoints);
      const signalTube = new THREE.TubeGeometry(signalCurve, curveSegments, 0.006, 3, false);
      tagCableSubGeometry(signalTube, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x1c1612, rimBoost: 1.0,
      });
      geometriesToMerge.push(signalTube);

      // 5 Spaced Binding Collar Clamps at u in [0.16, 0.33, 0.50, 0.67, 0.84]
      const clampUList = [0.16, 0.33, 0.50, 0.67, 0.84];
      for (const cu of clampUList) {
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, cu, 0.0);
        const clampGeom = new THREE.BoxGeometry(0.036, 0.095, 0.062);
        clampGeom.translate(pt.x, pt.staticY - 0.035, pt.z);
        tagCableSubGeometry(clampGeom, {
          xL, xR, fixedSpanU: cu, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
          baseColorHex: 0x241a12, rimBoost: 1.45,
        });
        geometriesToMerge.push(clampGeom);
      }

      // Multi-lug wall rack brackets (0.07m x 0.16m x 0.06m)
      const rackL = new THREE.BoxGeometry(0.07, 0.16, 0.06);
      rackL.translate(xL, item.yL - 0.035, item.zL);
      tagCableSubGeometry(rackL, {
        xL, xR, fixedSpanU: 0.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x161210, rimBoost: 1.0,
      });
      geometriesToMerge.push(rackL);

      const rackR = new THREE.BoxGeometry(0.07, 0.16, 0.06);
      rackR.translate(xR, item.yR - 0.035, item.zR);
      tagCableSubGeometry(rackR, {
        xL, xR, fixedSpanU: 1.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x161210, rimBoost: 1.0,
      });
      geometriesToMerge.push(rackR);

    } else if (item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP) {
      // Variety 3: Messenger-Supported Wire with Hanging Coiled Slack Loops & Splice Canister (2 strands)
      // Upper Messenger Support Wire (radius 0.007, sag = 0.60 * item.sag, anchored +0.06m higher)
      const messengerPoints = [];
      for (let s = 0; s <= curveSegments; s++) {
        const u = s / curveSegments;
        const x = (1.0 - u) * xL + u * xR;
        const sagWeight = 4.0 * u * (1.0 - u);
        const y = (1.0 - u) * (item.yL + 0.06) + u * (item.yR + 0.06) - (0.60 * item.sag) * sagWeight;
        const z = (1.0 - u) * item.zL + u * item.zR;
        messengerPoints.push(new THREE.Vector3(x, y, z));
      }
      const messengerCurve = new THREE.CatmullRomCurve3(messengerPoints);
      const messengerTube = new THREE.TubeGeometry(messengerCurve, curveSegments, 0.007, 3, false);
      tagCableSubGeometry(messengerTube, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x1c1a18, rimBoost: 1.0,
      });
      geometriesToMerge.push(messengerTube);

      // Main Service Cable
      const serviceTube = new THREE.TubeGeometry(primaryCurve, curveSegments, item.radius, radialSegments, false);
      tagCableSubGeometry(serviceTube, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x171310, rimBoost: 1.0,
      });
      geometriesToMerge.push(serviceTube);

      // 4 Vertical Hanger Straps at u in [0.20, 0.40, 0.60, 0.80]
      const strapUList = [0.20, 0.40, 0.60, 0.80];
      for (const su of strapUList) {
        const x_u = (1.0 - su) * xL + su * xR;
        const z_u = (1.0 - su) * item.zL + su * item.zR;
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, su, 0.0);
        const sagWeight = 4.0 * su * (1.0 - su);
        const y_msg = (1.0 - su) * (item.yL + 0.06) + su * (item.yR + 0.06) - (0.60 * item.sag) * sagWeight;
        const y_srv = pt.staticY;
        const hStrap = Math.max(0.01, y_msg - y_srv);
        const strapGeom = new THREE.BoxGeometry(0.012, hStrap, 0.012);
        strapGeom.translate(x_u, (y_srv + y_msg) / 2, z_u);
        tagCableSubGeometry(strapGeom, {
          xL, xR, fixedSpanU: su, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
          baseColorHex: 0x221e1a, rimBoost: 1.0,
        });
        geometriesToMerge.push(strapGeom);
      }

      // Hanging Coiled Service Slack Loops at u in [0.35, 0.65]
      const coilUList = [0.35, 0.65];
      const coilDrop = item.coilDrop || 0.30;
      const loopRadius = coilDrop / 2;
      for (const cu of coilUList) {
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, cu, 0.0);
        const loopPoints = [];
        const centerY = pt.staticY - loopRadius;
        for (let k = 0; k <= 8; k++) {
          const phi = (k / 8) * 2.0 * Math.PI;
          const ly = centerY + loopRadius * Math.cos(phi);
          const lz = pt.z + loopRadius * Math.sin(phi);
          loopPoints.push(new THREE.Vector3(pt.x, ly, lz));
        }
        const loopCurve = new THREE.CatmullRomCurve3(loopPoints, true);
        const loopTube = new THREE.TubeGeometry(loopCurve, 8, 0.008, 3, true);
        tagCableSubGeometry(loopTube, {
          xL, xR, fixedSpanU: cu, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
          baseColorHex: 0x171310, rimBoost: 1.35,
        });
        geometriesToMerge.push(loopTube);
      }

      // Inline Splice Canister at u = 0.50
      const midPoint = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, 0.50, 0.0);
      const canister = new THREE.CylinderGeometry(0.028, 0.028, 0.26, 5);
      canister.rotateZ(Math.PI / 2);
      canister.translate(midPoint.x, midPoint.staticY, midPoint.z);
      tagCableSubGeometry(canister, {
        xL, xR, fixedSpanU: 0.50, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x221a14, rimBoost: 1.35,
      });
      geometriesToMerge.push(canister);

      // Dual-point strain-relief wall anchor plates (0.07m x 0.14m x 0.06m)
      const plateL = new THREE.BoxGeometry(0.07, 0.14, 0.06);
      plateL.translate(xL, item.yL + 0.03, item.zL);
      tagCableSubGeometry(plateL, {
        xL, xR, fixedSpanU: 0.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x171310, rimBoost: 1.0,
      });
      geometriesToMerge.push(plateL);

      const plateR = new THREE.BoxGeometry(0.07, 0.14, 0.06);
      plateR.translate(xR, item.yR + 0.03, item.zR);
      tagCableSubGeometry(plateR, {
        xL, xR, fixedSpanU: 1.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x171310, rimBoost: 1.0,
      });
      geometriesToMerge.push(plateR);

    } else if (item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE) {
      // Variety 4: Twisted Helical Twin-Braid Cyber Conduit with Illuminated Amber Signal Nodes (2 strands)
      const turns = item.helixTurns || 8;
      const strandPointsA = [];
      const strandPointsB = [];
      const helixSegments = 14;
      for (let s = 0; s <= helixSegments; s++) {
        const u = s / helixSegments;
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, u, 0.0);
        const rHelix = 0.018 * Math.sin(Math.PI * u);
        const theta = 2.0 * Math.PI * turns * u + item.phase;
        const dyA = rHelix * Math.cos(theta);
        const dzA = rHelix * Math.sin(theta);
        strandPointsA.push(new THREE.Vector3(pt.x, pt.staticY + dyA, pt.z + dzA));
        strandPointsB.push(new THREE.Vector3(pt.x, pt.staticY - dyA, pt.z - dzA));
      }
      const curveA = new THREE.CatmullRomCurve3(strandPointsA);
      const tubeA = new THREE.TubeGeometry(curveA, helixSegments, item.radius, 3, false);
      tagCableSubGeometry(tubeA, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x16120e, rimBoost: 1.35,
      });
      geometriesToMerge.push(tubeA);

      const curveB = new THREE.CatmullRomCurve3(strandPointsB);
      const tubeB = new THREE.TubeGeometry(curveB, helixSegments, item.radius, 3, false);
      tagCableSubGeometry(tubeB, {
        xL, xR, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x16120e, rimBoost: 1.35,
      });
      geometriesToMerge.push(tubeB);

      // 3 Spaced Cyber Signal Repeater Node Sleeves at u in [0.22, 0.50, 0.78]
      const nodeUList = [0.22, 0.50, 0.78];
      for (const nu of nodeUList) {
        const pt = evaluateOverheadCableCatenaryPoint({ ...item, xL, xR }, nu, 0.0);
        const node = new THREE.CylinderGeometry(0.025, 0.025, 0.10, 5);
        node.rotateZ(Math.PI / 2);
        node.translate(pt.x, pt.staticY, pt.z);
        tagCableSubGeometry(node, {
          xL, xR, fixedSpanU: nu, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
          baseColorHex: 0x221a10, rimBoost: 1.55,
        });
        geometriesToMerge.push(node);
      }

      // Heavy armored cyber-junction wall boxes (0.08m x 0.11m x 0.07m)
      const boxL = new THREE.BoxGeometry(0.08, 0.11, 0.07);
      boxL.translate(xL, item.yL, item.zL);
      tagCableSubGeometry(boxL, {
        xL, xR, fixedSpanU: 0.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x16120e, rimBoost: 1.0,
      });
      geometriesToMerge.push(boxL);

      const boxR = new THREE.BoxGeometry(0.08, 0.11, 0.07);
      boxR.translate(xR, item.yR, item.zR);
      tagCableSubGeometry(boxR, {
        xL, xR, fixedSpanU: 1.0, swayFreqHz: item.swayFreqHz, swayAmpY: item.swayAmpY, swayAmpZ: item.swayAmpZ, phase: item.phase,
        baseColorHex: 0x16120e, rimBoost: 1.0,
      });
      geometriesToMerge.push(boxR);
    }

    const isVariety2 = item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS;
    const isVariety3 = item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP;
    const isVariety4 = item.variety === OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE;

    let lowestElementY = item.lowestElementY;
    if (lowestElementY === undefined) {
      if (isVariety3) {
        lowestElementY = Number((minY - (item.coilDrop || 0.30)).toFixed(2));
      } else if (isVariety2) {
        lowestElementY = Number((minY - 0.07).toFixed(2));
      } else if (isVariety4) {
        lowestElementY = Number((minY - 0.04).toFixed(2));
      } else {
        lowestElementY = Number(minY.toFixed(2));
      }
    }

    let strandCount = item.strandCount;
    if (strandCount === undefined) {
      if (isVariety2) {
        strandCount = 3;
      } else if (isVariety3 || isVariety4) {
        strandCount = 2;
      } else {
        strandCount = 1;
      }
    }

    const elevationDelta = item.elevationDelta !== undefined
      ? item.elevationDelta
      : Number(Math.abs(item.yL - item.yR).toFixed(2));

    const midSpanY = Number(midPt.staticY.toFixed(2));
    const roundedMinY = Number(minY.toFixed(2));

    // Scene-graph node for metadata inspection
    const cableNode = new THREE.Group();
    cableNode.name = item.id;
    cableNode.userData = {
      id: item.id,
      index: item.index,
      zone: item.zone,
      variety: item.variety,
      verticalTier: item.verticalTier,
      leftAnchor,
      rightAnchor,
      xL,
      xR,
      yL: item.yL,
      yR: item.yR,
      zL: item.zL,
      zR: item.zR,
      elevationDelta,
      sag: item.sag,
      sagDepth: item.sag,
      midSpanPoint: new THREE.Vector3(midPt.x, midPt.staticY, midPt.z),
      midSpanY,
      minY: roundedMinY,
      lowestElementY,
      strandCount,
      hasCollarClamps: isVariety2,
      hasCoiledLoops: isVariety3,
      hasSpliceCanister: isVariety3,
      isHelicalBraid: isVariety4,
      hasSignalNodes: isVariety4,
      radius: item.radius,
      curveSegments,
      swayFreqHz: item.swayFreqHz,
      swayAmpY: item.swayAmpY,
      swayAmpZ: item.swayAmpZ,
      phase: item.phase,
    };
    rootGroup.add(cableNode);

    const record = {
      id: item.id,
      index: item.index,
      zone: item.zone,
      variety: item.variety,
      verticalTier: item.verticalTier,
      node: cableNode,
      xL,
      xR,
      yL: item.yL,
      yR: item.yR,
      zL: item.zL,
      zR: item.zR,
      elevationDelta,
      sag: item.sag,
      sagDepth: item.sag,
      leftAnchor,
      rightAnchor,
      midSpanPoint: new THREE.Vector3(midPt.x, midPt.staticY, midPt.z),
      midSpanY,
      minY: roundedMinY,
      lowestElementY,
      strandCount,
      hasCollarClamps: isVariety2,
      hasCoiledLoops: isVariety3,
      hasSpliceCanister: isVariety3,
      isHelicalBraid: isVariety4,
      hasSignalNodes: isVariety4,
      radius: item.radius,
      curveSegments,
      swayFreqHz: item.swayFreqHz,
      swayAmpY: item.swayAmpY,
      swayAmpZ: item.swayAmpZ,
      phase: item.phase,
    };

    cables.push(record);
    cablesById[item.id] = record;
    for (let gIdx = geomStartIdx; gIdx < geometriesToMerge.length; gIdx++) {
      geometriesToMerge[gIdx].userData = { cableIndex: i };
    }
  }

  // Merge geometries into single consolidated BufferGeometry
  let totalVerts = 0;
  let totalIndices = 0;
  for (let g of geometriesToMerge) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : 0;
  }

  const mergedPositions = new Float32Array(totalVerts * 3);
  const mergedNormals = new Float32Array(totalVerts * 3);
  const mergedSpanU = new Float32Array(totalVerts);
  const mergedSwayParams = new Float32Array(totalVerts * 3);
  const mergedCablePhase = new Float32Array(totalVerts);
  const mergedBaseColor = new Float32Array(totalVerts * 3);
  const mergedRimBoost = new Float32Array(totalVerts);
  const vertCableIndices = new Uint8Array(totalVerts);
  const mergedIndices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let indexOffset = 0;

  for (let g of geometriesToMerge) {
    const count = g.attributes.position.count;
    const cIdx = g.userData && typeof g.userData.cableIndex === 'number' ? g.userData.cableIndex : 0;
    vertCableIndices.fill(cIdx, vertOffset, vertOffset + count);
    mergedPositions.set(g.attributes.position.array, vertOffset * 3);
    if (g.attributes.normal) {
      mergedNormals.set(g.attributes.normal.array, vertOffset * 3);
    }
    mergedSpanU.set(g.attributes.aSpanU.array, vertOffset);
    mergedSwayParams.set(g.attributes.aSwayParams.array, vertOffset * 3);
    mergedCablePhase.set(g.attributes.aCablePhase.array, vertOffset);
    mergedBaseColor.set(g.attributes.aBaseColor.array, vertOffset * 3);
    mergedRimBoost.set(g.attributes.aRimBoost.array, vertOffset);

    if (g.index) {
      const idxArr = g.index.array;
      for (let k = 0; k < idxArr.length; k++) {
        mergedIndices[indexOffset + k] = idxArr[k] + vertOffset;
      }
      indexOffset += idxArr.length;
    }

    vertOffset += count;
  }

  const mergedGeom = new THREE.BufferGeometry();
  mergedGeom.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  mergedGeom.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  mergedGeom.setAttribute('aSpanU', new THREE.BufferAttribute(mergedSpanU, 1));
  mergedGeom.setAttribute('aSwayParams', new THREE.BufferAttribute(mergedSwayParams, 3));
  mergedGeom.setAttribute('aCablePhase', new THREE.BufferAttribute(mergedCablePhase, 1));
  mergedGeom.setAttribute('aBaseColor', new THREE.BufferAttribute(mergedBaseColor, 3));
  mergedGeom.setAttribute('aRimBoost', new THREE.BufferAttribute(mergedRimBoost, 1));
  mergedGeom.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

  const cableMat = new THREE.ShaderMaterial({
    name: 'OverheadHangingCablesMaterial',
    uniforms: {
      uTime: uTimeUniform || { value: 0.0 },
      uBaseColor: { value: new THREE.Color(0x181310) },
      uRimColor: { value: new THREE.Color(0xd97706) },
      uGoldRimColor: { value: new THREE.Color(0xfbbf24) },
      fogColor: { value: new THREE.Color(0x0b0501) },
      fogDensity: { value: 0.016 },
    },
    vertexShader: `
      attribute float aSpanU;
      attribute vec3 aSwayParams;
      attribute float aCablePhase;
      attribute vec3 aBaseColor;
      attribute float aRimBoost;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vSpanU;
      varying vec3 vBaseColor;
      varying float vRimBoost;

      void main() {
        vSpanU = aSpanU;
        vNormal = normalize(normalMatrix * normal);
        vBaseColor = aBaseColor;
        vRimBoost = aRimBoost;

        // Wind sway displacement vanishing at wall anchors (aSpanU=0 or 1)
        float sagWeight = 4.0 * aSpanU * (1.0 - aSpanU);
        float swayDY = sagWeight * aSwayParams.y * sin(2.0 * 3.14159265 * aSwayParams.x * uTime + aCablePhase);
        float swayDZ = sagWeight * aSwayParams.z * cos(2.0 * 3.14159265 * aSwayParams.x * uTime * 0.85 + aCablePhase + 0.6);

        vec3 displacedPos = position + vec3(0.0, swayDY, swayDZ);
        vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform vec3 uGoldRimColor;
      uniform vec3 fogColor;
      uniform float fogDensity;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vSpanU;
      varying vec3 vBaseColor;
      varying float vRimBoost;

      void main() {
        // Upward underside rim lighting catching warm dark-amber & gold rim from fixtures below
        float downNormal = clamp(-vNormal.y, 0.0, 1.0);
        float sideRim = clamp(1.0 - abs(vNormal.y), 0.0, 1.0) * 0.32;
        float rimFactor = clamp(downNormal + sideRim * max(0.0, vRimBoost - 1.0), 0.0, 1.0);
        vec3 rim = mix(uRimColor, uGoldRimColor, downNormal) * rimFactor * 0.75 * vRimBoost;

        // Subtle cyber-amber pulse for nodes (vRimBoost >= 1.50)
        float cyberPulse = step(1.50, vRimBoost) * (0.14 + 0.06 * sin(uTime * 3.2 + vSpanU * 25.0));
        vec3 col = vBaseColor + rim + uGoldRimColor * cyberPulse;

        // Exponential squared depth fog
        float dist = length(vWorldPos.xz);
        float fogFactor = 1.0 - exp(-pow(dist * fogDensity, 2.0));
        col = mix(col, fogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: true,
    depthWrite: true,
  });

  if (applyStencilReject) applyStencilReject(cableMat);

  const batchMesh = new THREE.Mesh(mergedGeom, cableMat);
  batchMesh.name = 'OverheadHangingCablesBatchMesh';
  batchMesh.frustumCulled = false;
  batchMesh.renderOrder = 4;
  batchMesh.raycast = () => {};
  mergedGeom.userData.vertCableIndices = vertCableIndices;
  batchMesh.userData.cables = cables;
  rootGroup.add(batchMesh);

  // Compute subsystem metrics & counts
  const varietyCounts = {
    [OVERHEAD_WIRE_VARIETIES.VARIETY_01_HEAVY_SINGLE_CONDUIT]: 0,
    [OVERHEAD_WIRE_VARIETIES.VARIETY_02_MULTI_STRAND_HARNESS]: 0,
    [OVERHEAD_WIRE_VARIETIES.VARIETY_03_COILED_SERVICE_DROP]: 0,
    [OVERHEAD_WIRE_VARIETIES.VARIETY_04_BRAIDED_HELIX_CYBER_LINE]: 0,
  };
  const verticalTierCounts = {
    [OVERHEAD_VERTICAL_TIERS.LOW_TIER]: 0,
    [OVERHEAD_VERTICAL_TIERS.MID_TIER]: 0,
    [OVERHEAD_VERTICAL_TIERS.HIGH_TIER]: 0,
    [OVERHEAD_VERTICAL_TIERS.DIAGONAL_SLOPE]: 0,
  };

  let minAnchorY = Infinity;
  let maxAnchorY = -Infinity;
  let minClearanceY = Infinity;
  let minCurveY = Infinity;
  let minMidSpanY = Infinity;
  let maxMidSpanY = -Infinity;

  for (let c of cables) {
    if (varietyCounts[c.variety] !== undefined) varietyCounts[c.variety]++;
    if (verticalTierCounts[c.verticalTier] !== undefined) verticalTierCounts[c.verticalTier]++;

    const anchorLow = Math.min(c.yL, c.yR);
    const anchorHigh = Math.max(c.yL, c.yR);
    if (anchorLow < minAnchorY) minAnchorY = anchorLow;
    if (anchorHigh > maxAnchorY) maxAnchorY = anchorHigh;
    if (c.lowestElementY < minClearanceY) minClearanceY = c.lowestElementY;
    if (c.minY < minCurveY) minCurveY = c.minY;
    if (c.midSpanY < minMidSpanY) minMidSpanY = c.midSpanY;
    if (c.midSpanY > maxMidSpanY) maxMidSpanY = c.midSpanY;
  }

  minAnchorY = Number(minAnchorY.toFixed(2));
  maxAnchorY = Number(maxAnchorY.toFixed(2));
  const anchorVerticalSpan = Number((maxAnchorY - minAnchorY).toFixed(2));
  minClearanceY = Number(minClearanceY.toFixed(2));
  minCurveY = Number(minCurveY.toFixed(2));
  minMidSpanY = Number(minMidSpanY.toFixed(2));
  maxMidSpanY = Number(maxMidSpanY.toFixed(2));
  const midSpanVerticalSpread = Number((maxMidSpanY - minMidSpanY).toFixed(2));

  // Fail-fast verification gate
  if (cables.length !== 20) {
    throw new Error(`Expected exactly 20 overhead cables, got ${cables.length}`);
  }
  if (cables[0].zL < 0.80 || cables[0].zL > 2.20) {
    throw new Error(`OVERHEAD_CABLE_01 entry anchor Z out of range: ${cables[0].zL}`);
  }
  for (let i = 15; i < 20; i++) {
    if (cables[i].zL <= 44.0) {
      throw new Error(`${cables[i].id} expected past alleyway end (Z > 44.0m), got ${cables[i].zL}`);
    }
  }
  if (cables[19].zL < 55.0) {
    throw new Error(`OVERHEAD_CABLE_20 expected Z >= 55.0m, got ${cables[19].zL}`);
  }

  // Variety counts verification (5 each)
  for (const [vKey, vCount] of Object.entries(varietyCounts)) {
    if (vCount !== 5) {
      throw new Error(`Expected exactly 5 instances of variety ${vKey}, got ${vCount}`);
    }
  }

  // Verticality tier counts verification (5 each)
  for (const [tKey, tCount] of Object.entries(verticalTierCounts)) {
    if (tCount !== 5) {
      throw new Error(`Expected exactly 5 instances of vertical tier ${tKey}, got ${tCount}`);
    }
  }

  // Zero adjacent repetition verification
  for (let i = 1; i < cables.length; i++) {
    if (cables[i].variety === cables[i - 1].variety) {
      throw new Error(`Adjacent cables ${cables[i - 1].id} and ${cables[i].id} share the same variety: ${cables[i].variety}`);
    }
    if (cables[i].verticalTier === cables[i - 1].verticalTier) {
      throw new Error(`Adjacent cables ${cables[i - 1].id} and ${cables[i].id} share the same vertical tier: ${cables[i].verticalTier}`);
    }
  }

  // Downward catenary sag, headroom clearance & wall coping verification
  for (let c of cables) {
    if (c.midSpanY >= Math.min(c.yL, c.yR)) {
      throw new Error(`${c.id} catenary curve did not sag downward: midSpanY=${c.midSpanY}, min(yL,yR)=${Math.min(c.yL, c.yR)}`);
    }
    if (c.minY < 2.38) {
      throw new Error(`${c.id} violated headroom clearance minY >= 2.38m: minY=${c.minY}`);
    }
    if (c.lowestElementY < 2.38) {
      throw new Error(`${c.id} violated lowest element clearance >= 2.38m: lowestElementY=${c.lowestElementY}`);
    }

    // Back-alley wall coping checks (Spec 027 §3)
    if (c.zR >= 45.0 && c.zR <= 51.0 && c.yR > 3.24) {
      throw new Error(`${c.id} right anchor yR=${c.yR} exceeds back-alley wall coping 3.24m at zR=${c.zR}`);
    }
    if (c.zR > 51.0 && c.zR <= 53.5 && c.yR > 4.23) {
      throw new Error(`${c.id} right anchor yR=${c.yR} exceeds courtyard wall coping 4.23m at zR=${c.zR}`);
    }
    if (c.zR > 55.5 && c.yR > 3.68) {
      throw new Error(`${c.id} right anchor yR=${c.yR} exceeds courtyard wall coping 3.68m at zR=${c.zR}`);
    }
    if (c.zL > 55.5 && c.yL > 4.81) {
      throw new Error(`${c.id} left anchor yL=${c.yL} exceeds courtyard wall coping 4.81m at zL=${c.zL}`);
    }
  }

  // Multi-tier elevation spread verification
  if (minAnchorY > 3.20 || maxAnchorY < 8.10 || maxMidSpanY < 7.40) {
    throw new Error(`Vertical elevation spread violation: minAnchorY=${minAnchorY} (expected <= 3.20), maxAnchorY=${maxAnchorY} (expected >= 8.10), maxMidSpanY=${maxMidSpanY} (expected >= 7.40)`);
  }

  function update(dt, timeSec) {
    if (cableMat.uniforms.uTime) {
      cableMat.uniforms.uTime.value = timeSec;
    }
  }

  function sampleCablePoint(idOrIndex, u, timeSec = 0.0) {
    const record = typeof idOrIndex === 'number' ? cables[idOrIndex - 1] : cablesById[idOrIndex];
    if (!record) return null;
    return evaluateOverheadCableCatenaryPoint(record, u, timeSec);
  }

  function getState() {
    return {
      cables,
      count: cables.length,
      varietyCounts,
      verticalTierCounts,
      minAnchorY,
      maxAnchorY,
      anchorVerticalSpan,
      minClearanceY,
      minCurveY,
      minMidSpanY,
      maxMidSpanY,
      midSpanVerticalSpread,
      schedule,
    };
  }

  return {
    cables,
    cablesById,
    batchMesh,
    material: cableMat,
    schedule,
    count: cables.length,
    varietyCounts,
    verticalTierCounts,
    minAnchorY,
    maxAnchorY,
    anchorVerticalSpan,
    minClearanceY,
    minCurveY,
    minMidSpanY,
    maxMidSpanY,
    midSpanVerticalSpread,
    update,
    sampleCablePoint,
    getState,
  };
}
