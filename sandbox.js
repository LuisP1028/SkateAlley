import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { buildMathHologramPods, HOLO_POD_PALETTE, HOLO_POD_SPECS } from './math_pods.js?v=041';
import { WALK_THROUGH_GLITCH_SPEC, evaluatePodWalkThroughGlitch } from './math_pods.js?v=041';
import {
  createMathPodPopupManager,
  MathPodPopupCallout,
  MATHPOD_CALLOUT_PROFILES,
  CALLOUT_PALETTE_THEMES,
  UNIVERSAL_ASSET_CALLOUT_PRESETS,
} from './mathpod_popup.js?v=041';
import {
  buildWaterColorGallerySystem,
  buildWaterColorSkyboxSystem,
  WATERCOLOR_PALETTE,
  WATERCOLOR_DEFAULT_PARAMS,
  WATERCOLOR_GALLERY_SPEC,
  WATERCOLOR_SKYBOX_SPEC,
  computeSliderFillPercent,
} from './watercolor_shader.js';
import {
  BINARY_TRAIL_PALETTE,
  RUNNING_EFFECTS_SPEC,
  evaluateRunningModeIntensity,
  buildRunningEffectsSubsystem,
  HOLO_SCREEN_GLITCH_FLICKER_SPEC,
  evaluateHologramScreenFlickerAndGlitch,
  createScreenMountHolographicMaterial,
  createScreenMountSlightDiffusiveGlowMaterial,
  updateWallMountHolographicParity,
  CHARACTER_SHADOW_SPEC,
  collectActiveSceneLightSources,
  evaluateLightResponsiveShadowAtPosition,
  buildCharacterLightResponsiveShadowSubsystem,
  OVERHEAD_WIRE_VARIETIES,
  OVERHEAD_VERTICAL_TIERS,
  OVERHEAD_CABLE_SCHEDULE,
  evaluateOverheadCableCatenaryPoint,
  buildOverheadHangingCablesSubsystem,
} from './alley_atmosphere_023.js';
import {
  RadialMenu,
  createCyberRadialMenuHUD,
  DEFAULT_CYBER_MENU_ITEMS,
  CENTRAL_HUB_EMBLEM,
  FULL_CIRCLE,
  START_ANGLE,
  degToRad,
  radToDeg,
  polarToCartesian,
  slicePath,
  computeRadialDimensions,
  computeSectorAngles,
  computeSectorCornerBrackets,
  computeInnerArcTicks,
  computePayloadLayout,
  getTelemetryDensityTier,
  computeSliceVisualState,
  computeReticleBox,
  computeCentralHubState,
  resolvePolarHitSector,
  harmonizeEmblemPixelBuffer,
  renderRadialMenuSVGMarkup,
} from './radial_menu_hud.js?v=034';
import {
  buildHologramColumnsSystem,
  HOLO_MEDIA_MANIFEST,
  HOLO_MEDIA_BY_ID,
  HOLO_SPECTRAL_TINT_PRESETS,
  HOLO_LIFECYCLE_STATES,
  HOLO_GLITCH_MODES,
  HOLO_DEFAULT_RUNTIME_PARAMS,
  resolveHoloMediaSpec,
  computeHologramColumnGeometrySpec,
  createHoloMediaTextureController,
  evaluateHologramPixelPreProcessing,
  evaluateSteadyStateHologramOptics,
  evaluateHologramGlitchDynamics,
  evaluateLifecycleStateEnvelope,
  createHologramColumnShaderMaterial,
  createHologramColumnInstance,
  HoloVideoStreamController,
} from './hologram_columns.js?v=041';

import {
  STICKER_ASSET_MANIFEST,
  STICKER_ASSET_BY_ID,
  STICKER_BORDER_MODES,
  STICKER_PLACEMENT_MODES,
  STICKER_DEFAULT_MATERIAL_PARAMS,
  resolveStickerAssetSpec,
  computeStickerGeometrySpec,
  evaluateStickerTriZoneClassification,
  evaluateStickerFoilMaskDerivation,
  evaluateHolographicStickerOptics,
  evaluateDieCutBorderVisualMode,
  evaluateStickerIdleShimmer,
  createStickerTextureBundleController,
  createHolographicStickerShaderMaterial,
  createHolographicStickerInstance,
  buildHolographicStickersSystem,
} from './holographic_stickers.js';
import {
  HOLO_SIGN_MANIFEST,
  HOLO_SIGN_BY_ID,
  HOLO_SIGN_WORD_BRANCHES,
  HOLO_SIGN_FAULT_TYPES,
  HOLO_SIGN_GLITCH_TYPES,
  HOLO_SIGN_PROTECTION_MODES,
  HOLO_SIGN_DEFAULT_PARAMS,
  parseHolographicSignNodeName,
  resolveHolographicSignNodeSpec,
  computeCrosswordLayoutMatrix,
  evaluateParallaxDepthStack,
  evaluateBaselineHolographicOptics,
  evaluateFlickerProfileAtTime,
  evaluateSharedIntersectionProtection,
  evaluateFlickerScheduler,
  evaluateSpatialGlitch,
  createHolographicSignShaderMaterial,
  createHolographicSignInstance,
  buildHolographicSignSystem,
} from './holographic_sign.js';
import {
  SprayPaintLoader,
  createSprayPaintLoader,
  SprayPaintAudioEngine,
  SPRAY_PAINT_TIMELINE_SPEC,
  SPRAY_LETTER_SPECS,
  SPRAY_DEFAULT_OPTIONS,
  buildChoreographedNozzleTrajectory,
  resolveLogoPixelLetterIndex,
} from './spray_paint_loader.js?v=044';

// ============================================================================
// Constants & Deterministic Configuration (functional_specification_013 & 014)
// ============================================================================
const ASSET_PATHS = {
  alley: './freeman_alley.glb',
  alarmLight: './alarm_light.glb',
  hologram: './hologram.glb',
  luisSign: './LUIS_AI_ENGINEER_SIGN.glb',
  hoodie: './LUIS_HOLOSYS_RIGGED.glb?v=044',
  hoodieHolo: './LUIS_HOLOSYS_RIGGED.glb?v=044',
  hoodieClay: './LUIS_RIGGED_CLAY.glb?v=044',
  hoodieColor: './character_hoodie.glb?v=044',
  tunic: './PLATODOOM_HOLOSYS_RIGGED.glb?v=044',
  tunicHolo: './PLATODOOM_HOLOSYS_RIGGED.glb?v=044',
  tunicColor: './character_tunic.glb?v=044',
};

// ============================================================================
// Ready Player Me (RPM) Standalone Animation Library Catalog (animation_Redo.md §3–§6)
// ============================================================================
const RPM_ANIMATION_CATALOG = Object.freeze([
  // 1. Standing Idle & Subtle Idle Variations
  Object.freeze({
    id: 'IDLE_DEFAULT',
    label: 'Standing Idle Default (M_Standing_Idle_001)',
    url: './assets/rpm/M_Standing_Idle_001.glb',
    category: 'idle',
    loop: true,
  }),
  Object.freeze({
    id: 'IDLE_BREATHING_DEEP',
    label: 'Standing Idle Deep Breathing (M_Standing_Idle_002)',
    url: './assets/rpm/M_Standing_Idle_002.glb',
    category: 'idle',
    loop: true,
  }),
  Object.freeze({
    id: 'IDLE_VARIATION_01',
    label: 'Standing Idle Weight Shift 01 (M_Standing_Idle_Variations_001)',
    url: './assets/rpm/M_Standing_Idle_Variations_001.glb',
    category: 'idle',
    loop: true,
  }),
  Object.freeze({
    id: 'IDLE_VARIATION_02',
    label: 'Standing Idle Weight Shift 02 (M_Standing_Idle_Variations_002)',
    url: './assets/rpm/M_Standing_Idle_Variations_002.glb',
    category: 'idle',
    loop: true,
  }),
  Object.freeze({
    id: 'IDLE_VARIATION_03',
    label: 'Standing Idle Look & Breathe 03 (M_Standing_Idle_Variations_003)',
    url: './assets/rpm/M_Standing_Idle_Variations_003.glb',
    category: 'idle',
    loop: true,
  }),

  // 2. Conversational / Talking & Expressive Gesture Clips (Dialogue Pool)
  Object.freeze({
    id: 'TALK_EXPLAIN',
    label: 'Talking Explain Gesture (M_Talking_Variations_001)',
    url: './assets/rpm/M_Talking_Variations_001.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.35,
  }),
  Object.freeze({
    id: 'TALK_EMPHASIS',
    label: 'Talking Emphatic Hand Gesture (M_Talking_Variations_002)',
    url: './assets/rpm/M_Talking_Variations_002.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.25,
  }),
  Object.freeze({
    id: 'TALK_SUBTLE',
    label: 'Talking Subtle Conversational (M_Talking_Variations_003)',
    url: './assets/rpm/M_Talking_Variations_003.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.40,
  }),
  Object.freeze({
    id: 'TALK_CONVERSATION_04',
    label: 'Talking Open Palm Gesture (M_Talking_Variations_004)',
    url: './assets/rpm/M_Talking_Variations_004.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.15,
  }),
  Object.freeze({
    id: 'TALK_CONVERSATION_05',
    label: 'Talking Articulated Explanation (M_Talking_Variations_005)',
    url: './assets/rpm/M_Talking_Variations_005.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.20,
  }),
  Object.freeze({
    id: 'TALK_CONVERSATION_06',
    label: 'Talking Cadence & Head Nod (M_Talking_Variations_006)',
    url: './assets/rpm/M_Talking_Variations_006.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.20,
  }),
  Object.freeze({
    id: 'ACKNOWLEDGE',
    label: 'Standing Acknowledge / Greeting (M_Standing_Expressions_001)',
    url: './assets/rpm/M_Standing_Expressions_001.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 1.00,
  }),
  Object.freeze({
    id: 'EXPRESS_WAVE',
    label: 'Standing Friendly Wave (M_Standing_Expressions_002)',
    url: './assets/rpm/M_Standing_Expressions_002.glb',
    category: 'expression',
    loop: false,
    dialogueWeight: 0.75,
  }),
  Object.freeze({
    id: 'EXPRESS_NOD',
    label: 'Standing Thoughtful Nod (M_Standing_Expressions_004)',
    url: './assets/rpm/M_Standing_Expressions_004.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 0.95,
  }),
  Object.freeze({
    id: 'EXPRESS_SHRUG',
    label: 'Standing Expressive Shrug (M_Standing_Expressions_005)',
    url: './assets/rpm/M_Standing_Expressions_005.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 0.90,
  }),
  Object.freeze({
    id: 'EXPRESS_POINT',
    label: 'Standing Point & Explain (M_Standing_Expressions_006)',
    url: './assets/rpm/M_Standing_Expressions_006.glb',
    category: 'dialogue',
    loop: false,
    dialogueWeight: 0.95,
  }),
  Object.freeze({
    id: 'EXPRESS_EXCITED',
    label: 'Standing Excited Gesture (M_Standing_Expressions_007)',
    url: './assets/rpm/M_Standing_Expressions_007.glb',
    category: 'expression',
    loop: false,
    dialogueWeight: 0.80,
  }),
  Object.freeze({
    id: 'EXPRESS_THUMBS_UP',
    label: 'Standing Thumbs Up Approval (M_Standing_Expressions_008)',
    url: './assets/rpm/M_Standing_Expressions_008.glb',
    category: 'expression',
    loop: false,
    dialogueWeight: 0.80,
  }),

  // 3. Dance & Locomotion Clips
  Object.freeze({
    id: 'DANCE_DEFAULT',
    label: 'Standing Groove Dance (M_Dances_001)',
    url: './assets/rpm/M_Dances_001.glb',
    category: 'dance',
    loop: true,
  }),
  Object.freeze({
    id: 'WALK_DEFAULT',
    label: 'Locomotion Walk Cycle (M_Walk_001)',
    url: './assets/rpm/M_Walk_001.glb',
    category: 'locomotion',
    loop: true,
  }),
  Object.freeze({
    id: 'JOG_DEFAULT',
    label: 'Locomotion Jog Cycle (M_Jog_001)',
    url: './assets/rpm/M_Jog_001.glb',
    category: 'locomotion',
    loop: true,
  }),
  Object.freeze({
    id: 'SPRINT_DEFAULT',
    label: 'Locomotion Run / Sprint Cycle (M_Run_001)',
    url: './assets/rpm/M_Run_001.glb',
    category: 'locomotion',
    loop: true,
  }),
  Object.freeze({
    id: 'JUMP_DEFAULT',
    label: 'Locomotion Jump & Land (M_Walk_Jump_001)',
    url: './assets/rpm/M_Walk_Jump_001.glb',
    category: 'locomotion',
    loop: false,
  }),
  Object.freeze({
    id: 'FALL_DEFAULT',
    label: 'Airborne Falling Loop (M_Falling_Idle_002)',
    url: './assets/rpm/M_Falling_Idle_002.glb',
    category: 'locomotion',
    loop: true,
  }),
]);

const RPM_DIALOGUE_CLIP_POOL = Object.freeze(
  RPM_ANIMATION_CATALOG.filter((spec) => spec.category === 'dialogue')
);

const RPM_IDLE_VARIATION_POOL = Object.freeze([
  'IDLE_DEFAULT',
  'IDLE_VARIATION_01',
  'IDLE_VARIATION_02',
  'IDLE_VARIATION_03',
  'IDLE_BREATHING_DEEP',
]);

// Dialogue transition & chaining timing constants (animation_Redo.md §6.2)
const DIALOGUE_ENTER_CROSSFADE = 0.40; // s — within [0.3s, 0.5s] Idle -> Dialogue blend
const DIALOGUE_CHAIN_CROSSFADE = 0.50; // s — within [0.4s, 0.6s] Dialogue A -> Dialogue B mid-sentence chain
const DIALOGUE_EXIT_CROSSFADE = 0.45;  // s — within [0.4s, 0.6s] Dialogue -> Idle return blend
const CHARACTER_BIND_HIP_HEIGHT = 0.920; // m — calibrated LUIS/PLATODOOM bind-pose Hips.position.y

const GLB_VARIANT_CATALOG = {
  luis_holo: {
    key: 'luis_holo',
    label: 'LUIS_HOLOSYS_RIGGED.glb (Iridescent Holo)',
    url: ASSET_PATHS.hoodieHolo,
    characterSlot: 'hoodie',
    defaultHoloShader: true,
    baseColor: 0x00d5ff,
  },
  luis_clay: {
    key: 'luis_clay',
    label: 'LUIS_RIGGED_CLAY.glb (Clay + Holo)',
    url: ASSET_PATHS.hoodieClay,
    characterSlot: 'hoodie',
    defaultHoloShader: false,
    baseColor: 0xd6d3d1,
  },
  luis_color: {
    key: 'luis_color',
    label: 'LUIS_RIGGED.glb (Full Color + Holo)',
    url: ASSET_PATHS.hoodieColor,
    characterSlot: 'hoodie',
    defaultHoloShader: false,
    baseColor: 0xe2e8f0,
  },
  platodoom_holo: {
    key: 'platodoom_holo',
    label: 'PLATODOOM_HOLOSYS_RIGGED.glb (Iridescent Holo)',
    url: ASSET_PATHS.tunicHolo,
    characterSlot: 'tunic',
    defaultHoloShader: true,
    baseColor: 0x00d5ff,
  },
  platodoom_color: {
    key: 'platodoom_color',
    label: 'PLATODOOM_RIGGED.glb (Full Color + Holo)',
    url: ASSET_PATHS.tunicColor,
    characterSlot: 'tunic',
    defaultHoloShader: false,
    baseColor: 0xf5efe6,
  },
};

const REQUIRED_COLLIDER_NAMES = [
  'COLLIDER_FLOOR',
  'COLLIDER_WALL_L',
  'COLLIDER_WALL_R',
  'COLLIDER_BOUND_START',
  'COLLIDER_BOUND_END',
];

const REQUIRED_MARKER_NAMES = [
  'SPAWN_PLAYER',
  'SPAWN_NPC',
  'SCREEN_MOUNT_01',
  'SCREEN_MOUNT_02',
  'SCREEN_MOUNT_03',
  'SCREEN_MOUNT_04',
  'SCREEN_MOUNT_05',
  'SCREEN_MOUNT_06',
];

const WALK_SPEED = 1.65;           // m/s — matched to RPM M_Walk_001 stride
const RUN_SPEED = 4.50;            // m/s — matched to RPM M_Jog_001 / M_Run_001 stride
const WALK_BASE_STRIDE = 1.15;     // m/s at timeScale = 1.0
const RUN_BASE_STRIDE = 3.23;      // m/s at timeScale = 1.0

// Scroll-Walk Mode corridor & damping parameters (Spec 013 §3.1–§3.3 & Spec 014 §3)
const SCROLL_TERMINAL_Z = 36.00;   // m — corridor handoff past all 6 wall mounts and POD-07 (Z = 5m..36m)
const SCROLL_NPC_AVOID_HALF_SPAN = 4.20; // m — smooth corridor pass-around window half-length around SPAWN_NPC (Z=16m)
const SCROLL_NPC_AVOID_OFFSET_X = -0.68; // m — lateral clearance offset around SPAWN_NPC (+0.25m -> 0.93m separation)
const SCROLL_ACCEL_RATE = 24.0;    // m/s^2 smooth scroll acceleration into motion
const SCROLL_DECEL_RATE = 32.0;    // m/s^2 smooth scroll stopping deceleration
const SCROLL_MAX_SPEED = 24.0;     // m/s capped top travel speed during rapid 0%->100% scroll flicks
const SCROLL_RUN_THRESHOLD = 2.55; // m/s ground speed threshold to blend from Walk into Run

// Wall screen mounting & interaction parameters (Spec 014 §2–§5)
const DOCK_SCROLL_SPAN = 0.02;           // 2% scroll window after endProgress to complete 90° rotation & flush docking
const PROXIMITY_INTERACT_RADIUS = 3.50;  // m — horizontal distance threshold for 'E' interaction in Free-Roam Mode
const FOCUS_CAM_DISTANCE = 2.05;         // m — front-on camera distance along mount outward normal in Mount Focus Mode
const FOCUS_TRANSITION_DURATION = 0.36;  // s — smooth camera transition duration into/between/out of wall mounts
const CLICK_MAX_DRAG_PIXELS = 6.0;       // px — max pointer travel to distinguish a clean mount click from orbit drag
const MOUNT_BRICK_CLEARANCE = 0.22;      // m — bracket clearance along outward normal clearing scanned brick relief

// Glowing Primary-Corridor Floor-Border Neon System parameters (Spec 018 §3 & §4)
const NEON_PRIMARY_MIN_Z = 0.00;         // m — primary corridor entrance threshold Z
const NEON_PRIMARY_MAX_Z = 46.00;        // m — primary corridor cutoff Z (excludes back courtyard Z > 46m)
const NEON_INWARD_OFFSET = 0.04;         // m — inward normal clearance from brick/cobblestone wall-to-floor relief
const NEON_CORE_RADIUS = 0.016;          // m — high-luminance 3D neon inner core tube radius
const NEON_HALO_RADIUS = 0.058;          // m — soft translucent/additive outer glow halo tube radius
const NEON_CORE_COLOR_HEX = 0xfbbf24;    // #fbbf24 warm gold core (blending to #fffbeb hot center)
const NEON_HALO_COLOR_HEX = 0xf59e0b;    // #f59e0b rich amber halo (blending to #d97706 outer edge)

// Dark Amber Industrial Wall-Mounted Alarm Light Fixture parameters (Spec 019 §6)
const ALARM_LIGHT_ELEVATION_Y = 2.45;    // m — upper-wall elevation across both walls above wall mounts
const ALARM_LIGHT_MAIN_ALLEY_MAX_Z = 44.00; // m — main alleyway termination depth
const ALARM_LIGHT_DARK_AMBER_HEX = 0xb45309; // #b45309 dark burnt amber lens hue
const ALARM_LIGHT_CORE_AMBER_HEX = 0xd97706; // #d97706 glowing dark amber core hue
const ALARM_LIGHT_POINT_HEX = 0xc25e00;      // #c25e00 warm dark amber wall illumination

// Free-Roam Mode physics parameters (Spec 013 §4.2 & Spec 032 §3.3.2)
const ACCEL_RATE = 18.0;           // m/s^2 responsive acceleration smoothing
const DECEL_RATE = 22.0;           // m/s^2 responsive stopping smoothing
const TURN_SPEED = 12.0;           // rad/s smooth character yaw rotation
const JUMP_VELOCITY = 4.60;        // m/s upward launch velocity
const GRAVITY = -9.81;             // m/s^2 downward gravity

const CHAR_COLLISION_RADIUS = 0.38; // m personal collision boundary radius
const CHAR_SEPARATION_DIST = CHAR_COLLISION_RADIUS * 2.0; // 0.76m center-to-center min distance

// Over-the-Shoulder (OTS) Torso-Visible Camera Framing parameters (Spec 019 §4)
const CAM_PIVOT_HEIGHT = 1.48;     // m upper-chest / shoulder pivot height on 2.0m character so torso & head are framed
const CAM_DEFAULT_DISTANCE = 1.38; // m intimate over-the-shoulder distance framing torso, shoulders & head
const CAM_DEFAULT_PITCH = 0.05;    // rad subtle over-the-shoulder angle looking down Freeman Alley
const CAM_SHOULDER_OFFSET_X = 0.36; // m lateral right-shoulder camera offset placing torso on left-center foreground
const CAM_MIN_DISTANCE = 0.85;     // m minimum zoom distance
const CAM_MAX_DISTANCE = 6.50;     // m maximum zoom distance
const CAM_MIN_PITCH = -0.15;       // rad minimum vertical orbit angle
const CAM_MAX_PITCH = 1.35;        // rad maximum vertical orbit angle
const CAM_WALL_MARGIN = 0.22;      // m clearance margin from alley walls

const CROSSFADE_DURATION = 0.22;   // s default crossfade duration
const JUMP_CROSSFADE = 0.12;       // s rapid jump crossfade

const HOTKEY_CLIPS = {
  Digit1: 'TALK_EXPLAIN',
  Digit2: 'TALK_EMPHASIS',
  Digit3: 'TALK_SUBTLE',
  Digit4: 'DANCE_DEFAULT',
  Digit5: 'ACKNOWLEDGE',
  Digit6: 'EXPRESS_WAVE',
  Digit7: 'EXPRESS_SHRUG',
  Digit8: 'EXPRESS_POINT',
  Digit9: 'EXPRESS_THUMBS_UP',
  Digit0: 'IDLE_DEFAULT',
};

const LOOPING_CLIP_NAMES = new Set(
  RPM_ANIMATION_CATALOG.filter((spec) => spec.loop).map((spec) => spec.id).concat([
    'Idle',
    'Walk',
    'Run',
    'Sprint',
    'Fall',
    'Dance',
  ])
);

const ONCE_STATES = new Set([
  'jump',
  'pickup',
  'punch',
  'wave',
  'vault',
  'TALK_EXPLAIN',
  'TALK_EMPHASIS',
  'TALK_SUBTLE',
  'TALK_CONVERSATION_04',
  'TALK_CONVERSATION_05',
  'TALK_CONVERSATION_06',
  'ACKNOWLEDGE',
  'EXPRESS_WAVE',
  'EXPRESS_NOD',
  'EXPRESS_SHRUG',
  'EXPRESS_POINT',
  'EXPRESS_EXCITED',
  'EXPRESS_THUMBS_UP',
  'JUMP_DEFAULT',
]);

// ============================================================================
// Scroll-Driven Holographic Project Stations & Bound Wall Mounts (Spec 014 §2)
// ============================================================================
const HOLO_PROJECT_STATIONS = [
  {
    id: 'proj-01',
    index: 1,
    code: '01',
    mountName: 'SCREEN_MOUNT_01',
    wallSide: 'L',
    expectedZ: 5.00,
    expectedY: 1.75,
    expectedNormalX: 1.0,
    mountedRotationY: Math.PI / 2,
    mountedRotationDeg: 90,
    startProgress: 0.05,
    endProgress: 0.18,
    kicker: 'STATION 01 // 3D ENVIRONMENT & SPATIAL ENGINE',
    title: 'Freeman Alley Photogrammetry Pipeline',
    description:
      'Automated Blender-to-Three.js spatial pipeline converting 1.1M-polygon raw photogrammetry scans into 1:1 human-calibrated browser environments with invisible bumper-cage physics.',
    tags: ['Three.js r186', 'Blender 5.2 Python', 'UV-Locked Decimation', 'WebP 2K VRAM'],
    metrics: [
      { value: '111K', label: 'Triangles' },
      { value: '36 MB', label: 'GPU VRAM' },
      { value: '60 FPS', label: 'WebGL 2.0' },
    ],
    primaryLink: {
      label: 'Launch Environment Spec',
      url: './scene_preparation.md',
    },
    secondaryLink: {
      label: 'Inspect Blender Pipeline',
      url: './prepare_scene.py',
    },
  },
  {
    id: 'proj-02',
    index: 2,
    code: '02',
    mountName: 'SCREEN_MOUNT_02',
    wallSide: 'R',
    expectedZ: 10.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.21,
    endProgress: 0.34,
    kicker: 'STATION 02 // SKELETAL RIGGING & ANIMATION CORE',
    title: 'Ready Player Me 64-Bone Animation & Dialogue Engine',
    description:
      'Decoupled Ready Player Me (RPM) humanoid animation controller binding 24 standalone idle, conversational, and locomotion clips across dual 64-bone rigs with dynamic mid-sentence dialogue chaining.',
    tags: ['64 RPM Bones', '24 Standalone Clips', 'Dialogue State Machine', 'Crossfade Mixer'],
    metrics: [
      { value: '64', label: 'RPM Bones' },
      { value: '24', label: 'RPM Clips' },
      { value: '0.00m', label: 'Foot Slide' },
    ],
    primaryLink: {
      label: 'Explore RPM Animation Spec',
      url: './animation_Redo.md',
    },
    secondaryLink: {
      label: 'View RPM Rig Migration',
      url: './scripts/migrate_to_rpm_rig.py',
    },
  },
  {
    id: 'proj-03',
    index: 3,
    code: '03',
    mountName: 'SCREEN_MOUNT_03',
    wallSide: 'L',
    expectedZ: 15.00,
    expectedY: 1.75,
    expectedNormalX: 1.0,
    mountedRotationY: Math.PI / 2,
    mountedRotationDeg: 90,
    startProgress: 0.37,
    endProgress: 0.50,
    kicker: 'STATION 03 // GENERATIVE 3D CHARACTER STUDIO',
    title: 'HunYuan3D Orthographic Asset Studio',
    description:
      'End-to-end 3D character synthesis pipeline transforming deterministic multi-view orthographic turnarounds into watertight, articulated glTF humanoid meshes on GPU runtimes.',
    tags: ['HunYuan3D', 'PyTorch CUDA', 'Orthographic A-Pose', 'glTF 2.0 Export'],
    metrics: [
      { value: '2.00m', label: 'Human Scale' },
      { value: '100%', label: 'Watertight' },
      { value: 'Colab', label: 'GPU Engine' },
    ],
    primaryLink: {
      label: 'Open HunYuan3D Studio Code',
      url: './hunyuan3d_colab_studio.py',
    },
    secondaryLink: {
      label: 'Read Studio Specification',
      url: './functional_specification_012.md',
    },
  },
  {
    id: 'proj-04',
    index: 4,
    code: '04',
    mountName: 'SCREEN_MOUNT_04',
    wallSide: 'R',
    expectedZ: 20.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.53,
    endProgress: 0.66,
    kicker: 'STATION 04 // MULTI-MODAL VIDEO ORCHESTRATION',
    title: 'MiniMax H3 Autonomous Scene Chainer',
    description:
      'Deterministic prompt compiler and temporal scene-chaining engine maintaining character identity, keyframe lighting continuity, and voice reference sync across multi-shot sequences.',
    tags: ['MiniMax H3', 'Scene Chainer', 'Prompt Compiler', 'Voice Sync'],
    metrics: [
      { value: 'H3', label: 'Video Engine' },
      { value: '100%', label: 'Continuity' },
      { value: 'SHA-256', label: 'Asset Verify' },
    ],
    primaryLink: {
      label: 'Inspect Scene Chainer Engine',
      url: './minimax_h3_scene_chainer.py',
    },
    secondaryLink: {
      label: 'Read Generation Benchmarks',
      url: './research_minimax_h3_generation_benchmarks.md',
    },
  },
  {
    id: 'proj-05',
    index: 5,
    code: '05',
    mountName: 'SCREEN_MOUNT_05',
    wallSide: 'R',
    expectedZ: 26.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.69,
    endProgress: 0.81,
    kicker: 'STATION 05 // REAL-TIME TELEMETRY & MCP DEVTOOLS',
    title: 'Three.js MCP Live Scene Inspector',
    description:
      'Zero-latency Model Context Protocol bridge exposing live WebGL scene graphs, skeletal bone transforms, draw-call telemetry, and deterministic frame-stepping for automated verification.',
    tags: ['Three.js DevTools', 'Playwright MCP', 'GLBForge', 'Fail-Fast Audit'],
    metrics: [
      { value: '1:1', label: 'Scene Bridge' },
      { value: '0', label: 'Console Errors' },
      { value: 'Live', label: 'Telemetry' },
    ],
    primaryLink: {
      label: 'Read Three.js MCP Evaluation',
      url: './research_threejs_mcp_evaluation.md',
    },
    secondaryLink: {
      label: 'View Operational Runbook',
      url: './operational_runbook.md',
    },
  },
  {
    id: 'proj-06',
    index: 6,
    code: '06',
    mountName: 'SCREEN_MOUNT_06',
    wallSide: 'R',
    expectedZ: 32.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.84,
    endProgress: 0.95,
    kicker: 'STATION 06 // SCROLLY-TELLING TO PLAYABLE HANDOFF',
    title: 'Freeman Alley Interactive Free-Roam Sandbox',
    description:
      'Bidirectional scroll-driven corridor walk with damped acceleration that seamlessly hands off at 100% scroll into live WASD locomotion, jumping, and interactive wall mounts.',
    tags: ['Scrolly-Walk', 'Wall Mount Focus', '360° Orbit', 'Bumper Collision'],
    metrics: [
      { value: '6 / 6', label: 'Wall Mounts' },
      { value: '360°', label: 'Camera Orbit' },
      { value: '26 Tris', label: 'Collider Cage' },
    ],
    primaryLink: {
      label: 'View Functional Spec 014',
      url: './functional_specification_014.md',
    },
    secondaryLink: {
      label: 'Inspect Sandbox Runtime',
      url: './sandbox.js',
    },
  },
];

// Monotonic corridor knots mapping each station's endProgress to its exact SCREEN_MOUNT_0X Z coordinate
const CORRIDOR_PROGRESS_KNOTS = [
  { p: 0.00, z: 3.00 },
  { p: 0.18, z: 5.00 },
  { p: 0.34, z: 10.00 },
  { p: 0.50, z: 15.00 },
  { p: 0.66, z: 20.00 },
  { p: 0.81, z: 26.00 },
  { p: 0.95, z: 32.00 },
  { p: 1.00, z: SCROLL_TERMINAL_Z },
];

// ============================================================================
// Primary Corridor Floor-Border Neon Coordinate Schedule (functional_specification_018 §3)
// ============================================================================
const NEON_CORNER_VERTICES = {
  // Left Wall (-X) Primary Corridor Floor-Border Vertices (Z = 0.00m .. 46.00m)
  L_ENTRANCE_RETURN: {
    id: 'L_ENTRANCE_RETURN',
    label: 'Left Entrance Return Floor Corner',
    wallSide: 'L',
    nominalX: -3.20,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: 0.0,
    inwardNormalZ: -1.0,
  },
  L_MOUTH_00M: {
    id: 'L_MOUTH_00M',
    label: 'Left Alley Mouth Floor Corner (Z=0m)',
    wallSide: 'L',
    nominalX: -1.60,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: 1.0,
    inwardNormalZ: -1.0,
  },
  L_CORRIDOR_08M: {
    id: 'L_CORRIDOR_08M',
    label: 'Left Corridor Floor Knot (Z=8m)',
    wallSide: 'L',
    nominalX: -1.60,
    nominalY: 0.25,
    nominalZ: 8.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_16M: {
    id: 'L_CORRIDOR_16M',
    label: 'Left Corridor Floor Knot (Z=16m)',
    wallSide: 'L',
    nominalX: -1.58,
    nominalY: 0.05,
    nominalZ: 16.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_32M: {
    id: 'L_CORRIDOR_32M',
    label: 'Left Corridor Floor Knot (Z=32m)',
    wallSide: 'L',
    nominalX: -1.56,
    nominalY: 0.05,
    nominalZ: 32.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_44M: {
    id: 'L_CORRIDOR_44M',
    label: 'Left Mid-Alley Transition Floor Corner (Z=44m)',
    wallSide: 'L',
    nominalX: -1.55,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CUTOFF_46M: {
    id: 'L_CUTOFF_46M',
    label: 'Left Primary Section Cutoff Floor Corner (Z=46m)',
    wallSide: 'L',
    nominalX: -1.55,
    nominalY: 0.14,
    nominalZ: 46.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },

  // Right Wall (+X) Primary Corridor Floor-Border Vertices (Z = 0.00m .. 46.00m)
  R_ENTRANCE_RETURN: {
    id: 'R_ENTRANCE_RETURN',
    label: 'Right Entrance Return Floor Corner',
    wallSide: 'R',
    nominalX: 3.40,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: 0.0,
    inwardNormalZ: -1.0,
  },
  R_MOUTH_00M: {
    id: 'R_MOUTH_00M',
    label: 'Right Alley Mouth Floor Corner (Z=0m)',
    wallSide: 'R',
    nominalX: 1.98,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: -1.0,
    inwardNormalZ: -1.0,
  },
  R_CORRIDOR_08M: {
    id: 'R_CORRIDOR_08M',
    label: 'Right Corridor Floor Knot (Z=8m)',
    wallSide: 'R',
    nominalX: 1.90,
    nominalY: 0.25,
    nominalZ: 8.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_CORRIDOR_16M: {
    id: 'R_CORRIDOR_16M',
    label: 'Right Corridor Floor Knot (Z=16m)',
    wallSide: 'R',
    nominalX: 1.82,
    nominalY: 0.05,
    nominalZ: 16.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_CORRIDOR_32M: {
    id: 'R_CORRIDOR_32M',
    label: 'Right Corridor Floor Knot (Z=32m)',
    wallSide: 'R',
    nominalX: 1.72,
    nominalY: 0.05,
    nominalZ: 32.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_MID_INNER_44M: {
    id: 'R_MID_INNER_44M',
    label: 'Right Mid-Alley Inner Floor Corner (Z=44m)',
    wallSide: 'R',
    nominalX: 1.65,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 1.0,
  },
  R_MID_STEP_OUT_44M: {
    id: 'R_MID_STEP_OUT_44M',
    label: 'Right Mid-Alley Step-Out Floor Corner (Z=44m)',
    wallSide: 'R',
    nominalX: 3.25,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 1.0,
  },
  R_CUTOFF_46M: {
    id: 'R_CUTOFF_46M',
    label: 'Right Primary Section Cutoff Floor Corner (Z=46m)',
    wallSide: 'R',
    nominalX: 3.23,
    nominalY: 0.14,
    nominalZ: 46.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
};

const NEON_WALL_SEGMENTS_SCHEDULE = [
  // Left Wall (-X) Primary Corridor Floor Border (L-01 .. L-06)
  {
    id: 'L_Entrance_Facade_Return_Base',
    code: 'L-01',
    label: 'Left Entrance Facade Return Floor Border',
    wallSide: 'L',
    startVertexId: 'L_ENTRANCE_RETURN',
    endVertexId: 'L_MOUTH_00M',
    role: 'Left entrance threshold floor return at alley mouth',
  },
  {
    id: 'L_Corridor_Mouth_to_08m_Base',
    code: 'L-02',
    label: 'Left Corridor Mouth to 8m Floor Border',
    wallSide: 'L',
    startVertexId: 'L_MOUTH_00M',
    endVertexId: 'L_CORRIDOR_08M',
    role: 'Left wall floor border past SPAWN_PLAYER and Station 01',
  },
  {
    id: 'L_Corridor_08m_to_16m_Base',
    code: 'L-03',
    label: 'Left Corridor 8m to 16m Floor Border',
    wallSide: 'L',
    startVertexId: 'L_CORRIDOR_08M',
    endVertexId: 'L_CORRIDOR_16M',
    role: 'Left wall floor border descending to Station 03 and SPAWN_NPC',
  },
  {
    id: 'L_Corridor_16m_to_32m_Base',
    code: 'L-04',
    label: 'Left Corridor 16m to 32m Floor Border',
    wallSide: 'L',
    startVertexId: 'L_CORRIDOR_16M',
    endVertexId: 'L_CORRIDOR_32M',
    role: 'Left wall level floor border spanning Stations 04–06',
  },
  {
    id: 'L_Corridor_32m_to_44m_Base',
    code: 'L-05',
    label: 'Left Corridor 32m to 44m Floor Border',
    wallSide: 'L',
    startVertexId: 'L_CORRIDOR_32M',
    endVertexId: 'L_CORRIDOR_44M',
    role: 'Left wall floor border past scroll handoff to mid-alley corner',
  },
  {
    id: 'L_Corridor_44m_to_46m_Base',
    code: 'L-06',
    label: 'Left Corridor 44m to 46m Cutoff Floor Border',
    wallSide: 'L',
    startVertexId: 'L_CORRIDOR_44M',
    endVertexId: 'L_CUTOFF_46M',
    role: 'Left wall short terminal floor border stub at primary section cutoff',
  },

  // Right Wall (+X) Primary Corridor Floor Border (R-01 .. R-07)
  {
    id: 'R_Entrance_Facade_Return_Base',
    code: 'R-01',
    label: 'Right Entrance Facade Return Floor Border',
    wallSide: 'R',
    startVertexId: 'R_ENTRANCE_RETURN',
    endVertexId: 'R_MOUTH_00M',
    role: 'Right entrance threshold floor return at alley mouth',
  },
  {
    id: 'R_Corridor_Mouth_to_08m_Base',
    code: 'R-02',
    label: 'Right Corridor Mouth to 8m Floor Border',
    wallSide: 'R',
    startVertexId: 'R_MOUTH_00M',
    endVertexId: 'R_CORRIDOR_08M',
    role: 'Right wall floor border from alley mouth toward Station 02',
  },
  {
    id: 'R_Corridor_08m_to_16m_Base',
    code: 'R-03',
    label: 'Right Corridor 8m to 16m Floor Border',
    wallSide: 'R',
    startVertexId: 'R_CORRIDOR_08M',
    endVertexId: 'R_CORRIDOR_16M',
    role: 'Right wall floor border past Station 02 toward SPAWN_NPC',
  },
  {
    id: 'R_Corridor_16m_to_32m_Base',
    code: 'R-04',
    label: 'Right Corridor 16m to 32m Floor Border',
    wallSide: 'R',
    startVertexId: 'R_CORRIDOR_16M',
    endVertexId: 'R_CORRIDOR_32M',
    role: 'Right wall level floor border spanning Stations 04, 05, and 06',
  },
  {
    id: 'R_Corridor_32m_to_44m_Base',
    code: 'R-05',
    label: 'Right Corridor 32m to 44m Floor Border',
    wallSide: 'R',
    startVertexId: 'R_CORRIDOR_32M',
    endVertexId: 'R_MID_INNER_44M',
    role: 'Right wall floor border to mid-alley step-out inner corner',
  },
  {
    id: 'R_Mid_Alley_Step_Out_Base',
    code: 'R-06',
    label: 'Right Mid-Alley Step-Out Floor Border',
    wallSide: 'R',
    startVertexId: 'R_MID_INNER_44M',
    endVertexId: 'R_MID_STEP_OUT_44M',
    role: 'Right wall lateral floor step-out jog at Z = 44.00m',
  },
  {
    id: 'R_Step_Out_to_46m_Base',
    code: 'R-07',
    label: 'Right Step-Out to 46m Cutoff Floor Border',
    wallSide: 'R',
    startVertexId: 'R_MID_STEP_OUT_44M',
    endVertexId: 'R_CUTOFF_46M',
    role: 'Right wall short terminal floor border stub after step-out at Z = 46.00m',
  },
];

function isLoopingClip(clipName) {
  if (ONCE_STATES.has(clipName)) return false;
  return LOOPING_CLIP_NAMES.has(clipName);
}

// ============================================================================
// Ready Player Me (RPM) Standard Humanoid Hierarchy & Track Sanitizer (animation_Redo.md §5)
// ============================================================================
const RPM_REQUIRED_HUMANOID_BONES = Object.freeze([
  'Hips',
  'Spine',
  'Spine1',
  'Spine2',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
]);

const RPM_ALL_HUMANOID_BONES_SET = new Set([
  ...RPM_REQUIRED_HUMANOID_BONES,
  'LeftToe_End',
  'RightToe_End',
  'LeftHandThumb1', 'LeftHandThumb2', 'LeftHandThumb3', 'LeftHandThumb4',
  'LeftHandIndex1', 'LeftHandIndex2', 'LeftHandIndex3', 'LeftHandIndex4',
  'LeftHandMiddle1', 'LeftHandMiddle2', 'LeftHandMiddle3', 'LeftHandMiddle4',
  'LeftHandRing1', 'LeftHandRing2', 'LeftHandRing3', 'LeftHandRing4',
  'LeftHandPinky1', 'LeftHandPinky2', 'LeftHandPinky3', 'LeftHandPinky4',
  'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3', 'RightHandThumb4',
  'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3', 'RightHandIndex4',
  'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3', 'RightHandMiddle4',
  'RightHandRing1', 'RightHandRing2', 'RightHandRing3', 'RightHandRing4',
  'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3', 'RightHandPinky4',
]);

function normalizeRPMBoneName(rawName) {
  if (typeof rawName !== 'string' || !rawName) return '';
  let cleaned = rawName.trim();
  const pipeIdx = cleaned.lastIndexOf('|');
  if (pipeIdx !== -1) {
    cleaned = cleaned.slice(pipeIdx + 1);
  }
  cleaned = cleaned.replace(/^mixamorig:?/i, '');
  cleaned = cleaned.replace(/^Armature[_.:]?/i, '');
  return cleaned;
}

function sanitizeRPMAnimationClip(rawClip, spec) {
  if (!rawClip) {
    raiseFatalError(`Missing raw AnimationClip for RPM asset '${spec?.id || 'unknown'}'.`);
  }
  const clip = rawClip.clone();
  clip.name = spec.id;
  clip.userData = {
    semanticId: spec.id,
    label: spec.label,
    url: spec.url,
    category: spec.category,
    loop: Boolean(spec.loop),
    dialogueWeight: spec.dialogueWeight || 1.0,
  };

  const sanitizedTracks = [];
  for (const track of clip.tracks) {
    const dotIdx = track.name.lastIndexOf('.');
    if (dotIdx === -1) continue;
    const rawTarget = track.name.slice(0, dotIdx);
    const propName = track.name.slice(dotIdx + 1);
    const boneName = normalizeRPMBoneName(rawTarget);

    if (!RPM_ALL_HUMANOID_BONES_SET.has(boneName)) {
      // Ignore non-humanoid auxiliary nodes (e.g., Right_Hand_Hold, Left_Hand_Hold, Armature)
      continue;
    }

    if (propName === 'quaternion') {
      const clonedTrack = track.clone();
      clonedTrack.name = `${boneName}.quaternion`;
      sanitizedTracks.push(clonedTrack);
    } else if (propName === 'position' && boneName === 'Hips') {
      // Root/Hip Translation Handling (animation_Redo.md §5.2):
      // Lock horizontal X/Z to in-place 0.0 and calibrate vertical Y from RPM reference height (~1.015m)
      // to the character's bind-pose hip height (0.920m) so characters never float, sink, or drift out of capsule.
      const clonedTrack = track.clone();
      clonedTrack.name = 'Hips.position';
      const vals = clonedTrack.values;
      if (vals && vals.length >= 3) {
        const refHipY = vals[1] > 0.4 ? vals[1] : 1.015;
        const yScale = CHARACTER_BIND_HIP_HEIGHT / refHipY;
        for (let i = 0; i < vals.length; i += 3) {
          const rawY = vals[i + 1];
          const deltaY = rawY - refHipY;
          vals[i] = 0.0;
          // Clamp vertical displacement in Jump/Locomotion clips since character capsule Y is physics-driven
          const clampedDeltaY = spec.id === 'JUMP_DEFAULT'
            ? Math.max(-0.14, Math.min(0.06, deltaY * yScale))
            : deltaY * yScale;
          vals[i + 1] = CHARACTER_BIND_HIP_HEIGHT + clampedDeltaY;
          vals[i + 2] = 0.0;
        }
      }
      sanitizedTracks.push(clonedTrack);
    }
    // Non-Hips .position and .scale tracks are intentionally stripped to preserve custom character limb proportions
  }

  clip.tracks = sanitizedTracks;
  clip.resetDuration();
  return clip;
}

// ============================================================================
// Fail-Fast Error Handler
// ============================================================================
function raiseFatalError(message) {
  const banner = typeof document !== 'undefined' ? document.getElementById('fatal-error-banner') : null;
  const badge = typeof document !== 'undefined' ? document.getElementById('hud-status-badge') : null;
  if (banner) {
    banner.style.display = 'block';
    banner.textContent = `FATAL ERROR: ${message}`;
  }
  if (badge) {
    badge.textContent = 'FATAL ERROR';
    badge.classList.add('error');
  }
  if (typeof window !== 'undefined' && window.__SANDBOX__) {
    window.__SANDBOX__.error = message;
    window.__SANDBOX__.ready = false;
  }
  throw new Error(message);
}

// ============================================================================
// Scene, Camera & Renderer Initialization
// ============================================================================
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
  window.scrollTo(0, 0);
}

const container = typeof document !== 'undefined' ? document.getElementById('viewport-container') : null;
if (typeof document !== 'undefined' && !container) {
  raiseFatalError('Missing #viewport-container DOM element.');
}

const DEPTH_FOG_COLOR_HEX = 0x0b0501; // #0b0501 dark umber/black within [#050300, #120902] (SFX.md §2.1)
const DEPTH_FOG_DENSITY = 0.0085;     // Open corridor visibility so distant assets and walls remain visible along the full 58m alley

const scene = new THREE.Scene();
scene.name = 'FreemanAlleySandboxScene';
scene.background = new THREE.Color(0x080401);
scene.fog = new THREE.FogExp2(DEPTH_FOG_COLOR_HEX, DEPTH_FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(
  60,
  typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.0,
  0.1,
  450.0
);
camera.name = 'ThirdPersonOrbitCamera';

let renderer = null;
if (typeof window !== 'undefined' && typeof document !== 'undefined' && container) {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    stencil: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  container.appendChild(renderer.domElement);

  // Expose globals required by threejs-devtools-mcp
  window.__THREE_SCENE__ = scene;
  window.__THREE_RENDERER__ = renderer;
  window.__THREE_CAMERA__ = camera;
  window.THREE = THREE;
}

// ============================================================================
// Nocturnal / Nighttime Illumination Rig (Bounded <= 10 Active PointLights, Spec 020 §4)
// ============================================================================
const ambientLight = new THREE.AmbientLight(0x1e2f4d, 0.40);
ambientLight.name = 'SandboxNightAmbientLight';
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x2563eb, 0.52);
hemiLight.groundColor.setHex(0x120902);
hemiLight.name = 'SandboxNightHemisphereLight';
hemiLight.position.set(0, 25, 10);
scene.add(hemiLight);

const dirLightMain = new THREE.DirectionalLight(0x60a5fa, 0.64);
dirLightMain.name = 'SandboxMoonlightKeyLight';
dirLightMain.position.set(4.0, 22.0, 8.0);
scene.add(dirLightMain);

const dirLightRim = new THREE.DirectionalLight(0x38bdf8, 0.42);
dirLightRim.name = 'SandboxMoonlightRimLight';
dirLightRim.position.set(-4.0, 15.0, -10.0);
scene.add(dirLightRim);

const alleyNightLightsGroup = new THREE.Group();
alleyNightLightsGroup.name = 'AlleyNightStreetLights';
const courtyardWarmLantern = new THREE.PointLight(0xff9f43, 6.0, 20.0, 1.6);
courtyardWarmLantern.name = 'CourtyardWarmLantern';
courtyardWarmLantern.position.set(0.2, 3.4, 59.5);
alleyNightLightsGroup.add(courtyardWarmLantern);

// Entrance Street Lamppost Light Fixture ("Cone Light" SpotLight)
// Exact lamp-head glass lantern housing inside VISUAL_ALLEY_MESH:
// Three.js local/world (scale 1.0): (X = +4.1759, Y = +7.7648, Z = -4.0443)
// Exact float: (4.1758566, 7.7647595, -4.0442681)
const ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS = Object.freeze({
  x: 4.1758566,
  y: 7.7647595,
  z: -4.0442681,
});
const ENTRANCE_LAMPPOST_DEFAULT_TARGET = Object.freeze({
  x: 0.40,
  y: 0.00,
  z: 1.50,
});
const entranceLamppostLight = new THREE.SpotLight(0xffaa44, 18.0, 26.0, 0.56, 0.52, 1.45);
entranceLamppostLight.name = 'EntranceStreetLamppostLight';
entranceLamppostLight.position.set(
  ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.x,
  ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.y,
  ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.z
);
entranceLamppostLight.target.name = 'EntranceStreetLamppostTarget';
entranceLamppostLight.target.position.set(
  ENTRANCE_LAMPPOST_DEFAULT_TARGET.x,
  ENTRANCE_LAMPPOST_DEFAULT_TARGET.y,
  ENTRANCE_LAMPPOST_DEFAULT_TARGET.z
);
alleyNightLightsGroup.add(entranceLamppostLight);
alleyNightLightsGroup.add(entranceLamppostLight.target);
scene.add(alleyNightLightsGroup);

const characterFollowLight = new THREE.PointLight(0x7dd3fc, 1.85, 8.0, 1.75);
characterFollowLight.name = 'CharacterNightFollowLight';
scene.add(characterFollowLight);

const neonCornersRootGroup = new THREE.Group();
neonCornersRootGroup.name = 'NeonWallCornersGroup';
scene.add(neonCornersRootGroup);

const wallMountsRootGroup = new THREE.Group();
wallMountsRootGroup.name = 'WallScreenMountsGroup';
wallMountsRootGroup.renderOrder = 10;
scene.add(wallMountsRootGroup);

const alarmLightsRootGroup = new THREE.Group();
alarmLightsRootGroup.name = 'AlleyAlarmLightsGroup';
scene.add(alarmLightsRootGroup);

const entranceHologramRootGroup = new THREE.Group();
entranceHologramRootGroup.name = 'EntranceHologramTerminalGroup';
entranceHologramRootGroup.renderOrder = 10;
scene.add(entranceHologramRootGroup);

const centralHoloTerminalRootGroup = new THREE.Group();
centralHoloTerminalRootGroup.name = 'CentralHolographicTerminalGroup';
centralHoloTerminalRootGroup.renderOrder = 9;
scene.add(centralHoloTerminalRootGroup);

const sfxRootGroup = new THREE.Group();
sfxRootGroup.name = 'EnvironmentalSFXGroup';
scene.add(sfxRootGroup);

const mathPodsRootGroup = new THREE.Group();
mathPodsRootGroup.name = 'MathHologramPodsRootGroup';
mathPodsRootGroup.renderOrder = 12;
scene.add(mathPodsRootGroup);

const watercolorRootGroup = new THREE.Group();
watercolorRootGroup.name = 'WaterColorSkyboxGroup';
watercolorRootGroup.renderOrder = 2;
scene.add(watercolorRootGroup);

const runningEffectsRootGroup = new THREE.Group();
runningEffectsRootGroup.name = 'RunningEffectsGroup';
runningEffectsRootGroup.renderOrder = 11;
scene.add(runningEffectsRootGroup);

const characterShadowsRootGroup = new THREE.Group();
characterShadowsRootGroup.name = 'CharacterLightResponsiveShadowsGroup';
characterShadowsRootGroup.renderOrder = 3;
scene.add(characterShadowsRootGroup);

const overheadCablesRootGroup = new THREE.Group();
overheadCablesRootGroup.name = 'OverheadHangingCablesGroup';
overheadCablesRootGroup.renderOrder = 4;
scene.add(overheadCablesRootGroup);

const hologramColumnsRootGroup = new THREE.Group();
hologramColumnsRootGroup.name = 'HologramMediaColumnsRootGroup';
hologramColumnsRootGroup.renderOrder = 11;
scene.add(hologramColumnsRootGroup);

// Keep root groups detached from scene so 6 stickers & LUIS AI ENGINEER sign are removed from the 3D scene while preserving module exports
const holographicStickersRootGroup = new THREE.Group();
holographicStickersRootGroup.name = 'HolographicStickersRootGroup';
holographicStickersRootGroup.renderOrder = 12;

const holographicSignRootGroup = new THREE.Group();
holographicSignRootGroup.name = 'HolographicSignRootGroup';
holographicSignRootGroup.renderOrder = 13;

function applyCharacterForegroundStencilWrite(matOrArray) {
  const mats = Array.isArray(matOrArray) ? matOrArray : [matOrArray];
  for (const m of mats) {
    if (!m) continue;
    m.depthTest = true;
    m.depthWrite = true;
    m.stencilWrite = true;
    m.stencilRef = 1;
    m.stencilFunc = THREE.AlwaysStencilFunc;
    m.stencilZPass = THREE.ReplaceStencilOp;
    m.needsUpdate = true;
  }
}

function applyCharacterOcclusionStencilReject(matOrArray) {
  const mats = Array.isArray(matOrArray) ? matOrArray : [matOrArray];
  for (const m of mats) {
    if (!m) continue;
    m.depthTest = true;
    m.stencilWrite = false;
    m.stencilRef = 1;
    m.stencilFunc = THREE.NotEqualStencilFunc;
    m.needsUpdate = true;
  }
}

// ============================================================================
// 3D Wall Screen Mount & Canvas Texture Builders (Spec 014 §2 & §3, Spec 025 §4)
// ============================================================================
const REQUIRED_HOLOGRAM_SUBMESH_NAMES = Object.freeze([
  'HoloTerminal_SmokedGlassPanes',
  'HoloTerminal_HighBloomAccents',
  'HoloTerminal_StructuralFrames',
  'HoloTerminal_BezelAndTierDetails',
]);
const HOLOGRAM_NATIVE_WIDTH = 2.0734;
const HOLOGRAM_NATIVE_HEIGHT = 1.0;

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[n];
      lineCount++;
      if (lineCount >= maxLines - 1) {
        const remaining = words.slice(n).join(' ');
        ctx.fillText(
          remaining.length > 58 ? `${remaining.slice(0, 55)}...` : remaining,
          x,
          y + lineCount * lineHeight
        );
        return;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

function createStandbyDockTexture(st) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Clear entire canvas to transparent (alpha = 0.0) so open-air inter-module tether gap stays unobstructed (Spec 025 §4.2)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Left and Right translucent smoked-amber glass modules separated by open-air gap x in [148, 182]
  const leftModX = 8;
  const leftModW = 140;
  const rightModX = 182;
  const rightModW = canvas.width - rightModX - 8;

  ctx.fillStyle = 'rgba(28, 16, 4, 0.18)';
  ctx.fillRect(leftModX, 8, leftModW, canvas.height - 16);
  ctx.fillRect(rightModX, 8, rightModW, canvas.height - 16);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(leftModX, 8, leftModW, canvas.height - 16);
  ctx.strokeRect(rightModX, 8, rightModW, canvas.height - 16);

  // 3 glowing horizontal tether bridge traces across the open-air gap [148, 182]
  for (let t = 0; t < 3; t++) {
    const ty = 136 + t * 24;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftModX + leftModW, ty);
    ctx.lineTo(rightModX, ty);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
  ctx.lineWidth = 1;
  for (let gx = 32; gx < canvas.width; gx += 32) {
    if (gx >= leftModX + leftModW && gx <= rightModX) continue;
    ctx.beginPath();
    ctx.moveTo(gx, 8);
    ctx.lineTo(gx, canvas.height - 8);
    ctx.stroke();
  }

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 17px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOLO-DOCK', leftModX + leftModW / 2, 148);
  ctx.fillText(st.code, leftModX + leftModW / 2, 178);

  const rightCenterX = rightModX + rightModW / 2;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${st.mountName} // STANDBY`, rightCenterX, 136);

  ctx.fillStyle = '#fde68a';
  ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`STATION ${st.code}: ${st.title}`, rightCenterX, 172);

  ctx.fillStyle = 'rgba(252, 211, 77, 0.82)';
  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(
    `Z = ${st.expectedZ.toFixed(1)}m • Y = ${st.expectedY.toFixed(2)}m • NORMAL ${st.wallSide === 'L' ? '+X' : '-X'}`,
    rightCenterX,
    206
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createProjectScreenTexture(st) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Clear entire canvas to transparent (alpha = 0.0) so open-air inter-module tether gap stays unobstructed (Spec 025 §4.2)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Translucent smoked-amber glass backing for left & right modules (alpha <= 0.24)
  // Matches hologram.glb's left module [-1.0367, -0.4367], open gap [-0.4367, -0.2967], right module [-0.2967, +1.0367]
  const gapLeftX = 296;
  const gapRightX = 365;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0.0, 'rgba(36, 18, 4, 0.22)');
  grad.addColorStop(0.5, 'rgba(62, 30, 6, 0.20)');
  grad.addColorStop(1.0, 'rgba(42, 20, 4, 0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(10, 10, gapLeftX - 10, canvas.height - 20);
  ctx.fillRect(gapRightX, 10, canvas.width - gapRightX - 10, canvas.height - 20);

  // Scanline & coordinate grid texture inside left & right modules only
  ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
  for (let y = 12; y < canvas.height - 12; y += 6) {
    ctx.fillRect(12, y, gapLeftX - 14, 2);
    ctx.fillRect(gapRightX + 2, y, canvas.width - gapRightX - 14, 2);
  }

  // Outer illuminated frames for left & right hologram modules
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, gapLeftX - 10, canvas.height - 20);
  ctx.strokeRect(gapRightX, 10, canvas.width - gapRightX - 10, canvas.height - 20);

  // 3 glowing horizontal tether bridge traces across the open-air gap [296, 365]
  for (let t = 0; t < 3; t++) {
    const ty = 260 + t * 56;
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(gapLeftX, ty, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gapLeftX + 4, ty);
    ctx.lineTo(gapRightX - 4, ty);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(gapRightX, ty, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4 L-shaped Corner Targeting Reticles (Spec 023 §4.1)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  const cornerSize = 24;
  // tl
  ctx.beginPath();
  ctx.moveTo(14, 14 + cornerSize);
  ctx.lineTo(14, 14);
  ctx.lineTo(14 + cornerSize, 14);
  ctx.stroke();
  // tr
  ctx.beginPath();
  ctx.moveTo(canvas.width - 14 - cornerSize, 14);
  ctx.lineTo(canvas.width - 14, 14);
  ctx.lineTo(canvas.width - 14, 14 + cornerSize);
  ctx.stroke();
  // bl
  ctx.beginPath();
  ctx.moveTo(14, canvas.height - 14 - cornerSize);
  ctx.lineTo(14, canvas.height - 14);
  ctx.lineTo(14 + cornerSize, canvas.height - 14);
  ctx.stroke();
  // br
  ctx.beginPath();
  ctx.moveTo(canvas.width - 14 - cornerSize, canvas.height - 14);
  ctx.lineTo(canvas.width - 14, canvas.height - 14);
  ctx.lineTo(canvas.width - 14, canvas.height - 14 - cornerSize);
  ctx.stroke();

  // Primary Emissive Top & Bottom Neon Light Bars
  const topGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  topGrad.addColorStop(0.0, 'rgba(245, 158, 11, 0.4)');
  topGrad.addColorStop(0.18, '#fffbeb');
  topGrad.addColorStop(0.5, '#fef08a');
  topGrad.addColorStop(0.82, '#fffbeb');
  topGrad.addColorStop(1.0, 'rgba(245, 158, 11, 0.4)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(20, 6, gapLeftX - 24, 6);
  ctx.fillRect(gapRightX + 4, 6, canvas.width - gapRightX - 24, 6);
  ctx.fillRect(20, canvas.height - 12, gapLeftX - 24, 6);
  ctx.fillRect(gapRightX + 4, canvas.height - 12, canvas.width - gapRightX - 24, 6);

  // Left Module: Station Telemetry & Metrics
  ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
  ctx.fillRect(22, 26, gapLeftX - 26, 54);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 26, gapLeftX - 26, 54);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${st.mountName} [${st.code}]`, 22 + (gapLeftX - 26) / 2, 59);

  st.metrics.forEach((m, idx) => {
    const my = 112 + idx * 142;
    const mw = gapLeftX - 36;
    const mh = 118;
    ctx.fillStyle = 'rgba(54, 21, 3, 0.24)';
    ctx.fillRect(26, my, mw, mh);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, my, mw, mh);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(m.value, 26 + mw / 2, my + 54);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(m.label.toUpperCase(), 26 + mw / 2, my + 88);
  });

  // Right Module: Header bar, Kicker, Title, Description, Tags, CTA
  const rLeft = gapRightX + 18;
  const rWidth = canvas.width - rLeft - 24;

  ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
  ctx.fillRect(rLeft, 26, rWidth, 54);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rLeft, 26, rWidth, 54);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    `STATION ${st.code} OF 06 (${st.wallSide === 'L' ? 'LEFT WALL +X' : 'RIGHT WALL -X'})`,
    rLeft + 14,
    59
  );

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('[CLICK / E TO FOCUS]', rLeft + rWidth - 14, 59);

  // Kicker
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 19px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(st.kicker, rLeft, 126);

  // Title
  ctx.fillStyle = '#fffbeb';
  ctx.font = '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(st.title, rLeft, 174);

  // Description
  ctx.fillStyle = '#fde68a';
  ctx.font = '500 21px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  wrapCanvasText(ctx, st.description, rLeft, 222, rWidth, 30, 3);

  // Tags
  let tagX = rLeft;
  const tagY = 336;
  ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
  for (const tag of st.tags) {
    const tw = ctx.measureText(tag).width + 24;
    if (tagX + tw > rLeft + rWidth) break;
    ctx.fillStyle = 'rgba(69, 26, 3, 0.26)';
    ctx.fillRect(tagX, tagY, tw, 34);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.78)';
    ctx.lineWidth = 2;
    ctx.strokeRect(tagX, tagY, tw, 34);
    ctx.fillStyle = '#fde68a';
    ctx.fillText(tag, tagX + 12, tagY + 23);
    tagX += tw + 12;
  }

  // Interactive CTA card in right module
  const ctaY = 406;
  const ctaH = 112;
  ctx.fillStyle = 'rgba(217, 119, 6, 0.24)';
  ctx.fillRect(rLeft, ctaY, rWidth, ctaH);
  ctx.strokeStyle = '#fcd34d';
  ctx.lineWidth = 3;
  ctx.strokeRect(rLeft, ctaY, rWidth, ctaH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('TRANSPARENT HOLOGRAM TERMINAL', rLeft + rWidth / 2, ctaY + 46);
  ctx.fillStyle = '#fcd34d';
  ctx.font = 'bold 17px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('OPEN SPECS & CODE ↗', rLeft + rWidth / 2, ctaY + 82);

  // Footer status bar
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(252, 211, 77, 0.90)';
  ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(
    `Z: ${st.expectedZ.toFixed(2)}m // Y: ${st.expectedY.toFixed(2)}m`,
    rLeft,
    588
  );
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('● HOLOGRAM.GLB MOUNTED', rLeft + rWidth, 588);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function instantiateMountHologramHierarchy(hologramGLTF, st, screenWidth, screenHeight, rolePrefix) {
  const holoRoot = hologramGLTF.scene.clone(true);
  holoRoot.name = `${st.mountName}_${rolePrefix}_HologramRoot`;
  holoRoot.scale.set(
    screenWidth / HOLOGRAM_NATIVE_WIDTH,
    screenHeight / HOLOGRAM_NATIVE_HEIGHT,
    1.0
  );
  // Center hologram.glb's local Y in [0, 1] onto the mount's local Y origin (0.0)
  holoRoot.position.set(0.0, -0.5 * screenHeight, 0.0);

  const smokedGlassMesh = holoRoot.getObjectByName('HoloTerminal_SmokedGlassPanes');
  const highBloomMesh = holoRoot.getObjectByName('HoloTerminal_HighBloomAccents');
  const structuralFramesMesh = holoRoot.getObjectByName('HoloTerminal_StructuralFrames');
  const bezelDetailsMesh = holoRoot.getObjectByName('HoloTerminal_BezelAndTierDetails');

  if (!smokedGlassMesh || !highBloomMesh || !structuralFramesMesh || !bezelDetailsMesh) {
    raiseFatalError(
      `hologram.glb is missing one or more required sub-meshes (${REQUIRED_HOLOGRAM_SUBMESH_NAMES.join(', ')}) when staging '${st.mountName}'.`
    );
  }

  const isStandby = rolePrefix === 'Standby';

  const smokedGlassMat = new THREE.MeshStandardMaterial({
    name: `${st.mountName}_${rolePrefix}_Holo_SmokedGlass_Mat`,
    color: new THREE.Color(0x3b1d06),
    emissive: new THREE.Color(0xd97706),
    emissiveIntensity: isStandby ? 0.24 : 0.42,
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: isStandby ? 0.20 : 0.32,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    fog: false,
  });
  applyCharacterOcclusionStencilReject(smokedGlassMat);

  const highBloomMat = new THREE.MeshStandardMaterial({
    name: `${st.mountName}_${rolePrefix}_Holo_HighBloom_Neon_Mat`,
    color: new THREE.Color(0xfef08a),
    emissive: new THREE.Color(0xfbbf24),
    emissiveIntensity: isStandby ? 0.95 : 1.85,
    roughness: 0.15,
    metalness: 0.10,
    transparent: true,
    opacity: isStandby ? 0.56 : 0.88,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });
  applyCharacterOcclusionStencilReject(highBloomMat);

  const structuralFramesMat = new THREE.MeshStandardMaterial({
    name: `${st.mountName}_${rolePrefix}_Holo_CrispAmber_Frame_Mat`,
    color: new THREE.Color(0xf59e0b),
    emissive: new THREE.Color(0xd97706),
    emissiveIntensity: isStandby ? 0.52 : 1.15,
    roughness: 0.28,
    metalness: 0.45,
    transparent: true,
    opacity: isStandby ? 0.34 : 0.58,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    fog: false,
  });
  applyCharacterOcclusionStencilReject(structuralFramesMat);

  const bezelDetailsMat = new THREE.MeshStandardMaterial({
    name: `${st.mountName}_${rolePrefix}_Holo_BezelAndTier_Mat`,
    color: new THREE.Color(0xfbbf24),
    emissive: new THREE.Color(0xd97706),
    emissiveIntensity: isStandby ? 0.45 : 0.96,
    roughness: 0.26,
    metalness: 0.40,
    transparent: true,
    opacity: isStandby ? 0.30 : 0.52,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    fog: false,
  });
  applyCharacterOcclusionStencilReject(bezelDetailsMat);

  smokedGlassMesh.material = smokedGlassMat;
  highBloomMesh.material = highBloomMat;
  structuralFramesMesh.material = structuralFramesMat;
  bezelDetailsMesh.material = bezelDetailsMat;

  const subMeshList = [smokedGlassMesh, highBloomMesh, structuralFramesMesh, bezelDetailsMesh];
  for (const mesh of subMeshList) {
    mesh.renderOrder = 10;
    mesh.userData.mountName = st.mountName;
    mesh.userData.stationIndex = st.index;
    mesh.userData.isHologramSubMesh = true;
  }

  return {
    root: holoRoot,
    subMeshes: {
      smokedGlass: smokedGlassMesh,
      highBloomAccents: highBloomMesh,
      structuralFrames: structuralFramesMesh,
      bezelDetails: bezelDetailsMesh,
    },
    subMeshList,
    materials: {
      smokedGlass: smokedGlassMat,
      highBloomAccents: highBloomMat,
      structuralFrames: structuralFramesMat,
      bezelDetails: bezelDetailsMat,
    },
  };
}

function buildWallScreenMounts(markers, hologramGLTF) {
  if (!hologramGLTF || !hologramGLTF.scene) {
    raiseFatalError("Missing required 'hologram.glb' scene asset for TV wall mounts.");
  }
  for (const reqName of REQUIRED_HOLOGRAM_SUBMESH_NAMES) {
    const found = hologramGLTF.scene.getObjectByName(reqName);
    if (!found || !found.isMesh) {
      raiseFatalError(`Missing required sub-mesh '${reqName}' in hologram.glb.`);
    }
  }

  const wallMounts = [];
  const wallMountsByName = {};
  const raycastTargets = [];

  const screenWidth = 1.60;
  const screenHeight = 0.98;
  const mountDiffusedSphereGeom = new THREE.SphereGeometry(1.0, 14, 10);
  mountDiffusedSphereGeom.scale(screenWidth * 0.88, screenHeight * 0.92, 0.78);
  mountDiffusedSphereGeom.computeBoundingBox();
  mountDiffusedSphereGeom.computeBoundingSphere();

  function createScreenMountDiffusedMaterial(mountName, initialIntensity = 0.65) {
    const intensityUniform = { value: initialIntensity };
    const mat = new THREE.ShaderMaterial({
      name: `${mountName}_DiffusedLightMat`,
      uniforms: {
        uTime: holoShaderUniforms.uHoloTime,
        uDiffusionIntensity: intensityUniform,
        uIntensity: intensityUniform,
        uCoreColor: { value: new THREE.Color(0xfbbf24) },
        uOuterColor: { value: new THREE.Color(0xd97706) },
      },
      vertexShader: `
        varying vec3 vLocalNormPos;
        varying vec3 vViewNormal;
        varying vec3 vViewDir;
        void main() {
          vLocalNormPos = position / vec3(${(screenWidth * 0.88).toFixed(4)}, ${(screenHeight * 0.92).toFixed(4)}, 0.78);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uDiffusionIntensity;
        uniform vec3 uCoreColor;
        uniform vec3 uOuterColor;
        varying vec3 vLocalNormPos;
        varying vec3 vViewNormal;
        varying vec3 vViewDir;
        void main() {
          float r = clamp(length(vLocalNormPos), 0.0, 1.0);
          float radialGaussian = exp(-2.85 * r * r) * pow(1.0 - r * r, 1.65);
          float ndotv = clamp(abs(dot(normalize(vViewNormal), normalize(vViewDir))), 0.0, 1.0);
          float viewSoftness = pow(ndotv, 1.30);
          float shimmer = 0.94 + 0.06 * sin(uTime * 2.4 + vLocalNormPos.y * 3.1);
          vec3 col = mix(uCoreColor, uOuterColor, smoothstep(0.15, 0.92, r)) * shimmer;
          float alpha = clamp(0.28 * uDiffusionIntensity * radialGaussian * viewSoftness, 0.0, 0.52);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    applyCharacterOcclusionStencilReject(mat);
    return mat;
  }

  for (const st of HOLO_PROJECT_STATIONS) {
    const locatorNode = markers[st.mountName];
    if (!locatorNode) {
      raiseFatalError(`Missing required wall mount locator '${st.mountName}' in freeman_alley.glb.`);
    }

    const locatorPosition = new THREE.Vector3();
    const locatorQuaternion = new THREE.Quaternion();
    locatorNode.getWorldPosition(locatorPosition);
    locatorNode.getWorldQuaternion(locatorQuaternion);

    // In freeman_alley.glb, each SCREEN_MOUNT_0X rotates local (0, 0, -1) to its outward wall normal (+X or -X)
    const outwardNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(locatorQuaternion).normalize();

    if (
      Math.abs(locatorPosition.y - st.expectedY) > 0.08 ||
      Math.abs(locatorPosition.z - st.expectedZ) > 0.15 ||
      Math.abs(outwardNormal.x - st.expectedNormalX) > 0.05
    ) {
      raiseFatalError(
        `Locator '${st.mountName}' failed spatial validation: pos=(${locatorPosition.x.toFixed(2)}, ${locatorPosition.y.toFixed(2)}, ${locatorPosition.z.toFixed(2)}), normal=(${outwardNormal.x.toFixed(2)}, ${outwardNormal.y.toFixed(2)}, ${outwardNormal.z.toFixed(2)}).`
      );
    }

    // 1. Standby Wall Mounting Frame permanently docked at SCREEN_MOUNT_0X (State A baseline with transparent hologram.glb)
    const standbyBracketGroup = new THREE.Group();
    standbyBracketGroup.name = `WallBracket_${st.mountName}`;
    standbyBracketGroup.position.copy(locatorPosition);
    standbyBracketGroup.rotation.set(0, st.mountedRotationY, 0);

    const standbyHoloInstance = instantiateMountHologramHierarchy(
      hologramGLTF,
      st,
      screenWidth,
      screenHeight,
      'Standby'
    );
    standbyHoloInstance.root.position.set(0, -0.5 * screenHeight, MOUNT_BRICK_CLEARANCE - 0.006);
    standbyBracketGroup.add(standbyHoloInstance.root);

    const standbyTex = createStandbyDockTexture(st);
    const standbyPlateMat = new THREE.MeshBasicMaterial({
      name: `${st.mountName}_StandbyPlateMat`,
      map: standbyTex,
      transparent: true,
      opacity: 0.22,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    applyCharacterOcclusionStencilReject(standbyPlateMat);
    const standbyPlateMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(screenWidth, screenHeight),
      standbyPlateMat
    );
    standbyPlateMesh.name = `${st.mountName}_StandbyPlate`;
    standbyPlateMesh.renderOrder = 10;
    standbyPlateMesh.position.set(0, 0, MOUNT_BRICK_CLEARANCE - 0.004);
    standbyPlateMesh.userData.mountName = st.mountName;
    standbyPlateMesh.userData.stationIndex = st.index;
    standbyBracketGroup.add(standbyPlateMesh);

    const bracketWireGeom = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(screenWidth + 0.06, screenHeight + 0.06, 0.012)
    );
    const bracketWireMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.36,
      depthTest: true,
      depthWrite: false,
      fog: false,
    });
    applyCharacterOcclusionStencilReject(bracketWireMat);
    const bracketWireLines = new THREE.LineSegments(bracketWireGeom, bracketWireMat);
    bracketWireLines.name = `${st.mountName}_BracketFrameLines`;
    bracketWireLines.renderOrder = 10;
    bracketWireLines.position.set(0, 0, MOUNT_BRICK_CLEARANCE - 0.004);
    standbyBracketGroup.add(bracketWireLines);

    const standbyDiffusedMat = createScreenMountDiffusedMaterial(`${st.mountName}_Standby`, 0.28);
    const standbyDiffusedMesh = new THREE.Mesh(mountDiffusedSphereGeom, standbyDiffusedMat);
    standbyDiffusedMesh.name = `${st.mountName}_StandbyDiffusedLight`;
    standbyDiffusedMesh.renderOrder = 9;
    standbyDiffusedMesh.position.set(0, 0, MOUNT_BRICK_CLEARANCE);
    standbyDiffusedMesh.raycast = noOpRaycast;
    standbyBracketGroup.add(standbyDiffusedMesh);

    wallMountsRootGroup.add(standbyBracketGroup);

    // 2. 3D Transparent Holographic Screen Unit (Rotates ±90° and translates into SCREEN_MOUNT_0X)
    const screenGroup = new THREE.Group();
    screenGroup.name = `WallScreen_${st.mountName}`;
    screenGroup.userData.mountName = st.mountName;
    screenGroup.userData.stationIndex = st.index;

    const panelOffsetGroup = new THREE.Group();
    panelOffsetGroup.name = `${st.mountName}_PanelOffsetGroup`;
    screenGroup.add(panelOffsetGroup);

    // Instantiate the 4-submesh hologram.glb hierarchy onto this TV mount (Spec 025 §4.1–§4.3)
    const activeHoloInstance = instantiateMountHologramHierarchy(
      hologramGLTF,
      st,
      screenWidth,
      screenHeight,
      'Active'
    );
    panelOffsetGroup.add(activeHoloInstance.root);

    const screenTexture = createProjectScreenTexture(st);

    const faceMat = createScreenMountHolographicMaterial(
      st,
      screenTexture,
      holoShaderUniforms.uHoloTime,
      applyCharacterOcclusionStencilReject
    );

    // Front face (+Z local normal): faces outward into corridor (+X on L, -X on R) when mounted at ±90°
    const frontFaceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(screenWidth, screenHeight),
      faceMat
    );
    frontFaceMesh.name = `${st.mountName}_DisplayFront`;
    frontFaceMesh.renderOrder = 10;
    frontFaceMesh.position.set(0, 0, 0.008);
    frontFaceMesh.userData.mountName = st.mountName;
    frontFaceMesh.userData.stationIndex = st.index;
    panelOffsetGroup.add(frontFaceMesh);

    // Back face (-Z local normal): faces approaching camera (-Z) when at 0° in corridor during State B
    const backFaceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(screenWidth, screenHeight),
      faceMat
    );
    backFaceMesh.name = `${st.mountName}_DisplayBack`;
    backFaceMesh.renderOrder = 10;
    backFaceMesh.position.set(0, 0, -0.008);
    backFaceMesh.rotation.set(0, Math.PI, 0);
    backFaceMesh.userData.mountName = st.mountName;
    backFaceMesh.userData.stationIndex = st.index;
    panelOffsetGroup.add(backFaceMesh);

    const borderWireGeom = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(screenWidth + 0.04, screenHeight + 0.04, 0.018)
    );
    const borderWireMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.72,
      depthTest: true,
      depthWrite: false,
      fog: false,
    });
    applyCharacterOcclusionStencilReject(borderWireMat);
    const borderWireLines = new THREE.LineSegments(borderWireGeom, borderWireMat);
    borderWireLines.name = `${st.mountName}_BorderLines`;
    borderWireLines.renderOrder = 11;
    panelOffsetGroup.add(borderWireLines);

    // Non-conical omnidirectional/ellipsoidal slight diffused light aura radiating from the screen mount hologram
    const diffusedLightMat = createScreenMountSlightDiffusiveGlowMaterial(
      st.mountName,
      holoShaderUniforms.uHoloTime,
      applyCharacterOcclusionStencilReject
    );
    const diffusedLightMesh = new THREE.Mesh(mountDiffusedSphereGeom, diffusedLightMat);
    diffusedLightMesh.name = `${st.mountName}_DiffusedLightVolume`;
    diffusedLightMesh.renderOrder = 9;
    diffusedLightMesh.position.set(0, 0, 0);
    diffusedLightMesh.raycast = noOpRaycast;
    panelOffsetGroup.add(diffusedLightMesh);

    wallMountsRootGroup.add(screenGroup);

    // 3. Diffused wall glow state proxy (non-conical radial diffusion)
    const wallGlowLight = {
      name: `MountGlowLight_${st.mountName}`,
      intensity: 0.22,
      isConical: false,
      diffusionType: 'radial-ellipsoidal',
      position: locatorPosition.clone().addScaledVector(outwardNormal, 0.45),
    };

    raycastTargets.push(
      ...activeHoloInstance.subMeshList,
      ...standbyHoloInstance.subMeshList,
      frontFaceMesh,
      backFaceMesh,
      standbyPlateMesh
    );

    const mountRecord = {
      mountName: st.mountName,
      station: st,
      wallSide: st.wallSide,
      locatorNode,
      locatorPosition: locatorPosition.clone(),
      outwardNormal: outwardNormal.clone(),
      mountedRotationY: st.mountedRotationY,
      mountedRotationDeg: st.mountedRotationDeg,
      state: 'standby', // 'standby' (State A) | 'showcase' (State B) | 'docking' | 'mounted' (State C)
      isMounted: false,
      mountProgress: 0.0,
      currentRotationY: 0.0,
      currentRotationDeg: 0.0,
      currentWorldNormal: new THREE.Vector3(0, 0, -1),
      hasHologramMesh: true,
      isTransparentHologram: true,
      hologramAssetUrl: ASSET_PATHS.hologram,
      hologramRoot: activeHoloInstance.root,
      standbyHologramRoot: standbyHoloInstance.root,
      hologramSubMeshes: activeHoloInstance.subMeshes,
      hologramMaterials: activeHoloInstance.materials,
      standbyHologramMaterials: standbyHoloInstance.materials,
      glassOpacity: 0.32,
      standbyOpacity: 0.20,
      depthWrite: false,
      unifiedMaterialType: 'UnifiedHoloDisplayFaceShader',
      hasHolographicEffect: true,
      holographicEffectParity: true,
      isFlickering: true,
      hasGlitchEffect: true,
      isConical: false,
      isConicalLight: false,
      diffusedGlowIntensity: 0.22,
      flickerGain: 1.0,
      glitchIntensity: 0.0,
      scanbeamY: 0.5,
      glitchBoostRemainingSec: 0.0,
      triggerGlitchSpike(durationSec = 0.18) {
        this.glitchBoostRemainingSec = Math.max(this.glitchBoostRemainingSec, durationSec);
      },
      standbyBracketGroup,
      standbyPlateMat,
      bracketWireMat,
      standbyDiffusedMesh,
      standbyDiffusedMat,
      screenGroup,
      panelOffsetGroup,
      frontFaceMesh,
      backFaceMesh,
      bezelMesh: activeHoloInstance.subMeshes.structuralFrames,
      bezelMat: activeHoloInstance.materials.structuralFrames,
      faceMat,
      borderWireMat,
      diffusedLightMesh,
      diffusedLightMat,
      diffusionType: 'radial-ellipsoidal',
      wallGlowLight,
    };

    wallMounts.push(mountRecord);
    wallMountsByName[st.mountName] = mountRecord;
  }

  return { wallMounts, wallMountsByName, raycastTargets };
}

// ============================================================================
// Glowing Primary-Corridor Floor-Border Neon System (functional_specification_018)
// ============================================================================
const noOpRaycast = () => {};

function createNeonCoreMaterial() {
  const mat = new THREE.MeshBasicMaterial({
    name: 'NeonWallCorner_CoreMaterial',
    color: new THREE.Color(NEON_CORE_COLOR_HEX), // #fbbf24 warm gold core
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    fog: true,
  });
  applyCharacterOcclusionStencilReject(mat);
  mat.userData = {
    role: 'neon-core',
    coreColorHex: '#fbbf24',
    hotCenterColorHex: '#fffbeb',
    emissiveHex: '#fbbf24',
    emissiveIntensity: 1.65,
  };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloTime = holoShaderUniforms.uHoloTime;
    shader.vertexShader =
      `varying vec3 vNeonNormal;\nvarying vec3 vNeonViewDir;\nvarying vec3 vNeonWorldPos;\n` +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vNeonNormal = normalize(normalMatrix * normal);
        vNeonViewDir = normalize(-mvPosition.xyz);
        vNeonWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vec4 biasedMvPos = mvPosition;
        float viewDist = length(mvPosition.xyz);
        if (viewDist > 0.5) {
          biasedMvPos.xyz *= max(0.86, (viewDist - 0.22) / viewDist);
        }
        gl_Position = projectionMatrix * biasedMvPos;`
      );
    shader.fragmentShader =
      `uniform float uHoloTime;\nvarying vec3 vNeonNormal;\nvarying vec3 vNeonViewDir;\nvarying vec3 vNeonWorldPos;\n` +
      shader.fragmentShader
        .replace(
          '#include <opaque_fragment>',
          `float neonCenter = clamp(abs(dot(normalize(vNeonNormal), normalize(vNeonViewDir))), 0.0, 1.0);
          float coreProfile = pow(neonCenter, 0.72);
          float pulse = 0.94 + 0.06 * sin(uHoloTime * 2.1 + vNeonWorldPos.z * 0.16);
          vec3 goldCore = vec3(0.984, 0.749, 0.141); // #fbbf24
          vec3 warmWhiteCore = vec3(1.000, 0.984, 0.922); // #fffbeb
          vec3 finalCoreRgb = mix(goldCore, warmWhiteCore, coreProfile * 0.82) * (1.08 * pulse);
          gl_FragColor = vec4(finalCoreRgb, diffuseColor.a * smoothstep(0.0, 0.28, neonCenter));`
        )
        .replace(
          '#include <fog_fragment>',
          `#ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
            #else
              float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
            #endif
            float neonFogAtten = clamp(1.0 - fogFactor * 0.58, 0.36, 1.0);
            gl_FragColor.rgb *= neonFogAtten;
            gl_FragColor.a *= neonFogAtten;
          #endif`
        );
  };
  mat.customProgramCacheKey = () => 'neon_floor_border_core_v2';
  return mat;
}

function createNeonHaloMaterial() {
  const mat = new THREE.MeshBasicMaterial({
    name: 'NeonWallCorner_HaloMaterial',
    color: new THREE.Color(NEON_HALO_COLOR_HEX), // #f59e0b rich amber outer glow
    transparent: true,
    opacity: 0.54,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    fog: true,
  });
  applyCharacterOcclusionStencilReject(mat);
  mat.userData = {
    role: 'neon-halo',
    haloColorHex: '#f59e0b',
    outerAmberColorHex: '#d97706',
    emissiveHex: '#d97706',
    emissiveIntensity: 1.20,
  };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloTime = holoShaderUniforms.uHoloTime;
    shader.vertexShader =
      `varying vec3 vNeonNormal;\nvarying vec3 vNeonViewDir;\nvarying vec3 vNeonWorldPos;\n` +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vNeonNormal = normalize(normalMatrix * normal);
        vNeonViewDir = normalize(-mvPosition.xyz);
        vNeonWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vec4 biasedMvPos = mvPosition;
        float viewDist = length(mvPosition.xyz);
        if (viewDist > 0.5) {
          biasedMvPos.xyz *= max(0.86, (viewDist - 0.22) / viewDist);
        }
        gl_Position = projectionMatrix * biasedMvPos;`
      );
    shader.fragmentShader =
      `uniform float uHoloTime;\nvarying vec3 vNeonNormal;\nvarying vec3 vNeonViewDir;\nvarying vec3 vNeonWorldPos;\n` +
      shader.fragmentShader
        .replace(
          '#include <opaque_fragment>',
          `float haloCenter = clamp(abs(dot(normalize(vNeonNormal), normalize(vNeonViewDir))), 0.0, 1.0);
          float haloFalloff = pow(haloCenter, 2.15);
          float pulse = 0.92 + 0.08 * sin(uHoloTime * 2.1 + vNeonWorldPos.z * 0.16);
          vec3 outerAmber = vec3(0.851, 0.467, 0.024); // #d97706
          vec3 richAmber = vec3(0.961, 0.620, 0.043);  // #f59e0b
          vec3 haloRgb = mix(outerAmber, richAmber, haloCenter) * (0.95 * pulse);
          gl_FragColor = vec4(haloRgb, diffuseColor.a * haloFalloff);`
        )
        .replace(
          '#include <fog_fragment>',
          `#ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
            #else
              float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
            #endif
            float neonFogAtten = clamp(1.0 - fogFactor * 0.62, 0.30, 1.0);
            gl_FragColor.rgb *= neonFogAtten;
            gl_FragColor.a *= neonFogAtten;
          #endif`
        );
  };
  mat.customProgramCacheKey = () => 'neon_floor_border_halo_v2';
  return mat;
}

function buildNeonWallCornerAccents(wallMounts) {
  neonCornersRootGroup.clear();

  const baseCornersGroup = new THREE.Group();
  baseCornersGroup.name = 'NeonBaseCornersGroup';
  const topCornersGroup = new THREE.Group();
  topCornersGroup.name = 'NeonTopCornersGroup';
  const verticalRisersGroup = new THREE.Group();
  verticalRisersGroup.name = 'NeonVerticalRisersGroup';
  const cornerJointsGroup = new THREE.Group();
  cornerJointsGroup.name = 'NeonCornerJointsGroup';

  neonCornersRootGroup.add(
    baseCornersGroup,
    topCornersGroup,
    verticalRisersGroup,
    cornerJointsGroup
  );

  const neonCoreMaterial = createNeonCoreMaterial();
  const neonHaloMaterial = createNeonHaloMaterial();

  // Compute deterministic world-space floor-border vertex positions with inward normal clearance (Spec 018 §3)
  const resolvedVertices = {};
  for (const [vid, vSpec] of Object.entries(NEON_CORNER_VERTICES)) {
    const nLen = Math.hypot(vSpec.inwardNormalX, vSpec.inwardNormalZ) || 1.0;
    const nx = vSpec.inwardNormalX / nLen;
    const nz = vSpec.inwardNormalZ / nLen;
    const worldX = Number((vSpec.nominalX + nx * NEON_INWARD_OFFSET).toFixed(4));
    const worldY = Number(vSpec.nominalY.toFixed(4));
    const worldZ = Number((vSpec.nominalZ + nz * NEON_INWARD_OFFSET).toFixed(4));
    resolvedVertices[vid] = {
      ...vSpec,
      inwardNormal: { x: nx, y: 0.0, z: nz },
      worldX,
      worldY,
      worldZ,
      baseNominal: new THREE.Vector3(vSpec.nominalX, vSpec.nominalY, vSpec.nominalZ),
      baseWorld: new THREE.Vector3(worldX, worldY, worldZ),
    };
  }

  const upAxis = new THREE.Vector3(0, 1, 0);
  const segDir = new THREE.Vector3();
  const neonSegments = [];
  const neonSegmentsByCategory = {
    base: [],
    top: [],
    riser: [],
  };

  function createNeonTubeSegment({
    id,
    code,
    label,
    category,
    wallSide,
    role,
    nominalStart,
    nominalEnd,
    worldStart,
    worldEnd,
    parentGroup,
  }) {
    const totalLength = worldStart.distanceTo(worldEnd);
    if (totalLength <= 0.05) {
      raiseFatalError(`Neon floor-border segment '${id}' has invalid non-positive length ${totalLength.toFixed(4)}m.`);
    }

    // Trim cylinder ends by core radius so corner joints meet cleanly without overlapping faces (§5.3)
    const trim = Math.min(NEON_CORE_RADIUS * 0.9, totalLength * 0.1);
    const cylLength = Math.max(0.02, totalLength - trim * 2.0);

    const midpoint = new THREE.Vector3().addVectors(worldStart, worldEnd).multiplyScalar(0.5);
    segDir.subVectors(worldEnd, worldStart).normalize();
    const orientationQuat = new THREE.Quaternion().setFromUnitVectors(upAxis, segDir);

    const segGroup = new THREE.Group();
    segGroup.name = `NeonSegment_${id}`;
    segGroup.position.copy(midpoint);
    segGroup.quaternion.copy(orientationQuat);

    const coreGeom = new THREE.CylinderGeometry(
      NEON_CORE_RADIUS,
      NEON_CORE_RADIUS,
      cylLength,
      12,
      1,
      true
    );
    coreGeom.computeBoundingBox();
    coreGeom.computeBoundingSphere();
    const coreMesh = new THREE.Mesh(coreGeom, neonCoreMaterial);
    coreMesh.name = `${id}_CoreMesh`;
    coreMesh.renderOrder = 5;
    coreMesh.frustumCulled = true;
    coreMesh.raycast = noOpRaycast;

    const haloGeom = new THREE.CylinderGeometry(
      NEON_HALO_RADIUS,
      NEON_HALO_RADIUS,
      cylLength,
      12,
      1,
      true
    );
    haloGeom.computeBoundingBox();
    haloGeom.computeBoundingSphere();
    const haloMesh = new THREE.Mesh(haloGeom, neonHaloMaterial);
    haloMesh.name = `${id}_HaloMesh`;
    haloMesh.renderOrder = 4;
    haloMesh.frustumCulled = true;
    haloMesh.raycast = noOpRaycast;

    const meta = {
      id,
      code,
      label,
      category,
      wallSide,
      role,
      nominalStart: { x: nominalStart.x, y: nominalStart.y, z: nominalStart.z },
      nominalEnd: { x: nominalEnd.x, y: nominalEnd.y, z: nominalEnd.z },
      worldStart: { x: worldStart.x, y: worldStart.y, z: worldStart.z },
      worldEnd: { x: worldEnd.x, y: worldEnd.y, z: worldEnd.z },
      length: Number(totalLength.toFixed(4)),
      coreColor: '#fbbf24',
      haloColor: '#f59e0b',
    };
    segGroup.userData = { ...meta };
    coreMesh.userData = { ...meta, layer: 'core' };
    haloMesh.userData = { ...meta, layer: 'halo' };

    segGroup.add(haloMesh, coreMesh);
    parentGroup.add(segGroup);
    segGroup.updateMatrixWorld(true);
    coreMesh.visible = false;
    haloMesh.visible = false;

    const record = {
      ...meta,
      group: segGroup,
      coreMesh,
      haloMesh,
    };
    neonSegments.push(record);
    neonSegmentsByCategory[category].push(record);
    return record;
  }

  // Strictly Lower Wall-to-Floor Borders Only in Primary Corridor Section Z in [0.00m, 46.00m] (Spec 018 §3.1 & §3.2)
  for (const segSpec of NEON_WALL_SEGMENTS_SCHEDULE) {
    const vStart = resolvedVertices[segSpec.startVertexId];
    const vEnd = resolvedVertices[segSpec.endVertexId];
    if (!vStart || !vEnd) {
      raiseFatalError(`Unknown corner vertex ID in NEON_WALL_SEGMENTS_SCHEDULE for '${segSpec.id}'.`);
    }

    createNeonTubeSegment({
      id: segSpec.id,
      code: segSpec.code,
      label: segSpec.label,
      category: 'base',
      wallSide: segSpec.wallSide,
      role: segSpec.role,
      nominalStart: vStart.baseNominal,
      nominalEnd: vEnd.baseNominal,
      worldStart: vStart.baseWorld,
      worldEnd: vEnd.baseWorld,
      parentGroup: baseCornersGroup,
    });
  }

  function buildBatchedWorldMeshesGeometry(meshes) {
    let totalVerts = 0;
    let totalIndices = 0;
    for (const m of meshes) {
      const g = m.geometry;
      totalVerts += g.attributes.position.count;
      totalIndices += g.index ? g.index.count : g.attributes.position.count;
    }
    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const indices = new Uint16Array(totalIndices);
    const vTemp = new THREE.Vector3();
    const nTemp = new THREE.Vector3();
    const normalMat = new THREE.Matrix3();
    let vOffset = 0;
    let iOffset = 0;
    for (const m of meshes) {
      m.updateMatrixWorld(true);
      normalMat.getNormalMatrix(m.matrixWorld);
      const g = m.geometry;
      const posAttr = g.attributes.position;
      const normAttr = g.attributes.normal;
      const idxAttr = g.index;
      for (let i = 0; i < posAttr.count; i++) {
        vTemp.fromBufferAttribute(posAttr, i).applyMatrix4(m.matrixWorld);
        nTemp.fromBufferAttribute(normAttr, i).applyMatrix3(normalMat).normalize();
        const dst3 = (vOffset + i) * 3;
        positions[dst3] = vTemp.x;
        positions[dst3 + 1] = vTemp.y;
        positions[dst3 + 2] = vTemp.z;
        normals[dst3] = nTemp.x;
        normals[dst3 + 1] = nTemp.y;
        normals[dst3 + 2] = nTemp.z;
      }
      const ic = idxAttr ? idxAttr.count : posAttr.count;
      for (let i = 0; i < ic; i++) {
        indices[iOffset + i] = (idxAttr ? idxAttr.getX(i) : i) + vOffset;
      }
      vOffset += posAttr.count;
      iOffset += ic;
    }
    const batched = new THREE.BufferGeometry();
    batched.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    batched.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    batched.setIndex(new THREE.BufferAttribute(indices, 1));
    batched.computeBoundingBox();
    batched.computeBoundingSphere();
    return batched;
  }

  const batchedSegCoresMesh = new THREE.Mesh(
    buildBatchedWorldMeshesGeometry(neonSegments.map((s) => s.coreMesh)),
    neonCoreMaterial
  );
  batchedSegCoresMesh.name = 'NeonBaseSegments_CoreBatch';
  batchedSegCoresMesh.renderOrder = 5;
  batchedSegCoresMesh.frustumCulled = true;
  batchedSegCoresMesh.raycast = noOpRaycast;

  const batchedSegHalosMesh = new THREE.Mesh(
    buildBatchedWorldMeshesGeometry(neonSegments.map((s) => s.haloMesh)),
    neonHaloMaterial
  );
  batchedSegHalosMesh.name = 'NeonBaseSegments_HaloBatch';
  batchedSegHalosMesh.renderOrder = 4;
  batchedSegHalosMesh.frustumCulled = true;
  batchedSegHalosMesh.raycast = noOpRaycast;

  baseCornersGroup.add(batchedSegHalosMesh, batchedSegCoresMesh);

  // Non-Flickering Spherical Floor-Border Corner Joints consolidated into 2 batch draw calls (Spec 018 §5.3 & Spec 020 §5.2)
  function buildBatchedSphereGeometry(baseSphereGeom, worldPoints) {
    const srcPos = baseSphereGeom.attributes.position;
    const srcNorm = baseSphereGeom.attributes.normal;
    const srcIdx = baseSphereGeom.index;
    const vCountPerSphere = srcPos.count;
    const iCountPerSphere = srcIdx.count;
    const numInstances = worldPoints.length;

    const positions = new Float32Array(numInstances * vCountPerSphere * 3);
    const normals = new Float32Array(numInstances * vCountPerSphere * 3);
    const indices = new Uint16Array(numInstances * iCountPerSphere);

    for (let s = 0; s < numInstances; s++) {
      const pt = worldPoints[s];
      const vBase = s * vCountPerSphere;
      for (let i = 0; i < vCountPerSphere; i++) {
        const dst3 = (vBase + i) * 3;
        positions[dst3] = srcPos.getX(i) + pt.x;
        positions[dst3 + 1] = srcPos.getY(i) + pt.y;
        positions[dst3 + 2] = srcPos.getZ(i) + pt.z;
        normals[dst3] = srcNorm.getX(i);
        normals[dst3 + 1] = srcNorm.getY(i);
        normals[dst3 + 2] = srcNorm.getZ(i);
      }
      const iBase = s * iCountPerSphere;
      for (let i = 0; i < iCountPerSphere; i++) {
        indices[iBase + i] = srcIdx.getX(i) + vBase;
      }
    }

    const batched = new THREE.BufferGeometry();
    batched.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    batched.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    batched.setIndex(new THREE.BufferAttribute(indices, 1));
    batched.computeBoundingBox();
    batched.computeBoundingSphere();
    return batched;
  }

  const jointCoreGeom = new THREE.SphereGeometry(NEON_CORE_RADIUS * 1.06, 8, 6);
  const jointHaloGeom = new THREE.SphereGeometry(NEON_HALO_RADIUS * 0.96, 8, 6);
  const neonCornerJoints = [];
  const jointWorldPts = [];

  for (const v of Object.values(resolvedVertices)) {
    const worldPt = v.baseWorld;
    const nominalPt = v.baseNominal;
    jointWorldPts.push(worldPt);

    const jointGroup = new THREE.Group();
    jointGroup.name = `NeonJoint_${v.id}_Base`;
    jointGroup.position.copy(worldPt);
    cornerJointsGroup.add(jointGroup);
    jointGroup.updateMatrixWorld(true);

    neonCornerJoints.push({
      id: `${v.id}_Base`,
      vertexId: v.id,
      level: 'base',
      wallSide: v.wallSide,
      nominalPosition: { x: nominalPt.x, y: nominalPt.y, z: nominalPt.z },
      worldPosition: { x: worldPt.x, y: worldPt.y, z: worldPt.z },
      group: jointGroup,
    });
  }

  const batchedJointCoresMesh = new THREE.Mesh(
    buildBatchedSphereGeometry(jointCoreGeom, jointWorldPts),
    neonCoreMaterial
  );
  batchedJointCoresMesh.name = 'NeonCornerJoints_CoreBatch';
  batchedJointCoresMesh.renderOrder = 5;
  batchedJointCoresMesh.frustumCulled = true;
  batchedJointCoresMesh.raycast = noOpRaycast;

  const batchedJointHalosMesh = new THREE.Mesh(
    buildBatchedSphereGeometry(jointHaloGeom, jointWorldPts),
    neonHaloMaterial
  );
  batchedJointHalosMesh.name = 'NeonCornerJoints_HaloBatch';
  batchedJointHalosMesh.renderOrder = 4;
  batchedJointHalosMesh.frustumCulled = true;
  batchedJointHalosMesh.raycast = noOpRaycast;

  cornerJointsGroup.add(batchedJointHalosMesh, batchedJointCoresMesh);
  neonCornersRootGroup.updateMatrixWorld(true);

  // Fail-Fast Spatial, Scope & Depth-Occlusion Verification Gate (Spec 018 §6 AC-02, AC-03, AC-04)
  if (
    neonSegmentsByCategory.base.length !== 13 ||
    neonSegmentsByCategory.top.length !== 0 ||
    neonSegmentsByCategory.riser.length !== 0
  ) {
    raiseFatalError(
      `Spec 018 AC-02 violation: expected base=13, top=0, riser=0 floor-border segments, found base=${neonSegmentsByCategory.base.length}, top=${neonSegmentsByCategory.top.length}, riser=${neonSegmentsByCategory.riser.length}.`
    );
  }
  if (!neonCoreMaterial.depthTest || !neonHaloMaterial.depthTest) {
    raiseFatalError(
      'Spec 018 AC-04 violation: neonCoreMaterial and neonHaloMaterial must have depthTest: true.'
    );
  }

  for (const baseSeg of neonSegmentsByCategory.base) {
    if (
      baseSeg.worldStart.z < NEON_PRIMARY_MIN_Z - 0.10 ||
      baseSeg.worldStart.z > NEON_PRIMARY_MAX_Z + 0.10 ||
      baseSeg.worldEnd.z < NEON_PRIMARY_MIN_Z - 0.10 ||
      baseSeg.worldEnd.z > NEON_PRIMARY_MAX_Z + 0.10
    ) {
      raiseFatalError(
        `Spec 018 AC-03 violation: floor-border segment '${baseSeg.id}' Z span [${baseSeg.worldStart.z}m, ${baseSeg.worldEnd.z}m] exceeds primary corridor [0.00m, 46.00m].`
      );
    }
    if (
      baseSeg.worldStart.y < 0.03 ||
      baseSeg.worldStart.y > 0.35 ||
      baseSeg.worldEnd.y < 0.03 ||
      baseSeg.worldEnd.y > 0.35
    ) {
      raiseFatalError(
        `Spec 018 AC-02 violation: floor-border segment '${baseSeg.id}' Y span [${baseSeg.worldStart.y}m, ${baseSeg.worldEnd.y}m] outside floor contour [0.03m, 0.35m].`
      );
    }
  }

  // Verify zero vertical encroachment with all 6 wall screen mounts (SCREEN_MOUNT_01..06 at Y in [1.23m, 2.27m])
  if (Array.isArray(wallMounts)) {
    for (const m of wallMounts) {
      const mountYMin = m.locatorPosition.y - 0.52;
      for (const baseSeg of neonSegmentsByCategory.base) {
        if (Math.max(baseSeg.worldStart.y, baseSeg.worldEnd.y) + NEON_HALO_RADIUS >= mountYMin) {
          raiseFatalError(
            `Neon floor-border line '${baseSeg.id}' encroaches vertically on '${m.mountName}' (mountYMin=${mountYMin.toFixed(2)}m).`
          );
        }
      }
    }
  }

  return {
    rootGroup: neonCornersRootGroup,
    baseCornersGroup,
    topCornersGroup,
    verticalRisersGroup,
    cornerJointsGroup,
    coreMaterial: neonCoreMaterial,
    haloMaterial: neonHaloMaterial,
    vertices: resolvedVertices,
    segments: neonSegments,
    segmentsByCategory: neonSegmentsByCategory,
    joints: neonCornerJoints,
  };
}

// ============================================================================
// Dark Amber Industrial Wall-Mounted Alarm Light Fixtures (Refined: Compact, Fewer, Flickering & Diffused)
// Reference Asset: https://sketchfab.com/3d-models/alarm-light-933ac2e9d1924e2a973f8692a07972af
// ============================================================================
const ALARM_LIGHT_FIXTURE_SCALE = 0.82; // Compact runtime fixture scale (combined with 0.72x GLB base scale)

const ALARM_LIGHT_FIXTURE_SCHEDULE = [
  // Fixture 01 — Front-Left Wall (Z = 7.40m, Y = 2.62m)
  {
    id: 'ALARM_LIGHT_01',
    pairIndex: 1,
    wallSide: 'L',
    nominalX: -1.60,
    y: 2.62,
    z: 7.40,
    normalX: 1.0,
    rotationY: Math.PI / 2,
  },
  // Fixture 02 — Mid-Right Wall (Z = 22.80m, Y = 2.18m — 15.4m deeper, opposite wall, distinct Y height)
  {
    id: 'ALARM_LIGHT_02',
    pairIndex: 2,
    wallSide: 'R',
    nominalX: 1.78,
    y: 2.18,
    z: 22.80,
    normalX: -1.0,
    rotationY: -Math.PI / 2,
  },
  // Fixture 03 — Far-Left Wall (Z = 38.60m, Y = 2.84m — 15.8m deeper, opposite wall, distinct Y height)
  {
    id: 'ALARM_LIGHT_03',
    pairIndex: 3,
    wallSide: 'L',
    nominalX: -1.55,
    y: 2.84,
    z: 38.60,
    normalX: 1.0,
    rotationY: Math.PI / 2,
  },
];

const alarmLightUniforms = {
  uBulbEmissiveScale: { value: 3.80 },
  uHaloOpacity: { value: 0.36 },
};

// Deterministic multi-harmonic industrial ballast & filament flicker waveform
function evaluateAlarmLightFlicker(timeSec, pairIndex = 1) {
  const p = Number(pairIndex) || 1;
  const t = timeSec + p * 1.73;
  const baseHum = 0.88 + 0.08 * Math.sin(t * 6.4) + 0.06 * Math.cos(t * 17.3);
  const sputterGate =
    Math.sin(t * 3.2 + Math.sin(t * 1.8) * 1.5) *
    Math.cos(t * 8.1 - p * 0.95);
  const rapidChatter = 0.5 + 0.5 * Math.sin(t * 46.0 + Math.cos(t * 31.0) * 2.4);
  const dropout = sputterGate > 0.54 ? 0.16 + 0.38 * rapidChatter : 1.0;
  const arcSurge = sputterGate < -0.74 ? 1.22 : 1.0;
  return Number(Math.max(0.14, Math.min(1.28, baseHum * dropout * arcSurge)).toFixed(4));
}

function mergeTwoIndexedGeometriesWithMask(geomA, geomB, offsetB = null) {
  const posA = geomA.attributes.position;
  const normA = geomA.attributes.normal;
  const idxA = geomA.index;
  const posB = geomB.attributes.position;
  const normB = geomB.attributes.normal;
  const idxB = geomB.index;

  const totalVerts = posA.count + posB.count;
  const countA = idxA ? idxA.count : posA.count;
  const countB = idxB ? idxB.count : posB.count;
  const totalIndices = countA + countB;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const partMask = new Float32Array(totalVerts);
  const indices = new Uint16Array(totalIndices);

  for (let i = 0; i < posA.count; i++) {
    const i3 = i * 3;
    positions[i3] = posA.getX(i);
    positions[i3 + 1] = posA.getY(i);
    positions[i3 + 2] = posA.getZ(i);
    normals[i3] = normA ? normA.getX(i) : 0.0;
    normals[i3 + 1] = normA ? normA.getY(i) : 1.0;
    normals[i3 + 2] = normA ? normA.getZ(i) : 0.0;
    partMask[i] = 0.0;
  }

  const ox = offsetB ? offsetB.x : 0.0;
  const oy = offsetB ? offsetB.y : 0.0;
  const oz = offsetB ? offsetB.z : 0.0;
  for (let i = 0; i < posB.count; i++) {
    const dst = posA.count + i;
    const dst3 = dst * 3;
    positions[dst3] = posB.getX(i) + ox;
    positions[dst3 + 1] = posB.getY(i) + oy;
    positions[dst3 + 2] = posB.getZ(i) + oz;
    normals[dst3] = normB ? normB.getX(i) : 0.0;
    normals[dst3 + 1] = normB ? normB.getY(i) : 1.0;
    normals[dst3 + 2] = normB ? normB.getZ(i) : 0.0;
    partMask[dst] = 1.0;
  }

  for (let i = 0; i < countA; i++) {
    indices[i] = idxA ? idxA.getX(i) : i;
  }
  for (let i = 0; i < countB; i++) {
    indices[countA + i] = (idxB ? idxB.getX(i) : i) + posA.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('aPartMask', new THREE.BufferAttribute(partMask, 1));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function buildAlleyAlarmLightFixtures(alarmLightGLTF, visualAlleyMesh) {
  if (!alarmLightGLTF || !alarmLightGLTF.scene) {
    raiseFatalError('Missing alarm_light.glb scene template for alleyway alarm light fixtures.');
  }

  alarmLightsRootGroup.clear();

  // Extract the 3 decimated sub-mesh geometries from alarm_light.glb (632 triangles total)
  let housingSrcGeom = null;
  let bulbSrcGeom = null;
  let domeSrcGeom = null;
  alarmLightGLTF.scene.updateMatrixWorld(true);
  alarmLightGLTF.scene.traverse((node) => {
    if (node.isMesh && node.geometry) {
      if (node.name.includes('GlassDome')) {
        domeSrcGeom = node.geometry;
      } else if (node.name.includes('BulbCore')) {
        bulbSrcGeom = node.geometry;
      } else if (node.name.includes('MetalHousing')) {
        housingSrcGeom = node.geometry;
      }
    }
  });

  if (!housingSrcGeom || !bulbSrcGeom || !domeSrcGeom) {
    raiseFatalError(
      'alarm_light.glb is missing required sub-meshes (AlarmLight_MetalHousing, AlarmLight_BulbCore, AlarmLight_GlassDome).'
    );
  }

  bulbSrcGeom.computeBoundingBox();
  const bulbCenter = new THREE.Vector3(0.0, -0.0756, 0.1224);
  if (bulbSrcGeom.boundingBox) {
    bulbSrcGeom.boundingBox.getCenter(bulbCenter);
  }

  // Proportional low-poly runtime diffused halo sphere centered on the compact bulb core
  const wallHaloGeom = new THREE.SphereGeometry(0.115, 6, 4);

  // Consolidate into 2 shared BufferGeometries per fixture:
  // 1) Opaque MetalHousing + BulbCore
  // 2) Single-Pass Translucent GlassDome + Diffused DarkAmberHalo
  const sharedOpaqueFixtureGeom = mergeTwoIndexedGeometriesWithMask(
    housingSrcGeom,
    bulbSrcGeom,
    null
  );
  const sharedDomeAndHaloGeom = mergeTwoIndexedGeometriesWithMask(
    domeSrcGeom,
    wallHaloGeom,
    { x: bulbCenter.x, y: bulbCenter.y, z: bulbCenter.z }
  );

  const metalMat = new THREE.MeshStandardMaterial({
    name: 'AlarmLight_WeatheredMetal_RuntimeMat',
    color: new THREE.Color(0x4b525a),
    emissive: new THREE.Color(0x241002),
    emissiveIntensity: 0.25,
    metalness: 0.85,
    roughness: 0.38,
    side: THREE.FrontSide,
  });
  metalMat.onBeforeCompile = (shader) => {
    shader.uniforms.uBulbEmissiveScale = alarmLightUniforms.uBulbEmissiveScale;
    shader.vertexShader =
      `attribute float aPartMask;\nvarying float vPartMask;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvPartMask = aPartMask;`
      );
    shader.fragmentShader =
      `uniform float uBulbEmissiveScale;\nvarying float vPartMask;\n` +
      shader.fragmentShader
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          `vec3 partAlbedo = mix(diffuse, vec3(0.851, 0.467, 0.024), step(0.5, vPartMask));
          vec4 diffuseColor = vec4( partAlbedo, opacity );`
        )
        .replace(
          'vec3 totalEmissiveRadiance = emissive;',
          `vec3 totalEmissiveRadiance = mix(emissive, vec3(0.92, 0.44, 0.03) * uBulbEmissiveScale, step(0.5, vPartMask));`
        );
  };
  metalMat.customProgramCacheKey = () => 'alarm_light_opaque_housing_bulb_v2';

  // Single-pass translucent dark-amber glass dome + soft diffused halo
  const darkAmberDomeMat = new THREE.MeshStandardMaterial({
    name: 'AlarmLight_DarkAmberGlass_RuntimeMat',
    color: new THREE.Color(ALARM_LIGHT_DARK_AMBER_HEX), // #b45309 dark burnt amber
    emissive: new THREE.Color(0x92400e),                // #92400e deep dark amber glow
    emissiveIntensity: 2.15,
    roughness: 0.14,
    metalness: 0.05,
    transparent: true,
    opacity: 0.86,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  darkAmberDomeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uHaloOpacity = alarmLightUniforms.uHaloOpacity;
    shader.vertexShader =
      `attribute float aPartMask;\nvarying float vPartMask;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvPartMask = aPartMask;`
      );
    shader.fragmentShader =
      `uniform float uHaloOpacity;\nvarying float vPartMask;\n` +
      shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        if (vPartMask > 0.5) {
          float rim = clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0);
          float haloAlpha = uHaloOpacity * pow(rim, 1.45);
          gl_FragColor = vec4(vec3(0.88, 0.42, 0.04), haloAlpha);
        }`
      );
  };
  darkAmberDomeMat.customProgramCacheKey = () => 'alarm_light_singlepass_dome_halo_v2';

  const darkAmberBulbMat = {
    name: 'AlarmLight_DarkAmberCore_RuntimeMat',
    color: new THREE.Color(ALARM_LIGHT_CORE_AMBER_HEX),
    emissive: new THREE.Color(0xd97706),
    get emissiveIntensity() {
      return alarmLightUniforms.uBulbEmissiveScale.value;
    },
    set emissiveIntensity(v) {
      alarmLightUniforms.uBulbEmissiveScale.value = v;
    },
  };

  const wallHaloSpriteMat = {
    name: 'AlarmLight_DarkAmberHalo_RuntimeMat',
    color: new THREE.Color(0xb45309),
    get opacity() {
      return alarmLightUniforms.uHaloOpacity.value;
    },
    set opacity(v) {
      alarmLightUniforms.uHaloOpacity.value = v;
    },
  };

  const wallRaycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const fixtures = [];
  const fixturesById = {};
  const pairPointLights = new Map();

  for (const spec of ALARM_LIGHT_FIXTURE_SCHEDULE) {
    if (spec.z > ALARM_LIGHT_MAIN_ALLEY_MAX_Z) {
      raiseFatalError(
        `Alarm light fixture '${spec.id}' at Z=${spec.z}m exceeds main alleyway limit Z=${ALARM_LIGHT_MAIN_ALLEY_MAX_Z}m.`
      );
    }

    // Raycast horizontally from corridor center (0, y, z) to snap backplate onto scanned brick wall
    let resolvedWallX = spec.nominalX;
    if (visualAlleyMesh) {
      rayOrigin.set(0.0, spec.y, spec.z);
      rayDir.set(spec.wallSide === 'L' ? -1.0 : 1.0, 0.0, 0.0);
      wallRaycaster.set(rayOrigin, rayDir);
      wallRaycaster.near = 0.5;
      wallRaycaster.far = 3.2;
      const hits = wallRaycaster.intersectObject(visualAlleyMesh, true);
      if (hits.length > 0) {
        const hitX = hits[0].point.x;
        if (spec.wallSide === 'L' && hitX >= -2.75 && hitX <= -1.25) {
          resolvedWallX = hitX + 0.012;
        } else if (spec.wallSide === 'R' && hitX >= 1.25 && hitX <= 2.75) {
          resolvedWallX = hitX - 0.012;
        }
      }
    }

    const fixtureGroup = new THREE.Group();
    fixtureGroup.name = spec.id;
    fixtureGroup.position.set(resolvedWallX, spec.y, spec.z);
    fixtureGroup.rotation.set(0.0, spec.rotationY, 0.0);
    fixtureGroup.scale.setScalar(ALARM_LIGHT_FIXTURE_SCALE);

    const opaqueMesh = new THREE.Mesh(sharedOpaqueFixtureGeom, metalMat);
    opaqueMesh.name = `${spec.id}_AlarmLight_MetalHousing_BulbCore`;
    opaqueMesh.renderOrder = 4;
    opaqueMesh.frustumCulled = true;
    opaqueMesh.raycast = noOpRaycast;
    fixtureGroup.add(opaqueMesh);

    const domeHaloMesh = new THREE.Mesh(sharedDomeAndHaloGeom, darkAmberDomeMat);
    domeHaloMesh.name = `${spec.id}_AlarmLight_GlassDome_DarkAmberHalo`;
    domeHaloMesh.renderOrder = 6;
    domeHaloMesh.frustumCulled = true;
    domeHaloMesh.raycast = noOpRaycast;
    fixtureGroup.add(domeHaloMesh);

    // Localized dark-amber PointLight anchored to each of the 3 non-axis-aligned fixtures
    let pointLight = pairPointLights.get(spec.pairIndex);
    if (!pointLight) {
      pointLight = new THREE.PointLight(
        ALARM_LIGHT_POINT_HEX, // #c25e00 dark amber hue
        2.65,
        13.5,
        1.55
      );
      pointLight.name = `${spec.id}_DarkAmberLight`;
      pointLight.position.set(resolvedWallX + spec.normalX * 0.28, spec.y - 0.08, spec.z);
      alarmLightsRootGroup.add(pointLight);
      pairPointLights.set(spec.pairIndex, pointLight);
    }

    alarmLightsRootGroup.add(fixtureGroup);
    fixtureGroup.updateMatrixWorld(true);

    const record = {
      id: spec.id,
      pairIndex: spec.pairIndex,
      wallSide: spec.wallSide,
      scale: ALARM_LIGHT_FIXTURE_SCALE,
      modelBaseScale: 0.72,
      effectiveScale: Number((ALARM_LIGHT_FIXTURE_SCALE * 0.72).toFixed(4)),
      isFlickering: true,
      currentFlicker: 1.0,
      isConicalLight: false,
      diffusionType: 'radial-omnidirectional',
      axisAligned: false,
      position: { x: Number(resolvedWallX.toFixed(3)), y: spec.y, z: spec.z },
      inwardNormal: { x: spec.normalX, y: 0.0, z: 0.0 },
      rotationY: spec.rotationY,
      hueHex: '#b45309',
      coreHex: '#d97706',
      lightHex: '#c25e00',
      group: fixtureGroup,
      pointLight,
      haloMesh: domeHaloMesh,
    };
    fixtureGroup.userData = {
      fixtureId: spec.id,
      wallSide: spec.wallSide,
      pairIndex: spec.pairIndex,
      scale: ALARM_LIGHT_FIXTURE_SCALE,
      isFlickering: true,
      axisAligned: false,
      hueHex: '#b45309',
      referenceModel: 'https://sketchfab.com/3d-models/alarm-light-933ac2e9d1924e2a973f8692a07972af',
    };
    fixtures.push(record);
    fixturesById[spec.id] = record;
  }

  if (fixtures.length !== ALARM_LIGHT_FIXTURE_SCHEDULE.length) {
    raiseFatalError(
      `Expected ${ALARM_LIGHT_FIXTURE_SCHEDULE.length} alleyway alarm light fixtures, built ${fixtures.length}.`
    );
  }

  return {
    rootGroup: alarmLightsRootGroup,
    fixtures,
    fixturesById,
    evaluateFlicker: evaluateAlarmLightFlicker,
    materials: {
      metal: metalMat,
      dome: darkAmberDomeMat,
      bulb: darkAmberBulbMat,
      halo: wallHaloSpriteMat,
    },
  };
}

function updateAlleyAlarmLightFixtures(timeSec) {
  if (!sandbox.alarmLights || sandbox.alarmLights.length === 0) return;
  const globalFlicker = evaluateAlarmLightFlicker(timeSec, 1);
  if (sandbox.alarmLightMaterials) {
    sandbox.alarmLightMaterials.dome.emissiveIntensity = Number((2.15 * globalFlicker).toFixed(4));
    sandbox.alarmLightMaterials.bulb.emissiveIntensity = Number((3.85 * globalFlicker).toFixed(4));
    sandbox.alarmLightMaterials.halo.opacity = Number((0.12 + 0.30 * globalFlicker).toFixed(4));
  }
  for (let i = 0; i < sandbox.alarmLights.length; i++) {
    const f = sandbox.alarmLights[i];
    const pairFlicker = evaluateAlarmLightFlicker(timeSec, f.pairIndex);
    f.currentFlicker = pairFlicker;
    f.flickerFactor = pairFlicker;
    if (f.pointLight) {
      f.pointLight.intensity = Number((2.65 * pairFlicker).toFixed(4));
    }
  }
}

// ============================================================================
// Entrance Street Lamppost Cone Light Fixture (SpotLight + Volumetric Beam + Target Editor)
// ============================================================================
const LAMPPOST_STORAGE_KEY = 'skatealley_lamppost_cone_light_v1';

function buildEntranceLamppostLightSystem(visualAlleyMesh) {
  if (!visualAlleyMesh) {
    raiseFatalError('buildEntranceLamppostLightSystem requires VISUAL_ALLEY_MESH.');
  }

  visualAlleyMesh.updateMatrixWorld(true);
  const localPos = new THREE.Vector3(
    ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.x,
    ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.y,
    ENTRANCE_LAMPPOST_LIGHT_LOCAL_POS.z
  );
  const worldPos = localPos.clone().applyMatrix4(visualAlleyMesh.matrixWorld);

  entranceLamppostLight.position.copy(worldPos);
  entranceLamppostLight.color.setHex(0xffaa44);
  entranceLamppostLight.intensity = 18.0;
  entranceLamppostLight.distance = 26.0;
  entranceLamppostLight.angle = 0.56;
  entranceLamppostLight.penumbra = 0.52;
  entranceLamppostLight.decay = 1.45;
  entranceLamppostLight.visible = true;

  entranceLamppostLight.target.position.set(
    ENTRANCE_LAMPPOST_DEFAULT_TARGET.x,
    ENTRANCE_LAMPPOST_DEFAULT_TARGET.y,
    ENTRANCE_LAMPPOST_DEFAULT_TARGET.z
  );
  entranceLamppostLight.updateMatrixWorld(true);
  entranceLamppostLight.target.updateMatrixWorld(true);

  // Volumetric atmospheric light cone mesh (apex at origin, extending along +Z so lookAt(target) aims the beam)
  const rawConeGeom = new THREE.CylinderGeometry(0.14, 1.0, 1.0, 32, 16, true);
  rawConeGeom.translate(0, -0.5, 0);
  rawConeGeom.rotateX(-Math.PI / 2);

  const coneColors = new Float32Array(rawConeGeom.attributes.position.count * 4);
  const posAttr = rawConeGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const zDist = Math.max(0.0, Math.min(1.0, posAttr.getZ(i))); // 0 at apex, 1 at landing end
    const axialFade = Math.pow(1.0 - zDist, 1.35) * Math.min(1.0, zDist * 8.0 + 0.25);
    coneColors[i * 4 + 0] = 1.0;
    coneColors[i * 4 + 1] = 0.68;
    coneColors[i * 4 + 2] = 0.26;
    coneColors[i * 4 + 3] = axialFade;
  }
  rawConeGeom.setAttribute('color', new THREE.BufferAttribute(coneColors, 4));

  const coneBeamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    vertexColors: true,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const volumetricConeMesh = new THREE.Mesh(rawConeGeom, coneBeamMaterial);
  volumetricConeMesh.name = 'EntranceLamppostVolumetricConeMesh';
  volumetricConeMesh.renderOrder = 8;
  alleyNightLightsGroup.add(volumetricConeMesh);

  // Interactive landing target ground reticle + hit proxy (for direct in-scene dragging)
  const targetMarkerGroup = new THREE.Group();
  targetMarkerGroup.name = 'EntranceLamppostTargetMarkerGroup';
  targetMarkerGroup.position.copy(entranceLamppostLight.target.position);

  const ringGeom = new THREE.RingGeometry(0.32, 0.42, 32);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.position.y = 0.02;
  ringMesh.renderOrder = 998;
  targetMarkerGroup.add(ringMesh);

  const handleGeom = new THREE.SphereGeometry(0.24, 16, 12);
  const handleMat = new THREE.MeshBasicMaterial({
    color: 0xffcc4d,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });
  const targetHitMesh = new THREE.Mesh(handleGeom, handleMat);
  targetHitMesh.name = 'EntranceLamppostTargetHitProxy';
  targetHitMesh.userData = { isLamppostTarget: true };
  targetHitMesh.renderOrder = 999;
  targetMarkerGroup.add(targetHitMesh);
  targetMarkerGroup.visible = false;
  alleyNightLightsGroup.add(targetMarkerGroup);

  const spotHelper = new THREE.SpotLightHelper(entranceLamppostLight, 0xffaa44);
  spotHelper.visible = false;
  alleyNightLightsGroup.add(spotHelper);

  const dragPlane = new THREE.Plane();
  const dragOffset = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();
  const tempHit = new THREE.Vector3();

  const fixtureState = {
    id: 'ENTRANCE_STREET_LAMPPOST_LIGHT_01',
    name: 'EntranceStreetLamppostLight',
    parentMeshName: 'VISUAL_ALLEY_MESH',
    light: entranceLamppostLight,
    spotLight: entranceLamppostLight,
    pointLight: entranceLamppostLight,
    target: entranceLamppostLight.target,
    volumetricConeMesh,
    coneBeamMaterial,
    targetMarkerGroup,
    targetHitMesh,
    spotHelper,
    raycastTargets: [targetHitMesh],
    isDraggingTarget: false,
    editMode: false,
    lightType: 'SpotLight',
    isLightOnly: false,
    isConicalLight: true,
    meshCount: 1,
    colorHex: '#ffaa44',
    baseIntensity: 18.0,
    currentIntensity: 18.0,
    intensity: 18.0,
    coneOpacity: 0.16,
    shimmerAmplitude: 0.015,
    distance: 26.0,
    angleRad: 0.56,
    penumbra: 0.52,
    decay: 1.45,
    localPosition: {
      x: Number(localPos.x.toFixed(6)),
      y: Number(localPos.y.toFixed(6)),
      z: Number(localPos.z.toFixed(6)),
    },
    worldPosition: worldPos.clone(),
    position: {
      x: Number(worldPos.x.toFixed(4)),
      y: Number(worldPos.y.toFixed(4)),
      z: Number(worldPos.z.toFixed(4)),
    },
    targetPosition: {
      x: ENTRANCE_LAMPPOST_DEFAULT_TARGET.x,
      y: ENTRANCE_LAMPPOST_DEFAULT_TARGET.y,
      z: ENTRANCE_LAMPPOST_DEFAULT_TARGET.z,
    },

    syncConeGeometry() {
      this.light.updateMatrixWorld(true);
      this.target.updateMatrixWorld(true);
      this.targetMarkerGroup.position.copy(this.target.position);

      const startPos = this.light.position;
      const endPos = this.target.position;
      const beamVec = new THREE.Vector3().subVectors(endPos, startPos);
      const beamLen = Math.max(0.5, beamVec.length());
      const bottomRadius = Math.max(0.2, beamLen * Math.tan(this.angleRad));

      this.volumetricConeMesh.position.copy(startPos);
      this.volumetricConeMesh.lookAt(endPos);
      this.volumetricConeMesh.scale.set(bottomRadius, bottomRadius, beamLen);

      const intensityScale = Math.min(2.5, Math.max(0.0, this.baseIntensity / 18.0));
      this.coneBeamMaterial.opacity = Number((this.coneOpacity * intensityScale).toFixed(4));

      this.targetPosition = {
        x: Number(endPos.x.toFixed(3)),
        y: Number(endPos.y.toFixed(3)),
        z: Number(endPos.z.toFixed(3)),
      };
      this.position = {
        x: Number(startPos.x.toFixed(4)),
        y: Number(startPos.y.toFixed(4)),
        z: Number(startPos.z.toFixed(4)),
      };
      this.worldPosition.copy(startPos);

      if (this.spotHelper && this.spotHelper.visible) {
        this.spotHelper.update();
      }
    },

    getState() {
      return {
        targetX: Number(this.target.position.x.toFixed(3)),
        targetY: Number(this.target.position.y.toFixed(3)),
        targetZ: Number(this.target.position.z.toFixed(3)),
        sourceX: Number(this.light.position.x.toFixed(3)),
        sourceY: Number(this.light.position.y.toFixed(3)),
        sourceZ: Number(this.light.position.z.toFixed(3)),
        intensity: Number(this.baseIntensity.toFixed(2)),
        angleDeg: Number(THREE.MathUtils.radToDeg(this.angleRad).toFixed(1)),
        angleRad: Number(this.angleRad.toFixed(4)),
        penumbra: Number(this.penumbra.toFixed(2)),
        distance: Number(this.distance.toFixed(2)),
        coneOpacity: Number(this.coneOpacity.toFixed(3)),
      };
    },

    setState(partial = {}, persist = true) {
      if (!partial || typeof partial !== 'object') return this.getState();
      if (typeof partial.targetX === 'number' && Number.isFinite(partial.targetX)) {
        this.target.position.x = partial.targetX;
      }
      if (typeof partial.targetY === 'number' && Number.isFinite(partial.targetY)) {
        this.target.position.y = partial.targetY;
      }
      if (typeof partial.targetZ === 'number' && Number.isFinite(partial.targetZ)) {
        this.target.position.z = partial.targetZ;
      }
      if (typeof partial.sourceX === 'number' && Number.isFinite(partial.sourceX)) {
        this.light.position.x = partial.sourceX;
      }
      if (typeof partial.sourceY === 'number' && Number.isFinite(partial.sourceY)) {
        this.light.position.y = partial.sourceY;
      }
      if (typeof partial.sourceZ === 'number' && Number.isFinite(partial.sourceZ)) {
        this.light.position.z = partial.sourceZ;
      }
      if (typeof partial.intensity === 'number' && Number.isFinite(partial.intensity)) {
        this.baseIntensity = Math.max(0.0, Math.min(80.0, partial.intensity));
        this.intensity = this.baseIntensity;
        this.currentIntensity = this.baseIntensity;
        this.light.intensity = this.baseIntensity;
      }
      if (typeof partial.angleDeg === 'number' && Number.isFinite(partial.angleDeg)) {
        const deg = Math.max(5.0, Math.min(85.0, partial.angleDeg));
        this.angleRad = THREE.MathUtils.degToRad(deg);
        this.light.angle = this.angleRad;
      } else if (typeof partial.angleRad === 'number' && Number.isFinite(partial.angleRad)) {
        this.angleRad = Math.max(0.08, Math.min(1.48, partial.angleRad));
        this.light.angle = this.angleRad;
      }
      if (typeof partial.penumbra === 'number' && Number.isFinite(partial.penumbra)) {
        this.penumbra = Math.max(0.0, Math.min(1.0, partial.penumbra));
        this.light.penumbra = this.penumbra;
      }
      if (typeof partial.distance === 'number' && Number.isFinite(partial.distance)) {
        this.distance = Math.max(2.0, Math.min(60.0, partial.distance));
        this.light.distance = this.distance;
      }
      if (typeof partial.coneOpacity === 'number' && Number.isFinite(partial.coneOpacity)) {
        this.coneOpacity = Math.max(0.0, Math.min(0.85, partial.coneOpacity));
      }

      this.syncConeGeometry();
      if (persist) {
        this.saveToStorage();
      }
      return this.getState();
    },

    resetToDefault(persist = true) {
      this.light.position.copy(worldPos);
      this.target.position.set(
        ENTRANCE_LAMPPOST_DEFAULT_TARGET.x,
        ENTRANCE_LAMPPOST_DEFAULT_TARGET.y,
        ENTRANCE_LAMPPOST_DEFAULT_TARGET.z
      );
      this.baseIntensity = 18.0;
      this.intensity = 18.0;
      this.currentIntensity = 18.0;
      this.light.intensity = 18.0;
      this.angleRad = 0.56;
      this.light.angle = 0.56;
      this.penumbra = 0.52;
      this.light.penumbra = 0.52;
      this.distance = 26.0;
      this.light.distance = 26.0;
      this.coneOpacity = 0.16;
      this.syncConeGeometry();
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LAMPPOST_STORAGE_KEY);
      }
      return this.getState();
    },

    saveToStorage() {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      try {
        window.localStorage.setItem(LAMPPOST_STORAGE_KEY, JSON.stringify(this.getState()));
        return true;
      } catch (err) {
        return false;
      }
    },

    loadFromStorage() {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      try {
        const raw = window.localStorage.getItem(LAMPPOST_STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.setState(parsed, false);
          return true;
        }
      } catch (err) {
        return false;
      }
      return false;
    },

    beginTargetDrag(worldRay, cam) {
      this.isDraggingTarget = true;
      // Default to horizontal ground plane at target's current Y unless camera is nearly horizontal
      tempNormal.set(0, 1, 0);
      if (cam) {
        const camDir = cam.getWorldDirection(new THREE.Vector3());
        if (Math.abs(camDir.y) < 0.18) {
          tempNormal.copy(camDir).negate();
        }
      }
      dragPlane.setFromNormalAndCoplanarPoint(tempNormal, this.target.position);
      if (worldRay && worldRay.intersectPlane(dragPlane, tempHit)) {
        dragOffset.subVectors(this.target.position, tempHit);
      } else {
        dragOffset.set(0, 0, 0);
      }
      return this;
    },

    updateTargetDrag(worldRay) {
      if (!this.isDraggingTarget || !worldRay) return null;
      if (worldRay.intersectPlane(dragPlane, tempHit)) {
        this.target.position.x = THREE.MathUtils.clamp(tempHit.x + dragOffset.x, -8.0, 8.0);
        this.target.position.z = THREE.MathUtils.clamp(tempHit.z + dragOffset.z, -12.0, 28.0);
        this.syncConeGeometry();
      }
      return this.getState();
    },

    endTargetDrag() {
      if (!this.isDraggingTarget) return null;
      this.isDraggingTarget = false;
      this.syncConeGeometry();
      this.saveToStorage();
      return this.getState();
    },
  };

  fixtureState.syncConeGeometry();
  fixtureState.loadFromStorage();

  return fixtureState;
}

function updateEntranceLamppostLight(elapsedSec = 0.0) {
  const lp = sandbox.lamppostLight || sandbox.entranceLamppostLight;
  if (!lp || !lp.light) return;
  if (lp.target && lp.targetMarkerGroup && !lp.target.position.equals(lp.targetMarkerGroup.position)) {
    lp.syncConeGeometry();
  }
  const shimmer = 1.0 + lp.shimmerAmplitude * Math.sin(elapsedSec * 2.1 + 0.65);
  const intensity = lp.baseIntensity * shimmer;
  lp.currentIntensity = Number(intensity.toFixed(4));
  lp.intensity = lp.currentIntensity;
  lp.light.intensity = intensity;
}

// ============================================================================
// Spec 023 Pillar 1–4 Helper Wrappers (functional_specification_023.md)
// ============================================================================
function buildRunningEffectsSystem(floorY) {
  runningEffectsRootGroup.clear();
  return buildRunningEffectsSubsystem({
    rootGroup: runningEffectsRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });
}

function updateRunningEffectsSystem(dt, elapsedSec) {
  if (!sandbox.runningEffects) return;
  const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
  sandbox.runningEffects.update(dt, elapsedSec, activeChar, sandbox.mode);
}

function evaluateHoloScreenFlicker(timeSec, stationIndex = 1) {
  return evaluateHologramScreenFlickerAndGlitch(timeSec, stationIndex).flickerGain;
}

function evaluateHoloScreenGlitch(timeSec, stationIndex = 1, extraGlitchBoost = 0.0) {
  return evaluateHologramScreenFlickerAndGlitch(timeSec, stationIndex, extraGlitchBoost).glitchIntensity;
}

function createUnifiedHoloDisplayFaceMaterial(st, screenTexture) {
  return createScreenMountHolographicMaterial(
    st,
    screenTexture,
    holoShaderUniforms.uHoloTime,
    applyCharacterOcclusionStencilReject
  );
}

function evaluateSceneLightingForShadowAt(worldX, worldY, worldZ) {
  const sources = collectActiveSceneLightSources(sandbox);
  return evaluateLightResponsiveShadowAtPosition({ x: worldX, y: worldY, z: worldZ }, 0.0, sources, { isCompanion: false });
}

function buildCharacterLightResponsiveShadows(floorY) {
  characterShadowsRootGroup.clear();
  return buildCharacterLightResponsiveShadowSubsystem({
    rootGroup: characterShadowsRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });
}

function updateCharacterLightResponsiveShadows(elapsedSec) {
  if (!sandbox.characterShadows) return;
  sandbox.characterShadows.update(1 / 60, elapsedSec, sandbox);
}

function buildOverheadHangingCables(wallSegments, floorY) {
  overheadCablesRootGroup.clear();
  const sys = buildOverheadHangingCablesSubsystem({
    rootGroup: overheadCablesRootGroup,
    visualAlleyMesh:
      sandbox._visualAlleyMesh ||
      (sandbox.environment ? sandbox.environment.visualAlleyMesh : null),
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });
  if (sys && sys.batchMesh) {
    sys.batchMesh.userData.aliasName = 'OverheadAlleyCablesBatchMesh';
  }
  return sys;
}

function updateOverheadHangingCables(elapsedSec) {
  if (!sandbox.overheadCables) return;
  sandbox.overheadCables.update(1 / 60, elapsedSec);
}

function updateMathPodsCorridorLOD() {
  if (!sandbox.mathPods || !sandbox.mathPods.rootGroup) return;
  sandbox.mathPods.rootGroup.visible = true;
  const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
  const charZ = activeChar ? activeChar.position.z : 3.0;
  const camZ = camera ? camera.position.z : 0.0;
  if (sandbox.mathPods.updateCorridorVisibility) {
    sandbox.mathPods.updateCorridorVisibility(charZ, camZ);
  }
}

// ============================================================================
// Environmental Effects, Surface Optics & Audio Subsystem (SFX.md §1–§4)
// ============================================================================
const sfxSharedUniforms = {
  uTime: { value: 0.0 },
  uTerminalWorldPos: { value: new THREE.Vector3(0.0, 1.75, 5.00) },
  uTerminalIgnition: { value: 1.0 },
  uTetherPulse: { value: 0.0 },
  uBlurKernelSize: { value: 1.0 },
};

// Deterministic 3D Curl-Noise / Simplex-Like Vector Field for Suspended Particulates (SFX.md §2.4)
function evaluateScalarPotential3D(x, y, z, t) {
  const n1 = Math.sin(x * 1.73 + t * 0.42) * Math.cos(y * 2.11 - t * 0.37) * Math.sin(z * 1.49 + t * 0.29);
  const n2 = 0.5 * Math.cos(x * 3.17 - z * 2.05 + t * 0.61) * Math.sin(y * 2.89 + x * 1.31 - t * 0.48);
  return n1 + n2;
}

function evaluateCurlNoise3D(x, y, z, t) {
  const eps = 0.06;
  const dP1_dy = (evaluateScalarPotential3D(x, y + eps, z, t) - evaluateScalarPotential3D(x, y - eps, z, t)) / (2 * eps);
  const dP1_dz = (evaluateScalarPotential3D(x, y, z + eps, t) - evaluateScalarPotential3D(x, y, z - eps, t)) / (2 * eps);
  const dP2_dx = (evaluateScalarPotential3D(y + eps, z, x, t + 3.7) - evaluateScalarPotential3D(y - eps, z, x, t + 3.7)) / (2 * eps);
  const dP2_dz = (evaluateScalarPotential3D(y, z + eps, x, t + 3.7) - evaluateScalarPotential3D(y, z - eps, x, t + 3.7)) / (2 * eps);
  const dP3_dx = (evaluateScalarPotential3D(z + eps, x, y, t + 7.3) - evaluateScalarPotential3D(z - eps, x, y, t + 7.3)) / (2 * eps);
  const dP3_dy = (evaluateScalarPotential3D(z, x + eps, y, t + 7.3) - evaluateScalarPotential3D(z, x - eps, y, t + 7.3)) / (2 * eps);
  return {
    vx: (dP3_dy - dP2_dz) * 0.22,
    vy: (dP1_dz - dP3_dx) * 0.16,
    vz: (dP2_dx - dP1_dy) * 0.22,
  };
}

function evaluateParticleLifecycleAlpha(phase) {
  const p = Math.max(0.0, Math.min(1.0, phase));
  const fadeIn = p < 0.22 ? p / 0.22 : 1.0;
  const fadeOut = p > 0.78 ? (1.0 - p) / 0.22 : 1.0;
  const sIn = fadeIn * fadeIn * (3.0 - 2.0 * fadeIn);
  const sOut = fadeOut * fadeOut * (3.0 - 2.0 * fadeOut);
  return Math.max(0.0, Math.min(1.0, sIn * sOut));
}

// Deterministic CPU mirror of Floor Roughness & Raindrop Ripple Normal for telemetry inspection (SFX.md §3)
function evaluateFloorRoughnessAt(x, z) {
  const p1 = Math.sin(x * 2.15 + Math.cos(z * 0.82) * 1.4) * Math.cos(z * 0.68 - x * 0.95);
  const p2 = 0.55 * Math.sin(x * 4.30 - z * 1.75 + 1.2) * Math.sin(z * 2.10 + x * 1.60);
  const centerBias = Math.exp(-Math.pow(x * 0.85, 2.0)) * 0.28;
  const raw = 0.48 - centerBias - 0.36 * p1 - 0.18 * p2;
  return Math.max(0.05, Math.min(0.95, raw));
}

function evaluateFloorRippleNormalAt(x, z, timeSec) {
  const roughness = evaluateFloorRoughnessAt(x, z);
  const puddleMask = roughness < 0.18 ? 1.0 : roughness > 0.45 ? 0.0 : 1.0 - (roughness - 0.18) / 0.27;
  if (puddleMask <= 1e-4) {
    return { nx: 0.0, ny: 1.0, nz: 0.0, puddleMask: 0.0, ringAmplitude: 0.0 };
  }
  let dnx = 0.0;
  let dnz = 0.0;
  let totalAmp = 0.0;
  for (let k = 0; k < 4; k++) {
    const cellScale = 1.65 + k * 0.42;
    const u = x * cellScale + k * 1.37;
    const v = z * cellScale + k * 2.91;
    const cellX = Math.floor(u);
    const cellZ = Math.floor(v);
    const fx = u - cellX - 0.5;
    const fz = v - cellZ - 0.5;
    const seed = Math.sin(cellX * 127.1 + cellZ * 311.7 + k * 53.3) * 43758.5453;
    const phaseOffset = seed - Math.floor(seed);
    const cycle = (timeSec * (1.38 + k * 0.22) + phaseOffset) % 1.0;
    const r = Math.hypot(fx, fz) + 1e-5;
    const waveRadius = cycle * 0.48;
    const ringEnv = Math.exp(-Math.pow((r - waveRadius) * 14.0, 2.0)) * (1.0 - cycle);
    const wave = Math.cos((r - waveRadius) * 48.0) * ringEnv;
    dnx += (fx / r) * wave * 0.26 * puddleMask;
    dnz += (fz / r) * wave * 0.26 * puddleMask;
    totalAmp += Math.abs(wave) * 1.35 * puddleMask;
  }
  const len = Math.hypot(dnx, 1.0, dnz);
  return {
    nx: dnx / len,
    ny: 1.0 / len,
    nz: dnz / len,
    puddleMask,
    ringAmplitude: totalAmp,
  };
}


// 2. Low-Altitude Ground Fog (SFX.md §2.2)
function buildLowAltitudeGroundFog(floorY) {
  // Constrained to lower vertical third of the corridor (Y in [floorY + 0.03m, floorY + 1.08m], corridor height ~3.5m)
  // Extending along the depth axis (Z in [3.20m, 43.50m]) behind and beneath the holographic terminal
  const minY = floorY + 0.03;
  const maxY = floorY + 1.08;
  const minZ = 3.20;
  const maxZ = 43.50;
  const layerCount = 14;

  const positions = new Float32Array(layerCount * 4 * 3);
  const uvs = new Float32Array(layerCount * 4 * 2);
  const layerHeights = new Float32Array(layerCount * 4);
  const indices = new Uint16Array(layerCount * 6);

  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const y = minY + t * (maxY - minY);
    const zStart = minZ + (i % 3) * 0.45;
    const zEnd = maxZ - ((i + 1) % 3) * 0.45;
    const halfW = 1.62 - 0.08 * Math.sin(i * 1.3);

    const vBase = i * 4;
    const pts = [
      [-halfW, y, zStart, 0.0, 0.0],
      [halfW, y, zStart, 1.0, 0.0],
      [halfW, y, zEnd, 1.0, 1.0],
      [-halfW, y, zEnd, 0.0, 1.0],
    ];
    for (let j = 0; j < 4; j++) {
      const dst3 = (vBase + j) * 3;
      const dst2 = (vBase + j) * 2;
      positions[dst3] = pts[j][0];
      positions[dst3 + 1] = pts[j][1];
      positions[dst3 + 2] = pts[j][2];
      uvs[dst2] = pts[j][3];
      uvs[dst2 + 1] = pts[j][4];
      layerHeights[vBase + j] = t;
    }
    const iBase = i * 6;
    indices[iBase] = vBase;
    indices[iBase + 1] = vBase + 1;
    indices[iBase + 2] = vBase + 2;
    indices[iBase + 3] = vBase;
    indices[iBase + 4] = vBase + 2;
    indices[iBase + 5] = vBase + 3;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aHeightNorm', new THREE.BufferAttribute(layerHeights, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mat = new THREE.ShaderMaterial({
    name: 'LowAltitudeGroundFogMaterial',
    uniforms: {
      uTime: sfxSharedUniforms.uTime,
      uTint: { value: new THREE.Color(0x3d1e05) }, // #3D1E05 translucent dark-amber tint (SFX.md §2.2)
      uVelocity: { value: new THREE.Vector2(0.16, 0.06) },
    },
    vertexShader: `
      attribute float aHeightNorm;
      varying vec2 vUv;
      varying float vHeightNorm;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vHeightNorm = aHeightNorm;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTint;
      uniform vec2 uVelocity;
      varying vec2 vUv;
      varying float vHeightNorm;
      varying vec3 vWorldPos;

      float hash2D(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2D(i + vec2(0.0, 0.0)), hash2D(i + vec2(1.0, 0.0)), u.x),
          mix(hash2D(i + vec2(0.0, 1.0)), hash2D(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        // Continuous low-velocity horizontal translation & multi-octave noise modulation
        vec2 uvFlow1 = vWorldPos.xz * vec2(0.42, 0.16) + uTime * uVelocity;
        vec2 uvFlow2 = vWorldPos.xz * vec2(0.85, 0.34) - uTime * (uVelocity * 0.65) + vec2(vHeightNorm * 2.1, 1.7);
        float n = 0.62 * noise2D(uvFlow1) + 0.38 * noise2D(uvFlow2);

        // Soft alpha edge falloff along X (walls), Y (floor & upper third), and Z (corridor ends)
        float edgeX = smoothstep(0.0, 0.24, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
        float edgeZ = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
        float edgeY = smoothstep(0.0, 0.20, vHeightNorm) * pow(1.0 - vHeightNorm, 1.35);

        float vaporAlpha = 0.135 * n * edgeX * edgeZ * edgeY;
        gl_FragColor = vec4(uTint * (1.15 + 0.45 * n), vaporAlpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
  applyCharacterOcclusionStencilReject(mat);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'LowAltitudeGroundFogMesh';
  mesh.renderOrder = 3;
  mesh.frustumCulled = true;
  mesh.raycast = noOpRaycast;
  sfxRootGroup.add(mesh);

  return {
    mesh,
    material: mat,
    colorHex: '#3D1E05',
    bounds: {
      minY: Number(minY.toFixed(3)),
      maxY: Number(maxY.toFixed(3)),
      minZ,
      maxZ,
      corridorHeightFraction: Number(((maxY - floorY) / 3.5).toFixed(3)),
    },
    horizontalVelocity: { x: 0.16, z: 0.06 },
    noiseModulation: true,
    softEdgeFalloff: true,
  };
}

// 3. Omnidirectional Radial Diffused Light Volumes for Alarm Light Fixtures (Non-Conical)
function buildVolumetricSpotlightCones(fixtures) {
  // Replaces downward conical shafts with concentric 3D radial/ellipsoidal diffused light volumes
  // centered on each compact alarm_light.glb fixture dome, synchronized with electrical flicker
  const baseSphereGeom = new THREE.SphereGeometry(1.0, 14, 10);
  const srcPos = baseSphereGeom.attributes.position;
  const srcNorm = baseSphereGeom.attributes.normal;
  const srcIdx = baseSphereGeom.index;
  const vPerShell = srcPos.count;
  const iPerShell = srcIdx.count;

  // Dual-shell radial diffusion per fixture (inner hot core + outer diffused atmospheric aura)
  const shellsPerFixture = 2;
  const numFixtures = fixtures.length;
  const totalShells = numFixtures * shellsPerFixture;

  const positions = new Float32Array(totalShells * vPerShell * 3);
  const normals = new Float32Array(totalShells * vPerShell * 3);
  const localNormCoords = new Float32Array(totalShells * vPerShell * 3);
  const shellWeights = new Float32Array(totalShells * vPerShell);
  const pairIndices = new Float32Array(totalShells * vPerShell);
  const indices = new Uint16Array(totalShells * iPerShell);

  const volumeRecords = [];
  const tempPos = new THREE.Vector3();
  const tempNorm = new THREE.Vector3();

  for (let c = 0; c < numFixtures; c++) {
    const f = fixtures[c];
    // Anchor radial diffusion center directly at the scaled alarm_light.glb glass dome
    const originX = f.position.x + f.inwardNormal.x * (0.1224 * ALARM_LIGHT_FIXTURE_SCALE);
    const originY = f.position.y - 0.0756 * ALARM_LIGHT_FIXTURE_SCALE;
    const originZ = f.position.z;

    const shellConfigs = [
      { rx: 0.34, ry: 0.36, rz: 0.38, weight: 1.0 }, // Inner bright diffused glow
      { rx: 0.78, ry: 0.84, rz: 0.92, weight: 0.58 }, // Outer wide radial diffusion into alley
    ];

    for (let s = 0; s < shellsPerFixture; s++) {
      const cfg = shellConfigs[s];
      const shellIdx = c * shellsPerFixture + s;
      const vBase = shellIdx * vPerShell;

      for (let i = 0; i < vPerShell; i++) {
        const ux = srcPos.getX(i);
        const uy = srcPos.getY(i);
        const uz = srcPos.getZ(i);

        tempPos.set(
          originX + ux * cfg.rx + f.inwardNormal.x * (cfg.rx * 0.22),
          originY + uy * cfg.ry,
          originZ + uz * cfg.rz
        );
        tempNorm.set(ux / cfg.rx, uy / cfg.ry, uz / cfg.rz).normalize();

        const dst3 = (vBase + i) * 3;
        positions[dst3] = tempPos.x;
        positions[dst3 + 1] = tempPos.y;
        positions[dst3 + 2] = tempPos.z;
        normals[dst3] = tempNorm.x;
        normals[dst3 + 1] = tempNorm.y;
        normals[dst3 + 2] = tempNorm.z;
        localNormCoords[dst3] = ux;
        localNormCoords[dst3 + 1] = uy;
        localNormCoords[dst3 + 2] = uz;
        shellWeights[vBase + i] = cfg.weight;
        pairIndices[vBase + i] = f.pairIndex;
      }

      const iBase = shellIdx * iPerShell;
      for (let i = 0; i < iPerShell; i++) {
        indices[iBase + i] = srcIdx.getX(i) + vBase;
      }
    }

    volumeRecords.push({
      fixtureId: f.id,
      wallSide: f.wallSide,
      origin: { x: Number(originX.toFixed(3)), y: Number(originY.toFixed(3)), z: originZ },
      innerRadius: 0.36,
      outerRadius: 0.85,
      isConical: false,
      diffusionType: 'radial-omnidirectional',
      orientation: 'omnidirectional-radial-diffusion',
    });
  }

  const batchedGeom = new THREE.BufferGeometry();
  batchedGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  batchedGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  batchedGeom.setAttribute('aLocalCoord', new THREE.BufferAttribute(localNormCoords, 3));
  batchedGeom.setAttribute('aShellWeight', new THREE.BufferAttribute(shellWeights, 1));
  batchedGeom.setAttribute('aPairIndex', new THREE.BufferAttribute(pairIndices, 1));
  batchedGeom.setIndex(new THREE.BufferAttribute(indices, 1));
  batchedGeom.computeBoundingBox();
  batchedGeom.computeBoundingSphere();

  const diffusedMat = new THREE.ShaderMaterial({
    name: 'AlarmLightDiffusedVolumeMaterial',
    uniforms: {
      uTime: sfxSharedUniforms.uTime,
      uAmberColor: { value: new THREE.Color(0xd97706) },
      uHotAmberColor: { value: new THREE.Color(0xfbbf24) },
    },
    vertexShader: `
      attribute vec3 aLocalCoord;
      attribute float aShellWeight;
      attribute float aPairIndex;
      varying vec3 vLocalCoord;
      varying float vShellWeight;
      varying float vPairIndex;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        vLocalCoord = aLocalCoord;
        vShellWeight = aShellWeight;
        vPairIndex = aPairIndex;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uAmberColor;
      uniform vec3 uHotAmberColor;
      varying vec3 vLocalCoord;
      varying float vShellWeight;
      varying float vPairIndex;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      float evaluateFlickerGLSL(float timeSec, float pairIdx) {
        float t = timeSec + pairIdx * 1.73;
        float baseHum = 0.88 + 0.08 * sin(t * 6.4) + 0.06 * cos(t * 17.3);
        float sputterGate = sin(t * 3.2 + sin(t * 1.8) * 1.5) * cos(t * 8.1 - pairIdx * 0.95);
        float rapidChatter = 0.5 + 0.5 * sin(t * 46.0 + cos(t * 31.0) * 2.4);
        float dropout = sputterGate > 0.54 ? (0.16 + 0.38 * rapidChatter) : 1.0;
        float arcSurge = sputterGate < -0.74 ? 1.22 : 1.0;
        return clamp(baseHum * dropout * arcSurge, 0.14, 1.28);
      }

      void main() {
        // Omnidirectional radial Gaussian diffusion from fixture center (zero conical edges)
        float r = clamp(length(vLocalCoord), 0.0, 1.0);
        float radialGaussian = exp(-2.4 * r * r);
        float ndotv = clamp(abs(dot(normalize(vWorldNormal), normalize(vViewDir))), 0.0, 1.0);
        float sphericalSoftness = pow(ndotv, 1.65);
        float flicker = evaluateFlickerGLSL(uTime, vPairIndex);
        vec3 diffusedColor = mix(uAmberColor, uHotAmberColor, vShellWeight * 0.58 * ndotv) * flicker;
        float alpha = 0.22 * vShellWeight * radialGaussian * sphericalSoftness * flicker;
        gl_FragColor = vec4(diffusedColor, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  applyCharacterOcclusionStencilReject(diffusedMat);

  const mesh = new THREE.Mesh(batchedGeom, diffusedMat);
  mesh.name = 'AlarmLightDiffusedVolumesMesh';
  mesh.renderOrder = 7;
  mesh.frustumCulled = true;
  mesh.raycast = noOpRaycast;
  sfxRootGroup.add(mesh);

  return {
    mesh,
    material: diffusedMat,
    coneCount: numFixtures,
    volumeCount: numFixtures,
    isConical: false,
    diffusionType: 'radial-omnidirectional',
    colorHex: '#d97706',
    longitudinalFalloff: 'radial-gaussian-omnidirectional',
    radialFalloff: 'fresnel-spherical-diffusion',
    cones: volumeRecords,
    volumes: volumeRecords,
  };
}

// 4. Suspended Ambient Particulates (SFX.md §2.4)
function buildSuspendedAmbientParticulates() {
  const particleCount = 220;
  const halfExtents = { x: 1.55, y: 0.95, z: 2.60 }; // Box volume centered on the holographic terminal

  const localOffsets = new Float32Array(particleCount * 3);
  const worldPositions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);
  const speeds = new Float32Array(particleCount);
  const sizes = new Float32Array(particleCount);
  const alphas = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const s1 = Math.sin(i * 12.9898 + 1.23) * 43758.5453;
    const s2 = Math.sin(i * 78.233 + 4.56) * 43758.5453;
    const s3 = Math.sin(i * 45.164 + 7.89) * 43758.5453;
    const s4 = Math.sin(i * 93.989 + 2.34) * 43758.5453;
    const rx = (s1 - Math.floor(s1)) * 2.0 - 1.0;
    const ry = (s2 - Math.floor(s2)) * 2.0 - 1.0;
    const rz = (s3 - Math.floor(s3)) * 2.0 - 1.0;
    const rPhase = s4 - Math.floor(s4);

    const i3 = i * 3;
    localOffsets[i3] = rx * halfExtents.x;
    localOffsets[i3 + 1] = ry * halfExtents.y;
    localOffsets[i3 + 2] = rz * halfExtents.z;

    phases[i] = rPhase;
    speeds[i] = 0.14 + 0.12 * (rx * 0.5 + 0.5);
    sizes[i] = 6.0 + 6.5 * (ry * 0.5 + 0.5);
    alphas[i] = evaluateParticleLifecycleAlpha(rPhase);

    worldPositions[i3] = sfxSharedUniforms.uTerminalWorldPos.value.x + localOffsets[i3];
    worldPositions[i3 + 1] = sfxSharedUniforms.uTerminalWorldPos.value.y + localOffsets[i3 + 1];
    worldPositions[i3 + 2] = sfxSharedUniforms.uTerminalWorldPos.value.z + localOffsets[i3 + 2];
  }

  const geom = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(worldPositions, 3);
  const alphaAttr = new THREE.BufferAttribute(alphas, 1);
  const sizeAttr = new THREE.BufferAttribute(sizes, 1);
  geom.setAttribute('position', posAttr);
  geom.setAttribute('aAlpha', alphaAttr);
  geom.setAttribute('aSize', sizeAttr);
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mat = new THREE.ShaderMaterial({
    name: 'SuspendedAmbientParticulatesMaterial',
    uniforms: {
      uColor: { value: new THREE.Color(0xff8800) }, // #FF8800 warm amber dust motes (SFX.md §2.4)
    },
    vertexShader: `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = max(0.6, -mvPosition.z);
        gl_PointSize = clamp(aSize * (2.6 / dist), 2.0, 14.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float r2 = dot(c, c);
        if (r2 > 0.25) discard;
        float radial = exp(-r2 * 14.0);
        gl_FragColor = vec4(uColor * 1.35, vAlpha * radial * 0.85);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  applyCharacterOcclusionStencilReject(mat);

  const points = new THREE.Points(geom, mat);
  points.name = 'SuspendedAmbientParticulates';
  points.renderOrder = 8;
  points.frustumCulled = false;
  points.raycast = noOpRaycast;
  sfxRootGroup.add(points);

  function update(dt, timeSec, centerPos) {
    for (let i = 0; i < particleCount; i++) {
      let ph = phases[i] + speeds[i] * dt;
      const i3 = i * 3;
      if (ph >= 1.0) {
        ph -= Math.floor(ph);
        // Respawn smoothly inside bounding box centered on terminal
        const seedX = Math.sin((i + timeSec) * 19.31) * 43758.5453;
        const seedY = Math.sin((i + timeSec) * 47.73) * 43758.5453;
        const seedZ = Math.sin((i + timeSec) * 83.19) * 43758.5453;
        localOffsets[i3] = ((seedX - Math.floor(seedX)) * 2.0 - 1.0) * halfExtents.x;
        localOffsets[i3 + 1] = ((seedY - Math.floor(seedY)) * 2.0 - 1.0) * halfExtents.y;
        localOffsets[i3 + 2] = ((seedZ - Math.floor(seedZ)) * 2.0 - 1.0) * halfExtents.z;
      }
      phases[i] = ph;
      alphas[i] = evaluateParticleLifecycleAlpha(ph);

      // 3D curl-noise drift kinematics
      const curl = evaluateCurlNoise3D(
        localOffsets[i3],
        localOffsets[i3 + 1],
        localOffsets[i3 + 2],
        timeSec
      );
      localOffsets[i3] = Math.max(-halfExtents.x, Math.min(halfExtents.x, localOffsets[i3] + curl.vx * dt));
      localOffsets[i3 + 1] = Math.max(-halfExtents.y, Math.min(halfExtents.y, localOffsets[i3 + 1] + curl.vy * dt));
      localOffsets[i3 + 2] = Math.max(-halfExtents.z, Math.min(halfExtents.z, localOffsets[i3 + 2] + curl.vz * dt));

      worldPositions[i3] = centerPos.x + localOffsets[i3];
      worldPositions[i3 + 1] = centerPos.y + localOffsets[i3 + 1];
      worldPositions[i3 + 2] = centerPos.z + localOffsets[i3 + 2];
    }
    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }

  return {
    points,
    material: mat,
    particleCount,
    colorHex: '#FF8800',
    blending: 'AdditiveBlending',
    kinematics: '3d-curl-simplex-noise',
    boundingVolume: {
      type: 'Box3',
      halfExtents,
      width: halfExtents.x * 2,
      height: halfExtents.y * 2,
      depth: halfExtents.z * 2,
    },
    evaluateAlphaForLifecycle: evaluateParticleLifecycleAlpha,
    evaluateCurlNoise3D,
    update,
  };
}

// 5. Precipitation Particle Emitter (SFX.md §3.1 — Full-Scene Constant Coverage & Dark Amber Rain Slightly Less Intense)
function buildPrecipitationEmitter(floorY) {
  const streakCount = 1400;
  const corridorStreakCount = 960;
  const foregroundStreakCount = streakCount - corridorStreakCount; // 440 camera-following foreground streaks
  // Concentrated within the alleyway corridor width (X in [-2.10, 2.10]) and extended past entrance (Z = -8.0m) & exit (Z = 52.0m)
  const spawnBounds = {
    minX: -2.10,
    maxX: 2.10,
    minY: floorY,
    maxY: 4.45,
    minZ: -8.00,
    maxZ: 52.00,
  };
  const streakLength = 0.54;
  const streakHalfWidth = 0.0050;

  const positions = new Float32Array(streakCount * 4 * 3);
  const uvs = new Float32Array(streakCount * 4 * 2);
  const indices = new Uint16Array(streakCount * 6);
  const dropStates = [];

  for (let i = 0; i < streakCount; i++) {
    const s1 = Math.sin(i * 17.13 + 0.7) * 43758.5453;
    const s2 = Math.sin(i * 53.41 + 1.9) * 43758.5453;
    const s3 = Math.sin(i * 91.77 + 3.1) * 43758.5453;
    const s4 = Math.sin(i * 37.89 + 5.3) * 43758.5453;
    const u1 = s1 - Math.floor(s1);
    const u2 = s2 - Math.floor(s2);
    const u3 = s3 - Math.floor(s3);
    const u4 = s4 - Math.floor(s4);

    const isForeground = i >= corridorStreakCount;
    const relX = (u1 * 2.0 - 1.0) * 1.75;
    const relZ = -3.80 + u3 * 12.60;
    const x = isForeground
      ? relX
      : spawnBounds.minX + u1 * (spawnBounds.maxX - spawnBounds.minX);
    const y = isForeground
      ? floorY + u2 * 3.20
      : spawnBounds.minY + u2 * (spawnBounds.maxY - spawnBounds.minY);
    const z = isForeground
      ? 2.80 + relZ
      : spawnBounds.minZ + u3 * (spawnBounds.maxZ - spawnBounds.minZ);
    const vy = -(9.4 + u4 * 3.6); // Downward rainfall velocity along -Y axis

    dropStates.push({
      x,
      y,
      z,
      vy,
      isForeground,
      relX,
      relZ,
    });

    const vBase = i * 4;
    const uvsQuad = [
      [0.0, 0.0],
      [1.0, 0.0],
      [1.0, 1.0],
      [0.0, 1.0],
    ];
    for (let j = 0; j < 4; j++) {
      const dst2 = (vBase + j) * 2;
      uvs[dst2] = uvsQuad[j][0];
      uvs[dst2 + 1] = uvsQuad[j][1];
    }

    const iBase = i * 6;
    indices[iBase] = vBase;
    indices[iBase + 1] = vBase + 1;
    indices[iBase + 2] = vBase + 2;
    indices[iBase + 3] = vBase;
    indices[iBase + 4] = vBase + 2;
    indices[iBase + 5] = vBase + 3;
  }

  function writeStreakVertices() {
    for (let i = 0; i < streakCount; i++) {
      const d = dropStates[i];
      const vBase = i * 4;
      const yBottom = d.y;
      const yTop = d.y + streakLength;
      const pts = [
        [d.x - streakHalfWidth, yBottom, d.z],
        [d.x + streakHalfWidth, yBottom, d.z],
        [d.x + streakHalfWidth, yTop, d.z],
        [d.x - streakHalfWidth, yTop, d.z],
      ];
      for (let j = 0; j < 4; j++) {
        const dst3 = (vBase + j) * 3;
        positions[dst3] = pts[j][0];
        positions[dst3 + 1] = pts[j][1];
        positions[dst3 + 2] = pts[j][2];
      }
    }
  }
  writeStreakVertices();

  const geom = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  geom.setAttribute('position', posAttr);
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mat = new THREE.ShaderMaterial({
    name: 'PrecipitationStreakMaterial',
    uniforms: {
      uTerminalWorldPos: sfxSharedUniforms.uTerminalWorldPos,
      uAmberTint: { value: new THREE.Color(0xe69528) }, // Rich dark amber point-light tint (#e69528)
      uBaseTint: { value: new THREE.Color(0xb07838) },  // Deep warm dark amber-bronze atmospheric base (#b07838)
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTerminalWorldPos;
      uniform vec3 uAmberTint;
      uniform vec3 uBaseTint;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        // Motion-blurred vertical streak envelope (softened leading/trailing tips)
        float verticalEnv = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.10, vUv.y);
        float horizEnv = 1.0 - 0.55 * pow(abs(vUv.x - 0.5) * 2.0, 2.0);
        // Dark amber tinting within point-light & alarm fixture volumes (slightly toned down vs original)
        float distTerminal = length(vWorldPos - uTerminalWorldPos);
        float terminalLight = smoothstep(5.2, 0.6, distTerminal);
        float wallDistance = smoothstep(0.35, 1.55, abs(vWorldPos.x));
        float fixtureZMod = 0.5 + 0.5 * cos((vWorldPos.z - 6.0) * 0.52);
        float fixtureVolume = wallDistance * fixtureZMod * smoothstep(0.2, 2.9, vWorldPos.y);
        float camDist = length(vWorldPos - cameraPosition);
        float camBoost = 1.0 + 0.38 * smoothstep(9.5, 0.8, camDist);
        float amberFactor = clamp(terminalLight + fixtureVolume * 0.88, 0.25, 1.0);
        vec3 col = mix(uBaseTint, uAmberTint, amberFactor) * (0.88 * camBoost);
        float alpha = clamp(verticalEnv * horizEnv * (0.32 + 0.38 * amberFactor) * camBoost, 0.0, 0.74);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  applyCharacterOcclusionStencilReject(mat);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'PrecipitationEmitterMesh';
  mesh.renderOrder = 7;
  mesh.frustumCulled = false;
  mesh.raycast = noOpRaycast;
  sfxRootGroup.add(mesh);

  function update(dt, camPos) {
    const spanY = spawnBounds.maxY - spawnBounds.minY;
    const cX = camPos ? camPos.x : 0.08;
    const cZ = camPos ? camPos.z : 2.80;
    for (let i = 0; i < streakCount; i++) {
      const d = dropStates[i];
      d.y += d.vy * dt;
      if (d.isForeground) {
        if (d.y < floorY) {
          d.y = floorY + ((((d.y - floorY) % 3.20) + 3.20) % 3.20);
        }
        d.x = Math.max(-2.05, Math.min(2.05, cX + d.relX));
        // Unclamped along Z so foreground rain remains continuous through alleyway entrance and exit
        d.z = cZ + d.relZ;
      } else if (d.y < spawnBounds.minY) {
        d.y = spawnBounds.minY + ((((d.y - spawnBounds.minY) % spanY) + spanY) % spanY);
      }
    }
    writeStreakVertices();
    posAttr.needsUpdate = true;
  }

  return {
    mesh,
    material: mat,
    streakCount,
    corridorStreakCount,
    foregroundStreakCount,
    spawnVolume: spawnBounds,
    fullSceneCoverage: true,
    rainColorHex: '#e69528',
    baseRainColorHex: '#b07838',
    maxStreakAlpha: 0.74,
    blendingMode: 'AdditiveBlending',
    velocityRangeY: [-13.0, -9.4],
    streakLength,
    streakWidth: Number((streakHalfWidth * 2).toFixed(4)),
    elongationAspectRatio: Number((streakLength / (streakHalfWidth * 2)).toFixed(1)),
    amberLightVolumeTinting: true,
    cameraForegroundLocked: true,
    update,
  };
}

// 6. Planar Floor Reflections, Translucent Amber Puddles & Dynamic Ripple Perturbation (SFX.md §3.2–§3.4)
function buildPlanarFloorReflectionSubsystem(floorY) {
  // Subdivided floor strip spanning entrance threshold (-6.0m), primary corridor, and exit courtyard (68.0m)
  const segsX = 6;
  const segsZ = 36;
  const minX = -1.62;
  const maxX = 1.92;
  const minZ = -6.00;
  const maxZ = 68.00;

  function sampleCorridorFloorY(z) {
    if (z <= 0.0) {
      return 0.28;
    }
    if (z <= 8.0) {
      return 0.30 - (z / 8.0) * 0.06;
    }
    if (z <= 16.0) {
      return 0.24 - ((z - 8.0) / 8.0) * 0.19;
    }
    if (z <= 32.0) {
      return 0.055;
    }
    if (z <= 44.0) {
      return 0.055 + ((z - 32.0) / 12.0) * 0.085;
    }
    return 0.14;
  }

  const vCount = (segsX + 1) * (segsZ + 1);
  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const indices = new Uint16Array(segsX * segsZ * 6);

  let vIdx = 0;
  for (let iz = 0; iz <= segsZ; iz++) {
    const tz = iz / segsZ;
    const z = minZ + tz * (maxZ - minZ);
    const y = Math.max(floorY + 0.008, sampleCorridorFloorY(z));
    for (let ix = 0; ix <= segsX; ix++) {
      const tx = ix / segsX;
      const x = minX + tx * (maxX - minX);
      const dst3 = vIdx * 3;
      const dst2 = vIdx * 2;
      positions[dst3] = x;
      positions[dst3 + 1] = y;
      positions[dst3 + 2] = z;
      uvs[dst2] = tx;
      uvs[dst2 + 1] = tz;
      vIdx++;
    }
  }

  let iIdx = 0;
  for (let iz = 0; iz < segsZ; iz++) {
    for (let ix = 0; ix < segsX; ix++) {
      const row0 = iz * (segsX + 1) + ix;
      const row1 = (iz + 1) * (segsX + 1) + ix;
      indices[iIdx++] = row0;
      indices[iIdx++] = row1;
      indices[iIdx++] = row0 + 1;
      indices[iIdx++] = row0 + 1;
      indices[iIdx++] = row1;
      indices[iIdx++] = row1 + 1;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mat = new THREE.ShaderMaterial({
    name: 'PlanarFloorReflectionMaterial',
    uniforms: {
      uTime: sfxSharedUniforms.uTime,
      uTerminalWorldPos: sfxSharedUniforms.uTerminalWorldPos,
      uTerminalIgnition: sfxSharedUniforms.uTerminalIgnition,
      uBlurKernelSize: sfxSharedUniforms.uBlurKernelSize,
      uRainAmberColor: { value: new THREE.Color(0xd89648) }, // Matches softened amber rain color (#d89648)
      uPuddleBaseAmber: { value: new THREE.Color(0x9a6224) }, // Translucent warm amber puddle body (#9a6224)
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTerminalWorldPos;
      uniform float uTerminalIgnition;
      uniform float uBlurKernelSize;
      uniform vec3 uRainAmberColor;
      uniform vec3 uPuddleBaseAmber;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      // Spatially modulated roughness map across puddles, damp concrete, and dry stone (SFX.md §3.3)
      float sampleFloorRoughness(vec2 xz) {
        float p1 = sin(xz.x * 2.15 + cos(xz.y * 0.82) * 1.4) * cos(xz.y * 0.68 - xz.x * 0.95);
        float p2 = 0.55 * sin(xz.x * 4.30 - xz.y * 1.75 + 1.2) * sin(xz.y * 2.10 + xz.x * 1.60);
        float centerBias = exp(-pow(xz.x * 0.85, 2.0)) * 0.28;
        float raw = 0.48 - centerBias - 0.36 * p1 - 0.18 * p2;
        return clamp(raw, 0.05, 0.95);
      }

      // Surface crack and cobblestone relief normal perturbation (SFX.md §3.3)
      vec2 sampleReliefNormalOffset(vec2 xz) {
        float cx = cos(xz.x * 9.5 + sin(xz.y * 4.2)) * 0.035;
        float cz = sin(xz.y * 7.8 - cos(xz.x * 5.1)) * 0.035;
        return vec2(cx, cz);
      }

      // Dynamic expanding concentric ring normal offsets simulating raindrop impacts in puddle zones (SFX.md §3.4)
      vec2 sampleRippleNormalOffset(vec2 xz, float timeSec, float puddleMask) {
        if (puddleMask <= 0.001) return vec2(0.0);
        vec2 nOff = vec2(0.0);
        for (int k = 0; k < 4; k++) {
          float fk = float(k);
          float cellScale = 1.65 + fk * 0.42;
          vec2 uv = xz * cellScale + vec2(fk * 1.37, fk * 2.91);
          vec2 cell = floor(uv);
          vec2 f = fract(uv) - vec2(0.5);
          float seed = fract(sin(dot(cell + vec2(fk * 17.0), vec2(127.1, 311.7))) * 43758.5453);
          float cycle = fract(timeSec * (1.25 + fk * 0.18) + seed);
          float r = length(f) + 1e-4;
          float waveRadius = cycle * 0.48;
          float ringEnv = exp(-pow((r - waveRadius) * 14.0, 2.0)) * (1.0 - cycle);
          float wave = cos((r - waveRadius) * 48.0) * ringEnv;
          nOff += (f / r) * wave * 0.26 * puddleMask;
        }
        return nOff;
      }

      float evaluateFlickerGLSL(float t, float pIdx) {
        float phase = pIdx * 1.37;
        float h1 = fract(sin(floor((t + phase) * 19.0) * 127.1 + pIdx * 31.7) * 43758.5453);
        float h2 = fract(sin(floor((t + phase) * 43.0) * 269.5 + pIdx * 71.3) * 43758.5453);
        float burstGate = sin((t + phase * 1.9) * 2.35) + 0.45 * cos((t + phase * 0.7) * 5.8);
        float factor = 0.88 + 0.12 * sin((t + phase) * 6.0);
        if (burstGate > 0.52) {
          if (h1 < 0.24) factor = 0.12;
          else if (h2 < 0.42) factor = 0.34;
          else if (h1 > 0.78) factor = 1.32;
        } else if (h1 < 0.05) {
          factor = 0.28;
        }
        return clamp(factor, 0.10, 1.35);
      }

      // Evaluates mirrored planar reflection of active Holographic Screen Mounts & 3 Non-Axis-Aligned Wall Alarm Lights
      vec3 evaluatePlanarMirroredEmissives(vec2 sampleXZ) {
        // 1. Mirrored Active Holographic Screen Mount diffused glow
        vec2 dTerm = sampleXZ - uTerminalWorldPos.xz;
        float termX = dTerm.x;
        float termZ = dTerm.y + 0.65;
        float leftPane = exp(-pow((termX - 0.45) * 2.4, 2.0)) * exp(-pow(termZ * 0.72, 2.0));
        float rightPane = exp(-pow((termX + 0.22) * 1.65, 2.0)) * exp(-pow(termZ * 0.68, 2.0));
        float lightBars = exp(-pow(termX * 1.25, 2.0)) * exp(-pow((termZ - 0.25) * 1.35, 2.0)) * uTerminalIgnition;
        vec3 terminalReflection = (
          vec3(0.92, 0.62, 0.22) * (leftPane * 0.68 + rightPane * 0.85) +
          vec3(0.96, 0.78, 0.38) * (lightBars * 1.05)
        );

        // 2. Mirrored 3 Staggered Wall-Mounted Alarm Lights at (-1.59, 7.40), (1.78, 22.80), (-1.55, 38.60)
        vec2 alarmXZ[3];
        alarmXZ[0] = vec2(-1.35, 7.40);
        alarmXZ[1] = vec2(1.42, 22.80);
        alarmXZ[2] = vec2(-1.32, 38.60);
        float fixtureAccum = 0.0;
        for (int k = 0; k < 3; k++) {
          vec2 dFix = sampleXZ - alarmXZ[k];
          float xPool = exp(-pow(dFix.x * 1.65, 2.0));
          float zPool = exp(-pow(dFix.y * 0.34, 2.0));
          float flk = evaluateFlickerGLSL(uTime, float(k + 1));
          fixtureAccum += xPool * zPool * flk;
        }
        vec3 fixtureReflection = uRainAmberColor * fixtureAccum * 0.95;

        return terminalReflection + fixtureReflection;
      }

      void main() {
        float roughness = sampleFloorRoughness(vWorldPos.xz);
        float puddleMask = 1.0 - smoothstep(0.16, 0.48, roughness);
        float stoneSuppression = 1.0 - smoothstep(0.25, 0.78, roughness);

        vec2 reliefN = sampleReliefNormalOffset(vWorldPos.xz);
        vec2 rippleN = sampleRippleNormalOffset(vWorldPos.xz, uTime, puddleMask);
        vec3 floorNormal = normalize(vec3(reliefN.x + rippleN.x, 1.0, reliefN.y + rippleN.y));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 reflectDir = reflect(-viewDir, floorNormal);
        vec2 planarOffset = reflectDir.xz * 0.42 + floorNormal.xz * 0.65;

        // Configurable 5-tap Gaussian/Disk Blur Kernel modulated by surface roughness (SFX.md §3.2 & §3.3)
        float blurRadius = (0.06 + roughness * 0.52) * uBlurKernelSize;
        vec2 pCenter = vWorldPos.xz + planarOffset;
        vec3 accumReflection = evaluatePlanarMirroredEmissives(pCenter) * 0.36;
        accumReflection += evaluatePlanarMirroredEmissives(pCenter + vec2(blurRadius, 0.0)) * 0.16;
        accumReflection += evaluatePlanarMirroredEmissives(pCenter - vec2(blurRadius, 0.0)) * 0.16;
        accumReflection += evaluatePlanarMirroredEmissives(pCenter + vec2(0.0, blurRadius)) * 0.16;
        accumReflection += evaluatePlanarMirroredEmissives(pCenter - vec2(0.0, blurRadius)) * 0.16;

        // Translucent amber puddles matching the softened amber rain color + concentric ripple highlights
        float ndotv = clamp(dot(floorNormal, viewDir), 0.0, 1.0);
        float fresnel = 0.25 + 0.75 * pow(1.0 - ndotv, 3.0);
        float rippleCaustic = clamp(length(rippleN) * 3.2 * puddleMask, 0.0, 1.25);

        vec3 puddleAmberBody = mix(uPuddleBaseAmber, uRainAmberColor, 0.42 + 0.38 * fresnel + 0.20 * min(1.0, rippleCaustic));
        vec3 rippleRingRgb = uRainAmberColor * (0.45 * rippleCaustic);

        // Edge feathering along corridor walls
        float wallEdge = smoothstep(0.0, 0.10, vUv.x) * smoothstep(1.0, 0.90, vUv.x);
        vec3 finalRgb = puddleAmberBody * (0.76 * puddleMask)
          + accumReflection * (0.20 + 0.65 * stoneSuppression) * fresnel
          + rippleRingRgb;

        float luma = dot(accumReflection, vec3(0.299, 0.587, 0.114));
        float puddleTranslucentAlpha = puddleMask * (0.26 + 0.12 * fresnel + 0.12 * min(1.0, rippleCaustic));
        float reflectionAlpha = clamp(luma * (0.16 + 0.32 * stoneSuppression), 0.0, 0.32);
        float finalAlpha = clamp((puddleTranslucentAlpha + reflectionAlpha * (1.0 - puddleMask * 0.45)) * wallEdge, 0.0, 0.46);
        gl_FragColor = vec4(finalRgb, finalAlpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
  });
  applyCharacterOcclusionStencilReject(mat);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'PlanarFloorReflectionMesh';
  mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  mesh.raycast = noOpRaycast;
  sfxRootGroup.add(mesh);

  return {
    mesh,
    material: mat,
    translucentAmberPuddles: true,
    matchesRainColor: true,
    puddleColorHex: '#d89648',
    puddleBaseColorHex: '#9a6224',
    maxPuddleAlpha: 0.46,
    blendingMode: 'NormalBlending',
    bounds: { minX, maxX, minZ, maxZ },
    get blurKernelSize() {
      return sfxSharedUniforms.uBlurKernelSize.value;
    },
    setBlurKernelSize(val) {
      const clamped = Math.max(0.05, Math.min(4.0, Number(val) || 1.0));
      sfxSharedUniforms.uBlurKernelSize.value = clamped;
      const lbl = document.getElementById('reflection-blur-label');
      if (lbl) lbl.textContent = `${clamped.toFixed(2)}x`;
      const slider = document.getElementById('reflection-blur-slider');
      if (slider && Math.abs(Number(slider.value) - clamped) > 0.01) {
        slider.value = String(clamped);
      }
      return clamped;
    },
    sampleRoughnessAt: evaluateFloorRoughnessAt,
    sampleRippleNormalAt: evaluateFloorRippleNormalAt,
    reflectsHolographicTerminal: true,
    reflectsWallMountedLights: true,
    hasSpatialRoughnessMapping: true,
    hasNormalMapping: true,
    hasDynamicRipplePerturbation: true,
  };
}

// 7. Audio Subsystem Architecture (SFX.md §4.1, §4.2, §4.3 + Authentic Random Police Sirens & Character-Matched Footsteps)
const CHARACTER_FOOTSTEP_PROFILES = Object.freeze({
  hoodie: Object.freeze({
    characterId: 'hoodie',
    footwearType: 'urban-sneaker-boot',
    label: 'Luis (Hoodie) — Damp Rubber Sneaker Sole & Urban Boot Heel',
    heelWaveform: 'triangle',
    subBodyWaveform: 'sine',
    heelStartHz: Object.freeze({ left: 112.0, right: 120.0 }),
    heelEndHz: 38.0,
    subBodyHz: 68.0,
    heelDurationSec: 0.084,
    treadCenterHz: Object.freeze({ left: 1580.0, right: 1740.0 }),
    treadQ: 1.35,
    fabricRustleHz: 2850.0,
    metallicChinkHz: Object.freeze({ left: 0.0, right: 0.0 }),
    walkStepMeters: 0.74,
    runStepMeters: 1.12,
    baseGain: 0.0,
  }),
  tunic: Object.freeze({
    characterId: 'tunic',
    footwearType: 'leather-sandal-greave',
    label: 'PlatoDoom (Tunic) — Hard Leather Sandal Slap, Stone Clack & Greave Chink',
    heelWaveform: 'triangle',
    subBodyWaveform: 'sawtooth',
    heelStartHz: Object.freeze({ left: 192.0, right: 208.0 }),
    heelEndHz: 74.0,
    subBodyHz: 128.0,
    heelDurationSec: 0.064,
    treadCenterHz: Object.freeze({ left: 2680.0, right: 2920.0 }),
    treadQ: 1.85,
    fabricRustleHz: 0.0,
    metallicChinkHz: Object.freeze({ left: 3640.0, right: 4180.0 }),
    walkStepMeters: 0.78,
    runStepMeters: 1.18,
    baseGain: 0.0,
  }),
});

function evaluateFloorPuddleMaskAtXZ(x, z) {
  const p1 = Math.sin(x * 2.15 + Math.cos(z * 0.82) * 1.4) * Math.cos(z * 0.68 - x * 0.95);
  const p2 = 0.55 * Math.sin(x * 4.30 - z * 1.75 + 1.2) * Math.sin(z * 2.10 + x * 1.60);
  const centerBias = Math.exp(-Math.pow(x * 0.85, 2.0)) * 0.28;
  const raw = 0.48 - centerBias - 0.36 * p1 - 0.18 * p2;
  const roughness = Math.max(0.05, Math.min(0.95, raw));
  const t = Math.max(0.0, Math.min(1.0, (0.68 - roughness) / (0.68 - 0.08)));
  return Number((t * t * (3.0 - 2.0 * t)).toFixed(4));
}

function synthesizePodGlitchCue(ctx, destinationNode, intensity = 1.0) {
  if (!ctx || !destinationNode) return false;
  try {
    const now = ctx.currentTime;
    const cleanIntensity = Math.max(0.3, Math.min(1.0, Number(intensity) || 1.0));

    // 1. Bandpass-Filtered Static Burst (120ms)
    const burstLen = Math.floor(ctx.sampleRate * 0.12);
    const burstBuf = ctx.createBuffer(1, burstLen, ctx.sampleRate);
    const burstData = burstBuf.getChannelData(0);
    for (let i = 0; i < burstLen; i++) {
      const env = Math.pow(1.0 - i / burstLen, 1.6);
      burstData[i] = (Math.random() * 2.0 - 1.0) * env;
    }
    const burstSrc = ctx.createBufferSource();
    burstSrc.buffer = burstBuf;

    const burstFilter = ctx.createBiquadFilter();
    burstFilter.type = 'bandpass';
    burstFilter.frequency.setValueAtTime(1650, now);
    burstFilter.frequency.exponentialRampToValueAtTime(920, now + 0.12);
    burstFilter.Q.value = 3.2;

    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.026 * cleanIntensity, now);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    burstSrc.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(destinationNode);
    burstSrc.start(now);

    // 2. Warm FM Carrier Phase Warble (140ms)
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const warbleGain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(210, now);
    carrier.frequency.exponentialRampToValueAtTime(148, now + 0.14);

    modulator.type = 'triangle';
    modulator.frequency.value = 43.0;
    modGain.gain.value = 38.0;

    warbleGain.gain.setValueAtTime(0.022 * cleanIntensity, now);
    warbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(warbleGain);
    warbleGain.connect(destinationNode);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.14);
    carrier.stop(now + 0.14);

    return true;
  } catch (_e) {
    return false;
  }
}

class DiegeticAudioEngine {
  constructor(options = {}) {
    this.ctx = options.ctx || options.audioCtx || null;
    this.muted = options.muted || false;
    this.audioSubsystem = options.audioSubsystem || null;
  }

  onPodGlitch(podId, intensity = 1.0) {
    if (this.audioSubsystem && typeof this.audioSubsystem.onPodGlitch === 'function') {
      return this.audioSubsystem.onPodGlitch(podId, intensity);
    }
    const ctx = this.ctx;
    if (!ctx || this.muted) return false;
    return synthesizePodGlitchCue(ctx, ctx.destination, intensity);
  }
}

function buildAudioSubsystem(centralTerminalSystem, alarmFixtures) {
  let audioCtx = null;
  let masterGainNode = null;
  let weatherGainNode = null;
  let droneGainNode = null;
  let terminalGainNode = null;
  let terminalPannerNode = null;
  let sirenOsc1 = null;
  let sirenOsc2 = null;
  let sirenSubOscGain = null;
  let sirenHornBandpass = null;
  let sirenPresencePeak = null;
  let sirenLowpass = null;
  let sirenGainNode = null;
  let sirenPannerNode = null;
  let synthInitialized = false;

  const state = {
    masterGain: 0.75,
    muted: false,
    effectiveMasterGain: 0.75,
    contextState: 'suspended',
  };

  // Fallback terminal ignition state when hologram.glb is removed from the scene
  const fallbackTerminalIgnitionState = {
    active: true,
    ignitionProgress: 1.0,
    tetherPulseProgress: 0.0,
    dataStreamRemainingSec: 0.0,
    activeDataStateIndex: 0,
  };
  const terminalState =
    centralTerminalSystem && centralTerminalSystem.ignitionState
      ? centralTerminalSystem.ignitionState
      : fallbackTerminalIgnitionState;

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return null;
    try {
      audioCtx = new AudioCtxClass();
      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.value = state.muted ? 0.0 : state.masterGain;
      masterGainNode.connect(audioCtx.destination);
      state.contextState = audioCtx.state;
    } catch (_e) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function startContinuousLoopsIfUnlocked() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    state.contextState = ctx.state;
    if (synthInitialized) return;
    try {
      // 4.1.1 Weather Loop: Continuous rain impacting concrete, puddles & metal surfaces (2D non-positional stereo)
      const bufferFrames = ctx.sampleRate * 2;
      const rainBuffer = ctx.createBuffer(2, bufferFrames, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const channelData = rainBuffer.getChannelData(ch);
        let b0 = 0.0;
        let b1 = 0.0;
        let b2 = 0.0;
        for (let i = 0; i < bufferFrames; i++) {
          const white = Math.random() * 2.0 - 1.0;
          b0 = 0.997 * b0 + white * 0.036;
          b1 = 0.982 * b1 + white * 0.058;
          b2 = 0.910 * b2 + white * 0.082;
          const dropletPing = (i % 1361 < 28) ? Math.sin(i * 0.46) * 0.115 : 0.0;
          const puddlePatter = (i % 823 < 18) ? Math.cos(i * 0.78) * 0.075 : 0.0;
          channelData[i] = (b0 + b1 + b2 + dropletPing + puddlePatter) * 0.48;
        }
      }
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1480;
      rainFilter.Q.value = 0.58;
      weatherGainNode = ctx.createGain();
      weatherGainNode.gain.value = 0.26;
      rainSource.connect(rainFilter);
      rainFilter.connect(weatherGainNode);
      weatherGainNode.connect(masterGainNode);
      rainSource.start();

      // 4.1.2 Sub-Bass Drone: Continuous low-frequency ambient synth / industrial hum (2D non-positional stereo)
      const droneOsc1 = ctx.createOscillator();
      const droneOsc2 = ctx.createOscillator();
      droneOsc1.type = 'sine';
      droneOsc2.type = 'triangle';
      droneOsc1.frequency.value = 44.0;
      droneOsc2.frequency.value = 66.0;
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 105.0;
      droneGainNode = ctx.createGain();
      droneGainNode.gain.value = 0.14;
      droneOsc1.connect(droneFilter);
      droneOsc2.connect(droneFilter);
      droneFilter.connect(droneGainNode);
      droneGainNode.connect(masterGainNode);
      droneOsc1.start();
      droneOsc2.start();

      // 4.1.3 Authentic Electronic Police Siren Generator (Dual-Oscillator PA Compression Horn: Wail + Yelp + Doppler + Urban Canyon Echo)
      sirenOsc1 = ctx.createOscillator();
      sirenOsc2 = ctx.createOscillator();
      sirenOsc1.type = 'sawtooth';
      sirenOsc2.type = 'square';
      sirenOsc1.frequency.value = 630.0;
      sirenOsc2.frequency.value = 633.8;

      sirenSubOscGain = ctx.createGain();
      sirenSubOscGain.gain.value = 0.42;

      const sirenHighpass = ctx.createBiquadFilter();
      sirenHighpass.type = 'highpass';
      sirenHighpass.frequency.value = 520.0;
      sirenHighpass.Q.value = 0.75;

      sirenHornBandpass = ctx.createBiquadFilter();
      sirenHornBandpass.type = 'bandpass';
      sirenHornBandpass.frequency.value = 1180.0;
      sirenHornBandpass.Q.value = 1.35;

      sirenPresencePeak = ctx.createBiquadFilter();
      sirenPresencePeak.type = 'peaking';
      sirenPresencePeak.frequency.value = 1450.0;
      sirenPresencePeak.Q.value = 2.10;
      sirenPresencePeak.gain.value = 6.5;

      sirenLowpass = ctx.createBiquadFilter();
      sirenLowpass.type = 'lowpass';
      sirenLowpass.frequency.value = 2400.0; // Preserves recognizable 630-1540Hz PA horn sweep & harmonics across urban distance

      const sirenDelay = ctx.createDelay(1.0);
      sirenDelay.delayTime.value = 0.24; // Urban brick canyon slapback echo
      const sirenFeedback = ctx.createGain();
      sirenFeedback.gain.value = 0.32;
      const sirenWetFilter = ctx.createBiquadFilter();
      sirenWetFilter.type = 'lowpass';
      sirenWetFilter.frequency.value = 1650.0;

      sirenGainNode = ctx.createGain();
      sirenGainNode.gain.value = 0.0;
      sirenPannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      sirenOsc1.connect(sirenHighpass);
      sirenOsc2.connect(sirenSubOscGain);
      sirenSubOscGain.connect(sirenHighpass);
      sirenHighpass.connect(sirenHornBandpass);
      sirenHornBandpass.connect(sirenPresencePeak);
      sirenPresencePeak.connect(sirenLowpass);

      // Dry + urban canyon multi-tap echo loop
      sirenLowpass.connect(sirenGainNode);
      sirenLowpass.connect(sirenDelay);
      sirenDelay.connect(sirenWetFilter);
      sirenWetFilter.connect(sirenFeedback);
      sirenFeedback.connect(sirenDelay);
      sirenWetFilter.connect(sirenGainNode);

      if (sirenPannerNode) {
        sirenGainNode.connect(sirenPannerNode);
        sirenPannerNode.connect(masterGainNode);
      } else {
        sirenGainNode.connect(masterGainNode);
      }
      sirenOsc1.start();
      sirenOsc2.start();

      // 4.2.1 Terminal 3D Positional Emitter: Low-frequency electrical hum + CRT phosphor buzz
      const termHumOsc = ctx.createOscillator();
      const termCrtOsc = ctx.createOscillator();
      termHumOsc.type = 'sawtooth';
      termCrtOsc.type = 'sine';
      termHumOsc.frequency.value = 120.0;
      termCrtOsc.frequency.value = 3150.0;
      const termFilter = ctx.createBiquadFilter();
      termFilter.type = 'lowpass';
      termFilter.frequency.value = 1800.0;
      terminalGainNode = ctx.createGain();
      terminalGainNode.gain.value = 0.08;
      terminalPannerNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      termHumOsc.connect(termFilter);
      termCrtOsc.connect(termFilter);
      if (terminalPannerNode) {
        termFilter.connect(terminalPannerNode);
        terminalPannerNode.connect(terminalGainNode);
      } else {
        termFilter.connect(terminalGainNode);
      }
      terminalGainNode.connect(masterGainNode);
      termHumOsc.start();
      termCrtOsc.start();

      synthInitialized = true;
    } catch (_e) {
      // Headless browser autoplay restriction; mathematical state still updates deterministically
    }
  }

  const SIREN_MIN_INTERVAL_SEC = 5.0;
  const SIREN_MAX_INTERVAL_SEC = 60.0;
  function sampleRandomSirenIntervalSec() {
    const raw =
      SIREN_MIN_INTERVAL_SEC +
      Math.random() * (SIREN_MAX_INTERVAL_SEC - SIREN_MIN_INTERVAL_SEC);
    return Number(
      Math.max(SIREN_MIN_INTERVAL_SEC, Math.min(SIREN_MAX_INTERVAL_SEC, raw)).toFixed(3)
    );
  }

  const initialSirenIntervalSec = sampleRandomSirenIntervalSec();
  const secondSirenIntervalSec = sampleRandomSirenIntervalSec();
  const SIREN_ACTIVE_DURATION_SEC = 7.6;

  // 4.1 Global 2D Ambient Channels (Non-Positional Stereo Streams at Constant Volume)
  const ambientChannels = {
    weatherLoop: {
      id: 'weatherLoop',
      label: 'Weather Loop (Louder Rain Impacting Concrete, Puddles & Metal)',
      isPositional: false,
      channels: 2,
      loop: true,
      isPlaying: true,
      constantVolume: true,
      baseGain: 0.26,
      currentGain: Number((0.26 * state.effectiveMasterGain).toFixed(4)),
      stereoPan: 0.0,
    },
    subBassDrone: {
      id: 'subBassDrone',
      label: 'Sub-Bass Drone (Low-Frequency Industrial Synth Hum)',
      isPositional: false,
      channels: 2,
      loop: true,
      isPlaying: true,
      constantVolume: true,
      fundamentalHz: 44.0,
      harmonicHz: 66.0,
      baseGain: 0.14,
      currentGain: Number((0.14 * state.effectiveMasterGain).toFixed(4)),
      stereoPan: 0.0,
    },
    distantPoliceSiren: {
      id: 'distantPoliceSiren',
      label: 'Random Distant Police Siren (Electronic Wail & Yelp PA Horn, 5s–60s Random Interval)',
      sirenType: 'electronic-pa-wail-yelp',
      waveformTypes: ['sawtooth', 'square'],
      isPositional: false,
      isDistant: true,
      randomInterval: true,
      minIntervalSec: SIREN_MIN_INTERVAL_SEC,
      maxIntervalSec: SIREN_MAX_INTERVAL_SEC,
      activeDurationSec: SIREN_ACTIVE_DURATION_SEC,
      lowFrequencyHz: 630.0,
      highFrequencyHz: 1480.0,
      yelpLowFrequencyHz: 680.0,
      yelpHighFrequencyHz: 1540.0,
      wailRateHz: 0.30,
      yelpRateHz: 3.60,
      highpassCutoffHz: 520.0,
      bandpassCenterHz: 1180.0,
      presencePeakHz: 1450.0,
      lowpassCutoffHz: 2400.0,
      echoDelaySec: 0.24,
      echoFeedbackGain: 0.32,
      baseGain: 0.115,
      currentGain: 0.0,
      currentFrequencyHz: 630.0,
      sirenMode: 'Standby',
      dopplerFactor: 1.0,
      stereoPan: -0.52,
      isSirenActive: false,
      cycleCount: 0,
      lastCycleIndex: -1,
      lastRandomIntervalSec: initialSirenIntervalSec,
      currentEventStartSec: initialSirenIntervalSec,
      nextOnsetTimeSec: Number(
        (initialSirenIntervalSec + SIREN_ACTIVE_DURATION_SEC + secondSirenIntervalSec).toFixed(3)
      ),
      intervalHistory: [initialSirenIntervalSec, secondSirenIntervalSec],
      sampleRandomIntervalSec: sampleRandomSirenIntervalSec,
      triggerImmediatePassBy(atTimeSec = sfxSharedUniforms.uTime.value) {
        const t = Math.max(0.0, Number(atTimeSec) || 0.0);
        const nextWait = sampleRandomSirenIntervalSec();
        this.currentEventStartSec = Number(t.toFixed(3));
        this.lastRandomIntervalSec = nextWait;
        this.nextOnsetTimeSec = Number(
          (this.currentEventStartSec + this.activeDurationSec + nextWait).toFixed(3)
        );
        this.intervalHistory.push(nextWait);
        if (this.intervalHistory.length > 24) {
          this.intervalHistory.shift();
        }
        updateDistantPoliceSiren(t + 0.05);
        return this;
      },
    },
  };

  const distantPoliceSiren = ambientChannels.distantPoliceSiren;

  // 4.2 3D Positional Audio Emitters (Dynamic Azimuth Stereo Panning & Euclidean Distance Rolloff)
  const terminalEmitter = {
    id: 'terminalEmitter',
    label: 'Holographic Screen Mount Emitter (Electrical Hum + CRT Phosphor Buzz)',
    isPositional: true,
    loop: true,
    isPlaying: true,
    humFrequencyHz: 120.0,
    crtBuzzFrequencyHz: 3150.0,
    refDistance: 1.60,
    maxDistance: 14.00,
    rolloffFactor: 2.40,
    baseGain: 0.24,
    worldPosition: { x: 0.14, y: 1.70, z: 5.40 },
    distanceToCamera: 2.50,
    azimuthRad: 0.0,
    stereoPan: 0.0,
    attenuationFactor: 1.0,
    currentGain: 0.24,
  };

  const fixtureEmitters = alarmFixtures.map((f) => ({
    id: `fixtureEmitter_${f.id}`,
    fixtureId: f.id,
    wallSide: f.wallSide,
    pairIndex: f.pairIndex,
    isPositional: true,
    loop: true,
    isPlaying: true,
    fundamentalHz: 60.0, // Localized 60Hz transformer buzz (SFX.md §4.2)
    refDistance: 0.85,
    maxDistance: 6.50,
    rolloffFactor: 3.50, // Steep distance falloff audible primarily near walls
    baseGain: 0.18,
    worldPosition: { x: f.position.x, y: f.position.y, z: f.position.z },
    distanceToCamera: 3.0,
    azimuthRad: 0.0,
    stereoPan: 0.0,
    attenuationFactor: 0.0,
    currentGain: 0.0,
  }));

  function evaluate3DSpatialPanAndGain(sourcePos, camPos, camForward, camRight, emitterSpec) {
    const dx = sourcePos.x - camPos.x;
    const dy = sourcePos.y - camPos.y;
    const dz = sourcePos.z - camPos.z;
    const euclideanDist = Math.hypot(dx, dy, dz);

    // Azimuth angle in camera horizontal plane -> stereo panning [-1, +1]
    const horizLen = Math.hypot(dx, dz) || 1e-6;
    const nx = dx / horizLen;
    const nz = dz / horizLen;
    const rightDot = nx * camRight.x + nz * camRight.z;
    const fwdDot = nx * camForward.x + nz * camForward.z;
    const azimuthRad = Math.atan2(rightDot, fwdDot);
    const stereoPan = Math.max(-1.0, Math.min(1.0, Math.sin(azimuthRad)));

    // Inverse-distance rolloff with smooth cutoff at maxDistance
    const dRef = emitterSpec.refDistance;
    const dMax = emitterSpec.maxDistance;
    const rolloff = emitterSpec.rolloffFactor;
    const excessDist = Math.max(0.0, euclideanDist - dRef);
    const invRolloff = dRef / (dRef + rolloff * excessDist);
    const maxCutoff =
      euclideanDist >= dMax
        ? 0.0
        : euclideanDist <= dRef
        ? 1.0
        : 1.0 - Math.pow((euclideanDist - dRef) / (dMax - dRef), 2.0);
    const attenuationFactor = Math.max(0.0, Math.min(1.0, invRolloff * invRolloff * maxCutoff));
    const currentGain = emitterSpec.baseGain * attenuationFactor * state.effectiveMasterGain;

    return {
      distanceToCamera: Number(euclideanDist.toFixed(4)),
      azimuthRad: Number(azimuthRad.toFixed(4)),
      stereoPan: Number(stereoPan.toFixed(4)),
      attenuationFactor: Number(attenuationFactor.toFixed(4)),
      currentGain: Number(currentGain.toFixed(4)),
    };
  }

  function updateDistantPoliceSiren(timeSec) {
    const t = Math.max(0.0, Number(timeSec) || 0.0);
    const activeDur = distantPoliceSiren.activeDurationSec;

    // Advance random interval schedule whenever the current pass-by window has completed
    let guard = 0;
    while (t >= distantPoliceSiren.currentEventStartSec + activeDur && guard < 128) {
      guard += 1;
      const nextWait = sampleRandomSirenIntervalSec();
      distantPoliceSiren.currentEventStartSec = distantPoliceSiren.nextOnsetTimeSec;
      distantPoliceSiren.lastRandomIntervalSec = nextWait;
      distantPoliceSiren.nextOnsetTimeSec = Number(
        (distantPoliceSiren.currentEventStartSec + activeDur + nextWait).toFixed(3)
      );
      distantPoliceSiren.intervalHistory.push(nextWait);
      if (distantPoliceSiren.intervalHistory.length > 24) {
        distantPoliceSiren.intervalHistory.shift();
      }
    }

    const elapsedInEvent = t - distantPoliceSiren.currentEventStartSec;
    if (elapsedInEvent >= 0.0 && elapsedInEvent <= activeDur) {
      if (distantPoliceSiren.lastCycleIndex !== distantPoliceSiren.currentEventStartSec) {
        distantPoliceSiren.lastCycleIndex = distantPoliceSiren.currentEventStartSec;
        distantPoliceSiren.cycleCount += 1;
      }
      distantPoliceSiren.isSirenActive = true;

      // Smooth approach-crest-recede envelope for an emergency vehicle passing down a cross-street
      const normP = elapsedInEvent / activeDur;
      const env = Math.sin(normP * Math.PI) * (0.82 + 0.18 * Math.sin(normP * Math.PI * 2.0));

      // Acoustic Doppler shift: +3.2% pitch while approaching (normP < 0.52), -3.2% while receding
      const doppler = 1.0 - 0.032 * Math.tanh((normP - 0.52) * 4.5);
      distantPoliceSiren.dopplerFactor = Number(doppler.toFixed(4));

      // Two-mode authentic NYPD police siren contour:
      // - Wail mode (0.00..0.60 and 0.82..1.00): asymmetric capacitor charge/discharge (630Hz <-> 1480Hz)
      // - Yelp mode (0.60..0.82): rapid intersection-clearing electronic yelp (680Hz <-> 1540Hz at 3.6Hz)
      let baseFreqHz;
      if (normP >= 0.60 && normP <= 0.82) {
        distantPoliceSiren.sirenMode = 'Yelp';
        const yelpPhase = (elapsedInEvent * distantPoliceSiren.yelpRateHz) % 1.0;
        const tri = yelpPhase < 0.5 ? yelpPhase * 2.0 : (1.0 - yelpPhase) * 2.0;
        const shapedYelp = Math.pow(tri, 0.85);
        baseFreqHz =
          distantPoliceSiren.yelpLowFrequencyHz +
          (distantPoliceSiren.yelpHighFrequencyHz - distantPoliceSiren.yelpLowFrequencyHz) *
            shapedYelp;
      } else {
        distantPoliceSiren.sirenMode = 'Wail';
        const wailPhase = (elapsedInEvent * distantPoliceSiren.wailRateHz) % 1.0;
        // Asymmetric rise (fast 58% charge) and coasting fall (42% discharge)
        const shapedWail =
          wailPhase < 0.58
            ? Math.pow(wailPhase / 0.58, 0.72)
            : Math.pow(1.0 - (wailPhase - 0.58) / 0.42, 1.32);
        baseFreqHz =
          distantPoliceSiren.lowFrequencyHz +
          (distantPoliceSiren.highFrequencyHz - distantPoliceSiren.lowFrequencyHz) * shapedWail;
      }

      const freqHz = baseFreqHz * doppler;
      const dirSign = distantPoliceSiren.cycleCount % 2 === 0 ? 1.0 : -1.0;
      const pan = Math.max(-0.82, Math.min(0.82, dirSign * (-0.64 + normP * 1.28)));
      const gain = distantPoliceSiren.baseGain * env * state.effectiveMasterGain;

      distantPoliceSiren.currentFrequencyHz = Number(freqHz.toFixed(2));
      distantPoliceSiren.stereoPan = Number(pan.toFixed(4));
      distantPoliceSiren.currentGain = Number(gain.toFixed(4));

      if (synthInitialized && audioCtx) {
        const now = audioCtx.currentTime;
        if (sirenOsc1) sirenOsc1.frequency.setTargetAtTime(freqHz, now, 0.018);
        if (sirenOsc2) sirenOsc2.frequency.setTargetAtTime(freqHz * 1.006, now, 0.018);
        if (sirenHornBandpass) {
          // Dynamic horn throat tracking slightly follows the pitch sweep
          sirenHornBandpass.frequency.setTargetAtTime(
            Math.max(880.0, Math.min(1620.0, freqHz * 1.05)),
            now,
            0.025
          );
        }
        if (sirenGainNode) sirenGainNode.gain.setTargetAtTime(gain, now, 0.045);
        if (sirenPannerNode) sirenPannerNode.pan.setTargetAtTime(pan, now, 0.05);
      }
    } else {
      distantPoliceSiren.isSirenActive = false;
      distantPoliceSiren.sirenMode = 'Standby';
      distantPoliceSiren.currentGain = 0.0;
      distantPoliceSiren.dopplerFactor = 1.0;
      if (synthInitialized && audioCtx && sirenGainNode) {
        sirenGainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.08);
      }
    }
  }

  const camForwardVec = new THREE.Vector3();
  const camRightVec = new THREE.Vector3();

  function updateSpatialAudio(cam, timeSec = sfxSharedUniforms.uTime.value) {
    cam.getWorldDirection(camForwardVec);
    camForwardVec.y = 0.0;
    if (camForwardVec.lengthSq() < 1e-6) {
      camForwardVec.set(0, 0, 1);
    } else {
      camForwardVec.normalize();
    }
    camRightVec.crossVectors(camForwardVec, WORLD_UP).normalize();

    // Global 2D ambient channels stay strictly at constant volume & 0 pan regardless of camera pose (SFX.md §4.1)
    ambientChannels.weatherLoop.currentGain = Number(
      (ambientChannels.weatherLoop.baseGain * state.effectiveMasterGain).toFixed(4)
    );
    ambientChannels.weatherLoop.stereoPan = 0.0;
    ambientChannels.subBassDrone.currentGain = Number(
      (ambientChannels.subBassDrone.baseGain * state.effectiveMasterGain).toFixed(4)
    );
    ambientChannels.subBassDrone.stereoPan = 0.0;

    // Random-Interval Distant Police Siren envelope & Wail/Yelp horn update
    updateDistantPoliceSiren(timeSec);

    // 3D Terminal Emitter anchored to active holographic screen mount transform (SFX.md §4.2.1)
    const termWorld = sfxSharedUniforms.uTerminalWorldPos.value;
    terminalEmitter.worldPosition.x = Number(termWorld.x.toFixed(3));
    terminalEmitter.worldPosition.y = Number(termWorld.y.toFixed(3));
    terminalEmitter.worldPosition.z = Number(termWorld.z.toFixed(3));
    const termSpatial = evaluate3DSpatialPanAndGain(
      terminalEmitter.worldPosition,
      cam.position,
      camForwardVec,
      camRightVec,
      terminalEmitter
    );
    Object.assign(terminalEmitter, termSpatial);
    if (terminalGainNode && audioCtx) {
      terminalGainNode.gain.setTargetAtTime(terminalEmitter.currentGain, audioCtx.currentTime, 0.03);
    }
    if (terminalPannerNode && audioCtx) {
      terminalPannerNode.pan.setTargetAtTime(terminalEmitter.stereoPan, audioCtx.currentTime, 0.03);
    }

    // 3D Fixture Emitters anchored to each of the 3 staggered wall-mounted alarm lights (SFX.md §4.2.2)
    for (let i = 0; i < fixtureEmitters.length; i++) {
      const fe = fixtureEmitters[i];
      const fSpatial = evaluate3DSpatialPanAndGain(
        fe.worldPosition,
        cam.position,
        camForwardVec,
        camRightVec,
        fe
      );
      Object.assign(fe, fSpatial);
    }
  }

  // 4.3 Event-Driven UI Telemetry & Character-Matched Locomotion Audio (SFX.md §4.3 + Footsteps)
  const uiTriggers = {
    onActivate: {
      id: 'onActivate',
      description: 'Power-up frequency sweep (180Hz->1480Hz) and relay click synchronized with top/bottom light bar ignition',
      durationMs: 220,
      sweepStartHz: 180,
      sweepEndHz: 1480,
      relayClickMs: 12,
      synchronizedLightBars: true,
      triggerCount: 0,
      lastTriggeredAt: null,
      lastDetail: null,
    },
    onHover: {
      id: 'onHover',
      description: 'Short, high-frequency transient click (< 50ms) on pointer intersection with interactive terminal sub-region',
      durationMs: 28, // Strictly < 50 ms per SFX.md §4.3
      frequencyHz: 3400,
      triggerCount: 0,
      lastTriggeredAt: null,
      lastDetail: null,
    },
    onDataStream: {
      id: 'onDataStream',
      description: 'Rapid, rhythmic micro-ticks while text blocks or telemetry graphics populate inside the right pane',
      durationMs: 360,
      tickDurationMs: 14,
      tickCadenceHz: 28,
      frequencyHz: 2150,
      triggerCount: 0,
      lastTriggeredAt: null,
      lastDetail: null,
    },
    onUpdate: {
      id: 'onUpdate',
      description: 'Short mid-frequency signal tone when switching active data states across inter-module tether lines',
      durationMs: 110,
      toneStartHz: 660,
      toneEndHz: 880,
      triggerCount: 0,
      lastTriggeredAt: null,
      lastDetail: null,
    },
    onFootstep: {
      id: 'onFootstep',
      description: 'Character-matched footwear impact (Luis rubber sneaker/boot vs PlatoDoom leather sandal/greave + wet puddle splash) synchronized with skeletal foot strikes',
      durationMs: 90,
      heelFrequencyHz: 112,
      treadFrequencyHz: 1580,
      splashCutoffHz: 2350,
      triggerCount: 0,
      lastTriggeredAt: null,
      lastDetail: null,
    },
  };

  // Character-Matched & Animation-Synchronized Footstep Audio State (Scroll-Walk & Free-Roam Modes)
  const footsteps = {
    id: 'footsteps',
    label: 'Character-Matched Footsteps (Luis Urban Sneaker/Boot vs PlatoDoom Leather Sandal/Greave)',
    profiles: CHARACTER_FOOTSTEP_PROFILES,
    activeCharacterId: 'hoodie',
    activeVariantKey: 'luis_holo',
    activeFootwearType: CHARACTER_FOOTSTEP_PROFILES.hoodie.footwearType,
    isHoloShaderActive: true,
    walkStepMeters: CHARACTER_FOOTSTEP_PROFILES.hoodie.walkStepMeters,
    runStepMeters: CHARACTER_FOOTSTEP_PROFILES.hoodie.runStepMeters,
    baseGain: CHARACTER_FOOTSTEP_PROFILES.hoodie.baseGain,
    stepCount: 0,
    leftFootNext: true,
    distanceAccumulator: 0.0,
    lastStepMode: 'Idle',
    lastStepAt: null,
    lastCadenceMeters: CHARACTER_FOOTSTEP_PROFILES.hoodie.walkStepMeters,
    lastFoot: 'left',
    lastCharacterId: 'hoodie',
    lastFootwearType: CHARACTER_FOOTSTEP_PROFILES.hoodie.footwearType,
    lastHeelFrequencyHz: CHARACTER_FOOTSTEP_PROFILES.hoodie.heelStartHz.left,
    lastTreadFrequencyHz: CHARACTER_FOOTSTEP_PROFILES.hoodie.treadCenterHz.left,
    lastMetallicChinkHz: 0.0,
    lastPuddleWetness: 0.0,
    lastAnimationClip: 'IDLE_DEFAULT',
    lastAnimationPhase: 0.0,
    lastFootWorldPosition: { x: 0.0, y: 0.0, z: 3.0 },
    prevNormalizedClipPhase: null,
    prevTrackedClipName: null,
    prevTrackedCharacterId: null,
  };

  const eventHistory = [];

  function resolveActiveFootstepContext(options = {}) {
    const activeChar =
      options.character ||
      (typeof sandbox !== 'undefined' && sandbox && sandbox.ready && sandbox.getActiveCharacter
        ? sandbox.getActiveCharacter()
        : null);
    const charId =
      options.characterId ||
      (activeChar && activeChar.id) ||
      (typeof sandbox !== 'undefined' && sandbox && sandbox.activeCharacterId) ||
      'hoodie';
    const profile =
      CHARACTER_FOOTSTEP_PROFILES[charId] || CHARACTER_FOOTSTEP_PROFILES.hoodie;
    const variantKey =
      options.variantKey ||
      (typeof sandbox !== 'undefined' && sandbox && sandbox.currentVariantKey) ||
      (charId === 'tunic' ? 'platodoom_holo' : 'luis_holo');
    const isHolo =
      typeof options.isHoloShaderActive === 'boolean'
        ? options.isHoloShaderActive
        : activeChar
        ? Boolean(activeChar.isHoloShaderActive)
        : true;
    const isClay = String(variantKey).includes('clay');
    return { activeChar, charId, profile, variantKey, isHolo, isClay };
  }

  function playSynthesizedFootstep() {
    // Synthesized footstep sound effect removed per user request (awaiting user-supplied audio asset).
  }

  const tempFootBoneWorldPos = new THREE.Vector3();

  function triggerFootstep(stepMode = 'Walk', stepForce = 1.0, options = {}) {
    const ctxInfo = resolveActiveFootstepContext(options);
    const { activeChar, charId, profile, variantKey, isHolo, isClay } = ctxInfo;

    const isLeft =
      typeof options.foot === 'string'
        ? options.foot === 'left'
        : footsteps.leftFootNext;
    footsteps.leftFootNext = !isLeft;
    const footName = isLeft ? 'left' : 'right';

    // Determine striking foot bone world coordinates (LeftFoot / RightFoot) for exact surface puddle lookup
    let footWorldX = activeChar ? activeChar.position.x : 0.0;
    let footWorldY = activeChar ? activeChar.position.y : 0.0;
    let footWorldZ = activeChar ? activeChar.position.z : 3.0;
    if (options.footWorldPosition) {
      footWorldX = options.footWorldPosition.x;
      footWorldY = options.footWorldPosition.y;
      footWorldZ = options.footWorldPosition.z;
    } else if (activeChar && activeChar.bonesByName) {
      const footBone = activeChar.bonesByName.get(isLeft ? 'LeftFoot' : 'RightFoot');
      if (footBone) {
        footBone.getWorldPosition(tempFootBoneWorldPos);
        footWorldX = tempFootBoneWorldPos.x;
        footWorldY = tempFootBoneWorldPos.y;
        footWorldZ = tempFootBoneWorldPos.z;
      }
    }

    const puddleWetness = evaluateFloorPuddleMaskAtXZ(footWorldX, footWorldZ);
    const isRun = stepMode === 'Run' || stepMode === 'Land';
    const heelHz = Number(
      (
        profile.heelStartHz[footName] *
        (isRun ? 1.09 : 1.0) *
        (isClay ? 1.06 : 1.0)
      ).toFixed(2)
    );
    const treadHz = Number(
      (profile.treadCenterHz[footName] * (1.0 - 0.12 * puddleWetness)).toFixed(2)
    );
    const chinkHz = profile.metallicChinkHz[footName];
    const animClip =
      options.animationClip ||
      (activeChar && activeChar.currentClipName) ||
      (stepMode === 'Run' ? 'JOG_DEFAULT' : 'WALK_DEFAULT');
    const animPhase =
      typeof options.animationPhase === 'number'
        ? Number(options.animationPhase.toFixed(4))
        : footsteps.lastAnimationPhase;

    footsteps.activeCharacterId = charId;
    footsteps.activeVariantKey = variantKey;
    footsteps.activeFootwearType = profile.footwearType;
    footsteps.isHoloShaderActive = isHolo;
    footsteps.walkStepMeters = profile.walkStepMeters;
    footsteps.runStepMeters = profile.runStepMeters;
    footsteps.baseGain = 0.0;
    footsteps.stepCount += 1;
    footsteps.lastStepMode = stepMode;
    footsteps.lastStepAt = performance.now();
    footsteps.lastFoot = footName;
    footsteps.lastCharacterId = charId;
    footsteps.lastFootwearType = profile.footwearType;
    footsteps.lastHeelFrequencyHz = heelHz;
    footsteps.lastTreadFrequencyHz = treadHz;
    footsteps.lastMetallicChinkHz = chinkHz;
    footsteps.lastPuddleWetness = puddleWetness;
    footsteps.lastAnimationClip = animClip;
    footsteps.lastAnimationPhase = animPhase;
    footsteps.lastFootWorldPosition = {
      x: Number(footWorldX.toFixed(3)),
      y: Number(footWorldY.toFixed(3)),
      z: Number(footWorldZ.toFixed(3)),
    };
    footsteps.lastCadenceMeters =
      stepMode === 'Run' ? profile.runStepMeters : profile.walkStepMeters;

    const spec = uiTriggers.onFootstep;
    spec.heelFrequencyHz = heelHz;
    spec.treadFrequencyHz = treadHz;
    spec.triggerCount += 1;
    spec.lastTriggeredAt = footsteps.lastStepAt;
    spec.lastDetail = {
      characterId: charId,
      variantKey,
      footwearType: profile.footwearType,
      isHoloShaderActive: isHolo,
      foot: footName,
      stepMode,
      stepCount: footsteps.stepCount,
      heelFrequencyHz: heelHz,
      treadFrequencyHz: treadHz,
      metallicChinkHz: chinkHz,
      puddleWetness,
      animationClip: animClip,
      animationPhase: animPhase,
      footWorldPosition: footsteps.lastFootWorldPosition,
    };
    eventHistory.push({
      trigger: 'onFootstep',
      timestamp: footsteps.lastStepAt,
      durationMs: spec.durationMs,
      detail: spec.lastDetail,
    });
    if (eventHistory.length > 64) {
      eventHistory.shift();
    }

    return footsteps;
  }

  function syncFootstepCharacterProfile(characterOrId) {
    const charId =
      typeof characterOrId === 'string'
        ? characterOrId
        : characterOrId && characterOrId.id
        ? characterOrId.id
        : 'hoodie';
    const profile =
      CHARACTER_FOOTSTEP_PROFILES[charId] || CHARACTER_FOOTSTEP_PROFILES.hoodie;
    footsteps.activeCharacterId = charId;
    footsteps.activeFootwearType = profile.footwearType;
    footsteps.walkStepMeters = profile.walkStepMeters;
    footsteps.runStepMeters = profile.runStepMeters;
    footsteps.baseGain = profile.baseGain;
    if (
      typeof sandbox !== 'undefined' &&
      sandbox &&
      sandbox.currentVariantKey
    ) {
      footsteps.activeVariantKey = sandbox.currentVariantKey;
    }
    return profile;
  }

  function playSynthesizedOneShot(triggerName) {
    startContinuousLoopsIfUnlocked();
    if (!audioCtx || state.muted || state.effectiveMasterGain <= 0.001) return;
    try {
      const now = audioCtx.currentTime;
      if (triggerName === 'onActivate') {
        // Power-up frequency sweep + relay click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.22);
        gain.gain.setValueAtTime(0.18 * state.effectiveMasterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (triggerName === 'onHover') {
        // Short high-frequency transient click (28ms < 50ms)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(3400, now);
        osc.frequency.exponentialRampToValueAtTime(4200, now + 0.028);
        gain.gain.setValueAtTime(0.14 * state.effectiveMasterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.028);
      } else if (triggerName === 'onDataStream') {
        // Rapid rhythmic micro-ticks during right-pane text/telemetry animation
        for (let t = 0; t < 8; t++) {
          const tickStart = now + t * 0.042;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2150 + (t % 3) * 180, tickStart);
          gain.gain.setValueAtTime(0.08 * state.effectiveMasterGain, tickStart);
          gain.gain.exponentialRampToValueAtTime(0.001, tickStart + 0.014);
          osc.connect(gain);
          gain.connect(masterGainNode);
          osc.start(tickStart);
          osc.stop(tickStart + 0.014);
        }
      } else if (triggerName === 'onUpdate') {
        // Short mid-frequency signal tone across inter-module tether lines
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.055);
        gain.gain.setValueAtTime(0.15 * state.effectiveMasterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (triggerName === 'onFootstep') {
        const ctxInfo = resolveActiveFootstepContext();
        playSynthesizedFootstep('Walk', footsteps.leftFootNext, 1.0, {
          profile: ctxInfo.profile,
          puddleWetness: 0.35,
          isHolo: ctxInfo.isHolo,
          isClay: ctxInfo.isClay,
        });
      }
    } catch (_e) {
      // Ignore synthesis errors in restricted headless environments
    }
  }

  function trigger(triggerName, detail = {}) {
    if (triggerName === 'onFootstep') {
      return triggerFootstep(detail.stepMode || 'Walk', detail.stepForce || 1.0, detail);
    }
    const spec = uiTriggers[triggerName];
    if (!spec) {
      raiseFatalError(`Unknown UI telemetry audio trigger '${triggerName}'.`);
    }
    const timestamp = performance.now();
    spec.triggerCount += 1;
    spec.lastTriggeredAt = timestamp;
    spec.lastDetail = detail;
    eventHistory.push({
      trigger: triggerName,
      timestamp,
      durationMs: spec.durationMs,
      detail,
    });
    if (eventHistory.length > 64) {
      eventHistory.shift();
    }

    // Synchronize visual terminal animations with audio triggers (SFX.md §4.3)
    if (triggerName === 'onActivate') {
      terminalState.active = true;
      terminalState.ignitionProgress = 0.0;
      sfxSharedUniforms.uTerminalIgnition.value = 0.0;
      const topBar = document.getElementById('holo-top-light-bar');
      const bottomBar = document.getElementById('holo-bottom-light-bar');
      if (topBar) topBar.classList.add('ignited');
      if (bottomBar) bottomBar.classList.add('ignited');
    } else if (triggerName === 'onDataStream') {
      terminalState.dataStreamRemainingSec = 0.36;
      const rightPane = document.getElementById('holo-right-data-pane');
      if (rightPane) {
        rightPane.classList.remove('holo-data-streaming');
        void rightPane.offsetWidth;
        rightPane.classList.add('holo-data-streaming');
      }
    } else if (triggerName === 'onUpdate') {
      terminalState.tetherPulseProgress = 1.0;
      terminalState.activeDataStateIndex = (terminalState.activeDataStateIndex + 1) % 3;
      sfxSharedUniforms.uTetherPulse.value = 1.0;
      const bridgeEl = document.getElementById('holo-tether-bridge');
      if (bridgeEl) {
        bridgeEl.classList.add('pulsing');
        setTimeout(() => bridgeEl.classList.remove('pulsing'), 220);
      }
    }

    const telAudioEl = document.getElementById('tel-audio');
    if (telAudioEl) {
      telAudioEl.textContent = state.muted ? 'MUTED' : `${triggerName} (${Math.round(state.masterGain * 100)}%)`;
    }

    playSynthesizedOneShot(triggerName);
    return spec;
  }

  function setMasterGain(value) {
    const clamped = Math.max(0.0, Math.min(1.0, Number(value)));
    if (Number.isNaN(clamped)) return state.masterGain;
    state.masterGain = Number(clamped.toFixed(3));
    state.effectiveMasterGain = state.muted ? 0.0 : state.masterGain;
    if (masterGainNode && audioCtx) {
      masterGainNode.gain.setTargetAtTime(state.effectiveMasterGain, audioCtx.currentTime, 0.02);
    }
    const labelEl = document.getElementById('audio-gain-label');
    if (labelEl) {
      labelEl.textContent = state.muted ? 'Gain: MUTED' : `Gain: ${Math.round(state.masterGain * 100)}%`;
    }
    const sliderEl = document.getElementById('audio-gain-slider');
    if (sliderEl && Math.abs(Number(sliderEl.value) - state.masterGain) > 0.005) {
      sliderEl.value = String(state.masterGain);
    }
    if (sandbox.camera) {
      updateSpatialAudio(sandbox.camera);
    }
    return state.masterGain;
  }

  function setMuted(mutedBool) {
    state.muted = Boolean(mutedBool);
    state.effectiveMasterGain = state.muted ? 0.0 : state.masterGain;
    if (masterGainNode && audioCtx) {
      masterGainNode.gain.setTargetAtTime(state.effectiveMasterGain, audioCtx.currentTime, 0.02);
    }
    const muteBtn = document.getElementById('audio-mute-btn');
    if (muteBtn) {
      muteBtn.textContent = state.muted ? 'Audio: MUTED (M)' : 'Audio: ON (M)';
    }
    const labelEl = document.getElementById('audio-gain-label');
    if (labelEl) {
      labelEl.textContent = state.muted ? 'Gain: MUTED' : `Gain: ${Math.round(state.masterGain * 100)}%`;
    }
    const telAudioEl = document.getElementById('tel-audio');
    if (telAudioEl) {
      telAudioEl.textContent = state.muted ? 'MUTED' : `2D+3D+UI (${Math.round(state.masterGain * 100)}%)`;
    }
    if (sandbox.camera) {
      updateSpatialAudio(sandbox.camera);
    }
    return state.muted;
  }

  function toggleMute() {
    return setMuted(!state.muted);
  }

  function onPodGlitch(_podId, intensity = 1.0) {
    const ctx = ensureAudioContext();
    if (!ctx || state.muted) return false;
    return synthesizePodGlitchCue(ctx, masterGainNode || ctx.destination, intensity);
  }

  return {
    state,
    get masterGain() {
      return state.masterGain;
    },
    get muted() {
      return state.muted;
    },
    setMasterGain,
    setMuted,
    toggleMute,
    onPodGlitch,
    ambientChannels,
    distantPoliceSiren,
    footsteps,
    footstepProfiles: CHARACTER_FOOTSTEP_PROFILES,
    syncFootstepCharacterProfile,
    triggerFootstep,
    positionalEmitters: {
      terminalEmitter,
      fixtureEmitters,
    },
    terminalEmitter,
    fixtureEmitters,
    terminalState,
    uiTriggers,
    eventHistory,
    trigger,
    updateSpatialAudio,
    unlock: startContinuousLoopsIfUnlocked,
  };
}

function updateSFXAndAudioSubsystems(dt, timeSec) {
  if (!sandbox.sfx) return;
  sfxSharedUniforms.uTime.value = timeSec;

  const floorY = sandbox.environment ? sandbox.environment.floorY : 0.0;
  const termState =
    sandbox.entranceHologram && sandbox.entranceHologram.ignitionState
      ? sandbox.entranceHologram.ignitionState
      : sandbox.audio && sandbox.audio.terminalState
      ? sandbox.audio.terminalState
      : null;

  // Determine active 3D holographic screen mount center position in world space
  if (sandbox.mode === 'mount-focus' && sandbox.focusedMount) {
    const m = sandbox.focusedMount;
    sfxSharedUniforms.uTerminalWorldPos.value.set(
      m.locatorPosition.x,
      m.locatorPosition.y,
      m.locatorPosition.z
    );
  } else if (sandbox.activeHoloProject && sandbox.wallMountsByName[sandbox.activeHoloProject.mountName]) {
    const wm = sandbox.wallMountsByName[sandbox.activeHoloProject.mountName];
    sfxSharedUniforms.uTerminalWorldPos.value.set(
      wm.screenGroup.position.x,
      wm.screenGroup.position.y,
      wm.screenGroup.position.z
    );
  } else if (sandbox.wallMounts && sandbox.wallMounts.length > 0) {
    const wm0 = sandbox.wallMounts[0];
    sfxSharedUniforms.uTerminalWorldPos.value.set(
      wm0.screenGroup.position.x,
      wm0.screenGroup.position.y,
      wm0.screenGroup.position.z
    );
  } else {
    sfxSharedUniforms.uTerminalWorldPos.value.set(
      ENTRANCE_HOLO_ANCHOR_X,
      floorY + ENTRANCE_HOLO_ELEVATION_OFFSET_Y + 0.42,
      ENTRANCE_HOLO_ANCHOR_Z
    );
  }

  if (termState) {
    if (termState.ignitionProgress < 1.0) {
      termState.ignitionProgress = Math.min(1.0, termState.ignitionProgress + dt / 0.22);
    }
    sfxSharedUniforms.uTerminalIgnition.value = termState.ignitionProgress;

    if (termState.tetherPulseProgress > 0.0) {
      termState.tetherPulseProgress = Math.max(0.0, termState.tetherPulseProgress - dt / 0.22);
    }
    sfxSharedUniforms.uTetherPulse.value = termState.tetherPulseProgress;

    if (termState.dataStreamRemainingSec > 0.0) {
      termState.dataStreamRemainingSec = Math.max(0.0, termState.dataStreamRemainingSec - dt);
    }
  }

  if (sandbox.sfx.ambientParticulates) {
    sandbox.sfx.ambientParticulates.update(dt, timeSec, sfxSharedUniforms.uTerminalWorldPos.value);
  }
  if (sandbox.sfx.precipitation) {
    sandbox.sfx.precipitation.update(dt, camera.position);
  }
  if (sandbox.audio) {
    sandbox.audio.updateSpatialAudio(camera, timeSec);
  }
}

// ============================================================================
// Entrance Dual-Pane Amber Holographic Terminal (hologram.glb — Approach-Gated)
// ============================================================================
const ENTRANCE_HOLO_ANCHOR_X = -0.46;
const ENTRANCE_HOLO_ANCHOR_Z = 5.00;
const ENTRANCE_HOLO_ELEVATION_OFFSET_Y = 1.15;
const ENTRANCE_HOLO_BASE_SCALE = 0.82;
const ENTRANCE_HOLO_APPROACH_START_Z = 3.12;
const ENTRANCE_HOLO_APPROACH_FULL_Z = 3.55;
const ENTRANCE_HOLO_SCROLL_END_P = 0.18;
const ENTRANCE_HOLO_SCROLL_FADEOUT_P = 0.22;
const ENTRANCE_HOLO_FREEROAM_RADIUS = 3.40;
const ENTRANCE_HOLO_FREEROAM_FULL_RADIUS = 2.15;

function smoothstep01(t) {
  const c = Math.max(0.0, Math.min(1.0, t));
  return c * c * (3.0 - 2.0 * c);
}

function buildEntranceHologram(hologramGLTF, floorY) {
  if (!hologramGLTF || !hologramGLTF.scene) {
    raiseFatalError('Missing hologram.glb scene for Entrance Dual-Pane Holographic Terminal.');
  }

  entranceHologramRootGroup.clear();

  const holoRoot = hologramGLTF.scene;
  holoRoot.name = 'EntranceDualPaneHologram';

  const requiredSubMeshes = [
    'HoloTerminal_SmokedGlassPanes',
    'HoloTerminal_HighBloomAccents',
    'HoloTerminal_StructuralFrames',
    'HoloTerminal_BezelAndTierDetails',
  ];
  const meshesByName = {};
  const interactiveMeshes = [];
  const glassMaterials = [];
  const bloomMaterials = [];
  const frameMaterials = [];

  holoRoot.traverse((node) => {
    if (node.isMesh && node.geometry) {
      meshesByName[node.name] = node;
      node.frustumCulled = false;
      node.raycast = noOpRaycast;
      node.userData.isHoloTerminalRegion = true;
      node.userData.subRegion = node.name;
      interactiveMeshes.push(node);

      const srcMats = Array.isArray(node.material) ? node.material : [node.material];
      const clonedMats = srcMats.map((m) => {
        const cloned = m.clone();
        cloned.transparent = true;
        cloned.depthTest = true;
        cloned.depthWrite = false;
        cloned.fog = false;
        cloned.side = THREE.DoubleSide;
        if ('transmission' in cloned) cloned.transmission = 0.0;
        if ('envMapIntensity' in cloned) cloned.envMapIntensity = 0.0;

        if (node.name.includes('SmokedGlassPanes')) {
          cloned.color = new THREE.Color(0xffffff);
          cloned.emissive = new THREE.Color(0xff9d00);
          if (cloned.map && !cloned.emissiveMap) {
            cloned.emissiveMap = cloned.map;
          }
          cloned.emissiveIntensity = 1.85;
          cloned.opacity = 0.0;
          glassMaterials.push(cloned);
          node.renderOrder = 10;
        } else if (node.name.includes('HighBloomAccents')) {
          cloned.color = new THREE.Color(0xfff0b3);
          cloned.emissive = new THREE.Color(0xffb700);
          cloned.emissiveIntensity = 3.85;
          cloned.opacity = 0.0;
          bloomMaterials.push(cloned);
          node.renderOrder = 12;
        } else {
          cloned.color = new THREE.Color(0xffae00);
          cloned.emissive = new THREE.Color(0xff9d00);
          cloned.emissiveIntensity = 2.45;
          cloned.opacity = 0.0;
          frameMaterials.push(cloned);
          node.renderOrder = 11;
        }

        applyCharacterOcclusionStencilReject(cloned);
        cloned.needsUpdate = true;
        return cloned;
      });

      node.material = Array.isArray(node.material) ? clonedMats : clonedMats[0];
    }
  });

  for (const reqName of requiredSubMeshes) {
    if (!meshesByName[reqName]) {
      raiseFatalError(`hologram.glb is missing required sub-mesh '${reqName}'.`);
    }
  }

  // Attach non-conical radial-ellipsoidal diffused light volume and PointLight for hologram.glb
  const holoDiffusedGeom = new THREE.SphereGeometry(1.0, 20, 14);
  holoDiffusedGeom.scale(1.25, 0.85, 0.95);
  const holoDiffusedMat = new THREE.ShaderMaterial({
    name: 'EntranceHologramDiffusedLightMaterial',
    uniforms: {
      uTime: holoShaderUniforms.uHoloTime,
      uColorCore: { value: new THREE.Color(0xffb700) },
      uColorHalo: { value: new THREE.Color(0xd97706) },
      uIntensity: { value: 0.0 },
    },
    vertexShader: `
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        vLocalPos = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorCore;
      uniform vec3 uColorHalo;
      uniform float uIntensity;
      varying vec3 vLocalPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        float r = clamp(length(vLocalPos / vec3(1.25, 0.85, 0.95)), 0.0, 1.0);
        float radialFalloff = exp(-2.35 * r * r) * smoothstep(1.0, 0.08, r);
        float ndotv = clamp(abs(dot(normalize(vWorldNormal), normalize(vViewDir))), 0.0, 1.0);
        float softEnvelope = pow(ndotv, 1.50);
        float shimmer = 0.94 + 0.06 * sin(uTime * 3.1 + r * 3.8);
        vec3 col = mix(uColorHalo, uColorCore, (1.0 - r * 0.65) * ndotv);
        float alpha = clamp(0.24 * radialFalloff * softEnvelope * uIntensity * shimmer, 0.0, 0.46);
        gl_FragColor = vec4(col * shimmer, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  applyCharacterOcclusionStencilReject(holoDiffusedMat);
  const holoDiffusedMesh = new THREE.Mesh(holoDiffusedGeom, holoDiffusedMat);
  holoDiffusedMesh.name = 'EntranceHologram_DiffusedLightVolume';
  holoDiffusedMesh.position.set(0.0, 0.42, 0.0);
  holoDiffusedMesh.renderOrder = 6;
  holoDiffusedMesh.raycast = noOpRaycast;
  holoRoot.add(holoDiffusedMesh);

  const holoDiffusedLight = new THREE.PointLight(0xffa600, 0.0, 5.2, 1.8);
  holoDiffusedLight.position.set(0.0, 0.42, 0.15);
  holoRoot.add(holoDiffusedLight);

  const anchorY = floorY + ENTRANCE_HOLO_ELEVATION_OFFSET_Y;
  holoRoot.position.set(ENTRANCE_HOLO_ANCHOR_X, anchorY, ENTRANCE_HOLO_ANCHOR_Z);
  // Rotate 180° around Y so the local +Z front normal faces -Z toward the approaching character at Z = 3.0m..5.0m
  holoRoot.rotation.set(0.0, Math.PI, 0.0);
  holoRoot.scale.setScalar(ENTRANCE_HOLO_BASE_SCALE);
  holoRoot.visible = false;

  entranceHologramRootGroup.add(holoRoot);
  entranceHologramRootGroup.updateMatrixWorld(true);

  return {
    root: holoRoot,
    terminalNode: holoRoot,
    parentGroup: entranceHologramRootGroup,
    rootGroup: entranceHologramRootGroup,
    meshesByName,
    interactiveMeshes,
    glassMaterials,
    bloomMaterials,
    frameMaterials,
    diffusedLightMesh: holoDiffusedMesh,
    diffusedLightMat: holoDiffusedMat,
    diffusedPointLight: holoDiffusedLight,
    isConicalLight: false,
    diffusionType: 'radial-omnidirectional',
    materials: {
      glass: glassMaterials[0] || null,
      highBloom: bloomMaterials[0] || null,
      frame: frameMaterials[0] || null,
      diffusedLight: holoDiffusedMat,
    },
    ignitionState: {
      active: true,
      ignitionProgress: 1.0,
      tetherPulseProgress: 0.0,
      dataStreamRemainingSec: 0.0,
      activeDataStateIndex: 0,
    },
    fogImmunity: true,
    visibilityPct: 100.0,
    anchorPosition: new THREE.Vector3(ENTRANCE_HOLO_ANCHOR_X, anchorY, ENTRANCE_HOLO_ANCHOR_Z),
    position: holoRoot.position,
    rotation: holoRoot.rotation,
    scale: holoRoot.scale,
    baseScale: ENTRANCE_HOLO_BASE_SCALE,
    visible: false,
    isActive: false,
    approachAlpha: 0.0,
    opacity: 0.0,
    distanceToCharacter: 2.0,
  };
}

function updateEntranceHologram(timeSec = 0.0) {
  const holo = sandbox.entranceHologram;
  if (!holo || !sandbox.ready) return;

  const activeChar = sandbox.getActiveCharacter();
  const charX = activeChar ? activeChar.position.x : 0.0;
  const charZ = activeChar ? activeChar.position.z : 3.0;
  const anchorY = holo.anchorPosition.y;

  let approachAlpha = 0.0;
  let targetX = ENTRANCE_HOLO_ANCHOR_X;
  let targetZ = ENTRANCE_HOLO_ANCHOR_Z;

  if (sandbox.mode === 'scroll') {
    const p = sandbox.scrollProgress;
    // Strictly hidden at initial spawn (Z = 3.00m); appears only as character.glb approaches Z > 3.12m
    if (charZ > ENTRANCE_HOLO_APPROACH_START_Z && p < ENTRANCE_HOLO_SCROLL_FADEOUT_P) {
      const fadeIn = smoothstep01(
        (charZ - ENTRANCE_HOLO_APPROACH_START_Z) /
          (ENTRANCE_HOLO_APPROACH_FULL_Z - ENTRANCE_HOLO_APPROACH_START_Z)
      );
      let fadeOut = 1.0;
      if (p > ENTRANCE_HOLO_SCROLL_END_P) {
        fadeOut =
          1.0 -
          smoothstep01(
            (p - ENTRANCE_HOLO_SCROLL_END_P) /
              (ENTRANCE_HOLO_SCROLL_FADEOUT_P - ENTRANCE_HOLO_SCROLL_END_P)
          );
      }
      approachAlpha = fadeIn * fadeOut;
      targetX = charX + ENTRANCE_HOLO_ANCHOR_X;
      targetZ = Math.max(ENTRANCE_HOLO_ANCHOR_Z, Math.min(5.55, charZ + 1.38));
    }
  } else if (sandbox.mode === 'freeroam') {
    const distToAnchor = Math.hypot(
      charX - ENTRANCE_HOLO_ANCHOR_X,
      charZ - ENTRANCE_HOLO_ANCHOR_Z
    );
    if (
      charZ > ENTRANCE_HOLO_APPROACH_START_Z &&
      distToAnchor < ENTRANCE_HOLO_FREEROAM_RADIUS
    ) {
      const proxFactor = smoothstep01(
        (ENTRANCE_HOLO_FREEROAM_RADIUS - distToAnchor) /
          (ENTRANCE_HOLO_FREEROAM_RADIUS - ENTRANCE_HOLO_FREEROAM_FULL_RADIUS)
      );
      const spawnFactor = smoothstep01(
        (charZ - ENTRANCE_HOLO_APPROACH_START_Z) /
          (ENTRANCE_HOLO_APPROACH_FULL_Z - ENTRANCE_HOLO_APPROACH_START_Z)
      );
      approachAlpha = proxFactor * spawnFactor;
      targetX = ENTRANCE_HOLO_ANCHOR_X;
      targetZ =
        charZ <= ENTRANCE_HOLO_ANCHOR_Z
          ? Math.max(ENTRANCE_HOLO_ANCHOR_Z, charZ + 1.30)
          : ENTRANCE_HOLO_ANCHOR_Z;
    }
  }

  const wasVisible = holo.visible;
  const isVisible = approachAlpha > 0.001;
  holo.visible = isVisible;
  holo.isActive = isVisible;
  holo.approachAlpha = Number(approachAlpha.toFixed(4));
  holo.opacity = Number(approachAlpha.toFixed(4));
  holo.root.visible = isVisible;

  if (!wasVisible && isVisible && sandbox.audio) {
    sandbox.audio.trigger('onActivate', { source: 'entranceHologram', z: Number(charZ.toFixed(2)) });
  }

  if (isVisible) {
    const hoverBobY = 0.008 * Math.sin(timeSec * 2.2);
    const pulse = 0.94 + 0.06 * Math.sin(timeSec * 3.2);
    holo.root.position.set(targetX, anchorY + hoverBobY, targetZ);
    holo.root.rotation.set(0.0, Math.PI, 0.0);

    const scaleX = holo.baseScale * (0.90 + 0.10 * approachAlpha);
    const scaleY = holo.baseScale * (0.18 + 0.82 * approachAlpha);
    const scaleZ = holo.baseScale;
    holo.root.scale.set(scaleX, scaleY, scaleZ);

    for (let i = 0; i < holo.glassMaterials.length; i++) {
      const m = holo.glassMaterials[i];
      m.opacity = 0.92 * approachAlpha;
      m.emissiveIntensity = 1.85 * pulse * approachAlpha;
    }
    for (let i = 0; i < holo.bloomMaterials.length; i++) {
      const m = holo.bloomMaterials[i];
      m.opacity = 1.0 * approachAlpha;
      m.emissiveIntensity = 3.85 * pulse * approachAlpha;
    }
    for (let i = 0; i < holo.frameMaterials.length; i++) {
      const m = holo.frameMaterials[i];
      m.opacity = 0.96 * approachAlpha;
      m.emissiveIntensity = 2.45 * pulse * approachAlpha;
    }
    if (holo.diffusedLightMat) {
      holo.diffusedLightMat.uniforms.uIntensity.value = approachAlpha * pulse;
    }
    if (holo.diffusedPointLight) {
      holo.diffusedPointLight.intensity = 1.65 * approachAlpha * pulse;
    }

    holo.root.updateMatrixWorld(true);
  } else {
    if (holo.diffusedLightMat) {
      holo.diffusedLightMat.uniforms.uIntensity.value = 0.0;
    }
    if (holo.diffusedPointLight) {
      holo.diffusedPointLight.intensity = 0.0;
    }
  }

  holo.distanceToCharacter = Number(
    Math.hypot(charX - holo.root.position.x, charZ - holo.root.position.z).toFixed(4)
  );
}

// ============================================================================
// Geometry & Collision Extraction Helpers
// ============================================================================
function extractWallSegmentsFromColliders(colliderMeshes) {
  const wallSegments = [];
  const wallNames = [
    'COLLIDER_WALL_L',
    'COLLIDER_WALL_R',
    'COLLIDER_BOUND_START',
    'COLLIDER_BOUND_END',
  ];

  for (const name of wallNames) {
    const mesh = colliderMeshes[name];
    if (!mesh || !mesh.geometry) {
      raiseFatalError(`Missing geometry on required wall collider '${name}'.`);
    }
    mesh.updateMatrixWorld(true);
    const geom = mesh.geometry;
    const posAttr = geom.attributes.position;
    const indexAttr = geom.index;
    if (!posAttr || !indexAttr) {
      raiseFatalError(`Wall collider '${name}' is missing position or index buffer attributes.`);
    }

    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const triNormal = new THREE.Vector3();

    for (let i = 0; i < indexAttr.count; i += 6) {
      const i0 = indexAttr.getX(i);
      const i1 = indexAttr.getX(i + 1);
      const i2 = indexAttr.getX(i + 2);

      v0.fromBufferAttribute(posAttr, i0).applyMatrix4(mesh.matrixWorld);
      v1.fromBufferAttribute(posAttr, i1).applyMatrix4(mesh.matrixWorld);
      v2.fromBufferAttribute(posAttr, i2).applyMatrix4(mesh.matrixWorld);

      e1.subVectors(v1, v0);
      e2.subVectors(v2, v0);
      triNormal.crossVectors(e1, e2).normalize();

      const nx = triNormal.x;
      const nz = triNormal.z;
      const nLen = Math.hypot(nx, nz);
      if (nLen < 1e-5) {
        continue;
      }

      wallSegments.push({
        colliderName: name,
        ax: v0.x,
        az: v0.z,
        bx: v1.x,
        bz: v1.z,
        nx: nx / nLen,
        nz: nz / nLen,
        minY: Math.min(v0.y, v1.y, v2.y),
        maxY: Math.max(v0.y, v1.y, v2.y),
      });
    }
  }

  if (wallSegments.length === 0) {
    raiseFatalError('Zero wall segments extracted from COLLIDERS.');
  }
  return wallSegments;
}

function extractFloorTriangles(floorMesh) {
  floorMesh.updateMatrixWorld(true);
  const geom = floorMesh.geometry;
  const posAttr = geom.attributes.position;
  const indexAttr = geom.index;
  if (!posAttr || !indexAttr) {
    raiseFatalError('COLLIDER_FLOOR is missing position or index attributes.');
  }

  const tris = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < indexAttr.count; i += 3) {
    a.fromBufferAttribute(posAttr, indexAttr.getX(i)).applyMatrix4(floorMesh.matrixWorld);
    b.fromBufferAttribute(posAttr, indexAttr.getX(i + 1)).applyMatrix4(floorMesh.matrixWorld);
    c.fromBufferAttribute(posAttr, indexAttr.getX(i + 2)).applyMatrix4(floorMesh.matrixWorld);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();
    tris.push({
      ax: a.x, ay: a.y, az: a.z,
      bx: b.x, by: b.y, bz: b.z,
      cx: c.x, cy: c.y, cz: c.z,
      nx: normal.x, ny: normal.y, nz: normal.z,
      y: (a.y + b.y + c.y) / 3.0,
    });
  }
  return tris;
}

function sampleSurfaceHeightAndNormal(x, z, floorTriangles, refY = undefined) {
  if (!floorTriangles || floorTriangles.length === 0) {
    return { height: 0.0, normal: { x: 0.0, y: 1.0, z: 0.0 }, onFloor: false };
  }
  const activeY =
    typeof refY === 'number' && !Number.isNaN(refY)
      ? refY
      : typeof sandbox !== 'undefined' && sandbox.ready && sandbox.getActiveCharacter()
      ? sandbox.getActiveCharacter().position.y
      : 0.0;

  let bestMatch = null;
  let bestScore = Infinity;

  for (let i = 0; i < floorTriangles.length; i++) {
    const t = floorTriangles[i];
    const v0x = t.cx - t.ax;
    const v0z = t.cz - t.az;
    const v1x = t.bx - t.ax;
    const v1z = t.bz - t.az;
    const v2x = x - t.ax;
    const v2z = z - t.az;

    const dot00 = v0x * v0x + v0z * v0z;
    const dot01 = v0x * v1x + v0z * v1z;
    const dot02 = v0x * v2x + v0z * v2z;
    const dot11 = v1x * v1x + v1z * v1z;
    const dot12 = v1x * v2x + v1z * v2z;

    const denom = dot00 * dot11 - dot01 * dot01;
    if (Math.abs(denom) < 1e-12) continue;
    const invDenom = 1.0 / denom;
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    if (u >= -1e-4 && v >= -1e-4 && (u + v) <= 1.0001) {
      const y = t.ay + u * (t.cy - t.ay) + v * (t.by - t.ay);
      const dy = y - activeY;
      // Prefer walkable surfaces within step-up height (+1.25m) closest to current elevation
      const penalty = dy > 1.25 ? 100.0 + dy : Math.abs(dy);
      if (penalty < bestScore) {
        bestScore = penalty;
        bestMatch = {
          height: y,
          normal: { x: t.nx, y: t.ny, z: t.nz },
          onFloor: true,
        };
      }
    }
  }
  if (bestMatch) {
    return bestMatch;
  }
  return { height: 0.0, normal: { x: 0.0, y: 1.0, z: 0.0 }, onFloor: false };
}

function resolveCircleAgainstWalls(posXZ, velXZ, radius, wallSegments) {
  if (typeof sandbox !== 'undefined' && sandbox.freeRoamFlyMode) {
    return 0.0;
  }
  let maxImpactSpeed = 0.0;
  for (let iter = 0; iter < 4; iter++) {
    for (let i = 0; i < wallSegments.length; i++) {
      const seg = wallSegments[i];
      const abx = seg.bx - seg.ax;
      const abz = seg.bz - seg.az;
      const abLenSq = abx * abx + abz * abz;
      if (abLenSq < 1e-10) continue;

      const apx = posXZ.x - seg.ax;
      const apz = posXZ.z - seg.az;
      const t = Math.max(0.0, Math.min(1.0, (apx * abx + apz * abz) / abLenSq));

      const qx = seg.ax + t * abx;
      const qz = seg.az + t * abz;

      const dx = posXZ.x - qx;
      const dz = posXZ.z - qz;
      const dist = Math.hypot(dx, dz);
      const signedInward = dx * seg.nx + dz * seg.nz;

      if (dist < radius) {
        let pushX = seg.nx;
        let pushZ = seg.nz;
        if (dist > 1e-6 && signedInward >= 0.0) {
          pushX = dx / dist;
          pushZ = dz / dist;
        }
        posXZ.x = qx + pushX * radius;
        posXZ.z = qz + pushZ * radius;

        if (velXZ) {
          const vn = velXZ.x * pushX + velXZ.z * pushZ;
          if (vn < 0.0) {
            const impact = Math.abs(vn);
            if (impact > maxImpactSpeed) maxImpactSpeed = impact;
            velXZ.x -= vn * pushX;
            velXZ.z -= vn * pushZ;
          }
        }
      }
    }
  }
  return maxImpactSpeed;
}

function resolveCharacterSeparation(activePosXZ, activeVelXZ, idlePosXZ, minSeparation) {
  const dx = activePosXZ.x - idlePosXZ.x;
  const dz = activePosXZ.z - idlePosXZ.z;
  const dist = Math.hypot(dx, dz);
  if (dist < minSeparation) {
    const nx = dist > 1e-6 ? dx / dist : 0.0;
    const nz = dist > 1e-6 ? dz / dist : -1.0;
    activePosXZ.x = idlePosXZ.x + nx * minSeparation;
    activePosXZ.z = idlePosXZ.z + nz * minSeparation;
    if (activeVelXZ) {
      const vn = activeVelXZ.x * nx + activeVelXZ.z * nz;
      if (vn < 0.0) {
        activeVelXZ.x -= vn * nx;
        activeVelXZ.z -= vn * nz;
      }
    }
  }
}

function intersectRay2DSegment(ox, oz, dx, dz, maxDist, ax, az, bx, bz) {
  const sx = bx - ax;
  const sz = bz - az;
  const denom = dx * sz - dz * sx;
  if (Math.abs(denom) < 1e-8) return null;

  const aox = ax - ox;
  const aoz = az - oz;
  const t = (aox * sz - aoz * sx) / denom;
  const u = (aox * dz - aoz * dx) / denom;

  if (t >= 0.0 && t <= maxDist && u >= -0.01 && u <= 1.01) {
    return t;
  }
  return null;
}

// ============================================================================
// HOLO.SYS 3D Holographic Visualizer Shader (YasirAwan4831/holographic-shader-visualizer-three.Js)
// Live Demo: https://holographic-threejs.vercel.app
// ============================================================================
const holoShaderUniforms = {
  uHoloTime: { value: 0.0 },
  uHoloColor: { value: new THREE.Color('#00d5ff') },
};

function createHolographicIridescentMaterial(id) {
  const mat = new THREE.MeshBasicMaterial({
    name: `${id}_HoloSysIridescentMaterial`,
    color: new THREE.Color('#00d5ff'),
    transparent: true,
    opacity: 0.94,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloTime = holoShaderUniforms.uHoloTime;
    shader.uniforms.uHoloColor = holoShaderUniforms.uHoloColor;
    shader.vertexShader =
      `uniform float uHoloTime;
varying vec3 vHoloWorldPos;
varying vec3 vHoloNormal;
varying vec3 vHoloViewPos;
float holoSysRandom(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
` +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        #if defined( USE_ENVMAP ) || defined( USE_SKINNING )
          vHoloNormal = normalize( transformedNormal );
        #else
          vHoloNormal = normalize( normalMatrix * normal );
        #endif
        vHoloViewPos = -mvPosition.xyz;
        vec4 holoWorldPosition = modelMatrix * vec4(transformed, 1.0);
        float glitchTime = uHoloTime - holoWorldPosition.y;
        float glitchStrength = (
          sin(glitchTime) *
          sin(glitchTime * 3.45) +
          sin(glitchTime * 8.76)
        ) / 3.0;
        glitchStrength = smoothstep(0.5, 1.0, glitchStrength) * 0.04;
        holoWorldPosition.x += (holoSysRandom(holoWorldPosition.xz + uHoloTime) - 0.5) * glitchStrength;
        holoWorldPosition.z += (holoSysRandom(holoWorldPosition.zx + uHoloTime) - 0.5) * glitchStrength;
        vHoloWorldPos = holoWorldPosition.xyz;`
      );
    shader.fragmentShader =
      `uniform float uHoloTime;
uniform vec3 uHoloColor;
varying vec3 vHoloWorldPos;
varying vec3 vHoloNormal;
varying vec3 vHoloViewPos;
` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        // HOLO.SYS 3D Holographic Visualizer + Full-Body Thin-Film Iridescent Shader:
        float lines = 20.0;
        float offset = vHoloWorldPos.y - uHoloTime * 0.22;
        float density = pow(mod(offset * lines, 1.0), 3.0);
        float fineScan = 0.5 + 0.5 * sin(vHoloWorldPos.y * 120.0 - uHoloTime * 5.0);

        float ndotv = clamp(abs(dot(normalize(vHoloNormal), normalize(vHoloViewPos))), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 2.0);
        float falloff = smoothstep(0.85, 0.0, fresnel);

        float holoRim = (density * fresnel + fresnel * 1.25) * falloff;
        float holoFullBody = 0.44 + 0.48 * density + 0.14 * fineScan + holoRim;

        // Thin-Film Iridescent Spectrum (Cyan #00d5ff <-> Aqua #00ffa3 <-> Violet #a855f7 <-> Magenta #ff2bd6 <-> Gold)
        float iridPhase = 6.2831853 * (1.35 * (1.0 - ndotv) + 0.68 * vHoloWorldPos.y - 0.22 * uHoloTime + 0.10 * density);
        vec3 iridSpectrum = vec3(
          0.52 + 0.48 * cos(iridPhase - 2.05),
          0.58 + 0.42 * cos(iridPhase - 0.15),
          0.86 + 0.14 * cos(iridPhase + 0.75)
        );
        float iridMix = clamp(0.64 + 0.30 * (1.0 - ndotv) + 0.16 * sin(vHoloWorldPos.y * 3.14159 - uHoloTime * 1.4), 0.45, 0.94);
        vec3 holoIridescentColor = mix(uHoloColor, iridSpectrum, iridMix);

        vec3 finalHoloRgb = holoIridescentColor * holoFullBody
          + iridSpectrum * (0.55 * fresnel + 0.32 * density)
          + vec3(0.25, 0.95, 1.0) * (0.38 * pow(fresnel, 2.2));
        float finalHoloAlpha = clamp(0.92 + 0.05 * density + 0.04 * fresnel, 0.92, 0.99);
        gl_FragColor = vec4(finalHoloRgb, finalHoloAlpha);`
      );
  };
  mat.customProgramCacheKey = () => `holo_sys_iridescent_v5_${id}`;
  return mat;
}

// ============================================================================
// Autonomous Above-Shoulder Levitating DOOM_.glb Companion Kinematics (Spec 022 §3)
// ============================================================================
const DOOM_COMPANION_EQUILIBRIUM = { x: -0.430, y: 1.862, z: 0.055 };
const DOOM_LEVITATION_AMP_Y = 0.036;   // m — vertical bobbing amplitude (peak-to-trough = 0.072m in [0.055m, 0.095m])
const DOOM_LEVITATION_OMEGA_Y = 2.80;  // rad/s — vertical hover frequency (~0.446 Hz in [0.35, 0.65] Hz)
const DOOM_LEVITATION_AMP_X = 0.011;   // m — lateral micro-drift amplitude (in [0.006m, 0.016m])
const DOOM_LEVITATION_OMEGA_X = 1.40;  // rad/s — lateral drift frequency
const DOOM_LEVITATION_AMP_Z = 0.010;   // m — depth micro-drift amplitude (in [0.006m, 0.016m])
const DOOM_LEVITATION_OMEGA_Z = 2.10;  // rad/s — depth drift frequency
const DOOM_LEVITATION_AMP_PITCH = 0.052; // rad (~2.98 deg in [1.5, 4.5] deg)
const DOOM_LEVITATION_AMP_ROLL = 0.048;  // rad (~2.75 deg in [1.5, 4.5] deg)
const DOOM_LEVITATION_AMP_YAW = 0.061;   // rad (~3.50 deg in [2.0, 6.0] deg)

// ============================================================================
// Character Controller Class
// ============================================================================
class CharacterController {
  constructor({ id, label, gltfScene, sharedClips, spawnPos, spawnYaw, floorY, baseColor }) {
    this.id = id;
    this.label = label;
    this.root = gltfScene;
    this.root.name = `Character_${id}`;
    this.floorY = floorY;

    this.skinnedMesh = null;
    this.skinnedMeshes = [];
    this.companionMesh = null;
    this.companionMeshes = [];
    this.renderMeshes = [];
    this.companionAnchor = new THREE.Vector3(
      DOOM_COMPANION_EQUILIBRIUM.x,
      DOOM_COMPANION_EQUILIBRIUM.y,
      DOOM_COMPANION_EQUILIBRIUM.z
    );
    this.companionLevitationState = {
      timeSec: 0.0,
      dx: 0.0,
      dy: 0.0,
      dz: 0.0,
      pitch: 0.0,
      roll: 0.0,
      yaw: 0.0,
    };
    this.defaultMaterials = new Map();
    this.defaultMaterial = null;
    this.holoMaterial = createHolographicIridescentMaterial(id);
    applyCharacterForegroundStencilWrite(this.holoMaterial);
    this.isHoloShaderActive = true;
    this.bonesByName = new Map();
    this.root.traverse((node) => {
      const isCompanionNode =
        node.isMesh &&
        !node.isSkinnedMesh &&
        typeof node.name === 'string' &&
        (node.name === 'DOOM_Companion' || node.name.startsWith('DOOM_Companion'));
      if (node.isSkinnedMesh || isCompanionNode) {
        if (node.isSkinnedMesh) {
          if (!this.skinnedMesh) {
            this.skinnedMesh = node;
          }
          this.skinnedMeshes.push(node);
        } else {
          if (node.geometry && (node.geometry.attributes.skinIndex || node.geometry.attributes.skinWeight)) {
            raiseFatalError(
              `Companion node '${node.name}' on '${id}' must have 0 skeletal skin weights (JOINTS_0 / WEIGHTS_0 found).`
            );
          }
          if (node.geometry) {
            node.geometry.computeBoundingBox();
            const geomBox = node.geometry.boundingBox;
            if (geomBox) {
              const geomCenter = new THREE.Vector3();
              geomBox.getCenter(geomCenter);
              if (geomCenter.length() > 0.05) {
                this.companionAnchor.copy(geomCenter);
                node.geometry.translate(-geomCenter.x, -geomCenter.y, -geomCenter.z);
                node.geometry.computeBoundingBox();
                node.geometry.computeBoundingSphere();
              } else if (node.position.length() > 0.05) {
                this.companionAnchor.copy(node.position);
              }
            }
          }
          node.position.copy(this.companionAnchor);
          node.rotation.set(0.0, 0.0, 0.0);
          if (!this.companionMesh) {
            this.companionMesh = node;
          }
          this.companionMeshes.push(node);
        }
        this.renderMeshes.push(node);
        node.frustumCulled = false;
        node.renderOrder = 1;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        const isAuthoredHolo = mats.some((m) => m && typeof m.name === 'string' && m.name.includes('Holo'));
        const hasTexture = mats.some((m) => m && m.map);
        let fallbackMat = node.material;
        if (isAuthoredHolo || hasTexture) {
          for (const m of mats) {
            if (!m) continue;
            m.transparent = false;
            m.opacity = 1.0;
            m.depthTest = true;
            m.depthWrite = true;
            m.side = THREE.FrontSide;
            if ('transmission' in m) m.transmission = 0.0;
            if ('clearcoat' in m) m.clearcoat = 0.0;
            if ('iridescence' in m) m.iridescence = 0.0;
            if (hasTexture) {
              m.roughness = 0.85;
              m.metalness = 0.0;
            }
            m.needsUpdate = true;
          }
          fallbackMat = node.material;
          applyCharacterForegroundStencilWrite(fallbackMat);
        } else {
          fallbackMat = new THREE.MeshStandardMaterial({
            name: `${id}_${isCompanionNode ? 'Companion_' : ''}StandardMaterial`,
            color: baseColor,
            roughness: 0.54,
            metalness: 0.08,
            transparent: false,
            opacity: 1.0,
            depthTest: true,
            depthWrite: true,
            side: THREE.FrontSide,
          });
          applyCharacterForegroundStencilWrite(fallbackMat);
        }
        this.defaultMaterials.set(node, fallbackMat);
        if (!this.defaultMaterial && node.isSkinnedMesh) {
          this.defaultMaterial = fallbackMat;
        }
        node.material = this.holoMaterial;
        node.material.needsUpdate = true;
      }
      if (node.isBone) {
        this.bonesByName.set(node.name, node);
      }
    });

    if (!this.skinnedMesh || !this.skinnedMesh.skeleton) {
      raiseFatalError(`Character '${id}' is missing a valid SkinnedMesh or Skeleton.`);
    }
    if (this.skinnedMesh.skeleton.bones.length !== 64) {
      raiseFatalError(
        `Character '${id}' expected 64 Ready Player Me (RPM) humanoid skeleton bones, found ${this.skinnedMesh.skeleton.bones.length}.`
      );
    }
    for (const jName of RPM_REQUIRED_HUMANOID_BONES) {
      if (!this.bonesByName.has(jName) && !this.root.getObjectByName(jName)) {
        raiseFatalError(`Character '${id}' is missing required Ready Player Me humanoid bone '${jName}'.`);
      }
    }
    if (id === 'hoodie' && !this.companionMesh) {
      raiseFatalError(`Character '${id}' is missing required 'DOOM_Companion' mesh node.`);
    }
    this.root.traverse((node) => {
      if (node.name && (node.name.startsWith('Skateboard_') || node.name.startsWith('SprayCan_') || node.name === 'SKATEBOARD_ROOT' || node.name === 'TRUCK_FRONT' || node.name === 'TRUCK_BACK')) {
        raiseFatalError(`Character '${id}' contains prohibited legacy prop node '${node.name}'.`);
      }
    });

    this.position = new THREE.Vector3(spawnPos.x, floorY, spawnPos.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = spawnYaw;
    this.isGrounded = true;
    this.state = 'Idle';
    this.customEmoteActive = false;
    this.dialogueActive = false;
    this.lastDialogueClipName = null;
    this.dialogueChainCount = 0;
    this.dialogueClipHistory = [];
    this.currentClipName = null;
    this.currentAction = null;
    this.moveSpeed = 0.0;
    this.groundHeight = floorY;

    this.root.position.copy(this.position);
    this.root.rotation.set(0, this.yaw, 0);

    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = new Map();

    for (const clip of sharedClips) {
      const action = this.mixer.clipAction(clip);
      if (isLoopingClip(clip.name)) {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      } else {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions.set(clip.name, action);
    }

    this.mixer.addEventListener('finished', (event) => {
      if (this.dialogueActive && event.action === this.currentAction) {
        // Fallback mid-sentence chain if a very short clip finishes before the chaining window
        const nextDialogueClip = this.selectNextDialogueClip();
        this.crossfadeTo(nextDialogueClip, DIALOGUE_CHAIN_CROSSFADE, true);
        return;
      }
      if (this.customEmoteActive && event.action === this.currentAction) {
        this.customEmoteActive = false;
        this.state = 'Idle';
        this.crossfadeTo('IDLE_DEFAULT', DIALOGUE_EXIT_CROSSFADE);
      } else if (this.state === 'Jump' && event.action === this.actions.get('JUMP_DEFAULT')) {
        if (!this.isGrounded && this.actions.has('FALL_DEFAULT')) {
          this.crossfadeTo('FALL_DEFAULT', JUMP_CROSSFADE);
        } else if (this.isGrounded && !this.customEmoteActive) {
          this.state = 'Idle';
          this.crossfadeTo('IDLE_DEFAULT', CROSSFADE_DURATION);
        }
      }
    });

    this.crossfadeTo('IDLE_DEFAULT', 0.0);
    this.mixer.update(0.0);
    this.updateCompanionLevitation(0.0);
    this.root.updateMatrixWorld(true);
  }

  getOffboardClip(baseName) {
    return this.resolveClipName(baseName);
  }

  updateCompanionLevitation(timeSec = 0.0) {
    if (!this.companionMesh) return null;
    const t = Number(timeSec) || 0.0;
    const dy = DOOM_LEVITATION_AMP_Y * Math.sin(DOOM_LEVITATION_OMEGA_Y * t);
    const dx = DOOM_LEVITATION_AMP_X * Math.sin(DOOM_LEVITATION_OMEGA_X * t + 0.85);
    const dz = DOOM_LEVITATION_AMP_Z * Math.cos(DOOM_LEVITATION_OMEGA_Z * t + 0.40);
    const pitch = DOOM_LEVITATION_AMP_PITCH * Math.sin(DOOM_LEVITATION_OMEGA_X * t + 0.25);
    const roll = DOOM_LEVITATION_AMP_ROLL * Math.cos(DOOM_LEVITATION_OMEGA_Z * t + 1.10);
    const yaw = DOOM_LEVITATION_AMP_YAW * Math.sin(0.95 * t);

    this.companionLevitationState.timeSec = t;
    this.companionLevitationState.dx = dx;
    this.companionLevitationState.dy = dy;
    this.companionLevitationState.dz = dz;
    this.companionLevitationState.pitch = pitch;
    this.companionLevitationState.roll = roll;
    this.companionLevitationState.yaw = yaw;

    for (const comp of this.companionMeshes) {
      comp.position.set(
        this.companionAnchor.x + dx,
        this.companionAnchor.y + dy,
        this.companionAnchor.z + dz
      );
      comp.rotation.set(pitch, yaw, roll);
    }
    return this.companionLevitationState;
  }

  setHolographicShader(enabled) {
    this.isHoloShaderActive = Boolean(enabled);
    for (const mesh of this.renderMeshes) {
      mesh.material = this.isHoloShaderActive
        ? this.holoMaterial
        : this.defaultMaterials.get(mesh) || this.defaultMaterial;
      if (Array.isArray(mesh.material)) {
        for (const m of mesh.material) {
          if (m) m.needsUpdate = true;
        }
      } else if (mesh.material) {
        mesh.material.needsUpdate = true;
      }
    }
    return this.isHoloShaderActive;
  }

  resolveClipName(requestedName) {
    if (this.actions.has(requestedName)) {
      return requestedName;
    }
    const fallbackMap = {
      Idle: 'IDLE_DEFAULT',
      Walk: 'WALK_DEFAULT',
      Run: 'JOG_DEFAULT',
      Jog: 'JOG_DEFAULT',
      Sprint: 'SPRINT_DEFAULT',
      Jump: 'JUMP_DEFAULT',
      Jump_Start: 'JUMP_DEFAULT',
      Jump_Idle: 'FALL_DEFAULT',
      Jump_Loop: 'FALL_DEFAULT',
      Fall: 'FALL_DEFAULT',
      Dance: 'DANCE_DEFAULT',
      Talk: 'TALK_EXPLAIN',
      Explain: 'TALK_EXPLAIN',
      Emphasis: 'TALK_EMPHASIS',
      Subtle: 'TALK_SUBTLE',
      Acknowledge: 'ACKNOWLEDGE',
      Wave: 'EXPRESS_WAVE',
      Nod: 'EXPRESS_NOD',
      Shrug: 'EXPRESS_SHRUG',
      Point: 'EXPRESS_POINT',
      Excited: 'EXPRESS_EXCITED',
      ThumbsUp: 'EXPRESS_THUMBS_UP',
      Victory: 'EXPRESS_EXCITED',
    };
    const mapped = fallbackMap[requestedName];
    if (mapped && this.actions.has(mapped)) {
      return mapped;
    }
    raiseFatalError(`Requested Ready Player Me animation clip '${requestedName}' does not exist.`);
  }

  selectNextDialogueClip(preferredClip = null) {
    if (preferredClip && this.actions.has(preferredClip) && preferredClip !== this.lastDialogueClipName) {
      this.lastDialogueClipName = preferredClip;
      this.dialogueClipHistory.push(preferredClip);
      if (this.dialogueClipHistory.length > 16) this.dialogueClipHistory.shift();
      return preferredClip;
    }

    const candidates = RPM_DIALOGUE_CLIP_POOL.filter(
      (spec) => this.actions.has(spec.id) && spec.id !== this.lastDialogueClipName
    );
    const pool = candidates.length > 0
      ? candidates
      : RPM_DIALOGUE_CLIP_POOL.filter((spec) => this.actions.has(spec.id));

    if (pool.length === 0) {
      return 'TALK_EXPLAIN';
    }

    let totalWeight = 0.0;
    for (const spec of pool) {
      totalWeight += Number(spec.dialogueWeight) || 1.0;
    }
    let pick = Math.random() * totalWeight;
    let chosenId = pool[0].id;
    for (const spec of pool) {
      pick -= Number(spec.dialogueWeight) || 1.0;
      if (pick <= 0.0) {
        chosenId = spec.id;
        break;
      }
    }

    this.lastDialogueClipName = chosenId;
    this.dialogueClipHistory.push(chosenId);
    if (this.dialogueClipHistory.length > 16) this.dialogueClipHistory.shift();
    return chosenId;
  }

  startDialogue(preferredClip = null) {
    this.velocity.x = 0.0;
    this.velocity.z = 0.0;
    this.customEmoteActive = false;
    const wasAlreadyTalking = this.dialogueActive;
    this.dialogueActive = true;
    this.state = 'Talking';

    const nextClip = this.selectNextDialogueClip(preferredClip);
    const fadeDuration = wasAlreadyTalking ? DIALOGUE_CHAIN_CROSSFADE : DIALOGUE_ENTER_CROSSFADE;
    this.crossfadeTo(nextClip, fadeDuration, true);
    this.dialogueChainCount += 1;

    const selectEl = typeof document !== 'undefined' ? document.getElementById('animation-select') : null;
    if (selectEl && selectEl.value !== nextClip) {
      selectEl.value = nextClip;
    }
    const dlgBtn = typeof document !== 'undefined' ? document.getElementById('toggle-dialogue-btn') : null;
    if (dlgBtn) {
      dlgBtn.textContent = 'Dialogue Mode: TALKING (T)';
      dlgBtn.classList.remove('secondary');
    }
    return nextClip;
  }

  stopDialogue() {
    if (!this.dialogueActive && this.state !== 'Talking') {
      return this.currentClipName || 'IDLE_DEFAULT';
    }
    this.dialogueActive = false;
    this.customEmoteActive = false;
    this.state = 'Idle';
    const returnedClip = this.crossfadeTo('IDLE_DEFAULT', DIALOGUE_EXIT_CROSSFADE, false);

    const selectEl = typeof document !== 'undefined' ? document.getElementById('animation-select') : null;
    if (selectEl && selectEl.value !== returnedClip) {
      selectEl.value = returnedClip;
    }
    const dlgBtn = typeof document !== 'undefined' ? document.getElementById('toggle-dialogue-btn') : null;
    if (dlgBtn) {
      dlgBtn.textContent = 'Start Dialogue (T)';
      dlgBtn.classList.add('secondary');
    }
    return returnedClip;
  }

  toggleDialogue() {
    if (this.dialogueActive) {
      return this.stopDialogue();
    }
    return this.startDialogue();
  }

  updateDialogueState(_dt) {
    if (!this.dialogueActive) return;
    if (!this.currentAction) {
      const nextClip = this.selectNextDialogueClip();
      this.crossfadeTo(nextClip, DIALOGUE_CHAIN_CROSSFADE, true);
      return;
    }
    const clip = typeof this.currentAction.getClip === 'function' ? this.currentAction.getClip() : null;
    if (!clip || clip.duration <= 1e-4) return;

    const remainingSec = clip.duration - this.currentAction.time;
    const chainThreshold = Math.min(DIALOGUE_CHAIN_CROSSFADE, clip.duration * 0.35);
    if (remainingSec <= chainThreshold) {
      const nextClip = this.selectNextDialogueClip();
      this.crossfadeTo(nextClip, DIALOGUE_CHAIN_CROSSFADE, true);
      this.dialogueChainCount += 1;
      const selectEl = typeof document !== 'undefined' ? document.getElementById('animation-select') : null;
      if (selectEl && selectEl.value !== nextClip) {
        selectEl.value = nextClip;
      }
    }
  }

  crossfadeTo(clipName, duration = CROSSFADE_DURATION, forceRestart = false) {
    const resolvedName = this.resolveClipName(clipName);
    const nextAction = this.actions.get(resolvedName);
    if (!nextAction) {
      raiseFatalError(`Animation action '${resolvedName}' not found on '${this.id}'.`);
    }

    if (this.currentAction === nextAction && !forceRestart) {
      return resolvedName;
    }

    const isLocomotionClip = (name) =>
      name === 'WALK_DEFAULT' ||
      name === 'JOG_DEFAULT' ||
      name === 'SPRINT_DEFAULT';
    let preservedNormPhase = null;
    if (
      !forceRestart &&
      this.currentAction &&
      isLocomotionClip(this.currentClipName) &&
      isLocomotionClip(resolvedName)
    ) {
      const prevClip =
        typeof this.currentAction.getClip === 'function' ? this.currentAction.getClip() : null;
      if (prevClip && prevClip.duration > 1e-4) {
        preservedNormPhase =
          (((this.currentAction.time % prevClip.duration) + prevClip.duration) %
            prevClip.duration) /
          prevClip.duration;
      }
    }

    // Stop any stale third actions that are neither the outgoing action nor the incoming action
    // so multi-step dialogue chains maintain clean 2-action normalized crossfades without T-pose flashing
    for (const [, act] of this.actions) {
      if (act !== this.currentAction && act !== nextAction && act.isRunning()) {
        act.stop();
      }
    }

    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1.0);
    nextAction.setEffectiveWeight(1.0);

    if (forceRestart || !isLoopingClip(resolvedName)) {
      nextAction.reset();
    } else if (preservedNormPhase !== null) {
      const nextClip = typeof nextAction.getClip === 'function' ? nextAction.getClip() : null;
      if (nextClip && nextClip.duration > 1e-4) {
        nextAction.time = preservedNormPhase * nextClip.duration;
      }
    }

    if (!this.currentAction || duration <= 0.0) {
      if (this.currentAction && this.currentAction !== nextAction) {
        this.currentAction.stop();
      }
      nextAction.play();
    } else {
      this.currentAction.enabled = true;
      if (this.currentAction.getEffectiveWeight() < 0.05) {
        this.currentAction.setEffectiveWeight(1.0);
      }
      nextAction.play();
      this.currentAction.crossFadeTo(nextAction, duration, false);
    }

    this.currentAction = nextAction;
    this.currentClipName = resolvedName;
    return resolvedName;
  }

  triggerCustomAnimation(clipName) {
    const resolvedName = this.resolveClipName(clipName);
    this.velocity.x = 0.0;
    this.velocity.z = 0.0;
    this.dialogueActive = false;
    this.customEmoteActive = true;
    this.state = isLoopingClip(resolvedName) ? 'EmoteLoop' : 'EmoteOnce';
    this.crossfadeTo(resolvedName, CROSSFADE_DURATION, true);

    const selectEl = typeof document !== 'undefined' ? document.getElementById('animation-select') : null;
    if (selectEl && selectEl.value !== resolvedName) {
      selectEl.value = resolvedName;
    }
    const dlgBtn = typeof document !== 'undefined' ? document.getElementById('toggle-dialogue-btn') : null;
    if (dlgBtn) {
      dlgBtn.textContent = 'Start Dialogue (T)';
      dlgBtn.classList.add('secondary');
    }
    return resolvedName;
  }

  freezeToIdle() {
    this.velocity.set(0, 0, 0);
    this.position.y = this.floorY;
    this.isGrounded = true;
    this.customEmoteActive = false;
    this.dialogueActive = false;
    this.state = 'Idle';
    this.root.position.copy(this.position);
    this.crossfadeTo('IDLE_DEFAULT', CROSSFADE_DURATION);
    if (this.currentAction) {
      this.currentAction.setEffectiveTimeScale(1.0);
    }
    const dlgBtn = typeof document !== 'undefined' ? document.getElementById('toggle-dialogue-btn') : null;
    if (dlgBtn) {
      dlgBtn.textContent = 'Start Dialogue (T)';
      dlgBtn.classList.add('secondary');
    }
  }
}

// ============================================================================
// Input State, Camera Orbit & Mount Focus State
// ============================================================================
const keysPressed = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false,
  ShiftLeft: false,
  ShiftRight: false,
  ControlLeft: false,
  ControlRight: false,
  AltLeft: false,
  AltRight: false,
  Space: false,
  KeyQ: false,
  KeyE: false,
  KeyR: false,
  KeyF: false,
  KeyH: false,
  KeyC: false,
  KeyM: false,
  Digit1: false,
  Digit2: false,
  Digit3: false,
  Digit4: false,
  Digit5: false,
  Digit6: false,
  Digit7: false,
  Digit8: false,
  Digit9: false,
  Digit0: false,
};

let jumpRequested = false;
let suppressScrollEventSync = false;
let lastRenderedHoloStationId = null;
let lastRenderedHoloMode = null;

const cameraOrbit = {
  yaw: 0.0,
  pitch: CAM_DEFAULT_PITCH,
  desiredDistance: CAM_DEFAULT_DISTANCE,
  effectiveDistance: CAM_DEFAULT_DISTANCE,
  isDragging: false,
  downClientX: 0,
  downClientY: 0,
  maxDragTravel: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  pivotCurrent: new THREE.Vector3(0, CAM_PIVOT_HEIGHT, 3.0),
  pivotTarget: new THREE.Vector3(0, CAM_PIVOT_HEIGHT, 3.0),
};

const mountFocusCameraState = {
  active: false,
  returningToOrbit: false,
  transitionProgress: 1.0,
  fromPos: new THREE.Vector3(),
  fromLookAt: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLookAt: new THREE.Vector3(),
  currentLookAt: new THREE.Vector3(0, CAM_PIVOT_HEIGHT, 3.0),
};

const pointerNDC = new THREE.Vector2(-999, -999);
const raycaster = new THREE.Raycaster();
const pointerRaycaster = new THREE.Raycaster();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const tempCamForward = new THREE.Vector3();
const tempCamRight = new THREE.Vector3();
const tempDesiredCamPos = new THREE.Vector3();
const tempRayDir = new THREE.Vector3();

// ============================================================================
// Scroll Path & DOM Scroll Helpers
// ============================================================================
function getMaxWindowScroll() {
  const docEl = document.documentElement;
  const maxScroll = Math.max(0, (docEl ? docEl.scrollHeight : 0) - window.innerHeight);
  return maxScroll;
}

function getWindowScrollFraction() {
  const maxScroll = getMaxWindowScroll();
  if (maxScroll <= 1) return 0.0;
  return Math.max(0.0, Math.min(1.0, window.scrollY / maxScroll));
}

function syncWindowScrollToFraction(fraction) {
  const clamped = Math.max(0.0, Math.min(1.0, fraction));
  const maxScroll = getMaxWindowScroll();
  if (maxScroll > 1) {
    suppressScrollEventSync = true;
    window.scrollTo({ top: clamped * maxScroll, left: 0, behavior: 'instant' });
    suppressScrollEventSync = false;
  }
}

function interpolateCorridorZFromProgress(p) {
  const clamped = Math.max(0.0, Math.min(1.0, p));
  for (let i = 0; i < CORRIDOR_PROGRESS_KNOTS.length - 1; i++) {
    const k0 = CORRIDOR_PROGRESS_KNOTS[i];
    const k1 = CORRIDOR_PROGRESS_KNOTS[i + 1];
    if (clamped >= k0.p && clamped <= k1.p) {
      const span = k1.p - k0.p;
      const t = span > 1e-8 ? (clamped - k0.p) / span : 0.0;
      return k0.z + t * (k1.z - k0.z);
    }
  }
  return SCROLL_TERMINAL_Z;
}

function interpolateProgressFromCorridorZ(z) {
  if (z <= CORRIDOR_PROGRESS_KNOTS[0].z) return 0.0;
  for (let i = 0; i < CORRIDOR_PROGRESS_KNOTS.length - 1; i++) {
    const k0 = CORRIDOR_PROGRESS_KNOTS[i];
    const k1 = CORRIDOR_PROGRESS_KNOTS[i + 1];
    if (z >= k0.z && z <= k1.z) {
      const spanZ = k1.z - k0.z;
      const t = spanZ > 1e-8 ? (z - k0.z) / spanZ : 0.0;
      return k0.p + t * (k1.p - k0.p);
    }
  }
  return 0.96;
}

function evaluateScrollCorridorPath(progress) {
  const env = sandbox.environment;
  const p = Math.max(0.0, Math.min(1.0, progress));
  const xStart = env ? env.spawnPlayerPos.x : 0.0;
  const floorY = env ? env.floorY : 0.0;
  const npcZ = env ? env.spawnNpcPos.z : 16.0;

  const z = interpolateCorridorZFromProgress(p);

  // Smooth C1 raised-cosine lateral clearance pass around SPAWN_NPC (Spec 013 §3.1)
  let x = xStart * (1.0 - p);
  let dx_dz = 0.0;
  const dzNpc = z - npcZ;
  if (Math.abs(dzNpc) < SCROLL_NPC_AVOID_HALF_SPAN) {
    const u = dzNpc / SCROLL_NPC_AVOID_HALF_SPAN;
    const cosTerm = 0.5 * (1.0 + Math.cos(Math.PI * u));
    const dCos_dz = -0.5 * (Math.PI / SCROLL_NPC_AVOID_HALF_SPAN) * Math.sin(Math.PI * u);
    x += SCROLL_NPC_AVOID_OFFSET_X * cosTerm;
    dx_dz += SCROLL_NPC_AVOID_OFFSET_X * dCos_dz;
  }

  return {
    progress: p,
    x,
    y: floorY,
    z,
    dx_dz,
    forwardYaw: Math.atan2(dx_dz, 1.0),
  };
}

function getActiveHoloStationForProgress(progress, mode) {
  if (mode === 'mount-focus' && sandbox.focusedMount) {
    return sandbox.focusedMount.station;
  }
  if (mode !== 'scroll') return null;
  for (let i = 0; i < HOLO_PROJECT_STATIONS.length; i++) {
    const st = HOLO_PROJECT_STATIONS[i];
    if (progress >= st.startProgress && progress <= st.endProgress) {
      return st;
    }
  }
  return null;
}

// ============================================================================
// 3-State Wall Screen Mounting & Proximity Logic (Spec 014 §3 & §4)
// ============================================================================
function updateWallScreenMounts(clampedDt = 1 / 60) {
  if (!sandbox.ready || !sandbox.wallMounts) return;

  const isScrollMode = sandbox.mode === 'scroll';
  const effectiveProgress = isScrollMode ? sandbox.scrollProgress : 1.0;
  const activeChar = sandbox.getActiveCharacter();

  for (let i = 0; i < sandbox.wallMounts.length; i++) {
    const m = sandbox.wallMounts[i];
    const st = m.station;

    if (effectiveProgress < st.startProgress) {
      // State A — Pre-Station / Unmounted Standby (§3.1, Spec 025 §4.2: standbyOpacity in [0.10, 0.28])
      m.state = 'standby';
      m.isMounted = false;
      m.mountProgress = 0.0;
      m.currentRotationY = 0.0;
      m.currentRotationDeg = 0.0;
      m.currentWorldNormal.set(0.0, 0.0, -1.0);

      m.screenGroup.visible = true;
      m.standbyBracketGroup.visible = true;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = true;
      if (m.backFaceMesh) m.backFaceMesh.visible = true;
      m.screenGroup.position.copy(m.locatorPosition);
      m.screenGroup.rotation.set(0.0, m.mountedRotationY, 0.0);
      m.panelOffsetGroup.position.set(0.0, 0.0, MOUNT_BRICK_CLEARANCE);

      m.standbyOpacity = 0.28;
      m.glassOpacity = 0.32;
      m.faceMat.opacity = 0.32;
      m.standbyPlateMat.opacity = 0.22;
      m.bracketWireMat.opacity = 0.56;
      m.bracketWireMat.color.setHex(0xfbbf24);
      m.wallGlowLight.intensity = 0.65;
      if (m.standbyDiffusedMat) m.standbyDiffusedMat.uniforms.uIntensity.value = 0.32;
      if (m.diffusedLightMat) m.diffusedLightMat.uniforms.uIntensity.value = 0.65;
    } else if (effectiveProgress <= st.endProgress) {
      // State B — Active Transparent Holographic Showcase in Corridor Ahead of Character X (§3.2, Spec 025 §4.2)
      m.state = 'showcase';
      m.isMounted = false;
      m.mountProgress = 0.0;
      m.currentRotationY = 0.0;
      m.currentRotationDeg = 0.0;
      m.currentWorldNormal.set(0.0, 0.0, -1.0);

      const lateralOffset = st.wallSide === 'L' ? -0.92 : 0.92;
      const showcaseX = (activeChar ? activeChar.position.x : 0.0) + lateralOffset;
      const showcaseY = st.expectedY;
      const showcaseZ = Math.max(
        st.expectedZ,
        (activeChar ? activeChar.position.z : st.expectedZ) + 1.45
      );

      m.screenGroup.visible = true;
      m.standbyBracketGroup.visible = true;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = false;
      if (m.backFaceMesh) m.backFaceMesh.visible = true;
      m.screenGroup.position.set(showcaseX, showcaseY, showcaseZ);
      m.screenGroup.rotation.set(0.0, 0.0, 0.0);
      m.panelOffsetGroup.position.set(0.0, 0.0, 0.0);

      // Transparent hologram smoked-glass density during scrolling sequence (Spec 025 §4.2: glassOpacity in [0.18, 0.45])
      m.glassOpacity = 0.32;
      m.standbyOpacity = 0.22;
      m.faceMat.opacity = 0.32;
      m.bezelMat.opacity = 0.56;
      m.bezelMat.emissiveIntensity = 1.15;
      m.borderWireMat.color.setHex(0xfcd34d);
      m.borderWireMat.opacity = 0.72;
      m.standbyPlateMat.opacity = 0.22;
      m.bracketWireMat.opacity = 0.54;
      m.wallGlowLight.intensity = 0.95;
      if (m.standbyDiffusedMat) m.standbyDiffusedMat.uniforms.uIntensity.value = 0.42;
      if (m.diffusedLightMat) m.diffusedLightMat.uniforms.uIntensity.value = 0.95;
    } else {
      // State C — Scroll-Past Rotation (±90°) & Flush Wall Mounting at SCREEN_MOUNT_0X (§3.3, Spec 025 §4.2)
      const rawT = isScrollMode
        ? Math.max(0.0, Math.min(1.0, (effectiveProgress - st.endProgress) / DOCK_SCROLL_SPAN))
        : 1.0;
      const smoothT = rawT * rawT * (3.0 - 2.0 * rawT);

      const wasMounted = m.isMounted;
      m.mountProgress = smoothT;
      m.isMounted = smoothT >= 0.999;
      m.state = m.isMounted ? 'mounted' : 'docking';
      if (!wasMounted && m.isMounted) {
        m.triggerGlitchSpike(0.18);
      }

      const endPose = evaluateScrollCorridorPath(st.endProgress);
      const startX = endPose.x + (st.wallSide === 'L' ? -0.92 : 0.92);
      const startY = st.expectedY;
      const startZ = st.expectedZ;

      m.screenGroup.visible = true;
      m.standbyBracketGroup.visible = !m.isMounted;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = true;
      if (m.backFaceMesh) m.backFaceMesh.visible = !m.isMounted;
      m.panelOffsetGroup.position.set(0.0, 0.0, MOUNT_BRICK_CLEARANCE * smoothT);
      if (m.isMounted) {
        m.screenGroup.position.copy(m.locatorPosition);
        m.screenGroup.rotation.set(0.0, m.mountedRotationY, 0.0);
        m.currentRotationY = m.mountedRotationY;
        m.currentRotationDeg = m.mountedRotationDeg;
        m.currentWorldNormal.copy(m.outwardNormal);
      } else {
        m.screenGroup.position.set(
          startX + (m.locatorPosition.x - startX) * smoothT,
          startY + (m.locatorPosition.y - startY) * smoothT,
          startZ + (m.locatorPosition.z - startZ) * smoothT
        );
        m.currentRotationY = m.mountedRotationY * smoothT;
        m.currentRotationDeg = THREE.MathUtils.radToDeg(m.currentRotationY);
        m.screenGroup.rotation.set(0.0, m.currentRotationY, 0.0);
        m.currentWorldNormal
          .set(0.0, 0.0, 1.0)
          .applyAxisAngle(WORLD_UP, m.currentRotationY)
          .normalize();
      }

      const isFocused = sandbox.focusedMount === m;
      const isHovered = sandbox.hoveredMount === m;
      const isProximity = sandbox.proximityMount === m;
      const isHighlighted = isFocused || isHovered || isProximity;

      m.glassOpacity = isHighlighted ? 0.38 : 0.32;
      m.standbyOpacity = 0.20;
      m.faceMat.opacity = m.glassOpacity;
      m.bezelMat.opacity = isHighlighted ? 0.68 : 0.58;
      m.bezelMat.emissiveIntensity = isHighlighted ? 1.35 : 1.15;
      m.borderWireMat.color.setHex(isHighlighted ? 0xfffbeb : 0xfbbf24);
      m.borderWireMat.opacity = isHighlighted ? 0.88 : 0.72;
      m.standbyPlateMat.opacity = 0.20;
      m.bracketWireMat.opacity = isHighlighted ? 0.78 : 0.56;
      m.bracketWireMat.color.setHex(isHighlighted ? 0xfcd34d : 0xf59e0b);
      if (m.standbyDiffusedMat) {
        m.standbyDiffusedMat.uniforms.uIntensity.value = m.isMounted ? 0.0 : 0.32;
      }
    }

    const isFocused = sandbox.focusedMount === m;
    const isHovered = sandbox.hoveredMount === m;
    const isProximity = sandbox.proximityMount === m;
    updateWallMountHolographicParity(m, holoShaderUniforms.uHoloTime.value, clampedDt, {
      isFocused,
      isHovered,
      isProximity,
      isScrollMode,
    });
    m.wallGlowLight.intensity = m.diffusedGlowIntensity;

    if (m.standbyBracketGroup.visible) {
      m.standbyBracketGroup.updateMatrixWorld(true);
    }
    if (m.screenGroup.visible) {
      m.screenGroup.updateMatrixWorld(true);
    }
  }
}

function updateProximityAndHoverWallMounts() {
  if (!sandbox.ready) return;

  const promptEl = document.getElementById('mount-proximity-prompt');
  const promptLabelEl = document.getElementById('mount-prompt-label');

  if (sandbox.mode !== 'freeroam') {
    sandbox.proximityMount = null;
    sandbox.hoveredMount = null;
    document.body.classList.remove('mount-pointer-hover');
    if (promptEl) {
      promptEl.classList.remove('visible');
    }
    return;
  }

  // 1. Character proximity check (<= 3.5m horizontal distance)
  const activeChar = sandbox.getActiveCharacter();
  let nearestMount = null;
  let nearestDist = Infinity;

  for (let i = 0; i < sandbox.wallMounts.length; i++) {
    const m = sandbox.wallMounts[i];
    if (!m.isMounted) continue;
    const distXZ = Math.hypot(
      activeChar.position.x - m.locatorPosition.x,
      activeChar.position.z - m.locatorPosition.z
    );
    if (distXZ <= PROXIMITY_INTERACT_RADIUS && distXZ < nearestDist) {
      nearestDist = distXZ;
      nearestMount = m;
    }
  }
  sandbox.proximityMount = nearestMount;

  // 2. Pointer hover raycast check (when not dragging camera orbit)
  const prevHoveredMount = sandbox.hoveredMount;
  if (!cameraOrbit.isDragging && pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0) {
    pointerRaycaster.setFromCamera(pointerNDC, camera);
    const hits = pointerRaycaster.intersectObjects(sandbox.wallMountRaycastTargets, false);
    if (hits.length > 0 && hits[0].object.userData.mountName) {
      const hitMount = sandbox.wallMountsByName[hits[0].object.userData.mountName];
      sandbox.hoveredMount = hitMount && hitMount.isMounted ? hitMount : null;
    } else {
      sandbox.hoveredMount = null;
    }
  } else if (cameraOrbit.isDragging) {
    sandbox.hoveredMount = null;
  }

  if (sandbox.hoveredMount && sandbox.hoveredMount !== prevHoveredMount) {
    sandbox.hoveredMount.triggerGlitchSpike(0.18);
  }

  document.body.classList.toggle('mount-pointer-hover', Boolean(sandbox.hoveredMount));

  // 3. Update on-screen interaction prompt
  const promptMount = sandbox.hoveredMount || sandbox.proximityMount;
  if (promptEl && promptLabelEl) {
    if (promptMount) {
      const distStr =
        sandbox.proximityMount === promptMount
          ? ` (${nearestDist.toFixed(1)}m)`
          : '';
      promptLabelEl.innerHTML = `<span class="prompt-station">${promptMount.mountName}${distStr}</span> — ${promptMount.station.title} &bull; Press <strong>E</strong> or Click Mount to Inspect`;
      promptEl.dataset.mountName = promptMount.mountName;
      promptEl.classList.add('visible');
    } else {
      promptEl.classList.remove('visible');
      delete promptEl.dataset.mountName;
    }
  }
}

// ============================================================================
// Holographic Pop-Up & Mount Focus Interface UI (§3.2 & §5.2)
// ============================================================================
function initHoloStationPips() {
  const pipsContainer = document.getElementById('holo-station-pips');
  if (!pipsContainer) return;
  pipsContainer.innerHTML = '';

  for (const st of HOLO_PROJECT_STATIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'holo-pip-btn';
    btn.dataset.stationIndex = String(st.index);
    btn.dataset.mountName = st.mountName;
    btn.dataset.holoInteractive = `pip-${st.code}`;
    btn.textContent = st.code;
    btn.title = `${st.mountName}: ${st.title}`;
    btn.addEventListener('pointerenter', () => {
      if (sandbox.audio) {
        sandbox.audio.trigger('onHover', { target: `pip-${st.code}`, mountName: st.mountName });
      }
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { target: `pip-${st.code}`, stationIndex: st.index });
      }
      if (sandbox.mode === 'mount-focus' || sandbox.mode === 'freeroam') {
        sandbox.focusWallMount(st.mountName);
      } else {
        sandbox.scrollToProjectStation(st.index);
      }
    });
    pipsContainer.appendChild(btn);
  }
}

function updateHolographicPopupUI() {
  const winEl = document.getElementById('holo-popup-window');
  if (!winEl) return;

  const isMountFocus = sandbox.mode === 'mount-focus' && Boolean(sandbox.focusedMount);
  const activeStation = getActiveHoloStationForProgress(sandbox.scrollProgress, sandbox.mode);
  sandbox.activeHoloProject = activeStation;

  winEl.classList.toggle('mount-focus-active', isMountFocus);

  if (!activeStation) {
    if (winEl.classList.contains('active')) {
      winEl.classList.remove('active');
      winEl.setAttribute('aria-hidden', 'true');
      const topBar = document.getElementById('holo-top-light-bar');
      const bottomBar = document.getElementById('holo-bottom-light-bar');
      if (topBar) topBar.classList.remove('ignited');
      if (bottomBar) bottomBar.classList.remove('ignited');
    }
    return;
  }

  const coordsEl = document.getElementById('holo-coords-label');
  const footerStatusEl = document.getElementById('holo-footer-status');
  const badgeEl = document.getElementById('holo-station-badge');

  if (isMountFocus) {
    const m = sandbox.focusedMount;
    if (badgeEl) {
      badgeEl.textContent = `WALL MOUNT // ${m.mountName} (${activeStation.code} OF 06)`;
    }
    if (coordsEl) {
      coordsEl.textContent = `${m.wallSide === 'L' ? 'LEFT' : 'RIGHT'} WALL // Z: ${m.locatorPosition.z.toFixed(1)}m • Y: ${m.locatorPosition.y.toFixed(2)}m • NORMAL: ${m.wallSide === 'L' ? '+X' : '-X'}`;
    }
    if (footerStatusEl) {
      footerStatusEl.textContent = `MOUNT FOCUS MODE // ${m.mountName} INTERACTIVE TERMINAL (ESC OR WASD TO EXIT)`;
    }
  } else {
    const activeChar = sandbox.getActiveCharacter();
    const zCoord = activeChar ? activeChar.position.z.toFixed(1) : '0.0';
    const startPct = Math.round(activeStation.startProgress * 100)
      .toString()
      .padStart(2, '0');
    const endPct = Math.round(activeStation.endProgress * 100)
      .toString()
      .padStart(2, '0');
    if (badgeEl) {
      badgeEl.textContent = `HOLO-PROJ // ${activeStation.code} OF 0${HOLO_PROJECT_STATIONS.length}`;
    }
    if (coordsEl) {
      coordsEl.textContent = `ALLEY CORRIDOR Z: ${zCoord}m // SCROLL WINDOW: ${startPct}%–${endPct}%`;
    }
    if (footerStatusEl) {
      footerStatusEl.textContent = `HOLOGRAPHIC PROJECTION // DOCKS AT ${activeStation.mountName} (Z = ${activeStation.expectedZ.toFixed(1)}m)`;
    }
  }

  const wasActiveWindow = winEl.classList.contains('active');
  const prevStationId = lastRenderedHoloStationId;

  if (
    lastRenderedHoloStationId !== activeStation.id ||
    lastRenderedHoloMode !== sandbox.mode
  ) {
    lastRenderedHoloStationId = activeStation.id;
    lastRenderedHoloMode = sandbox.mode;

    const kickerEl = document.getElementById('holo-kicker');
    const titleEl = document.getElementById('holo-title');
    const descEl = document.getElementById('holo-description');
    const tagsEl = document.getElementById('holo-tags');
    const metricsEl = document.getElementById('holo-metrics');
    const primaryLinkEl = document.getElementById('holo-primary-link');
    const primaryTextEl = document.getElementById('holo-primary-link-text');
    const secondaryLinkEl = document.getElementById('holo-secondary-link');
    const secondaryTextEl = document.getElementById('holo-secondary-link-text');

    if (kickerEl) kickerEl.textContent = activeStation.kicker;
    if (titleEl) titleEl.textContent = activeStation.title;
    if (descEl) descEl.textContent = activeStation.description;

    if (tagsEl) {
      tagsEl.innerHTML = '';
      for (const tag of activeStation.tags) {
        const span = document.createElement('span');
        span.className = 'holo-tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
      }
    }

    if (metricsEl) {
      metricsEl.innerHTML = '';
      for (const m of activeStation.metrics) {
        const box = document.createElement('div');
        box.className = 'holo-metric-box';
        const val = document.createElement('span');
        val.className = 'holo-metric-val';
        val.textContent = m.value;
        const lbl = document.createElement('span');
        lbl.className = 'holo-metric-lbl';
        lbl.textContent = m.label;
        box.appendChild(val);
        box.appendChild(lbl);
        metricsEl.appendChild(box);
      }
    }

    if (primaryLinkEl) primaryLinkEl.href = activeStation.primaryLink.url;
    if (primaryTextEl) primaryTextEl.textContent = activeStation.primaryLink.label;
    if (secondaryLinkEl) secondaryLinkEl.href = activeStation.secondaryLink.url;
    if (secondaryTextEl) secondaryTextEl.textContent = activeStation.secondaryLink.label;

    const pipsContainer = document.getElementById('holo-station-pips');
    if (pipsContainer) {
      pipsContainer.querySelectorAll('button.holo-pip-btn').forEach((btn) => {
        btn.classList.toggle(
          'current',
          Number(btn.dataset.stationIndex) === activeStation.index
        );
      });
    }

    if (sandbox.audio) {
      if (prevStationId !== null && prevStationId !== activeStation.id) {
        sandbox.audio.trigger('onUpdate', {
          fromStationId: prevStationId,
          toStationId: activeStation.id,
        });
      }
      sandbox.audio.trigger('onDataStream', {
        stationId: activeStation.id,
        stationCode: activeStation.code,
        mode: sandbox.mode,
      });
    }
  }

  if (!wasActiveWindow) {
    winEl.classList.add('active');
    winEl.setAttribute('aria-hidden', 'false');
    if (sandbox.audio) {
      sandbox.audio.trigger('onActivate', {
        stationId: activeStation.id,
        mode: sandbox.mode,
      });
    }
  }

  if (winEl && winEl.classList.contains('active')) {
    const boost = sandbox.focusedMount?.glitchBoostRemainingSec > 0 ? 1.0 : 0.0;
    const flk = evaluateHologramScreenFlickerAndGlitch(
      holoShaderUniforms.uHoloTime.value,
      activeStation.index,
      boost
    );
    winEl.style.setProperty('--holo-flicker-gain', String(flk.flickerGain));
    winEl.style.setProperty('--holo-glitch-shift-x', `${(flk.tearOffsetUvX * 14).toFixed(1)}px`);
    winEl.classList.toggle('holo-glitch-active', flk.glitchIntensity > 0.05);
  }
}

function enterFreeRoamMode() {
  if (sandbox.mode === 'freeroam') return;
  sandbox.mode = 'freeroam';
  sandbox.isMountFocused = false;
  sandbox.focusedMount = null;
  mountFocusCameraState.active = false;
  mountFocusCameraState.returningToOrbit = false;

  sandbox.scrollProgress = 1.0;
  sandbox.targetScrollProgress = 1.0;
  sandbox.scrollVelocity = 0.0;

  document.body.classList.add('freeroam-mode');

  const activeChar = sandbox.getActiveCharacter();
  const hasInput =
    keysPressed.KeyW ||
    keysPressed.KeyA ||
    keysPressed.KeyS ||
    keysPressed.KeyD ||
    keysPressed.ArrowUp ||
    keysPressed.ArrowLeft ||
    keysPressed.ArrowDown ||
    keysPressed.ArrowRight;

  if (activeChar && !hasInput) {
    activeChar.velocity.set(0, 0, 0);
    if (!activeChar.dialogueActive) {
      activeChar.state = 'Idle';
      activeChar.crossfadeTo(activeChar.getOffboardClip('IDLE_DEFAULT'), CROSSFADE_DURATION);
    }
    if (activeChar.currentAction) {
      activeChar.currentAction.setEffectiveTimeScale(1.0);
    }
  }

  updateWallScreenMounts();
  updateProximityAndHoverWallMounts();
  updateHolographicPopupUI();
  updateTelemetryHUD();
}

// ============================================================================
// Main Sandbox Runtime State
// ============================================================================
const sandbox = {
  ready: false,
  error: null,
  radialMenu: null,
  lastRadialAction: null,
  mode: 'scroll', // 'scroll' (Scroll-Walk Mode) | 'freeroam' (Interactive Free-Roam Mode) | 'mount-focus' (Mount Focus Mode)
  isMountFocused: false,
  focusedMount: null,
  proximityMount: null,
  hoveredMount: null,
  scrollProgress: 0.0,
  targetScrollProgress: 0.0,
  scrollVelocity: 0.0,
  holoStations: HOLO_PROJECT_STATIONS,
  activeHoloProject: null,
  entranceHologram: null,
  entranceHologramGroup: entranceHologramRootGroup,
  mathPodsGroup: mathPodsRootGroup,
  mathPods: null,
  hoveredMathPod: null,
  draggedMathPod: null,
  waterColorGroup: watercolorRootGroup,
  skyboxGroup: watercolorRootGroup,
  waterColor: null,
  skybox: null,
  isWaterColorFocused: false,
  hoveredWaterColor: false,
  lamppostLight: null,
  streetLights: [],
  entranceLamppostLight: null,
  lamppostEditMode: false,
  toggleLamppostEditMode(forceState = undefined) {
    if (!this.ready || !this.lamppostLight) return false;
    const nextState = typeof forceState === 'boolean' ? forceState : !this.lamppostEditMode;
    this.lamppostEditMode = nextState;
    this.lamppostLight.editMode = nextState;
    if (this.lamppostLight.targetMarkerGroup) {
      this.lamppostLight.targetMarkerGroup.visible = nextState;
    }
    if (this.lamppostLight.spotHelper) {
      this.lamppostLight.spotHelper.visible = nextState;
      if (nextState) this.lamppostLight.spotHelper.update();
    }
    if (nextState) {
      if (this.holoEditMode) {
        this.holoEditMode = false;
        if (this.hologramColumns) {
          this.hologramColumns.setEditModeActive(false);
          this.hologramColumns.setAllColumnsForceVisible(false);
        }
        syncHoloEditorHUDInputs();
      }
      if (this.mode === 'mount-focus') {
        this.exitMountFocusMode({ immediate: true });
      }
      if (this.mode === 'scroll') {
        enterFreeRoamMode();
      }
      if (this.transformControls && this.lamppostLight.target) {
        this.transformControls.enabled = true;
        this.transformControls.setMode('translate');
        this.transformControls.setSpace('world');
        this.transformControls.attach(this.lamppostLight.target);
      }
    } else if (this.transformControls && !this.holoEditMode) {
      this.transformControls.detach();
      this.transformControls.enabled = false;
    }
    syncLamppostEditorHUDInputs();
    renderer.render(scene, camera);
    return this.lamppostEditMode;
  },
  updateLamppostLightState(partialState, persist = true) {
    if (!this.lamppostLight) return null;
    const updated = this.lamppostLight.setState(partialState, persist);
    syncLamppostEditorHUDInputs();
    renderer.render(scene, camera);
    return updated;
  },
  focusLamppostConeLight() {
    if (!this.ready || !this.lamppostLight) return false;
    const st = this.lamppostLight.getState();
    const camTargetX = 0.0;
    const camTargetZ = Math.max(0.5, st.targetZ + 4.5);
    const lookYaw = Math.atan2(st.targetX - camTargetX, st.targetZ - camTargetZ);
    this.teleportCharacterTo(camTargetX, this.environment ? this.environment.floorY : 0.0, camTargetZ, lookYaw);
    cameraOrbit.yaw = lookYaw;
    cameraOrbit.pitch = 0.16;
    cameraOrbit.pivotCurrent.set(camTargetX, (this.environment ? this.environment.floorY : 0.0) + CAM_PIVOT_HEIGHT, camTargetZ);
    cameraOrbit.pivotTarget.copy(cameraOrbit.pivotCurrent);
    updateCameraController(1 / 60);
    renderer.render(scene, camera);
    return true;
  },
  resetLamppostLightToDefault() {
    if (!this.lamppostLight) return null;
    const updated = this.lamppostLight.resetToDefault(true);
    syncLamppostEditorHUDInputs();
    renderer.render(scene, camera);
    return updated;
  },
  exportLamppostLightJSON() {
    if (!this.lamppostLight) return '{}';
    return JSON.stringify(this.lamppostLight.getState(), null, 2);
  },
  runningEffectsGroup: runningEffectsRootGroup,
  runningEffectsRootGroup,
  runningEffects: null,
  characterShadowsGroup: characterShadowsRootGroup,
  characterShadowsRootGroup,
  characterShadows: null,
  overheadCablesGroup: overheadCablesRootGroup,
  overheadCables: null,
  hologramColumnsGroup: hologramColumnsRootGroup,
  hologramColumns: null,
  selectedHoloColumnId: 'frenchfry_tag',
  holoEditMode: false,
  holoGizmoMode: 'translate',
  transformControls: null,
  transformControlsHelper: null,
  getHologramColumn(idOrIndex) {
    return this.hologramColumns ? this.hologramColumns.getColumn(idOrIndex) : null;
  },
  setHologramColumnState(idOrIndex, targetState, options) {
    return this.hologramColumns ? this.hologramColumns.setColumnState(idOrIndex, targetState, options) : false;
  },
  swapHologramColumnMedia(idOrIndex, targetAssetId, options) {
    return this.hologramColumns ? this.hologramColumns.swapColumnMedia(idOrIndex, targetAssetId, options) : false;
  },
  setHologramColumnParams(idOrIndex, partialParams) {
    return this.hologramColumns ? this.hologramColumns.setParams(idOrIndex, partialParams) : false;
  },
  setGlobalHologramColumnParams(partialParams) {
    return this.hologramColumns ? this.hologramColumns.setGlobalParams(partialParams) : false;
  },
  selectHologramColumnForEdit(idOrIndex) {
    if (!this.hologramColumns) return null;
    const col = this.hologramColumns.getColumn(idOrIndex);
    if (!col) return null;
    this.selectedHoloColumnId = col.id;
    this.hologramColumns.setSelectedColumn(col.id);
    if (this.holoEditMode && this.transformControls) {
      this.transformControls.attach(col.rootGroup);
    }
    syncHoloEditorHUDInputs();
    return col;
  },
  toggleHoloEditMode(forceState = undefined) {
    if (!this.ready || !this.hologramColumns) return false;
    let nextState;
    if (typeof forceState === 'boolean') {
      nextState = forceState;
    } else if (!this.holoEditMode) {
      nextState = true;
      this.holoGizmoMode = 'translate';
    } else if (this.holoGizmoMode === 'translate') {
      nextState = true;
      this.holoGizmoMode = 'rotate';
    } else if (this.holoGizmoMode === 'rotate') {
      nextState = true;
      this.holoGizmoMode = 'scale';
    } else {
      nextState = false;
    }

    this.holoEditMode = nextState;
    this.hologramColumns.setEditModeActive(nextState);
    this.hologramColumns.setAllColumnsForceVisible(nextState);

    if (nextState) {
      if (this.lamppostEditMode) {
        this.lamppostEditMode = false;
        if (this.lamppostLight) {
          this.lamppostLight.editMode = false;
          if (this.lamppostLight.targetMarkerGroup) this.lamppostLight.targetMarkerGroup.visible = false;
          if (this.lamppostLight.spotHelper) this.lamppostLight.spotHelper.visible = false;
        }
        syncLamppostEditorHUDInputs();
      }
      if (this.mode === 'mount-focus') {
        this.exitMountFocusMode({ immediate: true });
      }
      if (this.mode === 'scroll') {
        enterFreeRoamMode();
      }
      const col = this.hologramColumns.getColumn(this.selectedHoloColumnId) || this.hologramColumns.columns[0];
      if (col && this.transformControls) {
        this.selectedHoloColumnId = col.id;
        this.hologramColumns.setSelectedColumn(col.id);
        this.transformControls.enabled = true;
        this.transformControls.setMode(this.holoGizmoMode);
        this.transformControls.setSpace(this.holoGizmoMode === 'translate' ? 'world' : 'local');
        this.transformControls.attach(col.rootGroup);
      }
    } else if (this.transformControls) {
      this.transformControls.detach();
      this.transformControls.enabled = false;
    }

    syncHoloEditorHUDInputs();
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return this.holoEditMode;
  },
  setHoloGizmoMode(mode) {
    if (!['translate', 'rotate', 'scale'].includes(mode)) return false;
    this.holoGizmoMode = mode;
    if (this.transformControls) {
      this.transformControls.setMode(mode);
      this.transformControls.setSpace(mode === 'translate' ? 'world' : 'local');
    }
    syncHoloEditorHUDInputs();
    renderer.render(scene, camera);
    return true;
  },
  updateSelectedHoloTransform(partialTransform, persist = true) {
    if (!this.hologramColumns) return null;
    const updated = this.hologramColumns.setColumnTransform(this.selectedHoloColumnId, partialTransform, persist);
    syncHoloEditorHUDInputs();
    renderer.render(scene, camera);
    return updated;
  },
  snapSelectedHoloToWall(wallSide = 'L') {
    const isLeft = String(wallSide).toUpperCase() === 'L';
    return this.updateSelectedHoloTransform({
      x: isLeft ? -1.18 : 1.18,
      yawRad: isLeft ? 0.38 : -0.38,
      pitchRad: 0.0,
      rollRad: 0.0,
    }, true);
  },
  focusSelectedHologramColumn() {
    if (!this.ready || !this.hologramColumns) return false;
    const col = this.hologramColumns.getColumn(this.selectedHoloColumnId);
    if (!col) return false;
    const t = col.getTransformState();
    const targetZ = Math.max(1.5, t.z - 2.6);
    const targetX = t.x < 0 ? Math.min(0.0, t.x + 0.85) : Math.max(0.0, t.x - 0.85);
    const lookYaw = Math.atan2(t.x - targetX, t.z - targetZ);
    this.teleportCharacterTo(targetX, this.environment ? this.environment.floorY : 0.0, targetZ, lookYaw);
    cameraOrbit.yaw = lookYaw;
    cameraOrbit.pitch = 0.05;
    cameraOrbit.pivotCurrent.set(targetX, (this.environment ? this.environment.floorY : 0.0) + CAM_PIVOT_HEIGHT, targetZ);
    cameraOrbit.pivotTarget.copy(cameraOrbit.pivotCurrent);
    updateCameraController(1 / 60);
    renderer.render(scene, camera);
    return true;
  },
  resetSelectedHoloTransform() {
    if (!this.hologramColumns) return null;
    const updated = this.hologramColumns.resetColumnTransform(this.selectedHoloColumnId, true);
    syncHoloEditorHUDInputs();
    renderer.render(scene, camera);
    return updated;
  },
  resetAllHoloTransforms() {
    if (!this.hologramColumns) return null;
    const manifest = this.hologramColumns.resetAllColumnTransforms(true);
    syncHoloEditorHUDInputs();
    renderer.render(scene, camera);
    return manifest;
  },
  exportHoloTransformsJSON() {
    if (!this.hologramColumns) return '[]';
    return JSON.stringify(this.hologramColumns.exportTransformManifest(), null, 2);
  },
  holographicStickersGroup: holographicStickersRootGroup,
  holographicStickers: null,
  selectedHoloStickerId: 'doom_tag',
  getHolographicSticker(idOrIndex) {
    return this.holographicStickers ? this.holographicStickers.getSticker(idOrIndex) : null;
  },
  setHolographicStickerBorderMode(idOrIndex, borderMode, borderTintHex) {
    return this.holographicStickers ? this.holographicStickers.setStickerBorderMode(idOrIndex, borderMode, borderTintHex) : false;
  },
  setHolographicStickerPlacementMode(idOrIndex, placementMode) {
    return this.holographicStickers ? this.holographicStickers.setStickerPlacementMode(idOrIndex, placementMode) : false;
  },
  setHolographicStickerParams(idOrIndex, partialParams) {
    return this.holographicStickers ? this.holographicStickers.setParams(idOrIndex, partialParams) : false;
  },
  setGlobalHolographicStickerParams(partialParams) {
    return this.holographicStickers ? this.holographicStickers.setGlobalParams(partialParams) : false;
  },
  holographicSignGroup: holographicSignRootGroup,
  holographicSign: null,
  selectedHoloSignBranch: 'ALL',
  getHolographicSignNode(idOrIndex) {
    return this.holographicSign ? this.holographicSign.getNode(idOrIndex) : null;
  },
  setHolographicSignParams(partialParams) {
    return this.holographicSign ? this.holographicSign.setParams(partialParams) : false;
  },
  setHolographicSignProtectionMode(mode) {
    return this.holographicSign ? this.holographicSign.setProtectionMode(mode) : false;
  },
  triggerHolographicSignFault(target, faultType, options) {
    return this.holographicSign ? this.holographicSign.triggerFault(target, faultType, options) : false;
  },
  triggerHolographicSignGlitch(target, glitchType, options) {
    return this.holographicSign ? this.holographicSign.triggerGlitch(target, glitchType, options) : false;
  },
  resetHolographicSignHomeTransforms() {
    return this.holographicSign ? this.holographicSign.resetToHomeTransforms() : false;
  },
  freeRoamFlyMode: false,
  toggleFreeRoamFlyMode(forceState = undefined) {
    if (!this.ready) return false;
    const nextState = typeof forceState === 'boolean' ? forceState : !this.freeRoamFlyMode;
    this.freeRoamFlyMode = nextState;
    if (nextState) {
      if (this.mode === 'mount-focus') {
        this.exitMountFocusMode({ immediate: true });
      }
      enterFreeRoamMode();
      const activeChar = this.getActiveCharacter();
      if (activeChar) {
        activeChar.velocity.set(0, 0, 0);
        activeChar.dialogueActive = false;
        activeChar.state = 'Idle';
        activeChar.crossfadeTo('IDLE_DEFAULT', 0.12);
      }
    } else {
      const activeChar = this.getActiveCharacter();
      if (activeChar && this.environment) {
        const surf = sampleSurfaceHeightAndNormal(
          activeChar.position.x,
          activeChar.position.z,
          this.environment.floorTriangles,
          activeChar.position.y
        );
        activeChar.position.y = surf.onFloor ? surf.height : this.environment.floorY;
        activeChar.velocity.set(0, 0, 0);
        activeChar.isGrounded = true;
        activeChar.root.position.copy(activeChar.position);
      }
    }
    const flyBtn = typeof document !== 'undefined' ? document.getElementById('toggle-fly-freeroam-btn') : null;
    if (flyBtn) {
      flyBtn.textContent = this.freeRoamFlyMode
        ? '3D Fly / No-Clip Free-Roam: ON (F)'
        : '3D Fly / No-Clip Free-Roam: OFF (F)';
      flyBtn.classList.toggle('secondary', !this.freeRoamFlyMode);
    }
    updateTelemetryHUD();
    return this.freeRoamFlyMode;
  },
  teleportCharacterTo(x, y, z, yawRad = 0.0) {
    if (!this.ready) return false;
    if (this.mode === 'mount-focus') {
      this.exitMountFocusMode({ immediate: true });
    }
    enterFreeRoamMode();
    const activeChar = this.getActiveCharacter();
    if (!activeChar) return false;
    activeChar.position.set(Number(x), Number(y), Number(z));
    activeChar.velocity.set(0, 0, 0);
    activeChar.yaw = Number(yawRad) || 0.0;
    activeChar.isGrounded = true;
    activeChar.root.position.copy(activeChar.position);
    activeChar.root.rotation.set(0, activeChar.yaw, 0);
    cameraOrbit.yaw = activeChar.yaw;
    updateCameraController(1 / 60);
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return true;
  },
  wallMounts: [],
  wallMountsByName: {},
  wallMountRaycastTargets: [],
  neonCornersGroup: neonCornersRootGroup,
  neonWallCorners: [],
  neonWallCornersByCategory: { base: [], top: [], riser: [] },
  neonCornerJoints: [],
  neonConfig: {
    primaryMinZ: NEON_PRIMARY_MIN_Z,
    primaryMaxZ: NEON_PRIMARY_MAX_Z,
    floorBordersOnly: true,
    depthTest: true,
    inwardOffset: NEON_INWARD_OFFSET,
    coreRadius: NEON_CORE_RADIUS,
    haloRadius: NEON_HALO_RADIUS,
    coreColorHex: '#fbbf24',
    coreBrightHex: '#fffbeb',
    haloColorHex: '#f59e0b',
    haloDeepHex: '#d97706',
  },
  alarmLightsGroup: alarmLightsRootGroup,
  alarmLights: [],
  alarmLightMaterials: null,
  sfxGroup: sfxRootGroup,
  sfx: null,
  audio: null,
  glbVariantCatalog: GLB_VARIANT_CATALOG,
  currentVariantKey: 'luis_holo',
  soloCharacterMode: true,
  variantLoader: null,
  variantCache: {},
  scene,
  camera,
  renderer,
  environment: null,
  characters: {},
  activeCharacterId: 'hoodie',
  sharedClips: [],
  clipNames: [],
  keysPressed,
  cameraOrbit,
  mountFocusCameraState,
  setAudioMuted(muted) {
    return this.audio ? this.audio.setMuted(muted) : false;
  },
  setAudioMasterGain(gain) {
    return this.audio ? this.audio.setMasterGain(gain) : 0.75;
  },
  setReflectionBlurKernel(size) {
    return this.sfx && this.sfx.floorReflections
      ? this.sfx.floorReflections.setBlurKernelSize(size)
      : 1.0;
  },
  triggerUITelemetryAudio(triggerName, detail = {}) {
    return this.audio ? this.audio.trigger(triggerName, detail) : null;
  },
  getActiveCharacter() {
    return this.characters[this.activeCharacterId];
  },
  getIdleCharacter() {
    return this.characters[this.activeCharacterId === 'hoodie' ? 'tunic' : 'hoodie'];
  },
  getMountedScreenCount() {
    let count = 0;
    for (let i = 0; i < this.wallMounts.length; i++) {
      if (this.wallMounts[i].isMounted) count++;
    }
    return count;
  },
  resolveWallMount(identifier) {
    if (!identifier) return null;
    if (typeof identifier === 'object' && identifier.mountName) {
      return this.wallMountsByName[identifier.mountName] || null;
    }
    if (typeof identifier === 'string') {
      if (this.wallMountsByName[identifier]) {
        return this.wallMountsByName[identifier];
      }
      const byStation = this.wallMounts.find(
        (m) => m.station.id === identifier || m.station.code === identifier
      );
      if (byStation) return byStation;
    }
    const idx = Number(identifier);
    if (!Number.isNaN(idx)) {
      return this.wallMounts.find((m) => m.station.index === idx) || null;
    }
    return null;
  },
  getMathPod(idOrIndex) {
    return this.mathPods ? this.mathPods.getPod(idOrIndex) : null;
  },
  dragMathPod(idOrIndex, targetWorldPos, dt = 1 / 60) {
    if (!this.mathPods) return null;
    const pod = this.mathPods.dragPod(idOrIndex, targetWorldPos, dt);
    this.draggedMathPod = pod;
    return pod;
  },
  releaseMathPod(idOrIndex) {
    if (!this.mathPods) return null;
    const pod = this.mathPods.releasePod(idOrIndex);
    if (this.draggedMathPod && (!idOrIndex || this.draggedMathPod.id === idOrIndex || this.draggedMathPod === pod)) {
      this.draggedMathPod = null;
    }
    return pod;
  },
  triggerMathPodGlitch(idOrIndex, intensity = 1.0, durationSec = 0.18) {
    if (!this.mathPods || !this.mathPods.triggerGlitch) return null;
    return this.mathPods.triggerGlitch(idOrIndex, intensity, durationSec);
  },
  resetMathPodPositions() {
    if (!this.mathPods || !this.mathPods.resetPositions) return;
    this.mathPods.resetPositions();
  },
  setWaterColorDivision(val) {
    if (!this.waterColor) return;
    this.waterColor.setDivision(val);
    updateTelemetryHUD();
  },
  setWaterColorScale(val) {
    if (!this.waterColor) return;
    this.waterColor.setScale(val);
    updateTelemetryHUD();
  },
  openWaterColorInspector() {
    // Spec 025 §5.1: Water Color shader is strictly skybox-only; interior inspector & camera hijack are disabled
    this.isWaterColorFocused = false;
    return false;
  },
  closeWaterColorInspector() {
    this.isWaterColorFocused = false;
    return false;
  },
  syncWaterColorInspectorDOM() {
    // Skybox-only mode (Spec 025 §5.1)
  },
  focusWallMount(identifier, { immediate = false } = {}) {
    if (!this.ready) return null;
    const targetMount = this.resolveWallMount(identifier);
    if (!targetMount) {
      raiseFatalError(`Cannot focus unknown wall mount '${String(identifier)}'.`);
    }

    // If invoked while in scroll mode, bring the scene into the 100% Free-Roam state first
    if (this.mode === 'scroll') {
      this.setScrollProgress(1.0);
    }

    // Quiesce Character "X" into Idle while focused on the wall mount (§5.1)
    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    jumpRequested = false;
    cameraOrbit.isDragging = false;
    document.body.classList.remove('mount-pointer-hover');

    const activeChar = this.getActiveCharacter();
    if (activeChar) {
      activeChar.freezeToIdle();
      activeChar.mixer.update(0.0);
      activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
      activeChar.root.updateMatrixWorld(true);
    }

    this.mode = 'mount-focus';
    this.isMountFocused = true;
    this.focusedMount = targetMount;
    this.hoveredMount = null;
    if (this.mathPodPopups) {
      this.mathPodPopups.setGlobalVisibility(false);
    }
    targetMount.triggerGlitchSpike(0.24);
    if (this.runningEffects) this.runningEffects.quiesceImmediately();
    if (this.characterShadows) this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);

    const promptEl = document.getElementById('mount-proximity-prompt');
    if (promptEl) {
      promptEl.classList.remove('visible');
    }

    // Compute front-on camera position along mount's outward normal (+X for L, -X for R) at Y = 1.75m
    const destLookAt = targetMount.locatorPosition.clone();
    const destCamPos = targetMount.locatorPosition
      .clone()
      .addScaledVector(targetMount.outwardNormal, FOCUS_CAM_DISTANCE);
    destCamPos.y = targetMount.locatorPosition.y;

    mountFocusCameraState.active = true;
    mountFocusCameraState.returningToOrbit = false;
    mountFocusCameraState.fromPos.copy(camera.position);
    mountFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
    mountFocusCameraState.toPos.copy(destCamPos);
    mountFocusCameraState.toLookAt.copy(destLookAt);
    mountFocusCameraState.transitionProgress = immediate ? 1.0 : 0.0;

    updateWallScreenMounts();
    updateCameraController(immediate ? 1.0 : 1 / 60);
    updateHolographicPopupUI();
    updateSFXAndAudioSubsystems(1 / 60, holoShaderUniforms.uHoloTime.value);
    if (this.mathPods) {
      if (this.mathPods.activeDragPodId) {
        this.mathPods.endDrag();
        this.draggedMathPod = null;
      }
      updateMathPodsCorridorLOD();
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return targetMount;
  },
  stepFocusedWallMount(deltaIndex) {
    if (!this.ready) return null;
    const currentIdx = this.focusedMount ? this.focusedMount.station.index : 1;
    const total = this.wallMounts.length;
    const nextIdx = ((currentIdx - 1 + deltaIndex + total) % total) + 1;
    return this.focusWallMount(nextIdx);
  },
  exitMountFocusMode({ immediate = false } = {}) {
    if (!this.ready) return false;
    if (this.mode !== 'mount-focus' && !this.isMountFocused) return false;

    if (this.focusedMount) {
      this.focusedMount.triggerGlitchSpike(0.18);
    }
    this.mode = 'freeroam';
    this.isMountFocused = false;
    this.focusedMount = null;
    document.body.classList.add('freeroam-mode');
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }

    const orbitState = computeThirdPersonCameraPose();
    mountFocusCameraState.active = false;
    if (immediate) {
      mountFocusCameraState.returningToOrbit = false;
      mountFocusCameraState.transitionProgress = 1.0;
      camera.position.copy(orbitState.cameraPos);
      camera.lookAt(orbitState.pivotPos);
      camera.updateMatrixWorld(true);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
    } else {
      mountFocusCameraState.returningToOrbit = true;
      mountFocusCameraState.fromPos.copy(camera.position);
      mountFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      mountFocusCameraState.toPos.copy(orbitState.cameraPos);
      mountFocusCameraState.toLookAt.copy(orbitState.pivotPos);
      mountFocusCameraState.transitionProgress = 0.0;
    }

    updateWallScreenMounts();
    updateProximityAndHoverWallMounts();
    updateCameraController(immediate ? 1.0 : 1 / 60);
    updateHolographicPopupUI();
    updateSFXAndAudioSubsystems(1 / 60, holoShaderUniforms.uHoloTime.value);
    if (this.mathPods) {
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return true;
  },
  interactNearestWallMount() {
    if (!this.ready) return null;
    if (this.mode === 'mount-focus') {
      this.exitMountFocusMode();
      return null;
    }
    if (this.mode !== 'freeroam') return null;
    updateProximityAndHoverWallMounts();
    const target = this.proximityMount || this.hoveredMount;
    if (target) {
      return this.focusWallMount(target.mountName);
    }
    return null;
  },
  evaluateScrollCorridorPath(progress) {
    return evaluateScrollCorridorPath(progress);
  },
  scrollToProjectStation(stationIndex) {
    if (!this.ready) return null;
    const st = HOLO_PROJECT_STATIONS.find((s) => s.index === Number(stationIndex));
    if (!st) return null;
    const midProgress = 0.5 * (st.startProgress + st.endProgress);
    this.setScrollProgress(midProgress);
    return st;
  },
  setScrollProgress(fraction, { smooth = false } = {}) {
    if (!this.ready) return;
    const clamped = Math.max(0.0, Math.min(1.0, Number(fraction) || 0.0));
    const env = this.environment;
    const activeChar = this.getActiveCharacter();

    // Cleanly disengage Mount Focus Mode if active (§6.3)
    if (this.mode === 'mount-focus' || this.isMountFocused) {
      this.isMountFocused = false;
      this.focusedMount = null;
      mountFocusCameraState.active = false;
      mountFocusCameraState.returningToOrbit = false;
    }

    if (clamped < 1.0) {
      this.mode = 'scroll';
      document.body.classList.remove('freeroam-mode');
      document.body.classList.remove('mount-pointer-hover');
      for (const k of Object.keys(keysPressed)) {
        keysPressed[k] = false;
      }
      jumpRequested = false;
      cameraOrbit.yaw = env.spawnPlayerYaw;
      cameraOrbit.pitch = CAM_DEFAULT_PITCH;
      cameraOrbit.desiredDistance = CAM_DEFAULT_DISTANCE;
      cameraOrbit.isDragging = false;
    }

    this.targetScrollProgress = clamped;
    syncWindowScrollToFraction(clamped);

    if (!smooth) {
      const prevCharX = activeChar.position.x;
      const prevCharZ = activeChar.position.z;
      this.scrollProgress = clamped;
      this.scrollVelocity = 0.0;
      const pose = evaluateScrollCorridorPath(clamped);
      activeChar.position.set(pose.x, env.floorY, pose.z);
      activeChar.yaw = clamped <= 0.001 ? env.spawnPlayerYaw : clamped >= 0.999 ? 0.0 : pose.forwardYaw;
      const jumpDist = Math.hypot(pose.x - prevCharX, pose.z - prevCharZ);
      if (jumpDist >= 0.45 && this.audio) {
        this.audio.triggerFootstep('Walk', 1.0);
      }
      activeChar.freezeToIdle();
      activeChar.root.position.copy(activeChar.position);
      activeChar.root.rotation.set(0, activeChar.yaw, 0);
      activeChar.mixer.update(0.0);
      activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
      activeChar.root.updateMatrixWorld(true);

      if (this.runningEffects) {
        this.runningEffects.quiesceImmediately();
      }
      if (clamped >= 0.9995) {
        enterFreeRoamMode();
      }
    }

    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }

    updateWallScreenMounts();
    updateProximityAndHoverWallMounts();
    updateCameraController(1 / 60);
    updateHolographicPopupUI();
    updateSFXAndAudioSubsystems(1 / 60, holoShaderUniforms.uHoloTime.value);
    if (this.mathPods) {
      if (this.mathPods.activeDragPodId) {
        this.mathPods.endDrag();
        this.draggedMathPod = null;
      }
      updateMathPodsCorridorLOD();
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
  },
  returnToScrollMode(targetFraction = null) {
    if (!this.ready) return;
    const env = this.environment;
    const activeChar = this.getActiveCharacter();
    const idleChar = this.getIdleCharacter();

    // Cleanly disengage Mount Focus Mode first (§6.3)
    this.isMountFocused = false;
    this.focusedMount = null;
    this.proximityMount = null;
    this.hoveredMount = null;
    if (this.mathPodPopups) {
      this.mathPodPopups.setGlobalVisibility(true);
    }
    mountFocusCameraState.active = false;
    mountFocusCameraState.returningToOrbit = false;

    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    jumpRequested = false;
    cameraOrbit.isDragging = false;

    document.body.classList.remove('freeroam-mode');
    document.body.classList.remove('mount-pointer-hover');
    this.mode = 'scroll';
    this.scrollVelocity = 0.0;

    let destProgress;
    if (typeof targetFraction === 'number' && !Number.isNaN(targetFraction)) {
      destProgress = Math.max(0.0, Math.min(0.99, targetFraction));
    } else {
      destProgress = Math.max(
        0.0,
        Math.min(0.96, interpolateProgressFromCorridorZ(activeChar.position.z))
      );
    }

    this.scrollProgress = destProgress;
    this.targetScrollProgress = destProgress;
    syncWindowScrollToFraction(destProgress);

    const pose = evaluateScrollCorridorPath(destProgress);
    activeChar.position.set(pose.x, env.floorY, pose.z);
    activeChar.yaw = destProgress <= 0.001 ? env.spawnPlayerYaw : pose.forwardYaw;
    activeChar.freezeToIdle();
    activeChar.root.rotation.set(0, activeChar.yaw, 0);
    activeChar.mixer.update(0.0);
    activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    activeChar.root.updateMatrixWorld(true);

    idleChar.position.set(env.spawnNpcPos.x, env.floorY, env.spawnNpcPos.z);
    idleChar.yaw = env.spawnNpcYaw;
    idleChar.freezeToIdle();
    idleChar.root.rotation.set(0, idleChar.yaw, 0);
    idleChar.mixer.update(0.0);
    idleChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    idleChar.root.updateMatrixWorld(true);

    cameraOrbit.yaw = env.spawnPlayerYaw;
    cameraOrbit.pitch = CAM_DEFAULT_PITCH;
    cameraOrbit.desiredDistance = CAM_DEFAULT_DISTANCE;

    if (this.runningEffects) {
      this.runningEffects.quiesceImmediately();
    }
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }

    updateWallScreenMounts();
    updateProximityAndHoverWallMounts();
    updateCameraController(1.0);
    updateHolographicPopupUI();
    updateSFXAndAudioSubsystems(1 / 60, holoShaderUniforms.uHoloTime.value);
    if (this.mathPods) {
      if (this.mathPods.activeDragPodId) {
        this.mathPods.endDrag();
        this.draggedMathPod = null;
      }
      updateMathPodsCorridorLOD();
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
  },
  resetToEntrance() {
    this.returnToScrollMode(0.0);
  },
  swapCharacter() {
    if (!this.ready) return null;
    const prevChar = this.getActiveCharacter();
    const nextChar = this.getIdleCharacter();

    const activePos = prevChar.position.clone();
    const activeVel = prevChar.velocity.clone();
    const activeYaw = prevChar.yaw;
    const activeGrounded = prevChar.isGrounded;
    const activeState = prevChar.state;
    const activeDialogue = Boolean(prevChar.dialogueActive);
    const activeClip = prevChar.currentClipName || 'IDLE_DEFAULT';
    const activeTimeScale = prevChar.currentAction
      ? prevChar.currentAction.getEffectiveTimeScale()
      : 1.0;

    const secondaryPos = nextChar.position.clone();
    const secondaryYaw = nextChar.yaw;

    prevChar.position.copy(secondaryPos);
    prevChar.yaw = secondaryYaw;
    prevChar.freezeToIdle();
    prevChar.root.position.copy(prevChar.position);
    prevChar.root.rotation.set(0, prevChar.yaw, 0);
    prevChar.mixer.update(0.0);
    prevChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    prevChar.root.updateMatrixWorld(true);

    nextChar.position.copy(activePos);
    nextChar.velocity.copy(activeVel);
    nextChar.yaw = activeYaw;
    nextChar.isGrounded = activeGrounded;
    nextChar.customEmoteActive = false;
    nextChar.dialogueActive = activeDialogue;
    nextChar.state = activeState;
    nextChar.root.position.copy(nextChar.position);
    nextChar.root.rotation.set(0, nextChar.yaw, 0);
    nextChar.crossfadeTo(activeClip, 0.0);
    if (nextChar.currentAction) {
      nextChar.currentAction.setEffectiveTimeScale(activeTimeScale);
    }
    nextChar.mixer.update(0.0);
    nextChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    nextChar.root.updateMatrixWorld(true);

    this.activeCharacterId = nextChar.id;
    if (
      this.activeCharacterId === 'tunic' &&
      String(this.currentVariantKey).startsWith('luis_')
    ) {
      this.currentVariantKey = nextChar.isHoloShaderActive
        ? 'platodoom_holo'
        : 'platodoom_color';
      this.activeVariantKey = this.currentVariantKey;
    } else if (
      this.activeCharacterId === 'hoodie' &&
      String(this.currentVariantKey).startsWith('platodoom_')
    ) {
      this.currentVariantKey = nextChar.isHoloShaderActive ? 'luis_holo' : 'luis_color';
      this.activeVariantKey = this.currentVariantKey;
    }
    const variantSelectEl = document.getElementById('glb-variant-select');
    if (variantSelectEl && variantSelectEl.value !== this.currentVariantKey) {
      variantSelectEl.value = this.currentVariantKey;
    }
    nextChar.root.visible = true;
    prevChar.root.visible = !this.soloCharacterMode;
    if (this.audio && this.audio.syncFootstepCharacterProfile) {
      this.audio.syncFootstepCharacterProfile(nextChar);
    }

    const btn = document.getElementById('swap-character-btn');
    if (btn) {
      btn.textContent =
        this.activeCharacterId === 'hoodie'
          ? 'Active: Hoodie (Character X) ⇄ Swap'
          : 'Active: Tunic (Character X) ⇄ Swap';
    }
    const holoBtn = document.getElementById('toggle-holo-shader-btn');
    if (holoBtn) {
      holoBtn.textContent = nextChar.isHoloShaderActive ? 'Holo Shader: ON (H)' : 'Holo Shader: OFF (H)';
    }
    const selectEl = document.getElementById('animation-select');
    if (selectEl && nextChar.currentClipName) {
      selectEl.value = nextChar.currentClipName;
    }

    updateWallScreenMounts();
    updateProximityAndHoverWallMounts();
    updateCameraController(1 / 60);
    updateHolographicPopupUI();
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }
    updateTelemetryHUD();
    return nextChar;
  },
  setSoloCharacterMode(enabled) {
    this.soloCharacterMode = Boolean(enabled);
    if (this.characters && this.characters.hoodie && this.characters.tunic) {
      const activeChar = this.getActiveCharacter();
      const idleChar = this.getIdleCharacter();
      if (activeChar) activeChar.root.visible = true;
      if (idleChar) {
        idleChar.root.visible = !this.soloCharacterMode;
        if (idleChar.root.visible) {
          idleChar.mixer.update(0.0);
          idleChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
          idleChar.root.updateMatrixWorld(true);
        }
      }
    }
    const soloBtn = document.getElementById('solo-character-btn');
    if (soloBtn) {
      soloBtn.textContent = this.soloCharacterMode ? 'Solo: ON' : 'Solo: OFF';
    }
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return this.soloCharacterMode;
  },
  toggleSoloCharacterMode() {
    return this.setSoloCharacterMode(!this.soloCharacterMode);
  },
  async selectCharacterVariant(variantKey) {
    if (!this.ready) return null;
    const spec = GLB_VARIANT_CATALOG[variantKey];
    if (!spec) {
      raiseFatalError(`Unknown character GLB variant '${variantKey}'.`);
    }

    // Ensure the target character slot is the active foreground character
    if (this.activeCharacterId !== spec.characterSlot) {
      this.swapCharacter();
    }

    let controller = this.variantCache[variantKey];
    const currentChar = this.characters[spec.characterSlot];
    const activePos = currentChar.position.clone();
    const activeVel = currentChar.velocity.clone();
    const activeYaw = currentChar.yaw;
    const activeGrounded = currentChar.isGrounded;
    const activeState = currentChar.state;
    const activeDialogue = Boolean(currentChar.dialogueActive);
    const activeClip = currentChar.currentClipName || 'IDLE_DEFAULT';

    if (!controller) {
      const gltf = await loadGLB(this.variantLoader, spec.url);
      if (gltf.animations && gltf.animations.length > 0) {
        raiseFatalError(
          `Character variant '${spec.url}' contains ${gltf.animations.length} prohibited embedded legacy animation clips.`
        );
      }
      controller = new CharacterController({
        id: spec.characterSlot,
        label: spec.label,
        gltfScene: gltf.scene,
        sharedClips: this.sharedClips,
        spawnPos: activePos,
        spawnYaw: activeYaw,
        floorY: this.environment.floorY,
        baseColor: spec.baseColor,
      });
      controller.root.animations = this.sharedClips;
      this.variantCache[variantKey] = controller;
    }

    if (currentChar !== controller) {
      scene.remove(currentChar.root);
      scene.add(controller.root);
      this.characters[spec.characterSlot] = controller;
      window.__THREE_ANIMATION_MIXERS__ = [
        this.characters.hoodie.mixer,
        this.characters.tunic.mixer,
      ];
    }

    controller.position.copy(activePos);
    controller.velocity.copy(activeVel);
    controller.yaw = activeYaw;
    controller.isGrounded = activeGrounded;
    controller.dialogueActive = activeDialogue;
    controller.state = activeState;
    controller.root.position.copy(controller.position);
    controller.root.rotation.set(0, controller.yaw, 0);
    controller.setHolographicShader(spec.defaultHoloShader);
    controller.crossfadeTo(activeClip, 0.0);
    controller.mixer.update(0.0);
    controller.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    controller.root.updateMatrixWorld(true);

    this.currentVariantKey = variantKey;
    this.activeVariantKey = variantKey;
    if (this.audio && this.audio.syncFootstepCharacterProfile) {
      this.audio.syncFootstepCharacterProfile(controller);
    }
    this.setSoloCharacterMode(this.soloCharacterMode);

    const holoBtn = document.getElementById('toggle-holo-shader-btn');
    if (holoBtn) {
      holoBtn.textContent = controller.isHoloShaderActive ? 'Holo Shader: ON (H)' : 'Holo Shader: OFF (H)';
    }
    const variantSelect = document.getElementById('glb-variant-select');
    if (variantSelect && variantSelect.value !== variantKey) {
      variantSelect.value = variantKey;
    }

    updateWallScreenMounts();
    updateCameraController(1 / 60);
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return controller;
  },
  playAnimation(clipName) {
    if (!this.ready) {
      raiseFatalError('Cannot play animation before sandbox is ready.');
    }
    const activeChar = this.getActiveCharacter();
    const resolved = activeChar.triggerCustomAnimation(clipName);
    updateTelemetryHUD();
    return resolved;
  },
  startDialogue(preferredClip = null) {
    if (!this.ready) {
      raiseFatalError('Cannot start dialogue before sandbox is ready.');
    }
    const activeChar = this.getActiveCharacter();
    const clipName = activeChar.startDialogue(preferredClip);
    updateTelemetryHUD();
    return clipName;
  },
  stopDialogue() {
    if (!this.ready) {
      raiseFatalError('Cannot stop dialogue before sandbox is ready.');
    }
    const activeChar = this.getActiveCharacter();
    const clipName = activeChar.stopDialogue();
    updateTelemetryHUD();
    return clipName;
  },
  toggleDialogue() {
    if (!this.ready) {
      raiseFatalError('Cannot toggle dialogue before sandbox is ready.');
    }
    const activeChar = this.getActiveCharacter();
    const clipName = activeChar.toggleDialogue();
    updateTelemetryHUD();
    return clipName;
  },
  setInputState(partialKeys) {
    if (this.mode === 'mount-focus') {
      const hasMoveKey =
        partialKeys.KeyW ||
        partialKeys.KeyA ||
        partialKeys.KeyS ||
        partialKeys.KeyD ||
        partialKeys.ArrowUp ||
        partialKeys.ArrowDown ||
        partialKeys.ArrowLeft ||
        partialKeys.ArrowRight;
      if (hasMoveKey) {
        this.exitMountFocusMode();
      }
    }
    Object.assign(keysPressed, partialKeys);
    if (partialKeys.Space) {
      jumpRequested = true;
    }
  },
  toggleHolographicShader(forceState = null) {
    if (!this.ready) return false;
    const activeChar = this.getActiveCharacter();
    const nextState =
      typeof forceState === 'boolean' ? forceState : !activeChar.isHoloShaderActive;
    activeChar.setHolographicShader(nextState);
    const holoBtn = document.getElementById('toggle-holo-shader-btn');
    if (holoBtn) {
      holoBtn.textContent = nextState ? 'Holo Shader: ON (H)' : 'Holo Shader: OFF (H)';
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return nextState;
  },
  step(dt) {
    stepSimulation(dt);
  },
};

if (typeof window !== 'undefined') {
  window.__SANDBOX__ = sandbox;
  window.__sandbox = sandbox;
}

// ============================================================================
// Character-Matched & Skeletal-Animation-Synchronized Footstep Controller
// ============================================================================
function didClipPhaseCrossTarget(prevPhase, currPhase, targetPhase) {
  if (prevPhase === null || prevPhase === undefined || prevPhase === currPhase) {
    return false;
  }
  if (currPhase > prevPhase) {
    return prevPhase < targetPhase && currPhase >= targetPhase;
  }
  // Loop wrap-around across 1.0 -> 0.0
  return prevPhase < targetPhase || currPhase >= targetPhase;
}

function updateCharacterFootsteps(activeChar, frameStepDist, wasGrounded) {
  if (!sandbox.audio || !sandbox.audio.footsteps) return;
  const fs = sandbox.audio.footsteps;
  if (sandbox.audio.syncFootstepCharacterProfile) {
    sandbox.audio.syncFootstepCharacterProfile(activeChar);
  }
  fs.isHoloShaderActive = Boolean(activeChar.isHoloShaderActive);

  if (sandbox.mode === 'mount-focus') {
    fs.distanceAccumulator = 0.0;
    fs.lastStepMode = 'Idle';
    fs.prevNormalizedClipPhase = null;
    return;
  }

  // Trigger character-matched landing impact footstep when transitioning from airborne to grounded
  if (!wasGrounded && activeChar.isGrounded) {
    fs.distanceAccumulator = 0.0;
    fs.prevNormalizedClipPhase = null;
    sandbox.audio.triggerFootstep('Land', 1.35, {
      character: activeChar,
      animationClip: activeChar.currentClipName || 'JUMP_DEFAULT',
      animationPhase: 0.0,
    });
    return;
  }

  if (!activeChar.isGrounded || activeChar.customEmoteActive || activeChar.dialogueActive) {
    fs.prevNormalizedClipPhase = null;
    return;
  }

  if ((activeChar.state === 'Walk' || activeChar.state === 'Run') && frameStepDist > 1e-4) {
    const isRun = activeChar.state === 'Run';
    const strideMeters = isRun ? fs.runStepMeters : fs.walkStepMeters;
    const action = activeChar.currentAction;
    const clip = action && typeof action.getClip === 'function' ? action.getClip() : null;
    const clipName = activeChar.currentClipName || (isRun ? 'JOG_DEFAULT' : 'WALK_DEFAULT');
    const clipDur = clip && clip.duration > 1e-4 ? clip.duration : 0.0;

    // Ready Player Me (RPM) skeletal foot-strike phases verified from M_Walk_001.glb & M_Jog_001.glb:
    const leftStrikePhase = isRun ? 0.107 : 0.05;
    const rightStrikePhase = isRun ? 0.607 : 0.55;

    if (clipDur > 0.0) {
      const currPhase = (((action.time % clipDur) + clipDur) % clipDur) / clipDur;
      if (
        fs.prevTrackedCharacterId !== activeChar.id ||
        fs.prevNormalizedClipPhase === null
      ) {
        fs.prevTrackedCharacterId = activeChar.id;
        fs.prevNormalizedClipPhase = 0.0;
      }
      fs.prevTrackedClipName = clipName;

      if (
        fs.leftFootNext &&
        didClipPhaseCrossTarget(fs.prevNormalizedClipPhase, currPhase, leftStrikePhase)
      ) {
        fs.distanceAccumulator = 0.0;
        sandbox.audio.triggerFootstep(activeChar.state, isRun ? 1.25 : 1.0, {
          character: activeChar,
          foot: 'left',
          animationClip: clipName,
          animationPhase: leftStrikePhase,
        });
      } else if (
        !fs.leftFootNext &&
        didClipPhaseCrossTarget(fs.prevNormalizedClipPhase, currPhase, rightStrikePhase)
      ) {
        fs.distanceAccumulator = 0.0;
        sandbox.audio.triggerFootstep(activeChar.state, isRun ? 1.25 : 1.0, {
          character: activeChar,
          foot: 'right',
          animationClip: clipName,
          animationPhase: rightStrikePhase,
        });
      }
      fs.prevNormalizedClipPhase = currPhase;
      fs.lastAnimationClip = clipName;
      fs.lastAnimationPhase = Number(currPhase.toFixed(4));
    } else {
      fs.distanceAccumulator += frameStepDist;
      while (fs.distanceAccumulator >= strideMeters) {
        fs.distanceAccumulator -= strideMeters;
        sandbox.audio.triggerFootstep(activeChar.state, isRun ? 1.25 : 1.0, {
          character: activeChar,
          animationClip: clipName,
          animationPhase: 0.0,
        });
      }
    }
  } else if (activeChar.state === 'Idle' || activeChar.state === 'Talking') {
    fs.lastStepMode = 'Idle';
    fs.prevNormalizedClipPhase = null;
    fs.distanceAccumulator = Math.min(fs.distanceAccumulator, fs.walkStepMeters * 0.45);
  }
}

// ============================================================================
// Scroll-Walk Mode Locomotion & Camera Tracking
// ============================================================================
function updateScrollWalkLocomotion(dt) {
  const activeChar = sandbox.getActiveCharacter();
  const env = sandbox.environment;
  const pathLength = SCROLL_TERMINAL_Z - env.spawnPlayerPos.z;

  const progressDiff = sandbox.targetScrollProgress - sandbox.scrollProgress;
  const distError = progressDiff * pathLength;

  if (Math.abs(distError) > 0.002) {
    if (activeChar.customEmoteActive) activeChar.customEmoteActive = false;
    if (activeChar.dialogueActive) activeChar.stopDialogue();
  }

  const prevX = activeChar.position.x;
  const prevZ = activeChar.position.z;

  if (Math.abs(distError) <= 0.003 && Math.abs(sandbox.scrollVelocity) <= 0.08) {
    sandbox.scrollProgress = sandbox.targetScrollProgress;
    sandbox.scrollVelocity = 0.0;
  } else {
    const absDist = Math.abs(distError);
    let desiredSpeed;
    if (absDist >= 0.55) {
      desiredSpeed = Math.min(SCROLL_MAX_SPEED, 1.45 + (absDist - 0.55) * 1.95);
    } else {
      desiredSpeed = Math.max(0.08, (absDist / 0.55) * 1.45);
    }

    const desiredVel = Math.sign(distError) * desiredSpeed;
    const isDecelerating =
      sandbox.scrollVelocity * desiredVel < 0.0 ||
      Math.abs(desiredVel) < Math.abs(sandbox.scrollVelocity);
    const rate = isDecelerating ? SCROLL_DECEL_RATE : SCROLL_ACCEL_RATE;
    const maxDeltaV = rate * dt;
    const dv = desiredVel - sandbox.scrollVelocity;

    if (Math.abs(dv) <= maxDeltaV) {
      sandbox.scrollVelocity = desiredVel;
    } else {
      sandbox.scrollVelocity += Math.sign(dv) * maxDeltaV;
    }

    const deltaProgress = (sandbox.scrollVelocity * dt) / pathLength;
    const nextProgress = sandbox.scrollProgress + deltaProgress;

    if (
      (progressDiff > 0.0 && nextProgress >= sandbox.targetScrollProgress) ||
      (progressDiff < 0.0 && nextProgress <= sandbox.targetScrollProgress)
    ) {
      sandbox.scrollProgress = sandbox.targetScrollProgress;
      sandbox.scrollVelocity = 0.0;
    } else {
      sandbox.scrollProgress = Math.max(0.0, Math.min(1.0, nextProgress));
    }
  }

  const pose = evaluateScrollCorridorPath(sandbox.scrollProgress);
  activeChar.position.set(pose.x, env.floorY, pose.z);
  activeChar.isGrounded = true;

  const frameStepDist = Math.hypot(pose.x - prevX, pose.z - prevZ);
  if (dt > 1e-6 && Math.abs(sandbox.scrollVelocity) > 1e-4) {
    activeChar.velocity.set(
      (pose.x - prevX) / dt,
      0.0,
      (pose.z - prevZ) / dt
    );
  } else {
    activeChar.velocity.set(0.0, 0.0, 0.0);
  }

  let targetYaw = activeChar.yaw;
  if (sandbox.scrollVelocity > 0.03) {
    targetYaw = pose.forwardYaw;
  } else if (sandbox.scrollVelocity < -0.03) {
    targetYaw = Math.atan2(-pose.dx_dz, -1.0);
  } else if (sandbox.scrollProgress <= 0.001) {
    targetYaw = env.spawnPlayerYaw;
  } else if (sandbox.scrollProgress >= 0.999) {
    targetYaw = 0.0;
  }

  let yawDiff = targetYaw - activeChar.yaw;
  yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
  activeChar.yaw += yawDiff * Math.min(1.0, 14.0 * dt);
  activeChar.yaw = Math.atan2(Math.sin(activeChar.yaw), Math.cos(activeChar.yaw));

  if (
    Math.abs(sandbox.scrollVelocity) <= 0.03 &&
    (sandbox.scrollProgress <= 0.0005 || sandbox.scrollProgress >= 0.9995)
  ) {
    activeChar.yaw = targetYaw;
  }

  activeChar.root.position.copy(activeChar.position);
  activeChar.root.rotation.set(0.0, activeChar.yaw, 0.0);

  const planarSpeed = Math.hypot(activeChar.velocity.x, activeChar.velocity.z);
  if (!activeChar.customEmoteActive && !activeChar.dialogueActive) {
    if (planarSpeed > 0.05) {
      if (planarSpeed >= SCROLL_RUN_THRESHOLD) {
        activeChar.state = 'Run';
        activeChar.crossfadeTo(activeChar.getOffboardClip('JOG_DEFAULT'), CROSSFADE_DURATION);
        if (activeChar.currentAction) {
          activeChar.currentAction.setEffectiveTimeScale(
            Math.max(0.55, Math.min(4.0, planarSpeed / RUN_BASE_STRIDE))
          );
        }
      } else {
        activeChar.state = 'Walk';
        activeChar.crossfadeTo(activeChar.getOffboardClip('WALK_DEFAULT'), CROSSFADE_DURATION);
        if (activeChar.currentAction) {
          activeChar.currentAction.setEffectiveTimeScale(
            Math.max(0.40, Math.min(2.2, planarSpeed / WALK_BASE_STRIDE))
          );
        }
      }
    } else {
      activeChar.state = 'Idle';
      activeChar.crossfadeTo(activeChar.getOffboardClip('IDLE_DEFAULT'), CROSSFADE_DURATION);
      if (activeChar.currentAction) {
        activeChar.currentAction.setEffectiveTimeScale(1.0);
      }
    }
  }

  activeChar._lastFrameStepDist = frameStepDist;
  activeChar._wasGroundedBeforeStep = true;

  cameraOrbit.yaw = env.spawnPlayerYaw;
  cameraOrbit.pitch = CAM_DEFAULT_PITCH;
  cameraOrbit.desiredDistance = CAM_DEFAULT_DISTANCE;

  if (sandbox.targetScrollProgress >= 0.999 && sandbox.scrollProgress >= 0.9995) {
    const endPose = evaluateScrollCorridorPath(1.0);
    activeChar.position.set(endPose.x, env.floorY, endPose.z);
    activeChar.velocity.set(0.0, 0.0, 0.0);
    activeChar.yaw = 0.0;
    activeChar.root.position.copy(activeChar.position);
    activeChar.root.rotation.set(0.0, activeChar.yaw, 0.0);
    enterFreeRoamMode();
  }
}

// ============================================================================
// Interactive Free-Roam Mode Locomotion & Collision (Spec 032 §3.3 & §5.2)
// ============================================================================
function updateFreeRoamCharacterLocomotion(dt) {
  const activeChar = sandbox.getActiveCharacter();
  const idleChar = sandbox.getIdleCharacter();
  const env = sandbox.environment;

  // Unrestricted 3D Scene Fly / No-Clip Free-Roam Mode (Spec 032 §5.2)
  if (sandbox.freeRoamFlyMode) {
    const forwardPos = keysPressed.KeyW || keysPressed.ArrowUp ? 1.0 : 0.0;
    const forwardNeg = keysPressed.KeyS || keysPressed.ArrowDown ? 1.0 : 0.0;
    const rightPos = keysPressed.KeyD || keysPressed.ArrowRight ? 1.0 : 0.0;
    const rightNeg = keysPressed.KeyA || keysPressed.ArrowLeft ? 1.0 : 0.0;
    const upPos = keysPressed.Space || keysPressed.KeyE ? 1.0 : 0.0;
    const downNeg = keysPressed.KeyC || keysPressed.ControlLeft || keysPressed.ControlRight ? 1.0 : 0.0;

    const forwardInput = forwardPos - forwardNeg;
    const rightInput = rightPos - rightNeg;
    const verticalInput = upPos - downNeg;
    const isBoost = Boolean(keysPressed.ShiftLeft || keysPressed.ShiftRight);
    const flySpeed = isBoost ? 18.0 : 8.0;

    const cosPitch = Math.cos(cameraOrbit.pitch);
    const sinPitch = -Math.sin(cameraOrbit.pitch);
    const lookFwdX = Math.sin(cameraOrbit.yaw) * cosPitch;
    const lookFwdY = sinPitch;
    const lookFwdZ = Math.cos(cameraOrbit.yaw) * cosPitch;

    const rightX = -Math.cos(cameraOrbit.yaw);
    const rightZ = Math.sin(cameraOrbit.yaw);

    const vx = (lookFwdX * forwardInput + rightX * rightInput) * flySpeed;
    const vy = (lookFwdY * forwardInput + verticalInput) * flySpeed;
    const vz = (lookFwdZ * forwardInput + rightZ * rightInput) * flySpeed;

    activeChar.velocity.set(vx, vy, vz);
    activeChar.position.x += vx * dt;
    activeChar.position.y += vy * dt;
    activeChar.position.z += vz * dt;
    activeChar.yaw = cameraOrbit.yaw;
    activeChar.isGrounded = false;
    activeChar.root.position.copy(activeChar.position);
    activeChar.root.rotation.set(0.0, activeChar.yaw, 0.0);
    activeChar._lastFrameStepDist = 0.0;
    return;
  }

  // In Mount Focus Mode, Character "X" remains quiescent in Idle or Talking (§5.1)
  if (sandbox.mode === 'mount-focus') {
    activeChar.velocity.set(0.0, 0.0, 0.0);
    activeChar.position.y = env.floorY;
    activeChar.isGrounded = true;
    if (!activeChar.customEmoteActive && !activeChar.dialogueActive && activeChar.state !== 'Idle') {
      activeChar.freezeToIdle();
    }
    activeChar._lastFrameStepDist = 0.0;
    activeChar._wasGroundedBeforeStep = true;
    return;
  }

  const prevX = activeChar.position.x;
  const prevZ = activeChar.position.z;
  const wasGroundedBeforeStep = activeChar.isGrounded;

  tempCamForward.set(Math.sin(cameraOrbit.yaw), 0.0, Math.cos(cameraOrbit.yaw)).normalize();
  tempCamRight.crossVectors(tempCamForward, WORLD_UP).normalize();

  const forwardPos = keysPressed.KeyW || keysPressed.ArrowUp ? 1.0 : 0.0;
  const forwardNeg = keysPressed.KeyS || keysPressed.ArrowDown ? 1.0 : 0.0;
  const rightPos = keysPressed.KeyD || keysPressed.ArrowRight ? 1.0 : 0.0;
  const rightNeg = keysPressed.KeyA || keysPressed.ArrowLeft ? 1.0 : 0.0;

  const forwardInput = forwardPos - forwardNeg;
  const rightInput = rightPos - rightNeg;
  const hasMovementInput = forwardInput !== 0.0 || rightInput !== 0.0;
  const isSprinting = Boolean(keysPressed.ShiftLeft || keysPressed.ShiftRight);

  if (hasMovementInput || jumpRequested || keysPressed.Space) {
    if (activeChar.customEmoteActive) activeChar.customEmoteActive = false;
    if (activeChar.dialogueActive) activeChar.stopDialogue();
  }

  const moveDirX = tempCamForward.x * forwardInput + tempCamRight.x * rightInput;
  const moveDirZ = tempCamForward.z * forwardInput + tempCamRight.z * rightInput;
  const moveLen = Math.hypot(moveDirX, moveDirZ);
  const normDirX = moveLen > 1e-6 ? moveDirX / moveLen : 0.0;
  const normDirZ = moveLen > 1e-6 ? moveDirZ / moveLen : 0.0;

  const targetSpeed = hasMovementInput ? (isSprinting ? RUN_SPEED : WALK_SPEED) : 0.0;
  const targetVelX = normDirX * targetSpeed;
  const targetVelZ = normDirZ * targetSpeed;

  const rate = hasMovementInput ? ACCEL_RATE : DECEL_RATE;
  const blend = Math.min(1.0, rate * dt);
  activeChar.velocity.x += (targetVelX - activeChar.velocity.x) * blend;
  activeChar.velocity.z += (targetVelZ - activeChar.velocity.z) * blend;

  if (!hasMovementInput && Math.hypot(activeChar.velocity.x, activeChar.velocity.z) < 0.02) {
    activeChar.velocity.x = 0.0;
    activeChar.velocity.z = 0.0;
  }

  if (hasMovementInput) {
    const targetYaw = Math.atan2(normDirX, normDirZ);
    let diff = targetYaw - activeChar.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    activeChar.yaw += diff * Math.min(1.0, TURN_SPEED * dt);
    activeChar.yaw = Math.atan2(Math.sin(activeChar.yaw), Math.cos(activeChar.yaw));
  }

  if ((jumpRequested || keysPressed.Space) && activeChar.isGrounded) {
    activeChar.velocity.y = JUMP_VELOCITY;
    activeChar.isGrounded = false;
    activeChar.customEmoteActive = false;
    activeChar.dialogueActive = false;
    activeChar.state = 'Jump';
    activeChar.crossfadeTo('JUMP_DEFAULT', JUMP_CROSSFADE, true);
  }
  jumpRequested = false;

  const totalDx = activeChar.velocity.x * dt;
  const totalDz = activeChar.velocity.z * dt;
  const stepDist = Math.hypot(totalDx, totalDz);
  const subSteps = Math.max(1, Math.ceil(stepDist / 0.06));
  const subDt = dt / subSteps;

  const posXZ = { x: activeChar.position.x, z: activeChar.position.z };
  const velXZ = { x: activeChar.velocity.x, z: activeChar.velocity.z };
  const idleXZ = { x: idleChar.position.x, z: idleChar.position.z };

  for (let s = 0; s < subSteps; s++) {
    posXZ.x += velXZ.x * subDt;
    posXZ.z += velXZ.z * subDt;
    resolveCharacterSeparation(posXZ, velXZ, idleXZ, CHAR_SEPARATION_DIST);
    resolveCircleAgainstWalls(posXZ, velXZ, CHAR_COLLISION_RADIUS, env.wallSegments);
  }

  activeChar.position.x = posXZ.x;
  activeChar.position.z = posXZ.z;
  activeChar.velocity.x = velXZ.x;
  activeChar.velocity.z = velXZ.z;

  // Sample floor height across Freeman Alley COLLIDER_FLOOR
  const surf = sampleSurfaceHeightAndNormal(
    activeChar.position.x,
    activeChar.position.z,
    env.floorTriangles,
    activeChar.position.y
  );
  const localFloorY = surf.onFloor ? surf.height : env.floorY;

  if (!activeChar.isGrounded) {
    activeChar.velocity.y += GRAVITY * dt;
    activeChar.position.y += activeChar.velocity.y * dt;
    if (activeChar.position.y <= localFloorY) {
      activeChar.position.y = localFloorY;
      activeChar.velocity.y = 0.0;
      activeChar.isGrounded = true;
    }
  } else {
    activeChar.position.y = localFloorY;
    activeChar.velocity.y = 0.0;
  }

  activeChar.root.position.copy(activeChar.position);
  activeChar.root.rotation.set(0.0, activeChar.yaw, 0.0);

  const actualFrameDist = Math.hypot(activeChar.position.x - prevX, activeChar.position.z - prevZ);
  const currentPlanarSpeed = Math.hypot(activeChar.velocity.x, activeChar.velocity.z);
  activeChar.moveSpeed = currentPlanarSpeed;

  if (!activeChar.customEmoteActive && !activeChar.dialogueActive) {
    if (!activeChar.isGrounded) {
      activeChar.state = 'Jump';
      if (
        activeChar.currentClipName === 'JUMP_DEFAULT' &&
        activeChar.velocity.y <= -1.2 &&
        activeChar.actions.has('FALL_DEFAULT')
      ) {
        activeChar.crossfadeTo('FALL_DEFAULT', JUMP_CROSSFADE);
      } else if (
        activeChar.currentClipName !== 'JUMP_DEFAULT' &&
        activeChar.currentClipName !== 'FALL_DEFAULT'
      ) {
        activeChar.crossfadeTo('JUMP_DEFAULT', JUMP_CROSSFADE, true);
      }
    } else if (hasMovementInput || currentPlanarSpeed > 0.08) {
      if (isSprinting && currentPlanarSpeed > WALK_SPEED * 1.1) {
        activeChar.state = 'Run';
        activeChar.crossfadeTo('JOG_DEFAULT', CROSSFADE_DURATION);
        if (activeChar.currentAction) {
          activeChar.currentAction.setEffectiveTimeScale(
            Math.max(0.5, currentPlanarSpeed / RUN_BASE_STRIDE)
          );
        }
      } else {
        activeChar.state = 'Walk';
        activeChar.crossfadeTo('WALK_DEFAULT', CROSSFADE_DURATION);
        if (activeChar.currentAction) {
          activeChar.currentAction.setEffectiveTimeScale(
            Math.max(0.4, currentPlanarSpeed / WALK_BASE_STRIDE)
          );
        }
      }
    } else {
      activeChar.state = 'Idle';
      activeChar.crossfadeTo('IDLE_DEFAULT', CROSSFADE_DURATION);
      if (activeChar.currentAction) {
        activeChar.currentAction.setEffectiveTimeScale(1.0);
      }
    }
  }

  activeChar._lastFrameStepDist = actualFrameDist;
  activeChar._wasGroundedBeforeStep = wasGroundedBeforeStep;
}

// ============================================================================
// Unified Third-Person Orbit & Wall-Mount Focus Camera Controller (§5.1 & §5.3)
// ============================================================================
function computeThirdPersonCameraPose() {
  const activeChar = sandbox.getActiveCharacter();
  const env = sandbox.environment;

  // Over-the-Shoulder (OTS) lateral offset along camera's horizontal right vector (Spec 019 §4)
  // Camera forward in XZ is (sin(yaw), cos(yaw)), so camera right in XZ is (-cos(yaw), sin(yaw)).
  const camRightX = -Math.cos(cameraOrbit.yaw);
  const camRightZ = Math.sin(cameraOrbit.yaw);

  cameraOrbit.pivotTarget.set(
    activeChar.position.x + camRightX * CAM_SHOULDER_OFFSET_X,
    activeChar.position.y + CAM_PIVOT_HEIGHT,
    activeChar.position.z + camRightZ * CAM_SHOULDER_OFFSET_X
  );
  cameraOrbit.pivotCurrent.copy(cameraOrbit.pivotTarget);

  const cosPitch = Math.cos(cameraOrbit.pitch);
  const sinPitch = Math.sin(cameraOrbit.pitch);
  const dirX = -Math.sin(cameraOrbit.yaw) * cosPitch;
  const dirY = sinPitch;
  const dirZ = -Math.cos(cameraOrbit.yaw) * cosPitch;

  let clampedDist = cameraOrbit.desiredDistance;
  const bypassWallClamp = Boolean(sandbox.freeRoamFlyMode);

  if (!bypassWallClamp) {
    const horizLen = Math.hypot(dirX, dirZ);
    if (horizLen > 1e-5) {
      const hdx = dirX / horizLen;
      const hdz = dirZ / horizLen;
      const maxHorizDist = cameraOrbit.desiredDistance * horizLen + CAM_WALL_MARGIN;

      for (let i = 0; i < env.wallSegments.length; i++) {
        const seg = env.wallSegments[i];
        if (seg.colliderName === 'COLLIDER_BOUND_START') continue;
        const hitHoriz = intersectRay2DSegment(
          cameraOrbit.pivotCurrent.x,
          cameraOrbit.pivotCurrent.z,
          hdx,
          hdz,
          maxHorizDist,
          seg.ax,
          seg.az,
          seg.bx,
          seg.bz
        );
        if (hitHoriz !== null) {
          const hit3DDist = (hitHoriz - CAM_WALL_MARGIN) / horizLen;
          if (hit3DDist < clampedDist) {
            clampedDist = Math.max(0.35, hit3DDist);
          }
        }
      }
    }

    tempRayDir.set(dirX, dirY, dirZ).normalize();
    raycaster.set(cameraOrbit.pivotCurrent, tempRayDir);
    raycaster.near = 0.05;
    raycaster.far = cameraOrbit.desiredDistance + CAM_WALL_MARGIN;

    const hits = [];
    for (const mesh of env.colliderMeshList) {
      if (mesh.name === 'COLLIDER_BOUND_START') continue;
      mesh.raycast(raycaster, hits);
    }
    if (hits.length > 0) {
      hits.sort((a, b) => a.distance - b.distance);
      const hitDist = hits[0].distance - CAM_WALL_MARGIN;
      if (hitDist < clampedDist) {
        clampedDist = Math.max(0.35, hitDist);
      }
    }
  }

  cameraOrbit.effectiveDistance = clampedDist;

  const minCamY = sandbox.freeRoamFlyMode ? -50.0 : activeChar.position.y + 0.20;
  tempDesiredCamPos.set(
    cameraOrbit.pivotCurrent.x + dirX * clampedDist,
    Math.max(minCamY, cameraOrbit.pivotCurrent.y + dirY * clampedDist),
    cameraOrbit.pivotCurrent.z + dirZ * clampedDist
  );

  return {
    cameraPos: tempDesiredCamPos,
    pivotPos: cameraOrbit.pivotCurrent,
  };
}

function updateCameraController(dt = 1 / 60) {
  const activeChar = sandbox.getActiveCharacter();
  const orbitState = computeThirdPersonCameraPose();

  if (sandbox.mode === 'mount-focus' && sandbox.focusedMount) {
    const m = sandbox.focusedMount;
    mountFocusCameraState.toLookAt.copy(m.locatorPosition);
    mountFocusCameraState.toPos
      .copy(m.locatorPosition)
      .addScaledVector(m.outwardNormal, FOCUS_CAM_DISTANCE);
    mountFocusCameraState.toPos.y = m.locatorPosition.y;

    if (mountFocusCameraState.transitionProgress < 1.0) {
      mountFocusCameraState.transitionProgress = Math.min(
        1.0,
        mountFocusCameraState.transitionProgress + dt / FOCUS_TRANSITION_DURATION
      );
    }
    const t = mountFocusCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      mountFocusCameraState.fromPos,
      mountFocusCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      mountFocusCameraState.fromLookAt,
      mountFocusCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);
  } else if (mountFocusCameraState.returningToOrbit) {
    mountFocusCameraState.toPos.copy(orbitState.cameraPos);
    mountFocusCameraState.toLookAt.copy(orbitState.pivotPos);
    mountFocusCameraState.transitionProgress = Math.min(
      1.0,
      mountFocusCameraState.transitionProgress + dt / FOCUS_TRANSITION_DURATION
    );
    const t = mountFocusCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      mountFocusCameraState.fromPos,
      mountFocusCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      mountFocusCameraState.fromLookAt,
      mountFocusCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);

    if (mountFocusCameraState.transitionProgress >= 1.0) {
      mountFocusCameraState.returningToOrbit = false;
    }
  } else {
    camera.position.copy(orbitState.cameraPos);
    mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
    camera.lookAt(orbitState.pivotPos);
  }

  camera.updateMatrixWorld(true);

  characterFollowLight.position.set(
    activeChar.position.x,
    activeChar.position.y + 2.35,
    activeChar.position.z - 0.6
  );
}

// ============================================================================
// HUD & Telemetry Updates (Spec 014 §6.4)
// ============================================================================
function updateTelemetryHUD() {
  if (!sandbox.ready) return;
  const active = sandbox.getActiveCharacter();
  const speed = Math.hypot(active.velocity.x, active.velocity.z);
  const pct = Math.round(sandbox.scrollProgress * 100);
  const isFreeRoam = sandbox.mode === 'freeroam';
  const isMountFocus = sandbox.mode === 'mount-focus' && Boolean(sandbox.focusedMount);
  const mountedCount = sandbox.getMountedScreenCount();

  const elModeBanner = document.getElementById('hud-mode-banner');
  const elModeText = document.getElementById('hud-mode-text');
  const elModeSub = document.getElementById('hud-mode-sub');
  const elScrollPct = document.getElementById('hud-scroll-pct');
  const elScrollBar = document.getElementById('hud-scroll-bar-fill');

  if (elModeBanner) {
    elModeBanner.classList.toggle('freeroam', isFreeRoam);
    elModeBanner.classList.toggle('mount-focus', isMountFocus);
  }
  if (elModeText) {
    elModeText.textContent = isMountFocus
      ? `Mount Focus — ${sandbox.focusedMount.mountName}`
      : isFreeRoam
      ? 'Interactive Free-Roam Mode'
      : 'Scroll-Walk Mode';
  }
  if (elModeSub) {
    elModeSub.textContent = isMountFocus
      ? 'Esc / WASD to Return'
      : isFreeRoam
      ? 'WASD + 6 Wall Mounts Active'
      : `${pct}% Alley Progress`;
  }
  if (elScrollPct) {
    elScrollPct.textContent = `${pct}% Scroll`;
  }
  if (elScrollBar) {
    elScrollBar.style.width = `${(sandbox.scrollProgress * 100).toFixed(1)}%`;
  }

  const elTelMode = document.getElementById('tel-mode');
  const elTelScroll = document.getElementById('tel-scroll');
  const elAvatar = document.getElementById('tel-avatar');
  const elState = document.getElementById('tel-state');
  const elClip = document.getElementById('tel-clip');
  const elSpeed = document.getElementById('tel-speed');
  const elPos = document.getElementById('tel-pos');
  const elGround = document.getElementById('tel-ground');
  const elMounts = document.getElementById('tel-mounts');
  const elMountTarget = document.getElementById('tel-mount-target');
  const elHolo = document.getElementById('tel-holo');
  const elProject = document.getElementById('tel-project');

  if (elTelMode) {
    elTelMode.textContent = isMountFocus
      ? 'Mount-Focus'
      : isFreeRoam
      ? 'Free-Roam'
      : 'Scroll-Walk';
  }
  if (elTelScroll) elTelScroll.textContent = `${pct}%`;
  if (elAvatar) elAvatar.textContent = active.id;
  if (elState) elState.textContent = active.state;
  if (elClip) elClip.textContent = active.currentClipName || 'IDLE_DEFAULT';
  if (elSpeed) elSpeed.textContent = `${speed.toFixed(2)} m/s`;
  if (elPos) {
    elPos.textContent = `${active.position.x.toFixed(2)}, ${active.position.y.toFixed(2)}, ${active.position.z.toFixed(2)}`;
  }
  if (elGround) elGround.textContent = String(active.isGrounded);
  if (elMounts) {
    elMounts.textContent = `${mountedCount} / ${sandbox.wallMounts.length} Mounted`;
  }
  if (elMountTarget) {
    if (isMountFocus) {
      elMountTarget.textContent = `Focused: ${sandbox.focusedMount.mountName}`;
    } else if (sandbox.hoveredMount) {
      elMountTarget.textContent = `Hover: ${sandbox.hoveredMount.mountName}`;
    } else if (sandbox.proximityMount) {
      elMountTarget.textContent = `Near: ${sandbox.proximityMount.mountName} (E)`;
    } else if (sandbox.activeHoloProject) {
      elMountTarget.textContent = sandbox.activeHoloProject.mountName;
    } else {
      elMountTarget.textContent = 'None';
    }
  }
  if (elHolo) {
    elHolo.textContent = isMountFocus
      ? `Focused (${sandbox.focusedMount.station.code})`
      : sandbox.activeHoloProject
      ? `Active (${sandbox.activeHoloProject.code})`
      : isFreeRoam
      ? 'Wall-Mounted'
      : 'Standby';
  }
  if (elProject) {
    elProject.textContent = sandbox.activeHoloProject ? sandbox.activeHoloProject.id : 'None';
  }
  const elTelSfx = document.getElementById('tel-sfx');
  if (elTelSfx && sandbox.sfx) {
    elTelSfx.textContent = `FogExp2 + 3 Diffused + Rain + Blur(${sandbox.sfx.floorReflections.blurKernelSize.toFixed(2)}x)`;
  }
  const elTelAudio = document.getElementById('tel-audio');
  if (elTelAudio && sandbox.audio) {
    elTelAudio.textContent = sandbox.audio.muted
      ? 'MUTED'
      : `2D+3D+UI (${Math.round(sandbox.audio.masterGain * 100)}%)`;
  }
  const elTelPods = document.getElementById('tel-pods');
  if (elTelPods) {
    if (sandbox.draggedMathPod) {
      elTelPods.textContent = `Dragging (${sandbox.draggedMathPod.code})`;
    } else if (sandbox.mathPods && sandbox.mathPods.activeGlitchingPodCount > 0) {
      const topGlitchId = sandbox.mathPods.activeGlitchingPodIds[0];
      const podObj = sandbox.mathPods.getPod(topGlitchId);
      const podLabel = podObj ? podObj.code : topGlitchId;
      elTelPods.textContent = `${sandbox.mathPods.activeCount} / ${sandbox.mathPods.count} Active (${podLabel} GLITCH)`;
    } else if (sandbox.mathPods) {
      elTelPods.textContent = `${sandbox.mathPods.activeCount} / ${sandbox.mathPods.count} Active`;
    } else {
      elTelPods.textContent = '6 / 6 Active';
    }
  }
  const elTelWaterColor = document.getElementById('tel-watercolor');
  if (elTelWaterColor && sandbox.waterColor) {
    elTelWaterColor.textContent = `SKYBOX (DIV:${sandbox.waterColor.division} SCALE:${sandbox.waterColor.scale})`;
  }
  const elTelRunning = document.getElementById('tel-running');
  if (elTelRunning && sandbox.runningEffects) {
    elTelRunning.textContent = sandbox.runningEffects.active
      ? `Active (${(sandbox.runningEffects.intensity * 100).toFixed(0)}%, ${sandbox.runningEffects.activeBinaryGlyphCount} bits)`
      : 'Idle';
  }
  const elTelShadows = document.getElementById('tel-shadows');
  if (elTelShadows && sandbox.characterShadows) {
    const s = sandbox.characterShadows.primaryShadow;
    elTelShadows.textContent = s ? `dx:${s.castDirection?.dx ?? 0} dz:${s.castDirection?.dz ?? 0} (${s.dominantLightId ?? 'Moon'})` : 'Active';
  }
  const elTelCables = document.getElementById('tel-cables');
  if (elTelCables && sandbox.overheadCables) {
    elTelCables.textContent = `${sandbox.overheadCables.count} / 20 Active (4 Varieties, minY: ${sandbox.overheadCables.minClearanceY.toFixed(2)}m, maxY: ${sandbox.overheadCables.maxAnchorY.toFixed(2)}m)`;
  }
  const elTelHoloCols = document.getElementById('tel-holo-columns');
  const elHoloStatusLabel = document.getElementById('holo-column-status-label');
  if ((elTelHoloCols || elHoloStatusLabel) && sandbox.hologramColumns) {
    const t = sandbox.hologramColumns.getTelemetry();
    const activeCount = t.activeStateCounts.active + (t.activeStateCounts.agitated || 0);
    if (elTelHoloCols) {
      elTelHoloCols.textContent = sandbox.holoEditMode
        ? `${activeCount} / ${t.totalCount} [EDIT: ${sandbox.selectedHoloColumnId}]`
        : `${activeCount} / ${t.totalCount} Active (${t.staticCount} IMG + ${t.videoCount} VID)`;
    }
    if (elHoloStatusLabel) {
      elHoloStatusLabel.textContent = `Active: ${activeCount}/${t.totalCount}`;
    }
  }
}

function syncHoloEditorHUDInputs() {
  if (typeof document === 'undefined' || !sandbox.hologramColumns) return;
  const col = sandbox.hologramColumns.getColumn(sandbox.selectedHoloColumnId) || sandbox.hologramColumns.columns[0];
  if (!col) return;
  const t = col.getTransformState();

  const elSelect = document.getElementById('holo-column-select');
  if (elSelect && elSelect.value !== col.id) {
    elSelect.value = col.id;
  }
  const elStateSelect = document.getElementById('holo-column-state-select');
  if (elStateSelect) {
    elStateSelect.value = col.lifecycleState;
  }
  const elTintSelect = document.getElementById('holo-column-tint-select');
  if (elTintSelect) {
    const tint = col.params.colorAndLuminance.primaryTintHex;
    for (const [presetKey, presetVal] of Object.entries(HOLO_SPECTRAL_TINT_PRESETS)) {
      if (presetVal.primaryHex.toLowerCase() === tint.toLowerCase()) {
        elTintSelect.value = presetKey;
        break;
      }
    }
  }

  const elDims = document.getElementById('holo-edit-dims-label');
  if (elDims) {
    elDims.textContent = `${t.planeWidthMeters.toFixed(3)}m × ${t.planeHeightMeters.toFixed(3)}m (${t.scaleX.toFixed(2)}x)`;
  }

  const elToggleBtn = document.getElementById('holo-edit-toggle-btn');
  if (elToggleBtn) {
    const modeLabel = sandbox.holoGizmoMode ? sandbox.holoGizmoMode.toUpperCase() : 'MOVE';
    elToggleBtn.textContent = sandbox.holoEditMode
      ? `3D Gizmo: ${modeLabel} (G)`
      : 'Edit 3D Gizmo: OFF (G)';
    elToggleBtn.classList.toggle('secondary', !sandbox.holoEditMode);
  }

  const elMoveBtn = document.getElementById('holo-gizmo-translate-btn');
  const elRotBtn = document.getElementById('holo-gizmo-rotate-btn');
  const elScaleBtn = document.getElementById('holo-gizmo-scale-btn');
  if (elMoveBtn) elMoveBtn.classList.toggle('secondary', sandbox.holoGizmoMode !== 'translate');
  if (elRotBtn) elRotBtn.classList.toggle('secondary', sandbox.holoGizmoMode !== 'rotate');
  if (elScaleBtn) elScaleBtn.classList.toggle('secondary', sandbox.holoGizmoMode !== 'scale');

  const pairs = [
    ['holo-pos-x-slider', 'holo-pos-x-input', t.x.toFixed(2)],
    ['holo-pos-y-slider', 'holo-pos-y-input', t.yRel.toFixed(2)],
    ['holo-pos-z-slider', 'holo-pos-z-input', t.z.toFixed(2)],
    ['holo-rot-yaw-slider', 'holo-rot-yaw-input', t.yawRad.toFixed(2)],
    ['holo-scale-slider', 'holo-scale-input', t.scaleX.toFixed(2)],
  ];
  for (const [sliderId, inputId, valStr] of pairs) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl && document.activeElement !== sEl) sEl.value = valStr;
    if (iEl && document.activeElement !== iEl) iEl.value = valStr;
  }
}

function syncLamppostEditorHUDInputs() {
  if (typeof document === 'undefined' || !sandbox.lamppostLight) return;
  const st = sandbox.lamppostLight.getState();

  const elStatus = document.getElementById('lamppost-status-label');
  if (elStatus) {
    elStatus.textContent = `${st.intensity.toFixed(1)} Int | ${st.angleDeg.toFixed(0)}° Cone`;
  }

  const elToggleBtn = document.getElementById('lamppost-edit-toggle-btn');
  if (elToggleBtn) {
    elToggleBtn.textContent = sandbox.lamppostEditMode
      ? 'Aim Cone Target: ON (L)'
      : 'Aim Cone Target: OFF (L)';
    elToggleBtn.classList.toggle('secondary', !sandbox.lamppostEditMode);
  }

  const pairs = [
    ['lamppost-target-x-slider', 'lamppost-target-x-input', st.targetX.toFixed(2)],
    ['lamppost-target-y-slider', 'lamppost-target-y-input', st.targetY.toFixed(2)],
    ['lamppost-target-z-slider', 'lamppost-target-z-input', st.targetZ.toFixed(2)],
    ['lamppost-intensity-slider', 'lamppost-intensity-input', st.intensity.toFixed(1)],
    ['lamppost-angle-slider', 'lamppost-angle-input', st.angleDeg.toFixed(1)],
    ['lamppost-penumbra-slider', 'lamppost-penumbra-input', st.penumbra.toFixed(2)],
  ];
  for (const [sliderId, inputId, valStr] of pairs) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl && document.activeElement !== sEl) sEl.value = valStr;
    if (iEl && document.activeElement !== iEl) iEl.value = valStr;
  }
}

function stepSimulation(dt) {
  if (!sandbox.ready) return;
  const clampedDt = Math.min(Math.max(dt, 0.0), 0.1);
  holoShaderUniforms.uHoloTime.value += clampedDt;
  updateAlleyAlarmLightFixtures(holoShaderUniforms.uHoloTime.value);
  updateEntranceLamppostLight(holoShaderUniforms.uHoloTime.value);

  if (sandbox.mode === 'scroll') {
    updateScrollWalkLocomotion(clampedDt);
  } else {
    updateFreeRoamCharacterLocomotion(clampedDt);
  }

  // Dynamically open up fog visibility when in 3D Fly Free-Roam
  if (scene.fog) {
    const targetFogDensity = sandbox.freeRoamFlyMode ? 0.0055 : DEPTH_FOG_DENSITY;
    scene.fog.density += (targetFogDensity - scene.fog.density) * Math.min(1.0, 4.0 * clampedDt);
  }

  if (sandbox.characters.hoodie.root.visible) {
    sandbox.characters.hoodie.updateDialogueState(clampedDt);
    sandbox.characters.hoodie.mixer.update(clampedDt);
    sandbox.characters.hoodie.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    sandbox.characters.hoodie.root.updateMatrixWorld(true);
  }
  if (sandbox.characters.tunic.root.visible) {
    sandbox.characters.tunic.updateDialogueState(clampedDt);
    sandbox.characters.tunic.mixer.update(clampedDt);
    sandbox.characters.tunic.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    sandbox.characters.tunic.root.updateMatrixWorld(true);
  }

  const activeChar = sandbox.getActiveCharacter();
  if (activeChar) {
    updateCharacterFootsteps(
      activeChar,
      activeChar._lastFrameStepDist || 0.0,
      activeChar._wasGroundedBeforeStep !== false
    );
  }

  updateWallScreenMounts(clampedDt);
  updateProximityAndHoverWallMounts();
  updateCameraController(clampedDt);
  updateHolographicPopupUI();
  updateSFXAndAudioSubsystems(clampedDt, holoShaderUniforms.uHoloTime.value);
  if (sandbox.mathPods) {
    updateMathPodsCorridorLOD();
    if (sandbox.mathPods.rootGroup.visible) {
      sandbox.mathPods.update(clampedDt, holoShaderUniforms.uHoloTime.value);
    }
  }
  if (sandbox.waterColor) {
    sandbox.waterColor.update(clampedDt, holoShaderUniforms.uHoloTime.value);
  }
  if (sandbox.runningEffects) {
    sandbox.runningEffects.update(clampedDt, holoShaderUniforms.uHoloTime.value, activeChar, sandbox.mode);
  }
  if (sandbox.characterShadows) {
    sandbox.characterShadows.update(clampedDt, holoShaderUniforms.uHoloTime.value, sandbox);
  }
  if (sandbox.overheadCables) {
    sandbox.overheadCables.update(clampedDt, holoShaderUniforms.uHoloTime.value);
  }
  if (sandbox.hologramColumns) {
    sandbox.hologramColumns.update(clampedDt, holoShaderUniforms.uHoloTime.value, activeChar, camera);
  }
  updateTelemetryHUD();
  renderer.render(scene, camera);
}

// ============================================================================
// DOM & Input Event Listeners
// ============================================================================
let lastHovered3DRegion = null;

function bindInputListeners() {
  window.addEventListener(
    'scroll',
    () => {
      if (suppressScrollEventSync || !sandbox.ready) return;
      if (sandbox.mode === 'scroll') {
        sandbox.targetScrollProgress = getWindowScrollFraction();
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    if (!sandbox.ready) return;
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') {
      return;
    }
    if (sandbox.audio) {
      sandbox.audio.unlock();
    }

    if (e.code === 'KeyG') {
      e.preventDefault();
      sandbox.toggleHoloEditMode();
      return;
    }

    if (e.code === 'KeyL') {
      e.preventDefault();
      sandbox.toggleLamppostEditMode();
      return;
    }

    // Rotate selected / hovered hologram via ',' / '<' (Left) and '.' / '>' (Right)
    const isRotateLeftKey = e.code === 'Comma' || e.key === '<' || e.key === ',';
    const isRotateRightKey = e.code === 'Period' || e.key === '>' || e.key === '.';
    if ((isRotateLeftKey || isRotateRightKey) && sandbox.hologramColumns) {
      e.preventDefault();
      let targetColId = sandbox.hologramColumns.activeDragColumnId || null;
      if (!targetColId && pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0 && pointerNDC.y >= -1.0 && pointerNDC.y <= 1.0) {
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const holoHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        if (holoHits.length > 0 && holoHits[0].object.userData.holoColumnId) {
          targetColId = holoHits[0].object.userData.holoColumnId;
          sandbox.selectHologramColumnForEdit(targetColId);
        }
      }
      if (!targetColId) {
        targetColId = sandbox.selectedHoloColumnId;
      }
      const cur = sandbox.hologramColumns.getColumnTransform(targetColId);
      if (cur) {
        const stepRad = isRotateRightKey ? 0.08 : -0.08;
        let nextYaw = cur.yawRad + stepRad;
        if (nextYaw > Math.PI) nextYaw -= Math.PI * 2;
        if (nextYaw < -Math.PI) nextYaw += Math.PI * 2;
        sandbox.updateSelectedHoloTransform({ yawRad: Number(nextYaw.toFixed(3)) }, true);
      }
      return;
    }

    // Resize selected / hovered hologram via Shift + '+' / '=' or '-' / '_' (or '[' / ']')
    const isScaleUpKey =
      e.key === '+' ||
      e.key === '=' ||
      e.code === 'Equal' ||
      e.code === 'NumpadAdd' ||
      e.code === 'BracketRight';
    const isScaleDownKey =
      e.key === '-' ||
      e.key === '_' ||
      e.code === 'Minus' ||
      e.code === 'NumpadSubtract' ||
      e.code === 'BracketLeft';

    if ((isScaleUpKey || isScaleDownKey) && sandbox.hologramColumns) {
      e.preventDefault();
      // If hovering over a hologram in the 3D scene, select it automatically before scaling
      let targetColId = sandbox.hologramColumns.activeDragColumnId || null;
      if (!targetColId && pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0 && pointerNDC.y >= -1.0 && pointerNDC.y <= 1.0) {
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const holoHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        if (holoHits.length > 0 && holoHits[0].object.userData.holoColumnId) {
          targetColId = holoHits[0].object.userData.holoColumnId;
          sandbox.selectHologramColumnForEdit(targetColId);
        }
      }
      if (!targetColId) {
        targetColId = sandbox.selectedHoloColumnId;
      }
      const cur = sandbox.hologramColumns.getColumnTransform(targetColId);
      if (cur) {
        const step = isScaleUpKey ? 0.1 : -0.1;
        const nextScale = Math.max(0.15, Math.min(8.0, Number((cur.scale + step).toFixed(2))));
        sandbox.updateSelectedHoloTransform({ scale: nextScale }, true);
      }
      return;
    }

    if (e.code === 'Backquote' || e.code === 'KeyQ') {
      if (sandbox.radialMenu) {
        e.preventDefault();
        sandbox.radialMenu.toggle();
        return;
      }
    }

    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        sandbox.radialMenu.cancelDeadzone();
        return;
      }
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const total = sandbox.radialMenu.getMenuItems().length;
        const cur = sandbox.radialMenu.getActiveIndex();
        const next = cur === null ? 0 : (cur + 1) % total;
        sandbox.radialMenu.setActiveIndex(next);
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const total = sandbox.radialMenu.getMenuItems().length;
        const cur = sandbox.radialMenu.getActiveIndex();
        const prev = cur === null ? total - 1 : (cur - 1 + total) % total;
        sandbox.radialMenu.setActiveIndex(prev);
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        const cur = sandbox.radialMenu.getActiveIndex();
        if (cur !== null) {
          sandbox.radialMenu.selectIndex(cur);
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.code === 'Tab') {
      e.preventDefault();
      sandbox.swapCharacter();
      return;
    }

    if (e.code === 'Escape') {
      if (sandbox.mode === 'mount-focus') {
        e.preventDefault();
        sandbox.exitMountFocusMode();
      }
      return;
    }

    if (e.code === 'KeyM') {
      e.preventDefault();
      if (sandbox.audio) {
        sandbox.audio.toggleMute();
      }
      return;
    }

    if (e.code === 'KeyR') {
      e.preventDefault();
      sandbox.returnToScrollMode();
      return;
    }

    if (e.code === 'KeyH') {
      e.preventDefault();
      sandbox.toggleHolographicShader();
      return;
    }

    if (e.code === 'KeyF') {
      e.preventDefault();
      sandbox.toggleFreeRoamFlyMode();
      return;
    }

    if (e.code === 'KeyP') {
      e.preventDefault();
      if (sandbox.replaySprayPaintIntro) {
        sandbox.replaySprayPaintIntro();
      }
      return;
    }

    if (e.code === 'KeyT') {
      e.preventDefault();
      sandbox.toggleDialogue();
      return;
    }

    if (e.code === 'KeyE') {
      if (sandbox.freeRoamFlyMode) {
        e.preventDefault();
        keysPressed.KeyE = true;
        return;
      }
      if (sandbox.mode === 'mount-focus') {
        e.preventDefault();
        sandbox.exitMountFocusMode();
        return;
      }
      if (sandbox.mode === 'freeroam') {
        e.preventDefault();
        sandbox.interactNearestWallMount();
        return;
      }
    }

    if (e.code in HOTKEY_CLIPS) {
      e.preventDefault();
      sandbox.playAnimation(HOTKEY_CLIPS[e.code]);
      return;
    }

    if (e.code in keysPressed) {
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        e.preventDefault();
      }

      const isMoveKey =
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight';

      // Pressing any movement key exits Mount Focus Mode or hands off Scroll-Walk Mode to Free-Roam Mode (§5.2 & §5.3)
      if (sandbox.mode === 'mount-focus' && isMoveKey) {
        sandbox.exitMountFocusMode();
      } else if (sandbox.mode === 'scroll' && isMoveKey) {
        enterFreeRoamMode();
      }

      if (sandbox.mode === 'freeroam') {
        keysPressed[e.code] = true;
        if (e.code === 'Space') {
          jumpRequested = true;
        }
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code in keysPressed) {
      keysPressed[e.code] = false;
    }
  });

  window.addEventListener('blur', () => {
    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    cameraOrbit.isDragging = false;
    if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
      sandbox.mathPods.endDrag();
      sandbox.draggedMathPod = null;
    }
  });

  let podPointerDownState = null;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (sandbox.audio) {
      sandbox.audio.unlock();
    }
    if (sandbox.transformControls && (sandbox.transformControls.dragging || sandbox.transformControls.axis !== null)) {
      return;
    }
    if (sandbox.ready && e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
      }
      pointerRaycaster.setFromCamera(pointerNDC, camera);

      // Click-and-drag the Lamppost Cone Landing Target directly in the 3D scene
      if (sandbox.lamppostLight && sandbox.lamppostLight.targetMarkerGroup && sandbox.lamppostLight.targetMarkerGroup.visible) {
        const lampHits = pointerRaycaster.intersectObjects(sandbox.lamppostLight.raycastTargets, false);
        if (lampHits.length > 0 && (!sandbox.transformControls || sandbox.transformControls.axis === null)) {
          sandbox.lamppostLight.beginTargetDrag(pointerRaycaster.ray, camera);
          return;
        }
      }

      // Click-and-drag ANY of the 17 media columns directly in the 3D scene
      if (sandbox.hologramColumns) {
        const holoHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        if (holoHits.length > 0 && holoHits[0].object.userData.holoColumnId) {
          const hitId = holoHits[0].object.userData.holoColumnId;
          sandbox.selectHologramColumnForEdit(hitId);
          // Start direct coplanar drag unless the 3D gizmo is currently in 'rotate' or 'scale' mode
          const isGizmoRotateOrScale = sandbox.holoEditMode && (sandbox.holoGizmoMode === 'rotate' || sandbox.holoGizmoMode === 'scale');
          if (!isGizmoRotateOrScale && (!sandbox.transformControls || sandbox.transformControls.axis === null)) {
            sandbox.hologramColumns.beginDrag(hitId, pointerRaycaster.ray, camera);
          }
          if (sandbox.audio) {
            sandbox.audio.trigger('onUpdate', { target: hitId, source: 'holo-column-grab' });
          }
          return;
        }
      }

      if (sandbox.mathPods) {
        const podHits = pointerRaycaster.intersectObjects(sandbox.mathPods.raycastTargets, false);
        if (podHits.length > 0 && podHits[0].object.userData.podId) {
          const podId = podHits[0].object.userData.podId;
          const pod = sandbox.mathPods.beginDrag(podId, pointerRaycaster.ray, camera);
          sandbox.draggedMathPod = pod;
          podPointerDownState = { podId, clientX: e.clientX, clientY: e.clientY };
          if (sandbox.audio) {
            sandbox.audio.trigger('onUpdate', { target: pod.id, source: 'math-pod-grab' });
          }
          return;
        }
      }
    }
    if (sandbox.mode !== 'freeroam') return;
    if (e.button === 0 || e.button === 2) {
      cameraOrbit.isDragging = true;
      cameraOrbit.downClientX = e.clientX;
      cameraOrbit.downClientY = e.clientY;
      cameraOrbit.maxDragTravel = 0;
      cameraOrbit.lastPointerX = e.clientX;
      cameraOrbit.lastPointerY = e.clientY;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (sandbox.transformControls && sandbox.transformControls.dragging) {
      cameraOrbit.isDragging = false;
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
    }

    if (sandbox.ready && sandbox.lamppostLight && sandbox.lamppostLight.isDraggingTarget) {
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      sandbox.lamppostLight.updateTargetDrag(pointerRaycaster.ray);
      syncLamppostEditorHUDInputs();
      return;
    }

    if (sandbox.ready && sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId) {
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      sandbox.hologramColumns.updateDrag(pointerRaycaster.ray);
      syncHoloEditorHUDInputs();
      return;
    }

    if (sandbox.ready && sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      sandbox.mathPods.updateDrag(pointerRaycaster.ray);
      return;
    }

    // Check pointer intersection with 3D wall mounts for onHover telemetry audio (SFX.md §4.3)
    if (sandbox.ready && !cameraOrbit.isDragging && e.target === canvas) {
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      let hoveredHoloColumn = false;
      if (sandbox.hologramColumns) {
        const holoHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        hoveredHoloColumn = holoHits.length > 0;
      }

      if (sandbox.audio) {
        const hits = pointerRaycaster.intersectObjects(sandbox.wallMountRaycastTargets, false);
        if (hits.length > 0 && hits[0].object.userData.mountName) {
          const regionKey = hits[0].object.userData.mountName;
          if (regionKey !== lastHovered3DRegion) {
            lastHovered3DRegion = regionKey;
            sandbox.audio.trigger('onHover', { target: regionKey, source: '3d-mount' });
          }
        } else {
          lastHovered3DRegion = null;
        }
      }

      if (sandbox.mathPods) {
        const podHits = pointerRaycaster.intersectObjects(sandbox.mathPods.raycastTargets, false);
        if (podHits.length > 0 && podHits[0].object.userData.podId) {
          sandbox.hoveredMathPod = sandbox.mathPods.getPod(podHits[0].object.userData.podId);
        } else {
          sandbox.hoveredMathPod = null;
        }
      }

      document.body.classList.toggle(
        'mount-pointer-hover',
        Boolean(sandbox.hoveredMount || sandbox.hoveredMathPod || hoveredHoloColumn)
      );
    }

    if (!cameraOrbit.isDragging || sandbox.mode !== 'freeroam') return;

    const travelFromDown = Math.hypot(
      e.clientX - cameraOrbit.downClientX,
      e.clientY - cameraOrbit.downClientY
    );
    if (travelFromDown > cameraOrbit.maxDragTravel) {
      cameraOrbit.maxDragTravel = travelFromDown;
    }

    const dx = e.clientX - cameraOrbit.lastPointerX;
    const dy = e.clientY - cameraOrbit.lastPointerY;
    cameraOrbit.lastPointerX = e.clientX;
    cameraOrbit.lastPointerY = e.clientY;

    cameraOrbit.yaw -= dx * 0.0065;
    cameraOrbit.pitch = Math.max(
      CAM_MIN_PITCH,
      Math.min(CAM_MAX_PITCH, cameraOrbit.pitch + dy * 0.0055)
    );
  });

  window.addEventListener('pointerup', (e) => {
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (sandbox.lamppostLight && sandbox.lamppostLight.isDraggingTarget) {
      sandbox.lamppostLight.endTargetDrag();
      syncLamppostEditorHUDInputs();
      return;
    }
    if (sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId) {
      const releasedCol = sandbox.hologramColumns.endDrag();
      syncHoloEditorHUDInputs();
      if (sandbox.audio && releasedCol) {
        sandbox.audio.trigger('onHover', { target: releasedCol.id, source: 'holo-column-release' });
      }
      return;
    }
    if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
      const releasedPod = sandbox.mathPods.endDrag();
      sandbox.draggedMathPod = null;
      if (podPointerDownState && podPointerDownState.podId) {
        const dx = e.clientX - podPointerDownState.clientX;
        const dy = e.clientY - podPointerDownState.clientY;
        if (Math.hypot(dx, dy) < 4 && sandbox.mathPodPopups) {
          sandbox.mathPodPopups.togglePinForPod(podPointerDownState.podId);
        }
        podPointerDownState = null;
      }
      if (sandbox.audio && releasedPod) {
        sandbox.audio.trigger('onHover', { target: releasedPod.id, source: 'math-pod-release' });
      }
      return;
    }

    const wasDragging = cameraOrbit.isDragging;
    const dragDistance = cameraOrbit.maxDragTravel;
    cameraOrbit.isDragging = false;

    // Distinguish clean click on 3D wall mount from camera orbit drag (§4.2 & §6.1)
    if (
      wasDragging &&
      sandbox.mode === 'freeroam' &&
      e.button === 0 &&
      dragDistance <= CLICK_MAX_DRAG_PIXELS &&
      e.target === canvas
    ) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const hits = pointerRaycaster.intersectObjects(sandbox.wallMountRaycastTargets, false);
        if (hits.length > 0 && hits[0].object.userData.mountName) {
          const hitMount = sandbox.wallMountsByName[hits[0].object.userData.mountName];
          if (hitMount && hitMount.isMounted) {
            sandbox.focusWallMount(hitMount.mountName);
          }
        }
      }
    }
  });

  window.addEventListener(
    'wheel',
    (e) => {
      if (!sandbox.ready) return;
      if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
        return;
      }
      if (e.target && e.target.closest && e.target.closest('#sandbox-hud')) {
        return;
      }

      // Shift + Scroll (or Scroll while dragging a hologram / in Edit Mode over a hologram) resizes the hologram directly in-scene!
      if (sandbox.hologramColumns && (e.shiftKey || sandbox.hologramColumns.activeDragColumnId || sandbox.holoEditMode)) {
        let targetColId = sandbox.hologramColumns.activeDragColumnId || (e.shiftKey ? sandbox.selectedHoloColumnId : null);
        if (!targetColId) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
            pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
            pointerRaycaster.setFromCamera(pointerNDC, camera);
            const holoHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
            if (holoHits.length > 0 && holoHits[0].object.userData.holoColumnId) {
              targetColId = holoHits[0].object.userData.holoColumnId;
            }
          }
        }
        if (targetColId) {
          e.preventDefault();
          sandbox.selectHologramColumnForEdit(targetColId);
          const cur = sandbox.hologramColumns.getColumnTransform(targetColId);
          if (cur) {
            const nextScale = Math.max(0.2, Math.min(5.0, cur.scale - e.deltaY * 0.0015));
            sandbox.updateSelectedHoloTransform({ scale: Number(nextScale.toFixed(3)) }, true);
          }
          return;
        }
      }

      if (sandbox.mode === 'scroll') {
        e.preventDefault();
        const maxScroll = getMaxWindowScroll();
        if (maxScroll > 1) {
          window.scrollBy({ top: e.deltaY, left: 0, behavior: 'instant' });
          sandbox.targetScrollProgress = getWindowScrollFraction();
        } else {
          sandbox.targetScrollProgress = Math.max(
            0.0,
            Math.min(1.0, sandbox.targetScrollProgress + e.deltaY * 0.0004)
          );
        }
      } else {
        e.preventDefault();
        if (sandbox.mode === 'freeroam') {
          cameraOrbit.desiredDistance = Math.max(
            CAM_MIN_DISTANCE,
            Math.min(CAM_MAX_DISTANCE, cameraOrbit.desiredDistance + e.deltaY * 0.0025)
          );
        }
      }
    },
    { passive: false }
  );

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (sandbox.mode === 'scroll') {
      syncWindowScrollToFraction(sandbox.targetScrollProgress);
    }
    if (sandbox.ready) {
      updateCameraController(0.0);
      renderer.render(scene, camera);
    }
  });

  // Interactive Holographic Terminal Sub-Region Hover & Tether Bridge Listeners (SFX.md §4.3)
  document.querySelectorAll('[data-holo-interactive]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      if (sandbox.audio) {
        sandbox.audio.trigger('onHover', {
          target: el.getAttribute('data-holo-interactive') || el.id || 'holo-subregion',
          source: 'dom-terminal',
        });
      }
    });
  });

  const tetherBridgeEl = document.getElementById('holo-tether-bridge');
  if (tetherBridgeEl) {
    tetherBridgeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { source: 'inter-module-tether-bridge' });
        sandbox.audio.trigger('onDataStream', { source: 'inter-module-tether-bridge' });
      }
    });
  }

  // Audio & Surface Optics HUD Controls (SFX.md §3.2 & §4.1)
  const audioMuteBtn = document.getElementById('audio-mute-btn');
  if (audioMuteBtn) {
    audioMuteBtn.addEventListener('click', () => {
      if (sandbox.audio) {
        sandbox.audio.unlock();
        sandbox.audio.toggleMute();
      }
    });
  }

  const audioGainSlider = document.getElementById('audio-gain-slider');
  if (audioGainSlider) {
    audioGainSlider.addEventListener('input', () => {
      if (sandbox.audio) {
        sandbox.audio.unlock();
        sandbox.audio.setMasterGain(Number(audioGainSlider.value));
      }
    });
  }

  const reflectionBlurSlider = document.getElementById('reflection-blur-slider');
  if (reflectionBlurSlider) {
    reflectionBlurSlider.addEventListener('input', () => {
      if (sandbox.sfx && sandbox.sfx.floorReflections) {
        sandbox.sfx.floorReflections.setBlurKernelSize(Number(reflectionBlurSlider.value));
        updateTelemetryHUD();
        renderer.render(scene, camera);
      }
    });
  }

  // UI Controls
  const toggleRadialMenuBtn = document.getElementById('toggle-radial-menu-btn');
  if (toggleRadialMenuBtn) {
    toggleRadialMenuBtn.addEventListener('click', () => {
      if (sandbox.radialMenu) {
        sandbox.radialMenu.toggle();
      }
    });
  }

  canvas.addEventListener('contextmenu', (e) => {
    if (cameraOrbit.maxDragTravel <= CLICK_MAX_DRAG_PIXELS && sandbox.radialMenu) {
      e.preventDefault();
      sandbox.radialMenu.toggle();
    }
  });

  const exitFocusBtn = document.getElementById('exit-mount-focus-btn');
  if (exitFocusBtn) {
    exitFocusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.exitMountFocusMode();
    });
  }

  const prevMountBtn = document.getElementById('holo-prev-mount-btn');
  if (prevMountBtn) {
    prevMountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { direction: 'prev' });
      }
      if (sandbox.mode === 'mount-focus' || sandbox.mode === 'freeroam') {
        sandbox.stepFocusedWallMount(-1);
      } else if (sandbox.activeHoloProject) {
        const prevIdx = Math.max(1, sandbox.activeHoloProject.index - 1);
        sandbox.scrollToProjectStation(prevIdx);
      }
    });
  }

  const nextMountBtn = document.getElementById('holo-next-mount-btn');
  if (nextMountBtn) {
    nextMountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { direction: 'next' });
      }
      if (sandbox.mode === 'mount-focus' || sandbox.mode === 'freeroam') {
        sandbox.stepFocusedWallMount(1);
      } else if (sandbox.activeHoloProject) {
        const nextIdx = Math.min(HOLO_PROJECT_STATIONS.length, sandbox.activeHoloProject.index + 1);
        sandbox.scrollToProjectStation(nextIdx);
      }
    });
  }

  const proximityPromptEl = document.getElementById('mount-proximity-prompt');
  if (proximityPromptEl) {
    proximityPromptEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetMountName = proximityPromptEl.dataset.mountName;
      if (targetMountName) {
        sandbox.focusWallMount(targetMountName);
      } else {
        sandbox.interactNearestWallMount();
      }
    });
  }

  // 3D Fly / No-Clip Free-Roam HUD Control (Spec 032 §5.2)
  const flyFreeRoamBtn = document.getElementById('toggle-fly-freeroam-btn');
  if (flyFreeRoamBtn) {
    flyFreeRoamBtn.addEventListener('click', () => {
      sandbox.toggleFreeRoamFlyMode();
    });
  }

  const replaySprayBtn = document.getElementById('replay-spray-intro-btn');
  if (replaySprayBtn) {
    replaySprayBtn.addEventListener('click', () => {
      if (sandbox.replaySprayPaintIntro) {
        sandbox.replaySprayPaintIntro();
      }
    });
  }

  const skipSprayBtn = document.getElementById('spray-loader-skip-btn');
  if (skipSprayBtn) {
    skipSprayBtn.addEventListener('click', () => {
      if (sandbox.skipSprayPaintIntro) {
        sandbox.skipSprayPaintIntro();
      }
    });
  }

  const returnScrollBtn = document.getElementById('return-scroll-btn');
  if (returnScrollBtn) {
    returnScrollBtn.addEventListener('click', () => {
      sandbox.returnToScrollMode();
    });
  }

  const resetEntranceBtn = document.getElementById('reset-entrance-btn');
  if (resetEntranceBtn) {
    resetEntranceBtn.addEventListener('click', () => {
      sandbox.resetToEntrance();
    });
  }

  const swapBtn = document.getElementById('swap-character-btn');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      sandbox.swapCharacter();
    });
  }

  const soloBtn = document.getElementById('solo-character-btn');
  if (soloBtn) {
    soloBtn.addEventListener('click', () => {
      sandbox.toggleSoloCharacterMode();
    });
  }

  const variantSelectEl = document.getElementById('glb-variant-select');
  if (variantSelectEl) {
    variantSelectEl.addEventListener('change', () => {
      if (variantSelectEl.value) {
        sandbox.selectCharacterVariant(variantSelectEl.value);
      }
    });
  }

  const holoShaderBtn = document.getElementById('toggle-holo-shader-btn');
  if (holoShaderBtn) {
    holoShaderBtn.addEventListener('click', () => {
      sandbox.toggleHolographicShader();
    });
  }

  const selectEl = document.getElementById('animation-select');
  const playBtn = document.getElementById('play-anim-btn');
  const toggleDialogueBtn = document.getElementById('toggle-dialogue-btn');
  if (selectEl) {
    selectEl.addEventListener('change', () => {
      if (selectEl.value) {
        sandbox.playAnimation(selectEl.value);
      }
    });
  }
  if (playBtn && selectEl) {
    playBtn.addEventListener('click', () => {
      if (selectEl.value) {
        sandbox.playAnimation(selectEl.value);
      }
    });
  }
  if (toggleDialogueBtn) {
    toggleDialogueBtn.addEventListener('click', () => {
      sandbox.toggleDialogue();
    });
  }

  const emoteGrid = document.getElementById('quick-emote-grid');
  if (emoteGrid) {
    emoteGrid.querySelectorAll('button[data-clip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const clipName = btn.getAttribute('data-clip');
        if (clipName) {
          sandbox.playAnimation(clipName);
        }
      });
    });
  }

  const elHoloColSelect = document.getElementById('holo-column-select');
  const elHoloStateSelect = document.getElementById('holo-column-state-select');
  const elHoloTintSelect = document.getElementById('holo-column-tint-select');

  if (elHoloColSelect) {
    elHoloColSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      sandbox.selectHologramColumnForEdit(selectedId);
    });
  }

  if (elHoloStateSelect) {
    elHoloStateSelect.addEventListener('change', (e) => {
      const selectedState = e.target.value;
      const colId = elHoloColSelect ? elHoloColSelect.value : sandbox.selectedHoloColumnId;
      if (sandbox.hologramColumns) {
        sandbox.hologramColumns.setColumnState(colId, selectedState);
      }
    });
  }

  if (elHoloTintSelect) {
    elHoloTintSelect.addEventListener('change', (e) => {
      const tintKey = e.target.value;
      const preset = HOLO_SPECTRAL_TINT_PRESETS[tintKey];
      if (preset && sandbox.hologramColumns) {
        const colId = elHoloColSelect ? elHoloColSelect.value : sandbox.selectedHoloColumnId;
        sandbox.hologramColumns.setParams(colId, {
          colorAndLuminance: {
            primaryTintHex: preset.primaryHex,
            secondaryTintHex: preset.secondaryHex,
          }
        });
      }
    });
  }

  const elHoloEditToggleBtn = document.getElementById('holo-edit-toggle-btn');
  if (elHoloEditToggleBtn) {
    elHoloEditToggleBtn.addEventListener('click', () => {
      sandbox.toggleHoloEditMode();
    });
  }

  const elHoloFocusBtn = document.getElementById('holo-focus-selected-btn');
  if (elHoloFocusBtn) {
    elHoloFocusBtn.addEventListener('click', () => {
      sandbox.focusSelectedHologramColumn();
    });
  }

  const elGizmoTranslateBtn = document.getElementById('holo-gizmo-translate-btn');
  if (elGizmoTranslateBtn) {
    elGizmoTranslateBtn.addEventListener('click', () => {
      if (!sandbox.holoEditMode) sandbox.toggleHoloEditMode(true);
      sandbox.setHoloGizmoMode('translate');
    });
  }

  const elGizmoRotateBtn = document.getElementById('holo-gizmo-rotate-btn');
  if (elGizmoRotateBtn) {
    elGizmoRotateBtn.addEventListener('click', () => {
      if (!sandbox.holoEditMode) sandbox.toggleHoloEditMode(true);
      sandbox.setHoloGizmoMode('rotate');
    });
  }

  const elGizmoScaleBtn = document.getElementById('holo-gizmo-scale-btn');
  if (elGizmoScaleBtn) {
    elGizmoScaleBtn.addEventListener('click', () => {
      if (!sandbox.holoEditMode) sandbox.toggleHoloEditMode(true);
      sandbox.setHoloGizmoMode('scale');
    });
  }

  const elSnapLeftBtn = document.getElementById('holo-snap-left-btn');
  if (elSnapLeftBtn) {
    elSnapLeftBtn.addEventListener('click', () => {
      sandbox.snapSelectedHoloToWall('L');
    });
  }

  const elSnapRightBtn = document.getElementById('holo-snap-right-btn');
  if (elSnapRightBtn) {
    elSnapRightBtn.addEventListener('click', () => {
      sandbox.snapSelectedHoloToWall('R');
    });
  }

  function bindTransformControlPair(sliderId, inputId, propKey) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl) {
      sEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val)) {
          if (iEl) iEl.value = val.toFixed(2);
          sandbox.updateSelectedHoloTransform({ [propKey]: val }, true);
        }
      });
    }
    if (iEl) {
      iEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val)) {
          if (sEl) sEl.value = String(val);
          sandbox.updateSelectedHoloTransform({ [propKey]: val }, true);
        }
      });
    }
  }

  bindTransformControlPair('holo-pos-x-slider', 'holo-pos-x-input', 'x');
  bindTransformControlPair('holo-pos-y-slider', 'holo-pos-y-input', 'yRel');
  bindTransformControlPair('holo-pos-z-slider', 'holo-pos-z-input', 'z');
  bindTransformControlPair('holo-rot-yaw-slider', 'holo-rot-yaw-input', 'yawRad');
  bindTransformControlPair('holo-scale-slider', 'holo-scale-input', 'scale');

  const elYawUpBtn = document.getElementById('holo-yaw-up-btn');
  if (elYawUpBtn) {
    elYawUpBtn.addEventListener('click', () => {
      const cur = sandbox.hologramColumns ? sandbox.hologramColumns.getColumnTransform(sandbox.selectedHoloColumnId) : null;
      if (cur) {
        let nextYaw = cur.yawRad + 0.08;
        if (nextYaw > Math.PI) nextYaw -= Math.PI * 2;
        sandbox.updateSelectedHoloTransform({ yawRad: Number(nextYaw.toFixed(2)) }, true);
      }
    });
  }

  const elYawDownBtn = document.getElementById('holo-yaw-down-btn');
  if (elYawDownBtn) {
    elYawDownBtn.addEventListener('click', () => {
      const cur = sandbox.hologramColumns ? sandbox.hologramColumns.getColumnTransform(sandbox.selectedHoloColumnId) : null;
      if (cur) {
        let nextYaw = cur.yawRad - 0.08;
        if (nextYaw < -Math.PI) nextYaw += Math.PI * 2;
        sandbox.updateSelectedHoloTransform({ yawRad: Number(nextYaw.toFixed(2)) }, true);
      }
    });
  }

  const elScaleUpBtn = document.getElementById('holo-scale-up-btn');
  if (elScaleUpBtn) {
    elScaleUpBtn.addEventListener('click', () => {
      const cur = sandbox.hologramColumns ? sandbox.hologramColumns.getColumnTransform(sandbox.selectedHoloColumnId) : null;
      if (cur) {
        const nextScale = Math.max(0.15, Math.min(8.0, Number((cur.scale + 0.1).toFixed(2))));
        sandbox.updateSelectedHoloTransform({ scale: nextScale }, true);
      }
    });
  }

  const elScaleDownBtn = document.getElementById('holo-scale-down-btn');
  if (elScaleDownBtn) {
    elScaleDownBtn.addEventListener('click', () => {
      const cur = sandbox.hologramColumns ? sandbox.hologramColumns.getColumnTransform(sandbox.selectedHoloColumnId) : null;
      if (cur) {
        const nextScale = Math.max(0.15, Math.min(8.0, Number((cur.scale - 0.1).toFixed(2))));
        sandbox.updateSelectedHoloTransform({ scale: nextScale }, true);
      }
    });
  }

  const elResetSelectedBtn = document.getElementById('holo-reset-selected-btn');
  if (elResetSelectedBtn) {
    elResetSelectedBtn.addEventListener('click', () => {
      sandbox.resetSelectedHoloTransform();
    });
  }

  const elResetAllBtn = document.getElementById('holo-reset-all-btn');
  if (elResetAllBtn) {
    elResetAllBtn.addEventListener('click', () => {
      sandbox.resetAllHoloTransforms();
    });
  }

  const elCopyJsonBtn = document.getElementById('holo-copy-json-btn');
  if (elCopyJsonBtn) {
    elCopyJsonBtn.addEventListener('click', async () => {
      const jsonStr = sandbox.exportHoloTransformsJSON();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        }
        const origText = elCopyJsonBtn.textContent;
        elCopyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
          elCopyJsonBtn.textContent = origText;
        }, 1400);
      } catch (err) {
        console.log('Hologram Column Manifest JSON:\n', jsonStr);
      }
    });
  }

  // Lamppost Cone Light Editor HUD bindings
  const elLamppostEditToggleBtn = document.getElementById('lamppost-edit-toggle-btn');
  if (elLamppostEditToggleBtn) {
    elLamppostEditToggleBtn.addEventListener('click', () => {
      sandbox.toggleLamppostEditMode();
    });
  }

  const elLamppostFocusBtn = document.getElementById('lamppost-focus-btn');
  if (elLamppostFocusBtn) {
    elLamppostFocusBtn.addEventListener('click', () => {
      sandbox.focusLamppostConeLight();
    });
  }

  function bindLamppostControlPair(sliderId, inputId, propKey, decimals = 2) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl) {
      sEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val)) {
          if (iEl) iEl.value = val.toFixed(decimals);
          sandbox.updateLamppostLightState({ [propKey]: val }, true);
        }
      });
    }
    if (iEl) {
      iEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val)) {
          if (sEl) sEl.value = String(val);
          sandbox.updateLamppostLightState({ [propKey]: val }, true);
        }
      });
    }
  }

  bindLamppostControlPair('lamppost-target-x-slider', 'lamppost-target-x-input', 'targetX', 2);
  bindLamppostControlPair('lamppost-target-y-slider', 'lamppost-target-y-input', 'targetY', 2);
  bindLamppostControlPair('lamppost-target-z-slider', 'lamppost-target-z-input', 'targetZ', 2);
  bindLamppostControlPair('lamppost-intensity-slider', 'lamppost-intensity-input', 'intensity', 1);
  bindLamppostControlPair('lamppost-angle-slider', 'lamppost-angle-input', 'angleDeg', 1);
  bindLamppostControlPair('lamppost-penumbra-slider', 'lamppost-penumbra-input', 'penumbra', 2);

  const elLamppostIntUpBtn = document.getElementById('lamppost-intensity-up-btn');
  if (elLamppostIntUpBtn) {
    elLamppostIntUpBtn.addEventListener('click', () => {
      const st = sandbox.lamppostLight ? sandbox.lamppostLight.getState() : null;
      if (st) {
        sandbox.updateLamppostLightState({ intensity: Math.min(80.0, Number((st.intensity + 2.0).toFixed(1))) }, true);
      }
    });
  }

  const elLamppostIntDownBtn = document.getElementById('lamppost-intensity-down-btn');
  if (elLamppostIntDownBtn) {
    elLamppostIntDownBtn.addEventListener('click', () => {
      const st = sandbox.lamppostLight ? sandbox.lamppostLight.getState() : null;
      if (st) {
        sandbox.updateLamppostLightState({ intensity: Math.max(0.0, Number((st.intensity - 2.0).toFixed(1))) }, true);
      }
    });
  }

  const elLamppostResetBtn = document.getElementById('lamppost-reset-btn');
  if (elLamppostResetBtn) {
    elLamppostResetBtn.addEventListener('click', () => {
      sandbox.resetLamppostLightToDefault();
    });
  }

  const elLamppostCopyJsonBtn = document.getElementById('lamppost-copy-json-btn');
  if (elLamppostCopyJsonBtn) {
    elLamppostCopyJsonBtn.addEventListener('click', async () => {
      const jsonStr = sandbox.exportLamppostLightJSON();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        }
        const origText = elLamppostCopyJsonBtn.textContent;
        elLamppostCopyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
          elLamppostCopyJsonBtn.textContent = origText;
        }, 1400);
      } catch (err) {
        console.log('Lamppost Cone Light JSON:\n', jsonStr);
      }
    });
  }
}

// ============================================================================
// Asset Ingestion & Scene Staging
// ============================================================================
function loadGLB(loader, url, onAssetDone = null) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        if (typeof onAssetDone === 'function') {
          onAssetDone();
        }
        resolve(gltf);
      },
      undefined,
      (err) => reject(new Error(`Failed to load GLB asset '${url}': ${err?.message || err}`))
    );
  });
}

function initSprayPaintLoadingScreen() {
  if (typeof document === 'undefined') return null;
  const sprayCanvas = document.getElementById('spray-paint-loader-canvas');
  const overlayEl = document.getElementById('spray-paint-loader-overlay');
  const stageLabelEl = document.getElementById('spray-loader-stage-label');
  const pctLabelEl = document.getElementById('spray-loader-pct-label');
  const telSprayEl = document.getElementById('tel-spray-loader');
  if (!sprayCanvas) return null;

  const updateSprayDOMLabels = (loader) => {
    const st = loader.getState();
    const pct = Math.round(st.renderedProgress * 100);
    if (pctLabelEl) pctLabelEl.textContent = `${pct}%`;
    if (stageLabelEl) stageLabelEl.textContent = st.stage.replace(/_/g, ' ');
    if (telSprayEl) {
      telSprayEl.textContent = st.renderedProgress >= 0.999 ? 'COMPLETE (100%)' : `${st.stage} (${pct}%)`;
    }
  };

  let dismissTimer = null;
  const sprayLoader = createSprayPaintLoader({
    canvas: sprayCanvas,
    logoSource: 'tags/1DOOMTAG.jpeg',
    mode: 'deterministic',
    duration: 6500,
    audioEnabled: true,
    volume: 0.8,
    oversprayIntensity: 0.5,
    mistEnabled: true,
    backgroundColor: '#000000',
    onStageChange: () => updateSprayDOMLabels(sprayLoader),
    onPassComplete: () => updateSprayDOMLabels(sprayLoader),
    onLetterComplete: (_idx, _letterId) => updateSprayDOMLabels(sprayLoader),
    onComplete: () => {
      updateSprayDOMLabels(sprayLoader);
      if (dismissTimer) clearTimeout(dismissTimer);
      const holdDelay = sprayLoader.mode === 'autoplay' ? 1200 : 480;
      dismissTimer = setTimeout(() => {
        if (overlayEl && !sprayLoader.keepVisibleForTest) {
          overlayEl.classList.add('hidden');
        }
      }, holdDelay);
    },
  });

  sprayLoader.play();

  sandbox.sprayLoader = sprayLoader;
  window.sprayPaintLoader = sprayLoader;

  sandbox.skipSprayPaintIntro = () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    sprayLoader.setProgress(1.0, { immediate: true });
    sprayLoader.pause();
    updateSprayDOMLabels(sprayLoader);
    if (overlayEl) {
      overlayEl.classList.add('hidden');
    }
  };

  sandbox.replaySprayPaintIntro = (mode = 'autoplay') => {
    if (dismissTimer) clearTimeout(dismissTimer);
    if (overlayEl) {
      overlayEl.classList.remove('hidden');
    }
    sprayLoader.audioEngine.unlock();
    sprayLoader.mode = mode === 'deterministic' ? 'deterministic' : 'autoplay';
    sprayLoader.reset();
    updateSprayDOMLabels(sprayLoader);
    sprayLoader.play();
  };

  return sprayLoader;
}

async function initSandbox() {
  const sprayLoader = initSprayPaintLoadingScreen();
  const loader = new GLTFLoader();
  sandbox.variantLoader = loader;

  const totalAssets = 5 + RPM_ANIMATION_CATALOG.length;
  let loadedAssets = 0;
  const handleAssetProgress = () => {
    loadedAssets++;
    if (sprayLoader && sprayLoader.mode === 'deterministic') {
      const frac = Math.min(0.92, (loadedAssets / totalAssets) * 0.92);
      sprayLoader.setProgress(frac);
    }
  };

  const [
    alleyGLTF,
    hoodieGLTF,
    tunicGLTF,
    alarmLightGLTF,
    hologramGLTF,
    ...rpmAnimGLTFs
  ] = await Promise.all([
    loadGLB(loader, ASSET_PATHS.alley, handleAssetProgress),
    loadGLB(loader, ASSET_PATHS.hoodie, handleAssetProgress),
    loadGLB(loader, ASSET_PATHS.tunic, handleAssetProgress),
    loadGLB(loader, ASSET_PATHS.alarmLight, handleAssetProgress),
    loadGLB(loader, ASSET_PATHS.hologram, handleAssetProgress),
    ...RPM_ANIMATION_CATALOG.map((spec) => loadGLB(loader, spec.url, handleAssetProgress)),
  ]);

  if (hoodieGLTF.animations && hoodieGLTF.animations.length > 0) {
    raiseFatalError(
      `Character '${ASSET_PATHS.hoodie}' contains ${hoodieGLTF.animations.length} prohibited embedded legacy animation clips.`
    );
  }
  if (tunicGLTF.animations && tunicGLTF.animations.length > 0) {
    raiseFatalError(
      `Character '${ASSET_PATHS.tunic}' contains ${tunicGLTF.animations.length} prohibited embedded legacy animation clips.`
    );
  }

  // 1. Validate & Stage Freeman Alley Environment
  const alleyRoot = alleyGLTF.scene;
  const envRootNode = alleyRoot.getObjectByName('ENV_FREEMAN_ALLEY') || alleyRoot;
  const visualAlleyMesh = alleyRoot.getObjectByName('VISUAL_ALLEY_MESH');
  const collidersGroup = alleyRoot.getObjectByName('COLLIDERS');
  const markersGroup = alleyRoot.getObjectByName('MARKERS');

  if (!visualAlleyMesh) {
    raiseFatalError("Missing 'VISUAL_ALLEY_MESH' inside freeman_alley.glb.");
  }
  if (!collidersGroup) {
    raiseFatalError("Missing 'COLLIDERS' group inside freeman_alley.glb.");
  }
  if (!markersGroup) {
    raiseFatalError("Missing 'MARKERS' group inside freeman_alley.glb.");
  }

  visualAlleyMesh.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        m.roughness = 1.0;
        m.metalness = 0.0;
        if ('envMapIntensity' in m) {
          m.envMapIntensity = 0.0;
        }
        m.needsUpdate = true;
      }
    }
  });

  const colliderMeshes = {};
  const colliderMeshList = [];
  for (const colName of REQUIRED_COLLIDER_NAMES) {
    const colObj = collidersGroup.getObjectByName(colName);
    if (!colObj || !colObj.isMesh) {
      raiseFatalError(`Missing required collision proxy mesh '${colName}' in freeman_alley.glb.`);
    }
    colObj.visible = false;
    if (colObj.material) {
      colObj.material = colObj.material.clone();
      colObj.material.side = THREE.DoubleSide;
    }
    colliderMeshes[colName] = colObj;
    colliderMeshList.push(colObj);
  }

  const markers = {};
  for (const markerName of REQUIRED_MARKER_NAMES) {
    const mObj = markersGroup.getObjectByName(markerName);
    if (!mObj) {
      raiseFatalError(`Missing required stage locator '${markerName}' in freeman_alley.glb.`);
    }
    markers[markerName] = mObj;
  }

  scene.add(alleyRoot);
  alleyRoot.updateMatrixWorld(true);

  // Build and validate all 6 wall screen mounts (SCREEN_MOUNT_01..06) with transparent hologram.glb meshes (Spec 025 §4)
  const { wallMounts, wallMountsByName, raycastTargets } = buildWallScreenMounts(markers, hologramGLTF);
  sandbox.wallMounts = wallMounts;
  sandbox.wallMountsByName = wallMountsByName;
  sandbox.wallMountRaycastTargets = raycastTargets;

  // Build and validate glowing 3D neon wall-corner accent lines (Spec 017 §3–§6)
  const neonSystem = buildNeonWallCornerAccents(wallMounts);
  sandbox.neonCornersGroup = neonSystem.rootGroup;
  sandbox.neonWallCorners = neonSystem.segments;
  sandbox.neonWallCornersByCategory = neonSystem.segmentsByCategory;
  sandbox.neonCornerJoints = neonSystem.joints;
  sandbox.neonVertices = neonSystem.vertices;
  sandbox.neonCoreMaterial = neonSystem.coreMaterial;
  sandbox.neonHaloMaterial = neonSystem.haloMaterial;

  // Build and validate all 8 bilateral Dark Amber Alarm Light Fixtures (4 pairs, smaller & flickering)
  const alarmLightSystem = buildAlleyAlarmLightFixtures(alarmLightGLTF, visualAlleyMesh);
  sandbox.alarmLights = alarmLightSystem.fixtures;
  sandbox.alarmLightsById = alarmLightSystem.fixturesById;
  sandbox.alarmLightMaterials = alarmLightSystem.materials;

  // Build and validate Entrance Street Lamppost Light ("Just Light" — Spec 024 §3.1–§3.4)
  const lamppostLightFixture = buildEntranceLamppostLightSystem(visualAlleyMesh);
  sandbox.lamppostLight = lamppostLightFixture;
  sandbox.entranceLamppostLight = lamppostLightFixture;
  sandbox.streetLights = [lamppostLightFixture];

  const wallSegments = extractWallSegmentsFromColliders(colliderMeshes);
  const floorTriangles = extractFloorTriangles(colliderMeshes.COLLIDER_FLOOR);
  const floorY = floorTriangles[0].y;

  // Standalone corridor entrance hologram remains empty; hologram.glb is mounted on all 6 TV wall mounts (Spec 025 §4)
  entranceHologramRootGroup.clear();
  sandbox.entranceHologram = null;

  // Build and integrate 7 Interactive 3D Math Hologram Pods (math_pods.md §1–§3)
  mathPodsRootGroup.clear();
  const mathPodsSystem = buildMathHologramPods({
    rootGroup: mathPodsRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
    getInteractionContext: () => {
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      const companion = sandbox.companion || null;
      return {
        activeCharacter: activeChar,
        character: activeChar,
        characterPosition: activeChar ? activeChar.position : null,
        characterVelocity: activeChar && activeChar.velocity ? activeChar.velocity : null,
        isSprinting: Boolean(activeChar && (activeChar.isSprinting || activeChar.state === 'Sprint' || activeChar.state === 'Run')),
        companion,
        companionPosition: companion ? (companion.headWorldPos || companion.position || (companion.mesh && companion.mesh.position)) : null,
        companionActive: Boolean(companion && companion.active !== false),
        camera,
        audio: sandbox.audio,
        mode: sandbox.mode,
        hoveredMathPod: sandbox.hoveredMathPod || null,
        interactionLocked: Boolean(sandbox.placementMode || sandbox.wallMountEditMode || sandbox.transformControls?.dragging),
      };
    },
  });
  sandbox.mathPods = mathPodsSystem;
  sandbox.mathPodPopups = mathPodsSystem.popupManager;
  if (sandbox.mathPodPopups) {
    scene.add(sandbox.mathPodPopups.rootGroup);
    sandbox.mathPodPopups.registerSceneAssetPresets(scene);
  }
  window.mathPodPopups = sandbox.mathPodPopups;
  updateMathPodsCorridorLOD();

  // Build and integrate "Water Color" Shader Strictly and Exclusively as the Skybox (Spec 025 §5)
  watercolorRootGroup.clear();
  const waterColorSkyboxSystem = buildWaterColorSkyboxSystem({
    rootGroup: watercolorRootGroup,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });
  sandbox.waterColor = waterColorSkyboxSystem;
  sandbox.skybox = waterColorSkyboxSystem;

  // Build and integrate 17 2D Holographic Media Columns (anim/hologram_columns.md §1–§7)
  hologramColumnsRootGroup.clear();
  const hologramColumnsSystem = buildHologramColumnsSystem({
    rootGroup: hologramColumnsRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });
  sandbox.hologramColumns = hologramColumnsSystem;

  // Initialize Three.js TransformControls for interactive in-scene resizing & positioning of the 17 Hologram Media Columns
  if (sandbox.transformControlsHelper) {
    scene.remove(sandbox.transformControlsHelper);
  }
  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSize(0.85);
  transformControls.setMode(sandbox.holoGizmoMode || 'translate');
  transformControls.enabled = false;
  const transformHelper = transformControls.getHelper();
  transformHelper.name = 'HologramTransformControlsHelper';
  scene.add(transformHelper);
  sandbox.transformControls = transformControls;
  sandbox.transformControlsHelper = transformHelper;

  transformControls.addEventListener('dragging-changed', (event) => {
    if (event.value) {
      cameraOrbit.isDragging = false;
      cameraOrbit.maxDragTravel = 999;
      if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
        sandbox.mathPods.endDrag();
        sandbox.draggedMathPod = null;
      }
    } else {
      if (sandbox.lamppostEditMode && sandbox.lamppostLight) {
        sandbox.lamppostLight.syncConeGeometry();
        sandbox.lamppostLight.saveToStorage();
        syncLamppostEditorHUDInputs();
      } else if (sandbox.hologramColumns) {
        sandbox.hologramColumns.saveTransformsToStorage();
        syncHoloEditorHUDInputs();
      }
    }
  });

  transformControls.addEventListener('objectChange', () => {
    if (sandbox.lamppostEditMode && sandbox.lamppostLight) {
      sandbox.lamppostLight.syncConeGeometry();
      syncLamppostEditorHUDInputs();
      return;
    }
    const col = sandbox.hologramColumns ? sandbox.hologramColumns.getColumn(sandbox.selectedHoloColumnId) : null;
    if (col && sandbox.holoGizmoMode === 'scale') {
      // Keep aspect ratio uniform when scaling via single axis handle unless X and Y are already uniform
      const sx = Math.max(0.1, Math.min(10.0, col.rootGroup.scale.x));
      const sy = Math.max(0.1, Math.min(10.0, col.rootGroup.scale.y));
      const axis = transformControls.axis || '';
      if (axis === 'X') {
        col.rootGroup.scale.set(sx, sx, 1.0);
      } else if (axis === 'Y') {
        col.rootGroup.scale.set(sy, sy, 1.0);
      } else {
        const s = Math.max(0.1, Math.min(10.0, (sx + sy) * 0.5));
        col.rootGroup.scale.set(s, s, 1.0);
      }
    }
    syncHoloEditorHUDInputs();
  });

  syncHoloEditorHUDInputs();
  syncLamppostEditorHUDInputs();

  // Keep Holographic Stickers & Sign detached from the live 3D scene while preserving asset modules
  if (holographicStickersRootGroup.parent) {
    holographicStickersRootGroup.parent.remove(holographicStickersRootGroup);
  }
  holographicStickersRootGroup.clear();
  sandbox.holographicStickers = null;

  if (holographicSignRootGroup.parent) {
    holographicSignRootGroup.parent.remove(holographicSignRootGroup);
  }
  holographicSignRootGroup.clear();
  sandbox.holographicSign = null;

  // Build and integrate 20 Full-Alleyway Sagging Overhead Hanging Cables (OVERHEAD_CABLE_01..OVERHEAD_CABLE_20, Spec 023 §6)
  sandbox._visualAlleyMesh = visualAlleyMesh;
  sandbox.overheadCables = buildOverheadHangingCables(wallSegments, floorY);

  // Build and integrate Running Mode Speed Effects & Cyber-Techno Binary Trail (Spec 023 §3)
  sandbox.runningEffects = buildRunningEffectsSystem(floorY);

  // Build and integrate Dynamic Light-Responsive Character & Floating Head Shadows (Spec 023 §5)
  sandbox.characterShadows = buildCharacterLightResponsiveShadows(floorY);

  // Build Environmental Effects, Surface Optics, and Audio Subsystems (SFX.md §2, §3, §4)
  sfxRootGroup.clear();
  const groundFog = buildLowAltitudeGroundFog(floorY);
  const spotlightCones = buildVolumetricSpotlightCones(sandbox.alarmLights);
  const ambientParticulates = buildSuspendedAmbientParticulates(floorY);
  const precipitation = buildPrecipitationEmitter(floorY);
  const floorReflections = buildPlanarFloorReflectionSubsystem(floorY);
  const audioSubsystem = buildAudioSubsystem(null, sandbox.alarmLights);

  sandbox.sfx = {
    rootGroup: sfxRootGroup,
    centralTerminal: null,
    depthFog: {
      fog: scene.fog,
      type: 'FogExp2',
      formula: 'exponential_squared_d2',
      colorHex: '#0b0501',
      density: DEPTH_FOG_DENSITY,
      foregroundTerminalVisibilityPct: 100.0,
      farCorridorVisibilityPct: Number(
        (Math.exp(-Math.pow(DEPTH_FOG_DENSITY * 58.0, 2)) * 100.0).toFixed(3)
      ),
      evaluateVisibilityAtDistance(distMeters) {
        return Math.exp(-Math.pow(DEPTH_FOG_DENSITY * distMeters, 2));
      },
    },
    groundFog,
    spotlightCones,
    ambientParticulates,
    precipitation,
    floorReflections,
    audio: audioSubsystem,
  };
  sandbox.audio = audioSubsystem;
  sandbox.audio.trigger('onActivate', { source: 'initialTerminalStaging' });

  const spawnPlayerPos = new THREE.Vector3();
  const spawnNpcPos = new THREE.Vector3();
  markers.SPAWN_PLAYER.getWorldPosition(spawnPlayerPos);
  markers.SPAWN_NPC.getWorldPosition(spawnNpcPos);

  const spawnPlayerQuat = new THREE.Quaternion();
  const spawnNpcQuat = new THREE.Quaternion();
  markers.SPAWN_PLAYER.getWorldQuaternion(spawnPlayerQuat);
  markers.SPAWN_NPC.getWorldQuaternion(spawnNpcQuat);

  const spawnPlayerEuler = new THREE.Euler().setFromQuaternion(spawnPlayerQuat, 'YXZ');
  const spawnNpcEuler = new THREE.Euler().setFromQuaternion(spawnNpcQuat, 'YXZ');

  sandbox.environment = {
    root: envRootNode,
    visualMesh: visualAlleyMesh,
    collidersGroup,
    colliderMeshes,
    colliderMeshList,
    wallSegments,
    floorTriangles,
    floorY,
    markers,
    spawnPlayerPos,
    spawnNpcPos,
    spawnPlayerYaw: spawnPlayerEuler.y,
    spawnNpcYaw: spawnNpcEuler.y,
  };

  // 2. Validate, Sanitize & Share Ready Player Me (RPM) Standalone Animation Library in Memory (animation_Redo.md §3–§6)
  if (rpmAnimGLTFs.length !== RPM_ANIMATION_CATALOG.length) {
    raiseFatalError(
      `Expected ${RPM_ANIMATION_CATALOG.length} Ready Player Me animation assets, loaded ${rpmAnimGLTFs.length}.`
    );
  }
  const sharedClips = [];
  for (let i = 0; i < RPM_ANIMATION_CATALOG.length; i++) {
    const spec = RPM_ANIMATION_CATALOG[i];
    const animGltf = rpmAnimGLTFs[i];
    if (!animGltf || !animGltf.animations || animGltf.animations.length === 0) {
      raiseFatalError(`Ready Player Me animation asset '${spec.url}' contains no animation clips.`);
    }
    const sanitizedClip = sanitizeRPMAnimationClip(animGltf.animations[0], spec);
    sharedClips.push(sanitizedClip);
  }

  sandbox.sharedClips = sharedClips;
  sandbox.clipNames = sharedClips.map((c) => c.name);
  sandbox.rpmAnimationCatalog = RPM_ANIMATION_CATALOG;
  sandbox.dialogueClipPool = RPM_DIALOGUE_CLIP_POOL.map((s) => s.id);

  const selectEl = document.getElementById('animation-select');
  const countLabel = document.getElementById('clip-count-label');
  if (countLabel) {
    countLabel.textContent = String(sharedClips.length);
  }
  if (selectEl) {
    selectEl.innerHTML = '';
    for (const clip of sharedClips) {
      const opt = document.createElement('option');
      opt.value = clip.name;
      const modeTag = isLoopingClip(clip.name) ? 'Loop' : 'One-Shot';
      opt.textContent = `${clip.name} (${modeTag}, ${clip.duration.toFixed(2)}s)`;
      selectEl.appendChild(opt);
    }
    selectEl.value = 'IDLE_DEFAULT';
  }

  // 3. Stage Both Rigged Humanoid Characters at SPAWN_PLAYER & SPAWN_NPC
  scene.add(hoodieGLTF.scene);
  scene.add(tunicGLTF.scene);

  const hoodieController = new CharacterController({
    id: 'hoodie',
    label: 'LUIS_HOLOSYS_RIGGED.glb (Iridescent Holo)',
    gltfScene: hoodieGLTF.scene,
    sharedClips,
    spawnPos: spawnPlayerPos,
    spawnYaw: spawnPlayerEuler.y,
    floorY,
    baseColor: 0xe2e8f0,
  });

  const tunicController = new CharacterController({
    id: 'tunic',
    label: 'PLATODOOM_HOLOSYS_RIGGED.glb (Iridescent Holo)',
    gltfScene: tunicGLTF.scene,
    sharedClips,
    spawnPos: spawnNpcPos,
    spawnYaw: spawnNpcEuler.y,
    floorY,
    baseColor: 0xf5efe6,
  });

  sandbox.characters = {
    hoodie: hoodieController,
    tunic: tunicController,
  };
  sandbox.variantCache = {
    luis_holo: hoodieController,
    platodoom_holo: tunicController,
  };
  sandbox.activeVariantKey = 'luis_holo';
  sandbox.activeCharacterId = 'hoodie';

  hoodieController.root.animations = sharedClips;
  tunicController.root.animations = sharedClips;
  window.__THREE_ANIMATION_MIXERS__ = [
    hoodieController.mixer,
    tunicController.mixer,
  ];

  window.characterControllers = sandbox.characters;
  window.__animLab = {
    getJointWorldTransform: (boneName, characterId = null) => {
      const char = characterId ? sandbox.characters[characterId] : sandbox.getActiveCharacter();
      if (!char) return null;
      const bone = char.bonesByName.get(boneName) || char.root.getObjectByName(boneName);
      if (!bone) return null;
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      bone.getWorldPosition(pos);
      bone.getWorldQuaternion(quat);
      return {
        name: boneName,
        position: { x: pos.x, y: pos.y, z: pos.z },
        quaternion: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      };
    },
    playClip: (clipName, characterId = null) => {
      const char = characterId ? sandbox.characters[characterId] : sandbox.getActiveCharacter();
      if (!char) return null;
      return char.crossfadeTo(clipName, 0.15, true);
    },
    startDialogue: (preferredClip = null, characterId = null) => {
      const char = characterId ? sandbox.characters[characterId] : sandbox.getActiveCharacter();
      if (!char) return null;
      return char.startDialogue(preferredClip);
    },
    stopDialogue: (characterId = null) => {
      const char = characterId ? sandbox.characters[characterId] : sandbox.getActiveCharacter();
      if (!char) return null;
      return char.stopDialogue();
    },
    getActiveCharacter: () => sandbox.getActiveCharacter(),
    getCharacters: () => sandbox.characters,
  };

  // Enable Solo Character Mode by default so active .glb shader can be inspected alone without clustering
  sandbox.setSoloCharacterMode(true);

  initHoloStationPips();

  // Initialize in Scroll-Walk Mode at 0% scroll baseline
  sandbox.mode = 'scroll';
  sandbox.isMountFocused = false;
  sandbox.focusedMount = null;
  sandbox.scrollProgress = 0.0;
  sandbox.targetScrollProgress = 0.0;
  sandbox.scrollVelocity = 0.0;
  document.body.classList.remove('freeroam-mode');
  syncWindowScrollToFraction(0.0);

  cameraOrbit.yaw = spawnPlayerEuler.y;
  cameraOrbit.pitch = CAM_DEFAULT_PITCH;
  cameraOrbit.desiredDistance = CAM_DEFAULT_DISTANCE;
  cameraOrbit.pivotCurrent.set(
    hoodieController.position.x,
    hoodieController.position.y + CAM_PIVOT_HEIGHT,
    hoodieController.position.z
  );
  cameraOrbit.pivotTarget.copy(cameraOrbit.pivotCurrent);
  mountFocusCameraState.currentLookAt.copy(cameraOrbit.pivotCurrent);

  // Initialize Cyber-Tactical 2D HUD Radial Menu (anim/radial_menu.md §1, §5)
  const radialOverlay = document.getElementById('cyber-radial-menu-overlay');
  const radialController = createCyberRadialMenuHUD({
    container: radialOverlay,
    size: 680,
    iconSize: 68,
    bandWidth: 198,
    innerGap: 18,
    outerGap: 6,
    outerRingWidth: 10,
    linearGapPx: 8,
    onOpenChange: (isOpen) => {
      if (isOpen) {
        cameraOrbit.isDragging = false;
        cameraOrbit.maxDragTravel = 0;
        lastHovered3DRegion = null;
        sandbox.hoveredMount = null;
        sandbox.hoveredMathPod = null;
        if (typeof document !== 'undefined') {
          document.body.classList.remove('mount-pointer-hover');
        }
        if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
          sandbox.mathPods.endDrag();
          sandbox.draggedMathPod = null;
        }
        for (const k of Object.keys(keysPressed)) {
          keysPressed[k] = false;
        }
      }
    },
    onSelect: (item, index) => {
      sandbox.lastRadialAction = item.label;
      const telEl = document.getElementById('tel-radial');
      if (telEl) {
        telEl.textContent = item.label;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cyber-radial-select', { detail: item }));
      }
    },
  });
  sandbox.radialMenu = radialController;
  if (typeof window !== 'undefined') {
    window.radialMenuController = radialController;
  }

  bindInputListeners();

  sandbox.ready = true;
  if (sprayLoader && sprayLoader.mode === 'deterministic') {
    sprayLoader.setProgress(1.0);
  }
  const badge = document.getElementById('hud-status-badge');
  if (badge) {
    badge.textContent = 'READY (60 FPS)';
  }

  // Initial deterministic frame update at 0% scroll
  stepSimulation(1 / 60);

  // Start real-time render & physics loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = (now - lastTime) * 0.001;
    lastTime = now;
    stepSimulation(dt);
  }
  requestAnimationFrame(animate);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initSandbox().catch((err) => {
    raiseFatalError(err?.message || String(err));
  });
}

export {
  CharacterController,
  sandbox,
  keysPressed,
  LOOPING_CLIP_NAMES,
  ONCE_STATES,
  sampleSurfaceHeightAndNormal,
  resolveCircleAgainstWalls,
  extractFloorTriangles,
  createCyberRadialMenuHUD,
  DEFAULT_CYBER_MENU_ITEMS,
  CENTRAL_HUB_EMBLEM,
  FULL_CIRCLE,
  START_ANGLE,
  degToRad,
  radToDeg,
  polarToCartesian,
  slicePath,
  computeRadialDimensions,
  computeSectorAngles,
  computeSectorCornerBrackets,
  computeInnerArcTicks,
  computePayloadLayout,
  getTelemetryDensityTier,
  computeSliceVisualState,
  computeReticleBox,
  computeCentralHubState,
  resolvePolarHitSector,
  harmonizeEmblemPixelBuffer,
  renderRadialMenuSVGMarkup,
  RadialMenu,
  buildHologramColumnsSystem,
  HOLO_MEDIA_MANIFEST,
  HOLO_MEDIA_BY_ID,
  HOLO_SPECTRAL_TINT_PRESETS,
  HOLO_LIFECYCLE_STATES,
  HOLO_GLITCH_MODES,
  HOLO_DEFAULT_RUNTIME_PARAMS,
  resolveHoloMediaSpec,
  computeHologramColumnGeometrySpec,
  createHoloMediaTextureController,
  evaluateHologramPixelPreProcessing,
  evaluateSteadyStateHologramOptics,
  evaluateHologramGlitchDynamics,
  evaluateLifecycleStateEnvelope,
  createHologramColumnShaderMaterial,
  createHologramColumnInstance,
  HoloVideoStreamController,
  STICKER_ASSET_MANIFEST,
  STICKER_ASSET_BY_ID,
  STICKER_BORDER_MODES,
  STICKER_PLACEMENT_MODES,
  STICKER_DEFAULT_MATERIAL_PARAMS,
  resolveStickerAssetSpec,
  computeStickerGeometrySpec,
  evaluateStickerTriZoneClassification,
  evaluateStickerFoilMaskDerivation,
  evaluateHolographicStickerOptics,
  evaluateDieCutBorderVisualMode,
  evaluateStickerIdleShimmer,
  createStickerTextureBundleController,
  createHolographicStickerShaderMaterial,
  createHolographicStickerInstance,
  buildHolographicStickersSystem,
  HOLO_SIGN_MANIFEST,
  HOLO_SIGN_BY_ID,
  HOLO_SIGN_WORD_BRANCHES,
  HOLO_SIGN_FAULT_TYPES,
  HOLO_SIGN_GLITCH_TYPES,
  HOLO_SIGN_PROTECTION_MODES,
  HOLO_SIGN_DEFAULT_PARAMS,
  parseHolographicSignNodeName,
  resolveHolographicSignNodeSpec,
  computeCrosswordLayoutMatrix,
  evaluateParallaxDepthStack,
  evaluateBaselineHolographicOptics,
  evaluateFlickerProfileAtTime,
  evaluateSharedIntersectionProtection,
  evaluateFlickerScheduler,
  evaluateSpatialGlitch,
  createHolographicSignShaderMaterial,
  createHolographicSignInstance,
  buildHolographicSignSystem,
  OVERHEAD_WIRE_VARIETIES,
  OVERHEAD_VERTICAL_TIERS,
  OVERHEAD_CABLE_SCHEDULE,
  WALK_THROUGH_GLITCH_SPEC,
  evaluatePodWalkThroughGlitch,
  DiegeticAudioEngine,
  SprayPaintLoader,
  createSprayPaintLoader,
  SprayPaintAudioEngine,
  SPRAY_PAINT_TIMELINE_SPEC,
  SPRAY_LETTER_SPECS,
  SPRAY_DEFAULT_OPTIONS,
  buildChoreographedNozzleTrajectory,
  resolveLogoPixelLetterIndex,
};
