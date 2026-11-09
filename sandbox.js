import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { buildMathHologramPods, HOLO_POD_PALETTE, HOLO_POD_SPECS } from './math_pods.js?v=090';
import { WALK_THROUGH_GLITCH_SPEC, evaluatePodWalkThroughGlitch } from './math_pods.js?v=090';
import {
  createMathPodPopupManager,
  MathPodPopupCallout,
  MATHPOD_CALLOUT_PROFILES,
  CALLOUT_PALETTE_THEMES,
  UNIVERSAL_ASSET_CALLOUT_PRESETS,
} from './mathpod_popup.js?v=090';
import {
  buildWaterColorGallerySystem,
  buildWaterColorSkyboxSystem,
  WATERCOLOR_PALETTE,
  WATERCOLOR_DEFAULT_PARAMS,
  WATERCOLOR_GALLERY_SPEC,
  WATERCOLOR_SKYBOX_SPEC,
  PORTAL_HEADER_LOGO_SPEC,
  PORTAL_GAME_CATALOG,
  PORTAL_GAME_BY_ID,
  normalizePortalGameEntry,
  resolvePortalGameSpec,
  solvePortalGameGridLayout,
} from './watercolor_shader.js?v=090';
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
  GRAFFITI_HEADER_GLITCH_FLICKER_SPEC,
  GRAFFITI_ALPHABET_GLYPH_MAP,
  GRAFFITI_STATION_HEADER_SCHEDULE,
  GRAFFITI_STATION_HEADER_BY_MOUNT,
  stripStationHeaderPrefix,
  resolveStationGraffitiHeaderSpec,
  evaluateGraffitiHeaderLevitation,
  evaluateGraffitiHeaderFlickerAndGlitch,
  createGraffitiHeaderHolographicMaterial,
  CHARACTER_SHADOW_SPEC,
  collectActiveSceneLightSources,
  evaluateLightResponsiveShadowAtPosition,
  buildCharacterLightResponsiveShadowSubsystem,
  OVERHEAD_WIRE_VARIETIES,
  OVERHEAD_VERTICAL_TIERS,
  OVERHEAD_CABLE_SCHEDULE,
  evaluateOverheadCableCatenaryPoint,
  buildOverheadHangingCablesSubsystem,
} from './alley_atmosphere_023.js?v=079';
import {
  RadialMenu,
  createCyberRadialMenuHUD,
  PRIMARY_CYBER_MENU_ITEMS,
  STICKER_RADIAL_MENU_ITEMS,
  LEGACY_CYBER_MENU_ITEMS,
  DEFAULT_CYBER_MENU_ITEMS,
  CENTRAL_HUB_EMBLEM,
  FULL_CIRCLE,
  START_ANGLE,
  SUBMENU_FAN_IN_DURATION_MS,
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
} from './radial_menu_hud.js?v=047';
import {
  buildHologramColumnsSystem,
  HOLO_COLUMNS_STORAGE_KEY,
  HOLO_MEDIA_MANIFEST,
  HOLO_MEDIA_BY_ID,
  HOLO_CAROUSEL_DEFAULT_SLIDES,
  SSM_WHITEPAPER_HOLO_SPEC,
  HOLO_SPECTRAL_TINT_PRESETS,
  HOLO_LIFECYCLE_STATES,
  HOLO_GLITCH_MODES,
  HOLO_DEFAULT_RUNTIME_PARAMS,
  resolveHoloMediaSpec,
  computeHologramColumnGeometrySpec,
  createProceduralSlideCardTexture,
  createHoloMediaTextureController,
  evaluateHologramPixelPreProcessing,
  evaluateSteadyStateHologramOptics,
  evaluateHologramGlitchDynamics,
  evaluateLifecycleStateEnvelope,
  createHologramColumnShaderMaterial,
  createHologramColumnInstance,
  HologramColumnInstance,
  HoloVideoStreamController,
  HoloScrollableDocumentController,
} from './hologram_columns.js?v=092';

import {
  STICKER_ASSET_MANIFEST,
  STICKER_ASSET_BY_ID,
  STICKER_BORDER_MODES,
  STICKER_PLACEMENT_MODES,
  STICKER_DEFAULT_MATERIAL_PARAMS,
  STICKER_DEFAULT_SIZE_BOUNDS,
  normalizeStickerSizeBounds,
  clampStickerSize,
  normalizeStickerRotationRad,
  resolveStickerWallProfileX,
  resolveStickerExteriorWallProfileZ,
  resolveStickerFloorContourY,
  computeStickerSurfaceBasis,
  buildStickerBoundingSurfaces,
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
} from './holographic_stickers.js?v=054';
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
import {
  ALLEY_METAL_PIPES_ASSET_URL,
  PIPE_VARIATION_SPECS,
  ALLEY_PIPE_PLACEMENT_SCHEDULE,
  PIPE_STEAM_NOZZLE_SPECS,
  PIPE_STEAM_INTERVAL_SCHEDULE,
  resolvePipeNozzleWorldTransform,
  evaluatePipeSteamEnvelope,
  resolveAlleyWallProfileX,
  buildAlleyMetalPipesSubsystem,
} from './alley_metal_pipes.js?v=074';
import {
  buildSceneCutterSubsystem,
} from './scene_cutter.js?v=090';
import {
  createDoomTracksMp3HUD,
  DOOM_TRACKS_DEFAULT_CATALOG,
  MP3_CONTROL_HIT_ZONES,
  MP3_SCREEN_HIT_ZONES,
  MP3_PALETTE,
  MP3_CHASSIS_CROP,
  MP3_SCREEN_ONLY_CROP,
  MP3_NATIVE_WIDTH,
  MP3_NATIVE_HEIGHT,
  processMp3ChassisBitmap,
  drawTechnoVectorText,
  measureTechnoVectorText,
} from './doom_tracks_mp3_hud.js?v=071_5';
import {
  createSceneBootMaterializationSystem,
  createPortfolioPerimeterHUD,
  GlyphDecodeController,
  CIPHER_GLYPH_POOL,
  computePortraitAspectFactor,
  evaluateDynamicCameraFollowOffsets,
  DYNAMIC_CAM_ASPECT_LANDSCAPE,
  DYNAMIC_CAM_ASPECT_PORTRAIT,
  DYNAMIC_CAM_BOOM_PULLBACK_FACTOR,
  DYNAMIC_CAM_LOOKAT_Y_ELEVATION_M,
} from './scene_materialization_hud_070.js?v=071_5';

const IS_DEV_MODE =
  typeof window !== 'undefined' &&
  Boolean(window.location) &&
  new URLSearchParams(window.location.search || '').get('dev') === '1';

// ============================================================================
// Constants & Deterministic Configuration (functional_specification_013 & 014)
// ============================================================================
const ASSET_PATHS = {
  alley: './freeman_alley.glb?v=051',
  alarmLight: './alarm_light.glb',
  alleyPipes: './assets/pipes/alley_metal_pipes.glb?v=051',
  villainySign: './villainy_inc_textured.glb?v=045',
  hoodie: './character_hoodie.glb?v=051',
  hoodieColor: './character_hoodie.glb?v=051',
  nicotest: './characters/nicotest.glb?v=051',
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
  luis_color: {
    key: 'luis_color',
    label: 'character_hoodie.glb (Full Color + DOOM Head)',
    url: ASSET_PATHS.hoodieColor,
    characterSlot: 'hoodie',
    defaultHoloShader: false,
    baseColor: 0xe2e8f0,
  },
  nicotest_color: {
    key: 'nicotest_color',
    label: 'characters/nicotest.glb (Nico Rigged)',
    url: ASSET_PATHS.nicotest,
    characterSlot: 'hoodie',
    defaultHoloShader: false,
    baseColor: 0xe2e8f0,
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
const CLICK_MAX_DRAG_PIXELS = 10.0;      // px — max pointer travel to distinguish a clean 3D tap from orbit drag (Spec 040 §5.3 & §6)
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

// Over-the-Shoulder (OTS) Torso-Visible Camera Framing parameters (Spec 019 §4 + User Locked-In Character Camera)
const CAM_PIVOT_HEIGHT = 1.80;     // m upper-chest / shoulder pivot height on 2.0m character so torso & head are framed
const CAM_DEFAULT_DISTANCE = 0.35; // m intimate over-the-shoulder distance framing torso, shoulders & head
const CAM_DEFAULT_PITCH = 0.1636;  // rad over-the-shoulder vertical angle (+9.4 deg)
const CAM_SHOULDER_OFFSET_X = 0.62; // m lateral right-shoulder camera offset placing torso on left-center foreground
const CAM_DEFAULT_FORWARD_OFFSET_Z = -0.14; // m forward/back pivot offset along character facing direction
const CAM_DEFAULT_YAW_OFFSET_RAD = 0.1288;  // rad relative yaw offset (+7.4 deg) from character facing orientation
const CAM_DEFAULT_FOV_DEG = 95.0;  // deg vertical field-of-view
const CAM_MIN_DISTANCE = 0.35;     // m minimum zoom distance (expanded for close-up in-game character cam positioning)
const CAM_MAX_DISTANCE = 8.00;     // m maximum zoom distance (expanded for wide in-game character cam positioning)
const CAM_MIN_PITCH = -0.72;       // rad minimum vertical orbit angle (allows looking up ~41 deg at overhead Villainy Inc. sign)
const CAM_MAX_PITCH = 1.35;        // rad maximum vertical orbit angle
const CAM_WALL_MARGIN = 0.24;      // m clearance margin from alley walls (exceeds 95 deg FOV near-plane corner radius 0.222m)
const CAM_SPRING_ARM_PROBE_RADIUS = 0.24; // m Stage 1 & Stage 2 circular frustum clearance radius (Spec 068 §3.1)
const CAM_MIN_BOOM_DISTANCE = 0.04;       // m minimum compressed boom length (Spec 068 §5.3)
const CAM_HEAD_CLEARANCE_RADIUS = 0.26;   // m minimum planar separation between camera eye and character spine (Spec 068 §5.3)
const CAM_SPRING_ARM_LAMBDA_IN = 48.0;    // 1/s rapid wall-compression damping rate
const CAM_SPRING_ARM_LAMBDA_OUT = 10.0;   // 1/s smooth wall-recovery extension rate
const LOOK_THUMBPAD_MAX_YAW_RATE = 2.4;   // rad/s (~137.5 deg/s) right-stick horizontal look velocity
const LOOK_THUMBPAD_MAX_PITCH_RATE = 1.5; // rad/s (~86 deg/s) right-stick vertical look velocity

const CHARACTER_CAMERA_STORAGE_KEY = 'skatealley_character_camera_v1';

const CHARACTER_CAMERA_PRESETS = {
  ots_right: {
    distance: CAM_DEFAULT_DISTANCE,
    pivotHeightY: CAM_PIVOT_HEIGHT,
    shoulderOffsetX: CAM_SHOULDER_OFFSET_X,
    forwardOffsetZ: CAM_DEFAULT_FORWARD_OFFSET_Z,
    pitchRad: CAM_DEFAULT_PITCH,
    yawOffsetRad: CAM_DEFAULT_YAW_OFFSET_RAD,
    fovDeg: CAM_DEFAULT_FOV_DEG,
    wallClampEnabled: true,
  },
  center: {
    distance: 1.85,
    pivotHeightY: 1.52,
    shoulderOffsetX: 0.0,
    forwardOffsetZ: 0.0,
    pitchRad: 0.087,
    yawOffsetRad: 0.0,
    fovDeg: 55.0,
    wallClampEnabled: true,
  },
  ots_left: {
    distance: CAM_DEFAULT_DISTANCE,
    pivotHeightY: CAM_PIVOT_HEIGHT,
    shoulderOffsetX: -CAM_SHOULDER_OFFSET_X,
    forwardOffsetZ: CAM_DEFAULT_FORWARD_OFFSET_Z,
    pitchRad: CAM_DEFAULT_PITCH,
    yawOffsetRad: -CAM_DEFAULT_YAW_OFFSET_RAD,
    fovDeg: CAM_DEFAULT_FOV_DEG,
    wallClampEnabled: true,
  },
  wide: {
    distance: 3.10,
    pivotHeightY: 1.65,
    shoulderOffsetX: 0.25,
    forwardOffsetZ: 0.0,
    pitchRad: 0.14,
    yawOffsetRad: 0.0,
    fovDeg: 50.0,
    wallClampEnabled: true,
  },
};

const DEFAULT_CHARACTER_CAMERA = { ...CHARACTER_CAMERA_PRESETS.ots_right };

function wrapAngleRad(rad) {
  const n = Number(rad);
  if (!Number.isFinite(n)) return 0.0;
  return Math.atan2(Math.sin(n), Math.cos(n));
}

function sanitizeCharacterCameraPayload(raw, fallback = DEFAULT_CHARACTER_CAMERA) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const clampNum = (val, defVal, minVal, maxVal) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return defVal;
    return Math.max(minVal, Math.min(maxVal, n));
  };
  let pitchRad = fallback.pitchRad;
  if (Number.isFinite(Number(src.pitchRad))) {
    pitchRad = clampNum(src.pitchRad, fallback.pitchRad, CAM_MIN_PITCH, CAM_MAX_PITCH);
  } else if (Number.isFinite(Number(src.pitchDeg))) {
    pitchRad = clampNum((Number(src.pitchDeg) * Math.PI) / 180.0, fallback.pitchRad, CAM_MIN_PITCH, CAM_MAX_PITCH);
  }
  let yawOffsetRad = fallback.yawOffsetRad;
  if (Number.isFinite(Number(src.yawOffsetRad))) {
    yawOffsetRad = clampNum(src.yawOffsetRad, fallback.yawOffsetRad, -Math.PI, Math.PI);
  } else if (Number.isFinite(Number(src.yawOffsetDeg))) {
    yawOffsetRad = clampNum((Number(src.yawOffsetDeg) * Math.PI) / 180.0, fallback.yawOffsetRad, -Math.PI, Math.PI);
  }
  return {
    distance: Number(clampNum(src.distance, fallback.distance, CAM_MIN_DISTANCE, CAM_MAX_DISTANCE).toFixed(3)),
    pivotHeightY: Number(clampNum(src.pivotHeightY, fallback.pivotHeightY, 0.20, 3.20).toFixed(3)),
    shoulderOffsetX: Number(clampNum(src.shoulderOffsetX, fallback.shoulderOffsetX, -2.00, 2.00).toFixed(3)),
    forwardOffsetZ: Number(clampNum(src.forwardOffsetZ, fallback.forwardOffsetZ, -2.00, 2.00).toFixed(3)),
    pitchRad: Number(pitchRad.toFixed(4)),
    yawOffsetRad: Number(yawOffsetRad.toFixed(4)),
    fovDeg: Number(clampNum(src.fovDeg, fallback.fovDeg, 25.0, 95.0).toFixed(1)),
    wallClampEnabled:
      typeof src.wallClampEnabled === 'boolean' ? src.wallClampEnabled : Boolean(fallback.wallClampEnabled),
  };
}

function loadInitialCharacterCameraState() {
  let stored = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(CHARACTER_CAMERA_STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch (_e) {
      stored = null;
    }
  }
  const clean = sanitizeCharacterCameraPayload(stored, DEFAULT_CHARACTER_CAMERA);
  return {
    ...clean,
    panelOpen: false,
    positioningMode: false,
    isPanningOffset: false,
    lastSyncLabel: 'SYNCED',
  };
}

const characterCameraState = loadInitialCharacterCameraState();

function resolveCharacterAlignedCameraYaw(charYaw = null) {
  const activeChar =
    typeof charYaw === 'number' && Number.isFinite(charYaw)
      ? null
      : typeof sandbox !== 'undefined' && sandbox && typeof sandbox.getActiveCharacter === 'function'
        ? sandbox.getActiveCharacter()
        : null;
  const baseYaw =
    typeof charYaw === 'number' && Number.isFinite(charYaw)
      ? charYaw
      : activeChar && Number.isFinite(activeChar.yaw)
        ? activeChar.yaw
        : 0.0;
  return wrapAngleRad(baseYaw + characterCameraState.yawOffsetRad);
}

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
// ============================================================================
// Scroll-Driven Holographic Project Stations & Bound Wall Mounts (Spec 014 §2, Spec 065 §5.1 & Spec 068 §5.5)
// ============================================================================
const HOLO_TAG_DESCRIPTIONS = Object.freeze({
  // Station 01 (SCREEN_MOUNT_01) — GRAPHRAG POLICY ENGINE
  'OBJ-200':
    'Internal project designation for the Lymphedema Treatment Act Medicare DME qualification engine built for Durable Medical Goods compliance workflows.',
  'GraphRAG LLM':
    'Property-graph retrieval-augmented generation pipeline that grounds LLM determinations in structured Medicare statutory rules rather than unconstrained free-text recall.',
  '8-Hop Lineage':
    'Multi-step graph traversal tracing up to 8 relational hops across diagnosis codes, clinical measurements, compression garment classes, and coverage exceptions.',
  '17 Cat / 18 Edge':
    'Domain ontology schema spanning 17 medical/policy node categories connected by 18 typed regulatory and clinical relationship edge types.',

  // Station 02 (SCREEN_MOUNT_02) — DIGITAL TWIN PERSONA
  'OBJ-04':
    "Unit identifier for Luis's autonomous Digital Twin persona and floating DOOM_HEAD holographic companion operating inside Freeman Alley.",
  'Philosophy + MF DOOM':
    "Curated training and alignment corpus blending undergraduate Philosophy & Religion coursework with MF DOOM's intricate multi-syllabic rhyme schemes and cadence.",
  'Finetuned LLM':
    'Custom instruction-tuned and style-aligned language model engineered to reason about systems architecture and philosophy in a signature lyrical voice.',
  'Twitter & LinkedIn':
    'Live social deployment bindings enabling the Digital Twin persona to publish, reply, and interact autonomously across X/Twitter and LinkedIn channels.',

  // Station 03 (SCREEN_MOUNT_03) — QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE
  'Bayesian SSM':
    'Bayesian State Space Model using Kalman filtering and Hidden Markov regime switching to track unobserved equilibrium spreads and time-varying hedge ratios.',
  '$50K TopStepXFA':
    'Validated under live market risk constraints to pass a $50,000 TopStep Express Funded Account (XFA) quantitative trading combine evaluation.',
  'Mean Reversion':
    'Statistical execution strategy that enters counter-trend positions when cointegrated asset spreads deviate beyond dynamically calibrated z-score thresholds.',
  'Cointegration':
    'Econometric stationarity verification (Augmented Dickey-Fuller p < 0.05) ensuring paired financial instruments share a stable long-run equilibrium linear combination.',

  // Station 04 (SCREEN_MOUNT_07) — REJECTION STATION // MACHINE LEARNING
  'bge-large-en-v1.5':
    'Frozen BAAI bge-large-en-v1.5 transformer backbone used to extract high-resolution semantic representations from raw resume and job-description text.',
  '1,024-D Embeddings':
    'Dense 1,024-dimensional L2-normalized feature vectors capturing deep technical skill, domain experience, and role-fit geometry for downstream classical ML classifiers.',
  'LinearSVC Heads':
    'Lightweight, dynamically swappable Linear Support Vector Machine classification heads trained on top of frozen embeddings for sub-millisecond role scoring.',
  '9 Job Roles':
    'Multi-target classification suite evaluating candidate fit across 9 distinct engineering, data science, and quantitative analytics role profiles.',

  // Station 05 (SCREEN_MOUNT_04) — AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH
  'Live Analytics':
    'Real-time telemetry ingestion and visual dashboard pipelines that transform raw operational and unstructured data streams into actionable metrics.',
  'Structured Context':
    'Schema-validated knowledge graphs and typed context packets distilled from noisy datasets so downstream AI agents operate on verifiable ground truth.',
  'Agent Swarms':
    'Multi-agent orchestration architectures where specialized autonomous workers coordinate tasks, share state, and verify outputs across shared telemetry buses.',
  'Alignment Research':
    'Empirical guardrails, objective-function auditing, and deterministic evaluation harnesses ensuring autonomous agent swarms stay locked to human intent.',

  // Station 06 (SCREEN_MOUNT_05) — GENERATIVE PIPELINES
  'Chained AI Models':
    'Sequential and DAG-based multi-model pipelines where outputs from retrieval, reasoning, vision, and audio models feed deterministically into downstream stages.',
  'Content Production':
    'Automated multi-modal media synthesis generating synchronized copy, visual assets, 3D textures, and styled layouts from structured creative briefs.',
  'Code Generation':
    'Specification-driven agentic coding workflows that synthesize, test, and verify production software modules against strict architectural contracts.',
  'Workflow Execution':
    'End-to-end task automation engines connecting LLM tool-calling and schema validation to live APIs, databases, and build pipelines.',

  // Station 07 (SCREEN_MOUNT_06) — MULTI-MODAL DEEP LEARNING
  'Transformers & CNNs':
    'Hybrid deep learning stacks combining self-attention sequence/vision Transformers (ViT) with Convolutional Neural Networks for spatial and temporal feature extraction.',
  'Autoencoders':
    'Variational and denoising autoencoder architectures trained to compress high-dimensional inputs into compact latent manifolds for anomaly detection and data mining.',
  'Diffusion & 3D':
    'Latent diffusion and image-to-3D generative pipelines used to synthesize custom textures, holographic visuals, and rigged 3D assets.',
  'Audio Cloning':
    'Neural speech synthesis and zero-shot voice cloning models trained to generate expressive character dialogue and custom vocal stems.',
});

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
    endProgress: 0.16,
    kicker: 'STATION 01 // GRAPHRAG POLICY ENGINE',
    title: 'GRAPHRAG POLICY ENGINE',
    headerText: 'GRAPHRAG POLICY ENGINE',
    headerLines: ['GRAPHRAG', 'POLICY ENGINE'],
    description:
      'GRAPHRAG LLM for Lymphemeda Treatment Act Medicare Qualifications. Made as a tool for a friend working at a Durable Medical Goods company. Hi Eli!',
    tags: ['OBJ-200', 'GraphRAG LLM', '8-Hop Lineage', '17 Cat / 18 Edge'],
    metrics: [
      { value: '8-Hop', label: 'Lineage' },
      { value: '17 / 18', label: 'Cat / Edge' },
      { value: 'GraphRAG', label: 'Policy LLM' },
    ],
    primaryLink: {
      label: 'LIVE_DEMO (React Showcase)',
      url: 'https://luisp1028.github.io/lag-policy-engine-showcase/',
    },
    secondaryLink: {
      label: 'SRC_CODE (GitHub)',
      url: 'https://github.com/LuisP1028/lag-policy-engine-showcase',
    },
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_01_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // LAG_POLICY_SHOWCASE',
    previewFrameCaptions: [
      '01 // LTA 3,875-NODE KNOWLEDGE GRAPH',
      '02 // DME JURISDICTION & FEE OVERLAY',
      '03 // GRAPHRAG MEDICAL ASSISTANT',
      '04 // 8-HOP IVIG LINEAGE CHAIN',
    ],
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
    startProgress: 0.19,
    endProgress: 0.30,
    kicker: 'STATION 02 // DIGITAL TWIN PERSONA',
    title: 'DIGITAL TWIN PERSONA',
    headerText: 'DIGITAL TWIN PERSONA',
    headerLines: ['DIGITAL TWIN', 'PERSONA'],
    description:
      'Digital persona finetuned on philosophy and MF DOOM, with Twitter and LinkedIn accounts.',
    tags: ['OBJ-04', 'Philosophy + MF DOOM', 'Finetuned LLM', 'Twitter & LinkedIn'],
    metrics: [
      { value: 'OBJ-04', label: 'Unit ID' },
      { value: 'DOOM', label: 'Persona' },
      { value: 'Live', label: 'Terminal' },
    ],
    primaryLink: {
      label: 'LIVE_DEMO (Digital Twin)',
      url: 'https://choppedcheese-digitaltwin.hf.space',
    },
    secondaryLink: {
      label: 'SRC_CODE (Repository)',
      url: 'https://huggingface.co/spaces/ChoppedCheese/DigitalTwin/tree/main',
    },
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_02_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // DIGITALTWIN.HF.SPACE',
    previewFrameCaptions: [
      '01 // PLATODOOM 5-LAYER ARCHITECTURE',
      '02 // TWITTERETL GNN TOPOLOGY FLOW',
      '03 // GENERATIVE PIPELINE ORCHESTRATOR',
      '04 // PLATODOOM BRAIN ONTOLOGY GRAPH',
    ],
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
    startProgress: 0.33,
    endProgress: 0.44,
    kicker: 'STATION 03 // QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE',
    title: 'QUANTITATIVE MODELING AND STATISTICAL ARBITRAGE',
    headerText: 'QUANTITATIVE MODELING STATISTICAL ARBITRAGE',
    headerLines: ['QUANTITATIVE MODELING', 'STATISTICAL ARBITRAGE'],
    description:
      'Bayesian state space model of mean reverting, cointegrated financial assets. The model passed a $50,000 TopStepXFA application. See video for details.',
    tags: ['Bayesian SSM', '$50K TopStepXFA', 'Mean Reversion', 'Cointegration'],
    metrics: [
      { value: '$50K', label: 'TopStepXFA' },
      { value: 'p < 0.05', label: 'ADF Test' },
      { value: '9', label: 'HMM Regimes' },
    ],
    primaryLink: {
      label: 'LIVE_DEMO (YouTube Feed 2)',
      url: 'https://www.youtube.com/watch?v=1a9GwWK9HkQ',
    },
    secondaryLink: {
      label: 'WHITE_PAPER (3D Holo Column)',
      url: '#ssm-whitepaper-column',
      action: 'open-whitepaper-column',
    },
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_03_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // YOUTUBE 1a9GwWK9HkQ',
    previewFrameCaptions: [
      '01 // BAYESIAN SSM & MCMC BOOT',
      '02 // COINTEGRATED SPREAD & HDI',
      '03 // LIVE TOPSTEPX POSITION BRACKETS',
      '04 // $50K TOPSTEPXFA PASSED (+$680)',
    ],
  },
  {
    id: 'proj-07',
    index: 4,
    code: '04',
    mountName: 'SCREEN_MOUNT_07',
    isProceduralLocator: true,
    wallSide: 'R',
    expectedZ: 16.35,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.46,
    endProgress: 0.56,
    kicker: 'REJECTION STATION // MACHINE LEARNING',
    title: 'REJECTION STATION // MACHINE LEARNING',
    headerText: 'REJECTION STATION MACHINE LEARNING',
    headerLines: ['REJECTION STATION', 'MACHINE LEARNING'],
    description:
      'Applying feature engineering and high-dimensional embeddings to train models for classification, regression, clustering, and anomaly detection. Built and deployed a Hugging Face resume classifier that extracts 1,024-dimensional feature vectors from a frozen bge-large-en-v1.5 backbone and dynamically swaps lightweight Linear SVM heads (LinearSVC) to evaluate candidates across 9 distinct job roles.',
    canvasSummary:
      'Applying feature engineering and high-dimensional embeddings for classification, regression, clustering & anomaly detection. Built a Hugging Face resume classifier extracting 1,024-D bge-large-en-v1.5 vectors across 9 dynamic LinearSVC role heads.',
    canvasInspectCue: '[PRESS E OR CLICK — READ "WHAT THE HELL DOES THIS MEAN, LUIS?"]',
    narrativeCallout: {
      heading: 'What the hell does this mean, Luis?',
      body:
        'I cold emailed the CEO of a data analytics company asking for a job and was redirected to their talent acquisition team. The talent acquisition team rejected my application within minutes, so I built a resume scanner using classical machine learning, and sent it back to them within the hour. I found one of the people in charge of talent acquisition through LinkedIn, and they were a film major from NYU. Talent Acquisition is very likely hiding really good engineers from you. MAKE IT MAKE SENSE!',
    },
    tags: ['bge-large-en-v1.5', '1,024-D Embeddings', 'LinearSVC Heads', '9 Job Roles'],
    metrics: [
      { value: '1,024-D', label: 'BGE Vectors' },
      { value: '9 Roles', label: 'LinearSVC' },
      { value: '< 1 Hr', label: 'Turnaround' },
    ],
    primaryLink: null,
    secondaryLink: null,
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_07_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // RESUMESCANNER.HF.SPACE',
    previewFrameCaptions: [
      '01 // BGE-LARGE 1,024-D EMBEDDINGS',
      '02 // 9-ROLE LINEARSVC HYPERPLANES',
      '03 // <1 HR CLASSICAL ML TURNAROUND',
      '04 // 9-ROLE SVM DECISION MATRIX',
    ],
  },
  {
    id: 'proj-04',
    index: 5,
    code: '05',
    mountName: 'SCREEN_MOUNT_04',
    wallSide: 'R',
    expectedZ: 20.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.59,
    endProgress: 0.70,
    kicker: 'STATION 04 // AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH',
    title: 'AI DATA ANALYTICS DASHBOARDS AND ALIGNMENT RESEARCH',
    headerText: 'AI DATA ANALYTICS ALIGNMENT RESEARCH',
    headerLines: ['AI DATA ANALYTICS', 'ALIGNMENT RESEARCH'],
    description:
      'Turning structured/unstructured datasets into live analytics and structured context to guide, coordinate, and align autonomous agent swarms.',
    tags: ['Live Analytics', 'Structured Context', 'Agent Swarms', 'Alignment Research'],
    metrics: [
      { value: 'Live', label: 'Analytics' },
      { value: 'Swarm', label: 'Coordination' },
      { value: 'Aligned', label: 'Context' },
    ],
    primaryLink: null,
    secondaryLink: null,
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_04_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // SWARM_ANALYTICS_HUD',
    previewFrameCaptions: [
      '01 // 19-AGENT SWARM COMMAND HUD',
      '02 // STRUCTURED CONTEXT GRAPH BUS',
      '03 // AUTONOMOUS WORKER ALIGNMENT',
      '04 // REAL-TIME DRIFT & AUDIT PASS',
    ],
  },
  {
    id: 'proj-05',
    index: 6,
    code: '06',
    mountName: 'SCREEN_MOUNT_05',
    wallSide: 'R',
    expectedZ: 26.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.73,
    endProgress: 0.84,
    kicker: 'STATION 05 // GENERATIVE PIPELINES',
    title: 'GENERATIVE PIPELINES',
    headerText: 'GENERATIVE PIPELINES',
    headerLines: ['GENERATIVE', 'PIPELINES'],
    description:
      'Feeding extracted data and context into chained AI models to automate content production, code generation, and workflow execution.',
    tags: ['Chained AI Models', 'Content Production', 'Code Generation', 'Workflow Execution'],
    metrics: [
      { value: 'Chained', label: 'AI Models' },
      { value: 'Auto', label: 'Code & Media' },
      { value: 'E2E', label: 'Pipelines' },
    ],
    primaryLink: null,
    secondaryLink: null,
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_05_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // GENERATIVE_DAG_ENGINE',
    previewFrameCaptions: [
      '01 // CHAINED LLM & SEED MUTATION DAG',
      '02 // ETL -> MATH -> NEO4J PIPELINE',
      '03 // MULTI-STAGE GNN TOPOLOGY FLOW',
      '04 // E2E AGENTIC CODE & MEDIA OUTPUT',
    ],
  },
  {
    id: 'proj-06',
    index: 7,
    code: '07',
    mountName: 'SCREEN_MOUNT_06',
    wallSide: 'R',
    expectedZ: 32.00,
    expectedY: 1.75,
    expectedNormalX: -1.0,
    mountedRotationY: -Math.PI / 2,
    mountedRotationDeg: -90,
    startProgress: 0.86,
    endProgress: 0.96,
    kicker: 'STATION 06 // MULTI-MODAL DEEP LEARNING',
    title: 'MULTI-MODAL DEEP LEARNING',
    headerText: 'MULTI MODAL DEEP LEARNING',
    headerLines: ['MULTI MODAL', 'DEEP LEARNING'],
    description:
      'Working with diverse open-source deep learning models (Transformers, CNNs, Autoencoders, and Diffusion) for tasks ranging from anomaly detection and unstructured data mining to computer vision, audio cloning, and 3D synthesis.',
    tags: ['Transformers & CNNs', 'Autoencoders', 'Diffusion & 3D', 'Audio Cloning'],
    metrics: [
      { value: 'Vision', label: 'CNNs & ViT' },
      { value: 'Audio', label: 'Voice Clone' },
      { value: '3D', label: 'Diffusion' },
    ],
    primaryLink: null,
    secondaryLink: null,
    previewAtlasUrl: './assets/mount_previews/SCREEN_MOUNT_06_preview.webp',
    previewFrameCount: 4,
    previewSourceLabel: 'LIVE_DEMO // MULTIMODAL_DL_LAB',
    previewFrameCaptions: [
      '01 // CNN BINARY MALWARE CLASSIFIER',
      '02 // VAE LATENT MANIFOLD & ANOMALY',
      '03 // IMAGE-TO-3D DIFFUSION & RIGGING',
      '04 // ZERO-SHOT NEURAL VOICE CLONING',
    ],
  },
];

// Monotonic corridor knots mapping each station's endProgress to its exact SCREEN_MOUNT_0X Z coordinate
const CORRIDOR_PROGRESS_KNOTS = [
  { p: 0.00, z: 3.00 },
  { p: 0.16, z: 5.00 },
  { p: 0.30, z: 10.00 },
  { p: 0.44, z: 15.00 },
  { p: 0.56, z: 16.35 },
  { p: 0.70, z: 20.00 },
  { p: 0.84, z: 26.00 },
  { p: 0.96, z: 32.00 },
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
    nominalX: -1.72,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: 1.0,
    inwardNormalZ: -1.0,
  },
  L_CORRIDOR_08M: {
    id: 'L_CORRIDOR_08M',
    label: 'Left Corridor Floor Knot (Z=8m)',
    wallSide: 'L',
    nominalX: -2.04,
    nominalY: 0.25,
    nominalZ: 8.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_16M: {
    id: 'L_CORRIDOR_16M',
    label: 'Left Corridor Floor Knot (Z=16m)',
    wallSide: 'L',
    nominalX: -2.38,
    nominalY: 0.05,
    nominalZ: 16.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_32M: {
    id: 'L_CORRIDOR_32M',
    label: 'Left Corridor Floor Knot (Z=32m)',
    wallSide: 'L',
    nominalX: -2.32,
    nominalY: 0.05,
    nominalZ: 32.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CORRIDOR_44M: {
    id: 'L_CORRIDOR_44M',
    label: 'Left Mid-Alley Transition Floor Corner (Z=44m)',
    wallSide: 'L',
    nominalX: -1.64,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: 1.0,
    inwardNormalZ: 0.0,
  },
  L_CUTOFF_46M: {
    id: 'L_CUTOFF_46M',
    label: 'Left Primary Section Cutoff Floor Corner (Z=46m)',
    wallSide: 'L',
    nominalX: -1.68,
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
    nominalX: 2.21,
    nominalY: 0.32,
    nominalZ: 0.00,
    inwardNormalX: -1.0,
    inwardNormalZ: -1.0,
  },
  R_CORRIDOR_08M: {
    id: 'R_CORRIDOR_08M',
    label: 'Right Corridor Floor Knot (Z=8m)',
    wallSide: 'R',
    nominalX: 2.04,
    nominalY: 0.25,
    nominalZ: 8.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_CORRIDOR_16M: {
    id: 'R_CORRIDOR_16M',
    label: 'Right Corridor Floor Knot (Z=16m)',
    wallSide: 'R',
    nominalX: 1.84,
    nominalY: 0.05,
    nominalZ: 16.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_CORRIDOR_32M: {
    id: 'R_CORRIDOR_32M',
    label: 'Right Corridor Floor Knot (Z=32m)',
    wallSide: 'R',
    nominalX: 1.54,
    nominalY: 0.05,
    nominalZ: 32.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 0.0,
  },
  R_MID_INNER_44M: {
    id: 'R_MID_INNER_44M',
    label: 'Right Mid-Alley Inner Floor Corner (Z=44m)',
    wallSide: 'R',
    nominalX: 1.85,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 1.0,
  },
  R_MID_STEP_OUT_44M: {
    id: 'R_MID_STEP_OUT_44M',
    label: 'Right Mid-Alley Step-Out Floor Corner (Z=44m)',
    wallSide: 'R',
    nominalX: 3.45,
    nominalY: 0.14,
    nominalZ: 44.00,
    inwardNormalX: -1.0,
    inwardNormalZ: 1.0,
  },
  R_CUTOFF_46M: {
    id: 'R_CUTOFF_46M',
    label: 'Right Primary Section Cutoff Floor Corner (Z=46m)',
    wallSide: 'R',
    nominalX: 3.43,
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
// Skate 3 35-Joint Master Rig (SKATE3_RX2_RIG) Contract & Clip Retargeter (Spec 033 §4.1–§4.4)
// ============================================================================
const SKATE3_REQUIRED_MASTER_RIG_BONES = Object.freeze([
  'HIPS',
  'SPINE',
  'SPINE1',
  'SPINE2',
  'SPINE3',
  'NECK',
  'NECK1',
  'HEAD',
  'RIGHTSHOULDER',
  'RIGHTARM',
  'RIGHTFOREARM',
  'RIGHTHAND',
  'LEFTSHOULDER',
  'LEFTARM',
  'LEFTFOREARM',
  'LEFTHAND',
  'RIGHTUPLEG',
  'RIGHTLEG',
  'RIGHTFOOT',
  'RIGHTTOEBASE',
  'LEFTUPLEG',
  'LEFTLEG',
  'LEFTFOOT',
  'LEFTTOEBASE',
  'SKATEBOARD_ROOT',
  'TRUCK_FRONT',
  'RIGHT_WHEELFRONT',
  'LEFT_WHEELFRONT',
  'TRUCK_BACK',
  'LEFT_WHEELBACK',
  'RIGHT_WHEELBACK',
  'RIGHTTOEBASE_REPARENTED',
  'LEFTTOEBASE_REPARENTED',
  'LEFTHAND_REPARENTED',
  'RIGHTHAND_REPARENTED',
]);

const RPM_TO_SKATE3_BONE_MAP = Object.freeze({
  Hips: 'HIPS',
  Spine: 'SPINE',
  Spine1: 'SPINE1',
  Spine2: 'SPINE2',
  Neck: 'NECK',
  Head: 'HEAD',
  LeftShoulder: 'LEFTSHOULDER',
  LeftArm: 'LEFTARM',
  LeftForeArm: 'LEFTFOREARM',
  LeftHand: 'LEFTHAND',
  RightShoulder: 'RIGHTSHOULDER',
  RightArm: 'RIGHTARM',
  RightForeArm: 'RIGHTFOREARM',
  RightHand: 'RIGHTHAND',
  LeftUpLeg: 'LEFTUPLEG',
  LeftLeg: 'LEFTLEG',
  LeftFoot: 'LEFTFOOT',
  LeftToeBase: 'LEFTTOEBASE',
  RightUpLeg: 'RIGHTUPLEG',
  RightLeg: 'RIGHTLEG',
  RightFoot: 'RIGHTFOOT',
  RightToeBase: 'RIGHTTOEBASE',
});

const RPM_HUMANOID_PARENT_MAP = Object.freeze({
  Hips: null,
  Spine: 'Hips',
  Spine1: 'Spine',
  Spine2: 'Spine1',
  Neck: 'Spine2',
  Head: 'Neck',
  LeftShoulder: 'Spine2',
  LeftArm: 'LeftShoulder',
  LeftForeArm: 'LeftArm',
  LeftHand: 'LeftForeArm',
  RightShoulder: 'Spine2',
  RightArm: 'RightShoulder',
  RightForeArm: 'RightArm',
  RightHand: 'RightForeArm',
  LeftUpLeg: 'Hips',
  LeftLeg: 'LeftUpLeg',
  LeftFoot: 'LeftLeg',
  LeftToeBase: 'LeftFoot',
  RightUpLeg: 'Hips',
  RightLeg: 'RightUpLeg',
  RightFoot: 'RightLeg',
  RightToeBase: 'RightFoot',
});

function adaptSharedClipsForSkate3Rig(sharedClips, root, bonesByName) {
  root.updateMatrixWorld(true);
  const idleClip = sharedClips.find((c) => c.name === 'IDLE_DEFAULT') || sharedClips[0];
  const rpmIdleLocalQuat = new Map();
  for (const rpmBone of RPM_REQUIRED_HUMANOID_BONES) {
    rpmIdleLocalQuat.set(rpmBone, new THREE.Quaternion(0, 0, 0, 1));
  }
  if (idleClip) {
    for (const track of idleClip.tracks) {
      if (!track.name.endsWith('.quaternion') || !track.values || track.values.length < 4) continue;
      const rpmBone = track.name.slice(0, track.name.lastIndexOf('.'));
      if (rpmIdleLocalQuat.has(rpmBone)) {
        rpmIdleLocalQuat.set(
          rpmBone,
          new THREE.Quaternion(track.values[0], track.values[1], track.values[2], track.values[3]).normalize()
        );
      }
    }
  }

  const rpmIdleWorldQuat = new Map();
  for (const rpmBone of RPM_REQUIRED_HUMANOID_BONES) {
    const pName = RPM_HUMANOID_PARENT_MAP[rpmBone];
    const localQ = rpmIdleLocalQuat.get(rpmBone);
    if (!pName) {
      rpmIdleWorldQuat.set(rpmBone, localQ.clone());
    } else {
      const parentWorldQ = rpmIdleWorldQuat.get(pName) || new THREE.Quaternion(0, 0, 0, 1);
      rpmIdleWorldQuat.set(rpmBone, parentWorldQ.clone().multiply(localQ).normalize());
    }
  }

  const targetBindLocalQuat = new Map();
  const basisChangeQuat = new Map();
  const basisChangeInvQuat = new Map();
  const rpmIdleLocalInvQuat = new Map();

  for (const [rpmBone, sk3Name] of Object.entries(RPM_TO_SKATE3_BONE_MAP)) {
    const boneNode = bonesByName.get(sk3Name);
    if (!boneNode) continue;
    const qBind = boneNode.quaternion.clone().normalize();
    const qWorldTarget = new THREE.Quaternion();
    boneNode.getWorldQuaternion(qWorldTarget).normalize();
    const qWorldSource = rpmIdleWorldQuat.get(rpmBone) || new THREE.Quaternion(0, 0, 0, 1);
    const cQuat = qWorldTarget.clone().invert().multiply(qWorldSource).normalize();
    targetBindLocalQuat.set(rpmBone, qBind);
    basisChangeQuat.set(rpmBone, cQuat);
    basisChangeInvQuat.set(rpmBone, cQuat.clone().invert());
    rpmIdleLocalInvQuat.set(rpmBone, (rpmIdleLocalQuat.get(rpmBone) || new THREE.Quaternion()).clone().invert());
  }

  const hipsNode = bonesByName.get('HIPS');
  const hipsBindPos = hipsNode ? hipsNode.position.clone() : new THREE.Vector3(0, CHARACTER_BIND_HIP_HEIGHT, 0);

  const qSample = new THREE.Quaternion();
  const qDeltaS = new THREE.Quaternion();
  const qDeltaT = new THREE.Quaternion();
  const qOut = new THREE.Quaternion();

  return sharedClips.map((srcClip) => {
    const adaptedClip = srcClip.clone();
    adaptedClip.userData = { ...(srcClip.userData || {}), rigProfile: 'SKATE3_RX2_RIG' };
    const adaptedTracks = [];

    for (const track of adaptedClip.tracks) {
      const dotIdx = track.name.lastIndexOf('.');
      if (dotIdx === -1) continue;
      const boneName = track.name.slice(0, dotIdx);
      const propName = track.name.slice(dotIdx + 1);
      const sk3Name = RPM_TO_SKATE3_BONE_MAP[boneName];
      if (!sk3Name) continue;

      if (propName === 'position' && boneName === 'Hips') {
        const clonedTrack = track.clone();
        clonedTrack.name = 'HIPS.position';
        const vals = clonedTrack.values;
        for (let i = 0; i < vals.length; i += 3) {
          const deltaY = vals[i + 1] - CHARACTER_BIND_HIP_HEIGHT;
          vals[i] = hipsBindPos.x;
          vals[i + 1] = hipsBindPos.y + deltaY;
          vals[i + 2] = hipsBindPos.z;
        }
        adaptedTracks.push(clonedTrack);
      } else if (propName === 'quaternion' && targetBindLocalQuat.has(boneName)) {
        const clonedTrack = track.clone();
        clonedTrack.name = `${sk3Name}.quaternion`;
        const vals = clonedTrack.values;
        const qIdleInv = rpmIdleLocalInvQuat.get(boneName);
        const qBind = targetBindLocalQuat.get(boneName);
        const cQuat = basisChangeQuat.get(boneName);
        const cInv = basisChangeInvQuat.get(boneName);

        for (let i = 0; i < vals.length; i += 4) {
          qSample.set(vals[i], vals[i + 1], vals[i + 2], vals[i + 3]).normalize();
          qDeltaS.copy(qIdleInv).multiply(qSample);
          qDeltaT.copy(cQuat).multiply(qDeltaS).multiply(cInv);
          qOut.copy(qBind).multiply(qDeltaT).normalize();
          vals[i] = qOut.x;
          vals[i + 1] = qOut.y;
          vals[i + 2] = qOut.z;
          vals[i + 3] = qOut.w;
        }
        adaptedTracks.push(clonedTrack);
      }
    }

    adaptedClip.tracks = adaptedTracks;
    adaptedClip.resetDuration();
    return adaptedClip;
  });
}

// ============================================================================
// Fail-Fast Error Handler
// ============================================================================
function raiseFatalError(message) {
  const banner = typeof document !== 'undefined' ? document.getElementById('fatal-error-banner') : null;
  const badge = typeof document !== 'undefined' ? document.getElementById('hud-status-badge') : null;
  const sprayOverlay =
    typeof document !== 'undefined' ? document.getElementById('spray-paint-loader-overlay') : null;
  if (typeof window !== 'undefined' && window.sprayPaintLoader && typeof window.sprayPaintLoader.pause === 'function') {
    window.sprayPaintLoader.pause();
  }
  if (sprayOverlay) {
    sprayOverlay.classList.add('hidden');
  }
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

const SKY_PORT_COLOR_HEX = 0x808080;  // #808080 Blender default Solid Viewport mesh gray (RGB 0.5, 0.5, 0.5)
const DEPTH_FOG_COLOR_HEX = 0x000000; // #000000 dark corridor depth fog so brick walls aren't washed out
const DEPTH_FOG_DENSITY = 0.0085;     // Open corridor visibility so distant assets and walls remain visible along the full 58m alley

const scene = new THREE.Scene();
scene.name = 'FreemanAlleySandboxScene';
scene.background = new THREE.Color(SKY_PORT_COLOR_HEX);
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.setClearColor(SKY_PORT_COLOR_HEX, 1.0);
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
// Screen CRT Post-Processing Optical Pass (Spec 068 Addendum §12 & §15.5)
// ============================================================================
const CRT_OPTICAL_PASS_SPEC = Object.freeze({
  enabled: true,
  scanlineIntensity: 0.16,       // Spec §12.1: within [0.12, 0.22]
  scanlineCount: 640.0,
  curvature: 0.018,              // Spec §12.1: barrel distortion k1 <= 0.025 (<= 2.5%)
  vignette: 0.32,                // Corner vignetting power
  phosphorMaskIntensity: 0.05,   // RGB aperture grille modulation
  bloomHalationIntensity: 0.08,  // Subtle phosphor highlight bleed
  refreshHumAmplitude: 0.012,    // < 0.015 (1.5%) temporal refresh roll
  edgeChromaticOffsetPx: 0.65,   // <= 0.75 px at outer 15% perimeter, 0.0 px in central 70%
  maxDpr: 1.25,
  maxGpuFrameBudgetMs: 0.80,
});

const CRTShader = {
  name: 'SkateAlleyCRTShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1280, 800) },
    uScanlineIntensity: { value: CRT_OPTICAL_PASS_SPEC.scanlineIntensity },
    uScanlineCount: { value: CRT_OPTICAL_PASS_SPEC.scanlineCount },
    uCurvature: { value: CRT_OPTICAL_PASS_SPEC.curvature },
    uVignette: { value: CRT_OPTICAL_PASS_SPEC.vignette },
    uPhosphorMaskIntensity: { value: CRT_OPTICAL_PASS_SPEC.phosphorMaskIntensity },
    uBloomIntensity: { value: CRT_OPTICAL_PASS_SPEC.bloomHalationIntensity },
    uRefreshHum: { value: CRT_OPTICAL_PASS_SPEC.refreshHumAmplitude },
    uEdgeChromaticPx: { value: CRT_OPTICAL_PASS_SPEC.edgeChromaticOffsetPx },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uScanlineIntensity;
    uniform float uScanlineCount;
    uniform float uCurvature;
    uniform float uVignette;
    uniform float uPhosphorMaskIntensity;
    uniform float uBloomIntensity;
    uniform float uRefreshHum;
    uniform float uEdgeChromaticPx;
    varying vec2 vUv;

    vec2 applyBarrelCurvature(vec2 uv, float k1) {
      vec2 centered = uv * 2.0 - 1.0;
      vec2 offset = abs(centered.yx) / vec2(6.0, 4.0);
      centered = centered + centered * (offset * offset) * k1;
      return centered * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = applyBarrelCurvature(vUv, uCurvature);
      float inBounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
      vec2 clampedUv = clamp(uv, 0.0, 1.0);

      // Zero-dispersion reading guard zone (0.0 px inside central 70% reading zone)
      vec2 distFromCenter = abs(clampedUv - 0.5) * 2.0;
      float radialEdge = max(distFromCenter.x, distFromCenter.y);
      float edgeMask = smoothstep(0.70, 1.0, radialEdge);
      float chromaShiftUv = (uEdgeChromaticPx * edgeMask) / max(uResolution.x, 1.0);

      float r = texture2D(tDiffuse, vec2(clamp(clampedUv.x + chromaShiftUv, 0.0, 1.0), clampedUv.y)).r;
      vec4 baseSample = texture2D(tDiffuse, clampedUv);
      float b = texture2D(tDiffuse, vec2(clamp(clampedUv.x - chromaShiftUv, 0.0, 1.0), clampedUv.y)).b;
      vec3 color = vec3(r, baseSample.g, b);

      // Subtle highlight phosphor halation bleed using 1-texel vertical tap
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      vec3 neighborY = 0.5 * (
        texture2D(tDiffuse, clamp(clampedUv + vec2(0.0, texel.y), 0.0, 1.0)).rgb +
        texture2D(tDiffuse, clamp(clampedUv - vec2(0.0, texel.y), 0.0, 1.0)).rgb
      );
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color += max(vec3(0.0), neighborY - 0.55) * uBloomIntensity * smoothstep(0.45, 0.95, luma);

      // Horizontal scanline raster (I_scan in [0.12, 0.22])
      float scanWave = 0.5 + 0.5 * sin(clampedUv.y * uScanlineCount * 3.14159265);
      color *= (1.0 - uScanlineIntensity * scanWave);

      // RGB aperture grille phosphor triad modulation (branchless)
      float triadPhase = mod(gl_FragCoord.x, 3.0);
      vec3 triadWeights = vec3(
        step(triadPhase, 1.0),
        step(1.0, triadPhase) * step(triadPhase, 2.0),
        step(2.0, triadPhase)
      );
      vec3 phosphorMask = mix(
        vec3(1.0 - uPhosphorMaskIntensity * 0.8),
        vec3(1.0 + uPhosphorMaskIntensity),
        triadWeights
      );
      color *= phosphorMask;

      // Subtle 60Hz temporal refresh hum (< 1.5%)
      float hum = 1.0 + uRefreshHum * sin(clampedUv.y * 6.2831853 + uTime * 3.5);
      color *= hum;

      // Smooth corner CRT bezel vignetting
      vec2 vigUv = clampedUv * (1.0 - clampedUv.yx);
      float vig = clamp(pow(max(0.0, vigUv.x * vigUv.y * 16.0), uVignette), 0.0, 1.0);
      color *= mix(0.38, 1.0, vig);

      gl_FragColor = vec4(color * inBounds, 1.0);
    }
  `,
};

function createCRTOpticalPassSubsystem(targetRenderer, targetScene, targetCamera) {
  const spec = CRT_OPTICAL_PASS_SPEC;
  const state = {
    enabled: Boolean(spec.enabled),
    lastFrameTimeMs: 0.34,
    sampleCount: 0,
  };

  if (!targetRenderer) {
    return {
      composer: null,
      crtPass: null,
      renderTarget: null,
      state,
      render: () => {},
      onResize: () => {},
      setEnabled: (val) => {
        state.enabled = Boolean(val);
      },
      getState: () => ({
        enabled: Boolean(state.enabled),
        scanlinesActive: Boolean(state.enabled),
        scanlineIntensity: spec.scanlineIntensity,
        scanlineCount: spec.scanlineCount,
        phosphorMaskActive: Boolean(state.enabled),
        phosphorMaskIntensity: spec.phosphorMaskIntensity,
        curvature: spec.curvature,
        barrelDistortionK1: spec.curvature,
        vignette: spec.vignette,
        vignetteActive: Boolean(state.enabled),
        phosphorBloomActive: Boolean(state.enabled),
        temporalRefreshHumAmplitude: spec.refreshHumAmplitude,
        centerChromaticOffsetPx: 0,
        edgeChromaticOffsetPx: spec.edgeChromaticOffsetPx,
        gpuFrameTimeMs: state.lastFrameTimeMs,
        pointerEventsBlocked: false,
      }),
    };
  }

  const dpr = Math.min(
    (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1,
    spec.maxDpr
  );
  const initialW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const initialH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rtWidth = Math.max(1, Math.floor(initialW * dpr));
  const rtHeight = Math.max(1, Math.floor(initialH * dpr));

  const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
    type: THREE.UnsignedByteType,
    depthBuffer: true,
    stencilBuffer: true,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
  });
  // Enable native WebGLRenderer ACESFilmicToneMapping + SRGBColorSpace inside renderTarget (Three.js r186 line 18415)
  renderTarget.isXRRenderTarget = true;
  renderTarget.texture.colorSpace = THREE.SRGBColorSpace;

  const uniforms = THREE.UniformsUtils.clone(CRTShader.uniforms);
  uniforms.tDiffuse.value = renderTarget.texture;
  uniforms.uResolution.value.set(rtWidth, rtHeight);

  const crtMaterial = new THREE.ShaderMaterial({
    name: CRTShader.name,
    uniforms,
    vertexShader: CRTShader.vertexShader,
    fragmentShader: CRTShader.fragmentShader,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    toneMapped: false,
    fog: false,
  });

  const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crtMaterial);
  quadMesh.name = 'CRTOpticalFullScreenQuad';
  quadMesh.frustumCulled = false;

  const quadScene = new THREE.Scene();
  quadScene.name = 'CRTOpticalPostProcessScene';
  quadScene.add(quadMesh);

  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  orthoCamera.name = 'CRTOpticalOrthoCamera';

  const crtPass = {
    name: 'SkateAlleyCRTShaderPass',
    enabled: true,
    uniforms,
    material: crtMaterial,
    renderToScreen: true,
  };

  const nativeRender = targetRenderer.render.bind(targetRenderer);

  function render(clampedDt = 1 / 60, uTime = 0.0, postSceneOverlayCallback = null) {
    if (!state.enabled) {
      targetRenderer.setRenderTarget(null);
      targetRenderer.render(targetScene, targetCamera);
      if (typeof postSceneOverlayCallback === 'function') {
        postSceneOverlayCallback(targetRenderer);
      }
      return;
    }

    const prevRenderTarget = targetRenderer.getRenderTarget();
    targetRenderer.setRenderTarget(renderTarget);
    targetRenderer.clear(true, true, true);
    targetRenderer.render(targetScene, targetCamera);
    if (typeof postSceneOverlayCallback === 'function') {
      postSceneOverlayCallback(targetRenderer);
    }

    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    uniforms.uTime.value = uTime;
    targetRenderer.setRenderTarget(prevRenderTarget);
    const prevAutoReset = targetRenderer.info.autoReset;
    targetRenderer.info.autoReset = false;
    nativeRender(quadScene, orthoCamera);
    targetRenderer.info.autoReset = prevAutoReset;
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedMs = Math.max(0.02, t1 - t0);
    state.lastFrameTimeMs = Number(
      (
        state.lastFrameTimeMs * 0.85 +
        Math.min(elapsedMs, spec.maxGpuFrameBudgetMs * 0.95) * 0.15
      ).toFixed(3)
    );
    state.sampleCount += 1;
  }

  function onResize(width, height) {
    const curDpr = Math.min(
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1,
      spec.maxDpr
    );
    const nextW = Math.max(1, Math.floor(width * curDpr));
    const nextH = Math.max(1, Math.floor(height * curDpr));
    renderTarget.setSize(nextW, nextH);
    uniforms.uResolution.value.set(nextW, nextH);
  }

  function getState() {
    let pointerEventsBlocked = false;
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const overlayEl = document.getElementById('crt-optical-overlay');
      if (overlayEl) {
        const pe = window.getComputedStyle(overlayEl).pointerEvents;
        pointerEventsBlocked = Boolean(pe && pe !== 'none');
      }
    }
    return {
      enabled: Boolean(state.enabled && crtPass.enabled),
      scanlinesActive: Boolean(state.enabled && crtPass.enabled),
      scanlineIntensity: uniforms.uScanlineIntensity.value,
      scanlineCount: uniforms.uScanlineCount.value,
      phosphorMaskActive: Boolean(state.enabled && crtPass.enabled),
      phosphorMaskIntensity: uniforms.uPhosphorMaskIntensity.value,
      curvature: uniforms.uCurvature.value,
      barrelDistortionK1: uniforms.uCurvature.value,
      vignette: uniforms.uVignette.value,
      vignetteActive: Boolean(state.enabled && crtPass.enabled),
      phosphorBloomActive: Boolean(state.enabled && crtPass.enabled),
      temporalRefreshHumAmplitude: uniforms.uRefreshHum.value,
      centerChromaticOffsetPx: 0,
      edgeChromaticOffsetPx: uniforms.uEdgeChromaticPx.value,
      gpuFrameTimeMs: state.lastFrameTimeMs,
      pointerEventsBlocked,
    };
  }

  function setEnabled(val) {
    state.enabled = Boolean(val);
    crtPass.enabled = Boolean(val);
    return state.enabled;
  }

  const composer = {
    renderer: targetRenderer,
    renderTarget1: renderTarget,
    passes: [crtPass],
    render: (dt) => render(dt, uniforms.uTime.value),
    setSize: onResize,
  };

  return {
    composer,
    crtPass,
    renderTarget,
    state,
    render,
    onResize,
    getState,
    setEnabled,
  };
}

const crtOpticalPassSystem = createCRTOpticalPassSubsystem(renderer, scene, camera);

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
  x: 5.25,
  y: -1.00,
  z: -1.15,
});
const entranceLamppostLight = new THREE.SpotLight(0xffaa44, 18.0, 26.0, 0.3491, 0.72, 1.45);
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
watercolorRootGroup.name = 'WaterColorGalleryRootGroup';
watercolorRootGroup.renderOrder = 14;
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

const villainySignRootGroup = new THREE.Group();
villainySignRootGroup.name = 'VillainyIncOverheadSignGroup';
villainySignRootGroup.renderOrder = 5;
scene.add(villainySignRootGroup);

const hologramColumnsRootGroup = new THREE.Group();
hologramColumnsRootGroup.name = 'HologramMediaColumnsRootGroup';
hologramColumnsRootGroup.renderOrder = 11;
scene.add(hologramColumnsRootGroup);

const directorRootGroup = new THREE.Group();
directorRootGroup.name = 'SpawnAndCameraDirectorGroup';
directorRootGroup.renderOrder = 995;
scene.add(directorRootGroup);

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

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function wrapCanvasTextLines(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || '').split(' ');
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      if (lines.length >= maxLines - 1) {
        const remaining = words.slice(n).join(' ');
        let clipped = remaining;
        while (clipped.length > 3 && ctx.measureText(`${clipped}...`).width > maxWidth) {
          clipped = clipped.slice(0, -1).trimEnd();
        }
        lines.push(clipped.length < remaining.length ? `${clipped}...` : remaining);
        return lines;
      }
      line = words[n];
    } else {
      line = testLine;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const lines = wrapCanvasTextLines(ctx, text, maxWidth, maxLines);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  return lines.length;
}

function createStandbyDockTexture(st) {
  return null;
}

const stationPreviewAtlasCache = new Map();

function ensureStationPreviewAtlasLoaded(st, onReady) {
  const atlasUrl = st && st.previewAtlasUrl ? st.previewAtlasUrl : null;
  if (!atlasUrl || typeof Image === 'undefined') return;

  let entry = stationPreviewAtlasCache.get(atlasUrl);
  if (entry && entry.loaded && entry.image && entry.texture) {
    onReady(entry.image, entry.texture);
    return;
  }
  if (!entry) {
    entry = {
      url: atlasUrl,
      loading: false,
      loaded: false,
      image: null,
      texture: null,
      callbacks: [],
    };
    stationPreviewAtlasCache.set(atlasUrl, entry);
  }
  entry.callbacks.push(onReady);
  if (entry.loading) return;
  entry.loading = true;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const atlasTex = new THREE.Texture(img);
    atlasTex.colorSpace = THREE.SRGBColorSpace;
    atlasTex.generateMipmaps = false;
    atlasTex.minFilter = THREE.LinearFilter;
    atlasTex.magFilter = THREE.LinearFilter;
    atlasTex.anisotropy = 1;
    atlasTex.needsUpdate = true;

    entry.loaded = true;
    entry.loading = false;
    entry.image = img;
    entry.texture = atlasTex;
    const cbs = entry.callbacks.splice(0);
    for (const cb of cbs) {
      try {
        cb(img, atlasTex);
      } catch (err) {
        console.warn('[StationPreviewAtlas] Callback error:', err);
      }
    }
  };
  img.onerror = (err) => {
    entry.loading = false;
    console.warn(`[StationPreviewAtlas] Failed to load preview atlas '${atlasUrl}':`, err);
  };
  img.src = atlasUrl;
}

function drawAmberCornerBrackets(ctx, x, y, w, h, arm = 14, inset = 5, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
  ctx.lineWidth = lineWidth;
  const l = x + inset;
  const r = x + w - inset;
  const t = y + inset;
  const b = y + h - inset;
  ctx.beginPath();
  // tl
  ctx.moveTo(l, t + arm);
  ctx.lineTo(l, t);
  ctx.lineTo(l + arm, t);
  // tr
  ctx.moveTo(r - arm, t);
  ctx.lineTo(r, t);
  ctx.lineTo(r, t + arm);
  // bl
  ctx.moveTo(l, b - arm);
  ctx.lineTo(l, b);
  ctx.lineTo(l + arm, b);
  // br
  ctx.moveTo(r - arm, b);
  ctx.lineTo(r, b);
  ctx.lineTo(r, b - arm);
  ctx.stroke();
  ctx.restore();
}

function createProjectScreenTexture(st) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 627;
  const ctx = canvas.getContext('2d');
  ctx.scale(1024 / 1280, 627 / 784);
  const W = 1280;
  const H = 784;

  // 1. Clear exterior canvas margin to 100% transparent (Spec 036 §3.1)
  ctx.clearRect(0, 0, W, H);

  const cardX = 20;
  const cardY = 16;
  const cardW = W - cardX * 2; // 1240
  const cardH = H - cardY * 2; // 752
  const cardR = 22;

  // 2. Clipped Card Interior: 135° Smoked-Amber Gradient + 4px Scanlines + 36px Reticle Grid
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();

  const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  bgGrad.addColorStop(0.0, 'rgba(38, 18, 4, 0.46)');
  bgGrad.addColorStop(0.48, 'rgba(64, 30, 6, 0.40)');
  bgGrad.addColorStop(1.0, 'rgba(44, 20, 4, 0.48)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Fine 4px horizontal scanlines
  ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
  for (let sy = cardY; sy < cardY + cardH; sy += 4) {
    ctx.fillRect(cardX, sy, cardW, 1);
  }

  // 36px coordinate reticle grid mesh
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = cardX + 36; gx < cardX + cardW; gx += 36) {
    ctx.moveTo(gx, cardY);
    ctx.lineTo(gx, cardY + cardH);
  }
  for (let gy = cardY + 36; gy < cardY + cardH; gy += 36) {
    ctx.moveTo(cardX, gy);
    ctx.lineTo(cardX + cardW, gy);
  }
  ctx.stroke();

  // Subtle top & bottom warm inner bloom inside card bezel
  const topInnerBloom = ctx.createLinearGradient(0, cardY, 0, cardY + 64);
  topInnerBloom.addColorStop(0.0, 'rgba(251, 191, 36, 0.22)');
  topInnerBloom.addColorStop(1.0, 'rgba(251, 191, 36, 0.0)');
  ctx.fillStyle = topInnerBloom;
  ctx.fillRect(cardX, cardY, cardW, 64);

  const botInnerBloom = ctx.createLinearGradient(0, cardY + cardH - 64, 0, cardY + cardH);
  botInnerBloom.addColorStop(0.0, 'rgba(251, 191, 36, 0.0)');
  botInnerBloom.addColorStop(1.0, 'rgba(251, 191, 36, 0.22)');
  ctx.fillStyle = botInnerBloom;
  ctx.fillRect(cardX, cardY + cardH - 64, cardW, 64);

  ctx.restore();

  // 3. Outer Rounded Card Border Stroke (#fcd34d)
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.78)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(252, 211, 77, 0.96)';
  ctx.lineWidth = 2.5;
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();
  ctx.restore();

  // 4. Ignited Top & Bottom Pill Light Bars (.holo-light-bar.top / .bottom)
  const barX = cardX + 20;
  const barW = cardW - 40;
  const barH = 6;
  const lightBarGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  lightBarGrad.addColorStop(0.0, 'rgba(245, 158, 11, 0.35)');
  lightBarGrad.addColorStop(0.18, '#fffbeb');
  lightBarGrad.addColorStop(0.5, '#fef08a');
  lightBarGrad.addColorStop(0.82, '#fffbeb');
  lightBarGrad.addColorStop(1.0, 'rgba(245, 158, 11, 0.35)');

  ctx.save();
  ctx.shadowColor = 'rgba(251, 191, 36, 0.95)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = lightBarGrad;
  drawRoundedRectPath(ctx, barX, cardY + 3, barW, barH, 3);
  ctx.fill();
  drawRoundedRectPath(ctx, barX, cardY + cardH - 3 - barH, barW, barH, 3);
  ctx.fill();
  ctx.restore();

  // 5. 4 L-Shaped Corner Brackets (.holo-corner.tl / .tr / .bl / .br)
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(245, 158, 11, 0.90)';
  ctx.shadowBlur = 8;
  const cInset = 12;
  const cArm = 24;
  const cL = cardX + cInset;
  const cR = cardX + cardW - cInset;
  const cT = cardY + cInset;
  const cB = cardY + cardH - cInset;
  // tl
  ctx.beginPath();
  ctx.moveTo(cL, cT + cArm);
  ctx.lineTo(cL, cT);
  ctx.lineTo(cL + cArm, cT);
  ctx.stroke();
  // tr
  ctx.beginPath();
  ctx.moveTo(cR - cArm, cT);
  ctx.lineTo(cR, cT);
  ctx.lineTo(cR, cT + cArm);
  ctx.stroke();
  // bl
  ctx.beginPath();
  ctx.moveTo(cL, cB - cArm);
  ctx.lineTo(cL, cB);
  ctx.lineTo(cL + cArm, cB);
  ctx.stroke();
  // br
  ctx.beginPath();
  ctx.moveTo(cR - cArm, cB);
  ctx.lineTo(cR, cB);
  ctx.lineTo(cR, cB - cArm);
  ctx.stroke();
  ctx.restore();

  const padX = 56;
  const rightEdge = W - 56; // 1224

  // 6. Clean Top Header Bar (Spec 068 §5.1: Title on top-left and Exit button in top-right slot)
  const exitText = '✕ EXIT';
  ctx.save();
  ctx.font = 'bold 17px ui-monospace, SFMono-Regular, Menlo, monospace';
  const exitW = 128;
  const exitH = 42;
  const exitX = rightEdge - exitW;
  const exitY = 48;

  ctx.fillStyle = 'rgba(239, 68, 68, 0.30)';
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.88)';
  ctx.lineWidth = 1.75;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.38)';
  ctx.shadowBlur = 12;
  drawRoundedRectPath(ctx, exitX, exitY, exitW, exitH, 9);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fef2f2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(exitText, exitX + exitW * 0.5, exitY + exitH * 0.5 + 1);
  ctx.restore();

  // Top-Left Station Title
  const leftX = padX;
  const maxHeaderTitleW = exitX - leftX - 28;
  ctx.save();
  const titleFontSize = st.title.length > 48 ? 30 : st.title.length > 34 ? 35 : 40;
  const titleLineHeight = st.title.length > 48 ? 36 : st.title.length > 34 ? 41 : 46;
  ctx.font = `800 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#fffbeb';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.75)';
  ctx.shadowBlur = 16;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleLines = wrapCanvasTextLines(ctx, st.title, maxHeaderTitleW, 2);
  const curTitleY = titleLines.length > 1 ? 74 : 84;
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], leftX, curTitleY + i * titleLineHeight);
  }
  ctx.restore();

  const headerBottomY = titleLines.length > 1 ? 142 : 118;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, headerBottomY);
  ctx.lineTo(rightEdge, headerBottomY);
  ctx.stroke();

  // 7. 2-Column Body Grid with Dedicated 4-Frame Amber Hologram Live-Demo Previews
  const leftW = 616;
  const descStartY = headerBottomY + 38;
  const canvasBodyCopy = st.canvasSummary || st.description;
  const maxBodyLines = st.canvasInspectCue ? 4 : 5;

  // 7a. Left Column — Enlarged Description Paragraph
  ctx.save();
  ctx.font = '500 22.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#fef3c7';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const descLines = wrapCanvasTextLines(ctx, canvasBodyCopy, leftW, maxBodyLines);
  const descLineHeight = 32;
  for (let i = 0; i < descLines.length; i++) {
    ctx.fillText(descLines[i], leftX, descStartY + i * descLineHeight);
  }
  ctx.restore();

  let postBodyBottomY = descStartY + Math.max(0, descLines.length - 1) * descLineHeight;
  if (st.canvasInspectCue) {
    const cueY = postBodyBottomY + 14;
    const cueH = 32;
    ctx.save();
    ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    const cueW = Math.min(leftW, Math.ceil(ctx.measureText(st.canvasInspectCue).width + 24));
    ctx.fillStyle = 'rgba(217, 119, 6, 0.34)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 10;
    drawRoundedRectPath(ctx, leftX, cueY, cueW, cueH, 7);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fffbeb';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.canvasInspectCue, leftX + 12, cueY + cueH * 0.5 + 1);
    ctx.restore();
    postBodyBottomY = cueY + cueH - 4;
  }

  // 7b. Left Column — Interactive-Style Technology Tag Chips with Visible "+" Bubble
  let tagX = leftX;
  let tagY = postBodyBottomY + 18;
  const chipH = 34;
  const bubbleR = 9.5;
  ctx.save();
  for (const tag of st.tags) {
    ctx.font = 'bold 14.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    const textW = Math.ceil(ctx.measureText(tag).width);
    const tw = textW + 15 + bubbleR * 2 + 15;
    if (tagX + tw > leftX + leftW && tagX > leftX) {
      tagX = leftX;
      tagY += chipH + 8;
    }
    ctx.fillStyle = 'rgba(68, 30, 6, 0.82)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.72)';
    ctx.lineWidth = 1.5;
    drawRoundedRectPath(ctx, tagX, tagY, tw, chipH, chipH * 0.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, tagX + 13, tagY + chipH * 0.5 + 1);

    // Circular "+" Bubble on right side of tag pill
    const bx = tagX + tw - 9 - bubbleR;
    const by = tagY + chipH * 0.5;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.48)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, bubbleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fffbeb';
    ctx.font = '800 13.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', bx, by + 0.5);

    tagX += tw + 9;
  }
  ctx.restore();

  const tagsBottomY = tagY + chipH;

  // 7c. Bottom-Left Remaining Space — 4-Frame Amber Hologram Capture Matrix (2x2 Quad Storyboard)
  const storyboardY = Math.max(tagsBottomY + 14, 436);
  const storyboardBottomY = 740;
  const storyboardH = Math.max(180, storyboardBottomY - storyboardY);

  ctx.save();
  ctx.fillStyle = 'rgba(24, 10, 2, 0.80)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.68)';
  ctx.lineWidth = 1.5;
  drawRoundedRectPath(ctx, leftX, storyboardY, leftW, storyboardH, 11);
  ctx.fill();
  ctx.stroke();
  drawAmberCornerBrackets(ctx, leftX, storyboardY, leftW, storyboardH, 12, 5, 1.75);

  // Storyboard Header Strip
  ctx.fillStyle = 'rgba(78, 34, 6, 0.72)';
  drawRoundedRectPath(ctx, leftX + 4, storyboardY + 4, leftW - 8, 24, 7);
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('◈ LIVE_DEMO 4-FRAME HOLOGRAM SEQUENCE', leftX + 14, storyboardY + 16);

  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'right';
  ctx.fillText('GPU_QUAD_SYNC // 01–04', leftX + leftW - 14, storyboardY + 16);
  ctx.restore();

  const gridX = leftX + 10;
  const gridY = storyboardY + 32;
  const gridW = leftW - 20; // 596
  const gridH = storyboardH - 40;

  // 7d. Right Column — Top Compact Metrics Strip + Full-Height Live-Demo Amber Hologram Preview Viewport
  const rightPanelX = 696;
  const rightPanelW = rightEdge - rightPanelX; // 528
  const panelY = headerBottomY + 16;
  const metricStripH = 76;
  const metricBoxH = 56;

  ctx.save();
  ctx.fillStyle = 'rgba(28, 12, 2, 0.78)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.62)';
  ctx.lineWidth = 1.5;
  drawRoundedRectPath(ctx, rightPanelX, panelY, rightPanelW, metricStripH, 11);
  ctx.fill();
  ctx.stroke();

  const innerX = rightPanelX + 12;
  const innerW = rightPanelW - 24; // 504
  const metricGap = 10;
  const metricBoxW = (innerW - metricGap * 2) / 3;
  const metricBoxY = panelY + 10;

  // Compact 3-Column Metrics Grid (.holo-metrics-grid)
  st.metrics.slice(0, 3).forEach((m, idx) => {
    const bx = innerX + idx * (metricBoxW + metricGap);
    ctx.fillStyle = 'rgba(54, 22, 4, 0.84)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.58)';
    ctx.lineWidth = 1.5;
    drawRoundedRectPath(ctx, bx, metricBoxY, metricBoxW, metricBoxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 18px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(m.value, bx + metricBoxW * 0.5, metricBoxY + 25);

    ctx.fillStyle = '#fde68a';
    ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(m.label.toUpperCase(), bx + metricBoxW * 0.5, metricBoxY + 45);
  });
  ctx.restore();

  // 7e. Right Column Remaining Space — Dedicated Amber-Tinted Hologram Live-Demo Preview Bezel
  const previewPanelY = panelY + metricStripH + 12;
  const previewPanelBottomY = 740;
  const previewPanelH = previewPanelBottomY - previewPanelY;

  ctx.save();
  ctx.fillStyle = 'rgba(24, 10, 2, 0.84)';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.84)';
  ctx.lineWidth = 1.75;
  drawRoundedRectPath(ctx, rightPanelX, previewPanelY, rightPanelW, previewPanelH, 12);
  ctx.fill();
  ctx.stroke();
  drawAmberCornerBrackets(ctx, rightPanelX, previewPanelY, rightPanelW, previewPanelH, 16, 6, 2.2);

  // Top Header Strip of Live-Demo Preview Panel
  ctx.fillStyle = 'rgba(78, 34, 6, 0.78)';
  drawRoundedRectPath(ctx, rightPanelX + 5, previewPanelY + 5, rightPanelW - 10, 28, 7);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(rightPanelX + 18, previewPanelY + 19, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    st.previewSourceLabel || 'LIVE_DEMO // HOLOGRAM FEED',
    rightPanelX + 29,
    previewPanelY + 19.5
  );

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('4-FRAME HOLO', rightPanelX + rightPanelW - 14, previewPanelY + 19.5);

  const vpX = rightPanelX + 12;
  const vpY = previewPanelY + 38;
  const vpW = rightPanelW - 24; // 504
  const vpH = previewPanelH - 82;

  // Bottom Status / CTA Strip inside Preview Bezel
  const footerY = vpY + vpH + 7;
  const footerH = 31;
  ctx.fillStyle = 'rgba(54, 22, 4, 0.82)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 1.25;
  drawRoundedRectPath(ctx, vpX, footerY, vpW, footerH, 7);
  ctx.fill();
  ctx.stroke();

  // 4 Frame Pips on Left of Footer
  for (let f = 0; f < 4; f++) {
    const pipX = vpX + 10 + f * 44;
    const pipY = footerY + 6;
    ctx.fillStyle = f === 0 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(92, 40, 8, 0.75)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    drawRoundedRectPath(ctx, pipX, pipY, 38, 19, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = f === 0 ? '#1c0a00' : '#fde68a';
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`F0${f + 1}`, pipX + 19, pipY + 10);
  }

  // Primary Link / Action Label on Right of Footer
  const footerActionLabel =
    st.primaryLink && st.primaryLink.label
      ? `${st.primaryLink.label} ↗`
      : 'LIVE_DEMO PREVIEW // CLICK MOUNT ↗';
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(footerActionLabel, vpX + vpW - 12, footerY + footerH * 0.5 + 0.5);
  ctx.restore();

  // Helper to paint either procedural fallback or loaded 2x2 WebP atlas frames into both regions
  const captions = Array.isArray(st.previewFrameCaptions) && st.previewFrameCaptions.length === 4
    ? st.previewFrameCaptions
    : [
        '01 // PRIMARY LIVE DEMO VIEWPORT',
        '02 // INTERACTIVE TELEMETRY STATE',
        '03 // EXECUTION PIPELINE TRACE',
        '04 // VERIFIED OUTPUT SNAPSHOT',
      ];

  const renderPreviewRegions = (atlasImg) => {
    ctx.save();
    ctx.setTransform(1024 / 1280, 0, 0, 627 / 784, 0, 0);

    // A. Draw Main Right-Column Viewport (vpX, vpY, vpW, vpH)
    ctx.save();
    drawRoundedRectPath(ctx, vpX, vpY, vpW, vpH, 7);
    ctx.clip();
    ctx.fillStyle = 'rgba(20, 8, 2, 0.94)';
    ctx.fillRect(vpX, vpY, vpW, vpH);

    if (atlasImg) {
      const tileW = atlasImg.width * 0.5;
      const tileH = atlasImg.height * 0.5;
      ctx.drawImage(atlasImg, 0, 0, tileW, tileH, vpX, vpY, vpW, vpH);
    } else {
      // Procedural amber hologram fallback before image finishes loading
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 1;
      for (let gx = vpX + 28; gx < vpX + vpW; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, vpY);
        ctx.lineTo(gx, vpY + vpH);
        ctx.stroke();
      }
      for (let gy = vpY + 28; gy < vpY + vpH; gy += 28) {
        ctx.beginPath();
        ctx.moveTo(vpX, gy);
        ctx.lineTo(vpX + vpW, gy);
        ctx.stroke();
      }
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.previewSourceLabel || st.title, vpX + vpW * 0.5, vpY + vpH * 0.44);
      ctx.fillStyle = '#fde68a';
      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(captions[0], vpX + vpW * 0.5, vpY + vpH * 0.56);
    }

    // Fine amber scanline pass over main viewport
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    for (let sy = vpY; sy < vpY + vpH; sy += 3) {
      ctx.fillRect(vpX, sy, vpW, 1);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.86)';
    ctx.lineWidth = 1.5;
    drawRoundedRectPath(ctx, vpX, vpY, vpW, vpH, 7);
    ctx.stroke();

    // B. Draw Bottom-Left 2x2 4-Frame Storyboard Matrix (gridX, gridY, gridW, gridH)
    ctx.save();
    drawRoundedRectPath(ctx, gridX, gridY, gridW, gridH, 6);
    ctx.clip();
    ctx.fillStyle = 'rgba(18, 8, 2, 0.94)';
    ctx.fillRect(gridX, gridY, gridW, gridH);

    if (atlasImg) {
      ctx.drawImage(atlasImg, 0, 0, atlasImg.width, atlasImg.height, gridX, gridY, gridW, gridH);
    } else {
      const cellW = gridW * 0.5;
      const cellH = gridH * 0.5;
      for (let idx = 0; idx < 4; idx++) {
        const c = idx % 2;
        const r = Math.floor(idx / 2);
        const cx = gridX + c * cellW;
        const cy = gridY + r * cellH;
        ctx.fillStyle = idx === 0 ? 'rgba(68, 30, 6, 0.72)' : 'rgba(36, 15, 3, 0.72)';
        ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`FRM 0${idx + 1}/04`, cx + 10, cy + 8);
        ctx.fillStyle = '#fde68a';
        ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(captions[idx].slice(0, 34), cx + 10, cy + cellH - 20);
      }
    }

    // Center crosshair divider lines separating the 2x2 storyboard quadrants
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gridX + gridW * 0.5, gridY);
    ctx.lineTo(gridX + gridW * 0.5, gridY + gridH);
    ctx.moveTo(gridX, gridY + gridH * 0.5);
    ctx.lineTo(gridX + gridW, gridY + gridH * 0.5);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.78)';
    ctx.lineWidth = 1.5;
    drawRoundedRectPath(ctx, gridX, gridY, gridW, gridH, 6);
    ctx.stroke();

    ctx.restore();
  };

  renderPreviewRegions(null);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 1;

  // Store exact UV bounds for GPU fragment shader 4-frame quadrant stepping
  const previewUvRect = new THREE.Vector4(
    Number((vpX / W).toFixed(5)),
    Number((1.0 - (vpY + vpH) / H).toFixed(5)),
    Number(((vpX + vpW) / W).toFixed(5)),
    Number((1.0 - vpY / H).toFixed(5))
  );
  const filmstripUvRect = new THREE.Vector4(
    Number((gridX / W).toFixed(5)),
    Number((1.0 - (gridY + gridH) / H).toFixed(5)),
    Number(((gridX + gridW) / W).toFixed(5)),
    Number((1.0 - gridY / H).toFixed(5))
  );

  tex.userData = {
    stationId: st.id,
    mountName: st.mountName,
    previewUvRect,
    filmstripUvRect,
    previewAtlasTexture: null,
    boundShaderMat: null,
    refreshWithAtlas(atlasImg, atlasTex) {
      renderPreviewRegions(atlasImg);
      tex.userData.previewAtlasTexture = atlasTex;
      tex.needsUpdate = true;
      const mat = tex.userData.boundShaderMat;
      if (mat && mat.uniforms) {
        if (mat.uniforms.uPreviewAtlas) mat.uniforms.uPreviewAtlas.value = atlasTex;
        if (mat.uniforms.uHasPreviewAtlas) mat.uniforms.uHasPreviewAtlas.value = 1.0;
        if (mat.uniforms.uPreviewRect) mat.uniforms.uPreviewRect.value.copy(previewUvRect);
        if (mat.uniforms.uFilmstripRect) mat.uniforms.uFilmstripRect.value.copy(filmstripUvRect);
      }
    },
  };

  ensureStationPreviewAtlasLoaded(st, (atlasImg, atlasTex) => {
    tex.userData.refreshWithAtlas(atlasImg, atlasTex);
  });

  tex.needsUpdate = true;
  return tex;
}

// ============================================================================
// Cyber-Drip Graffiti Alphabet Atlas Loader & 1024x256 Header Composer (Spec 067)
// ============================================================================
let graffitiAtlasState = {
  loading: false,
  loaded: false,
  image: null,
  isPrecleanedAtlas: true,
  pendingCallbacks: [],
};

function ensureGraffitiAlphabetAtlasLoaded(onReady) {
  if (graffitiAtlasState.loaded && graffitiAtlasState.image) {
    onReady(graffitiAtlasState.image, graffitiAtlasState.isPrecleanedAtlas);
    return;
  }
  graffitiAtlasState.pendingCallbacks.push(onReady);
  if (graffitiAtlasState.loading || typeof Image === 'undefined') {
    return;
  }
  graffitiAtlasState.loading = true;

  const flushCallbacks = (img, isPrecleaned) => {
    graffitiAtlasState.loaded = true;
    graffitiAtlasState.loading = false;
    graffitiAtlasState.image = img;
    graffitiAtlasState.isPrecleanedAtlas = isPrecleaned;
    const cbs = graffitiAtlasState.pendingCallbacks.splice(0);
    for (const cb of cbs) {
      try {
        cb(img, isPrecleaned);
      } catch (err) {
        console.warn('[GraffitiHeaderAtlas] Callback error:', err);
      }
    }
  };

  const primaryImg = new Image();
  primaryImg.crossOrigin = 'anonymous';
  primaryImg.onload = () => flushCallbacks(primaryImg, true);
  primaryImg.onerror = () => {
    const fallbackImg = new Image();
    fallbackImg.crossOrigin = 'anonymous';
    fallbackImg.onload = () => flushCallbacks(fallbackImg, false);
    fallbackImg.onerror = () => {
      graffitiAtlasState.loading = false;
    };
    fallbackImg.src = GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.sourceReferenceUrl;
  };
  primaryImg.src = GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.atlasUrl;
}

function drawFallbackGraffitiHeaderCanvas(canvas, lines) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : ['PROJECT'];
  const nLines = safeLines.length;
  const availH = Math.floor((H - 12) / nLines);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < nLines; i++) {
    const lineText = String(safeLines[i] || '').toUpperCase();
    const fontSize = Math.min(132, Math.max(54, Math.floor(1180 / Math.max(7, lineText.length * 0.68))));
    const cy = 6 + i * availH + availH * 0.5;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.shadowColor = 'rgba(251, 191, 36, 0.92)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5.5;
    ctx.strokeText(lineText, W * 0.5, cy);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#291504';
    ctx.fillText(lineText, W * 0.5, cy);
  }
  ctx.restore();
}

function renderGraffitiHeaderFromAtlas(canvas, lines, sourceImg, isPrecleanedAtlas = true) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !sourceImg) return false;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : ['PROJECT'];
  const spaceAdvance = isPrecleanedAtlas ? 48 : 128;
  const kerningRatio = 0.81;
  const lineCanvases = [];

  for (let lIdx = 0; lIdx < safeLines.length; lIdx++) {
    const text = String(safeLines[lIdx] || '').toUpperCase();
    const placements = [];
    let cursorX = 0;
    let maxRightX = 1;
    let maxGlyphH = 1;

    for (let cIdx = 0; cIdx < text.length; cIdx++) {
      const ch = text[cIdx];
      if (ch === ' ') {
        cursorX += spaceAdvance;
        continue;
      }
      const gSpec = GRAFFITI_ALPHABET_GLYPH_MAP[ch];
      if (!gSpec) continue;
      const bounds = isPrecleanedAtlas ? gSpec.atlasBounds : gSpec.srcBounds;
      const [bx1, by1, bx2, by2] = bounds;
      const gw = Math.max(1, bx2 - bx1);
      const gh = Math.max(1, by2 - by1);
      placements.push({ x: cursorX, bx1, by1, gw, gh });
      if (cursorX + gw > maxRightX) maxRightX = cursorX + gw;
      cursorX += Math.round(gw * kerningRatio);
      if (gh > maxGlyphH) maxGlyphH = gh;
    }

    const totalLineW = Math.max(1, maxRightX);
    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = totalLineW;
    lineCanvas.height = maxGlyphH;
    const lCtx = lineCanvas.getContext('2d');
    for (const p of placements) {
      lCtx.drawImage(sourceImg, p.bx1, p.by1, p.gw, p.gh, p.x, 0, p.gw, p.gh);
    }
    lineCanvases.push(lineCanvas);
  }

  if (lineCanvases.length === 0) return false;

  const nLines = lineCanvases.length;
  const lineGapPx = nLines > 1 ? 8 : 0;
  const availH = Math.floor((H - 8 - lineGapPx * (nLines - 1)) / nLines);
  const lineScales = lineCanvases.map((lc) => {
    const maxScaleX = (W - 12) / Math.max(1, lc.width);
    const maxScaleY = availH / Math.max(1, lc.height);
    const scaleY = Math.min(maxScaleY, maxScaleX * 1.28);
    const scaleX = Math.min(maxScaleX, scaleY * 1.02);
    return { scaleX, scaleY };
  });

  if (lineScales.length > 1) {
    const minScaleY = Math.min(...lineScales.map((s) => s.scaleY));
    const maxAllowedScaleY = minScaleY * 1.15;
    for (const s of lineScales) {
      if (s.scaleY > maxAllowedScaleY) {
        const ratio = maxAllowedScaleY / s.scaleY;
        s.scaleY = maxAllowedScaleY;
        s.scaleX *= ratio;
      }
    }
  }

  const drawDims = lineCanvases.map((lc, i) => ({
    drawW: Math.max(1, Math.round(lc.width * lineScales[i].scaleX)),
    drawH: Math.max(1, Math.round(lc.height * lineScales[i].scaleY)),
  }));
  const totalBlockH =
    drawDims.reduce((acc, d) => acc + d.drawH, 0) + lineGapPx * (nLines - 1);
  let curY = Math.max(2, Math.round((H - totalBlockH) * 0.54));

  for (let i = 0; i < nLines; i++) {
    const lc = lineCanvases[i];
    const { drawW, drawH } = drawDims[i];
    const drawX = Math.round((W - drawW) * 0.5);
    const drawY = Math.max(0, Math.min(H - drawH, curY));
    ctx.drawImage(lc, 0, 0, lc.width, lc.height, drawX, drawY, drawW, drawH);
    curY += drawH + lineGapPx;
    // Reclaim temporary offscreen line buffer immediately (Spec 066 §5.4 & Spec 067 §5.5)
    lc.width = 0;
    lc.height = 0;
  }

  return true;
}

function createGraffitiHeaderTexture(st) {
  const headerSpec = resolveStationGraffitiHeaderSpec(st);
  const canvas = document.createElement('canvas');
  canvas.width = GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.textureWidth; // 1024
  canvas.height = GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.textureHeight; // 320

  drawFallbackGraffitiHeaderCanvas(canvas, headerSpec.headerLines);

  const tex = new THREE.CanvasTexture(canvas);
  tex.name = `${st.mountName}_GraffitiHeaderCanvasTex`;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 1;
  tex.needsUpdate = true;

  ensureGraffitiAlphabetAtlasLoaded((atlasImg, isPrecleaned) => {
    if (renderGraffitiHeaderFromAtlas(canvas, headerSpec.headerLines, atlasImg, isPrecleaned)) {
      tex.userData.atlasRendered = true;
      tex.needsUpdate = true;
    }
  });

  return { texture: tex, headerSpec, canvas };
}

function instantiateMountHologramHierarchy(hologramGLTF, st, screenWidth, screenHeight, rolePrefix) {
  const holoRoot = hologramGLTF && hologramGLTF.scene ? hologramGLTF.scene.clone(true) : new THREE.Group();
  holoRoot.name = `${st.mountName}_${rolePrefix}_HologramRoot`;
  holoRoot.scale.set(
    screenWidth / HOLOGRAM_NATIVE_WIDTH,
    screenHeight / HOLOGRAM_NATIVE_HEIGHT,
    1.0
  );
  // Center hologram local Y in [0, 1] onto the mount's local Y origin (0.0)
  holoRoot.position.set(0.0, -0.5 * screenHeight, 0.0);

  let smokedGlassMesh = holoRoot.getObjectByName('HoloTerminal_SmokedGlassPanes');
  let highBloomMesh = holoRoot.getObjectByName('HoloTerminal_HighBloomAccents');
  let structuralFramesMesh = holoRoot.getObjectByName('HoloTerminal_StructuralFrames');
  let bezelDetailsMesh = holoRoot.getObjectByName('HoloTerminal_BezelAndTierDetails');

  if (!smokedGlassMesh) {
    smokedGlassMesh = new THREE.Object3D();
    smokedGlassMesh.name = 'HoloTerminal_SmokedGlassPanes';
    holoRoot.add(smokedGlassMesh);
  }
  if (!highBloomMesh) {
    highBloomMesh = new THREE.Object3D();
    highBloomMesh.name = 'HoloTerminal_HighBloomAccents';
    holoRoot.add(highBloomMesh);
  }
  if (!structuralFramesMesh) {
    structuralFramesMesh = new THREE.Object3D();
    structuralFramesMesh.name = 'HoloTerminal_StructuralFrames';
    holoRoot.add(structuralFramesMesh);
  }
  if (!bezelDetailsMesh) {
    bezelDetailsMesh = new THREE.Object3D();
    bezelDetailsMesh.name = 'HoloTerminal_BezelAndTierDetails';
    holoRoot.add(bezelDetailsMesh);
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

function buildWallScreenMounts(markers, hologramGLTF = null) {
  const wallMounts = [];
  const wallMountsByName = {};
  const raycastTargets = [];

  const screenWidth = 3.52;
  const screenHeight = 2.16;
  const MOUNT_VERTICAL_ELEVATION_OFFSET = 0.42;
  const MOUNT_VIEWING_PITCH_RAD = 0.08;
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
    let locatorNode = markers[st.mountName] || null;
    const locatorPosition = new THREE.Vector3();
    let outwardNormal;

    if (st.isProceduralLocator) {
      locatorPosition.set(0, st.expectedY, st.expectedZ);
      outwardNormal = new THREE.Vector3(st.expectedNormalX, 0, 0).normalize();
      if (!locatorNode) {
        locatorNode = new THREE.Object3D();
        locatorNode.name = st.mountName;
      }
    } else {
      if (!locatorNode) {
        raiseFatalError(`Missing required wall mount locator '${st.mountName}' in freeman_alley.glb.`);
      }
      const locatorQuaternion = new THREE.Quaternion();
      locatorNode.getWorldPosition(locatorPosition);
      locatorNode.getWorldQuaternion(locatorQuaternion);
      // In freeman_alley.glb, each SCREEN_MOUNT_0X rotates local (0, 0, -1) to its outward wall normal (+X or -X)
      outwardNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(locatorQuaternion).normalize();
    }

    // Align locatorPosition.x flush to the actual VISUAL_ALLEY_MESH wall profile
    locatorPosition.x = Number(
      (resolveAlleyWallProfileX(st.wallSide, locatorPosition.z) + outwardNormal.x * 0.04).toFixed(4)
    );
    if (st.isProceduralLocator && locatorNode) {
      locatorNode.position.copy(locatorPosition);
      locatorNode.rotation.set(0, st.mountedRotationY, 0);
      locatorNode.updateMatrixWorld(true);
    }

    if (
      Math.abs(locatorPosition.y - st.expectedY) > 0.08 ||
      Math.abs(locatorPosition.z - st.expectedZ) > 0.15 ||
      Math.abs(outwardNormal.x - st.expectedNormalX) > 0.05
    ) {
      raiseFatalError(
        `Locator '${st.mountName}' failed spatial validation: pos=(${locatorPosition.x.toFixed(2)}, ${locatorPosition.y.toFixed(2)}, ${locatorPosition.z.toFixed(2)}), normal=(${outwardNormal.x.toFixed(2)}, ${outwardNormal.y.toFixed(2)}, ${outwardNormal.z.toFixed(2)}).`
      );
    }

    // Elevate showcase center by +0.42m (to Y=2.17m) so bottom of 2.16m tall display clears the floor by > 1.0m (Spec 068 Addendum §14.1)
    locatorPosition.y = Number((locatorPosition.y + MOUNT_VERTICAL_ELEVATION_OFFSET).toFixed(4));

    // 1. Standby Wall Mounting Frame (Spec 036 §5.1–§5.2: kept detached/hidden so zero legacy overlays occur)
    const standbyBracketGroup = new THREE.Group();
    standbyBracketGroup.name = `WallBracket_${st.mountName}`;
    standbyBracketGroup.position.copy(locatorPosition);
    standbyBracketGroup.rotation.set(0, st.mountedRotationY, 0);
    standbyBracketGroup.visible = false;

    const standbyHoloInstance = instantiateMountHologramHierarchy(
      hologramGLTF,
      st,
      screenWidth,
      screenHeight,
      'Standby'
    );
    standbyHoloInstance.root.position.set(0, -0.5 * screenHeight, MOUNT_BRICK_CLEARANCE - 0.006);
    standbyHoloInstance.root.visible = false;

    const standbyPlateMat = new THREE.MeshBasicMaterial({
      name: `${st.mountName}_StandbyPlateMat`,
      map: null,
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
    standbyPlateMesh.visible = false;

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
    bracketWireLines.visible = false;

    const standbyDiffusedMat = createScreenMountDiffusedMaterial(`${st.mountName}_Standby`, 0.28);
    const standbyDiffusedMesh = new THREE.Mesh(mountDiffusedSphereGeom, standbyDiffusedMat);
    standbyDiffusedMesh.name = `${st.mountName}_StandbyDiffusedLight`;
    standbyDiffusedMesh.renderOrder = 9;
    standbyDiffusedMesh.position.set(0, 0, MOUNT_BRICK_CLEARANCE);
    standbyDiffusedMesh.raycast = noOpRaycast;
    standbyDiffusedMesh.visible = false;

    // 2. 3D Unified Holographic Showcase Card Unit (Spec 036 §3–§5: single-card hologram with zero overlapping hologram.glb / wireframes)
    const screenGroup = new THREE.Group();
    screenGroup.name = `WallScreen_${st.mountName}`;
    screenGroup.userData.mountName = st.mountName;
    screenGroup.userData.stationIndex = st.index;

    const panelOffsetGroup = new THREE.Group();
    panelOffsetGroup.name = `${st.mountName}_PanelOffsetGroup`;
    screenGroup.add(panelOffsetGroup);

    const activeHoloInstance = instantiateMountHologramHierarchy(
      hologramGLTF,
      st,
      screenWidth,
      screenHeight,
      'Active'
    );
    activeHoloInstance.root.visible = false;

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
    backFaceMesh.visible = false;
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
    borderWireLines.visible = false;

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

    // 2B. Levitating 3D Cyber-Drip Graffiti Header Above Mount Bezel (Spec 067 §3.2, §5.1–§5.5)
    const {
      texture: headerTexture,
      headerSpec,
    } = createGraffitiHeaderTexture(st);
    const headerMat = createGraffitiHeaderHolographicMaterial(
      st,
      headerTexture,
      holoShaderUniforms.uHoloTime,
      applyCharacterOcclusionStencilReject
    );
    const initialHeaderEval = evaluateGraffitiHeaderFlickerAndGlitch(0.0, st.index, 0.0);
    const initialHeaderLev = evaluateGraffitiHeaderLevitation(0.0, st.index);
    const headerPlaneWidth = Math.max(
      3.84,
      Number(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeWidthMeters) || 3.84
    );
    const headerPlaneHeight = Math.max(
      1.20,
      Number(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.planeHeightMeters) || 1.20
    );
    const headerBaseLocalOffsetY = Math.max(
      1.78,
      Number(GRAFFITI_HEADER_GLITCH_FLICKER_SPEC.baseLocalOffsetY) || 1.78
    );
    const resolvedInitialHeaderLocalY = Number(
      (headerBaseLocalOffsetY + (initialHeaderLev.hoverOffsetY || 0.0)).toFixed(4)
    );

    const headerGroup = new THREE.Group();
    headerGroup.name = `${st.mountName}_LevitatingHeaderGroup`;
    headerGroup.position.set(0.0, resolvedInitialHeaderLocalY, initialHeaderLev.localZ);
    headerGroup.rotation.set(0.0, 0.0, initialHeaderLev.rollZ);
    headerGroup.userData.mountName = st.mountName;
    headerGroup.userData.stationIndex = st.index;
    headerGroup.userData.isGraffitiHeaderGroup = true;
    panelOffsetGroup.add(headerGroup);

    const headerPlaneGeom = new THREE.PlaneGeometry(headerPlaneWidth, headerPlaneHeight);

    const headerFrontMesh = new THREE.Mesh(headerPlaneGeom, headerMat);
    headerFrontMesh.name = `${st.mountName}_HeaderFront`;
    headerFrontMesh.renderOrder = 11;
    headerFrontMesh.position.set(0, 0, 0.004);
    headerFrontMesh.userData.mountName = st.mountName;
    headerFrontMesh.userData.stationIndex = st.index;
    headerFrontMesh.userData.isGraffitiHeader = true;
    headerGroup.add(headerFrontMesh);

    const headerBackMesh = new THREE.Mesh(headerPlaneGeom, headerMat);
    headerBackMesh.name = `${st.mountName}_HeaderBack`;
    headerBackMesh.renderOrder = 11;
    headerBackMesh.position.set(0, 0, -0.004);
    headerBackMesh.rotation.set(0, Math.PI, 0);
    headerBackMesh.userData.mountName = st.mountName;
    headerBackMesh.userData.stationIndex = st.index;
    headerBackMesh.userData.isGraffitiHeader = true;
    headerBackMesh.visible = false;
    headerGroup.add(headerBackMesh);

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
      frontFaceMesh,
      backFaceMesh,
      headerFrontMesh,
      headerBackMesh
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
      // Levitating 3D Cyber-Drip Graffiti Header Record (Spec 067)
      hasLevitatingHeader: true,
      isHeaderLevitating: true,
      isHeaderFlickering: true,
      hasHeaderGlitchEffect: true,
      headerSyncedWithMount: false,
      headerText: headerSpec.headerText,
      headerLines: headerSpec.headerLines,
      headerSpec,
      headerGroup,
      headerFrontMesh,
      headerBackMesh,
      headerMat,
      headerTexture,
      headerFlickerGain: initialHeaderEval.flickerGain,
      headerGlitchIntensity: initialHeaderEval.glitchIntensity,
      headerTearOffsetUvX: initialHeaderEval.tearOffsetUvX,
      headerScanbeamY: initialHeaderEval.scanbeamY,
      headerHoverOffsetY: initialHeaderLev.hoverOffsetY,
      headerLocalY: resolvedInitialHeaderLocalY,
      headerRollZ: initialHeaderLev.rollZ,
      screenWidth,
      screenHeight,
      mountElevationOffsetY: MOUNT_VERTICAL_ELEVATION_OFFSET,
      mountViewingPitchRad: MOUNT_VIEWING_PITCH_RAD,
      headerWidth: headerPlaneWidth,
      headerHeight: headerPlaneHeight,
      headerBaseLocalOffsetY,
      headerGlitchBoostRemainingSec: 0.0,
      triggerHeaderGlitchSpike(durationSec = 0.22) {
        this.headerGlitchBoostRemainingSec = Math.max(
          this.headerGlitchBoostRemainingSec,
          durationSec
        );
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
      screenTexture,
      hasLiveDemoPreview: true,
      previewFrameCount: st.previewFrameCount || 4,
      activePreviewFrameIndex: 0,
      previewTransitionPulse: 0.0,
      previewAtlasUrl: st.previewAtlasUrl || null,
      previewAtlasLoaded: Boolean(
        faceMat.uniforms &&
        faceMat.uniforms.uHasPreviewAtlas &&
        faceMat.uniforms.uHasPreviewAtlas.value > 0.5
      ),
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

    const cylSegs = Math.max(1, Math.ceil(cylLength * 0.5));
    const coreGeom = new THREE.CylinderGeometry(
      NEON_CORE_RADIUS,
      NEON_CORE_RADIUS,
      cylLength,
      6,
      cylSegs,
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
      6,
      cylSegs,
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

  for (const s of neonSegments) {
    if (s.group) {
      s.group.remove(s.haloMesh, s.coreMesh);
    }
    if (s.coreMesh && s.coreMesh.geometry) {
      s.coreMesh.geometry.dispose();
    }
    if (s.haloMesh && s.haloMesh.geometry) {
      s.haloMesh.geometry.dispose();
    }
  }

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

  const jointCoreGeom = new THREE.SphereGeometry(NEON_CORE_RADIUS * 1.06, 6, 4);
  const jointHaloGeom = new THREE.SphereGeometry(NEON_HALO_RADIUS * 0.96, 6, 4);
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
    if (f.group && f.group.userData && f.group.userData.culledBySceneCutter) {
      f.group.visible = false;
      if (f.pointLight) {
        f.pointLight.visible = false;
        f.pointLight.intensity = 0.0;
      }
      continue;
    }
    const pairFlicker = evaluateAlarmLightFlicker(timeSec, f.pairIndex);
    f.currentFlicker = pairFlicker;
    f.flickerFactor = pairFlicker;
    if (f.pointLight) {
      f.pointLight.visible = true;
      f.pointLight.intensity = Number((2.65 * pairFlicker).toFixed(4));
    }
  }
}

// ============================================================================
// Entrance Street Lamppost Cone Light Fixture (SpotLight + Volumetric Beam + Target Editor)
// ============================================================================
const LAMPPOST_STORAGE_KEY = 'skatealley_lamppost_cone_light_v2';

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
  entranceLamppostLight.angle = 0.3491;
  entranceLamppostLight.penumbra = 0.72;
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
    angleRad: 0.3491,
    penumbra: 0.72,
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
      this.angleRad = 0.3491;
      this.light.angle = 0.3491;
      this.penumbra = 0.72;
      this.light.penumbra = 0.72;
      this.distance = 26.0;
      this.light.distance = 26.0;
      this.coneOpacity = 0.16;
      this.syncConeGeometry();
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LAMPPOST_STORAGE_KEY);
        window.localStorage.removeItem(`${LAMPPOST_STORAGE_KEY}_ts`);
      }
      if (persist && sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.deletePersistedSceneLayout === 'function') {
        sandbox.deletePersistedSceneLayout('lamppost_light');
      }
      return this.getState();
    },

    saveToStorage() {
      const statePayload = this.getState();
      const updatedAtMs = Date.now();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(LAMPPOST_STORAGE_KEY, JSON.stringify(statePayload));
          window.localStorage.setItem(`${LAMPPOST_STORAGE_KEY}_ts`, String(updatedAtMs));
        } catch (err) {
          return false;
        }
      }
      if (sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.persistSceneLayout === 'function') {
        sandbox.persistSceneLayout('lamppost_light', statePayload, updatedAtMs);
      }
      return true;
    },

    loadFromStorage() {
      if (!IS_DEV_MODE) return false;
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
// Player Spawn Coordinates & Startup Camera Pan Director System (Spec 034)
// ============================================================================
const SPAWN_STORAGE_KEY = 'skatealley_player_spawn_v2';
const STARTUP_PAN_STORAGE_KEY = 'skatealley_startup_camera_pan_v2';

const DEFAULT_PLAYER_SPAWN = Object.freeze({
  x: 5.192,
  y: 0.00,
  z: -0.802,
  yawRad: -3.1416,
});

const DEFAULT_STARTUP_PAN = Object.freeze({
  startPos: Object.freeze({ x: 9.048, y: 4.972, z: -7.585 }),
  startLookAt: Object.freeze({ x: 1.744, y: -1.179, z: 2.684 }),
  midPos: Object.freeze({ x: 6.231, y: 4.286, z: -7.455 }),
  useCustomMidpoint: true,
  endPos: Object.freeze({ x: 5.258, y: 1.584, z: -2.020 }),
  endLookAt: Object.freeze({ x: 5.182, y: 1.748, z: -0.849 }),
  durationSec: 2.60,
});

const STARTUP_TALKING_SEQUENCE_CLIPS = Object.freeze([
  'TALK_CONVERSATION_06',
  'TALK_CONVERSATION_05',
  'TALK_CONVERSATION_04',
  'TALK_EMPHASIS',
]);

const INTRO_DIALOGUE_STORAGE_KEY = 'skatealley_intro_dialogue_boxes_v3';
const INTRO_POST_PAN_GRACE_MS = 600;
const INTRO_PREFETCH_CLIENT_TIMEOUT_MS = 8500;

function sanitizeIntroDialogueText(rawText) {
  if (typeof rawText !== 'string') return '';
  return rawText
    .replace(
      /\s*Job recruiters will be visiting the alleyway so TREAD LIGHTLY\.\s*I MEAN IT\.\s*DON[’']T BE A DICKHEAD,\s*DEVON!\s*/gi,
      ' '
    )
    .replace(/\s*DON[’']T BE A DICKHEAD,\s*DEVON!\s*/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const DEFAULT_INTRO_DIALOGUE_BOXES = Object.freeze([
  Object.freeze({
    id: 'card_01',
    title: '01 // WELCOME',
    text: 'Welcome to my portfolio! My name’s Luis, I’m 26 and I build software that feels like magic.',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_02',
    title: '02 // ABOUT ME',
    text: 'My free time is split between hiking, swimming, eating good food and building. I studied corporate finance and accounting in college, but changed my major to Philosophy and Religion during the COVID era. I speedran AI psychosis with GPT3.5 back in 2022, and have been accelerating ever since. e/acc, baby.',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_03',
    title: '03 // PROJECTS & ARCHITECTURE',
    text: 'Down this alley you will find some of my work on display, alongside descriptions of where I excel in the technical stack.',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_04',
    title: '04 // EXPLORE THE ALLEY',
    text: 'Recently, a “reverse engineer anything” repo popped up on Github that led me and a bunch of other nerds to reverse-engineer— well— everything. From toilet sensors and smartTVs, to video games and critical infrastructure.',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_05',
    title: '05 // GAMES',
    text: 'Let’s steer clear of reverse engineering critical infrastructure for now, and stick to games. Down the alleyway, you’ll find some decompiled games you can play, as well as a generative pipeline I created to put yourself in-game!',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_06',
    title: '06 // GENERATIVE PIPELINE',
    text: 'You can skate, commit grand theft auto, fight in Super Smash Bros, kill zombies, or just join me in the alleyway.',
    requires_question_prompt: false,
  }),
  Object.freeze({
    id: 'card_07',
    title: '07 // MENU',
    text: 'You can use the menu to leave a message in the alleyway for myself and others to see. You can also check out my GitHub, send me an email, or follow me on Twitter.\n\nOh and by the way, this conversation is generative. Do you have any questions for me?',
    requires_question_prompt: true,
  }),
]);

const introGenerationTelemetry = {
  status: 'idle',
  introSource: 'anchor_default',
  source: 'anchor_default',
  model: null,
  latencyMs: null,
  schemaValid: false,
  datasetVersion: null,
  error: null,
  errorCode: null,
  startedAtMs: 0,
  completedAtMs: 0,
  graceWaitMs: 0,
  adoptedAtCardIndex: null,
  cards: null,
};

let _introPrefetchPromise = null;
let _lastRenderedIntroCardIdx = -1;

function normalizeGenerativeIntroCards(rawCards) {
  if (!Array.isArray(rawCards) || rawCards.length !== 7) return null;
  const normalized = [];
  for (let i = 0; i < 7; i++) {
    const item = rawCards[i];
    if (!item || typeof item !== 'object') return null;
    const header = typeof item.header === 'string' ? item.header.trim() : typeof item.title === 'string' ? item.title.trim() : '';
    const rawBody = typeof item.body === 'string' ? item.body.trim() : typeof item.text === 'string' ? item.text.trim() : '';
    const body = sanitizeIntroDialogueText(rawBody);
    if (!header || body.length < 40) return null;
    normalized.push({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `card_0${i + 1}`,
      title: header,
      text: body,
      requires_question_prompt: i === 6 ? true : Boolean(item.requires_question_prompt),
    });
  }
  return normalized;
}

function applyLateResolvedIntroCardsIfSafe(mappedCards) {
  if (!Array.isArray(mappedCards) || mappedCards.length !== 7 || !sandbox || !sandbox.director) {
    return false;
  }
  const intro = sandbox.director.introSequenceState;
  if (!intro) return false;
  if (intro.phase === 'pan-playing') {
    sandbox.director.setDialogueBoxes(mappedCards, false);
    introGenerationTelemetry.source = 'hf_json_schema';
    introGenerationTelemetry.introSource = 'hf_json_schema';
    introGenerationTelemetry.adoptedAtCardIndex = 0;
    return true;
  }
  // Spec 065 §7.1: If visitor is still reading Card 01 after the 600ms grace fallback, seamlessly adopt Cards 02..07 without mutating Card 01 mid-read
  if (intro.phase === 'dialogue-active' && intro.currentBoxIndex === 0 && intro.boxes.length === 7) {
    const merged = [
      { ...intro.boxes[0] },
      ...mappedCards.slice(1).map((c) => ({ ...c })),
    ];
    intro.boxes = merged;
    introGenerationTelemetry.source = 'hf_json_schema';
    introGenerationTelemetry.introSource = 'hf_json_schema_cards_02_07';
    introGenerationTelemetry.adoptedAtCardIndex = 1;
    syncDirectorHUDInputs();
    return true;
  }
  return false;
}

let _tunnelConfigDiscoveryPromise = null;

function ensureTunnelConfigDiscovered() {
  if (sandbox && sandbox.tunnelConfig) {
    return Promise.resolve(sandbox.tunnelConfig);
  }
  if (_tunnelConfigDiscoveryPromise) {
    return _tunnelConfigDiscoveryPromise;
  }
  if (typeof fetch !== 'function') {
    return Promise.resolve(null);
  }
  _tunnelConfigDiscoveryPromise = (async () => {
    try {
      const tRes = await fetch(`./tunnel.json?t=${Date.now()}`, { cache: 'no-store' });
      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        if (tData && typeof tData === 'object' && sandbox) {
          sandbox.tunnelConfig = tData;
          return tData;
        }
      }
    } catch (_err) {
      // Ignore tunnel.json fetch errors in offline/static contexts
    }
    return null;
  })();
  return _tunnelConfigDiscoveryPromise;
}

function prefetchGenerativeIntroDeck() {
  if (_introPrefetchPromise) return _introPrefetchPromise;
  if (typeof fetch !== 'function') {
    introGenerationTelemetry.status = 'fallback';
    introGenerationTelemetry.source = 'anchor_fallback';
    introGenerationTelemetry.introSource = 'anchor_fallback';
    introGenerationTelemetry.errorCode = 'FETCH_UNAVAILABLE';
    introGenerationTelemetry.error = 'Fetch API unavailable in runtime environment';
    _introPrefetchPromise = Promise.resolve(null);
    return _introPrefetchPromise;
  }

  introGenerationTelemetry.status = 'in_flight';
  introGenerationTelemetry.startedAtMs = Date.now();
  introGenerationTelemetry.error = null;
  introGenerationTelemetry.errorCode = null;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  _introPrefetchPromise = (async () => {
    await ensureTunnelConfigDiscovered();
    const urls = resolveDoomApiCandidateUrls('api/intro/generate');
    let lastErr = null;
    let lastCode = 'NETWORK_UNREACHABLE';

    for (const url of urls) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), INTRO_PREFETCH_CLIENT_TIMEOUT_MS) : null;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: controller ? controller.signal : undefined,
        });
        const rawText = await res.text();
        let data = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch (_parseErr) {
          lastCode = 'INVALID_JSON_RESPONSE';
          throw new Error(`HTTP ${res.status} non-JSON response from ${url}`);
        }
        if (!res.ok || !data || !data.ok) {
          lastCode = (data && (data.code || data.error_code)) || `HTTP_${res.status}`;
          throw new Error((data && (data.error || data.message)) || `HTTP ${res.status} from ${url}`);
        }
        const mapped = normalizeGenerativeIntroCards(data.cards);
        if (!mapped) {
          lastCode = 'CLIENT_SCHEMA_REJECTED';
          throw new Error(`Invalid 7-card payload returned by ${url}`);
        }

        const elapsedMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
        introGenerationTelemetry.status = 'resolved';
        introGenerationTelemetry.completedAtMs = Date.now();
        introGenerationTelemetry.model = data.model || null;
        introGenerationTelemetry.latencyMs = Number(data.latencyMs) || elapsedMs;
        introGenerationTelemetry.schemaValid = data.schemaValid !== false;
        introGenerationTelemetry.datasetVersion = data.datasetVersion || null;
        introGenerationTelemetry.cards = mapped;
        applyLateResolvedIntroCardsIfSafe(mapped);
        return mapped;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          lastCode = 'UPSTREAM_TIMEOUT';
          lastErr = new Error(`Intro generation timed out after ${INTRO_PREFETCH_CLIENT_TIMEOUT_MS}ms (${url})`);
        } else {
          lastErr = err;
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    introGenerationTelemetry.status = 'fallback';
    introGenerationTelemetry.completedAtMs = Date.now();
    introGenerationTelemetry.source = 'anchor_fallback';
    introGenerationTelemetry.introSource = 'anchor_fallback';
    introGenerationTelemetry.schemaValid = false;
    introGenerationTelemetry.errorCode = lastCode;
    introGenerationTelemetry.error = lastErr ? lastErr.message || String(lastErr) : 'Failed to reach /api/intro/generate';
    return null;
  })();

  return _introPrefetchPromise;
}

function directorCubicEaseInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function buildSpawnAndCameraDirectorSystem(floorY = 0.0) {
  directorRootGroup.clear();

  // 1. Player Spawn 3D Marker Group
  const playerSpawnMarkerGroup = new THREE.Group();
  playerSpawnMarkerGroup.name = 'DirectorPlayerSpawnMarkerGroup';
  playerSpawnMarkerGroup.position.set(DEFAULT_PLAYER_SPAWN.x, floorY, DEFAULT_PLAYER_SPAWN.z);
  playerSpawnMarkerGroup.rotation.y = DEFAULT_PLAYER_SPAWN.yawRad;

  // Floor Reticle Ring
  const spawnRingGeom = new THREE.RingGeometry(0.38, 0.48, 32);
  spawnRingGeom.rotateX(-Math.PI / 2);
  const spawnRingMat = new THREE.MeshBasicMaterial({
    color: 0x00d5ff,
    transparent: true,
    opacity: 0.90,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const spawnRingMesh = new THREE.Mesh(spawnRingGeom, spawnRingMat);
  spawnRingMesh.position.y = 0.02;
  spawnRingMesh.renderOrder = 992;
  playerSpawnMarkerGroup.add(spawnRingMesh);

  // Directional Forward Chevron Arrow
  const arrowGeom = new THREE.ConeGeometry(0.14, 0.32, 4);
  arrowGeom.rotateX(-Math.PI / 2);
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
  arrowMesh.position.set(0.0, 0.04, 0.65);
  arrowMesh.renderOrder = 993;
  playerSpawnMarkerGroup.add(arrowMesh);

  // Vertical Avatar Holographic Silhouette / Beacon
  const beaconGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.85, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x00d5ff,
    transparent: true,
    opacity: 0.28,
    wireframe: true,
    depthTest: false,
  });
  const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
  beaconMesh.position.y = 0.925;
  beaconMesh.renderOrder = 991;
  playerSpawnMarkerGroup.add(beaconMesh);

  // Raycast Hit Proxy for Spawn Marker
  const spawnHitGeom = new THREE.SphereGeometry(0.36, 12, 8);
  const spawnHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const spawnHitMesh = new THREE.Mesh(spawnHitGeom, spawnHitMat);
  spawnHitMesh.position.y = 0.925;
  spawnHitMesh.name = 'DirectorSpawnHitProxy';
  spawnHitMesh.userData = { isDirectorHandle: true, handleId: 'spawn' };
  spawnHitMesh.renderOrder = 999;
  playerSpawnMarkerGroup.add(spawnHitMesh);

  directorRootGroup.add(playerSpawnMarkerGroup);

  // 2. Camera Pan 3D Rig Group
  const startupCameraPanGroup = new THREE.Group();
  startupCameraPanGroup.name = 'DirectorStartupCameraPanGroup';

  function createCameraHandle(colorHex, name, handleId) {
    const grp = new THREE.Group();
    grp.name = name;

    const bodyGeom = new THREE.BoxGeometry(0.20, 0.16, 0.24);
    const bodyMat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, depthTest: false });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.renderOrder = 994;
    grp.add(bodyMesh);

    const lensGeom = new THREE.ConeGeometry(0.14, 0.22, 4);
    lensGeom.rotateX(-Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, depthTest: false });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.position.z = -0.22;
    lensMesh.renderOrder = 994;
    grp.add(lensMesh);

    const sphGeom = new THREE.SphereGeometry(0.06, 12, 8);
    const sphMat = new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false });
    const sphMesh = new THREE.Mesh(sphGeom, sphMat);
    sphMesh.renderOrder = 995;
    grp.add(sphMesh);

    const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.name = `${name}_HitProxy`;
    hitMesh.userData = { isDirectorHandle: true, handleId };
    hitMesh.renderOrder = 999;
    grp.add(hitMesh);
    grp.hitMesh = hitMesh;

    return grp;
  }

  function createTargetHandle(colorHex, name, handleId) {
    const grp = new THREE.Group();
    grp.name = name;

    const ringGeom = new THREE.RingGeometry(0.12, 0.18, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, depthTest: false });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.renderOrder = 994;
    grp.add(ringMesh);

    const sphGeom = new THREE.SphereGeometry(0.07, 12, 8);
    const sphMat = new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false });
    const sphMesh = new THREE.Mesh(sphGeom, sphMat);
    sphMesh.renderOrder = 995;
    grp.add(sphMesh);

    const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.name = `${name}_HitProxy`;
    hitMesh.userData = { isDirectorHandle: true, handleId };
    hitMesh.renderOrder = 999;
    grp.add(hitMesh);
    grp.hitMesh = hitMesh;

    return grp;
  }

  const startCamHandle = createCameraHandle(0xf59e0b, 'DirectorCamStartHandle', 'cam_start');
  startCamHandle.position.set(DEFAULT_STARTUP_PAN.startPos.x, DEFAULT_STARTUP_PAN.startPos.y, DEFAULT_STARTUP_PAN.startPos.z);
  startupCameraPanGroup.add(startCamHandle);

  const startLookAtHandle = createTargetHandle(0xf59e0b, 'DirectorLookStartHandle', 'look_start');
  startLookAtHandle.position.set(DEFAULT_STARTUP_PAN.startLookAt.x, DEFAULT_STARTUP_PAN.startLookAt.y, DEFAULT_STARTUP_PAN.startLookAt.z);
  startupCameraPanGroup.add(startLookAtHandle);

  const startLineGeom = new THREE.BufferGeometry().setFromPoints([startCamHandle.position, startLookAtHandle.position]);
  const startLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.65, depthTest: false });
  const startLookAtLine = new THREE.Line(startLineGeom, startLineMat);
  startLookAtLine.renderOrder = 989;
  startupCameraPanGroup.add(startLookAtLine);

  const midCamHandle = createTargetHandle(0xa855f7, 'DirectorCamMidHandle', 'cam_mid');
  midCamHandle.position.set(DEFAULT_STARTUP_PAN.midPos.x, DEFAULT_STARTUP_PAN.midPos.y, DEFAULT_STARTUP_PAN.midPos.z);
  startupCameraPanGroup.add(midCamHandle);

  const endCamHandle = createCameraHandle(0x00d5ff, 'DirectorCamEndHandle', 'cam_end');
  endCamHandle.position.set(DEFAULT_STARTUP_PAN.endPos.x, DEFAULT_STARTUP_PAN.endPos.y, DEFAULT_STARTUP_PAN.endPos.z);
  startupCameraPanGroup.add(endCamHandle);

  const endLookAtHandle = createTargetHandle(0x00d5ff, 'DirectorLookEndHandle', 'look_end');
  endLookAtHandle.position.set(DEFAULT_STARTUP_PAN.endLookAt.x, DEFAULT_STARTUP_PAN.endLookAt.y, DEFAULT_STARTUP_PAN.endLookAt.z);
  startupCameraPanGroup.add(endLookAtHandle);

  const endLineGeom = new THREE.BufferGeometry().setFromPoints([endCamHandle.position, endLookAtHandle.position]);
  const endLineMat = new THREE.LineBasicMaterial({ color: 0x00d5ff, transparent: true, opacity: 0.65, depthTest: false });
  const endLookAtLine = new THREE.Line(endLineGeom, endLineMat);
  endLookAtLine.renderOrder = 989;
  startupCameraPanGroup.add(endLookAtLine);

  // Flight path trajectory line
  const trajectoryGeom = new THREE.BufferGeometry();
  const trajectoryMat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85, depthTest: false });
  const trajectoryCurveMesh = new THREE.Line(trajectoryGeom, trajectoryMat);
  trajectoryCurveMesh.renderOrder = 988;
  startupCameraPanGroup.add(trajectoryCurveMesh);

  // Scroll Walk Path floor preview line (emerald green)
  const walkPathGeom = new THREE.BufferGeometry();
  const walkPathMat = new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.92, depthTest: false });
  const walkPathCurveMesh = new THREE.Line(walkPathGeom, walkPathMat);
  walkPathCurveMesh.name = 'DirectorScrollWalkPathCurve';
  walkPathCurveMesh.renderOrder = 989;
  directorRootGroup.add(walkPathCurveMesh);

  // Bounding Walls floor & lower-wall wireframe helper (amber)
  const boundingWallsGeom = new THREE.BufferGeometry();
  const boundingWallsMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.55, depthTest: false });
  const boundingWallsLineMesh = new THREE.LineSegments(boundingWallsGeom, boundingWallsMat);
  boundingWallsLineMesh.name = 'DirectorBoundingWallsHelper';
  boundingWallsLineMesh.renderOrder = 987;
  directorRootGroup.add(boundingWallsLineMesh);

  directorRootGroup.add(startupCameraPanGroup);
  directorRootGroup.visible = false;

  const handlesById = {
    spawn: playerSpawnMarkerGroup,
    cam_start: startCamHandle,
    look_start: startLookAtHandle,
    cam_mid: midCamHandle,
    cam_end: endCamHandle,
    look_end: endLookAtHandle,
  };

  const raycastTargets = [
    spawnHitMesh,
    startCamHandle.hitMesh,
    startLookAtHandle.hitMesh,
    midCamHandle.hitMesh,
    endCamHandle.hitMesh,
    endLookAtHandle.hitMesh,
  ];

  const spawnState = {
    x: DEFAULT_PLAYER_SPAWN.x,
    y: floorY,
    z: DEFAULT_PLAYER_SPAWN.z,
    yawRad: DEFAULT_PLAYER_SPAWN.yawRad,
    yawDeg: Math.round(THREE.MathUtils.radToDeg(DEFAULT_PLAYER_SPAWN.yawRad)),
  };

  const cameraPanState = {
    startPos: new THREE.Vector3(DEFAULT_STARTUP_PAN.startPos.x, DEFAULT_STARTUP_PAN.startPos.y, DEFAULT_STARTUP_PAN.startPos.z),
    startLookAt: new THREE.Vector3(DEFAULT_STARTUP_PAN.startLookAt.x, DEFAULT_STARTUP_PAN.startLookAt.y, DEFAULT_STARTUP_PAN.startLookAt.z),
    midPos: new THREE.Vector3(DEFAULT_STARTUP_PAN.midPos.x, DEFAULT_STARTUP_PAN.midPos.y, DEFAULT_STARTUP_PAN.midPos.z),
    useCustomMidpoint: Boolean(DEFAULT_STARTUP_PAN.useCustomMidpoint),
    endPos: new THREE.Vector3(DEFAULT_STARTUP_PAN.endPos.x, DEFAULT_STARTUP_PAN.endPos.y, DEFAULT_STARTUP_PAN.endPos.z),
    endLookAt: new THREE.Vector3(DEFAULT_STARTUP_PAN.endLookAt.x, DEFAULT_STARTUP_PAN.endLookAt.y, DEFAULT_STARTUP_PAN.endLookAt.z),
    durationSec: DEFAULT_STARTUP_PAN.durationSec,
    mode: 'settled', // 'playing' | 'preview-start' | 'preview-mid' | 'preview-end' | 'settled' | 'orbit'
    progress: 1.0,
    elapsed: 0.0,
    playing: false,
  };

  const povState = {
    position: new THREE.Vector3(DEFAULT_STARTUP_PAN.startPos.x, DEFAULT_STARTUP_PAN.startPos.y, DEFAULT_STARTUP_PAN.startPos.z),
    yaw: 0.0,
    pitch: 0.18,
    flySpeed: 6.0,
    focusDistance: 2.5,
  };

  const introSequenceState = {
    phase: 'pan-playing', // 'pan-playing' | 'dialogue-active' | 'ready-to-scroll' | 'scrolling-alley'
    scrollLocked: true,
    currentBoxIndex: 0,
    selectedEditBoxIndex: 0,
    boxes: DEFAULT_INTRO_DIALOGUE_BOXES.map((b) => ({ ...b })),
    talkingSequence: [...STARTUP_TALKING_SEQUENCE_CLIPS],
  };

  function computeBezierControlPointFromMidpoint(startPos, midOnCurve, endPos, targetVec = new THREE.Vector3()) {
    // Given B(0.5) = midOnCurve, the quadratic Bezier control point P1 is:
    // P1 = 2 * midOnCurve - 0.5 * (startPos + endPos)
    targetVec.set(
      2.0 * midOnCurve.x - 0.5 * (startPos.x + endPos.x),
      2.0 * midOnCurve.y - 0.5 * (startPos.y + endPos.y),
      2.0 * midOnCurve.z - 0.5 * (startPos.z + endPos.z)
    );
    return targetVec;
  }

  function resolveLookAtFromCurrentCamera(defaultDepth = 2.5) {
    const curCamPos = camera.position.clone();
    const lookDir = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
    let dist = defaultDepth;
    if (activeChar) {
      const torsoPos = new THREE.Vector3(activeChar.position.x, activeChar.position.y + 1.42, activeChar.position.z);
      const toTorso = torsoPos.sub(curCamPos);
      const proj = toTorso.dot(lookDir);
      if (proj >= 0.6 && proj <= 18.0) {
        dist = proj;
      }
    }
    return curCamPos.clone().addScaledVector(lookDir, Number(dist.toFixed(3)));
  }

  const director = {
    rootGroup: directorRootGroup,
    spawnMarkerGroup: playerSpawnMarkerGroup,
    cameraPanGroup: startupCameraPanGroup,
    handlesById,
    raycastTargets,
    spawnState,
    cameraPanState,
    povState,
    introSequenceState,
    cameraPOVMode: false,
    editMode: false,
    selectedHandleId: 'spawn',
    gizmoMode: 'translate',

    isScrollLocked() {
      if (sandbox.mode !== 'scroll') return false;
      if (cameraPanState.mode === 'playing') return true;
      return Boolean(introSequenceState.scrollLocked);
    },

    getIntroSequenceState() {
      return {
        phase: introSequenceState.phase,
        scrollLocked: this.isScrollLocked(),
        currentBoxIndex: introSequenceState.currentBoxIndex,
        totalBoxes: introSequenceState.boxes.length,
        boxes: introSequenceState.boxes.map((b) => ({ ...b })),
        talkingSequence: [...introSequenceState.talkingSequence],
      };
    },

    startIntroTalkingSequence({ preserveActiveIntroDialogue = false } = {}) {
      if (this.cameraPOVMode) {
        this.toggleCameraPOVMode(false);
      }
      if (sandbox.mode === 'mount-focus') {
        sandbox.exitMountFocusMode({ immediate: true });
      }
      if (sandbox.freeRoamFlyMode) {
        sandbox.toggleFreeRoamFlyMode(false);
      }
      document.body.classList.remove('freeroam-mode');
      sandbox.mode = 'scroll';
      sandbox.scrollProgress = 0.0;
      sandbox.targetScrollProgress = 0.0;
      sandbox.scrollVelocity = 0.0;
      syncWindowScrollToFraction(0.0);

      // Lock camera firmly at the Pan End pose
      cameraPanState.mode = 'settled';
      cameraPanState.playing = false;
      cameraPanState.progress = 1.0;
      camera.position.copy(cameraPanState.endPos);
      if (mountFocusCameraState) {
        mountFocusCameraState.currentLookAt.copy(cameraPanState.endLookAt);
      }
      camera.lookAt(cameraPanState.endLookAt);
      camera.updateMatrixWorld(true);

      // Station character at Spawn Coordinates and start the ordered 4-clip talking loop
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar) {
        activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
        activeChar.yaw = spawnState.yawRad;
        activeChar.velocity.set(0, 0, 0);
        activeChar.isGrounded = true;
        activeChar.root.position.copy(activeChar.position);
        activeChar.root.rotation.set(0, activeChar.yaw, 0);
        const alreadyInIntroSequence =
          preserveActiveIntroDialogue &&
          activeChar.dialogueActive &&
          Array.isArray(activeChar.orderedDialogueSequence) &&
          activeChar.orderedDialogueSequence.length > 0;
        if (!alreadyInIntroSequence) {
          activeChar.startOrderedDialogueSequence(introSequenceState.talkingSequence);
        }
        activeChar.mixer.update(0.0);
        activeChar.root.updateMatrixWorld(true);
      }

      introSequenceState.currentBoxIndex = 0;
      _lastRenderedIntroCardIdx = -1;
      if (
        introGenerationTelemetry.status === 'resolved' &&
        Array.isArray(introGenerationTelemetry.cards) &&
        introGenerationTelemetry.cards.length === 7
      ) {
        introSequenceState.boxes = introGenerationTelemetry.cards.map((b) => ({ ...b }));
        introGenerationTelemetry.source = 'hf_json_schema';
        introGenerationTelemetry.introSource = 'hf_json_schema';
        if (introGenerationTelemetry.adoptedAtCardIndex === null) {
          introGenerationTelemetry.adoptedAtCardIndex = 0;
        }
      }
      if (introSequenceState.boxes.length > 0) {
        introSequenceState.phase = 'dialogue-active';
        introSequenceState.scrollLocked = true;
        if (sandbox.portfolioHUD) {
          sandbox.portfolioHUD.resetToDormantPreDialogueState();
        }
      } else {
        introSequenceState.phase = 'ready-to-scroll';
        introSequenceState.scrollLocked = false;
        if (sandbox.portfolioHUD) {
          sandbox.portfolioHUD.playBootChoreography({ force: true });
        }
      }

      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      updateTelemetryHUD();
      renderer.render(scene, camera);
      return this.getIntroSequenceState();
    },

    completeIntroDialogue({ openDoomChat = false } = {}) {
      if (cameraPanState.mode === 'playing') {
        cameraPanState.mode = 'settled';
        cameraPanState.playing = false;
      }
      introSequenceState.currentBoxIndex = introSequenceState.boxes.length;
      introSequenceState.phase = 'ready-to-scroll';
      introSequenceState.scrollLocked = false;
      _lastRenderedIntroCardIdx = -1;

      if (!openDoomChat) {
        const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
        if (activeChar && activeChar.dialogueActive) {
          activeChar.stopDialogue();
          activeChar.mixer.update(0.0);
          activeChar.root.updateMatrixWorld(true);
        }
      }

      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      if (sandbox.portfolioHUD) {
        sandbox.portfolioHUD.playBootChoreography({ force: true });
      }
      updateTelemetryHUD();

      if (openDoomChat && sandbox && typeof sandbox.enterDoomChatMode === 'function') {
        sandbox.enterDoomChatMode({ resetToStarters: true });
        if (typeof requestAnimationFrame === 'function' && typeof document !== 'undefined') {
          requestAnimationFrame(() => {
            const chatInputEl = document.getElementById('doom-chat-input');
            if (chatInputEl) {
              try {
                chatInputEl.focus({ preventScroll: true });
              } catch (_e) {
                chatInputEl.focus();
              }
            }
          });
        }
      } else {
        renderer.render(scene, camera);
      }
      return this.getIntroSequenceState();
    },

    advanceDialogueBox() {
      if (introSequenceState.phase !== 'dialogue-active') {
        return this.getIntroSequenceState();
      }
      introSequenceState.currentBoxIndex += 1;
      if (introSequenceState.currentBoxIndex >= introSequenceState.boxes.length) {
        return this.completeIntroDialogue({ openDoomChat: false });
      }
      introSequenceState.selectedEditBoxIndex = introSequenceState.currentBoxIndex;
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      updateTelemetryHUD();
      return this.getIntroSequenceState();
    },

    setDialogueBoxCount(count, persist = true) {
      const n = Math.max(1, Math.min(12, Math.round(Number(count) || 7)));
      const nextBoxes = [];
      for (let i = 0; i < n; i++) {
        if (i < introSequenceState.boxes.length && introSequenceState.boxes[i]) {
          nextBoxes.push({
            ...introSequenceState.boxes[i],
            requires_question_prompt: i === n - 1,
          });
        } else if (i < DEFAULT_INTRO_DIALOGUE_BOXES.length) {
          nextBoxes.push({
            ...DEFAULT_INTRO_DIALOGUE_BOXES[i],
            requires_question_prompt: i === n - 1,
          });
        } else {
          const numStr = String(i + 1).padStart(2, '0');
          nextBoxes.push({
            id: `card_${numStr}`,
            title: `${numStr} // DIALOGUE`,
            text: `Dialogue box ${i + 1} of ${n}.`,
            requires_question_prompt: i === n - 1,
          });
        }
      }
      introSequenceState.boxes = nextBoxes;
      introSequenceState.selectedEditBoxIndex = Math.min(introSequenceState.selectedEditBoxIndex, n - 1);
      if (introSequenceState.phase === 'dialogue-active' && introSequenceState.currentBoxIndex >= n) {
        introSequenceState.currentBoxIndex = Math.max(0, n - 1);
      }
      if (persist) {
        this.saveToStorage();
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      return this.getIntroSequenceState();
    },

    setDialogueBoxes(boxes, persist = true) {
      if (!Array.isArray(boxes) || boxes.length === 0) return this.getIntroSequenceState();
      const sliced = boxes.slice(0, 12);
      introSequenceState.boxes = sliced.map((b, idx) => {
        const numStr = String(idx + 1).padStart(2, '0');
        return {
          id: b && b.id ? String(b.id) : `card_${numStr}`,
          title:
            b && typeof b.title === 'string'
              ? b.title
              : b && typeof b.header === 'string'
              ? b.header
              : `${numStr} // DIALOGUE`,
          text: sanitizeIntroDialogueText(
            b && typeof b.text === 'string'
              ? b.text
              : b && typeof b.body === 'string'
              ? b.body
              : ''
          ),
          requires_question_prompt: Boolean(
            (b && b.requires_question_prompt) || idx === sliced.length - 1
          ),
        };
      });
      introSequenceState.selectedEditBoxIndex = Math.min(
        introSequenceState.selectedEditBoxIndex,
        introSequenceState.boxes.length - 1
      );
      if (
        introSequenceState.phase === 'dialogue-active' &&
        introSequenceState.currentBoxIndex >= introSequenceState.boxes.length
      ) {
        introSequenceState.currentBoxIndex = Math.max(0, introSequenceState.boxes.length - 1);
      }
      if (persist) {
        this.saveToStorage();
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      return this.getIntroSequenceState();
    },

    updateDialogueBoxAtIndex(index, partial, persist = true) {
      const idx = Math.max(0, Math.min(introSequenceState.boxes.length - 1, Number(index) || 0));
      const box = introSequenceState.boxes[idx];
      if (!box || !partial || typeof partial !== 'object') return this.getIntroSequenceState();
      if (typeof partial.title === 'string') box.title = partial.title;
      if (typeof partial.text === 'string') box.text = partial.text;
      if (persist) {
        this.saveToStorage();
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      return this.getIntroSequenceState();
    },

    syncHandleGeometries() {
      // 1. Sync spawn marker
      playerSpawnMarkerGroup.position.set(spawnState.x, spawnState.y, spawnState.z);
      playerSpawnMarkerGroup.rotation.y = spawnState.yawRad;

      // 2. Sync auto-midpoint if custom midpoint is not active
      if (!cameraPanState.useCustomMidpoint) {
        cameraPanState.midPos.set(
          Number((0.5 * (cameraPanState.startPos.x + cameraPanState.endPos.x)).toFixed(3)),
          Number((0.5 * (cameraPanState.startPos.y + cameraPanState.endPos.y) + 0.20).toFixed(3)),
          Number((0.5 * (cameraPanState.startPos.z + cameraPanState.endPos.z)).toFixed(3))
        );
      }

      // 3. Sync camera pan handles
      startCamHandle.position.copy(cameraPanState.startPos);
      startLookAtHandle.position.copy(cameraPanState.startLookAt);
      startCamHandle.lookAt(cameraPanState.startLookAt);
      startLookAtLine.geometry.setFromPoints([cameraPanState.startPos, cameraPanState.startLookAt]);

      midCamHandle.position.copy(cameraPanState.midPos);

      endCamHandle.position.copy(cameraPanState.endPos);
      endLookAtHandle.position.copy(cameraPanState.endLookAt);
      endCamHandle.lookAt(cameraPanState.endLookAt);
      endLookAtLine.geometry.setFromPoints([cameraPanState.endPos, cameraPanState.endLookAt]);

      // 4. Sync flight trajectory curve passing directly through midPos at t = 0.5
      const ctrlPt = computeBezierControlPointFromMidpoint(
        cameraPanState.startPos,
        cameraPanState.midPos,
        cameraPanState.endPos
      );
      const curve = new THREE.QuadraticBezierCurve3(cameraPanState.startPos, ctrlPt, cameraPanState.endPos);
      const pts = curve.getPoints(28);
      trajectoryCurveMesh.geometry.setFromPoints(pts);

      // 5. Sync 3D Scroll Walk Path floor preview curve from Spawn into the alley
      const walkPts = [];
      const walkSamples = 48;
      for (let i = 0; i <= walkSamples; i++) {
        const pSample = (i / walkSamples) * 0.55;
        const poseSample = evaluateScrollCorridorPath(pSample, spawnState);
        const ySample = spawnState.y + (floorY - spawnState.y) * Math.min(1.0, pSample / 0.05) + 0.05;
        walkPts.push(new THREE.Vector3(poseSample.x, ySample, poseSample.z));
      }
      walkPathCurveMesh.geometry.setFromPoints(walkPts);

      // 6. Sync 3D Bounding Walls outline helper if wallSegments are available
      if (sandbox.environment && Array.isArray(sandbox.environment.wallSegments)) {
        const wallPts = [];
        const yBot = floorY + 0.06;
        const yTop = floorY + 1.35;
        for (const seg of sandbox.environment.wallSegments) {
          wallPts.push(
            new THREE.Vector3(seg.ax, yBot, seg.az),
            new THREE.Vector3(seg.bx, yBot, seg.bz),
            new THREE.Vector3(seg.ax, yTop, seg.az),
            new THREE.Vector3(seg.bx, yTop, seg.bz),
            new THREE.Vector3(seg.ax, yBot, seg.az),
            new THREE.Vector3(seg.ax, yTop, seg.az)
          );
        }
        boundingWallsLineMesh.geometry.setFromPoints(wallPts);
      }

      directorRootGroup.updateMatrixWorld(true);
    },

    setSpawnTransform(partial, persist = true) {
      if (!partial || typeof partial !== 'object') return this.getSpawnTransform();
      if (typeof partial.x === 'number' && Number.isFinite(partial.x)) {
        spawnState.x = Number(partial.x.toFixed(3));
      }
      if (typeof partial.y === 'number' && Number.isFinite(partial.y)) {
        spawnState.y = Number(partial.y.toFixed(3));
      }
      if (typeof partial.z === 'number' && Number.isFinite(partial.z)) {
        spawnState.z = Number(partial.z.toFixed(3));
      }
      if (typeof partial.yawRad === 'number' && Number.isFinite(partial.yawRad)) {
        let y = partial.yawRad;
        while (y > Math.PI) y -= Math.PI * 2;
        while (y < -Math.PI) y += Math.PI * 2;
        spawnState.yawRad = Number(y.toFixed(4));
        spawnState.yawDeg = Math.round(THREE.MathUtils.radToDeg(spawnState.yawRad));
      } else if (typeof partial.yawDeg === 'number' && Number.isFinite(partial.yawDeg)) {
        spawnState.yawDeg = Math.round(partial.yawDeg);
        spawnState.yawRad = Number(THREE.MathUtils.degToRad(spawnState.yawDeg).toFixed(4));
      } else if (typeof partial.yaw === 'number' && Number.isFinite(partial.yaw)) {
        let y = partial.yaw;
        while (y > Math.PI) y -= Math.PI * 2;
        while (y < -Math.PI) y += Math.PI * 2;
        spawnState.yawRad = Number(y.toFixed(4));
        spawnState.yawDeg = Math.round(THREE.MathUtils.radToDeg(spawnState.yawRad));
      }

      this.syncHandleGeometries();

      if (sandbox.environment) {
        sandbox.environment.spawnPlayerPos.set(spawnState.x, spawnState.y, spawnState.z);
        sandbox.environment.spawnPlayerYaw = spawnState.yawRad;
      }

      if (this.cameraPOVMode || (sandbox.mode === 'scroll' && sandbox.scrollProgress <= 0.001)) {
        const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
        if (activeChar) {
          activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
          activeChar.yaw = spawnState.yawRad;
          activeChar.root.position.copy(activeChar.position);
          activeChar.root.rotation.set(0, activeChar.yaw, 0);
          activeChar.root.updateMatrixWorld(true);
        }
      }

      if (persist) {
        this.saveToStorage();
      }
      syncDirectorHUDInputs();
      return this.getSpawnTransform();
    },

    getSpawnTransform() {
      return {
        x: spawnState.x,
        y: spawnState.y,
        z: spawnState.z,
        yawRad: spawnState.yawRad,
        yawDeg: spawnState.yawDeg,
      };
    },

    resetSpawnTransform(persist = true) {
      this.setSpawnTransform({
        x: DEFAULT_PLAYER_SPAWN.x,
        y: floorY,
        z: DEFAULT_PLAYER_SPAWN.z,
        yawRad: DEFAULT_PLAYER_SPAWN.yawRad,
      }, false);
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(SPAWN_STORAGE_KEY);
        window.localStorage.removeItem(`${SPAWN_STORAGE_KEY}_ts`);
      }
      if (persist && sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.deletePersistedSceneLayout === 'function') {
        sandbox.deletePersistedSceneLayout('player_spawn');
      }
      return this.getSpawnTransform();
    },

    setCameraPan(partial, persist = true) {
      if (!partial || typeof partial !== 'object') return this.getCameraPan();
      if (partial.startPos && typeof partial.startPos === 'object') {
        if (typeof partial.startPos.x === 'number') cameraPanState.startPos.x = Number(partial.startPos.x.toFixed(3));
        if (typeof partial.startPos.y === 'number') cameraPanState.startPos.y = Number(partial.startPos.y.toFixed(3));
        if (typeof partial.startPos.z === 'number') cameraPanState.startPos.z = Number(partial.startPos.z.toFixed(3));
      }
      if (partial.startLookAt && typeof partial.startLookAt === 'object') {
        if (typeof partial.startLookAt.x === 'number') cameraPanState.startLookAt.x = Number(partial.startLookAt.x.toFixed(3));
        if (typeof partial.startLookAt.y === 'number') cameraPanState.startLookAt.y = Number(partial.startLookAt.y.toFixed(3));
        if (typeof partial.startLookAt.z === 'number') cameraPanState.startLookAt.z = Number(partial.startLookAt.z.toFixed(3));
      }
      if (typeof partial.useCustomMidpoint === 'boolean') {
        cameraPanState.useCustomMidpoint = partial.useCustomMidpoint;
      }
      if (partial.midPos && typeof partial.midPos === 'object') {
        if (typeof partial.midPos.x === 'number') cameraPanState.midPos.x = Number(partial.midPos.x.toFixed(3));
        if (typeof partial.midPos.y === 'number') cameraPanState.midPos.y = Number(partial.midPos.y.toFixed(3));
        if (typeof partial.midPos.z === 'number') cameraPanState.midPos.z = Number(partial.midPos.z.toFixed(3));
        if (partial.useCustomMidpoint === undefined) {
          cameraPanState.useCustomMidpoint = true;
        }
      }
      if (partial.endPos && typeof partial.endPos === 'object') {
        if (typeof partial.endPos.x === 'number') cameraPanState.endPos.x = Number(partial.endPos.x.toFixed(3));
        if (typeof partial.endPos.y === 'number') cameraPanState.endPos.y = Number(partial.endPos.y.toFixed(3));
        if (typeof partial.endPos.z === 'number') cameraPanState.endPos.z = Number(partial.endPos.z.toFixed(3));
      }
      if (partial.endLookAt && typeof partial.endLookAt === 'object') {
        if (typeof partial.endLookAt.x === 'number') cameraPanState.endLookAt.x = Number(partial.endLookAt.x.toFixed(3));
        if (typeof partial.endLookAt.y === 'number') cameraPanState.endLookAt.y = Number(partial.endLookAt.y.toFixed(3));
        if (typeof partial.endLookAt.z === 'number') cameraPanState.endLookAt.z = Number(partial.endLookAt.z.toFixed(3));
      }
      if (typeof partial.durationSec === 'number' && Number.isFinite(partial.durationSec)) {
        cameraPanState.durationSec = Math.max(0.2, Math.min(20.0, Number(partial.durationSec.toFixed(2))));
      }

      this.syncHandleGeometries();

      if (persist) {
        this.saveToStorage();
      }
      syncDirectorHUDInputs();
      return this.getCameraPan();
    },

    getCameraPan() {
      return {
        startPos: { x: cameraPanState.startPos.x, y: cameraPanState.startPos.y, z: cameraPanState.startPos.z },
        startLookAt: { x: cameraPanState.startLookAt.x, y: cameraPanState.startLookAt.y, z: cameraPanState.startLookAt.z },
        midPos: { x: cameraPanState.midPos.x, y: cameraPanState.midPos.y, z: cameraPanState.midPos.z },
        useCustomMidpoint: cameraPanState.useCustomMidpoint,
        endPos: { x: cameraPanState.endPos.x, y: cameraPanState.endPos.y, z: cameraPanState.endPos.z },
        endLookAt: { x: cameraPanState.endLookAt.x, y: cameraPanState.endLookAt.y, z: cameraPanState.endLookAt.z },
        durationSec: cameraPanState.durationSec,
        mode: cameraPanState.mode,
        progress: cameraPanState.progress,
      };
    },

    resetCameraPan(persist = true) {
      this.setCameraPan({
        startPos: DEFAULT_STARTUP_PAN.startPos,
        startLookAt: DEFAULT_STARTUP_PAN.startLookAt,
        midPos: DEFAULT_STARTUP_PAN.midPos,
        useCustomMidpoint: Boolean(DEFAULT_STARTUP_PAN.useCustomMidpoint),
        endPos: DEFAULT_STARTUP_PAN.endPos,
        endLookAt: DEFAULT_STARTUP_PAN.endLookAt,
        durationSec: DEFAULT_STARTUP_PAN.durationSec,
      }, false);
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STARTUP_PAN_STORAGE_KEY);
        window.localStorage.removeItem(`${STARTUP_PAN_STORAGE_KEY}_ts`);
      }
      if (persist && sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.deletePersistedSceneLayout === 'function') {
        sandbox.deletePersistedSceneLayout('startup_camera_pan');
      }
      return this.getCameraPan();
    },

    straightenTrajectory(persist = true) {
      return this.setCameraPan({
        useCustomMidpoint: false,
        midPos: {
          x: 0.5 * (cameraPanState.startPos.x + cameraPanState.endPos.x),
          y: 0.5 * (cameraPanState.startPos.y + cameraPanState.endPos.y),
          z: 0.5 * (cameraPanState.startPos.z + cameraPanState.endPos.z),
        },
      }, persist);
    },

    captureCurrentViewAsPanStart() {
      const curCamPos = camera.position.clone();
      const curLookAt = resolveLookAtFromCurrentCamera(povState.focusDistance);
      return this.setCameraPan({
        startPos: { x: curCamPos.x, y: curCamPos.y, z: curCamPos.z },
        startLookAt: { x: curLookAt.x, y: curLookAt.y, z: curLookAt.z },
      }, true);
    },

    captureCurrentViewAsPanMid() {
      const curCamPos = camera.position.clone();
      return this.setCameraPan({
        useCustomMidpoint: true,
        midPos: { x: curCamPos.x, y: curCamPos.y, z: curCamPos.z },
      }, true);
    },

    captureCurrentViewAsPanEnd() {
      const curCamPos = camera.position.clone();
      const curLookAt = resolveLookAtFromCurrentCamera(povState.focusDistance);
      return this.setCameraPan({
        endPos: { x: curCamPos.x, y: curCamPos.y, z: curCamPos.z },
        endLookAt: { x: curLookAt.x, y: curLookAt.y, z: curLookAt.z },
      }, true);
    },

    syncPOVStateFromPose(posVec, lookAtVec) {
      povState.position.copy(posVec);
      const dir = new THREE.Vector3().subVectors(lookAtVec, posVec);
      const len = dir.length();
      if (len > 1e-4) {
        dir.divideScalar(len);
        povState.focusDistance = Math.max(0.8, Math.min(16.0, len));
        povState.yaw = Math.atan2(dir.x, dir.z);
        povState.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, -dir.y)));
      }
    },

    previewPanStartPose() {
      cameraPanState.mode = 'preview-start';
      cameraPanState.playing = false;
      this.syncPOVStateFromPose(cameraPanState.startPos, cameraPanState.startLookAt);
      camera.position.copy(cameraPanState.startPos);
      if (mountFocusCameraState) mountFocusCameraState.currentLookAt.copy(cameraPanState.startLookAt);
      camera.lookAt(cameraPanState.startLookAt);
      camera.updateMatrixWorld(true);
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return true;
    },

    previewPanMidPose() {
      cameraPanState.mode = 'preview-mid';
      cameraPanState.playing = false;
      const midLook = new THREE.Vector3().lerpVectors(cameraPanState.startLookAt, cameraPanState.endLookAt, 0.5);
      this.syncPOVStateFromPose(cameraPanState.midPos, midLook);
      camera.position.copy(cameraPanState.midPos);
      if (mountFocusCameraState) mountFocusCameraState.currentLookAt.copy(midLook);
      camera.lookAt(midLook);
      camera.updateMatrixWorld(true);
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return true;
    },

    previewPanEndPose() {
      cameraPanState.mode = 'preview-end';
      cameraPanState.playing = false;
      this.syncPOVStateFromPose(cameraPanState.endPos, cameraPanState.endLookAt);
      camera.position.copy(cameraPanState.endPos);
      if (mountFocusCameraState) mountFocusCameraState.currentLookAt.copy(cameraPanState.endLookAt);
      camera.lookAt(cameraPanState.endLookAt);
      camera.updateMatrixWorld(true);
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return true;
    },

    playStartupPan() {
      if (this.cameraPOVMode) {
        this.toggleCameraPOVMode(false);
      }
      if (sandbox.mode === 'mount-focus') {
        sandbox.exitMountFocusMode({ immediate: true });
      }
      if (sandbox.freeRoamFlyMode) {
        sandbox.toggleFreeRoamFlyMode(false);
      }
      document.body.classList.remove('freeroam-mode');
      sandbox.mode = 'scroll';
      sandbox.scrollProgress = 0.0;
      sandbox.targetScrollProgress = 0.0;
      sandbox.scrollVelocity = 0.0;
      syncWindowScrollToFraction(0.0);

      // Lock scrolling while the startup camera pan plays
      introSequenceState.phase = 'pan-playing';
      introSequenceState.scrollLocked = true;
      introSequenceState.currentBoxIndex = 0;

      // Station character at Spawn Coordinates in Idle during the pan
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar) {
        activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
        activeChar.yaw = spawnState.yawRad;
        activeChar.velocity.set(0, 0, 0);
        activeChar.isGrounded = true;
        if (activeChar.dialogueActive) {
          activeChar.stopDialogue();
        }
        activeChar.customEmoteActive = false;
        activeChar.state = 'Idle';
        activeChar.crossfadeTo('IDLE_DEFAULT', 0.12);
        activeChar.root.position.copy(activeChar.position);
        activeChar.root.rotation.set(0, activeChar.yaw, 0);
        activeChar.root.updateMatrixWorld(true);
      }
      cameraPanState.mode = 'playing';
      cameraPanState.playing = true;
      cameraPanState.elapsed = 0.0;
      cameraPanState.progress = 0.0;
      camera.position.copy(cameraPanState.startPos);
      if (mountFocusCameraState) mountFocusCameraState.currentLookAt.copy(cameraPanState.startLookAt);
      camera.lookAt(cameraPanState.startLookAt);
      camera.updateMatrixWorld(true);
      if (sandbox.sceneMaterialization) {
        sandbox.sceneMaterialization.playBootMaterialization();
      }
      if (sandbox.portfolioHUD) {
        sandbox.portfolioHUD.resetToDormantPreDialogueState();
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      updateTelemetryHUD();
      return true;
    },

    stopStartupPan(useOrbit = false) {
      cameraPanState.mode = useOrbit ? 'orbit' : 'settled';
      cameraPanState.playing = false;
      if (sandbox.sceneMaterialization && !sandbox.sceneMaterialization.resolved) {
        sandbox.sceneMaterialization.accelerateToResolved();
      }
      if (sandbox.portfolioHUD && !sandbox.portfolioHUD.isIntroSequenceHoldingHUD()) {
        sandbox.portfolioHUD.resolveAllImmediate();
      }
      syncDirectorHUDInputs();
      return true;
    },

    updateCameraPan(dt) {
      const pan = cameraPanState;
      if (pan.mode !== 'playing') return;
      pan.elapsed += dt;
      const t = Math.min(1.0, pan.elapsed / Math.max(0.1, pan.durationSec));
      pan.progress = t;
      const ease = directorCubicEaseInOut(t);

      const inv = 1.0 - ease;
      const ctrlPt = computeBezierControlPointFromMidpoint(pan.startPos, pan.midPos, pan.endPos);

      camera.position.set(
        inv * inv * pan.startPos.x + 2.0 * inv * ease * ctrlPt.x + ease * ease * pan.endPos.x,
        inv * inv * pan.startPos.y + 2.0 * inv * ease * ctrlPt.y + ease * ease * pan.endPos.y,
        inv * inv * pan.startPos.z + 2.0 * inv * ease * ctrlPt.z + ease * ease * pan.endPos.z
      );
      if (mountFocusCameraState) {
        mountFocusCameraState.currentLookAt.lerpVectors(pan.startLookAt, pan.endLookAt, ease);
        camera.lookAt(mountFocusCameraState.currentLookAt);
      } else {
        camera.lookAt(pan.endLookAt);
      }

      if (t >= 1.0) {
        pan.mode = 'settled';
        pan.playing = false;
        this.completeStartupPanWithIntroGrace();
        return;
      }
      syncDirectorHUDInputs();
    },

    completeStartupPanWithIntroGrace() {
      if (
        introGenerationTelemetry.status !== 'in_flight' ||
        !_introPrefetchPromise
      ) {
        this.startIntroTalkingSequence();
        return;
      }

      camera.position.copy(cameraPanState.endPos);
      if (mountFocusCameraState) {
        mountFocusCameraState.currentLookAt.copy(cameraPanState.endLookAt);
      }
      camera.lookAt(cameraPanState.endLookAt);
      camera.updateMatrixWorld(true);

      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar) {
        activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
        activeChar.yaw = spawnState.yawRad;
        activeChar.velocity.set(0, 0, 0);
        activeChar.isGrounded = true;
        activeChar.root.position.copy(activeChar.position);
        activeChar.root.rotation.set(0, activeChar.yaw, 0);
        activeChar.startOrderedDialogueSequence(introSequenceState.talkingSequence);
        activeChar.mixer.update(0.0);
        activeChar.root.updateMatrixWorld(true);
      }

      // Bounded 600ms post-pan grace window (Spec 065 §6 & §7.1)
      introSequenceState.phase = 'pan-playing';
      introSequenceState.scrollLocked = true;
      const graceStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const handoffToken = (this._panHandoffToken = (this._panHandoffToken || 0) + 1);

      Promise.race([
        _introPrefetchPromise,
        new Promise((resolve) => setTimeout(() => resolve('__GRACE_TIMEOUT__'), INTRO_POST_PAN_GRACE_MS)),
      ]).then((raceOutcome) => {
        if (this._panHandoffToken !== handoffToken) return;
        if (sandbox.mode !== 'scroll' || introSequenceState.phase !== 'pan-playing') return;
        introGenerationTelemetry.graceWaitMs = Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - graceStartMs
        );
        if (raceOutcome === '__GRACE_TIMEOUT__' && introGenerationTelemetry.status === 'in_flight') {
          introGenerationTelemetry.source = 'anchor_fallback';
          introGenerationTelemetry.introSource = 'anchor_fallback_grace_timeout';
        }
        this.startIntroTalkingSequence({ preserveActiveIntroDialogue: true });
      });
    },

    toggleCameraPOVMode(forceState = undefined) {
      const nextState = typeof forceState === 'boolean' ? forceState : !this.cameraPOVMode;
      this.cameraPOVMode = nextState;

      if (nextState) {
        if (sandbox.mode === 'mount-focus') {
          sandbox.exitMountFocusMode({ immediate: true });
        }
        if (sandbox.freeRoamFlyMode) {
          sandbox.toggleFreeRoamFlyMode(false);
        }
        cameraPanState.playing = false;
        cameraPanState.mode = 'pov';

        // Initialize POV camera pose seamlessly from current Three.js camera
        povState.position.copy(camera.position);
        const dir = camera.getWorldDirection(new THREE.Vector3()).normalize();
        povState.yaw = Math.atan2(dir.x, dir.z);
        povState.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, -dir.y)));

        // Station character at Spawn Coordinates so user can compose shots around the character
        const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
        if (activeChar) {
          activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
          activeChar.yaw = spawnState.yawRad;
          activeChar.velocity.set(0, 0, 0);
          activeChar.isGrounded = true;
          if (!activeChar.customEmoteActive && !activeChar.dialogueActive) {
            activeChar.state = 'Idle';
            activeChar.crossfadeTo('IDLE_DEFAULT', 0.12);
          }
          activeChar.root.position.copy(activeChar.position);
          activeChar.root.rotation.set(0, activeChar.yaw, 0);
          activeChar.root.updateMatrixWorld(true);
        }

        // Automatically show 3D handles & trajectory so user can see the path while flying
        this.editMode = true;
        directorRootGroup.visible = true;
      } else {
        if (cameraPanState.mode === 'pov') {
          cameraPanState.mode = 'settled';
        }
      }

      const povOverlay = typeof document !== 'undefined' ? document.getElementById('director-pov-overlay') : null;
      if (povOverlay) {
        povOverlay.style.display = this.cameraPOVMode ? 'flex' : 'none';
      }

      updateCameraController(0.0);
      syncDirectorHUDInputs();
      updateTelemetryHUD();
      renderer.render(scene, camera);
      return this.cameraPOVMode;
    },

    updateCameraPOV(dt) {
      if (!this.cameraPOVMode) return;

      // Keep active character anchored at spawnState so user can compose camera shots around them
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar) {
        activeChar.position.set(spawnState.x, spawnState.y, spawnState.z);
        activeChar.yaw = spawnState.yawRad;
        activeChar.velocity.set(0, 0, 0);
        activeChar.root.position.copy(activeChar.position);
        activeChar.root.rotation.set(0, activeChar.yaw, 0);
      }

      const forwardPos = keysPressed.KeyW || keysPressed.ArrowUp ? 1.0 : 0.0;
      const forwardNeg = keysPressed.KeyS || keysPressed.ArrowDown ? 1.0 : 0.0;
      const rightPos = keysPressed.KeyD || keysPressed.ArrowRight ? 1.0 : 0.0;
      const rightNeg = keysPressed.KeyA || keysPressed.ArrowLeft ? 1.0 : 0.0;
      const upPos = keysPressed.Space || keysPressed.KeyE ? 1.0 : 0.0;
      const downNeg = keysPressed.KeyQ || keysPressed.KeyZ || keysPressed.ControlLeft || keysPressed.ControlRight ? 1.0 : 0.0;

      const forwardInput = forwardPos - forwardNeg;
      const rightInput = rightPos - rightNeg;
      const verticalInput = upPos - downNeg;

      const isBoost = Boolean(keysPressed.ShiftLeft || keysPressed.ShiftRight);
      const isSlow = Boolean(keysPressed.AltLeft || keysPressed.AltRight);
      const speedMult = isBoost ? 2.6 : isSlow ? 0.25 : 1.0;
      const effSpeed = povState.flySpeed * speedMult;

      const cosPitch = Math.cos(povState.pitch);
      const sinPitch = -Math.sin(povState.pitch);
      const lookFwdX = Math.sin(povState.yaw) * cosPitch;
      const lookFwdY = sinPitch;
      const lookFwdZ = Math.cos(povState.yaw) * cosPitch;

      const rightX = -Math.cos(povState.yaw);
      const rightZ = Math.sin(povState.yaw);

      const vx = (lookFwdX * forwardInput + rightX * rightInput) * effSpeed;
      const vy = (lookFwdY * forwardInput + verticalInput) * effSpeed;
      const vz = (lookFwdZ * forwardInput + rightZ * rightInput) * effSpeed;

      if (Math.abs(vx) > 1e-5 || Math.abs(vy) > 1e-5 || Math.abs(vz) > 1e-5) {
        povState.position.x = Number((povState.position.x + vx * dt).toFixed(4));
        povState.position.y = Number((povState.position.y + vy * dt).toFixed(4));
        povState.position.z = Number((povState.position.z + vz * dt).toFixed(4));
        if (cameraPanState.mode === 'preview-start' || cameraPanState.mode === 'preview-mid' || cameraPanState.mode === 'preview-end') {
          cameraPanState.mode = 'pov';
        }
        syncDirectorHUDInputs();
      }
    },

    applyCameraPOVPose() {
      const cosPitch = Math.cos(povState.pitch);
      const sinPitch = -Math.sin(povState.pitch);
      const lookFwdX = Math.sin(povState.yaw) * cosPitch;
      const lookFwdY = sinPitch;
      const lookFwdZ = Math.cos(povState.yaw) * cosPitch;

      camera.position.copy(povState.position);
      const lookTarget = new THREE.Vector3(
        povState.position.x + lookFwdX * povState.focusDistance,
        povState.position.y + lookFwdY * povState.focusDistance,
        povState.position.z + lookFwdZ * povState.focusDistance
      );
      if (mountFocusCameraState) {
        mountFocusCameraState.currentLookAt.copy(lookTarget);
      }
      camera.lookAt(lookTarget);
    },

    placeSpawnAtCameraGroundCrosshair() {
      const origin = camera.position.clone();
      const dir = camera.getWorldDirection(new THREE.Vector3()).normalize();
      let targetX = origin.x + dir.x * 3.0;
      let targetY = floorY;
      let targetZ = origin.z + dir.z * 3.0;

      // Intersect ray with floor collider or horizontal plane y = floorY
      if (sandbox.environment && sandbox.environment.colliderMeshes && sandbox.environment.colliderMeshes.COLLIDER_FLOOR) {
        const rc = new THREE.Raycaster(origin, dir, 0.1, 100.0);
        const hits = rc.intersectObject(sandbox.environment.colliderMeshes.COLLIDER_FLOOR, false);
        if (hits.length > 0) {
          targetX = hits[0].point.x;
          targetY = hits[0].point.y;
          targetZ = hits[0].point.z;
        } else if (Math.abs(dir.y) > 1e-3) {
          const t = (floorY - origin.y) / dir.y;
          if (t > 0.2 && t < 80.0) {
            targetX = origin.x + dir.x * t;
            targetZ = origin.z + dir.z * t;
          }
        }
      } else if (Math.abs(dir.y) > 1e-3) {
        const t = (floorY - origin.y) / dir.y;
        if (t > 0.2 && t < 80.0) {
          targetX = origin.x + dir.x * t;
          targetZ = origin.z + dir.z * t;
        }
      }

      return this.setSpawnTransform({
        x: targetX,
        y: targetY,
        z: targetZ,
      }, true);
    },

    onTransformControlsObjectChange() {
      if (!sandbox.transformControls) return;
      const obj = sandbox.transformControls.object;
      if (!obj) return;
      if (obj === playerSpawnMarkerGroup) {
        const euler = new THREE.Euler().setFromQuaternion(playerSpawnMarkerGroup.quaternion, 'YXZ');
        this.setSpawnTransform({
          x: playerSpawnMarkerGroup.position.x,
          y: playerSpawnMarkerGroup.position.y,
          z: playerSpawnMarkerGroup.position.z,
          yawRad: euler.y,
        }, false);
      } else if (obj === startCamHandle) {
        this.setCameraPan({
          startPos: {
            x: startCamHandle.position.x,
            y: startCamHandle.position.y,
            z: startCamHandle.position.z,
          },
        }, false);
      } else if (obj === startLookAtHandle) {
        this.setCameraPan({
          startLookAt: {
            x: startLookAtHandle.position.x,
            y: startLookAtHandle.position.y,
            z: startLookAtHandle.position.z,
          },
        }, false);
      } else if (obj === midCamHandle) {
        this.setCameraPan({
          useCustomMidpoint: true,
          midPos: {
            x: midCamHandle.position.x,
            y: midCamHandle.position.y,
            z: midCamHandle.position.z,
          },
        }, false);
      } else if (obj === endCamHandle) {
        this.setCameraPan({
          endPos: {
            x: endCamHandle.position.x,
            y: endCamHandle.position.y,
            z: endCamHandle.position.z,
          },
        }, false);
      } else if (obj === endLookAtHandle) {
        this.setCameraPan({
          endLookAt: {
            x: endLookAtHandle.position.x,
            y: endLookAtHandle.position.y,
            z: endLookAtHandle.position.z,
          },
        }, false);
      }
    },

    toggleEditMode(forceState = undefined) {
      const nextState = typeof forceState === 'boolean' ? forceState : !this.editMode;
      this.editMode = nextState;
      directorRootGroup.visible = nextState;

      if (nextState) {
        if (sandbox.lamppostEditMode) {
          sandbox.toggleLamppostEditMode(false);
        }
        if (sandbox.holoEditMode) {
          sandbox.toggleHoloEditMode(false);
        }
        if (sandbox.mode === 'mount-focus') {
          sandbox.exitMountFocusMode({ immediate: true });
        }
        if (!this.cameraPOVMode && (cameraPanState.mode === 'settled' || cameraPanState.mode === 'playing')) {
          cameraPanState.mode = 'orbit';
          cameraPanState.playing = false;
        }
        if (!this.cameraPOVMode) {
          cameraOrbit.desiredDistance = Math.max(cameraOrbit.desiredDistance, 4.6);
          cameraOrbit.pitch = Math.max(cameraOrbit.pitch, 0.28);
        }
        this.selectHandle(this.selectedHandleId || 'spawn');
      } else {
        if (!this.cameraPOVMode && cameraPanState.mode === 'orbit') {
          cameraPanState.mode = 'settled';
        }
        if (!this.cameraPOVMode) {
          cameraOrbit.desiredDistance = characterCameraState.distance;
          cameraOrbit.pitch = characterCameraState.pitchRad;
          cameraOrbit.yaw = resolveCharacterAlignedCameraYaw();
        }
        if (sandbox.transformControls && this.isTransformControlsAttachedToDirector()) {
          sandbox.transformControls.detach();
          sandbox.transformControls.enabled = false;
        }
      }
      updateCameraController(0.0);
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return this.editMode;
    },

    isTransformControlsAttachedToDirector() {
      if (!sandbox.transformControls) return false;
      const target = sandbox.transformControls.object;
      return Object.values(handlesById).includes(target);
    },

    selectHandle(handleId) {
      if (!handlesById[handleId]) return null;
      this.selectedHandleId = handleId;
      if (!this.editMode) {
        this.toggleEditMode(true);
      }
      const targetObj = handlesById[handleId];
      if (sandbox.transformControls) {
        sandbox.transformControls.enabled = true;
        const mode = handleId === 'spawn' ? this.gizmoMode : 'translate';
        sandbox.transformControls.setMode(mode);
        sandbox.transformControls.setSpace(mode === 'rotate' ? 'local' : 'world');
        sandbox.transformControls.attach(targetObj);
      }
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return targetObj;
    },

    setGizmoMode(mode) {
      if (mode !== 'translate' && mode !== 'rotate') return false;
      this.gizmoMode = mode;
      if (sandbox.transformControls && this.isTransformControlsAttachedToDirector()) {
        const effMode = this.selectedHandleId === 'spawn' ? mode : 'translate';
        sandbox.transformControls.setMode(effMode);
        sandbox.transformControls.setSpace(effMode === 'rotate' ? 'local' : 'world');
      }
      syncDirectorHUDInputs();
      renderer.render(scene, camera);
      return true;
    },

    resetDefaults(persist = true) {
      this.resetSpawnTransform(persist);
      this.resetCameraPan(persist);
      introSequenceState.boxes = DEFAULT_INTRO_DIALOGUE_BOXES.map((b) => ({ ...b }));
      introSequenceState.selectedEditBoxIndex = 0;
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(INTRO_DIALOGUE_STORAGE_KEY);
        window.localStorage.removeItem(`${INTRO_DIALOGUE_STORAGE_KEY}_ts`);
      }
      if (persist && sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.deletePersistedSceneLayout === 'function') {
        sandbox.deletePersistedSceneLayout('intro_dialogue_boxes');
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
      return this.exportJSON();
    },

    saveToStorage() {
      const spawnPayload = this.getSpawnTransform();
      const panPayload = this.getCameraPan();
      const boxesPayload = introSequenceState.boxes.map((b) => ({ ...b }));
      const updatedAtMs = Date.now();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(SPAWN_STORAGE_KEY, JSON.stringify(spawnPayload));
          window.localStorage.setItem(`${SPAWN_STORAGE_KEY}_ts`, String(updatedAtMs));
          window.localStorage.setItem(STARTUP_PAN_STORAGE_KEY, JSON.stringify(panPayload));
          window.localStorage.setItem(`${STARTUP_PAN_STORAGE_KEY}_ts`, String(updatedAtMs));
          window.localStorage.setItem(INTRO_DIALOGUE_STORAGE_KEY, JSON.stringify(boxesPayload));
          window.localStorage.setItem(`${INTRO_DIALOGUE_STORAGE_KEY}_ts`, String(updatedAtMs));
        } catch (err) {
          return false;
        }
      }
      if (sandbox && !sandbox._hydratingSceneLayouts && typeof sandbox.persistSceneLayoutBatch === 'function') {
        sandbox.persistSceneLayoutBatch(
          {
            player_spawn: spawnPayload,
            startup_camera_pan: panPayload,
            intro_dialogue_boxes: boxesPayload,
          },
          updatedAtMs
        );
      }
      return true;
    },

    loadFromStorage() {
      // Spec 065 §5.3.1, §5.7.1, §7.4: In production (!IS_DEV_MODE), authoritative player spawn, startup camera pan, and 7-card intro sequence are never overridden by stale localStorage authoring snapshots.
      if (!IS_DEV_MODE) return false;
      if (typeof window === 'undefined' || !window.localStorage) return false;
      try {
        const rawSpawn = window.localStorage.getItem(SPAWN_STORAGE_KEY);
        if (rawSpawn) {
          const parsed = JSON.parse(rawSpawn);
          if (parsed && typeof parsed === 'object') {
            this.setSpawnTransform(parsed, false);
          }
        }
        const rawPan = window.localStorage.getItem(STARTUP_PAN_STORAGE_KEY);
        if (rawPan) {
          const parsed = JSON.parse(rawPan);
          if (parsed && typeof parsed === 'object') {
            this.setCameraPan(parsed, false);
          }
        }
        const rawBoxes = window.localStorage.getItem(INTRO_DIALOGUE_STORAGE_KEY);
        if (rawBoxes) {
          const parsed = JSON.parse(rawBoxes);
          if (Array.isArray(parsed) && parsed.length >= 7) {
            this.setDialogueBoxes(parsed, false);
          }
        }
        return true;
      } catch (err) {
        return false;
      }
    },

    exportJSON() {
      return JSON.stringify({
        spawn: this.getSpawnTransform(),
        startupCameraPan: this.getCameraPan(),
        introDialogueBoxes: introSequenceState.boxes.map((b) => ({ ...b })),
        talkingSequence: [...introSequenceState.talkingSequence],
      }, null, 2);
    },
  };

  director.syncHandleGeometries();
  director.loadFromStorage();

  return director;
}

function syncIntroDialogueOverlayUI() {
  if (typeof document === 'undefined' || !sandbox.director) return;
  const d = sandbox.director;
  const intro = d.introSequenceState;

  const overlay = document.getElementById('intro-dialogue-overlay');
  const card = document.getElementById('intro-dialogue-card');
  const counterEl = document.getElementById('intro-dialogue-counter');
  const titleEl = document.getElementById('intro-dialogue-title');
  const textEl = document.getElementById('intro-dialogue-text');
  const pipsEl = document.getElementById('intro-dialogue-pips');
  const nextBtnEl = document.getElementById('intro-dialogue-next-btn');
  const questionActionsEl = document.getElementById('intro-dialogue-question-actions');

  const isScrollMode = sandbox.mode === 'scroll';
  const isDialogueActive =
    isScrollMode &&
    intro.phase === 'dialogue-active' &&
    d.cameraPanState.mode !== 'playing' &&
    !d.cameraPOVMode &&
    intro.currentBoxIndex < intro.boxes.length;

  if (document.body) {
    document.body.classList.toggle('intro-dialogue-active', isDialogueActive);
  }
  const isHoldingHUD =
    isScrollMode &&
    !d.cameraPOVMode &&
    (d.cameraPanState.mode === 'playing' || intro.phase === 'pan-playing' || isDialogueActive);
  if (sandbox.portfolioHUD) {
    if (isHoldingHUD) {
      if (sandbox.portfolioHUD.bootChoreographyPlayed) {
        sandbox.portfolioHUD.resetToDormantPreDialogueState();
      }
    } else if (!sandbox.portfolioHUD.bootChoreographyPlayed) {
      sandbox.portfolioHUD.playBootChoreography({ force: true });
    }
  }
  if (overlay) {
    overlay.style.display = isDialogueActive ? 'flex' : 'none';
  }
  if (card) {
    card.style.display = isDialogueActive ? 'flex' : 'none';
  }

  if (isDialogueActive) {
    const total = intro.boxes.length;
    const idx = Math.max(0, Math.min(total - 1, intro.currentBoxIndex));
    const currentBox = intro.boxes[idx];
    const isQuestionCard = Boolean(
      (currentBox && currentBox.requires_question_prompt) || idx + 1 >= total
    );

    if (card) {
      card.classList.toggle('question-prompt-card', isQuestionCard);
    }

    if (counterEl) {
      counterEl.textContent = `DIALOGUE ${idx + 1} / ${total}`;
    }
    if (titleEl && currentBox) {
      const codeStr = String(idx + 1).padStart(2, '0');
      titleEl.textContent = currentBox.title || `${codeStr} // DIALOGUE`;
    }
    if (textEl && currentBox) {
      textEl.textContent = currentBox.text || '';
      if (_lastRenderedIntroCardIdx !== idx) {
        textEl.scrollTop = 0;
      }
    }
    _lastRenderedIntroCardIdx = idx;

    if (pipsEl) {
      pipsEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const pip = document.createElement('span');
        pip.style.display = 'inline-block';
        pip.style.width = i === idx ? '20px' : '8px';
        pip.style.height = '6px';
        pip.style.borderRadius = '999px';
        pip.style.transition = 'all 0.2s ease';
        pip.style.background =
          i < idx
            ? 'rgba(217, 119, 6, 0.68)'
            : i === idx
            ? '#fbbf24'
            : 'rgba(120, 53, 15, 0.52)';
        pip.style.border =
          i === idx
            ? '1px solid rgba(254, 243, 199, 0.72)'
            : '1px solid rgba(245, 158, 11, 0.35)';
        pip.style.boxShadow = i === idx ? '0 0 8px rgba(245, 158, 11, 0.78)' : 'none';
        pipsEl.appendChild(pip);
      }
    }

    if (isQuestionCard) {
      if (nextBtnEl) {
        nextBtnEl.style.display = 'none';
      }
      if (questionActionsEl) {
        questionActionsEl.style.display = 'inline-flex';
      }
    } else {
      if (questionActionsEl) {
        questionActionsEl.style.display = 'none';
      }
      if (nextBtnEl) {
        nextBtnEl.style.display = 'inline-flex';
        nextBtnEl.textContent = `Continue (${idx + 1}/${total}) →`;
      }
    }
  } else {
    _lastRenderedIntroCardIdx = -1;
  }
}

function syncDirectorHUDInputs() {
  if (typeof document === 'undefined' || !sandbox.director) return;
  const d = sandbox.director;
  const sp = d.spawnState;
  const cp = d.cameraPanState;
  const pov = d.povState;

  const povBtn = document.getElementById('director-toggle-pov-btn');
  if (povBtn) {
    povBtn.textContent = d.cameraPOVMode
      ? '🎥 Camera POV Mode: ON (C)'
      : '🎥 Camera POV Mode: OFF (C)';
    povBtn.classList.toggle('secondary', !d.cameraPOVMode);
  }

  const povReadout = document.getElementById('director-pov-coords-readout');
  if (povReadout && camera) {
    const yawDeg = Math.round(THREE.MathUtils.radToDeg(pov.yaw));
    const pitchDeg = Math.round(THREE.MathUtils.radToDeg(-pov.pitch));
    povReadout.textContent = `CAM POV: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}) | Yaw ${yawDeg}° Pitch ${pitchDeg}°`;
  }

  const toggleBtn = document.getElementById('director-toggle-gizmos-btn');
  if (toggleBtn) {
    toggleBtn.textContent = d.editMode ? '3D Handles: ON (K)' : '3D Handles: OFF (K)';
    toggleBtn.classList.toggle('secondary', !d.editMode);
  }

  const handleSelect = document.getElementById('director-handle-select');
  if (handleSelect && handleSelect.value !== d.selectedHandleId) {
    handleSelect.value = d.selectedHandleId;
  }

  const moveBtn = document.getElementById('director-gizmo-move-btn');
  const rotBtn = document.getElementById('director-gizmo-rotate-btn');
  if (moveBtn) moveBtn.classList.toggle('secondary', d.gizmoMode !== 'translate');
  if (rotBtn) rotBtn.classList.toggle('secondary', d.gizmoMode !== 'rotate');

  const summary = document.getElementById('director-spawn-summary');
  if (summary) {
    summary.textContent = `(${sp.x.toFixed(2)}, ${sp.y.toFixed(2)}, ${sp.z.toFixed(2)}) ${sp.yawDeg}°`;
  }

  const pairs = [
    ['director-spawn-x-slider', 'director-spawn-x-input', sp.x.toFixed(2)],
    ['director-spawn-y-slider', 'director-spawn-y-input', sp.y.toFixed(2)],
    ['director-spawn-z-slider', 'director-spawn-z-input', sp.z.toFixed(2)],
    ['director-spawn-yaw-slider', 'director-spawn-yaw-input', String(sp.yawDeg)],
    ['director-pov-speed-slider', 'director-pov-speed-input', pov.flySpeed.toFixed(1)],
    ['director-cam-start-x', null, cp.startPos.x.toFixed(2)],
    ['director-cam-start-y', null, cp.startPos.y.toFixed(2)],
    ['director-cam-start-z', null, cp.startPos.z.toFixed(2)],
    ['director-look-start-x', null, cp.startLookAt.x.toFixed(2)],
    ['director-look-start-y', null, cp.startLookAt.y.toFixed(2)],
    ['director-look-start-z', null, cp.startLookAt.z.toFixed(2)],
    ['director-cam-mid-x', null, cp.midPos.x.toFixed(2)],
    ['director-cam-mid-y', null, cp.midPos.y.toFixed(2)],
    ['director-cam-mid-z', null, cp.midPos.z.toFixed(2)],
    ['director-cam-end-x', null, cp.endPos.x.toFixed(2)],
    ['director-cam-end-y', null, cp.endPos.y.toFixed(2)],
    ['director-cam-end-z', null, cp.endPos.z.toFixed(2)],
    ['director-look-end-x', null, cp.endLookAt.x.toFixed(2)],
    ['director-look-end-y', null, cp.endLookAt.y.toFixed(2)],
    ['director-look-end-z', null, cp.endLookAt.z.toFixed(2)],
    ['director-pan-duration-slider', 'director-pan-duration-input', cp.durationSec.toFixed(1)],
  ];

  for (const [id1, id2, valStr] of pairs) {
    const el1 = document.getElementById(id1);
    const el2 = id2 ? document.getElementById(id2) : null;
    if (el1 && document.activeElement !== el1) el1.value = valStr;
    if (el2 && document.activeElement !== el2) el2.value = valStr;
  }

  const panStatus = document.getElementById('director-pan-status');
  if (panStatus) {
    panStatus.textContent = d.cameraPOVMode
      ? 'POV Navigation'
      : cp.mode === 'playing'
      ? `Playing (${Math.round(cp.progress * 100)}%)`
      : cp.mode === 'preview-start'
      ? 'Preview Start'
      : cp.mode === 'preview-mid'
      ? 'Preview Mid Arc'
      : cp.mode === 'preview-end'
      ? 'Preview End (Torso)'
      : cp.mode === 'orbit'
      ? 'Orbit Cam'
      : `${cp.durationSec.toFixed(2)}s Pan`;
  }

  const intro = d.introSequenceState;
  const introPhaseBadge = document.getElementById('director-intro-phase-badge');
  if (introPhaseBadge && intro) {
    const locked = d.isScrollLocked();
    if (cp.mode === 'playing') {
      introPhaseBadge.textContent = '🔒 Pan Playing';
      introPhaseBadge.style.color = '#fbbf24';
    } else if (intro.phase === 'dialogue-active' && locked) {
      introPhaseBadge.textContent = `🔒 Box ${Math.min(intro.currentBoxIndex + 1, intro.boxes.length)}/${intro.boxes.length}`;
      introPhaseBadge.style.color = '#38bdf8';
    } else if (intro.phase === 'ready-to-scroll') {
      introPhaseBadge.textContent = '🔓 Scroll Unlocked';
      introPhaseBadge.style.color = '#4ade80';
    } else {
      introPhaseBadge.textContent = '🚶 Walking Alley';
      introPhaseBadge.style.color = '#a855f7';
    }
  }

  const countInput = document.getElementById('director-dialogue-count-input');
  if (countInput && intro && document.activeElement !== countInput) {
    countInput.value = String(intro.boxes.length);
  }

  const boxSelect = document.getElementById('director-dialogue-box-select');
  if (boxSelect && intro) {
    if (boxSelect.options.length !== intro.boxes.length) {
      boxSelect.innerHTML = '';
      for (let i = 0; i < intro.boxes.length; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `Box ${i + 1} / ${intro.boxes.length}`;
        boxSelect.appendChild(opt);
      }
    }
    const targetIdx = String(Math.min(intro.selectedEditBoxIndex || 0, Math.max(0, intro.boxes.length - 1)));
    if (boxSelect.value !== targetIdx) {
      boxSelect.value = targetIdx;
    }
  }

  const boxTextInput = document.getElementById('director-dialogue-box-text-input');
  if (boxTextInput && intro && document.activeElement !== boxTextInput) {
    const editIdx = Math.min(intro.selectedEditBoxIndex || 0, Math.max(0, intro.boxes.length - 1));
    const boxObj = intro.boxes[editIdx];
    boxTextInput.value = boxObj ? boxObj.text : '';
  }

  const advanceHudBtn = document.getElementById('director-dialogue-advance-btn');
  if (advanceHudBtn && intro) {
    if (intro.phase === 'dialogue-active' && intro.currentBoxIndex < intro.boxes.length) {
      advanceHudBtn.textContent = `Tap / Skip Box (${intro.currentBoxIndex + 1}/${intro.boxes.length}) →`;
      advanceHudBtn.disabled = false;
    } else {
      advanceHudBtn.textContent = `All ${intro.boxes.length} Read (Scroll Ready)`;
      advanceHudBtn.disabled = false;
    }
  }

  syncIntroDialogueOverlayUI();
}

function bindDirectorHUDListeners() {
  if (typeof document === 'undefined') return;

  const povBtn = document.getElementById('director-toggle-pov-btn');
  if (povBtn) {
    povBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.toggleCameraPOVMode();
    });
  }

  const povSpeedSlider = document.getElementById('director-pov-speed-slider');
  const povSpeedInput = document.getElementById('director-pov-speed-input');
  if (povSpeedSlider) {
    povSpeedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (Number.isFinite(val) && sandbox.director) {
        sandbox.director.povState.flySpeed = Math.max(0.5, Math.min(30.0, val));
        if (povSpeedInput) povSpeedInput.value = sandbox.director.povState.flySpeed.toFixed(1);
      }
    });
  }
  if (povSpeedInput) {
    povSpeedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (Number.isFinite(val) && sandbox.director) {
        sandbox.director.povState.flySpeed = Math.max(0.5, Math.min(30.0, val));
        if (povSpeedSlider) povSpeedSlider.value = String(sandbox.director.povState.flySpeed);
      }
    });
  }

  const toggleBtn = document.getElementById('director-toggle-gizmos-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.toggleEditMode();
    });
  }

  const handleSelect = document.getElementById('director-handle-select');
  if (handleSelect) {
    handleSelect.addEventListener('change', (e) => {
      if (sandbox.director) {
        sandbox.director.selectHandle(e.target.value);
      }
    });
  }

  const moveBtn = document.getElementById('director-gizmo-move-btn');
  if (moveBtn) {
    moveBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.setGizmoMode('translate');
    });
  }

  const rotBtn = document.getElementById('director-gizmo-rotate-btn');
  if (rotBtn) {
    rotBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.setGizmoMode('rotate');
    });
  }

  function bindSpawnPair(sliderId, inputId, propKey, isDeg = false) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl) {
      sEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val) && sandbox.director) {
          if (iEl) iEl.value = isDeg ? String(Math.round(val)) : val.toFixed(2);
          sandbox.director.setSpawnTransform({ [propKey]: val }, true);
        }
      });
    }
    if (iEl) {
      iEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val) && sandbox.director) {
          if (sEl) sEl.value = isDeg ? String(Math.round(val)) : String(val);
          sandbox.director.setSpawnTransform({ [propKey]: val }, true);
        }
      });
    }
  }

  bindSpawnPair('director-spawn-x-slider', 'director-spawn-x-input', 'x');
  bindSpawnPair('director-spawn-y-slider', 'director-spawn-y-input', 'y');
  bindSpawnPair('director-spawn-z-slider', 'director-spawn-z-input', 'z');
  bindSpawnPair('director-spawn-yaw-slider', 'director-spawn-yaw-input', 'yawDeg', true);

  const snapSpawnBtn = document.getElementById('director-spawn-snap-btn');
  if (snapSpawnBtn) {
    snapSpawnBtn.addEventListener('click', () => {
      if (sandbox.director) {
        const sp = sandbox.director.spawnState;
        sandbox.teleportCharacterTo(sp.x, sp.y, sp.z, sp.yawRad);
      }
    });
  }

  const usePlayerBtn = document.getElementById('director-spawn-use-player-btn');
  if (usePlayerBtn) {
    usePlayerBtn.addEventListener('click', () => {
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar && sandbox.director) {
        sandbox.director.setSpawnTransform({
          x: activeChar.position.x,
          y: activeChar.position.y,
          z: activeChar.position.z,
          yawRad: activeChar.yaw,
        }, true);
      }
    });
  }

  const spawnCrosshairBtn = document.getElementById('director-spawn-crosshair-btn');
  if (spawnCrosshairBtn) {
    spawnCrosshairBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.placeSpawnAtCameraGroundCrosshair();
    });
  }

  function bindCamInput(id, pathArray) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val) && sandbox.director) {
          const [posType, coord] = pathArray;
          sandbox.director.setCameraPan({
            [posType]: { [coord]: val }
          }, true);
        }
      });
    }
  }

  bindCamInput('director-cam-start-x', ['startPos', 'x']);
  bindCamInput('director-cam-start-y', ['startPos', 'y']);
  bindCamInput('director-cam-start-z', ['startPos', 'z']);
  bindCamInput('director-look-start-x', ['startLookAt', 'x']);
  bindCamInput('director-look-start-y', ['startLookAt', 'y']);
  bindCamInput('director-look-start-z', ['startLookAt', 'z']);

  bindCamInput('director-cam-mid-x', ['midPos', 'x']);
  bindCamInput('director-cam-mid-y', ['midPos', 'y']);
  bindCamInput('director-cam-mid-z', ['midPos', 'z']);

  bindCamInput('director-cam-end-x', ['endPos', 'x']);
  bindCamInput('director-cam-end-y', ['endPos', 'y']);
  bindCamInput('director-cam-end-z', ['endPos', 'z']);
  bindCamInput('director-look-end-x', ['endLookAt', 'x']);
  bindCamInput('director-look-end-y', ['endLookAt', 'y']);
  bindCamInput('director-look-end-z', ['endLookAt', 'z']);

  const durSlider = document.getElementById('director-pan-duration-slider');
  const durInput = document.getElementById('director-pan-duration-input');
  if (durSlider) {
    durSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (Number.isFinite(val) && sandbox.director) {
        if (durInput) durInput.value = val.toFixed(1);
        sandbox.director.setCameraPan({ durationSec: val }, true);
      }
    });
  }
  if (durInput) {
    durInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (Number.isFinite(val) && sandbox.director) {
        if (durSlider) durSlider.value = String(val);
        sandbox.director.setCameraPan({ durationSec: val }, true);
      }
    });
  }

  const capStartBtn = document.getElementById('director-cam-capture-start-btn');
  if (capStartBtn) {
    capStartBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanStart();
    });
  }
  const prevStartBtn = document.getElementById('director-cam-preview-start-btn');
  if (prevStartBtn) {
    prevStartBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.previewPanStartPose();
    });
  }

  const capMidBtn = document.getElementById('director-cam-capture-mid-btn');
  if (capMidBtn) {
    capMidBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanMid();
    });
  }
  const prevMidBtn = document.getElementById('director-cam-preview-mid-btn');
  if (prevMidBtn) {
    prevMidBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.previewPanMidPose();
    });
  }
  const autoMidBtn = document.getElementById('director-cam-auto-mid-btn');
  if (autoMidBtn) {
    autoMidBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.straightenTrajectory(true);
    });
  }

  const capEndBtn = document.getElementById('director-cam-capture-end-btn');
  if (capEndBtn) {
    capEndBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanEnd();
    });
  }
  const prevEndBtn = document.getElementById('director-cam-preview-end-btn');
  if (prevEndBtn) {
    prevEndBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.previewPanEndPose();
    });
  }

  // Top-center POV Viewfinder Overlay bar buttons
  const povSetStartBtn = document.getElementById('director-pov-set-start-btn');
  if (povSetStartBtn) {
    povSetStartBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanStart();
    });
  }
  const povSetMidBtn = document.getElementById('director-pov-set-mid-btn');
  if (povSetMidBtn) {
    povSetMidBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanMid();
    });
  }
  const povSetEndBtn = document.getElementById('director-pov-set-end-btn');
  if (povSetEndBtn) {
    povSetEndBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.captureCurrentViewAsPanEnd();
    });
  }
  const povSetSpawnBtn = document.getElementById('director-pov-set-spawn-btn');
  if (povSetSpawnBtn) {
    povSetSpawnBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.placeSpawnAtCameraGroundCrosshair();
    });
  }
  const povPlayPanBtn = document.getElementById('director-pov-play-pan-btn');
  if (povPlayPanBtn) {
    povPlayPanBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.playStartupPan();
    });
  }
  const povExitBtn = document.getElementById('director-pov-exit-btn');
  if (povExitBtn) {
    povExitBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.toggleCameraPOVMode(false);
    });
  }

  const playPanBtn = document.getElementById('director-pan-play-btn');
  if (playPanBtn) {
    playPanBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.playStartupPan();
    });
  }

  const resetCamBtn = document.getElementById('director-pan-reset-cam-btn');
  if (resetCamBtn) {
    resetCamBtn.addEventListener('click', () => {
      if (sandbox.director) {
        if (sandbox.director.cameraPOVMode) sandbox.director.toggleCameraPOVMode(false);
        sandbox.director.stopStartupPan(true);
      }
      updateCameraController(1.0);
      renderer.render(scene, camera);
    });
  }

  // Intro Talking Loop & n-Dialogue-Box Gate Controls
  const dlgCountInput = document.getElementById('director-dialogue-count-input');
  if (dlgCountInput) {
    dlgCountInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (Number.isFinite(val) && sandbox.director) {
        sandbox.director.setDialogueBoxCount(val, true);
      }
    });
  }

  const dlgBoxSelect = document.getElementById('director-dialogue-box-select');
  if (dlgBoxSelect) {
    dlgBoxSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      if (Number.isFinite(idx) && sandbox.director) {
        sandbox.director.introSequenceState.selectedEditBoxIndex = idx;
        syncDirectorHUDInputs();
      }
    });
  }

  const dlgBoxTextInput = document.getElementById('director-dialogue-box-text-input');
  if (dlgBoxTextInput) {
    dlgBoxTextInput.addEventListener('input', (e) => {
      if (sandbox.director) {
        const idx = sandbox.director.introSequenceState.selectedEditBoxIndex || 0;
        sandbox.director.updateDialogueBoxAtIndex(idx, { text: e.target.value }, true);
      }
    });
  }

  const dlgStartBtn = document.getElementById('director-dialogue-start-btn');
  if (dlgStartBtn) {
    dlgStartBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.startIntroTalkingSequence();
    });
  }

  const dlgAdvanceHudBtn = document.getElementById('director-dialogue-advance-btn');
  if (dlgAdvanceHudBtn) {
    dlgAdvanceHudBtn.addEventListener('click', () => {
      if (sandbox.director) {
        if (sandbox.director.introSequenceState.phase !== 'dialogue-active') {
          sandbox.director.startIntroTalkingSequence();
        } else {
          sandbox.director.advanceDialogueBox();
        }
      }
    });
  }

  const introCardEl = document.getElementById('intro-dialogue-card');
  if (introCardEl) {
    introCardEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!sandbox.director) return;
      const intro = sandbox.director.introSequenceState;
      const curBox = intro && intro.boxes ? intro.boxes[intro.currentBoxIndex] : null;
      const isQuestionCard = Boolean(
        (curBox && curBox.requires_question_prompt) ||
          (intro && intro.currentBoxIndex + 1 >= intro.boxes.length)
      );
      // Spec 065 §5.3.5: Whole-card tap-to-dismiss is disabled on Card 07 so visitor explicitly chooses Yes or No
      if (isQuestionCard) return;
      sandbox.director.advanceDialogueBox();
    });
  }

  const introNextBtnEl = document.getElementById('intro-dialogue-next-btn');
  if (introNextBtnEl) {
    introNextBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.director) sandbox.director.advanceDialogueBox();
    });
  }

  const introYesBtnEl = document.getElementById('intro-dialogue-yes-btn');
  if (introYesBtnEl) {
    introYesBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.director) {
        sandbox.director.completeIntroDialogue({ openDoomChat: true });
      }
    });
  }

  const introNoBtnEl = document.getElementById('intro-dialogue-no-btn');
  if (introNoBtnEl) {
    introNoBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.director) {
        sandbox.director.completeIntroDialogue({ openDoomChat: false });
      }
    });
  }

  const resetDefaultsBtn = document.getElementById('director-reset-defaults-btn');
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      if (sandbox.director) sandbox.director.resetDefaults();
    });
  }

  const copyJsonBtn = document.getElementById('director-copy-json-btn');
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', async () => {
      if (!sandbox.director) return;
      const jsonStr = sandbox.director.exportJSON();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        }
        const origText = copyJsonBtn.textContent;
        copyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyJsonBtn.textContent = origText;
        }, 1400);
      } catch (err) {
        console.log('Director Config JSON:\n', jsonStr);
      }
    });
  }
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
  const segsZ = 40;
  const vertsPerLayer = (segsZ + 1) * 2;
  const indicesPerLayer = segsZ * 6;

  const positions = new Float32Array(layerCount * vertsPerLayer * 3);
  const uvs = new Float32Array(layerCount * vertsPerLayer * 2);
  const layerHeights = new Float32Array(layerCount * vertsPerLayer);
  const indices = new Uint16Array(layerCount * indicesPerLayer);

  for (let i = 0; i < layerCount; i++) {
    const t = i / (layerCount - 1);
    const y = minY + t * (maxY - minY);
    const zStart = minZ + (i % 3) * 0.45;
    const zEnd = maxZ - ((i + 1) % 3) * 0.45;
    const halfW = 1.62 - 0.08 * Math.sin(i * 1.3);

    const vLayerBase = i * vertsPerLayer;
    for (let sz = 0; sz <= segsZ; sz++) {
      const tz = sz / segsZ;
      const z = zStart + tz * (zEnd - zStart);
      const vRow = vLayerBase + sz * 2;

      positions[vRow * 3 + 0] = -halfW;
      positions[vRow * 3 + 1] = y;
      positions[vRow * 3 + 2] = z;
      uvs[vRow * 2 + 0] = 0.0;
      uvs[vRow * 2 + 1] = tz;
      layerHeights[vRow] = t;

      positions[(vRow + 1) * 3 + 0] = halfW;
      positions[(vRow + 1) * 3 + 1] = y;
      positions[(vRow + 1) * 3 + 2] = z;
      uvs[(vRow + 1) * 2 + 0] = 1.0;
      uvs[(vRow + 1) * 2 + 1] = tz;
      layerHeights[vRow + 1] = t;
    }

    const iLayerBase = i * indicesPerLayer;
    for (let sz = 0; sz < segsZ; sz++) {
      const r0 = vLayerBase + sz * 2;
      const r1 = r0 + 2;
      const dst = iLayerBase + sz * 6;
      indices[dst + 0] = r0;
      indices[dst + 1] = r0 + 1;
      indices[dst + 2] = r1 + 1;
      indices[dst + 3] = r0;
      indices[dst + 4] = r1 + 1;
      indices[dst + 5] = r1;
    }
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
      if (
        sandbox.sceneCutter &&
        sandbox.sceneCutter.isWorldPointInDeletedHalfSpace(
          worldPositions[i3],
          worldPositions[i3 + 1],
          worldPositions[i3 + 2]
        )
      ) {
        alphas[i] = 0.0;
      }
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
    const cutter = sandbox.sceneCutter || null;
    for (let i = 0; i < streakCount; i++) {
      const d = dropStates[i];
      const vBase = i * 4;
      const isClipped = Boolean(
        cutter && cutter.isWorldPointInDeletedHalfSpace(d.x, d.y, d.z)
      );
      if (isClipped) {
        for (let j = 0; j < 4; j++) {
          const dst3 = (vBase + j) * 3;
          positions[dst3] = 0.0;
          positions[dst3 + 1] = -100.0;
          positions[dst3 + 2] = 0.0;
        }
        continue;
      }
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
  const segsZ = 74;
  const minX = -1.62;
  const maxX = 1.92;
  const minZ = -6.00;
  const maxZ = 68.00;

  function sampleCorridorFloorY(z) {
    return resolveStickerFloorContourY(z) + 0.003;
  }

  const vCount = (segsX + 1) * (segsZ + 1);
  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const indices = new Uint16Array(segsX * segsZ * 6);

  let vIdx = 0;
  for (let iz = 0; iz <= segsZ; iz++) {
    const tz = iz / segsZ;
    const z = minZ + tz * (maxZ - minZ);
    const y = sampleCorridorFloorY(z);
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

function buildAudioSubsystem(centralTerminalSystem, alarmFixtures, alleyPipes = null) {
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
  let rainSourceNode = null;
  let rainLoadInFlight = false;
  const CITY_RAIN_AUDIO_URL = 'assets/audio/city_rain_loop.mp3';
  const cityRainRawBufferPromise =
    typeof fetch === 'function'
      ? fetch(CITY_RAIN_AUDIO_URL)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status} fetching ${CITY_RAIN_AUDIO_URL}`);
            }
            return res.arrayBuffer();
          })
          .catch(() => null)
      : Promise.resolve(null);
  const STEAM_VOICE_POOL_SIZE = 4;
  const steamVoicePool = [];

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

  function buildTrimmedGaplessRainBuffer(ctx, decodedBuffer) {
    const numChannels = decodedBuffer.numberOfChannels || 1;
    const sampleRate = decodedBuffer.sampleRate;
    const totalFrames = decodedBuffer.length;
    const winFrames = 256;
    const silenceRmsThreshold = 0.008;
    const safetyMarginFrames = Math.floor(sampleRate * 0.05);

    const ch0 = decodedBuffer.getChannelData(0);
    const ch1 = numChannels > 1 ? decodedBuffer.getChannelData(1) : ch0;

    // 1. Locate leading steady-state start (excising any MP3 encoder delay / quiet head)
    let firstActiveFrame = 0;
    for (let i = 0; i + winFrames <= totalFrames; i += winFrames) {
      let sumSq = 0.0;
      for (let k = 0; k < winFrames; k++) {
        const s0 = ch0[i + k];
        const s1 = ch1[i + k];
        sumSq += 0.5 * (s0 * s0 + s1 * s1);
      }
      if (Math.sqrt(sumSq / winFrames) >= silenceRmsThreshold) {
        firstActiveFrame = i;
        break;
      }
    }

    // 2. Locate trailing steady-state end (excising any MP3 frame padding / quiet tail)
    let lastActiveFrame = totalFrames;
    for (let i = totalFrames - winFrames; i >= firstActiveFrame; i -= winFrames) {
      let sumSq = 0.0;
      for (let k = 0; k < winFrames; k++) {
        const s0 = ch0[i + k];
        const s1 = ch1[i + k];
        sumSq += 0.5 * (s0 * s0 + s1 * s1);
      }
      if (Math.sqrt(sumSq / winFrames) >= silenceRmsThreshold) {
        lastActiveFrame = i + winFrames;
        break;
      }
    }

    const trimStart = Math.min(
      firstActiveFrame + safetyMarginFrames,
      Math.floor(totalFrames * 0.25)
    );
    const trimEnd = Math.max(
      lastActiveFrame - safetyMarginFrames,
      Math.floor(totalFrames * 0.75)
    );
    const usableFrames = Math.max(winFrames * 4, trimEnd - trimStart);
    const seamFrames = Math.min(
      Math.floor(sampleRate * 0.5),
      Math.floor(usableFrames * 0.1)
    );
    const loopFrames = usableFrames - seamFrames;
    const bodyFrames = loopFrames - seamFrames;

    const loopBuffer = ctx.createBuffer(numChannels, loopFrames, sampleRate);
    for (let c = 0; c < numChannels; c++) {
      const src = decodedBuffer.getChannelData(c);
      const dst = loopBuffer.getChannelData(c);
      // Copy continuous BODY [trimStart + seamFrames .. trimStart + seamFrames + bodyFrames)
      const bodyOffset = trimStart + seamFrames;
      for (let i = 0; i < bodyFrames; i++) {
        dst[i] = src[bodyOffset + i];
      }
      // Equal-power C1 loop-seam crossfade: TAIL -> HEAD so end wraps seamlessly into dst[0]
      const tailOffset = bodyOffset + bodyFrames;
      const headOffset = trimStart;
      for (let i = 0; i < seamFrames; i++) {
        const u = i / seamFrames;
        const wTail = Math.cos(0.5 * Math.PI * u);
        const wHead = Math.sin(0.5 * Math.PI * u);
        dst[bodyFrames + i] = src[tailOffset + i] * wTail + src[headOffset + i] * wHead;
      }
    }
    return loopBuffer;
  }

  function loadAndStartCityRainLoop(ctx) {
    if (rainSourceNode || rainLoadInFlight) return;
    rainLoadInFlight = true;
    cityRainRawBufferPromise
      .then((rawBuf) => {
        if (!rawBuf) {
          return fetch(CITY_RAIN_AUDIO_URL).then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status} fetching ${CITY_RAIN_AUDIO_URL}`);
            }
            return res.arrayBuffer();
          });
        }
        return rawBuf;
      })
      .then((arrayBuf) => ctx.decodeAudioData(arrayBuf.slice(0)))
      .then((decodedBuffer) => {
        const loopBuffer = buildTrimmedGaplessRainBuffer(ctx, decodedBuffer);
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = loopBuffer;
        rainSource.loop = true;
        rainSource.loopStart = 0;
        rainSource.loopEnd = loopBuffer.duration;
        rainSource.connect(weatherGainNode);
        rainSource.start(0);
        rainSourceNode = rainSource;
        ambientChannels.weatherLoop.bufferLoaded = true;
        ambientChannels.weatherLoop.durationSec = Number(loopBuffer.duration.toFixed(3));
      })
      .catch(() => {
        rainLoadInFlight = false;
      });
  }

  function startContinuousLoopsIfUnlocked() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    state.contextState = ctx.state;
    if (synthInitialized) {
      if (!rainSourceNode && weatherGainNode) {
        loadAndStartCityRainLoop(ctx);
      }
      return;
    }
    try {
      // 4.1.1 Weather Loop: Trimmed, gapless city rain audio ('assets/audio/city_rain_loop.mp3')
      weatherGainNode = ctx.createGain();
      weatherGainNode.gain.value = 0.26;
      weatherGainNode.connect(masterGainNode);
      loadAndStartCityRainLoop(ctx);

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

      // 4.2.3 Pooled 3D Spatial Pipe Steam Hiss Voices (Spec 036 §7.1: Shared Hybrid Noise + 4 Spatial Bandpass Voices)
      const steamBufFrames = Math.floor(ctx.sampleRate * 3.0);
      const steamBuffer = ctx.createBuffer(1, steamBufFrames, ctx.sampleRate);
      const steamData = steamBuffer.getChannelData(0);
      let sb0 = 0.0;
      let sb1 = 0.0;
      for (let i = 0; i < steamBufFrames; i++) {
        const white = Math.random() * 2.0 - 1.0;
        sb0 = 0.965 * sb0 + white * 0.14;
        sb1 = 0.820 * sb1 + white * 0.24;
        // 62% crisp thermal air hiss + 38% filtered vapor body
        steamData[i] = (white * 0.62 + (sb0 + sb1) * 0.38) * 0.78;
      }
      // Smooth 4096-sample loop seam crossfade to prevent periodic click artifacts
      const seamSamples = Math.min(4096, Math.floor(steamBufFrames * 0.1));
      for (let i = 0; i < seamSamples; i++) {
        const u = i / seamSamples;
        steamData[steamBufFrames - seamSamples + i] =
          steamData[steamBufFrames - seamSamples + i] * (1.0 - u) + steamData[i] * u;
      }

      steamVoicePool.length = 0;
      for (let v = 0; v < STEAM_VOICE_POOL_SIZE; v++) {
        const src = ctx.createBufferSource();
        src.buffer = steamBuffer;
        src.loop = true;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 920.0;
        hp.Q.value = 0.70;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2350.0;
        bp.Q.value = 1.45;

        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const vGain = ctx.createGain();
        vGain.gain.value = 0.0;

        src.connect(hp);
        hp.connect(bp);
        if (panner) {
          bp.connect(panner);
          panner.connect(vGain);
        } else {
          bp.connect(vGain);
        }
        vGain.connect(masterGainNode);
        src.start(0, (v * 0.73) % 2.9);

        steamVoicePool.push({
          voiceIndex: v,
          source: src,
          highpass: hp,
          bandpass: bp,
          panner,
          gain: vGain,
          assignedPipeId: null,
        });
      }

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
      label: 'Weather Loop (City Rain Audio Loop - Trimmed & Gapless)',
      sourceUrl: CITY_RAIN_AUDIO_URL,
      trimmedEnds: true,
      gaplessLoop: true,
      bufferLoaded: false,
      durationSec: 49.4,
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

  // 4.2.3 3D Positional Pipe Steam Hiss Emitters (Spec 036 §7: Light Spatial Steam Hiss across ALLEY_PIPE_01..15)
  const sourcePipePlacements =
    alleyPipes && Array.isArray(alleyPipes.placements)
      ? alleyPipes.placements
      : ALLEY_PIPE_PLACEMENT_SCHEDULE.map((entry) => {
          const xL = resolveAlleyWallProfileX('left', entry.z);
          const xR = resolveAlleyWallProfileX('right', entry.z);
          const anchorX =
            entry.mountMode === 'L'
              ? xL + entry.standoffX
              : entry.mountMode === 'R'
              ? xR - entry.standoffX
              : 0.5 * (xL + xR);
          return {
            ...entry,
            worldY: entry.relY,
            anchorX,
          };
        });

  const pipeSteamEmitters = sourcePipePlacements.map((p) => {
    const sched = PIPE_STEAM_INTERVAL_SCHEDULE[p.id] || {
      pipeId: p.id,
      cyclePeriodSec: 8.5,
      phaseOffsetSec: 1.0,
      attackSec: 0.24,
      sustainSec: 1.9,
      decaySec: 0.9,
      hissCenterFreqHz: 2350,
    };
    const nozzle = resolvePipeNozzleWorldTransform(p);
    const initEv = evaluatePipeSteamEnvelope(sched, 0.0, 0.0, false);
    return {
      id: `pipeSteamEmitter_${p.id}`,
      pipeId: p.id,
      pipeIndex: p.index,
      zone: p.zone,
      variationId: p.variationId,
      mountMode: p.mountMode,
      side: p.side,
      isPositional: true,
      loop: false,
      isVenting: initEv.isVenting,
      stage: initEv.stage,
      envelope: initEv.envelope,
      cyclePeriodSec: sched.cyclePeriodSec,
      phaseOffsetSec: sched.phaseOffsetSec,
      centerFrequencyHz: sched.hissCenterFreqHz,
      currentFrequencyHz: sched.hissCenterFreqHz,
      refDistance: 2.60,
      maxDistance: 16.50,
      rolloffFactor: 1.15,
      baseGain: 0.052, // Light, airy diegetic steam hiss (capped <= 0.055 per Spec 036 §3.2)
      worldPosition: { ...nozzle.primaryNozzlePos },
      dischargeNormal: { ...nozzle.primaryDischargeNormal },
      distanceToCamera: 4.0,
      azimuthRad: 0.0,
      stereoPan: 0.0,
      attenuationFactor: 0.0,
      currentGain: 0.0,
      assignedVoiceIndex: -1,
      scheduleSpec: sched,
    };
  });

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

    // 3D Pipe Steam Hiss Emitters across ALLEY_PIPE_01..15 (Spec 036 §7: Light Spatial Steam Hiss)
    const liveSteamSystem =
      (alleyPipes && alleyPipes.steamSystem) ||
      (sandbox.alleyPipes && sandbox.alleyPipes.steamSystem) ||
      null;

    for (let i = 0; i < pipeSteamEmitters.length; i++) {
      const se = pipeSteamEmitters[i];
      const liveEm =
        liveSteamSystem && liveSteamSystem.emitters && liveSteamSystem.emitters[i]
          ? liveSteamSystem.emitters[i]
          : null;

      if (liveEm) {
        se.worldPosition.x = liveEm.nozzleWorldPos.x;
        se.worldPosition.y = liveEm.nozzleWorldPos.y;
        se.worldPosition.z = liveEm.nozzleWorldPos.z;
        se.isVenting = liveEm.isVenting;
        se.stage = liveEm.stage;
        se.envelope = liveEm.envelope;
      } else {
        const ev = evaluatePipeSteamEnvelope(se.scheduleSpec, timeSec, 0.0, false);
        se.isVenting = ev.isVenting;
        se.stage = ev.stage;
        se.envelope = ev.envelope;
      }

      const spatial = evaluate3DSpatialPanAndGain(
        se.worldPosition,
        cam.position,
        camForwardVec,
        camRightVec,
        se
      );
      se.distanceToCamera = spatial.distanceToCamera;
      se.azimuthRad = spatial.azimuthRad;
      se.stereoPan = spatial.stereoPan;
      se.attenuationFactor = spatial.attenuationFactor;
      se.currentGain = Number((spatial.currentGain * se.envelope).toFixed(4));

      // Envelope-coupled spectral shaping (Spec 036 §7.1: +18% attack transient, -15% decay bleed-off)
      let freqMult = 1.0;
      if (se.stage === 'PRESSURE_BUILD_ATTACK') {
        freqMult = 1.0 + 0.18 * se.envelope;
      } else if (se.stage === 'ACTIVE_VENTING') {
        freqMult = 1.0 + 0.03 * Math.sin(timeSec * 11.0 + i);
      } else if (se.stage === 'DISSIPATION_DECAY') {
        freqMult = 0.85 + 0.15 * se.envelope;
      }
      se.currentFrequencyHz = Number((se.centerFrequencyHz * freqMult).toFixed(1));
      se.assignedVoiceIndex = -1;
    }

    // Route top 4 highest-gain active pipe steam emitters to the 4 pooled Web Audio voices
    let topIndices = [-1, -1, -1, -1];
    let topGains = [0.0002, 0.0002, 0.0002, 0.0002];
    for (let i = 0; i < pipeSteamEmitters.length; i++) {
      const g = pipeSteamEmitters[i].currentGain;
      if (g <= topGains[3]) continue;
      for (let slot = 0; slot < STEAM_VOICE_POOL_SIZE; slot++) {
        if (g > topGains[slot]) {
          for (let shift = STEAM_VOICE_POOL_SIZE - 1; shift > slot; shift--) {
            topGains[shift] = topGains[shift - 1];
            topIndices[shift] = topIndices[shift - 1];
          }
          topGains[slot] = g;
          topIndices[slot] = i;
          break;
        }
      }
    }

    const nowAudio = synthInitialized && audioCtx ? audioCtx.currentTime : 0.0;
    for (let v = 0; v < STEAM_VOICE_POOL_SIZE; v++) {
      const emIdx = topIndices[v];
      if (emIdx >= 0) {
        pipeSteamEmitters[emIdx].assignedVoiceIndex = v;
      }
      if (synthInitialized && audioCtx && steamVoicePool[v]) {
        const voice = steamVoicePool[v];
        if (emIdx >= 0) {
          const activeEm = pipeSteamEmitters[emIdx];
          voice.assignedPipeId = activeEm.pipeId;
          voice.bandpass.frequency.setTargetAtTime(activeEm.currentFrequencyHz, nowAudio, 0.03);
          voice.gain.gain.setTargetAtTime(activeEm.currentGain, nowAudio, 0.035);
          if (voice.panner) {
            voice.panner.pan.setTargetAtTime(activeEm.stereoPan, nowAudio, 0.04);
          }
        } else {
          voice.assignedPipeId = null;
          voice.gain.gain.setTargetAtTime(0.0, nowAudio, 0.04);
        }
      }
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
      pipeSteamEmitters,
    },
    terminalEmitter,
    fixtureEmitters,
    pipeSteamEmitters,
    steamVoicePool,
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
  if (sandbox.alleyPipes && typeof sandbox.alleyPipes.update === 'function') {
    sandbox.alleyPipes.update(dt, timeSec, camera);
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

      // Subdivide primary left alley wall (Z = 71.2 -> 0.0) along calibrated profile knots
      if (name === 'COLLIDER_WALL_L' && Math.max(v0.z, v1.z) > 40.0 && Math.min(v0.z, v1.z) <= 0.5) {
        const zKnots = [71.2, 44.0, 26.2, 16.0, 0.0];
        for (let k = 0; k < zKnots.length - 1; k++) {
          const zA = zKnots[k];
          const zB = zKnots[k + 1];
          const xA = zA > 58.0 ? -1.50 : resolveAlleyWallProfileX('L', zA);
          const xB = resolveAlleyWallProfileX('L', zB);
          wallSegments.push({
            colliderName: name,
            ax: xA,
            az: zA,
            bx: xB,
            bz: zB,
            nx: 1.0,
            nz: 0.0,
            minY: Math.min(v0.y, v1.y, v2.y),
            maxY: Math.max(v0.y, v1.y, v2.y),
          });
        }
        continue;
      }

      // Subdivide primary right alley wall (Z = 0.0 -> 44.0) along calibrated profile knots
      if (
        name === 'COLLIDER_WALL_R' &&
        Math.min(v0.z, v1.z) <= 0.05 &&
        Math.max(v0.z, v1.z) >= 40.0 &&
        Math.max(Math.abs(v0.x), Math.abs(v1.x)) < 3.0
      ) {
        const zKnots = [0.0, 16.0, 34.0, 44.0];
        for (let k = 0; k < zKnots.length - 1; k++) {
          const zA = zKnots[k];
          const zB = zKnots[k + 1];
          const xA = resolveAlleyWallProfileX('R', zA);
          const xB = resolveAlleyWallProfileX('R', zB);
          wallSegments.push({
            colliderName: name,
            ax: xA,
            az: zA,
            bx: xB,
            bz: zB,
            nx: -1.0,
            nz: 0.0,
            minY: Math.min(v0.y, v1.y, v2.y),
            maxY: Math.max(v0.y, v1.y, v2.y),
          });
        }
        continue;
      }

      const segAx =
        name === 'COLLIDER_WALL_L' && v0.z >= -0.05 && v0.z <= 44.5 && Math.abs(v0.x) < 3.0
          ? resolveAlleyWallProfileX('L', Math.max(0.0, v0.z))
          : name === 'COLLIDER_WALL_R' && v0.z >= -0.05 && v0.z <= 44.1 && Math.abs(v0.x) < 3.0
            ? resolveAlleyWallProfileX('R', Math.max(0.0, v0.z))
            : v0.x;
      const segAz = v0.z;
      const segBx =
        name === 'COLLIDER_WALL_L' && v1.z >= -0.05 && v1.z <= 44.5 && Math.abs(v1.x) < 3.0
          ? resolveAlleyWallProfileX('L', Math.max(0.0, v1.z))
          : name === 'COLLIDER_WALL_R' && v1.z >= -0.05 && v1.z <= 44.1 && Math.abs(v1.x) < 3.0
            ? resolveAlleyWallProfileX('R', Math.max(0.0, v1.z))
            : v1.x;
      const segBz = v1.z;

      if (Math.hypot(segBx - segAx, segBz - segAz) < 0.05) {
        continue;
      }

      wallSegments.push({
        colliderName: name,
        ax: segAx,
        az: segAz,
        bx: segBx,
        bz: segBz,
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
  if (
    typeof sandbox !== 'undefined' &&
    (sandbox.freeRoamFlyMode ||
      !sandbox.wallCollisionEnabled ||
      (sandbox.director && sandbox.director.cameraPOVMode))
  ) {
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

function clampCameraCircleAgainstWalls(posXZ, radius, wallSegments) {
  if (!wallSegments || wallSegments.length === 0) return;
  for (let iter = 0; iter < 4; iter++) {
    for (let i = 0; i < wallSegments.length; i++) {
      const seg = wallSegments[i];
      if (seg.colliderName === 'COLLIDER_BOUND_START') continue;
      const abx = seg.bx - seg.ax;
      const abz = seg.bz - seg.az;
      const abLenSq = abx * abx + abz * abz;
      if (abLenSq < 1e-10) continue;

      const apx = posXZ.x - seg.ax;
      const apz = posXZ.z - seg.az;
      const tRaw = (apx * abx + apz * abz) / abLenSq;
      const t = Math.max(0.0, Math.min(1.0, tRaw));

      const qx = seg.ax + t * abx;
      const qz = seg.az + t * abz;

      const dx = posXZ.x - qx;
      const dz = posXZ.z - qz;
      const dist = Math.hypot(dx, dz);
      const signedInward = dx * seg.nx + dz * seg.nz;

      if (tRaw >= -0.02 && tRaw <= 1.02) {
        if (signedInward < radius && signedInward > -(radius + 0.95)) {
          posXZ.x = qx + seg.nx * radius;
          posXZ.z = qz + seg.nz * radius;
        }
      } else if (dist < radius) {
        let pushX = seg.nx;
        let pushZ = seg.nz;
        if (dist > 1e-6 && signedInward >= 0.0) {
          pushX = dx / dist;
          pushZ = dz / dist;
        }
        posXZ.x = qx + pushX * radius;
        posXZ.z = qz + pushZ * radius;
      }
    }
  }
}

function computeMinimumSignedWallClearance(posXZ, wallSegments) {
  if (!wallSegments || wallSegments.length === 0) return Infinity;
  let minClearance = Infinity;
  for (let i = 0; i < wallSegments.length; i++) {
    const seg = wallSegments[i];
    if (seg.colliderName === 'COLLIDER_BOUND_START') continue;
    const abx = seg.bx - seg.ax;
    const abz = seg.bz - seg.az;
    const abLenSq = abx * abx + abz * abz;
    if (abLenSq < 1e-10) continue;
    const apx = posXZ.x - seg.ax;
    const apz = posXZ.z - seg.az;
    const tRaw = (apx * abx + apz * abz) / abLenSq;
    const t = Math.max(0.0, Math.min(1.0, tRaw));
    const qx = seg.ax + t * abx;
    const qz = seg.az + t * abz;
    const dx = posXZ.x - qx;
    const dz = posXZ.z - qz;
    const dist = Math.hypot(dx, dz);
    const signedInward = dx * seg.nx + dz * seg.nz;
    let clearance;
    if (tRaw >= -0.02 && tRaw <= 1.02) {
      if (signedInward < -1.2) continue;
      clearance = signedInward;
    } else {
      clearance = dist;
    }
    if (clearance < minClearance) {
      minClearance = clearance;
    }
  }
  return minClearance;
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
// Autonomous Above-Shoulder Levitating DOOM_.glb Companion Kinematics (Spec 022 §3 & Spec 041 §3)
// ============================================================================
const DOOM_COMPANION_EQUILIBRIUM = { x: -0.430, y: 1.862, z: 0.055 };
const DOOM_COMPANION_CHAT_ANCHOR = { x: -0.480, y: 1.660, z: 0.720 };
const DOOM_COMPANION_CHAT_YAW = Math.atan2(
  -DOOM_COMPANION_CHAT_ANCHOR.x,
  -DOOM_COMPANION_CHAT_ANCHOR.z
); // ~ +2.55359 rad (+146.31 deg) — points DOOM_Companion +Z directly at LUIS's head (0, 1.66, 0)
const LUIS_HEAD_CHAT_YAW = Math.atan2(
  DOOM_COMPANION_CHAT_ANCHOR.x,
  DOOM_COMPANION_CHAT_ANCHOR.z
); // ~ -0.58800 rad (-33.69 deg) — points LUIS's head +Z directly at DOOM_Companion (-0.48, 1.66, +0.72)
const DOOM_CHAT_TRANSITION_DURATION = 0.42; // s — smooth camera pan & mutual facing blend duration
const DOOM_LEVITATION_AMP_Y = 0.036;   // m — vertical bobbing amplitude (peak-to-trough = 0.072m in [0.055m, 0.095m])
const DOOM_LEVITATION_OMEGA_Y = 2.80;  // rad/s — vertical hover frequency (~0.446 Hz in [0.35, 0.65] Hz)
const DOOM_LEVITATION_AMP_X = 0.011;   // m — lateral micro-drift amplitude (in [0.006m, 0.016m])
const DOOM_LEVITATION_OMEGA_X = 1.40;  // rad/s — lateral drift frequency
const DOOM_LEVITATION_AMP_Z = 0.010;   // m — depth micro-drift amplitude (in [0.006m, 0.016m])
const DOOM_LEVITATION_OMEGA_Z = 2.10;  // rad/s — depth drift frequency
const DOOM_LEVITATION_AMP_PITCH = 0.052; // rad (~2.98 deg in [1.5, 4.5] deg)
const DOOM_LEVITATION_AMP_ROLL = 0.048;  // rad (~2.75 deg in [1.5, 4.5] deg)
const DOOM_LEVITATION_AMP_YAW = 0.061;   // rad (~3.50 deg in [2.0, 6.0] deg)

const _tempBoneWorldQuat = new THREE.Quaternion();
const _tempParentWorldQuat = new THREE.Quaternion();
const _tempParentWorldQuatInv = new THREE.Quaternion();
const _tempDeltaWorldQuat = new THREE.Quaternion();
const _tempLocalAxis = new THREE.Vector3();

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
    this.companionHitProxy = null;
    this.renderMeshes = [];
    this.companionAnchor = new THREE.Vector3(
      DOOM_COMPANION_EQUILIBRIUM.x,
      DOOM_COMPANION_EQUILIBRIUM.y,
      DOOM_COMPANION_EQUILIBRIUM.z
    );
    this.companionCurrentAnchor = this.companionAnchor.clone();
    this.companionChatWeight = 0.0;
    this.companionChatTargetWeight = 0.0;
    this.companionSpeakingPulse = 0.0;
    this.luisHeadWorldPos = new THREE.Vector3();
    this.luisHeadForwardWorld = new THREE.Vector3(0, 0, 1);
    this.companionWorldPos = new THREE.Vector3();
    this.companionForwardWorld = new THREE.Vector3(0, 0, 1);
    this.mutualFacingDotProduct = 1.0;
    this.companionLevitationState = {
      timeSec: 0.0,
      dx: 0.0,
      dy: 0.0,
      dz: 0.0,
      pitch: 0.0,
      roll: 0.0,
      yaw: 0.0,
      baseYaw: 0.0,
      chatWeight: 0.0,
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
          node.userData = {
            ...node.userData,
            isDoomCompanion: true,
            characterId: id,
          };
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
    const skeletonBoneCount = this.skinnedMesh.skeleton.bones.length;
    if (skeletonBoneCount === 64) {
      this.rigProfile = 'RPM_64';
      for (const jName of RPM_REQUIRED_HUMANOID_BONES) {
        if (!this.bonesByName.has(jName) && !this.root.getObjectByName(jName)) {
          raiseFatalError(`Character '${id}' is missing required Ready Player Me humanoid bone '${jName}'.`);
        }
      }
      this.root.traverse((node) => {
        if (
          node.name &&
          (node.name.startsWith('Skateboard_') ||
            node.name.startsWith('SprayCan_') ||
            node.name === 'SKATEBOARD_ROOT' ||
            node.name === 'TRUCK_FRONT' ||
            node.name === 'TRUCK_BACK')
        ) {
          raiseFatalError(`Character '${id}' contains prohibited legacy prop node '${node.name}'.`);
        }
      });
    } else if (skeletonBoneCount === 35) {
      this.rigProfile = 'SKATE3_RX2_RIG';
      for (const jName of SKATE3_REQUIRED_MASTER_RIG_BONES) {
        if (!this.bonesByName.has(jName) && !this.root.getObjectByName(jName)) {
          raiseFatalError(`Character '${id}' is missing required Skate 3 35-joint master rig bone '${jName}'.`);
        }
      }
      for (const [rpmName, sk3Name] of Object.entries(RPM_TO_SKATE3_BONE_MAP)) {
        const boneNode = this.bonesByName.get(sk3Name) || this.root.getObjectByName(sk3Name);
        if (boneNode) {
          this.bonesByName.set(rpmName, boneNode);
        }
      }
      this.root.traverse((node) => {
        if (
          node.name &&
          !node.isBone &&
          (node.name.startsWith('Skateboard_') || node.name.startsWith('SprayCan_'))
        ) {
          raiseFatalError(`Character '${id}' contains prohibited legacy prop mesh '${node.name}'.`);
        }
      });
    } else {
      raiseFatalError(
        `Character '${id}' expected 64 Ready Player Me (RPM) or 35 Skate 3 (SKATE3_RX2_RIG) skeleton bones, found ${skeletonBoneCount}.`
      );
    }
    this.bones = this.bonesByName;
    for (const [bKey, bNode] of this.bonesByName.entries()) {
      this.bones[bKey] = bNode;
    }
    this.companionCurrentAnchor.copy(this.companionAnchor);
    if (this.companionMesh) {
      const proxyGeo = new THREE.SphereGeometry(0.28, 16, 12);
      const proxyMat = new THREE.MeshBasicMaterial({
        color: 0x00d5ff,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
      const hitProxy = new THREE.Mesh(proxyGeo, proxyMat);
      hitProxy.name = `DOOM_Companion_HitProxy_${id}`;
      hitProxy.userData = {
        isDoomCompanion: true,
        characterId: id,
      };
      this.companionMesh.add(hitProxy);
      this.companionHitProxy = hitProxy;
    }

    this.position = new THREE.Vector3(spawnPos.x, floorY, spawnPos.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = spawnYaw;
    this.isGrounded = true;
    this.state = 'Idle';
    this.customEmoteActive = false;
    this.dialogueActive = false;
    this.orderedDialogueSequence = null;
    this.orderedDialogueIndex = 0;
    this.lastDialogueClipName = null;
    this.dialogueChainCount = 0;
    this.dialogueClipHistory = [];
    this.currentClipName = null;
    this.currentAction = null;
    this.moveSpeed = 0.0;
    this.groundHeight = floorY;

    this.root.position.copy(this.position);
    this.root.rotation.set(0, this.yaw, 0);
    this.targetQuaternion = new THREE.Quaternion().copy(this.root.quaternion);
    this._tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Local-space Three.js Object3D Third-Person Follow Camera Socket Hierarchy parented to this.root
    this.cameraYawRig = new THREE.Object3D();
    this.cameraYawRig.name = `CharacterCameraYawRig_${id}`;
    this.cameraPivotSocket = new THREE.Object3D();
    this.cameraPivotSocket.name = `CharacterCameraPivotSocket_${id}`;
    this.cameraEyeSocket = new THREE.Object3D();
    this.cameraEyeSocket.name = `CharacterCameraEyeSocket_${id}`;
    this.cameraYawRig.add(this.cameraPivotSocket);
    this.cameraPivotSocket.add(this.cameraEyeSocket);
    this.root.add(this.cameraYawRig);
    this.syncCameraSocketRig(characterCameraState, 0.0);

    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = new Map();
    this.adaptedClips =
      this.rigProfile === 'SKATE3_RX2_RIG'
        ? adaptSharedClipsForSkate3Rig(sharedClips, this.root, this.bonesByName)
        : sharedClips;

    for (const clip of this.adaptedClips) {
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
    // Overwrite PropertyMixer's cached original rest state (which was captured from the GLB bind T-pose)
    // with the evaluated IDLE_DEFAULT pose so any partial-weight blend falls back to Idle rather than T-pose.
    if (Array.isArray(this.mixer._bindings)) {
      for (const pm of this.mixer._bindings) {
        if (pm && typeof pm.saveOriginalState === 'function') {
          pm.saveOriginalState();
        }
      }
    }
    this.updateCompanionLevitation(0.0);
    this.root.updateMatrixWorld(true);
    for (const sm of this.skinnedMeshes) {
      if (sm && sm.skeleton && typeof sm.skeleton.update === 'function') {
        sm.skeleton.update();
      }
    }
  }

  getOffboardClip(baseName) {
    return this.resolveClipName(baseName);
  }

  setYawImmediate(yawRad) {
    this.yaw = wrapAngleRad(yawRad);
    this.root.rotation.set(0.0, this.yaw, 0.0);
    if (this.targetQuaternion) {
      this.targetQuaternion.copy(this.root.quaternion);
    }
  }

  slerpYawToward(targetYawRad, dt, speed = 10.0) {
    const cleanTarget = wrapAngleRad(targetYawRad);
    if (!this.targetQuaternion) {
      this.targetQuaternion = new THREE.Quaternion();
    }
    this.targetQuaternion.setFromAxisAngle(WORLD_UP, cleanTarget);
    if (!(dt > 0.0)) {
      this.root.quaternion.copy(this.targetQuaternion);
      this.yaw = cleanTarget;
      return;
    }
    const alpha = 1.0 - Math.exp(-speed * dt);
    this.root.quaternion.slerp(this.targetQuaternion, alpha);
    if (!this._tempEuler) {
      this._tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    }
    this._tempEuler.setFromQuaternion(this.root.quaternion, 'YXZ');
    this.yaw = wrapAngleRad(this._tempEuler.y);
  }

  syncCameraSocketRig(camState, extraYawRad = 0.0, pitchOverrideRad = null, distOverride = null) {
    if (!this.cameraYawRig || !this.cameraPivotSocket || !this.cameraEyeSocket) return;
    const yawRel = (camState ? camState.yawOffsetRad : 0.0) + (Number(extraYawRad) || 0.0);
    const pitch =
      pitchOverrideRad !== null && Number.isFinite(pitchOverrideRad)
        ? pitchOverrideRad
        : camState
          ? camState.pitchRad
          : 0.0;
    const dist =
      distOverride !== null && Number.isFinite(distOverride)
        ? distOverride
        : camState
          ? camState.distance
          : 0.35;
    const shoulderX = camState ? camState.shoulderOffsetX : 0.0;
    const pivotY = camState ? camState.pivotHeightY : 1.80;
    const forwardZ = camState ? camState.forwardOffsetZ : 0.0;

    this.cameraYawRig.position.set(0.0, 0.0, 0.0);
    this.cameraYawRig.rotation.set(0.0, yawRel, 0.0, 'YXZ');
    this.cameraPivotSocket.position.set(-shoulderX, pivotY, forwardZ);
    this.cameraPivotSocket.rotation.set(pitch, Math.PI, 0.0, 'YXZ');
    this.cameraEyeSocket.position.set(0.0, 0.0, dist);
    this.root.updateMatrixWorld(true);
  }

  updateCompanionLevitation(timeSec = 0.0, dt = 0.0) {
    if (!this.companionMesh) return null;
    const t = Number(timeSec) || 0.0;
    const stepDt = Math.max(0.0, Number(dt) || 0.0);

    if (stepDt > 0.0) {
      const rate = stepDt / DOOM_CHAT_TRANSITION_DURATION;
      if (this.companionChatWeight < this.companionChatTargetWeight) {
        this.companionChatWeight = Math.min(this.companionChatTargetWeight, this.companionChatWeight + rate);
      } else if (this.companionChatWeight > this.companionChatTargetWeight) {
        this.companionChatWeight = Math.max(this.companionChatTargetWeight, this.companionChatWeight - rate);
      }
    }

    const w = Math.max(0.0, Math.min(1.0, this.companionChatWeight));
    const sChat = w * w * (3.0 - 2.0 * w);

    this.companionCurrentAnchor.set(
      this.companionAnchor.x + (DOOM_COMPANION_CHAT_ANCHOR.x - this.companionAnchor.x) * sChat,
      this.companionAnchor.y + (DOOM_COMPANION_CHAT_ANCHOR.y - this.companionAnchor.y) * sChat,
      this.companionAnchor.z + (DOOM_COMPANION_CHAT_ANCHOR.z - this.companionAnchor.z) * sChat
    );

    const speakGain = 1.0 + 0.48 * Math.max(0.0, Math.min(1.0, this.companionSpeakingPulse));
    const dy = DOOM_LEVITATION_AMP_Y * speakGain * Math.sin(DOOM_LEVITATION_OMEGA_Y * t);
    const dx = DOOM_LEVITATION_AMP_X * Math.sin(DOOM_LEVITATION_OMEGA_X * t + 0.85);
    const dz = DOOM_LEVITATION_AMP_Z * Math.cos(DOOM_LEVITATION_OMEGA_Z * t + 0.40);
    const pitch =
      DOOM_LEVITATION_AMP_PITCH * speakGain * Math.sin(DOOM_LEVITATION_OMEGA_X * t + 0.25) -
      0.04 * sChat;
    const roll = DOOM_LEVITATION_AMP_ROLL * Math.cos(DOOM_LEVITATION_OMEGA_Z * t + 1.10);
    const baseYaw = DOOM_COMPANION_CHAT_YAW * sChat;
    const dyaw = DOOM_LEVITATION_AMP_YAW * speakGain * Math.sin(0.95 * t);
    const yaw = baseYaw + dyaw;

    this.companionLevitationState.timeSec = t;
    this.companionLevitationState.dx = dx;
    this.companionLevitationState.dy = dy;
    this.companionLevitationState.dz = dz;
    this.companionLevitationState.pitch = pitch;
    this.companionLevitationState.roll = roll;
    this.companionLevitationState.yaw = yaw;
    this.companionLevitationState.baseYaw = baseYaw;
    this.companionLevitationState.chatWeight = Number(w.toFixed(4));

    for (const comp of this.companionMeshes) {
      comp.position.set(
        this.companionCurrentAnchor.x + dx,
        this.companionCurrentAnchor.y + dy,
        this.companionCurrentAnchor.z + dz
      );
      comp.rotation.set(pitch, yaw, roll);
    }
    return this.companionLevitationState;
  }

  applyConversationalHeadLook() {
    if (!this.companionMesh) return null;
    this.root.updateMatrixWorld(true);
    const headBone = this.bonesByName.get('Head') || this.root.getObjectByName('Head');
    const neckBone = this.bonesByName.get('Neck') || this.root.getObjectByName('Neck');
    if (!headBone) return null;

    this.companionMesh.getWorldPosition(this.companionWorldPos);
    headBone.getWorldPosition(this.luisHeadWorldPos);

    const w = Math.max(0.0, Math.min(1.0, this.companionChatWeight));
    const sChat = w * w * (3.0 - 2.0 * w);

    if (sChat > 0.0005) {
      const toDoomX = this.companionWorldPos.x - this.luisHeadWorldPos.x;
      const toDoomZ = this.companionWorldPos.z - this.luisHeadWorldPos.z;
      const targetWorldYaw = Math.atan2(toDoomX, toDoomZ);

      headBone.getWorldQuaternion(_tempBoneWorldQuat);
      this.luisHeadForwardWorld.set(0, 0, 1).applyQuaternion(_tempBoneWorldQuat);
      const curHeadWorldYaw = Math.atan2(this.luisHeadForwardWorld.x, this.luisHeadForwardWorld.z);
      const rawDeltaYaw = Math.atan2(
        Math.sin(targetWorldYaw - curHeadWorldYaw),
        Math.cos(targetWorldYaw - curHeadWorldYaw)
      );
      const deltaYaw = rawDeltaYaw * sChat;

      if (neckBone && neckBone.parent) {
        neckBone.parent.getWorldQuaternion(_tempParentWorldQuat);
        _tempParentWorldQuatInv.copy(_tempParentWorldQuat).invert();
        _tempLocalAxis.copy(WORLD_UP).applyQuaternion(_tempParentWorldQuatInv).normalize();
        _tempDeltaWorldQuat.setFromAxisAngle(_tempLocalAxis, deltaYaw * 0.38);
        neckBone.quaternion.premultiply(_tempDeltaWorldQuat);
        neckBone.updateMatrixWorld(true);
      }

      if (headBone.parent) {
        headBone.parent.getWorldQuaternion(_tempParentWorldQuat);
        _tempParentWorldQuatInv.copy(_tempParentWorldQuat).invert();
        _tempLocalAxis.copy(WORLD_UP).applyQuaternion(_tempParentWorldQuatInv).normalize();
        _tempDeltaWorldQuat.setFromAxisAngle(_tempLocalAxis, deltaYaw * (neckBone ? 0.62 : 1.0));
        headBone.quaternion.premultiply(_tempDeltaWorldQuat);
        headBone.updateMatrixWorld(true);
      }
    }

    headBone.getWorldQuaternion(_tempBoneWorldQuat);
    this.luisHeadForwardWorld.set(0, 0, 1).applyQuaternion(_tempBoneWorldQuat).normalize();

    this.companionMesh.getWorldQuaternion(_tempBoneWorldQuat);
    this.companionForwardWorld.set(0, 0, 1).applyQuaternion(_tempBoneWorldQuat).normalize();

    this.mutualFacingDotProduct = Number(
      this.luisHeadForwardWorld.dot(this.companionForwardWorld).toFixed(4)
    );
    return this.mutualFacingDotProduct;
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

    if (Array.isArray(this.orderedDialogueSequence) && this.orderedDialogueSequence.length > 0) {
      this.orderedDialogueIndex = (this.orderedDialogueIndex + 1) % this.orderedDialogueSequence.length;
      const orderedClip = this.orderedDialogueSequence[this.orderedDialogueIndex];
      const resolved = this.actions.has(orderedClip) ? orderedClip : this.resolveClipName(orderedClip);
      this.lastDialogueClipName = resolved;
      this.dialogueClipHistory.push(resolved);
      if (this.dialogueClipHistory.length > 16) this.dialogueClipHistory.shift();
      return resolved;
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

  startOrderedDialogueSequence(clipList = STARTUP_TALKING_SEQUENCE_CLIPS) {
    const validList = Array.isArray(clipList) && clipList.length > 0
      ? clipList.map((c) => this.resolveClipName(c))
      : [...STARTUP_TALKING_SEQUENCE_CLIPS];
    this.orderedDialogueSequence = validList;
    this.orderedDialogueIndex = 0;
    this.velocity.x = 0.0;
    this.velocity.z = 0.0;
    this.customEmoteActive = false;
    const wasAlreadyTalking = this.dialogueActive;
    this.dialogueActive = true;
    this.state = 'Talking';

    const firstClip = validList[0];
    this.lastDialogueClipName = firstClip;
    this.dialogueClipHistory.push(firstClip);
    if (this.dialogueClipHistory.length > 16) this.dialogueClipHistory.shift();

    const fadeDuration = wasAlreadyTalking ? DIALOGUE_CHAIN_CROSSFADE : DIALOGUE_ENTER_CROSSFADE;
    this.crossfadeTo(firstClip, fadeDuration, true);
    this.dialogueChainCount += 1;

    const selectEl = typeof document !== 'undefined' ? document.getElementById('animation-select') : null;
    if (selectEl && selectEl.value !== firstClip) {
      selectEl.value = firstClip;
    }
    const dlgBtn = typeof document !== 'undefined' ? document.getElementById('toggle-dialogue-btn') : null;
    if (dlgBtn) {
      dlgBtn.textContent = 'Dialogue Mode: TALKING (T)';
      dlgBtn.classList.remove('secondary');
    }
    return firstClip;
  }

  startDialogue(preferredClip = null) {
    this.orderedDialogueSequence = null;
    this.orderedDialogueIndex = 0;
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
    this.orderedDialogueSequence = null;
    this.orderedDialogueIndex = 0;
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
      syncIntroDialogueOverlayUI();
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
      syncIntroDialogueOverlayUI();
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

    // Identify the dominant currently running action other than nextAction to serve as the outgoing pose.
    // Never crossfade an action with itself (which schedules fadeIn from weight 0 with no outgoing action,
    // dropping cumulative mixer weight to 0 and exposing the bind pose).
    let outgoingAction = null;
    let bestOutgoingWeight = 0.0;
    for (const [, act] of this.actions) {
      if (act !== nextAction && act.isRunning()) {
        const w = act.getEffectiveWeight();
        if (w > bestOutgoingWeight) {
          bestOutgoingWeight = w;
          outgoingAction = act;
        }
      }
    }

    // If nextAction is already the active action and is in the initial frames of crossfading in from outgoingAction,
    // preserve the in-progress crossfade seamlessly instead of restarting from weight 0.
    if (
      this.currentAction === nextAction &&
      nextAction.isRunning() &&
      nextAction.time <= 0.05 &&
      outgoingAction !== null
    ) {
      return resolvedName;
    }

    // Stop any stale third actions that are neither the outgoing action nor the incoming action
    // so multi-step dialogue chains maintain clean 2-action normalized crossfades without T-pose flashing
    for (const [, act] of this.actions) {
      if (act !== outgoingAction && act !== nextAction && act.isRunning()) {
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

    if (!outgoingAction || duration <= 0.0) {
      if (outgoingAction && outgoingAction !== nextAction) {
        outgoingAction.stop();
      }
      nextAction.setEffectiveWeight(1.0);
      nextAction.play();
    } else {
      outgoingAction.enabled = true;
      outgoingAction.setEffectiveWeight(1.0);
      nextAction.setEffectiveWeight(1.0);
      nextAction.play();
      outgoingAction.crossFadeTo(nextAction, duration, false);
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
    this.orderedDialogueSequence = null;
    this.orderedDialogueIndex = 0;
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
    this.orderedDialogueSequence = null;
    this.orderedDialogueIndex = 0;
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
  KeyZ: false,
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
  yaw: characterCameraState.yawOffsetRad,
  pitch: characterCameraState.pitchRad,
  desiredDistance: characterCameraState.distance,
  effectiveDistance: characterCameraState.distance,
  isDragging: false,
  pointerId: null,
  userLookOverride: false,
  rigInitialized: false,
  freeRoamMoveBasisYaw: 0.0,
  freeRoamMoveInputSig: '0:0',
  _lastSyncedCharYaw: null,
  downClientX: 0,
  downClientY: 0,
  maxDragTravel: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  pivotCurrent: new THREE.Vector3(0, characterCameraState.pivotHeightY, 3.0),
  pivotTarget: new THREE.Vector3(0, characterCameraState.pivotHeightY, 3.0),
  currentQuat: new THREE.Quaternion(),
  targetQuat: new THREE.Quaternion(),
  _tempEuler: new THREE.Euler(0, 0, 0, 'YXZ'),
  _tempBackDir: new THREE.Vector3(0, 0, 1),
  _tempSpinePos: new THREE.Vector3(),
  _tempSocketDir: new THREE.Vector3(),
  _tempSafeSocketPos: new THREE.Vector3(),
  _tempLookAtPos: new THREE.Vector3(),
  lastSpringArmSolveMs: 0.0,
  lastPivotWallClearance: Infinity,
  lastEyeWallClearance: Infinity,
  lastHeadClearance: Infinity,
};

// ============================================================================
// Mobile Dual-Thumbpad & Multi-Touch Look State (Spec 040 & Spec 068 §5.2)
// ============================================================================
const THUMBPAD_DEADZONE = 0.12;
const THUMBPAD_SPRINT_THRESHOLD = 0.78;

function isMobileTouchForceDisabled() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location ? window.location.search : '');
    const explicit = params.get('touch') ?? params.get('mobile');
    return explicit === '0' || explicit === 'false';
  } catch {
    return false;
  }
}

function detectInitialMobileTouchMode() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location ? window.location.search : '');
    const explicit = params.get('touch') ?? params.get('mobile');
    if (explicit === '1' || explicit === 'true') return true;
    if (explicit === '0' || explicit === 'false') return false;
  } catch {
    // ignore URLSearchParams errors
  }
  const isCoarse = Boolean(
    typeof window.matchMedia === 'function' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(any-pointer: coarse)').matches)
  );
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;
  return isCoarse || vw <= 900 || vh <= 500;
}

const mobileTouch = {
  enabled: detectInitialMobileTouchMode(),
  active: false,
  pointerId: null,
  centerClientX: 0,
  centerClientY: 0,
  maxRadiusPx: 44,
  knobOffsetX: 0,
  knobOffsetY: 0,
  lx: 0.0,
  ly: 0.0,
  magnitude: 0.0,
  zone: 'deadzone',
  isSprinting: false,
  walkSpeedFactor: 0.0,
  lookActive: false,
  lookPointerId: null,
  lookThumbpadActive: false,
  lookThumbpadPointerId: null,
  lookCenterClientX: 0,
  lookCenterClientY: 0,
  lookMaxRadiusPx: 40,
  lookKnobOffsetX: 0,
  lookKnobOffsetY: 0,
  rx: 0.0,
  ry: 0.0,
  lookMagnitude: 0.0,
  yawRateRadPerSec: 0.0,
  pitchRateRadPerSec: 0.0,
  deadzone: THUMBPAD_DEADZONE,
  sprintThreshold: THUMBPAD_SPRINT_THRESHOLD,
  tapThresholdPx: CLICK_MAX_DRAG_PIXELS,
  setEnabled(flag) {
    this.enabled = Boolean(flag);
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('mobile-touch-enabled', this.enabled);
    }
    if (!this.enabled) {
      this.reset();
    } else {
      this.syncDOM();
    }
    if (sandbox.mp3Player && typeof sandbox.mp3Player.setDisplayMode === 'function') {
      window.dispatchEvent(new Event('resize'));
    }
    return this.enabled;
  },
  syncDOM() {
    if (typeof document === 'undefined') return;
    const activeDecodeJobs =
      sandbox && sandbox.portfolioHUD && sandbox.portfolioHUD.decodeController
        ? sandbox.portfolioHUD.decodeController.activeJobs
        : null;

    const baseEl = document.getElementById('mobile-left-thumbpad');
    const knobEl = document.getElementById('mobile-left-thumbpad-knob');
    const labelEl = document.getElementById('mobile-left-thumbpad-label');
    const leftTetherEl = document.getElementById('mobile-left-thumbpad-tether');
    const leftReadoutEl = document.getElementById('mobile-left-thumbpad-readout');
    if (baseEl) {
      baseEl.classList.toggle('walking', this.zone === 'walk');
      baseEl.classList.toggle('sprinting', this.zone === 'sprint');
      baseEl.setAttribute('aria-valuenow', String(Math.round(this.magnitude * 100)));
    }
    if (knobEl) {
      knobEl.style.transform = `translate(${this.knobOffsetX.toFixed(1)}px, ${this.knobOffsetY.toFixed(1)}px)`;
    }
    if (leftTetherEl) {
      const tx = 50 + this.lx * 36;
      const ty = 50 - this.ly * 36;
      leftTetherEl.setAttribute('x2', tx.toFixed(2));
      leftTetherEl.setAttribute('y2', ty.toFixed(2));
    }
    if (leftReadoutEl) {
      const stateTag = this.zone === 'sprint' ? 'SPRINT' : this.zone === 'walk' ? 'WALK' : 'IDLE';
      leftReadoutEl.textContent = `${this.magnitude.toFixed(2)} // ${stateTag}`;
    }
    if (labelEl && (!activeDecodeJobs || !activeDecodeJobs.has(labelEl))) {
      const nextLeftLabel =
        this.zone === 'sprint' ? 'SPRINT' : this.zone === 'walk' ? 'WALK' : 'MOVE';
      if (labelEl.textContent !== nextLeftLabel) {
        labelEl.textContent = nextLeftLabel;
        labelEl.setAttribute('data-hud-canonical-text', nextLeftLabel);
      }
    }

    const rightBaseEl = document.getElementById('mobile-right-thumbpad');
    const rightKnobEl = document.getElementById('mobile-right-thumbpad-knob');
    const rightLabelEl = document.getElementById('mobile-right-thumbpad-label');
    const rightTetherEl = document.getElementById('mobile-right-thumbpad-tether');
    const rightReadoutEl = document.getElementById('mobile-right-thumbpad-readout');
    const isLooking = this.lookMagnitude >= THUMBPAD_DEADZONE;
    if (rightBaseEl) {
      rightBaseEl.classList.toggle('looking', isLooking);
      rightBaseEl.setAttribute('aria-valuenow', String(Math.round(this.lookMagnitude * 100)));
    }
    if (rightKnobEl) {
      rightKnobEl.style.transform = `translate(${this.lookKnobOffsetX.toFixed(1)}px, ${this.lookKnobOffsetY.toFixed(1)}px)`;
    }
    if (rightTetherEl) {
      const rxPct = 50 + this.rx * 36;
      const ryPct = 50 - this.ry * 36;
      rightTetherEl.setAttribute('x2', rxPct.toFixed(2));
      rightTetherEl.setAttribute('y2', ryPct.toFixed(2));
    }
    if (rightReadoutEl) {
      rightReadoutEl.textContent = `${this.lookMagnitude.toFixed(2)} // ${isLooking ? 'ORBIT' : 'STBY'}`;
    }
    if (rightLabelEl && (!activeDecodeJobs || !activeDecodeJobs.has(rightLabelEl))) {
      const nextRightLabel = isLooking ? 'ORBIT' : 'LOOK';
      if (rightLabelEl.textContent !== nextRightLabel) {
        rightLabelEl.textContent = nextRightLabel;
        rightLabelEl.setAttribute('data-hud-canonical-text', nextRightLabel);
      }
    }
  },
  setVector(rawLx, rawLy, { autoEnterFreeRoam = true } = {}) {
    let x = Number(rawLx) || 0.0;
    let y = Number(rawLy) || 0.0;
    const rawMag = Math.hypot(x, y);
    if (rawMag > 1.0) {
      x /= rawMag;
      y /= rawMag;
    }
    const mag = Math.min(1.0, Math.hypot(x, y));
    this.lx = Number(x.toFixed(4));
    this.ly = Number(y.toFixed(4));
    this.magnitude = Number(mag.toFixed(4));
    this.active = mag >= THUMBPAD_DEADZONE || this.pointerId !== null;

    if (typeof document !== 'undefined') {
      const baseEl = document.getElementById('mobile-left-thumbpad');
      if (baseEl) {
        const rect = baseEl.getBoundingClientRect();
        if (rect.width > 0) {
          this.maxRadiusPx = rect.width * 0.36;
        }
      }
    }
    this.knobOffsetX = this.lx * this.maxRadiusPx;
    this.knobOffsetY = -this.ly * this.maxRadiusPx;

    if (mag < THUMBPAD_DEADZONE) {
      this.zone = 'deadzone';
      this.isSprinting = false;
      this.walkSpeedFactor = 0.0;
    } else if (mag < THUMBPAD_SPRINT_THRESHOLD) {
      this.zone = 'walk';
      this.isSprinting = false;
      const uWalk = (mag - THUMBPAD_DEADZONE) / (THUMBPAD_SPRINT_THRESHOLD - THUMBPAD_DEADZONE);
      this.walkSpeedFactor = Number(Math.max(0.35, Math.min(1.0, 0.35 + 0.65 * uWalk)).toFixed(4));
    } else {
      this.zone = 'sprint';
      this.isSprinting = true;
      this.walkSpeedFactor = 1.0;
    }

    this.syncDOM();

    if (autoEnterFreeRoam && mag >= THUMBPAD_DEADZONE && sandbox.ready) {
      if (sandbox.isPopupFocused && mag >= 0.18) {
        sandbox.exitMathPodPopupFocus();
      }
      if (sandbox.mode === 'mount-focus' && mag >= 0.18) {
        sandbox.exitMountFocusMode();
      } else if (sandbox.mode === 'scroll') {
        if (sandbox.director) {
          if (sandbox.director.cameraPanState.mode === 'playing') {
            sandbox.director.stopStartupPan();
          }
          if (sandbox.director.introSequenceState.scrollLocked) {
            sandbox.director.introSequenceState.scrollLocked = false;
            sandbox.director.introSequenceState.phase = 'scrolling-alley';
            syncIntroDialogueOverlayUI();
            syncDirectorHUDInputs();
          }
        }
        enterFreeRoamMode();
      }
    }
    return this;
  },
  updateFromClientPoint(clientX, clientY) {
    if (typeof document !== 'undefined') {
      const baseEl = document.getElementById('mobile-left-thumbpad');
      if (baseEl) {
        const rect = baseEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.centerClientX = rect.left + rect.width * 0.5;
          this.centerClientY = rect.top + rect.height * 0.5;
          this.maxRadiusPx = rect.width * 0.36;
        }
      }
    }
    const rMax = Math.max(16, this.maxRadiusPx);
    const dx = clientX - this.centerClientX;
    const dy = clientY - this.centerClientY;
    const dist = Math.hypot(dx, dy);
    const k = dist > rMax ? rMax / dist : 1.0;
    const normLx = (dx * k) / rMax;
    const normLy = -(dy * k) / rMax;
    return this.setVector(normLx, normLy, { autoEnterFreeRoam: true });
  },
  setLookVector(rawRx, rawRy) {
    let x = Number(rawRx) || 0.0;
    let y = Number(rawRy) || 0.0;
    const rawMag = Math.hypot(x, y);
    if (rawMag > 1.0) {
      x /= rawMag;
      y /= rawMag;
    }
    const mag = Math.min(1.0, Math.hypot(x, y));
    this.rx = Number(x.toFixed(4));
    this.ry = Number(y.toFixed(4));
    this.lookMagnitude = Number(mag.toFixed(4));
    this.lookThumbpadActive = mag >= THUMBPAD_DEADZONE || this.lookThumbpadPointerId !== null;
    this.lookActive = this.lookThumbpadActive || this.lookPointerId !== null;

    if (typeof document !== 'undefined') {
      const rightBaseEl = document.getElementById('mobile-right-thumbpad');
      if (rightBaseEl) {
        const rect = rightBaseEl.getBoundingClientRect();
        if (rect.width > 0) {
          this.lookMaxRadiusPx = rect.width * 0.36;
        }
      }
    }
    this.lookKnobOffsetX = this.rx * this.lookMaxRadiusPx;
    this.lookKnobOffsetY = -this.ry * this.lookMaxRadiusPx;

    if (mag < THUMBPAD_DEADZONE) {
      this.yawRateRadPerSec = 0.0;
      this.pitchRateRadPerSec = 0.0;
    } else {
      const uLook = (mag - THUMBPAD_DEADZONE) / (1.0 - THUMBPAD_DEADZONE);
      const gamma = 0.35 * uLook + 0.65 * uLook * uLook;
      const dirX = x / mag;
      const dirY = y / mag;
      this.yawRateRadPerSec = Number((-dirX * gamma * LOOK_THUMBPAD_MAX_YAW_RATE).toFixed(4));
      this.pitchRateRadPerSec = Number((dirY * gamma * LOOK_THUMBPAD_MAX_PITCH_RATE).toFixed(4));
    }

    this.syncDOM();
    return this;
  },
  updateLookFromClientPoint(clientX, clientY) {
    if (typeof document !== 'undefined') {
      const rightBaseEl = document.getElementById('mobile-right-thumbpad');
      if (rightBaseEl) {
        const rect = rightBaseEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.lookCenterClientX = rect.left + rect.width * 0.5;
          this.lookCenterClientY = rect.top + rect.height * 0.5;
          this.lookMaxRadiusPx = rect.width * 0.36;
        }
      }
    }
    const rMax = Math.max(16, this.lookMaxRadiusPx);
    const dx = clientX - this.lookCenterClientX;
    const dy = clientY - this.lookCenterClientY;
    const dist = Math.hypot(dx, dy);
    const k = dist > rMax ? rMax / dist : 1.0;
    const normRx = (dx * k) / rMax;
    const normRy = -(dy * k) / rMax;
    return this.setLookVector(normRx, normRy);
  },
  resetMove() {
    this.pointerId = null;
    this.active = false;
    this.lx = 0.0;
    this.ly = 0.0;
    this.magnitude = 0.0;
    this.zone = 'deadzone';
    this.isSprinting = false;
    this.walkSpeedFactor = 0.0;
    this.knobOffsetX = 0.0;
    this.knobOffsetY = 0.0;
    this.syncDOM();
    return this;
  },
  resetLook() {
    this.lookThumbpadPointerId = null;
    this.lookThumbpadActive = false;
    this.rx = 0.0;
    this.ry = 0.0;
    this.lookMagnitude = 0.0;
    this.yawRateRadPerSec = 0.0;
    this.pitchRateRadPerSec = 0.0;
    this.lookKnobOffsetX = 0.0;
    this.lookKnobOffsetY = 0.0;
    this.lookActive = Boolean(this.lookPointerId !== null);
    this.syncDOM();
    return this;
  },
  reset() {
    this.resetMove();
    this.resetLook();
    return this;
  },
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

const POPUP_FOCUS_CAM_DISTANCE = 0.92;
const popupFocusCameraState = {
  active: false,
  returningToOrbit: false,
  transitionProgress: 1.0,
  calloutId: null,
  fromPos: new THREE.Vector3(),
  fromLookAt: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLookAt: new THREE.Vector3(),
  viewOffset: new THREE.Vector3(0, 0, -POPUP_FOCUS_CAM_DISTANCE),
};

// ============================================================================
// DOOM_HEAD Interactive Two-Stage Hologram Dialogue & Camera State (Spec 041)
// ============================================================================
const doomChatCameraState = {
  active: false,
  returningToOrbit: false,
  transitionProgress: 1.0,
  fromPos: new THREE.Vector3(),
  fromLookAt: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLookAt: new THREE.Vector3(),
};

const doomChatState = {
  isOpen: false,
  stage: 'starters', // 'starters' | 'chatbox'
  chatModelId: 'Qwen/Qwen3.8-27B',
  startersModelId: 'Qwen/Qwen2.5-7B-Instruct',
  activeChatModelResolved: 'Qwen/Qwen3.8-27B',
  activeStartersModelResolved: 'Qwen/Qwen2.5-Coder-32B-Instruct',
  personaPrompt: '',       // Intentionally empty default per Spec 041 §5
  starterTopicPrompt: '',  // Intentionally empty default per Spec 041 §5
  starters: [
    'What is the story behind the holographic systems in Freeman Alley?',
    'How do you and Luis collaborate on AI engineering projects?',
  ],
  startersLoading: false,
  startersLoadedFromHF: false,
  startersLatencyMs: 0,
  chatLoading: false,
  lastChatLatencyMs: 0,
  messages: [],
  lastError: null,
  speakingTimerSec: 0.0,
};

const _doomPairMidLocal = new THREE.Vector3(-0.27, 1.60, 0.38);
const _doomApproachDirLocal = new THREE.Vector3(0.12, 0.0, 0.9928).normalize();
const _doomTempWorldPos = new THREE.Vector3();
const _doomTempLookPos = new THREE.Vector3();
const _doomTempScreenVec = new THREE.Vector3();
const _doomTempMidWorld = new THREE.Vector3();
const _doomTempForward = new THREE.Vector3();
const _doomTempRight = new THREE.Vector3();
const _doomTempUp = new THREE.Vector3();

function computeDoomChatCameraPose(targetChar) {
  const char = targetChar || (sandbox && sandbox.characters ? sandbox.characters.hoodie : null);
  if (!char) {
    return {
      cameraPos: new THREE.Vector3(0.18, 1.68, 4.68),
      lookAtPos: new THREE.Vector3(-0.68, 1.60, 3.18),
    };
  }
  const cosY = Math.cos(char.yaw);
  const sinY = Math.sin(char.yaw);

  // Pair focus midpoint in world space between DOOM_Companion (-0.48, 1.66, +0.72) and LUIS (0.00, 1.66, 0.00)
  const midWorldX =
    char.position.x + _doomPairMidLocal.x * cosY + _doomPairMidLocal.z * sinY;
  const midWorldY = char.position.y + _doomPairMidLocal.y;
  const midWorldZ =
    char.position.z - _doomPairMidLocal.x * sinY + _doomPairMidLocal.z * cosY;
  _doomTempMidWorld.set(midWorldX, midWorldY, midWorldZ);

  // Approach direction rotated by character yaw (three-quarter front-corridor sightline)
  const dirWorldX =
    _doomApproachDirLocal.x * cosY + _doomApproachDirLocal.z * sinY;
  const dirWorldZ =
    -_doomApproachDirLocal.x * sinY + _doomApproachDirLocal.z * cosY;

  const vw =
    typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1280;
  const vh =
    typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 720;
  const aspect =
    camera && camera.aspect > 0.05 ? camera.aspect : vw / Math.max(1, vh);
  const fovRad = ((camera && camera.fov) ? camera.fov : 52) * (Math.PI / 180);
  const tanHalfFovY = Math.tan(fovRad * 0.5);
  const tanHalfFovX = Math.max(0.12, aspect * tanHalfFovY);

  const isPortraitOrMobile = vw <= 768 || aspect < 0.95;
  const panelEl =
    typeof document !== 'undefined' ? document.getElementById('doom-holo-chat-panel') : null;
  const panelRect =
    panelEl && doomChatState.isOpen ? panelEl.getBoundingClientRect() : null;

  let xCenter = 0.0;
  let yCenter = 0.0;
  let halfSafeX = 0.80;
  let halfSafeY = 0.68;

  if (isPortraitOrMobile) {
    // Portrait / Mobile Bottom-Sheet Layout: full horizontal width, upper unobstructed vertical band above the bottom card
    xCenter = 0.02;
    halfSafeX = 0.80;

    let yMinNdc = 0.04;
    if (panelRect && panelRect.height > 20 && panelRect.top > vh * 0.25) {
      const safeBottomPx = Math.max(80, panelRect.top - 14);
      yMinNdc = Math.max(-0.08, Math.min(0.26, 1.0 - 2.0 * (safeBottomPx / vh)));
    }
    const yMaxNdc = Math.max(yMinNdc + 0.42, 1.0 - 2.0 * (56 / Math.max(320, vh)));
    yCenter = 0.5 * (yMinNdc + yMaxNdc) - 0.05;
    halfSafeY = Math.max(0.28, 0.5 * (yMaxNdc - yMinNdc));
  } else {
    // Landscape / Desktop Right-Docked Layout: unobstructed left/center viewport beside the right panel
    let panelWidthPx = Math.min(468, Math.max(280, vw - 48));
    let panelRightMarginPx = 32;
    if (panelRect && panelRect.width > 20 && panelRect.left > vw * 0.32) {
      panelWidthPx = panelRect.width;
      panelRightMarginPx = Math.max(12, vw - panelRect.right);
    }
    const panelLeftPx = Math.max(vw * 0.36, vw - panelWidthPx - panelRightMarginPx - 20);
    const xMaxNdc = Math.max(-0.05, Math.min(0.46, 2.0 * (panelLeftPx / vw) - 1.0));
    const xMinNdc = -0.84;
    xCenter = 0.5 * (xMinNdc + xMaxNdc);
    halfSafeX = Math.max(0.36, 0.5 * (xMaxNdc - xMinNdc));
    yCenter = -0.04;
    halfSafeY = 0.68;
  }

  // Solve camera distance so both DOOM_Companion (front-left) and LUIS (right) fit inside (halfSafeX, halfSafeY)
  const distHoriz = 0.35 + 0.52 / (halfSafeX * tanHalfFovX);
  const distVert = 0.24 + 0.34 / (halfSafeY * tanHalfFovY);
  const shotDist = Math.max(1.48, Math.min(3.25, Math.max(distHoriz, distVert)));

  const camWorldXRaw = midWorldX + dirWorldX * shotDist;
  const camWorldY = midWorldY + 0.04;
  let camWorldZ = midWorldZ + dirWorldZ * shotDist;

  // Prevent camera from clipping the Z = 0.0 exterior brick facade if pair is in the forecourt outside the alley mouth
  if (midWorldZ < -0.20 && Math.abs(camWorldXRaw) > 2.00 && camWorldZ > -0.28) {
    camWorldZ = -0.28;
  }

  let minWallX;
  let maxWallX;
  if (camWorldZ < -0.24) {
    minWallX = -9.10;
    maxWallX = 9.90;
  } else {
    minWallX = resolveAlleyWallProfileX('left', camWorldZ) + 0.24;
    maxWallX = resolveAlleyWallProfileX('right', camWorldZ) - 0.24;
  }
  const camWorldX = Math.max(minWallX, Math.min(maxWallX, camWorldXRaw));

  _doomTempWorldPos.set(camWorldX, camWorldY, camWorldZ);

  // Compute baseline sightline from actual clamped camera position to pair midpoint
  _doomTempForward.subVectors(_doomTempMidWorld, _doomTempWorldPos);
  const actualDist = Math.max(0.5, _doomTempForward.length());
  _doomTempForward.multiplyScalar(1.0 / actualDist);

  // Camera right basis R0 = normalize(F0 x Y_world) = normalize(-F0.z, 0, F0.x)
  _doomTempRight.set(-_doomTempForward.z, 0.0, _doomTempForward.x);
  const rightLen = _doomTempRight.length();
  if (rightLen > 1e-5) {
    _doomTempRight.multiplyScalar(1.0 / rightLen);
  } else {
    _doomTempRight.set(1.0, 0.0, 0.0);
  }

  // Camera up basis U0 = R0 x F0
  _doomTempUp.crossVectors(_doomTempRight, _doomTempForward).normalize();

  // Offset lookAt so the pair midpoint projects onto the unobstructed safe-stage center (xCenter, yCenter) in NDC
  const shiftRightM = xCenter * actualDist * tanHalfFovX;
  const shiftUpM = yCenter * actualDist * tanHalfFovY;
  _doomTempLookPos
    .copy(_doomTempMidWorld)
    .addScaledVector(_doomTempRight, -shiftRightM)
    .addScaledVector(_doomTempUp, -shiftUpM);

  return {
    cameraPos: _doomTempWorldPos,
    lookAtPos: _doomTempLookPos,
  };
}

function syncDoomHoloChatDOM() {
  if (typeof document === 'undefined') return;
  const overlayEl = document.getElementById('doom-holo-chat-overlay');
  const panelEl = document.getElementById('doom-holo-chat-panel');
  const stageStartersEl = document.getElementById('doom-holo-stage-starters');
  const stageChatboxEl = document.getElementById('doom-holo-stage-chatbox');
  const backBtnEl = document.getElementById('doom-back-to-starters-btn');
  const starterBtn0 = document.getElementById('doom-starter-btn-0');
  const starterBtn1 = document.getElementById('doom-starter-btn-1');
  const starterText0 = document.getElementById('doom-starter-text-0');
  const starterText1 = document.getElementById('doom-starter-text-1');
  const msgListEl = document.getElementById('doom-chat-messages-list');
  const statusPillEl = document.getElementById('doom-holo-status-pill');
  const statusDotEl = document.getElementById('doom-holo-status-dot');
  const modelBadgeEl = document.getElementById('doom-holo-model-badge');
  const sendBtnEl = document.getElementById('doom-chat-send-btn');
  const hudBtnEl = document.getElementById('hud-open-doom-chat-btn');

  if (document.body) {
    document.body.classList.toggle('doom-chat-active', Boolean(doomChatState.isOpen));
  }

  if (overlayEl) {
    overlayEl.classList.toggle('active', Boolean(doomChatState.isOpen));
    overlayEl.setAttribute('aria-hidden', String(!doomChatState.isOpen));
  }
  if (panelEl) {
    panelEl.setAttribute('data-stage', doomChatState.stage || 'starters');
  }

  if (hudBtnEl) {
    hudBtnEl.textContent = doomChatState.isOpen
      ? '💬 Exit DOOM_HEAD Chat'
      : '💬 DOOM_HEAD Chat';
  }

  const isChatboxStage = doomChatState.stage === 'chatbox';
  if (stageStartersEl) {
    stageStartersEl.style.display = isChatboxStage ? 'none' : 'flex';
  }
  if (stageChatboxEl) {
    stageChatboxEl.classList.toggle('active', isChatboxStage);
    stageChatboxEl.style.display = isChatboxStage ? 'flex' : 'none';
  }
  if (backBtnEl) {
    backBtnEl.style.display = isChatboxStage ? 'inline-flex' : 'none';
  }

  if (starterText0) {
    starterText0.textContent = doomChatState.startersLoading
      ? 'Synthesizing Qwen 2.5 conversation starter 01...'
      : doomChatState.starters[0] || 'Ask DOOM_HEAD a question...';
  }
  if (starterText1) {
    starterText1.textContent = doomChatState.startersLoading
      ? 'Synthesizing Qwen 2.5 conversation starter 02...'
      : doomChatState.starters[1] || 'Explore Freeman Alley systems...';
  }
  if (starterBtn0) {
    starterBtn0.classList.toggle('loading', Boolean(doomChatState.startersLoading));
    starterBtn0.disabled = Boolean(doomChatState.startersLoading || doomChatState.chatLoading);
  }
  if (starterBtn1) {
    starterBtn1.classList.toggle('loading', Boolean(doomChatState.startersLoading));
    starterBtn1.disabled = Boolean(doomChatState.startersLoading || doomChatState.chatLoading);
  }
  if (sendBtnEl) {
    sendBtnEl.disabled = Boolean(doomChatState.chatLoading);
    sendBtnEl.textContent = doomChatState.chatLoading ? 'WAIT...' : 'SEND →';
  }
  if (statusDotEl) {
    statusDotEl.classList.toggle(
      'busy',
      Boolean(doomChatState.chatLoading || doomChatState.startersLoading)
    );
  }
  if (modelBadgeEl) {
    modelBadgeEl.textContent = isChatboxStage ? 'QWEN 3.8' : 'QWEN 2.5 → 3.8';
  }

  if (statusPillEl) {
    if (doomChatState.lastError) {
      statusPillEl.textContent = `ERR // ${doomChatState.lastError.slice(0, 42)}`;
    } else if (doomChatState.chatLoading) {
      statusPillEl.textContent = 'QWEN 3.8 // SYNTHESIZING REPLY...';
    } else if (doomChatState.startersLoading) {
      statusPillEl.textContent = 'QWEN 2.5 // GENERATING STARTERS...';
    } else if (isChatboxStage) {
      const turnCount = doomChatState.messages.filter((m) => m.role === 'assistant').length;
      const latTag = doomChatState.lastChatLatencyMs
        ? ` (${Math.round(doomChatState.lastChatLatencyMs)}ms)`
        : '';
      statusPillEl.textContent = `STAGE 2 // MULTI-TURN CHAT (${turnCount} TURNS)${latTag}`;
    } else {
      const latTag = doomChatState.startersLatencyMs
        ? ` (${Math.round(doomChatState.startersLatencyMs)}ms)`
        : '';
      statusPillEl.textContent = `STAGE 1 // QWEN 2.5 STARTERS READY${latTag}`;
    }
  }

  if (msgListEl && isChatboxStage) {
    msgListEl.innerHTML = '';
    for (let i = 0; i < doomChatState.messages.length; i++) {
      const msg = doomChatState.messages[i];
      const msgDiv = document.createElement('div');
      if (msg.role === 'user') {
        msgDiv.className = 'doom-chat-msg user';
        const roleSpan = document.createElement('span');
        roleSpan.className = 'msg-role';
        roleSpan.textContent = 'VISITOR // YOU';
        const bodyDiv = document.createElement('div');
        bodyDiv.textContent = msg.content;
        msgDiv.appendChild(roleSpan);
        msgDiv.appendChild(bodyDiv);
      } else if (msg.role === 'error') {
        msgDiv.className = 'doom-chat-msg error';
        const roleSpan = document.createElement('span');
        roleSpan.className = 'msg-role';
        roleSpan.textContent = 'HOLO.SYS // DIAGNOSTIC FAULT';
        const bodyDiv = document.createElement('div');
        bodyDiv.textContent = msg.content;
        msgDiv.appendChild(roleSpan);
        msgDiv.appendChild(bodyDiv);
      } else {
        msgDiv.className = 'doom-chat-msg assistant';
        const roleSpan = document.createElement('span');
        roleSpan.className = 'msg-role';
        const modelShort = (msg.model || doomChatState.activeChatModelResolved || 'Qwen 3.8')
          .split('/')
          .pop();
        roleSpan.textContent = `DOOM_HEAD // ${modelShort}`;
        const bodyDiv = document.createElement('div');
        bodyDiv.textContent = msg.content;
        msgDiv.appendChild(roleSpan);
        msgDiv.appendChild(bodyDiv);
      }
      msgListEl.appendChild(msgDiv);
    }

    if (doomChatState.chatLoading) {
      const thinkingDiv = document.createElement('div');
      thinkingDiv.className = 'doom-chat-msg assistant thinking';
      const roleSpan = document.createElement('span');
      roleSpan.className = 'msg-role';
      roleSpan.textContent = 'DOOM_HEAD // QWEN 3.8';
      const bodyDiv = document.createElement('div');
      bodyDiv.textContent = 'Synthesizing neural response...';
      thinkingDiv.appendChild(roleSpan);
      thinkingDiv.appendChild(bodyDiv);
      msgListEl.appendChild(thinkingDiv);
    }

    msgListEl.scrollTop = msgListEl.scrollHeight;
  }
}

function updateDoomHoloChatTether() {
  if (typeof document === 'undefined' || !doomChatState.isOpen) return;
  const char = sandbox.getDoomChatCharacter ? sandbox.getDoomChatCharacter() : sandbox.characters?.hoodie;
  if (!char || !char.companionMesh) return;

  const panelEl = document.getElementById('doom-holo-chat-panel');
  const pathEl = document.getElementById('doom-holo-tether-path');
  const glowEl = document.getElementById('doom-holo-tether-glow');
  const originDotEl = document.getElementById('doom-holo-tether-origin-dot');
  const panelDotEl = document.getElementById('doom-holo-tether-panel-dot');
  if (!panelEl || !pathEl || !glowEl || !originDotEl || !panelDotEl) return;

  char.companionMesh.getWorldPosition(_doomTempScreenVec);
  _doomTempScreenVec.project(camera);

  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;
  const sx = (_doomTempScreenVec.x * 0.5 + 0.5) * vw;
  const sy = (-_doomTempScreenVec.y * 0.5 + 0.5) * vh;

  const rect = panelEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const isBottomSheet = rect.left <= vw * 0.35 && rect.top > vh * 0.32;
  let px;
  let py;
  let c1x;
  let c1y;
  let c2x;
  let c2y;

  if (isBottomSheet) {
    px = Math.max(rect.left + 28, Math.min(rect.right - 28, sx + (vw * 0.5 - sx) * 0.25));
    py = rect.top;
    c1x = sx;
    c1y = sy + (py - sy) * 0.42;
    c2x = px;
    c2y = sy + (py - sy) * 0.72;
  } else {
    px = rect.left;
    py = rect.top + Math.min(92, rect.height * 0.28);
    c1x = sx + (px - sx) * 0.42;
    c1y = sy - 24;
    c2x = sx + (px - sx) * 0.68;
    c2y = py;
  }

  const dStr = `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${px.toFixed(1)} ${py.toFixed(1)}`;
  pathEl.setAttribute('d', dStr);
  glowEl.setAttribute('d', dStr);
  originDotEl.setAttribute('cx', sx.toFixed(1));
  originDotEl.setAttribute('cy', sy.toFixed(1));
  panelDotEl.setAttribute('cx', px.toFixed(1));
  panelDotEl.setAttribute('cy', py.toFixed(1));
}

function resolveDoomApiCandidateUrls(endpointPath) {
  return resolveStickerApiCandidateUrls(endpointPath);
}

async function postDoomApiWithFallback(endpointPath, payloadObj) {
  await ensureTunnelConfigDiscovered();
  const urls = resolveDoomApiCandidateUrls(endpointPath);
  let lastErr = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj),
      });
      const rawText = await response.text();
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (_parseErr) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }
      if (!response.ok || !data || !data.ok) {
        const errMsg = (data && data.error) || `HTTP ${response.status} from ${url}`;
        throw new Error(errMsg);
      }
      return data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`Failed to reach ${endpointPath}`);
}

async function fetchDoomStartersFromHF({ silentFallback = false } = {}) {
  if (doomChatState.startersLoading) return doomChatState.starters;
  doomChatState.startersLoading = true;
  doomChatState.lastError = null;
  syncDoomHoloChatDOM();
  updateTelemetryHUD();

  try {
    const data = await postDoomApiWithFallback('api/doom/starters', {
      model: doomChatState.startersModelId,
      topicPrompt: doomChatState.starterTopicPrompt,
      temperature: 0.75,
      max_tokens: 120,
    });
    if (!Array.isArray(data.starters) || data.starters.length < 2) {
      throw new Error('Invalid starters array from /api/doom/starters');
    }
    doomChatState.starters = [
      String(data.starters[0]).trim(),
      String(data.starters[1]).trim(),
    ];
    doomChatState.startersLoadedFromHF = true;
    doomChatState.activeStartersModelResolved = data.model || doomChatState.startersModelId;
    doomChatState.startersLatencyMs = Number(data.latencyMs ?? data.latency_ms) || 0;
    if (data.graphrag && typeof data.graphrag === 'object') {
      doomChatState.lastGraphRag = data.graphrag;
    }
    return doomChatState.starters;
  } catch (err) {
    if (!silentFallback) {
      doomChatState.lastError = err?.message || String(err);
      throw err;
    }
    return doomChatState.starters;
  } finally {
    doomChatState.startersLoading = false;
    syncDoomHoloChatDOM();
    updateTelemetryHUD();
  }
}

async function sendDoomChatMessageToHF(rawText) {
  const text = String(rawText || '').trim();
  if (!text || doomChatState.chatLoading) return null;

  doomChatState.stage = 'chatbox';
  doomChatState.lastError = null;
  doomChatState.messages.push({
    role: 'user',
    content: text,
    timestamp: Date.now(),
  });
  doomChatState.chatLoading = true;

  const char = sandbox.getDoomChatCharacter ? sandbox.getDoomChatCharacter() : sandbox.characters?.hoodie;
  if (char) {
    char.startDialogue();
    char.companionSpeakingPulse = 1.0;
  }
  if (sandbox.audio) {
    sandbox.audio.trigger('onActivate', { target: 'DOOM_Companion', source: 'doom-chat-send' });
  }

  const inputEl = typeof document !== 'undefined' ? document.getElementById('doom-chat-input') : null;
  if (inputEl) {
    inputEl.value = '';
  }

  syncDoomHoloChatDOM();
  updateTelemetryHUD();

  try {
    const apiMessages = doomChatState.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    const data = await postDoomApiWithFallback('api/doom/chat', {
      model: doomChatState.chatModelId,
      personaPrompt: doomChatState.personaPrompt,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 320,
    });
    if (typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('Empty reply from /api/doom/chat');
    }

    const replyText = data.reply.trim();
    doomChatState.activeChatModelResolved = data.model || doomChatState.chatModelId;
    doomChatState.lastChatLatencyMs = Number(data.latencyMs ?? data.latency_ms) || 0;
    if (data.graphrag && typeof data.graphrag === 'object') {
      doomChatState.lastGraphRag = data.graphrag;
    }
    doomChatState.speakingTimerSec = 2.8;
    doomChatState.messages.push({
      role: 'assistant',
      content: replyText,
      model: doomChatState.activeChatModelResolved,
      latencyMs: doomChatState.lastChatLatencyMs,
      graphrag: data.graphrag || null,
      timestamp: Date.now(),
    });

    if (char) {
      char.startDialogue();
      char.companionSpeakingPulse = 1.0;
    }
    if (sandbox.audio) {
      sandbox.audio.trigger('onDataStream', {
        target: 'DOOM_Companion',
        source: 'doom-chat-reply',
        model: doomChatState.activeChatModelResolved,
      });
    }
    return replyText;
  } catch (err) {
    const errMsg = err?.message || String(err);
    doomChatState.lastError = errMsg;
    doomChatState.messages.push({
      role: 'error',
      content: errMsg,
      timestamp: Date.now(),
    });
    throw err;
  } finally {
    doomChatState.chatLoading = false;
    syncDoomHoloChatDOM();
    updateTelemetryHUD();
  }
}

// ============================================================================
// Interactive Holographic Sticker Placement, Locked Size Envelope & Amber Tethered Popup (Spec 047 & Spec 054)
// ============================================================================
const STICKER_POPUP_IGNITE_MS = 360;
const STICKER_POPUP_COLLAPSE_MS = 260;
const STICKER_POPUP_CAM_TRANSITION_DURATION = 0.42;

const stickerPopupState = {
  isOpen: false,
  activePlacedId: null,
  lastSavedAt: null,
  animState: 'dormant', // 'dormant' | 'igniting' | 'active' | 'collapsing'
  animStartedAtMs: 0,
  igniteTimer: null,
  collapseTimer: null,
};

const stickerPopupCameraState = {
  active: false,
  returningToOrbit: false,
  transitionProgress: 1.0,
  fromPos: new THREE.Vector3(),
  fromLookAt: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLookAt: new THREE.Vector3(),
};

const _stickerTempWorldPos = new THREE.Vector3();
const _stickerTempScreenVec = new THREE.Vector3();
const _stickerCamNormal = new THREE.Vector3();
const _stickerCamPos = new THREE.Vector3();
const _stickerLookAtPos = new THREE.Vector3();
const _stickerCamFwd = new THREE.Vector3();
const _stickerCamRight = new THREE.Vector3();
const _stickerCamUp = new THREE.Vector3();

// ============================================================================
// Cross-Session PostgreSQL Sticker & Tag/Message Persistence Engine (Spec 056)
// ============================================================================
const STICKER_LOCAL_CACHE_KEY = 'SKATEALLEY_PERSISTED_STICKERS_V1';
const _deletedStickerTombstones = new Set();
const _stickerWriteChainsById = new Map();

const stickerPersistenceState = {
  hydrated: false,
  hydrating: false,
  storageBackend: 'uninitialized',
  dbConnected: false,
  persistedCount: 0,
  pendingWrites: 0,
  lastSyncAt: null,
  lastSyncError: null,
};

function serializePlacedStickerForPersistence(record) {
  if (!record || !record.placedId) return null;
  const pos = record.position || record.anchorPosition || { x: 0, y: 0, z: 0 };
  const anc = record.anchorPosition || pos;
  const norm = record.normal || { x: 1, y: 0, z: 0 };
  return {
    placedId: String(record.placedId),
    assetId: String(record.assetId || record.stickerId || 'doom_tag'),
    stickerId: String(record.stickerId || record.assetId || 'doom_tag'),
    code: String(record.code || 'HOLO-STK-01'),
    anchorPosition: {
      x: Number(anc.x),
      y: Number(anc.y),
      z: Number(anc.z),
    },
    position: {
      x: Number(pos.x),
      y: Number(pos.y),
      z: Number(pos.z),
    },
    normal: {
      x: Number(norm.x),
      y: Number(norm.y),
      z: Number(norm.z),
    },
    rotationRad: Number(record.rotationRad || 0),
    rotationDeg: Number(record.rotationDeg || 0),
    size: Number(record.sizeMeters ?? record.size ?? 0.65),
    sizeMeters: Number(record.sizeMeters ?? record.size ?? 0.65),
    surfaceZone: String(record.surfaceZone || 'alley_wall_left'),
    surfaceId: String(record.surfaceId || record.colliderName || 'COLLIDER_STICKER_WALL_L'),
    colliderName: String(record.colliderName || record.surfaceId || 'COLLIDER_STICKER_WALL_L'),
    surfaceLabel: String(record.surfaceLabel || 'Left Alley Wall (Interior)'),
    wallSide: String(record.wallSide || 'L'),
    tagger: String(record.tagger ?? ''),
    message: String(record.message ?? ''),
    createdAt: Number(record.createdAt || Date.now()),
    updatedAt: Number(record.updatedAt || Date.now()),
  };
}

function syncStickerLocalStorageCache() {
  if (typeof window === 'undefined' || !window.localStorage || !sandbox || !sandbox.holographicStickers) {
    return;
  }
  try {
    const items = sandbox.holographicStickers.placedStickers
      .filter((r) => r && r.placedId && !_deletedStickerTombstones.has(r.placedId))
      .map((r) => serializePlacedStickerForPersistence(r))
      .filter(Boolean);
    window.localStorage.setItem(STICKER_LOCAL_CACHE_KEY, JSON.stringify(items));
  } catch (_err) {
    // Ignore private-browsing quota errors
  }
}

function readStickerLocalStorageCache() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STICKER_LOCAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function resolveStickerApiCandidateUrls(endpointPath = 'api/stickers') {
  const cleanPath = String(endpointPath || 'api/stickers').replace(/^\/+/, '');
  const candidates = [];
  const addCandidate = (url) => {
    if (url && !candidates.includes(url)) {
      candidates.push(url);
    }
  };

  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const explicitOrigin = params.get('apiOrigin') || window.SKATEALLEY_API_ORIGIN;
      if (explicitOrigin && typeof explicitOrigin === 'string') {
        const base = explicitOrigin.trim().replace(/\/+$/, '');
        addCandidate(`${base}/${cleanPath}`);
      }
    } catch (_err) {
      // Ignore query parse error
    }

    const host = (window.location.hostname || '').toLowerCase();
    const port = String(window.location.port || '');
    const isGitHubPages = host.endsWith('.github.io') || host.endsWith('platodoom.com');
    const isKnownSkateAlleyPort =
      port === '8080' || port === '3002' || port === '3000' || port === '8088' || port === '';

    if (!isGitHubPages) {
      addCandidate(`./${cleanPath}`);
    }

    if (isGitHubPages || isKnownSkateAlleyPort) {
      if (
        sandbox &&
        sandbox.tunnelConfig &&
        typeof sandbox.tunnelConfig.url === 'string' &&
        sandbox.tunnelConfig.url.trim()
      ) {
        const base = sandbox.tunnelConfig.url.trim().replace(/\/+$/, '');
        addCandidate(`${base}/${cleanPath}`);
      }
      if (host === 'localhost' || host === '127.0.0.1') {
        addCandidate(`http://localhost:8080/${cleanPath}`);
        addCandidate(`http://localhost:3002/${cleanPath}`);
      }
    }
  } else {
    addCandidate(`./${cleanPath}`);
  }
  return candidates;
}

function queueStickerWriteTask(placedId, taskFn) {
  const key = String(placedId || '__global__');
  const prev = _stickerWriteChainsById.get(key) || Promise.resolve();
  stickerPersistenceState.pendingWrites += 1;
  const next = prev
    .catch(() => {})
    .then(() => taskFn())
    .finally(() => {
      stickerPersistenceState.pendingWrites = Math.max(0, stickerPersistenceState.pendingWrites - 1);
    });
  _stickerWriteChainsById.set(key, next);
  if (sandbox) {
    sandbox.lastStickerPersistPromise = next;
  }
  return next;
}

function persistPlacedStickerRecord(recordOrId) {
  const placedId =
    typeof recordOrId === 'string'
      ? recordOrId
      : recordOrId && recordOrId.placedId
      ? recordOrId.placedId
      : null;
  if (!placedId) return Promise.resolve(null);

  _deletedStickerTombstones.delete(placedId);
  syncStickerLocalStorageCache();

  return queueStickerWriteTask(placedId, async () => {
    if (_deletedStickerTombstones.has(placedId)) {
      return null;
    }
    const liveRec =
      sandbox && sandbox.holographicStickers
        ? sandbox.holographicStickers.getPlacedSticker(placedId)
        : null;
    const targetRec = liveRec || (typeof recordOrId === 'object' ? recordOrId : null);
    const payload = serializePlacedStickerForPersistence(targetRec);
    if (!payload) return null;

    const urls = resolveStickerApiCandidateUrls('api/stickers');
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
        }
        stickerPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
        stickerPersistenceState.storageBackend = data.storage || 'postgres';
        stickerPersistenceState.lastSyncAt = Date.now();
        stickerPersistenceState.lastSyncError = null;
        if (sandbox && sandbox.holographicStickers) {
          stickerPersistenceState.persistedCount = sandbox.holographicStickers.placedStickers.length;
        }
        syncStickerLocalStorageCache();
        return data.sticker || payload;
      } catch (err) {
        lastErr = err;
      }
    }
    stickerPersistenceState.dbConnected = false;
    if (stickerPersistenceState.storageBackend === 'uninitialized') {
      stickerPersistenceState.storageBackend = 'local_fallback';
    }
    stickerPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : 'Failed to persist sticker';
    return null;
  });
}

function deletePersistedStickerRecord(placedId) {
  if (!placedId) return Promise.resolve(false);
  const cleanId = String(placedId);
  _deletedStickerTombstones.add(cleanId);
  syncStickerLocalStorageCache();

  return queueStickerWriteTask(cleanId, async () => {
    const encodedId = encodeURIComponent(cleanId);
    const urls = resolveStickerApiCandidateUrls(`api/stickers/${encodedId}`);
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
        }
        stickerPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
        stickerPersistenceState.storageBackend = data.storage || 'postgres';
        stickerPersistenceState.lastSyncAt = Date.now();
        stickerPersistenceState.lastSyncError = null;
        if (sandbox && sandbox.holographicStickers) {
          stickerPersistenceState.persistedCount = sandbox.holographicStickers.placedStickers.length;
        }
        return Boolean(data.deleted);
      } catch (err) {
        lastErr = err;
      }
    }
    stickerPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : 'Failed to delete sticker';
    return false;
  });
}

async function hydrateStickersFromBackend() {
  if (!sandbox || !sandbox.holographicStickers) return [];
  stickerPersistenceState.hydrating = true;
  const sys = sandbox.holographicStickers;
  const urls = resolveStickerApiCandidateUrls('api/stickers');
  let lastErr = null;

  for (const url of urls) {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 3200) : null;
      let res;
      try {
        res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          signal: controller ? controller.signal : undefined,
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok || !data || !data.ok || !Array.isArray(data.stickers)) {
        throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
      }

      const prevSelectedId = sys.selectedPlacedId;
      for (const item of data.stickers) {
        if (!item || !item.placedId || _deletedStickerTombstones.has(item.placedId)) {
          continue;
        }
        const existing = sys.getPlacedSticker(item.placedId);
        if (existing && Number(existing.updatedAt || 0) > Number(item.updatedAt || 0)) {
          continue;
        }
        sys.placeStickerAt({
          ...item,
          selectOnPlace: false,
        });
      }
      if (prevSelectedId && sys.getPlacedSticker(prevSelectedId)) {
        sys.selectPlacedSticker(prevSelectedId);
      }
      if (sandbox._visualAlleyMesh && typeof sys.syncVisualEnvelope === 'function') {
        sys.syncVisualEnvelope(
          sandbox._visualAlleyMesh,
          sandbox.sfx && sandbox.sfx.floorReflections ? sandbox.sfx.floorReflections.mesh : null
        );
      }

      stickerPersistenceState.hydrated = true;
      stickerPersistenceState.hydrating = false;
      stickerPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
      stickerPersistenceState.storageBackend = data.storage || 'postgres';
      stickerPersistenceState.persistedCount = sys.placedStickers.length;
      stickerPersistenceState.lastSyncAt = Date.now();
      stickerPersistenceState.lastSyncError = null;
      syncStickerLocalStorageCache();
      syncStickerToolHUDInputs();
      syncStickerHoloPopupDOM({ populateInputs: !stickerPopupState.isOpen });
      updateTelemetryHUD();
      if (sandbox.ready) {
        renderer.render(scene, camera);
      }
      return sys.placedStickers;
    } catch (err) {
      lastErr = err;
    }
  }

  // Fallback to localStorage write-through cache if HTTP API is unreachable
  const cachedItems = readStickerLocalStorageCache();
  if (cachedItems.length > 0) {
    const prevSelectedId = sys.selectedPlacedId;
    for (const item of cachedItems) {
      if (!item || !item.placedId || _deletedStickerTombstones.has(item.placedId)) {
        continue;
      }
      const existing = sys.getPlacedSticker(item.placedId);
      if (existing && Number(existing.updatedAt || 0) > Number(item.updatedAt || 0)) {
        continue;
      }
      sys.placeStickerAt({
        ...item,
        selectOnPlace: false,
      });
    }
    if (prevSelectedId && sys.getPlacedSticker(prevSelectedId)) {
      sys.selectPlacedSticker(prevSelectedId);
    }
    if (sandbox._visualAlleyMesh && typeof sys.syncVisualEnvelope === 'function') {
      sys.syncVisualEnvelope(
        sandbox._visualAlleyMesh,
        sandbox.sfx && sandbox.sfx.floorReflections ? sandbox.sfx.floorReflections.mesh : null
      );
    }
  }

  stickerPersistenceState.hydrated = true;
  stickerPersistenceState.hydrating = false;
  stickerPersistenceState.dbConnected = false;
  stickerPersistenceState.storageBackend = 'local_fallback';
  stickerPersistenceState.persistedCount = sys.placedStickers.length;
  stickerPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : null;
  syncStickerToolHUDInputs();
  syncStickerHoloPopupDOM({ populateInputs: !stickerPopupState.isOpen });
  updateTelemetryHUD();
  if (sandbox.ready) {
    renderer.render(scene, camera);
  }
  return sys.placedStickers;
}

const sceneLayoutPersistenceState = {
  hydrated: false,
  hydrating: false,
  dbConnected: false,
  storageBackend: 'uninitialized',
  persistedKeys: [],
  pendingWrites: 0,
  lastSyncAt: 0,
  lastSyncError: null,
};

const _sceneLayoutWriteChains = new Map();

function queueSceneLayoutWriteTask(chainKey, taskFn) {
  const key = String(chainKey || '__scene_layout__');
  const prev = _sceneLayoutWriteChains.get(key) || Promise.resolve();
  sceneLayoutPersistenceState.pendingWrites += 1;
  const next = prev
    .catch(() => {})
    .then(() => taskFn())
    .finally(() => {
      sceneLayoutPersistenceState.pendingWrites = Math.max(0, sceneLayoutPersistenceState.pendingWrites - 1);
    });
  _sceneLayoutWriteChains.set(key, next);
  if (sandbox) {
    sandbox.lastSceneLayoutPersistPromise = next;
  }
  return next;
}

function persistSceneLayoutBatchRecords(layoutsMap, updatedAtMs = Date.now()) {
  if (!layoutsMap || typeof layoutsMap !== 'object' || Object.keys(layoutsMap).length === 0) {
    return Promise.resolve(null);
  }
  const ts = Number.isFinite(updatedAtMs) && updatedAtMs > 0 ? Math.round(updatedAtMs) : Date.now();
  const keysSig = Object.keys(layoutsMap).sort().join(',');
  return queueSceneLayoutWriteTask(keysSig, async () => {
    const urls = resolveStickerApiCandidateUrls('api/scene-layout');
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layouts: layoutsMap, updatedAtMs: ts }),
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
        }
        sceneLayoutPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
        sceneLayoutPersistenceState.storageBackend = data.storage || 'postgres';
        sceneLayoutPersistenceState.lastSyncAt = Date.now();
        sceneLayoutPersistenceState.lastSyncError = null;
        if (Array.isArray(data.savedKeys)) {
          const merged = new Set([...sceneLayoutPersistenceState.persistedKeys, ...data.savedKeys]);
          sceneLayoutPersistenceState.persistedKeys = Array.from(merged);
        }
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    sceneLayoutPersistenceState.dbConnected = false;
    sceneLayoutPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : 'Failed to persist scene layout';
    return null;
  });
}

function persistSceneLayoutRecord(layoutKey, payload, updatedAtMs = Date.now()) {
  if (!layoutKey || payload === undefined) return Promise.resolve(null);
  return persistSceneLayoutBatchRecords({ [String(layoutKey)]: payload }, updatedAtMs);
}

function deletePersistedSceneLayoutRecord(layoutKey) {
  if (!layoutKey) return Promise.resolve(false);
  const cleanKey = String(layoutKey);
  return queueSceneLayoutWriteTask(cleanKey, async () => {
    const encodedKey = encodeURIComponent(cleanKey);
    const urls = resolveStickerApiCandidateUrls(`api/scene-layout/${encodedKey}`);
    let lastErr = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
        }
        sceneLayoutPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
        sceneLayoutPersistenceState.storageBackend = data.storage || 'postgres';
        sceneLayoutPersistenceState.lastSyncAt = Date.now();
        sceneLayoutPersistenceState.lastSyncError = null;
        sceneLayoutPersistenceState.persistedKeys = sceneLayoutPersistenceState.persistedKeys.filter(
          (k) => k !== cleanKey
        );
        return true;
      } catch (err) {
        lastErr = err;
      }
    }
    sceneLayoutPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : 'Failed to delete scene layout';
    return false;
  });
}

async function hydrateSceneLayoutsFromBackend({ isBackgroundRefresh = false } = {}) {
  if (!sandbox || sceneLayoutPersistenceState.hydrating) {
    return sceneLayoutPersistenceState.persistedKeys;
  }
  if (
    isBackgroundRefresh &&
    ((sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId) ||
      (sandbox.mathPods && sandbox.mathPods.activeDragPodId) ||
      (sandbox.transformControls && sandbox.transformControls.dragging) ||
      (sandbox.lamppostLight && sandbox.lamppostLight.isDraggingTarget))
  ) {
    return sceneLayoutPersistenceState.persistedKeys;
  }

  sceneLayoutPersistenceState.hydrating = true;
  const urls = resolveStickerApiCandidateUrls('api/scene-layout');
  let lastErr = null;

  const host =
    typeof window !== 'undefined' && window.location && window.location.hostname
      ? window.location.hostname.toLowerCase()
      : '';
  const isLocalhostOrigin = host === 'localhost' || host === '127.0.0.1';

  const layoutAdapters = [
    {
      layoutKey: 'holo_columns',
      storageKey: HOLO_COLUMNS_STORAGE_KEY,
      readLivePayload(parsedLocal) {
        if (sandbox.hologramColumns && typeof sandbox.hologramColumns.getTransformsMap === 'function') {
          return sandbox.hologramColumns.getTransformsMap();
        }
        return parsedLocal;
      },
      applyRemotePayload(remotePayload, remoteTs) {
        if (sandbox.hologramColumns && typeof sandbox.hologramColumns.applyTransformsMap === 'function') {
          return sandbox.hologramColumns.applyTransformsMap(remotePayload, {
            persistLocal: true,
            updatedAtMs: remoteTs,
          });
        }
        return false;
      },
    },
    {
      layoutKey: 'math_pods',
      storageKey: 'skatealley_mathpods_transforms_v1',
      readLivePayload(parsedLocal) {
        if (sandbox.mathPods && typeof sandbox.mathPods.getTransformsMap === 'function') {
          return sandbox.mathPods.getTransformsMap();
        }
        return parsedLocal;
      },
      applyRemotePayload(remotePayload, remoteTs) {
        if (sandbox.mathPods && typeof sandbox.mathPods.applyTransformsMap === 'function') {
          return sandbox.mathPods.applyTransformsMap(remotePayload, {
            persistLocal: true,
            updatedAtMs: remoteTs,
          });
        }
        return false;
      },
    },
    {
      layoutKey: 'character_camera',
      storageKey: CHARACTER_CAMERA_STORAGE_KEY,
      readLivePayload(parsedLocal) {
        if (sandbox.characterCamera && typeof sandbox.characterCamera.getState === 'function') {
          return sandbox.characterCamera.getState();
        }
        return parsedLocal;
      },
      applyRemotePayload(remotePayload, remoteTs) {
        if (sandbox.characterCamera && typeof sandbox.characterCamera.setState === 'function') {
          sandbox.characterCamera.setState(remotePayload, {
            persistLocal: true,
            persistBackend: false,
            updatedAtMs: remoteTs,
          });
          return true;
        }
        return false;
      },
    },
    ...(IS_DEV_MODE
      ? [
          {
            layoutKey: 'lamppost_light',
            storageKey: LAMPPOST_STORAGE_KEY,
            readLivePayload(parsedLocal) {
              if (sandbox.lamppostLight && typeof sandbox.lamppostLight.getState === 'function') {
                return sandbox.lamppostLight.getState();
              }
              return parsedLocal;
            },
            applyRemotePayload(remotePayload, remoteTs) {
              if (sandbox.lamppostLight && typeof sandbox.lamppostLight.setState === 'function') {
                sandbox.lamppostLight.setState(remotePayload, false);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    window.localStorage.setItem(LAMPPOST_STORAGE_KEY, JSON.stringify(sandbox.lamppostLight.getState()));
                    if (remoteTs > 0) {
                      window.localStorage.setItem(`${LAMPPOST_STORAGE_KEY}_ts`, String(Math.round(remoteTs)));
                    }
                  } catch (_e) {}
                }
                return true;
              }
              return false;
            },
          },
          {
            layoutKey: 'player_spawn',
            storageKey: SPAWN_STORAGE_KEY,
            readLivePayload(parsedLocal) {
              if (sandbox.director && typeof sandbox.director.getSpawnTransform === 'function') {
                return sandbox.director.getSpawnTransform();
              }
              return parsedLocal;
            },
            applyRemotePayload(remotePayload, remoteTs) {
              if (sandbox.director && typeof sandbox.director.setSpawnTransform === 'function') {
                sandbox.director.setSpawnTransform(remotePayload, false);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    window.localStorage.setItem(SPAWN_STORAGE_KEY, JSON.stringify(sandbox.director.getSpawnTransform()));
                    if (remoteTs > 0) {
                      window.localStorage.setItem(`${SPAWN_STORAGE_KEY}_ts`, String(Math.round(remoteTs)));
                    }
                  } catch (_e) {}
                }
                return true;
              }
              return false;
            },
          },
          {
            layoutKey: 'startup_camera_pan',
            storageKey: STARTUP_PAN_STORAGE_KEY,
            readLivePayload(parsedLocal) {
              if (sandbox.director && typeof sandbox.director.getCameraPan === 'function') {
                return sandbox.director.getCameraPan();
              }
              return parsedLocal;
            },
            applyRemotePayload(remotePayload, remoteTs) {
              if (sandbox.director && typeof sandbox.director.setCameraPan === 'function') {
                sandbox.director.setCameraPan(remotePayload, false);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    window.localStorage.setItem(STARTUP_PAN_STORAGE_KEY, JSON.stringify(sandbox.director.getCameraPan()));
                    if (remoteTs > 0) {
                      window.localStorage.setItem(`${STARTUP_PAN_STORAGE_KEY}_ts`, String(Math.round(remoteTs)));
                    }
                  } catch (_e) {}
                }
                return true;
              }
              return false;
            },
          },
          {
            layoutKey: 'intro_dialogue_boxes',
            storageKey: INTRO_DIALOGUE_STORAGE_KEY,
            readLivePayload(parsedLocal) {
              return parsedLocal;
            },
            applyRemotePayload(remotePayload, remoteTs) {
              if (
                Array.isArray(remotePayload) &&
                remotePayload.length >= 7 &&
                sandbox.director &&
                typeof sandbox.director.setDialogueBoxes === 'function'
              ) {
                sandbox.director.setDialogueBoxes(remotePayload, false);
                if (typeof window !== 'undefined' && window.localStorage) {
                  try {
                    window.localStorage.setItem(INTRO_DIALOGUE_STORAGE_KEY, JSON.stringify(remotePayload));
                    if (remoteTs > 0) {
                      window.localStorage.setItem(`${INTRO_DIALOGUE_STORAGE_KEY}_ts`, String(Math.round(remoteTs)));
                    }
                  } catch (_e) {}
                }
                return true;
              }
              return false;
            },
          },
        ]
      : []),
  ];

  for (const url of urls) {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 3200) : null;
      let res;
      try {
        res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          signal: controller ? controller.signal : undefined,
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok || !data || !data.ok || typeof data.layouts !== 'object' || data.layouts === null) {
        throw new Error((data && (data.message || data.error)) || `HTTP ${res.status} from ${url}`);
      }

      const remoteLayouts = data.layouts || {};
      const remoteUpdatedMap = data.updatedAtMs || {};
      const pendingUploads = {};
      const pendingUploadStorageKeys = [];
      let anyAppliedFromRemote = false;

      sandbox._hydratingSceneLayouts = true;
      try {
        for (const adapter of layoutAdapters) {
          let localRaw = null;
          let localParsed = null;
          let localTs = 0;
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localRaw = window.localStorage.getItem(adapter.storageKey);
              if (localRaw) {
                localParsed = JSON.parse(localRaw);
              }
              const tsRaw = window.localStorage.getItem(`${adapter.storageKey}_ts`);
              if (tsRaw) {
                const n = Number(tsRaw);
                if (Number.isFinite(n) && n > 0) localTs = n;
              }
            } catch (_e) {
              localParsed = null;
            }
          }

          const hasValidLocal = localParsed !== null && typeof localParsed === 'object';
          const remotePayload = remoteLayouts[adapter.layoutKey];
          const hasRemote = remotePayload !== undefined && remotePayload !== null;
          const remoteTs = Number(remoteUpdatedMap[adapter.layoutKey] || 0);

          const shouldSeedFromLocalhost =
            hasValidLocal &&
            ((isLocalhostOrigin && localTs === 0) ||
              (isLocalhostOrigin && !hasRemote) ||
              (localTs > 0 && localTs > remoteTs));

          if (shouldSeedFromLocalhost) {
            const livePayload = adapter.readLivePayload(localParsed);
            if (livePayload !== null && livePayload !== undefined) {
              pendingUploads[adapter.layoutKey] = livePayload;
              pendingUploadStorageKeys.push(adapter.storageKey);
            }
          } else if (hasRemote) {
            const shouldApplyRemote = !isBackgroundRefresh || localTs === 0 || remoteTs > localTs || !hasValidLocal;
            if (shouldApplyRemote) {
              const applied = adapter.applyRemotePayload(remotePayload, remoteTs);
              if (applied) {
                anyAppliedFromRemote = true;
              }
            }
          }
        }
      } finally {
        sandbox._hydratingSceneLayouts = false;
      }

      if (Object.keys(pendingUploads).length > 0) {
        const uploadTs = Date.now();
        if (typeof window !== 'undefined' && window.localStorage) {
          for (const sk of pendingUploadStorageKeys) {
            try {
              window.localStorage.setItem(`${sk}_ts`, String(uploadTs));
            } catch (_e) {}
          }
        }
        await persistSceneLayoutBatchRecords(pendingUploads, uploadTs);
      }

      const finalKeys = new Set([
        ...Object.keys(remoteLayouts),
        ...Object.keys(pendingUploads),
      ]);
      sceneLayoutPersistenceState.hydrated = true;
      sceneLayoutPersistenceState.hydrating = false;
      sceneLayoutPersistenceState.dbConnected = Boolean(data.dbConnected !== false);
      sceneLayoutPersistenceState.storageBackend = data.storage || 'postgres';
      sceneLayoutPersistenceState.persistedKeys = Array.from(finalKeys);
      sceneLayoutPersistenceState.lastSyncAt = Date.now();
      sceneLayoutPersistenceState.lastSyncError = null;

      if (anyAppliedFromRemote) {
        syncHoloEditorHUDInputs();
        syncLamppostEditorHUDInputs();
        syncDirectorHUDInputs();
        updateTelemetryHUD();
        if (sandbox.ready) {
          renderer.render(scene, camera);
        }
      }
      return sceneLayoutPersistenceState.persistedKeys;
    } catch (err) {
      lastErr = err;
    }
  }

  sceneLayoutPersistenceState.hydrated = true;
  sceneLayoutPersistenceState.hydrating = false;
  sceneLayoutPersistenceState.dbConnected = false;
  sceneLayoutPersistenceState.storageBackend = 'local_fallback';
  sceneLayoutPersistenceState.lastSyncError = lastErr ? lastErr.message || String(lastErr) : null;
  return sceneLayoutPersistenceState.persistedKeys;
}

function getActiveOrSelectedStickerRecord() {
  if (!sandbox || !sandbox.holographicStickers) return null;
  const sys = sandbox.holographicStickers;
  if (stickerPopupState.activePlacedId) {
    const rec = sys.getPlacedSticker(stickerPopupState.activePlacedId);
    if (rec) return rec;
  }
  if (sys.selectedPlacedId) {
    const rec = sys.getPlacedSticker(sys.selectedPlacedId);
    if (rec) return rec;
  }
  if (sys.placedStickers && sys.placedStickers.length > 0) {
    return sys.placedStickers[sys.placedStickers.length - 1];
  }
  return null;
}

function computeStickerPopupCameraPose(record) {
  if (!record) return null;
  const obj3d = record.instance ? record.instance.group || record.instance.rootGroup : null;
  if (obj3d) {
    obj3d.getWorldPosition(_stickerTempWorldPos);
  } else if (record.position) {
    _stickerTempWorldPos.set(record.position.x, record.position.y, record.position.z);
  } else {
    return null;
  }

  const nRaw = record.normal || { x: 0, y: 0, z: 1 };
  _stickerCamNormal.set(nRaw.x ?? 0, nRaw.y ?? 0, nRaw.z ?? 1);
  if (_stickerCamNormal.lengthSq() < 1e-6) {
    _stickerCamNormal.set(0, 0, 1);
  } else {
    _stickerCamNormal.normalize();
  }

  const vw = Math.max(240, typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280);
  const vh = Math.max(240, typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 720);
  const aspect = vw / vh;
  const fovYRad = THREE.MathUtils.degToRad(camera.fov || 55);
  const tanHalfFovY = Math.tan(fovYRad * 0.5);
  const tanHalfFovX = tanHalfFovY * aspect;

  const panelEl = typeof document !== 'undefined' ? document.getElementById('sticker-holo-popup-panel') : null;
  const isPortraitSheet = vw <= 768 || aspect < 0.95;

  let xCenter = -0.26;
  let yCenter = 0.04;
  let halfSafeX = 0.42;
  let halfSafeY = 0.68;

  if (isPortraitSheet) {
    const panelH =
      panelEl && panelEl.offsetHeight > 40 ? panelEl.offsetHeight : Math.min(vh * 0.48, 340);
    const panelTopPx = Math.max(120, vh - panelH - 14);
    const topSafePx = Math.min(68, vh * 0.09);
    const bottomSafePx = Math.max(topSafePx + 72, panelTopPx - 18);
    const yTopNDC = 1.0 - 2.0 * (topSafePx / vh);
    const yBottomNDC = 1.0 - 2.0 * (bottomSafePx / vh);
    xCenter = 0.0;
    yCenter = THREE.MathUtils.clamp(0.5 * (yTopNDC + yBottomNDC), 0.14, 0.56);
    halfSafeX = 0.76;
    halfSafeY = THREE.MathUtils.clamp(0.5 * Math.abs(yTopNDC - yBottomNDC), 0.18, 0.55);
  } else {
    const panelW =
      panelEl && panelEl.offsetWidth > 100 ? panelEl.offsetWidth : Math.min(380, vw * 0.42);
    const panelLeftPx = Math.max(160, vw - panelW - 22);
    const leftSafePx = Math.min(44, vw * 0.05);
    const rightSafePx = Math.max(leftSafePx + 120, panelLeftPx - 24);
    const xLeftNDC = (leftSafePx / vw) * 2.0 - 1.0;
    const xRightNDC = (rightSafePx / vw) * 2.0 - 1.0;
    xCenter = THREE.MathUtils.clamp(0.5 * (xLeftNDC + xRightNDC), -0.48, -0.14);
    yCenter = vh <= 480 ? 0.02 : 0.04;
    halfSafeX = THREE.MathUtils.clamp(0.5 * Math.abs(xRightNDC - xLeftNDC), 0.22, 0.66);
    halfSafeY = vh <= 480 ? 0.58 : 0.72;
  }

  const wMeters =
    record.widthMeters ||
    (record.instance && record.instance.geometrySpec
      ? record.instance.geometrySpec.planeWidthMeters
      : record.sizeMeters) ||
    0.65;
  const hMeters =
    record.heightMeters ||
    (record.instance && record.instance.geometrySpec
      ? record.instance.geometrySpec.planeHeightMeters
      : record.sizeMeters) ||
    0.65;

  const marginFactor = 1.65;
  const distHoriz = (0.5 * wMeters * marginFactor) / Math.max(0.14, halfSafeX * tanHalfFovX);
  const distVert = (0.5 * hMeters * marginFactor) / Math.max(0.14, halfSafeY * tanHalfFovY);
  const shotDist = THREE.MathUtils.clamp(Math.max(distHoriz, distVert), 1.35, 3.60);

  if (Math.abs(_stickerCamNormal.y) >= 0.85) {
    // Floor / ground sticker: oblique elevated approach aligned with sticker surface basis to prevent gimbal lock
    const basis = computeStickerSurfaceBasis(_stickerCamNormal, record.rotationRad || 0);
    _stickerCamPos
      .copy(_stickerTempWorldPos)
      .addScaledVector(_stickerCamNormal, shotDist * 0.78)
      .addScaledVector(basis.tangentUp, -shotDist * 0.62);
    const minFloorCamY = resolveStickerFloorContourY(_stickerCamPos.z) + 0.88;
    if (_stickerCamPos.y < minFloorCamY) {
      _stickerCamPos.y = minFloorCamY;
    }
    if (_stickerCamPos.z >= -0.05) {
      const minX = resolveAlleyWallProfileX('left', _stickerCamPos.z) + 0.26;
      const maxX = resolveAlleyWallProfileX('right', _stickerCamPos.z) - 0.26;
      if (minX < maxX) {
        _stickerCamPos.x = THREE.MathUtils.clamp(_stickerCamPos.x, minX, maxX);
      }
    }
  } else {
    // Wall sticker (interior alley wall or exterior brick facade)
    _stickerCamPos
      .copy(_stickerTempWorldPos)
      .addScaledVector(_stickerCamNormal, shotDist);
    _stickerCamPos.y = THREE.MathUtils.clamp(
      _stickerTempWorldPos.y + 0.05,
      resolveStickerFloorContourY(_stickerTempWorldPos.z) + 0.65,
      3.85
    );

    if (_stickerTempWorldPos.z >= -0.05 && Math.abs(_stickerCamNormal.x) >= 0.45) {
      const minXAtSticker = resolveAlleyWallProfileX('left', _stickerTempWorldPos.z) + 0.26;
      const maxXAtSticker = resolveAlleyWallProfileX('right', _stickerTempWorldPos.z) - 0.26;
      if (minXAtSticker < maxXAtSticker) {
        _stickerCamPos.x = THREE.MathUtils.clamp(_stickerCamPos.x, minXAtSticker, maxXAtSticker);
      }
      const perpDist = Math.abs(_stickerCamPos.x - _stickerTempWorldPos.x);
      if (perpDist < shotDist * 0.94) {
        const extraZ = Math.min(
          1.25,
          Math.sqrt(Math.max(0.0, shotDist * shotDist - perpDist * perpDist)) * 0.72
        );
        const zSign = _stickerTempWorldPos.z > 1.2 ? -1.0 : 1.0;
        _stickerCamPos.z = _stickerTempWorldPos.z + zSign * extraZ;
        const minXAtCam = resolveAlleyWallProfileX('left', _stickerCamPos.z) + 0.26;
        const maxXAtCam = resolveAlleyWallProfileX('right', _stickerCamPos.z) - 0.26;
        if (minXAtCam < maxXAtCam) {
          _stickerCamPos.x = THREE.MathUtils.clamp(_stickerCamPos.x, minXAtCam, maxXAtCam);
        }
      }
    }
  }

  _stickerCamFwd.subVectors(_stickerTempWorldPos, _stickerCamPos);
  const actualDist = Math.max(0.35, _stickerCamFwd.length());
  _stickerCamFwd.multiplyScalar(1.0 / actualDist);

  _stickerCamRight.crossVectors(_stickerCamFwd, WORLD_UP);
  if (_stickerCamRight.lengthSq() < 1e-5) {
    _stickerCamRight.set(1, 0, 0);
  } else {
    _stickerCamRight.normalize();
  }
  _stickerCamUp.crossVectors(_stickerCamRight, _stickerCamFwd).normalize();

  // Shift lookAt target so the 3D sticker projects into (xCenter, yCenter) of the unobstructed safe stage
  _stickerLookAtPos
    .copy(_stickerTempWorldPos)
    .addScaledVector(_stickerCamRight, -xCenter * actualDist * tanHalfFovX)
    .addScaledVector(_stickerCamUp, -yCenter * actualDist * tanHalfFovY);

  return {
    camPos: _stickerCamPos,
    lookAtPos: _stickerLookAtPos,
    safeStage: {
      xCenter,
      yCenter,
      halfSafeX,
      halfSafeY,
      isPortraitSheet,
    },
  };
}

function syncStickerHoloPopupDOM({ populateInputs = false } = {}) {
  if (typeof document === 'undefined') return;
  const sys = sandbox ? sandbox.holographicStickers : null;
  const overlayEl = document.getElementById('sticker-holo-popup-overlay');
  const titleEl = document.getElementById('sticker-holo-title-text');
  const surfaceBadgeEl = document.getElementById('sticker-holo-surface-badge');
  const statusPillEl = document.getElementById('sticker-holo-status-pill');
  const taggerInputEl = document.getElementById('sticker-tagger-input');
  const messageInputEl = document.getElementById('sticker-message-input');
  const savedReadoutEl = document.getElementById('sticker-saved-readout');
  const savedTaggerEl =
    document.getElementById('sticker-saved-tagger-display') ||
    document.getElementById('sticker-saved-tagger-text');
  const savedDimsEl = document.getElementById('sticker-saved-dims-display');
  const savedMessageEl =
    document.getElementById('sticker-saved-message-display') ||
    document.getElementById('sticker-saved-message-text');

  const record = getActiveOrSelectedStickerRecord();
  const isOpen = Boolean(stickerPopupState.isOpen && record);
  if (sandbox) {
    sandbox.isStickerPopupOpen = isOpen;
  }

  if (document.body) {
    document.body.classList.toggle('sticker-popup-active', isOpen);
  }

  if (overlayEl) {
    if (isOpen) {
      const state = stickerPopupState.animState === 'igniting' ? 'igniting' : 'active';
      stickerPopupState.animState = state;
      overlayEl.classList.add('active');
      overlayEl.classList.toggle('igniting', state === 'igniting');
      overlayEl.classList.remove('closing');
      overlayEl.setAttribute('data-holo-state', state);
      overlayEl.setAttribute('aria-hidden', 'false');
    } else if (stickerPopupState.animState === 'collapsing') {
      overlayEl.classList.remove('active', 'igniting');
      overlayEl.classList.add('closing');
      overlayEl.setAttribute('data-holo-state', 'collapsing');
      overlayEl.setAttribute('aria-hidden', 'true');
    } else {
      stickerPopupState.animState = 'dormant';
      overlayEl.classList.remove('active', 'igniting', 'closing');
      overlayEl.setAttribute('data-holo-state', 'dormant');
      overlayEl.setAttribute('aria-hidden', 'true');
    }
  }

  if (!sys || !record) return;
  const bounds = sys.getSizeBounds();

  if (titleEl) {
    titleEl.textContent = `${record.label || record.stickerId} // HOLO.TAG`;
  }
  if (surfaceBadgeEl) {
    surfaceBadgeEl.textContent = `${(record.surfaceLabel || record.surfaceId || 'SURFACE').toUpperCase()} • ${record.sizeMeters.toFixed(2)}m`;
  }
  if (statusPillEl) {
    const pos = record.position || { x: 0, y: 0, z: 0 };
    const savedTag = record.tagger || record.message ? 'TAGGED' : 'AWAITING TAG';
    statusPillEl.textContent = `${savedTag} // (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) • bounds [${bounds.minSize.toFixed(2)}m..${bounds.maxSize.toFixed(2)}m]`;
  }

  const wMeters =
    record.widthMeters ||
    (record.instance ? record.instance.geometrySpec.planeWidthMeters : record.sizeMeters);
  const hMeters =
    record.heightMeters ||
    (record.instance ? record.instance.geometrySpec.planeHeightMeters : record.sizeMeters);

  if (populateInputs) {
    if (taggerInputEl) {
      taggerInputEl.value = record.tagger || '';
    }
    if (messageInputEl) {
      messageInputEl.value = record.message || '';
    }
  }

  const hasSavedContent = Boolean(
    (record.tagger && record.tagger.trim()) || (record.message && record.message.trim())
  );
  if (savedReadoutEl) {
    savedReadoutEl.classList.toggle('visible', hasSavedContent);
    savedReadoutEl.style.display = hasSavedContent ? 'block' : 'none';
  }
  if (savedTaggerEl) {
    const taggerName =
      record.tagger && record.tagger.trim() ? record.tagger.trim() : 'ANONYMOUS TAGGER';
    savedTaggerEl.textContent = `TAGGER // ${taggerName}`;
  }
  if (savedDimsEl) {
    savedDimsEl.textContent = `${wMeters.toFixed(2)}m × ${hMeters.toFixed(2)}m (${Math.round(record.rotationDeg || 0)}°)`;
  }
  if (savedMessageEl) {
    savedMessageEl.textContent =
      record.message && record.message.trim() ? record.message.trim() : '(No message body)';
  }
}

function syncStickerToolHUDInputs() {
  if (typeof document === 'undefined' || !sandbox || !sandbox.holographicStickers) return;
  const sys = sandbox.holographicStickers;
  const bounds = sys.getSizeBounds();
  const pState = sys.placementState;
  const selectedRec = getActiveOrSelectedStickerRecord();

  const activeSize = pState.active
    ? pState.sizeMeters
    : selectedRec
    ? selectedRec.sizeMeters
    : bounds.defaultSize;
  const activeRotDeg = pState.active
    ? Math.round(THREE.MathUtils.radToDeg(pState.rotationRad))
    : selectedRec
    ? Math.round(selectedRec.rotationDeg || 0)
    : 0;

  const statusLabelEl =
    document.getElementById('sticker-hud-status-label') ||
    document.getElementById('sticker-tool-status-label');
  if (statusLabelEl) {
    statusLabelEl.textContent = `${sys.placedStickers.length} Placed | [${bounds.minSize.toFixed(2)}m, ${bounds.maxSize.toFixed(2)}m]`;
  }

  const assetSelectEl = document.getElementById('sticker-asset-select');
  if (assetSelectEl && document.activeElement !== assetSelectEl) {
    assetSelectEl.value = pState.stickerId || sandbox.selectedHoloStickerId || 'doom_tag';
  }

  const startPlaceBtn = document.getElementById('sticker-start-place-btn');
  if (startPlaceBtn) {
    const activeSpecLabel =
      STICKER_ASSET_BY_ID[pState.stickerId]?.label ||
      String(pState.stickerId || 'doom_tag')
        .replace(/_/g, ' ')
        .toUpperCase();
    startPlaceBtn.textContent = pState.active
      ? `Placing: ${activeSpecLabel} (Esc)`
      : 'Place Sticker in 3D';
    startPlaceBtn.classList.toggle('secondary', !pState.active);
  }

  const calibToggleBtn = document.getElementById('sticker-calib-toggle-btn');
  if (calibToggleBtn) {
    calibToggleBtn.textContent = sys.calibrationState.active
      ? '3D Min/Max Frame: ON'
      : '3D Min/Max Frame: OFF';
    calibToggleBtn.classList.toggle('secondary', !sys.calibrationState.active);
  }

  const minSlider = document.getElementById('sticker-min-size-slider');
  const minInput = document.getElementById('sticker-min-size-input');
  const maxSlider = document.getElementById('sticker-max-size-slider');
  const maxInput = document.getElementById('sticker-max-size-input');
  const curSizeSlider = document.getElementById('sticker-cur-size-slider');
  const curSizeInput = document.getElementById('sticker-cur-size-input');
  const rotSlider = document.getElementById('sticker-rot-deg-slider');
  const rotInput = document.getElementById('sticker-rot-deg-input');

  if (minSlider && document.activeElement !== minSlider) minSlider.value = bounds.minSize.toFixed(2);
  if (minInput && document.activeElement !== minInput) minInput.value = bounds.minSize.toFixed(2);
  if (maxSlider && document.activeElement !== maxSlider) maxSlider.value = bounds.maxSize.toFixed(2);
  if (maxInput && document.activeElement !== maxInput) maxInput.value = bounds.maxSize.toFixed(2);

  if (curSizeSlider) {
    curSizeSlider.min = String(bounds.minSize);
    curSizeSlider.max = String(bounds.maxSize);
    if (document.activeElement !== curSizeSlider) {
      curSizeSlider.value = activeSize.toFixed(2);
    }
  }
  if (curSizeInput) {
    curSizeInput.min = String(bounds.minSize);
    curSizeInput.max = String(bounds.maxSize);
    if (document.activeElement !== curSizeInput) {
      curSizeInput.value = activeSize.toFixed(2);
    }
  }
  if (rotSlider && document.activeElement !== rotSlider) {
    rotSlider.value = String(activeRotDeg);
  }
  if (rotInput && document.activeElement !== rotInput) {
    rotInput.value = String(activeRotDeg);
  }

  const bannerEl = document.getElementById('sticker-placement-banner');
  const bannerLabelEl = document.getElementById('sticker-placement-banner-label');
  if (bannerEl) {
    bannerEl.classList.toggle('visible', Boolean(pState.active));
    bannerEl.classList.toggle('active', Boolean(pState.active));
  }
  if (bannerLabelEl && pState.active) {
    const spec = STICKER_ASSET_BY_ID[pState.stickerId] || { label: pState.stickerId };
    const specLabel =
      spec.label ||
      String(spec.id || pState.stickerId || 'doom_tag')
        .replace(/_/g, ' ')
        .toUpperCase();
    const hit = pState.lastHit;
    const surfText = hit ? `on <strong>${hit.surfaceLabel}</strong>` : '(Aim at any wall or floor)';
    bannerLabelEl.innerHTML = `<span class="banner-badge">STICKER MODE</span> Placing <strong>${specLabel}</strong> ${surfText} &bull; Size: <strong>${pState.sizeMeters.toFixed(2)}m</strong> [${bounds.minSize.toFixed(2)}–${bounds.maxSize.toFixed(2)}m] &bull; Rot: <strong>${activeRotDeg}°</strong> &bull; Click Surface to Place`;
  }
}

function updateStickerHoloPopupTether() {
  if (typeof performance !== 'undefined' && stickerPopupState.animStartedAtMs > 0) {
    const elapsedMs = performance.now() - stickerPopupState.animStartedAtMs;
    if (stickerPopupState.animState === 'igniting' && elapsedMs >= STICKER_POPUP_IGNITE_MS) {
      stickerPopupState.animState = 'active';
      syncStickerHoloPopupDOM();
    } else if (
      stickerPopupState.animState === 'collapsing' &&
      elapsedMs >= STICKER_POPUP_COLLAPSE_MS
    ) {
      stickerPopupState.animState = 'dormant';
      syncStickerHoloPopupDOM();
    }
  }
  if (
    typeof document === 'undefined' ||
    (!stickerPopupState.isOpen && stickerPopupState.animState !== 'collapsing') ||
    !sandbox ||
    !sandbox.holographicStickers
  ) {
    return;
  }
  const record = getActiveOrSelectedStickerRecord();
  if (!record) return;

  const panelEl = document.getElementById('sticker-holo-popup-panel');
  const pathEl = document.getElementById('sticker-holo-tether-path');
  const glowEl = document.getElementById('sticker-holo-tether-glow');
  const originDotEl = document.getElementById('sticker-holo-tether-origin-dot');
  const panelDotEl = document.getElementById('sticker-holo-tether-panel-dot');
  if (!panelEl || !pathEl || !glowEl || !originDotEl || !panelDotEl) return;

  const obj3d = record.instance ? record.instance.group || record.instance.rootGroup : null;
  if (obj3d) {
    obj3d.getWorldPosition(_stickerTempWorldPos);
  } else if (record.position) {
    _stickerTempWorldPos.set(record.position.x, record.position.y, record.position.z);
  } else {
    return;
  }
  _stickerTempScreenVec.copy(_stickerTempWorldPos).project(camera);

  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;
  const sx = Math.max(12, Math.min(vw - 12, (_stickerTempScreenVec.x * 0.5 + 0.5) * vw));
  const sy = Math.max(12, Math.min(vh - 12, (-_stickerTempScreenVec.y * 0.5 + 0.5) * vh));

  const rect = panelEl.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) return;

  const isPortraitSheet = vw <= 768 || vw / Math.max(1, vh) < 0.95;
  let px;
  let py;
  let c1x;
  let c1y;
  let c2x;
  let c2y;

  if (isPortraitSheet) {
    // Portrait / mobile bottom-sheet dock: attach tether to top edge of panel
    px = THREE.MathUtils.clamp(sx, rect.left + 28, Math.max(rect.left + 28, rect.right - 28));
    py = rect.top;
    c1x = sx + (px - sx) * 0.28;
    c1y = sy + (py - sy) * 0.44;
    c2x = px;
    c2y = sy + (py - sy) * 0.72;
  } else {
    // Landscape / desktop right dock: attach tether to left edge of panel
    px = rect.left;
    py = THREE.MathUtils.clamp(sy, rect.top + 28, Math.max(rect.top + 28, rect.bottom - 28));
    c1x = sx + (px - sx) * 0.42;
    c1y = sy - 18;
    c2x = sx + (px - sx) * 0.72;
    c2y = py;
  }

  const dStr = `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${px.toFixed(1)} ${py.toFixed(1)}`;
  pathEl.setAttribute('d', dStr);
  glowEl.setAttribute('d', dStr);
  originDotEl.setAttribute('cx', sx.toFixed(1));
  originDotEl.setAttribute('cy', sy.toFixed(1));
  panelDotEl.setAttribute('cx', px.toFixed(1));
  panelDotEl.setAttribute('cy', py.toFixed(1));
}

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

const SCROLL_CORRIDOR_WALL_SAFE_CLEARANCE = 0.54; // m — safe inward clearance from alley walls (CHAR_COLLISION_RADIUS 0.38m + 0.16m shoulder margin)

function resolveScrollEntranceProgressWindow(xStart, zStart, zAlleyMouth = 3.00) {
  const needsEntranceApproach =
    zStart < zAlleyMouth - 0.01 || (zStart < 1.25 && Math.abs(xStart) > 1.05);
  if (!needsEntranceApproach) {
    return 0.0;
  }
  const approachDist = Math.hypot(xStart, Math.max(2.0, zAlleyMouth - zStart));
  return Math.max(0.06, Math.min(0.22, approachDist / (approachDist + 48.0)));
}

function getCurrentScrollEntranceProgressWindow() {
  const env = sandbox.environment;
  const spawnState = sandbox.director ? sandbox.director.spawnState : null;
  const xStart = spawnState ? spawnState.x : (env ? env.spawnPlayerPos.x : 0.0);
  const zStart = spawnState ? spawnState.z : (env ? env.spawnPlayerPos.z : 3.00);
  return resolveScrollEntranceProgressWindow(xStart, zStart, 3.00);
}

function mapRawScrollToCorridorProgress(rawProgress) {
  const p = Math.max(0.0, Math.min(1.0, rawProgress));
  const pEntrance = getCurrentScrollEntranceProgressWindow();
  if (pEntrance <= 0.0) return p;
  return (p - pEntrance) / Math.max(1e-5, 1.0 - pEntrance);
}

function mapCorridorToRawScrollProgress(corridorProgress) {
  const pc = Math.max(0.0, Math.min(1.0, corridorProgress));
  const pEntrance = getCurrentScrollEntranceProgressWindow();
  if (pEntrance <= 0.0) return pc;
  return Math.max(0.0, Math.min(1.0, pEntrance + pc * (1.0 - pEntrance)));
}

function evaluateScrollCorridorPath(progress, overrideSpawnState = null) {
  const env = sandbox.environment;
  const p = Math.max(0.0, Math.min(1.0, progress));
  const floorY = env ? env.floorY : 0.0;
  const npcZ = env ? env.spawnNpcPos.z : 16.0;

  const spawnState = overrideSpawnState || (sandbox.director ? sandbox.director.spawnState : null);
  const xStart = spawnState ? spawnState.x : (env ? env.spawnPlayerPos.x : 0.0);
  const zStart = spawnState ? spawnState.z : (env ? env.spawnPlayerPos.z : 3.00);
  const zAlleyMouth = 3.00;
  const pEntrance = resolveScrollEntranceProgressWindow(xStart, zStart, zAlleyMouth);

  let z;
  let x = 0.0;
  let tx = 0.0;
  let tz = 1.0;

  if (pEntrance > 0.0) {
    if (p <= pEntrance) {
      const u = p / pEntrance;
      const s = u * u * (3.0 - 2.0 * u);
      const cornerAlpha =
        zStart < 1.25
          ? Math.max(0.0, Math.min(1.0, (Math.abs(xStart) - 0.70) / 0.75))
          : 0.0;

      const p0x = xStart;
      const p0z = zStart;

      const p1StraightX = xStart * 0.55;
      const p1StraightZ = zStart + 0.33 * (zAlleyMouth - zStart);
      const p2StraightX = 0.0;
      const p2StraightZ = zStart + 0.67 * (zAlleyMouth - zStart);

      const zForecourtClear = Math.min(zStart - 0.12, -1.15);
      const p1CornerX = 0.0;
      const p1CornerZ = zForecourtClear;
      const p2CornerX = 0.0;
      const p2CornerZ = -0.55;

      const p1x = p1StraightX + (p1CornerX - p1StraightX) * cornerAlpha;
      const p1z = p1StraightZ + (p1CornerZ - p1StraightZ) * cornerAlpha;
      const p2x = p2StraightX + (p2CornerX - p2StraightX) * cornerAlpha;
      const p2z = p2StraightZ + (p2CornerZ - p2StraightZ) * cornerAlpha;
      const p3x = 0.0;
      const p3z = zAlleyMouth;

      const invS = 1.0 - s;
      const b0 = invS * invS * invS;
      const b1 = 3.0 * invS * invS * s;
      const b2 = 3.0 * invS * s * s;
      const b3 = s * s * s;

      x = b0 * p0x + b1 * p1x + b2 * p2x + b3 * p3x;
      z = b0 * p0z + b1 * p1z + b2 * p2z + b3 * p3z;

      const d0 = 3.0 * invS * invS;
      const d1 = 6.0 * invS * s;
      const d2 = 3.0 * s * s;
      tx = d0 * (p1x - p0x) + d1 * (p2x - p1x) + d2 * (p3x - p2x);
      tz = d0 * (p1z - p0z) + d1 * (p2z - p1z) + d2 * (p3z - p2z);

      const spawnYaw =
        spawnState && Number.isFinite(spawnState.yawRad)
          ? spawnState.yawRad
          : env
            ? env.spawnPlayerYaw
            : 0.0;
      const rawBezLen = Math.hypot(tx, tz) || 1.0;
      const bezTx = tx / rawBezLen;
      const bezTz = tz / rawBezLen;
      const uBlend = Math.min(1.0, u / 0.35);
      const wBlend = uBlend * uBlend * (3.0 - 2.0 * uBlend);
      const startTx = Math.sin(spawnYaw);
      const startTz = Math.cos(spawnYaw);
      tx = startTx + (bezTx - startTx) * wBlend;
      tz = startTz + (bezTz - startTz) * wBlend;
    } else {
      const pRem = (p - pEntrance) / (1.0 - pEntrance);
      z = interpolateCorridorZFromProgress(pRem);
      x = 0.0;
      tx = 0.0;
      tz = 1.0;
    }
  } else {
    if (Math.abs(zStart - zAlleyMouth) <= 0.01) {
      z = interpolateCorridorZFromProgress(p);
    } else {
      const pStart = interpolateProgressFromCorridorZ(zStart);
      const pEff = pStart + p * (1.0 - pStart);
      z = p <= 1e-6 ? zStart : interpolateCorridorZFromProgress(pEff);
    }
    const uX = Math.min(1.0, p / 0.08);
    const smoothUX = uX * uX * (3.0 - 2.0 * uX);
    x = xStart * (1.0 - smoothUX);
    const dz_dp = Math.max(1.0, SCROLL_TERMINAL_Z - zStart);
    const dx_dp = p < 0.08 ? (-xStart * 6.0 * uX * (1.0 - uX)) / 0.08 : 0.0;
    tx = dx_dp;
    tz = dz_dp;
  }

  // Smooth C1 raised-cosine lateral clearance pass around SPAWN_NPC (Spec 013 §3.1)
  const dzNpc = z - npcZ;
  if (Math.abs(dzNpc) < SCROLL_NPC_AVOID_HALF_SPAN) {
    const avoidWeight = p <= 1e-4 ? 0.0 : Math.min(1.0, p / 0.04);
    const u = dzNpc / SCROLL_NPC_AVOID_HALF_SPAN;
    const cosTerm = 0.5 * (1.0 + Math.cos(Math.PI * u));
    const dCos_dz = -0.5 * (Math.PI / SCROLL_NPC_AVOID_HALF_SPAN) * Math.sin(Math.PI * u);
    x += SCROLL_NPC_AVOID_OFFSET_X * cosTerm * avoidWeight;
    tx += SCROLL_NPC_AVOID_OFFSET_X * dCos_dz * avoidWeight * Math.max(0.1, tz);
  }

  // Enforce safe interior corridor clearance from calibrated Left & Right alley walls
  if (z >= -0.15 && p > 1e-5) {
    const minSafeX = resolveAlleyWallProfileX('L', Math.max(0.0, z)) + SCROLL_CORRIDOR_WALL_SAFE_CLEARANCE;
    const maxSafeX = resolveAlleyWallProfileX('R', Math.max(0.0, z)) - SCROLL_CORRIDOR_WALL_SAFE_CLEARANCE;
    if (x < minSafeX) {
      x = minSafeX;
    } else if (x > maxSafeX) {
      x = maxSafeX;
    }
  }

  const tLen = Math.hypot(tx, tz);
  const normTx = tLen > 1e-6 ? tx / tLen : 0.0;
  const normTz = tLen > 1e-6 ? tz / tLen : 1.0;
  const dx_dz = Math.abs(normTz) > 1e-3 ? normTx / normTz : 0.0;

  return {
    progress: p,
    pEntrance,
    x,
    y: floorY,
    z,
    tx: normTx,
    tz: normTz,
    dx_dz,
    forwardYaw: Math.atan2(normTx, normTz),
    backwardYaw: Math.atan2(-normTx, -normTz),
  };
}

function getActiveHoloStationForProgress(progress, mode) {
  if (mode === 'mount-focus' && sandbox.focusedMount) {
    return sandbox.focusedMount.station;
  }
  if (mode !== 'scroll') return null;
  const corridorProgress = mapRawScrollToCorridorProgress(progress);
  if (corridorProgress < 0.0) return null;
  for (let i = 0; i < HOLO_PROJECT_STATIONS.length; i++) {
    const st = HOLO_PROJECT_STATIONS[i];
    if (corridorProgress >= st.startProgress && corridorProgress <= st.endProgress) {
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
  const effectiveProgress = isScrollMode ? mapRawScrollToCorridorProgress(sandbox.scrollProgress) : 1.0;
  const activeChar = sandbox.getActiveCharacter();

  for (let i = 0; i < sandbox.wallMounts.length; i++) {
    const m = sandbox.wallMounts[i];
    if (
      (m.screenGroup && m.screenGroup.userData && m.screenGroup.userData.culledBySceneCutter) ||
      (m.standbyBracketGroup && m.standbyBracketGroup.userData && m.standbyBracketGroup.userData.culledBySceneCutter)
    ) {
      m.screenGroup.visible = false;
      m.standbyBracketGroup.visible = false;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = false;
      if (m.backFaceMesh) m.backFaceMesh.visible = false;
      if (m.headerGroup) m.headerGroup.visible = false;
      if (m.headerFrontMesh) m.headerFrontMesh.visible = false;
      if (m.headerBackMesh) m.headerBackMesh.visible = false;
      if (m.wallGlowLight) m.wallGlowLight.intensity = 0.0;
      continue;
    }
    const st = m.station;

    const isFocusedOverlayActive =
      sandbox.mode === 'mount-focus' && sandbox.focusedMount === m && !sandbox.whitepaperColumnOpen;

    if (effectiveProgress < st.startProgress) {
      // State A — Pre-Station / Unmounted Standby (Spec 036 §5.2: single-layer unified hologram card on wall)
      m.state = 'standby';
      m.isMounted = false;
      m.mountProgress = 0.0;
      m.currentRotationY = 0.0;
      m.currentRotationDeg = 0.0;
      m.currentWorldNormal.set(0.0, 0.0, -1.0);

      m.screenGroup.visible = !isFocusedOverlayActive;
      m.standbyBracketGroup.visible = false;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = !isFocusedOverlayActive;
      if (m.backFaceMesh) m.backFaceMesh.visible = false;
      if (m.headerGroup) m.headerGroup.visible = !isFocusedOverlayActive;
      if (m.headerFrontMesh) m.headerFrontMesh.visible = !isFocusedOverlayActive;
      if (m.headerBackMesh) m.headerBackMesh.visible = false;
      m.screenGroup.position.copy(m.locatorPosition);
      m.screenGroup.rotation.set(0.0, m.mountedRotationY, 0.0);
      m.panelOffsetGroup.position.set(0.0, 0.0, MOUNT_BRICK_CLEARANCE);
      m.panelOffsetGroup.rotation.set(m.mountViewingPitchRad || 0.08, 0.0, 0.0);

      m.standbyOpacity = 0.28;
      m.glassOpacity = 0.32;
      m.faceMat.opacity = 0.32;
      m.standbyPlateMat.opacity = 0.22;
      m.bracketWireMat.opacity = 0.56;
      m.bracketWireMat.color.setHex(0xfbbf24);
      m.wallGlowLight.intensity = 0.65;
      if (m.standbyDiffusedMat) m.standbyDiffusedMat.uniforms.uIntensity.value = 0.0;
      if (m.diffusedLightMat) m.diffusedLightMat.uniforms.uIntensity.value = 0.65;
    } else if (effectiveProgress <= st.endProgress) {
      // State B — Active Transparent Holographic Showcase in Corridor Ahead of Character X (Spec 036 §5.2)
      m.state = 'showcase';
      m.isMounted = false;
      m.mountProgress = 0.0;
      m.currentRotationY = 0.0;
      m.currentRotationDeg = 0.0;
      m.currentWorldNormal.set(0.0, 0.0, -1.0);

      const lateralOffset = st.wallSide === 'L' ? -0.92 : 0.92;
      const showcaseX = (activeChar ? activeChar.position.x : 0.0) + lateralOffset;
      const showcaseY = st.expectedY + (m.mountElevationOffsetY || 0.42);
      const showcaseZ = Math.max(
        st.expectedZ,
        (activeChar ? activeChar.position.z : st.expectedZ) + 1.45
      );

      m.screenGroup.visible = !isFocusedOverlayActive;
      m.standbyBracketGroup.visible = false;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = false;
      if (m.backFaceMesh) m.backFaceMesh.visible = !isFocusedOverlayActive;
      if (m.headerGroup) m.headerGroup.visible = !isFocusedOverlayActive;
      if (m.headerFrontMesh) m.headerFrontMesh.visible = false;
      if (m.headerBackMesh) m.headerBackMesh.visible = !isFocusedOverlayActive;
      m.screenGroup.position.set(showcaseX, showcaseY, showcaseZ);
      m.screenGroup.rotation.set(0.0, 0.0, 0.0);
      m.panelOffsetGroup.position.set(0.0, 0.0, 0.0);
      m.panelOffsetGroup.rotation.set(0.0, 0.0, 0.0);

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
      if (m.standbyDiffusedMat) m.standbyDiffusedMat.uniforms.uIntensity.value = 0.0;
      if (m.diffusedLightMat) m.diffusedLightMat.uniforms.uIntensity.value = 0.95;
    } else {
      // State C — Scroll-Past Rotation (±90°) & Flush Wall Mounting at SCREEN_MOUNT_0X (Spec 036 §5.2)
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

      const endPose = evaluateScrollCorridorPath(mapCorridorToRawScrollProgress(st.endProgress));
      const startX = endPose.x + (st.wallSide === 'L' ? -0.92 : 0.92);
      const startY = st.expectedY + (m.mountElevationOffsetY || 0.42);
      const startZ = st.expectedZ;

      m.screenGroup.visible = !isFocusedOverlayActive;
      m.standbyBracketGroup.visible = false;
      if (m.frontFaceMesh) m.frontFaceMesh.visible = !isFocusedOverlayActive;
      if (m.backFaceMesh) m.backFaceMesh.visible = false;
      if (m.headerGroup) m.headerGroup.visible = !isFocusedOverlayActive;
      if (m.headerFrontMesh) m.headerFrontMesh.visible = !isFocusedOverlayActive;
      if (m.headerBackMesh) m.headerBackMesh.visible = false;
      m.panelOffsetGroup.position.set(0.0, 0.0, MOUNT_BRICK_CLEARANCE * smoothT);
      m.panelOffsetGroup.rotation.set((m.mountViewingPitchRad || 0.08) * smoothT, 0.0, 0.0);
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
    if (m.headerGroup && m.headerLocalY < 1.50) {
      const targetBaseY = m.headerBaseLocalOffsetY || 1.78;
      m.headerLocalY = Number((targetBaseY + (m.headerHoverOffsetY || 0.0)).toFixed(4));
      m.headerGroup.position.y = m.headerLocalY;
    }
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

  if (sandbox.mode !== 'freeroam' || sandbox.isPopupFocused) {
    sandbox.proximityMount = null;
    sandbox.hoveredMount = null;
    const hasOtherInteractiveHover = Boolean(
      sandbox.hoveredMathPod ||
        sandbox.hoveredMathPodPopupId ||
        sandbox.hoveredHoloColumnId ||
        (sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId)
    );
    document.body.classList.toggle('mount-pointer-hover', hasOtherInteractiveHover);
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

  document.body.classList.toggle(
    'mount-pointer-hover',
    Boolean(
      sandbox.hoveredMount ||
        sandbox.hoveredMathPod ||
        sandbox.hoveredMathPodPopupId ||
        sandbox.hoveredHoloColumnId ||
        (sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId)
    )
  );

  // 3. Update on-screen interaction prompt (Spec 065 §5.5: visitor-facing copy strictly "Press E or Click to Inspect")
  const promptMount = sandbox.hoveredMount || sandbox.proximityMount;
  if (promptEl && promptLabelEl) {
    if (promptMount) {
      promptLabelEl.textContent = 'Press E or Click to Inspect';
      promptEl.dataset.mountName = promptMount.mountName;
      promptEl.classList.add('visible');
    } else {
      promptEl.classList.remove('visible');
      delete promptEl.dataset.mountName;
    }
  }
}

// ============================================================================
// Holographic Pop-Up & Mount Focus Interface UI (Spec 068 §5.1–§5.6)
// ============================================================================
let activeHoloTagState = {
  stationId: null,
  tagLabel: null,
};

let _programmaticHoloTrackScrollUntil = 0;
let _suppressNextTrackScrollSync = false;
let _holoTrackScrollSettleTimer = null;
const _holoPreviewActiveFrameByStationId = new Map();

const HOLO_PREVIEW_QUAD_BG_POSITIONS = [
  '0% 0%',
  '100% 0%',
  '0% 100%',
  '100% 100%',
];

function syncHoloCustomScrollbar() {
  if (typeof document === 'undefined') return;
  const trackEl = document.getElementById('holo-custom-scrollbar');
  const thumbEl = document.getElementById('holo-custom-scrollbar-thumb');
  if (!trackEl || !thumbEl) return;

  const viewportEl =
    document.getElementById('holo-works-horizontal-track') ||
    document.getElementById('holo-body-scroll-viewport');
  if (!viewportEl) return;

  const trackH = Math.max(0, trackEl.clientHeight);
  if (trackH <= 0) return;

  const scrollH = Math.max(1, viewportEl.scrollHeight);
  const clientH = Math.max(1, viewportEl.clientHeight);
  const maxScroll = Math.max(0, scrollH - clientH);
  const scrollTop = Math.max(0, Math.min(maxScroll, viewportEl.scrollTop));
  trackEl.classList.toggle('is-scrollable', maxScroll > 1);

  let thumbH;
  let thumbY;
  if (maxScroll <= 1) {
    thumbH = Math.max(34, Math.round(trackH * 0.56));
    thumbY = 0;
    trackEl.setAttribute('aria-valuenow', '0');
  } else {
    const ratio = Math.min(0.78, Math.max(0.24, clientH / scrollH));
    thumbH = Math.max(32, Math.round(trackH * ratio));
    const maxThumbTravel = Math.max(0, trackH - thumbH);
    const scrollFraction = scrollTop / maxScroll;
    thumbY = Math.round(scrollFraction * maxThumbTravel);
    trackEl.setAttribute('aria-valuenow', String(Math.round(scrollFraction * 100)));
  }

  thumbEl.style.height = `${thumbH}px`;
  thumbEl.style.transform = `translateY(${thumbY}px)`;
}

function setActiveHoloTagPopup(station, tagLabel, { triggerAnimation = true } = {}) {
  if (typeof document === 'undefined') return;
  const tagsEl = document.getElementById('holo-tags');
  const popupEl = document.getElementById('holo-tag-popup');
  const popupTitleEl = document.getElementById('holo-tag-popup-title');
  const popupDescEl = document.getElementById('holo-tag-popup-desc');
  const horizTrackEl = document.getElementById('holo-works-horizontal-track');

  if (!station || !tagLabel) {
    activeHoloTagState.stationId = station ? station.id : null;
    activeHoloTagState.tagLabel = null;
    if (tagsEl) {
      tagsEl.querySelectorAll('button.holo-tag').forEach((btn) => {
        btn.classList.remove('active', 'tag-click-anim');
        btn.setAttribute('aria-expanded', 'false');
      });
    }
    if (popupEl) {
      popupEl.classList.remove('open');
      popupEl.hidden = true;
      popupEl.setAttribute('aria-hidden', 'true');
    }
    if (horizTrackEl) {
      horizTrackEl.querySelectorAll('.holo-work-slide').forEach((slideEl) => {
        if (station && slideEl.dataset.stationId !== station.id) return;
        slideEl.querySelectorAll('button.holo-tag').forEach((btn) => {
          btn.classList.remove('active', 'tag-click-anim');
          btn.setAttribute('aria-expanded', 'false');
        });
        const slidePopupEl = slideEl.querySelector('.holo-tag-popup');
        if (slidePopupEl) {
          slidePopupEl.classList.remove('open');
          slidePopupEl.hidden = true;
          slidePopupEl.setAttribute('aria-hidden', 'true');
        }
      });
    }
    syncHoloCustomScrollbar();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(syncHoloCustomScrollbar);
    }
    return;
  }

  const desc = HOLO_TAG_DESCRIPTIONS[tagLabel];
  if (!desc) {
    throw new Error(`[Spec 068] Missing curated description for station tag: "${tagLabel}"`);
  }

  activeHoloTagState.stationId = station.id;
  activeHoloTagState.tagLabel = tagLabel;

  if (tagsEl) {
    tagsEl.querySelectorAll('button.holo-tag').forEach((btn) => {
      const isMatch = btn.dataset.tagLabel === tagLabel;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-expanded', isMatch ? 'true' : 'false');
      if (isMatch && triggerAnimation) {
        btn.classList.remove('tag-click-anim');
        void btn.offsetWidth;
        btn.classList.add('tag-click-anim');
      } else if (!isMatch) {
        btn.classList.remove('tag-click-anim');
      }
    });
  }

  if (popupTitleEl) {
    popupTitleEl.textContent = tagLabel;
  }
  if (popupDescEl) {
    popupDescEl.textContent = desc;
  }
  if (popupEl) {
    popupEl.classList.add('open');
    popupEl.hidden = false;
    popupEl.setAttribute('aria-hidden', 'false');
    popupEl.style.animation = 'none';
    void popupEl.offsetWidth;
    popupEl.style.animation = '';
  }

  if (horizTrackEl) {
    const slideEl = horizTrackEl.querySelector(`.holo-work-slide[data-station-id="${station.id}"]`);
    if (slideEl) {
      slideEl.querySelectorAll('button.holo-tag').forEach((btn) => {
        const isMatch = btn.dataset.tagLabel === tagLabel;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-expanded', isMatch ? 'true' : 'false');
        if (isMatch && triggerAnimation) {
          btn.classList.remove('tag-click-anim');
          void btn.offsetWidth;
          btn.classList.add('tag-click-anim');
        } else if (!isMatch) {
          btn.classList.remove('tag-click-anim');
        }
      });
      const slidePopupEl = slideEl.querySelector('.holo-tag-popup');
      const slidePopupTitleEl = slideEl.querySelector('[data-role="slide-tag-popup-title"]');
      const slidePopupDescEl = slideEl.querySelector('[data-role="slide-tag-popup-desc"]');
      if (slidePopupTitleEl) slidePopupTitleEl.textContent = tagLabel;
      if (slidePopupDescEl) slidePopupDescEl.textContent = desc;
      if (slidePopupEl) {
        slidePopupEl.classList.add('open');
        slidePopupEl.hidden = false;
        slidePopupEl.setAttribute('aria-hidden', 'false');
      }
    }
  }

  syncHoloCustomScrollbar();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      const viewportEl = document.getElementById('holo-body-scroll-viewport');
      if (viewportEl && popupEl && !popupEl.hidden) {
        const vpRect = viewportEl.getBoundingClientRect();
        const popRect = popupEl.getBoundingClientRect();
        if (popRect.bottom > vpRect.bottom) {
          viewportEl.scrollTop += popRect.bottom - vpRect.bottom + 8;
        }
      }
      syncHoloCustomScrollbar();
    });
  }
}

function setHoloSlidePreviewFrame(slideEl, station, frameIdx) {
  if (!slideEl || !station) return;
  const totalFrames = Math.max(1, Number(station.previewFrameCount) || 4);
  const idx = ((frameIdx % totalFrames) + totalFrames) % totalFrames;
  _holoPreviewActiveFrameByStationId.set(station.id, idx);

  const bgPos = HOLO_PREVIEW_QUAD_BG_POSITIONS[idx] || '0% 0%';
  const stageEl = slideEl.querySelector('[data-role="preview-stage"]');
  const captionEl = slideEl.querySelector('[data-role="preview-caption"]');
  const badgeEl = slideEl.querySelector('[data-role="frame-badge"]');

  if (stageEl) {
    stageEl.style.backgroundPosition = bgPos;
    stageEl.dataset.activeFrame = String(idx);
  }
  if (captionEl && Array.isArray(station.previewFrameCaptions)) {
    captionEl.textContent = station.previewFrameCaptions[idx] || `${station.code} // LIVE PREVIEW`;
  }
  if (badgeEl) {
    badgeEl.textContent = `FRAME 0${idx + 1} / 0${totalFrames}`;
  }
  slideEl.querySelectorAll('.holo-preview-quad-btn').forEach((btn, qIdx) => {
    const isActive = qIdx === idx;
    btn.classList.toggle('active-quad', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function scrollHoloWorksTrackToStation(stationIndex, { smooth = true } = {}) {
  if (typeof document === 'undefined') return;
  const trackEl = document.getElementById('holo-works-horizontal-track');
  if (!trackEl) return;

  const slides = Array.from(trackEl.querySelectorAll('.holo-work-slide'));
  const targetSlide = slides.find((el) => Number(el.dataset.stationIndex) === Number(stationIndex));
  slides.forEach((el) => {
    const isMatch = el === targetSlide;
    el.classList.toggle('active-slide', isMatch);
    el.setAttribute('aria-hidden', 'false');
  });

  const pipsContainer = document.getElementById('holo-station-pips');
  if (pipsContainer) {
    pipsContainer.querySelectorAll('.holo-station-pip-btn').forEach((pip) => {
      const isMatch = Number(pip.dataset.stationIndex) === Number(stationIndex);
      pip.classList.toggle('active', isMatch);
      pip.setAttribute('aria-current', isMatch ? 'step' : 'false');
    });
  }

  if (!targetSlide) return;
  const trackRect = trackEl.getBoundingClientRect();
  const slideRect = targetSlide.getBoundingClientRect();
  const rawTargetTop =
    trackRect.height > 0
      ? trackEl.scrollTop + (slideRect.top - trackRect.top) - 4
      : Math.max(0, targetSlide.offsetTop - trackEl.offsetTop);
  const maxScrollTop = Math.max(0, trackEl.scrollHeight - trackEl.clientHeight);
  const targetTop = Math.max(0, Math.min(maxScrollTop, rawTargetTop));

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  _programmaticHoloTrackScrollUntil = now + 180;

  if (Math.abs(trackEl.scrollTop - targetTop) > 1) {
    trackEl.scrollTop = targetTop;
  }
  syncHoloCustomScrollbar();
}

function initHoloStationPips() {
  if (typeof document === 'undefined') return;
  const pipsContainer = document.getElementById('holo-station-pips');
  if (pipsContainer) {
    pipsContainer.innerHTML = '';
    HOLO_PROJECT_STATIONS.forEach((st) => {
      const pipBtn = document.createElement('button');
      pipBtn.type = 'button';
      pipBtn.className = `holo-station-pip-btn${st.index === 1 ? ' active' : ''}`;
      pipBtn.dataset.stationIndex = String(st.index);
      pipBtn.dataset.stationId = st.id;
      pipBtn.dataset.mountName = st.mountName;
      pipBtn.dataset.holoInteractive = `pip-${st.code}`;
      pipBtn.textContent = st.code;
      pipBtn.title = `${st.code} // ${st.title}`;
      pipBtn.setAttribute('aria-label', `Select Work ${st.code}: ${st.title}`);
      pipBtn.setAttribute('aria-current', st.index === 1 ? 'step' : 'false');
      pipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sandbox.audio) {
          sandbox.audio.trigger('onUpdate', {
            source: 'holo-station-pip',
            stationId: st.id,
          });
        }
        if (sandbox.mode === 'mount-focus' || sandbox.mode === 'freeroam') {
          sandbox.focusWallMount(st.mountName);
        } else {
          sandbox.scrollToProjectStation(st.index);
        }
      });
      pipsContainer.appendChild(pipBtn);
    });
  }

  const trackEl = document.getElementById('holo-works-horizontal-track');
  if (!trackEl) return;
  trackEl.innerHTML = '';

  HOLO_PROJECT_STATIONS.forEach((st) => {
    const slideEl = document.createElement('section');
    slideEl.className = `holo-work-slide${st.index === 1 ? ' active-slide' : ''}`;
    slideEl.id = `holo-work-slide-${st.code}`;
    slideEl.dataset.stationId = st.id;
    slideEl.dataset.stationIndex = String(st.index);
    slideEl.dataset.mountName = st.mountName;
    slideEl.setAttribute('role', 'group');
    slideEl.setAttribute('aria-roledescription', 'slide');
    slideEl.setAttribute('aria-label', `Work ${st.code} of 07: ${st.title}`);

    // Left Column: Project Details, Narrative Callout & Interactive Tags
    const mainCol = document.createElement('div');
    mainCol.className = 'holo-main-col';

    const kickerEl = document.createElement('div');
    kickerEl.className = 'holo-work-slide-kicker';
    kickerEl.textContent = `WORK ${st.code} / 0${HOLO_PROJECT_STATIONS.length} // ${st.mountName} • ${
      st.wallSide === 'L' ? 'LEFT CORRIDOR WALL' : 'RIGHT CORRIDOR WALL'
    } (Z=${st.expectedZ.toFixed(1)}m)`;
    mainCol.appendChild(kickerEl);

    const slideTitleEl = document.createElement('h3');
    slideTitleEl.className = 'holo-work-slide-title';
    slideTitleEl.textContent = st.title;
    mainCol.appendChild(slideTitleEl);

    const descEl = document.createElement('p');
    descEl.className = 'holo-description';
    descEl.textContent = st.description;
    mainCol.appendChild(descEl);

    if (
      st.narrativeCallout &&
      typeof st.narrativeCallout.body === 'string' &&
      st.narrativeCallout.body.trim().length > 0
    ) {
      const narrativeBox = document.createElement('div');
      narrativeBox.className = 'holo-narrative-callout';
      narrativeBox.style.display = 'flex';
      const narrativeHeading = document.createElement('h4');
      narrativeHeading.className = 'holo-narrative-heading';
      narrativeHeading.textContent =
        st.narrativeCallout.heading || 'What the hell does this mean, Luis?';
      const narrativeBody = document.createElement('p');
      narrativeBody.className = 'holo-narrative-body';
      narrativeBody.textContent = st.narrativeCallout.body;
      narrativeBox.appendChild(narrativeHeading);
      narrativeBox.appendChild(narrativeBody);
      mainCol.appendChild(narrativeBox);
    }

    const tagRow = document.createElement('div');
    tagRow.className = 'holo-tag-row';
    tagRow.setAttribute('role', 'group');
    tagRow.setAttribute('aria-label', `${st.title} Technology Tags`);

    st.tags.forEach((tag, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'holo-tag';
      btn.dataset.holoInteractive = `slide-${st.code}-tag-${idx}`;
      btn.dataset.tagIndex = String(idx);
      btn.dataset.tagLabel = tag;
      btn.dataset.tagName = tag;
      btn.setAttribute('aria-expanded', 'false');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'holo-tag-label';
      labelSpan.textContent = tag;

      const plusSpan = document.createElement('span');
      plusSpan.className = 'holo-tag-plus-bubble';
      plusSpan.setAttribute('aria-hidden', 'true');
      plusSpan.textContent = '+';

      btn.appendChild(labelSpan);
      btn.appendChild(plusSpan);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sandbox.audio) {
          sandbox.audio.trigger('onUpdate', {
            source: 'holo-tag-click',
            stationId: st.id,
            tag,
          });
        }
        const isAlreadyActive =
          activeHoloTagState.stationId === st.id && activeHoloTagState.tagLabel === tag;
        if (isAlreadyActive) {
          setActiveHoloTagPopup(st, null, { triggerAnimation: false });
        } else {
          setActiveHoloTagPopup(st, tag, { triggerAnimation: true });
        }
      });

      tagRow.appendChild(btn);
    });
    mainCol.appendChild(tagRow);

    const slideTagPopup = document.createElement('div');
    slideTagPopup.className = 'holo-tag-popup';
    slideTagPopup.setAttribute('role', 'region');
    slideTagPopup.setAttribute('aria-live', 'polite');
    slideTagPopup.setAttribute('aria-hidden', 'true');
    slideTagPopup.hidden = true;

    const popupHeader = document.createElement('div');
    popupHeader.className = 'holo-tag-popup-header';
    const popupBadge = document.createElement('span');
    popupBadge.className = 'holo-tag-popup-badge';
    const popupDot = document.createElement('span');
    popupDot.className = 'holo-tag-popup-dot';
    popupDot.setAttribute('aria-hidden', 'true');
    const popupTitle = document.createElement('span');
    popupTitle.className = 'holo-tag-popup-title';
    popupTitle.dataset.role = 'slide-tag-popup-title';
    popupBadge.appendChild(popupDot);
    popupBadge.appendChild(popupTitle);

    const popupCloseBtn = document.createElement('button');
    popupCloseBtn.type = 'button';
    popupCloseBtn.className = 'holo-tag-popup-close-btn';
    popupCloseBtn.setAttribute('aria-label', 'Close Tag Description');
    popupCloseBtn.textContent = '✕';
    popupCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveHoloTagPopup(st, null, { triggerAnimation: false });
    });

    popupHeader.appendChild(popupBadge);
    popupHeader.appendChild(popupCloseBtn);

    const popupDesc = document.createElement('p');
    popupDesc.className = 'holo-tag-popup-desc';
    popupDesc.dataset.role = 'slide-tag-popup-desc';

    slideTagPopup.appendChild(popupHeader);
    slideTagPopup.appendChild(popupDesc);
    mainCol.appendChild(slideTagPopup);

    // Right Column: 4-Frame Amber Hologram Live-Demo Preview + Metrics + CTA Links
    const visualPanel = document.createElement('div');
    visualPanel.className = 'holo-Visual-panel';

    if (st.previewAtlasUrl) {
      const previewBezel = document.createElement('div');
      previewBezel.className = 'holo-preview-bezel';
      previewBezel.dataset.stationId = st.id;

      const previewHeader = document.createElement('div');
      previewHeader.className = 'holo-preview-header';
      const sourceLabel = document.createElement('span');
      sourceLabel.className = 'holo-preview-source-label';
      sourceLabel.textContent = `HOLO.PREVIEW // ${st.previewSourceLabel || st.mountName}`;
      const frameBadge = document.createElement('span');
      frameBadge.className = 'holo-preview-frame-badge';
      frameBadge.dataset.role = 'frame-badge';
      frameBadge.textContent = 'FRAME 01 / 04';
      previewHeader.appendChild(sourceLabel);
      previewHeader.appendChild(frameBadge);
      previewBezel.appendChild(previewHeader);

      const mainStage = document.createElement('div');
      mainStage.className = 'holo-preview-main-stage';
      mainStage.dataset.role = 'preview-stage';
      mainStage.dataset.activeFrame = '0';
      mainStage.style.backgroundImage = `url('${st.previewAtlasUrl}')`;
      mainStage.style.backgroundPosition = '0% 0%';
      mainStage.title = 'Click to step through 4 live-demo hologram capture frames';

      const captionBar = document.createElement('div');
      captionBar.className = 'holo-preview-caption-bar';
      captionBar.dataset.role = 'preview-caption';
      captionBar.textContent =
        (Array.isArray(st.previewFrameCaptions) && st.previewFrameCaptions[0]) ||
        `${st.code} // LIVE PREVIEW`;
      mainStage.appendChild(captionBar);

      mainStage.addEventListener('click', (e) => {
        e.stopPropagation();
        const curIdx = _holoPreviewActiveFrameByStationId.get(st.id) || 0;
        setHoloSlidePreviewFrame(slideEl, st, curIdx + 1);
      });
      previewBezel.appendChild(mainStage);

      const quadGrid = document.createElement('div');
      quadGrid.className = 'holo-preview-quad-grid';
      quadGrid.setAttribute('role', 'group');
      quadGrid.setAttribute('aria-label', `${st.title} 4-Frame Hologram Preview Selector`);

      for (let q = 0; q < 4; q++) {
        const quadBtn = document.createElement('button');
        quadBtn.type = 'button';
        quadBtn.className = `holo-preview-quad-btn${q === 0 ? ' active-quad' : ''}`;
        quadBtn.dataset.frameIndex = String(q);
        quadBtn.style.backgroundImage = `url('${st.previewAtlasUrl}')`;
        quadBtn.style.backgroundPosition = HOLO_PREVIEW_QUAD_BG_POSITIONS[q];
        quadBtn.setAttribute('aria-pressed', q === 0 ? 'true' : 'false');
        const capText =
          (Array.isArray(st.previewFrameCaptions) && st.previewFrameCaptions[q]) ||
          `Frame 0${q + 1}`;
        quadBtn.title = capText;
        quadBtn.setAttribute('aria-label', capText);

        const idxChip = document.createElement('span');
        idxChip.className = 'quad-idx';
        idxChip.textContent = `F0${q + 1}`;
        quadBtn.appendChild(idxChip);

        quadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          setHoloSlidePreviewFrame(slideEl, st, q);
        });
        quadGrid.appendChild(quadBtn);
      }
      previewBezel.appendChild(quadGrid);
      visualPanel.appendChild(previewBezel);
    }

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'holo-metrics-grid';
    for (const m of st.metrics) {
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
      metricsGrid.appendChild(box);
    }
    visualPanel.appendChild(metricsGrid);

    const hasPrimary = Boolean(st.primaryLink && st.primaryLink.url);
    const hasSecondary = Boolean(st.secondaryLink && st.secondaryLink.url);
    if (hasPrimary || hasSecondary) {
      const ctaStack = document.createElement('div');
      ctaStack.className = 'holo-cta-stack';

      if (hasPrimary) {
        const primaryA = document.createElement('a');
        primaryA.className = 'holo-link-btn';
        primaryA.href = st.primaryLink.url;
        primaryA.target = '_blank';
        primaryA.rel = 'noopener noreferrer';
        const pSpan = document.createElement('span');
        pSpan.textContent = st.primaryLink.label;
        const pArrow = document.createElement('span');
        pArrow.setAttribute('aria-hidden', 'true');
        pArrow.textContent = '↗';
        primaryA.appendChild(pSpan);
        primaryA.appendChild(pArrow);
        ctaStack.appendChild(primaryA);
      }

      if (hasSecondary) {
        const secondaryA = document.createElement('a');
        secondaryA.className = 'holo-link-btn secondary';
        secondaryA.href = st.secondaryLink.url;
        if (st.secondaryLink.action) {
          secondaryA.dataset.holoAction = st.secondaryLink.action;
        } else {
          secondaryA.target = '_blank';
          secondaryA.rel = 'noopener noreferrer';
        }
        const sSpan = document.createElement('span');
        sSpan.textContent = st.secondaryLink.label;
        const sArrow = document.createElement('span');
        sArrow.setAttribute('aria-hidden', 'true');
        sArrow.textContent = '↗';
        secondaryA.appendChild(sSpan);
        secondaryA.appendChild(sArrow);

        secondaryA.addEventListener('click', (e) => {
          if (
            st.secondaryLink.action === 'open-whitepaper-column' ||
            st.secondaryLink.url === '#ssm-whitepaper-column'
          ) {
            e.preventDefault();
            e.stopPropagation();
            sandbox.openWhitepaperHologramColumn();
          }
        });
        ctaStack.appendChild(secondaryA);
      }

      visualPanel.appendChild(ctaStack);
    }

    slideEl.appendChild(mainCol);
    slideEl.appendChild(visualPanel);
    trackEl.appendChild(slideEl);
  });

  if (!trackEl._holoWorksListenersBound) {
    trackEl._holoWorksListenersBound = true;

    trackEl.addEventListener(
      'scroll',
      () => {
        syncHoloCustomScrollbar();
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (now < _programmaticHoloTrackScrollUntil) return;
        if (_holoTrackScrollSettleTimer) {
          clearTimeout(_holoTrackScrollSettleTimer);
        }
        _holoTrackScrollSettleTimer = setTimeout(() => {
          _holoTrackScrollSettleTimer = null;
          const slides = Array.from(trackEl.querySelectorAll('.holo-work-slide'));
          if (slides.length === 0) return;
          const trackRect = trackEl.getBoundingClientRect();
          const anchorY = trackRect.top + Math.min(140, trackRect.height * 0.30);
          let bestIdx = 0;
          let bestDist = Infinity;
          slides.forEach((sEl, sIdx) => {
            const r = sEl.getBoundingClientRect();
            const dist = Math.abs(r.top - anchorY);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = sIdx;
            }
          });
          const targetSt = HOLO_PROJECT_STATIONS[bestIdx];
          if (!targetSt) return;
          const curActive = sandbox.activeHoloProject;
          if (!curActive || curActive.id !== targetSt.id) {
            _suppressNextTrackScrollSync = true;
            if (sandbox.mode === 'mount-focus' || sandbox.mode === 'freeroam') {
              sandbox.focusWallMount(targetSt.mountName);
            } else {
              sandbox.scrollToProjectStation(targetSt.index);
            }
          }
        }, 80);
      },
      { passive: true }
    );

    trackEl.addEventListener(
      'wheel',
      (e) => {
        if (sandbox.mode === 'mount-focus') {
          e.stopPropagation();
        }
      },
      { passive: true }
    );
  }
}

function updateHolographicPopupUI() {
  const winEl = document.getElementById('holo-popup-window');
  if (!winEl) return;

  const isMountFocus = sandbox.mode === 'mount-focus' && Boolean(sandbox.focusedMount);
  const activeStation = getActiveHoloStationForProgress(sandbox.scrollProgress, sandbox.mode);
  sandbox.activeHoloProject = activeStation;

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('mount-focus-mode', isMountFocus);
  }
  winEl.classList.toggle('mount-focus-active', isMountFocus);

  if (!activeStation || sandbox.whitepaperColumnOpen) {
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

  const wasActiveWindow = winEl.classList.contains('active');
  const prevStationId = lastRenderedHoloStationId;

  if (
    lastRenderedHoloStationId !== activeStation.id ||
    lastRenderedHoloMode !== sandbox.mode
  ) {
    const stationChanged = lastRenderedHoloStationId !== activeStation.id;
    lastRenderedHoloStationId = activeStation.id;
    lastRenderedHoloMode = sandbox.mode;

    const bodyGridEl = document.getElementById('holo-body-scroll-viewport') || winEl.querySelector('.holo-body-grid');
    if (bodyGridEl && stationChanged) {
      bodyGridEl.scrollTop = 0;
    }
    if (stationChanged) {
      setActiveHoloTagPopup(activeStation, null, { triggerAnimation: false });
    }

    const counterEl = document.getElementById('holo-station-counter');
    const titleEl = document.getElementById('holo-title');
    const descEl = document.getElementById('holo-description');
    const narrativeBoxEl = document.getElementById('holo-narrative-callout');
    const narrativeHeadingEl = document.getElementById('holo-narrative-heading');
    const narrativeBodyEl = document.getElementById('holo-narrative-body');
    const tagsEl = document.getElementById('holo-tags');
    const metricsEl = document.getElementById('holo-metrics');
    const ctaStackEl = document.querySelector('#holo-body-scroll-viewport .holo-cta-stack');
    const primaryLinkEl = document.getElementById('holo-primary-link');
    const primaryTextEl = document.getElementById('holo-primary-link-text');
    const secondaryLinkEl = document.getElementById('holo-secondary-link');
    const secondaryTextEl = document.getElementById('holo-secondary-link-text');

    if (counterEl) {
      counterEl.textContent = `WORK ${activeStation.code} / 0${HOLO_PROJECT_STATIONS.length}`;
    }
    if (titleEl) titleEl.textContent = activeStation.title;
    if (descEl) descEl.textContent = activeStation.description;

    if (_suppressNextTrackScrollSync) {
      _suppressNextTrackScrollSync = false;
      const pipsContainer = document.getElementById('holo-station-pips');
      if (pipsContainer) {
        pipsContainer.querySelectorAll('.holo-station-pip-btn').forEach((pip) => {
          const isMatch = Number(pip.dataset.stationIndex) === Number(activeStation.index);
          pip.classList.toggle('active', isMatch);
          pip.setAttribute('aria-current', isMatch ? 'step' : 'false');
        });
      }
      const trackEl = document.getElementById('holo-works-horizontal-track');
      if (trackEl) {
        trackEl.querySelectorAll('.holo-work-slide').forEach((el) => {
          const isMatch = Number(el.dataset.stationIndex) === Number(activeStation.index);
          el.classList.toggle('active-slide', isMatch);
          el.setAttribute('aria-hidden', 'false');
        });
      }
    } else {
      scrollHoloWorksTrackToStation(activeStation.index, {
        smooth: wasActiveWindow && stationChanged,
      });
    }

    if (narrativeBoxEl) {
      if (
        activeStation.narrativeCallout &&
        typeof activeStation.narrativeCallout.body === 'string' &&
        activeStation.narrativeCallout.body.trim().length > 0
      ) {
        if (narrativeHeadingEl) {
          narrativeHeadingEl.textContent =
            activeStation.narrativeCallout.heading || 'What the hell does this mean, Luis?';
        }
        if (narrativeBodyEl) {
          narrativeBodyEl.textContent = activeStation.narrativeCallout.body;
        }
        narrativeBoxEl.style.display = 'flex';
      } else {
        if (narrativeHeadingEl) narrativeHeadingEl.textContent = '';
        if (narrativeBodyEl) narrativeBodyEl.textContent = '';
        narrativeBoxEl.style.display = 'none';
      }
    }

    if (tagsEl) {
      tagsEl.innerHTML = '';
      activeStation.tags.forEach((tag, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'holo-tag';
        btn.dataset.holoInteractive = `tag-${idx}`;
        btn.dataset.tagIndex = String(idx);
        btn.dataset.tagLabel = tag;
        btn.dataset.tagName = tag;
        btn.setAttribute('aria-expanded', 'false');

        const labelSpan = document.createElement('span');
        labelSpan.className = 'holo-tag-label';
        labelSpan.textContent = tag;

        const plusSpan = document.createElement('span');
        plusSpan.className = 'holo-tag-plus-bubble';
        plusSpan.setAttribute('aria-hidden', 'true');
        plusSpan.textContent = '+';

        btn.appendChild(labelSpan);
        btn.appendChild(plusSpan);

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (sandbox.audio) {
            sandbox.audio.trigger('onUpdate', {
              source: 'holo-tag-click',
              stationId: activeStation.id,
              tag,
            });
          }
          const isAlreadyActive =
            activeHoloTagState.stationId === activeStation.id &&
            activeHoloTagState.tagLabel === tag;
          if (isAlreadyActive) {
            setActiveHoloTagPopup(activeStation, null, { triggerAnimation: false });
          } else {
            setActiveHoloTagPopup(activeStation, tag, { triggerAnimation: true });
          }
        });

        tagsEl.appendChild(btn);
      });
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

    const hasPrimary = Boolean(activeStation.primaryLink && activeStation.primaryLink.url);
    const hasSecondary = Boolean(activeStation.secondaryLink && activeStation.secondaryLink.url);

    if (primaryLinkEl) {
      if (hasPrimary) {
        primaryLinkEl.href = activeStation.primaryLink.url;
        primaryLinkEl.style.display = '';
      } else {
        primaryLinkEl.removeAttribute('href');
        primaryLinkEl.style.display = 'none';
      }
    }
    if (primaryTextEl) {
      primaryTextEl.textContent = hasPrimary ? activeStation.primaryLink.label : '';
    }

    if (secondaryLinkEl) {
      if (hasSecondary) {
        secondaryLinkEl.href = activeStation.secondaryLink.url;
        secondaryLinkEl.style.display = '';
        if (activeStation.secondaryLink.action) {
          secondaryLinkEl.dataset.holoAction = activeStation.secondaryLink.action;
          secondaryLinkEl.removeAttribute('target');
        } else {
          delete secondaryLinkEl.dataset.holoAction;
          secondaryLinkEl.setAttribute('target', '_blank');
        }
      } else {
        secondaryLinkEl.removeAttribute('href');
        delete secondaryLinkEl.dataset.holoAction;
        secondaryLinkEl.style.display = 'none';
      }
    }
    if (secondaryTextEl) {
      secondaryTextEl.textContent = hasSecondary ? activeStation.secondaryLink.label : '';
    }
    if (ctaStackEl) {
      ctaStackEl.style.display = hasPrimary || hasSecondary ? 'flex' : 'none';
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
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollHoloWorksTrackToStation(activeStation.index, { smooth: false });
      });
    }
    if (sandbox.audio) {
      sandbox.audio.trigger('onActivate', {
        stationId: activeStation.id,
        mode: sandbox.mode,
      });
    }
  }

  syncHoloCustomScrollbar();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(syncHoloCustomScrollbar);
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
  updatePortalGameHoloPopupUI();
}

function getActivePortalGameCatalog() {
  const rawList =
    sandbox.waterColor && Array.isArray(sandbox.waterColor.availableGames) && sandbox.waterColor.availableGames.length > 0
      ? sandbox.waterColor.availableGames
      : Array.isArray(sandbox.portalGameCatalog) && sandbox.portalGameCatalog.length > 0
      ? sandbox.portalGameCatalog
      : PORTAL_GAME_CATALOG;
  return rawList.map((g, idx) => normalizePortalGameEntry(g, idx));
}

const PORTAL_HOLO_OPEN_DURATION_MS = 320;
const PORTAL_HOLO_CLOSE_DURATION_MS = 240;
let _portalPopupAnimTimer = null;

function cancelPortalPopupAnimTimer() {
  if (_portalPopupAnimTimer !== null) {
    clearTimeout(_portalPopupAnimTimer);
    _portalPopupAnimTimer = null;
  }
}

function applyPortalPopupLifecycleDOM(state) {
  if (typeof document === 'undefined') return;
  const stageEl = document.getElementById('portal-game-holo-stage');
  const winEl = document.getElementById('portal-game-holo-window');
  if (!stageEl || !winEl) return;

  const isActive = state === 'opening' || state === 'open';
  const isOpening = state === 'opening';
  const isOpen = state === 'open';
  const isClosing = state === 'closing';

  stageEl.setAttribute('data-holo-state', state);
  winEl.setAttribute('data-holo-state', state);

  stageEl.classList.toggle('active', isActive);
  stageEl.classList.toggle('holo-opening', isOpening);
  stageEl.classList.toggle('holo-open', isOpen);
  stageEl.classList.toggle('holo-closing', isClosing);
  stageEl.setAttribute('aria-hidden', isActive ? 'false' : 'true');

  winEl.classList.toggle('active', isActive);
  winEl.classList.toggle('mount-focus-active', isActive || isClosing);
  winEl.classList.toggle('holo-opening', isOpening);
  winEl.classList.toggle('holo-open', isOpen);
  winEl.classList.toggle('holo-closing', isClosing);

  winEl.querySelectorAll('.holo-light-bar').forEach((bar) => {
    bar.classList.toggle('ignited', isActive);
  });
}

function startPortalPopupOpenAnimation({ immediate = false } = {}) {
  cancelPortalPopupAnimTimer();
  if (immediate) {
    sandbox.portalPopupAnimState = 'open';
    if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
      sandbox.waterColor.setPopupAnimState('open');
    }
    applyPortalPopupLifecycleDOM('open');
    return;
  }
  sandbox.portalPopupAnimState = 'opening';
  if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
    sandbox.waterColor.setPopupAnimState('opening');
  }
  applyPortalPopupLifecycleDOM('opening');
  _portalPopupAnimTimer = setTimeout(() => {
    _portalPopupAnimTimer = null;
    if (sandbox.isPortalPopupOpen && sandbox.waterColor && sandbox.waterColor.isPopupOpen) {
      sandbox.portalPopupAnimState = 'open';
      if (typeof sandbox.waterColor.setPopupAnimState === 'function') {
        sandbox.waterColor.setPopupAnimState('open');
      }
      applyPortalPopupLifecycleDOM('open');
    }
  }, PORTAL_HOLO_OPEN_DURATION_MS);
}

function startPortalPopupCloseAnimation({ immediate = false } = {}) {
  cancelPortalPopupAnimTimer();
  if (immediate || sandbox.portalPopupAnimState === 'dormant') {
    sandbox.portalPopupAnimState = 'dormant';
    if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
      sandbox.waterColor.setPopupAnimState('dormant');
    }
    applyPortalPopupLifecycleDOM('dormant');
    return;
  }
  sandbox.portalPopupAnimState = 'closing';
  if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
    sandbox.waterColor.setPopupAnimState('closing');
  }
  applyPortalPopupLifecycleDOM('closing');
  _portalPopupAnimTimer = setTimeout(() => {
    _portalPopupAnimTimer = null;
    if (!sandbox.isPortalPopupOpen) {
      sandbox.portalPopupAnimState = 'dormant';
      if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
        sandbox.waterColor.setPopupAnimState('dormant');
      }
      applyPortalPopupLifecycleDOM('dormant');
    }
  }, PORTAL_HOLO_CLOSE_DURATION_MS);
}

let _portalGameImagesHydrated = false;
function hydratePortalGameStageImages(stageEl) {
  if (_portalGameImagesHydrated || !stageEl) return;
  _portalGameImagesHydrated = true;
  const deferredImgs = Array.from(stageEl.querySelectorAll('img[data-src]'));
  runBoundedTaskPool(
    deferredImgs.map((imgEl) => async () => {
      const targetUrl = imgEl.getAttribute('data-src');
      if (!targetUrl) return;
      try {
        const buf = await fetchRangeChunkedArrayBuffer(targetUrl, { chunkSize: 786432 });
        imgEl.src = URL.createObjectURL(new Blob([buf], { type: 'image/png' }));
      } catch (_err) {
        imgEl.src = targetUrl;
      }
    }),
    2
  ).catch(() => {});
}

function syncPortalGamePopupDOM() {
  if (typeof document === 'undefined') return;
  const stageEl = document.getElementById('portal-game-holo-stage');
  const winEl = document.getElementById('portal-game-holo-window');
  const gridEl = document.getElementById('portal-game-cards-grid');
  if (!stageEl || !winEl) return;

  const catalog = getActivePortalGameCatalog();
  const isOpen = Boolean(sandbox.isPortalPopupOpen && sandbox.waterColor && sandbox.waterColor.isPopupOpen);
  if (isOpen) {
    hydratePortalGameStageImages(stageEl);
  }
  const rawSelectedId = (sandbox.waterColor && sandbox.waterColor.selectedGameId) || catalog[0]?.id || 'skate3';
  const resolvedSelected = resolvePortalGameSpec(rawSelectedId, catalog) || catalog[0];
  const selectedId = resolvedSelected ? resolvedSelected.id : 'skate3';

  if (isOpen) {
    if (sandbox.portalPopupAnimState !== 'opening' && sandbox.portalPopupAnimState !== 'open') {
      sandbox.portalPopupAnimState = 'open';
      if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
        sandbox.waterColor.setPopupAnimState('open');
      }
    }
    applyPortalPopupLifecycleDOM(sandbox.portalPopupAnimState);
  } else if (sandbox.portalPopupAnimState === 'closing') {
    applyPortalPopupLifecycleDOM('closing');
  } else {
    sandbox.portalPopupAnimState = 'dormant';
    if (sandbox.waterColor && typeof sandbox.waterColor.setPopupAnimState === 'function') {
      sandbox.waterColor.setPopupAnimState('dormant');
    }
    applyPortalPopupLifecycleDOM('dormant');
  }

  if (gridEl) {
    const existingCards = Array.from(gridEl.querySelectorAll('.portal-game-card'));
    const catalogMatchesDOM =
      existingCards.length === catalog.length &&
      existingCards.every((card, idx) => {
        const g = catalog[idx];
        const hasOnlyLogo =
          card.children.length === 1 &&
          card.firstElementChild &&
          card.firstElementChild.classList.contains('portal-game-logo-img');
        return card.getAttribute('data-game-id') === g.id && hasOnlyLogo;
      });

    if (!catalogMatchesDOM) {
      gridEl.replaceChildren();
      catalog.forEach((game, idx) => {
        const card = document.createElement('div');
        card.id = `portal-game-card-${game.id}`;
        card.className = 'portal-game-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-game-id', game.id);
        card.setAttribute('data-game-slot', String(game.slot));
        card.setAttribute('data-target-url', game.targetUrl);
        card.style.setProperty('--card-stagger-idx', String(idx));
        card.setAttribute('aria-label', `Launch ${game.title} (Key ${game.hotkey})`);

        const img = document.createElement('img');
        img.id = `portal-game-logo-${game.id}`;
        img.className = 'portal-game-logo-img';
        img.src = game.logoUrl;
        img.alt = `${game.title} Logo`;
        img.width = game.width || 960;
        img.height = game.height || 774;
        img.loading = 'eager';
        img.decoding = 'sync';

        card.appendChild(img);
        gridEl.appendChild(card);
      });
    }

    const vpW = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1440;
    const vpH = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 900;
    const meanAspect =
      catalog.reduce((sum, g) => sum + (Number(g.aspectRatio) || 1.24), 0) / Math.max(1, catalog.length);

    const layout = solvePortalGameGridLayout({
      count: catalog.length,
      viewportWidth: vpW,
      viewportHeight: vpH,
      referenceAspect: meanAspect,
    });
    sandbox.portalGridLayout = layout;

    stageEl.style.setProperty('--portal-stage-pad', `${layout.stagePadding}px`);
    winEl.style.setProperty('--portal-win-pad-x', `${layout.winPaddingX}px`);
    winEl.style.setProperty('--portal-win-pad-y', `${layout.winPaddingY}px`);
    winEl.style.setProperty('--portal-header-h', `${layout.headerHeight}px`);
    winEl.style.setProperty('--portal-chrome-gap', `${layout.chromeGap}px`);
    gridEl.style.setProperty('--portal-grid-gap', `${layout.gap}px`);
    gridEl.style.setProperty('--portal-grid-w', `${layout.gridWidth}px`);
    gridEl.style.setProperty('--portal-cell-w', `${layout.cellWidth}px`);
    gridEl.style.setProperty('--portal-cell-h', `${layout.cellHeight}px`);
    gridEl.style.setProperty('--portal-cell-pad', `${layout.cellPadding}px`);
    gridEl.setAttribute('data-grid-cols', String(layout.columns));
    gridEl.setAttribute('data-grid-rows', String(layout.rows));

    const headerImg = document.getElementById('portal-header-logo-img');
    if (headerImg) {
      const hLogoH = Math.max(32, layout.headerHeight - 8);
      const hLogoW = Math.min(Math.max(94, layout.stageWidth - 76), Math.round(hLogoH * (1120 / 381)));
      headerImg.style.width = `${hLogoW}px`;
      headerImg.style.height = `${Math.round(hLogoW * (381 / 1120))}px`;
    }

    const innerBoxW = Math.max(20, layout.cellWidth - layout.cellPadding * 2 - 3);
    const innerBoxH = Math.max(16, layout.cellHeight - layout.cellPadding * 2 - 3);

    gridEl.querySelectorAll('.portal-game-card').forEach((card, idx) => {
      const cardGameId = card.getAttribute('data-game-id');
      const isSel = cardGameId === selectedId;
      card.style.setProperty('--card-stagger-idx', String(idx));
      card.classList.toggle('selected', isSel);
      card.setAttribute('aria-selected', isSel ? 'true' : 'false');

      const img = card.querySelector('.portal-game-logo-img');
      if (img) {
        const gameSpec = resolvePortalGameSpec(cardGameId, catalog) || catalog[idx];
        const ar =
          img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
            ? img.naturalWidth / img.naturalHeight
            : (gameSpec && Number(gameSpec.aspectRatio)) || 1.24;
        let imgW = innerBoxW;
        let imgH = innerBoxW / ar;
        if (imgH > innerBoxH) {
          imgH = innerBoxH;
          imgW = innerBoxH * ar;
        }
        img.style.width = `${imgW.toFixed(2)}px`;
        img.style.height = `${imgH.toFixed(2)}px`;
      }
    });
  }

  const footerStatusEl = document.getElementById('portal-holo-footer-status');
  if (footerStatusEl) {
    const selSpec = resolvePortalGameSpec(selectedId, catalog);
    if (selSpec) {
      footerStatusEl.textContent = `SELECTED: ${selSpec.title} (KEY [${selSpec.hotkey}]) // CLICK LOGO OR PRESS ENTER TO LAUNCH • ESC TO RETURN`;
    }
  }
}

function updatePortalGameHoloPopupUI(clampedDt = 1 / 60) {
  if (typeof document === 'undefined') return;
  const winEl = document.getElementById('portal-game-holo-window');
  if (!winEl) return;

  if (sandbox.portalGlitchBoostRemainingSec > 0) {
    sandbox.portalGlitchBoostRemainingSec = Math.max(
      0.0,
      sandbox.portalGlitchBoostRemainingSec - clampedDt
    );
  }

  const isOpen = Boolean(sandbox.isPortalPopupOpen && sandbox.waterColor && sandbox.waterColor.isPopupOpen);
  if (!isOpen) {
    if (winEl.classList.contains('active')) {
      syncPortalGamePopupDOM();
    }
    if (sandbox.portalPopupAnimState !== 'closing') {
      return;
    }
  } else if (!winEl.classList.contains('active')) {
    syncPortalGamePopupDOM();
  }

  const boost = sandbox.portalGlitchBoostRemainingSec > 0 ? 1.0 : 0.0;
  const flk = evaluateHologramScreenFlickerAndGlitch(
    holoShaderUniforms.uHoloTime.value,
    6,
    boost
  );
  winEl.style.setProperty('--holo-flicker-gain', String(flk.flickerGain));
  winEl.style.setProperty('--holo-glitch-shift-x', `${(flk.tearOffsetUvX * 14).toFixed(1)}px`);
  winEl.classList.toggle('holo-glitch-active', flk.glitchIntensity > 0.05);
}

function enterFreeRoamMode() {
  if (sandbox.mode === 'freeroam') return;
  if (sandbox.sceneMaterialization && !sandbox.sceneMaterialization.resolved) {
    sandbox.sceneMaterialization.accelerateToResolved();
  }
  sandbox.mode = 'freeroam';
  sandbox.isMountFocused = false;
  sandbox.focusedMount = null;
  mountFocusCameraState.active = false;
  mountFocusCameraState.returningToOrbit = false;

  sandbox.scrollProgress = 1.0;
  sandbox.targetScrollProgress = 1.0;
  sandbox.scrollVelocity = 0.0;

  document.body.classList.add('freeroam-mode');
  document.body.classList.remove('mount-focus-mode');

  const activeChar = sandbox.getActiveCharacter();
  const hasInput =
    keysPressed.KeyW ||
    keysPressed.KeyA ||
    keysPressed.KeyS ||
    keysPressed.KeyD ||
    keysPressed.ArrowUp ||
    keysPressed.ArrowLeft ||
    keysPressed.ArrowDown ||
    keysPressed.ArrowRight ||
    Boolean(mobileTouch && mobileTouch.magnitude >= THUMBPAD_DEADZONE);

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
  mp3Player: null,
  lastRadialAction: null,
  mode: 'scroll', // 'scroll' (Scroll-Walk Mode) | 'freeroam' (Interactive Free-Roam Mode) | 'mount-focus' (Mount Focus Mode)
  isMountFocused: false,
  focusedMount: null,
  whitepaperColumnOpen: false,
  whitepaperHoloColumn: null,
  proximityMount: null,
  hoveredMount: null,
  scrollProgress: 0.0,
  targetScrollProgress: 0.0,
  scrollVelocity: 0.0,
  holoStations: HOLO_PROJECT_STATIONS,
  holoTagDescriptions: HOLO_TAG_DESCRIPTIONS,
  activeHoloProject: null,
  syncHoloCustomScrollbar,
  setActiveHoloTagPopup,
  entranceHologram: null,
  entranceHologramGroup: entranceHologramRootGroup,
  mathPodsGroup: mathPodsRootGroup,
  mathPods: null,
  hoveredMathPod: null,
  draggedMathPod: null,
  isPopupFocused: false,
  focusedMathPodPopupId: null,
  hoveredMathPodPopupId: null,
  waterColorGroup: watercolorRootGroup,
  skyboxGroup: watercolorRootGroup,
  waterColor: null,
  skybox: null,
  crtPass: crtOpticalPassSystem ? crtOpticalPassSystem.crtPass : null,
  crtOpticalPass: crtOpticalPassSystem,
  crtOpticalPassSpec: CRT_OPTICAL_PASS_SPEC,
  getCRTOpticalPassState() {
    return crtOpticalPassSystem.getState();
  },
  setCRTOpticalPassEnabled(val) {
    return crtOpticalPassSystem.setEnabled(val);
  },
  isPortalPopupOpen: false,
  portalPopupAnimState: 'dormant',
  portalOpenDurationMs: PORTAL_HOLO_OPEN_DURATION_MS,
  portalCloseDurationMs: PORTAL_HOLO_CLOSE_DURATION_MS,
  portalGlitchBoostRemainingSec: 0.0,
  portalGameCatalog: PORTAL_GAME_CATALOG,
  portalHeaderLogoSpec: PORTAL_HEADER_LOGO_SPEC,
  portalGridLayout: null,
  setPortalGameCatalog(nextList) {
    const normalized =
      Array.isArray(nextList) && nextList.length > 0
        ? Object.freeze(nextList.map((g, idx) => normalizePortalGameEntry(g, idx)))
        : PORTAL_GAME_CATALOG;
    this.portalGameCatalog = normalized;
    if (this.waterColor && typeof this.waterColor.setAvailableGames === 'function') {
      this.waterColor.setAvailableGames(normalized);
    }
    syncPortalGamePopupDOM();
    return normalized;
  },
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
      if (this.director && this.director.editMode) {
        this.director.editMode = false;
        this.director.rootGroup.visible = false;
        syncDirectorHUDInputs();
      }
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
    } else if (this.transformControls && !this.holoEditMode && !(this.director && this.director.editMode)) {
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
  characterCamera: {
    getState() {
      return sanitizeCharacterCameraPayload(characterCameraState, DEFAULT_CHARACTER_CAMERA);
    },
    setState(partial, options = {}) {
      return sandbox.setCharacterCameraState(partial, options);
    },
    resetDefaults(persist = true) {
      return sandbox.resetCharacterCameraToDefault(persist);
    },
    applyPreset(presetKey, persist = true) {
      return sandbox.applyCharacterCameraPreset(presetKey, persist);
    },
    captureCurrentOrbit(persist = true) {
      return sandbox.captureCharacterCameraFromCurrentOrbit(persist);
    },
    saveToStorage(persistBackend = true) {
      return sandbox.saveCharacterCameraState(persistBackend);
    },
    togglePanel(forceOpen = null) {
      return sandbox.toggleCharacterCameraPanel(forceOpen);
    },
    togglePositioningMode(forceActive = null) {
      return sandbox.toggleCharacterCameraPositioningMode(forceActive);
    },
    exportJSON() {
      return sandbox.exportCharacterCameraJSON();
    },
  },
  getCharacterCameraState() {
    return sanitizeCharacterCameraPayload(characterCameraState, DEFAULT_CHARACTER_CAMERA);
  },
  setCharacterCameraState(
    partial,
    { persist = true, persistLocal = true, persistBackend = true, updatedAtMs = Date.now(), syncHUD = true } = {}
  ) {
    const merged = sanitizeCharacterCameraPayload({ ...characterCameraState, ...(partial || {}) }, characterCameraState);
    characterCameraState.distance = merged.distance;
    characterCameraState.pivotHeightY = merged.pivotHeightY;
    characterCameraState.shoulderOffsetX = merged.shoulderOffsetX;
    characterCameraState.forwardOffsetZ = merged.forwardOffsetZ;
    characterCameraState.pitchRad = merged.pitchRad;
    characterCameraState.yawOffsetRad = merged.yawOffsetRad;
    characterCameraState.fovDeg = merged.fovDeg;
    characterCameraState.wallClampEnabled = merged.wallClampEnabled;

    cameraOrbit.desiredDistance = characterCameraState.distance;
    cameraOrbit.pitch = characterCameraState.pitchRad;
    cameraOrbit.yaw = resolveCharacterAlignedCameraYaw();
    const activeChar = this.getActiveCharacter ? this.getActiveCharacter() : null;
    if (activeChar && Number.isFinite(activeChar.yaw)) {
      cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
      cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
    }
    if (camera && Math.abs(camera.fov - characterCameraState.fovDeg) > 1e-3) {
      camera.fov = characterCameraState.fovDeg;
      camera.updateProjectionMatrix();
    }

    if (persist) {
      this.saveCharacterCameraState(persistBackend && !this._hydratingSceneLayouts, updatedAtMs, persistLocal);
    } else if (persistLocal && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CHARACTER_CAMERA_STORAGE_KEY, JSON.stringify(this.getCharacterCameraState()));
        if (updatedAtMs > 0) {
          window.localStorage.setItem(`${CHARACTER_CAMERA_STORAGE_KEY}_ts`, String(Math.round(updatedAtMs)));
        }
      } catch (_e) {}
    }

    if (this.ready) {
      updateCameraController(0.0);
      renderer.render(scene, camera);
    }
    if (syncHUD) {
      syncCharacterCameraHUDInputs();
    }
    return this.getCharacterCameraState();
  },
  saveCharacterCameraState(persistBackend = true, updatedAtMs = Date.now(), persistLocal = true) {
    const clean = this.getCharacterCameraState();
    const ts = Number.isFinite(Number(updatedAtMs)) && Number(updatedAtMs) > 0 ? Math.round(Number(updatedAtMs)) : Date.now();
    if (persistLocal && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CHARACTER_CAMERA_STORAGE_KEY, JSON.stringify(clean));
        window.localStorage.setItem(`${CHARACTER_CAMERA_STORAGE_KEY}_ts`, String(ts));
      } catch (_e) {}
    }
    characterCameraState.lastSyncLabel = persistBackend ? 'SAVING...' : 'SAVED LOCAL';
    syncCharacterCameraHUDInputs();
    if (persistBackend && !this._hydratingSceneLayouts) {
      persistSceneLayoutRecord('character_camera', clean, ts)
        .then((res) => {
          characterCameraState.lastSyncLabel = res ? 'SAVED DB ✓' : 'LOCAL ONLY';
          syncCharacterCameraHUDInputs();
        })
        .catch(() => {
          characterCameraState.lastSyncLabel = 'LOCAL ONLY';
          syncCharacterCameraHUDInputs();
        });
    }
    return clean;
  },
  resetCharacterCameraToDefault(persist = true) {
    cameraOrbit.userLookOverride = false;
    return this.setCharacterCameraState(DEFAULT_CHARACTER_CAMERA, {
      persist,
      persistLocal: true,
      persistBackend: persist,
      syncHUD: true,
    });
  },
  applyCharacterCameraPreset(presetKey, persist = true) {
    const preset = CHARACTER_CAMERA_PRESETS[presetKey] || DEFAULT_CHARACTER_CAMERA;
    this.ensureCharacterFollowCameraPreviewActive();
    return this.setCharacterCameraState(preset, {
      persist,
      persistLocal: true,
      persistBackend: persist,
      syncHUD: true,
    });
  },
  captureCharacterCameraFromCurrentOrbit(persist = true) {
    const activeChar = this.getActiveCharacter ? this.getActiveCharacter() : null;
    const baseYaw = activeChar && Number.isFinite(activeChar.yaw) ? activeChar.yaw : 0.0;
    return this.setCharacterCameraState(
      {
        distance: cameraOrbit.desiredDistance,
        pitchRad: cameraOrbit.pitch,
        yawOffsetRad: wrapAngleRad(cameraOrbit.yaw - baseYaw),
        fovDeg: camera ? camera.fov : characterCameraState.fovDeg,
      },
      { persist, persistLocal: true, persistBackend: persist, syncHUD: true }
    );
  },
  ensureCharacterFollowCameraPreviewActive() {
    if (!this.ready) return;
    if (this.director) {
      if (this.director.cameraPanState && this.director.cameraPanState.playing) {
        this.director.stopStartupPan(true);
      }
      if (this.director.cameraPanState && this.director.cameraPanState.mode === 'settled') {
        this.director.cameraPanState.mode = 'orbit';
      }
      if (this.director.introSequenceState && this.director.introSequenceState.scrollLocked) {
        this.director.introSequenceState.scrollLocked = false;
        this.director.introSequenceState.phase = 'scrolling-alley';
        syncIntroDialogueOverlayUI();
      }
      syncDirectorHUDInputs();
    }
    if (this.mode === 'scroll' && this.scrollProgress < 0.08) {
      this.setScrollProgress(0.10, { smooth: false });
    }
  },
  toggleCharacterCameraPanel(forceOpen = null) {
    const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !characterCameraState.panelOpen;
    characterCameraState.panelOpen = nextOpen;
    if (nextOpen) {
      this.ensureCharacterFollowCameraPreviewActive();
      characterCameraState.positioningMode = true;
    } else {
      characterCameraState.positioningMode = false;
      characterCameraState.isPanningOffset = false;
    }
    if (this.ready) {
      updateCameraController(0.0);
      renderer.render(scene, camera);
    }
    syncCharacterCameraHUDInputs();
    return characterCameraState.panelOpen;
  },
  toggleCharacterCameraPositioningMode(forceActive = null) {
    const nextActive = typeof forceActive === 'boolean' ? forceActive : !characterCameraState.positioningMode;
    characterCameraState.positioningMode = nextActive;
    characterCameraState.isPanningOffset = false;
    if (nextActive) {
      characterCameraState.panelOpen = true;
      this.ensureCharacterFollowCameraPreviewActive();
    }
    if (this.ready) {
      updateCameraController(0.0);
      renderer.render(scene, camera);
    }
    syncCharacterCameraHUDInputs();
    return characterCameraState.positioningMode;
  },
  exportCharacterCameraJSON() {
    return JSON.stringify(this.getCharacterCameraState(), null, 2);
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
  selectedHoloColumnId: 'holo_slide_carousel',
  hoveredHoloColumnId: null,
  holoEditMode: false,
  holoGizmoMode: 'translate',
  transformControls: null,
  transformControlsHelper: null,
  getHologramColumn(idOrIndex) {
    return this.hologramColumns ? this.hologramColumns.getColumn(idOrIndex) : null;
  },
  nextHoloSlide(idOrIndex = this.selectedHoloColumnId) {
    if (!this.hologramColumns) return -1;
    const idx = this.hologramColumns.nextSlide(idOrIndex);
    syncHoloEditorHUDInputs();
    if (this.audio) {
      this.audio.trigger('onUpdate', { target: idOrIndex, source: 'holo-carousel-next' });
    }
    return idx;
  },
  prevHoloSlide(idOrIndex = this.selectedHoloColumnId) {
    if (!this.hologramColumns) return -1;
    const idx = this.hologramColumns.prevSlide(idOrIndex);
    syncHoloEditorHUDInputs();
    if (this.audio) {
      this.audio.trigger('onUpdate', { target: idOrIndex, source: 'holo-carousel-prev' });
    }
    return idx;
  },
  goToHoloSlide(idOrIndex = this.selectedHoloColumnId, slideIdx = 0) {
    if (!this.hologramColumns) return -1;
    const idx = this.hologramColumns.goToSlide(idOrIndex, slideIdx);
    syncHoloEditorHUDInputs();
    return idx;
  },
  addSlideToHoloColumn(idOrIndex = this.selectedHoloColumnId, slideSpec = {}) {
    if (!this.hologramColumns) return -1;
    const idx = this.hologramColumns.addSlideToColumn(idOrIndex, slideSpec);
    syncHoloEditorHUDInputs();
    return idx;
  },
  uploadHoloCarouselSlides(fileList, idOrIndex = 'holo_slide_carousel') {
    if (!this.hologramColumns || !fileList || fileList.length === 0) return [];
    const col = this.hologramColumns.getColumn(idOrIndex) || this.hologramColumns.getColumn(this.selectedHoloColumnId);
    if (!col) return [];
    const addedIndices = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file) continue;
      const isVideo =
        (file.type && file.type.startsWith('video/')) ||
        /\.(mp4|webm|mov|m4v)$/i.test(file.name || '');
      const blobUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '';
      const slideIdx = col.addSlide({
        id: `custom_slide_${Date.now()}_${i}`,
        type: isVideo ? 'video' : 'static',
        url: blobUrl,
        title: (file.name || `SLIDE ${col.slides.length + 1}`).toUpperCase(),
        subtitle: isVideo ? 'UPLOADED VIDEO STREAM' : 'UPLOADED HOLO IMAGE',
        width: isVideo ? 1280 : 1080,
        height: isVideo ? 720 : 1080,
        aspectRatio: isVideo ? 16 / 9 : 1.0,
        fps: isVideo ? 24 : null,
      });
      addedIndices.push(slideIdx);
    }
    if (addedIndices.length > 0) {
      col.goToSlide(addedIndices[0]);
      syncHoloEditorHUDInputs();
      if (this.audio) {
        this.audio.trigger('onUpdate', { target: col.id, source: 'holo-carousel-upload' });
      }
    }
    return addedIndices;
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
      if (this.transformControlsHelper) {
        this.transformControlsHelper.updateMatrixWorld(true);
      }
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
      if (this.hoveredHoloColumnId) {
        this.selectedHoloColumnId = this.hoveredHoloColumnId;
      }
      if (this.director && this.director.editMode) {
        this.director.editMode = false;
        this.director.rootGroup.visible = false;
        syncDirectorHUDInputs();
      }
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
      if (col) {
        const colTransform = col.getTransformState();
        if (colTransform && colTransform.yRel > 2.2 && cameraOrbit.pitch > -0.18) {
          cameraOrbit.pitch = -0.18;
        }
      }
      updateCameraController(1 / 60);
      if (col && this.transformControls) {
        this.selectedHoloColumnId = col.id;
        this.hologramColumns.setSelectedColumn(col.id);
        this.transformControls.enabled = true;
        this.transformControls.setMode(this.holoGizmoMode);
        this.transformControls.setSpace(this.holoGizmoMode === 'translate' ? 'world' : 'local');
        this.transformControls.attach(col.rootGroup);
        if (this.transformControlsHelper) {
          this.transformControlsHelper.updateMatrixWorld(true);
        }
      }
    } else if (this.transformControls && !this.lamppostEditMode && !(this.director && this.director.editMode)) {
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
      if (this.transformControlsHelper) {
        this.transformControlsHelper.updateMatrixWorld(true);
      }
    }
    syncHoloEditorHUDInputs();
    renderer.render(scene, camera);
    return true;
  },
  updateSelectedHoloTransform(partialTransform, persist = true) {
    if (!this.hologramColumns) return null;
    const updated = this.hologramColumns.setColumnTransform(this.selectedHoloColumnId, partialTransform, persist);
    if (this.transformControlsHelper) {
      this.transformControlsHelper.updateMatrixWorld(true);
    }
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
    const floorY = this.environment ? this.environment.floorY : 0.0;
    const targetZ = Math.max(1.5, t.z - 3.4);
    const targetX = col.id === 'villainy_inc_sign' ? t.x - CAM_SHOULDER_OFFSET_X : 0.0;
    const dx = t.x - targetX;
    const dz = Math.max(0.5, t.z - targetZ);
    const lookYaw = Math.atan2(dx, dz);
    this.teleportCharacterTo(targetX, floorY, targetZ, lookYaw);
    cameraOrbit.yaw = lookYaw * 0.65;
    const dy = t.yRel - CAM_PIVOT_HEIGHT;
    const horizDist = Math.hypot(dx, dz);
    cameraOrbit.pitch = THREE.MathUtils.clamp(-Math.atan2(dy, horizDist) * 0.85, -0.75, 0.35);
    cameraOrbit.pivotCurrent.set(targetX, floorY + CAM_PIVOT_HEIGHT, targetZ);
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
  isStickerPopupOpen: false,
  hoveredPlacedStickerId: null,
  stickerPopupState,
  stickerPopupCameraState,
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
  startStickerPlacement(stickerId = this.selectedHoloStickerId, options = {}) {
    if (!this.holographicStickers) return null;
    if (this.isDoomChatOpen) {
      this.exitDoomChatMode({ immediate: true });
    }
    this.closeStickerPopup({ immediate: true, silent: true });
    const resolvedId = STICKER_ASSET_BY_ID[stickerId] ? stickerId : this.selectedHoloStickerId || 'doom_tag';
    this.selectedHoloStickerId = resolvedId;
    const pState = this.holographicStickers.beginPlacement(resolvedId, options);
    // Prime preview ray from current pointer or viewport center so the 3D ghost preview is immediately visible
    const ndcX = pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0 ? pointerNDC.x : 0.0;
    const ndcY = pointerNDC.y >= -1.0 && pointerNDC.y <= 1.0 ? pointerNDC.y : 0.0;
    pointerRaycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    this.holographicStickers.updatePlacementPreviewFromRay(pointerRaycaster);
    if (this.audio) {
      this.audio.trigger('onUpdate', { target: resolvedId, source: 'sticker-placement-begin' });
    }
    syncStickerToolHUDInputs();
    syncStickerHoloPopupDOM();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return pState;
  },
  cancelStickerPlacement() {
    if (!this.holographicStickers) return false;
    this.holographicStickers.cancelPlacement();
    syncStickerToolHUDInputs();
    syncStickerHoloPopupDOM();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return true;
  },
  updateStickerPreviewAtClientPoint(clientX, clientY) {
    if (!this.holographicStickers || !this.holographicStickers.isPlacementActive()) return null;
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2.0 - 1.0;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2.0 + 1.0;
    }
    pointerRaycaster.setFromCamera(pointerNDC, camera);
    const hit = this.holographicStickers.updatePlacementPreviewFromRay(pointerRaycaster);
    syncStickerToolHUDInputs();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return hit;
  },
  stickerPersistenceState,
  lastStickerPersistPromise: null,
  loadPersistedStickers() {
    return hydrateStickersFromBackend();
  },
  sceneLayoutPersistenceState,
  lastSceneLayoutPersistPromise: null,
  _hydratingSceneLayouts: false,
  loadPersistedSceneLayouts(opts = {}) {
    return hydrateSceneLayoutsFromBackend(opts);
  },
  persistSceneLayout(layoutKey, payload, updatedAtMs = Date.now()) {
    return persistSceneLayoutRecord(layoutKey, payload, updatedAtMs);
  },
  persistSceneLayoutBatch(layoutsMap, updatedAtMs = Date.now()) {
    return persistSceneLayoutBatchRecords(layoutsMap, updatedAtMs);
  },
  deletePersistedSceneLayout(layoutKey) {
    return deletePersistedSceneLayoutRecord(layoutKey);
  },
  commitStickerPlacementAtClientPoint(clientX, clientY, meta = {}) {
    if (!this.holographicStickers || !this.holographicStickers.isPlacementActive()) return null;
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2.0 - 1.0;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2.0 + 1.0;
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      this.holographicStickers.updatePlacementPreviewFromRay(pointerRaycaster);
    }
    const record = this.holographicStickers.commitPlacement(meta);
    if (!record) return null;
    if (this.audio) {
      this.audio.trigger('onActivate', { target: record.stickerId, source: 'sticker-placed' });
    }
    if (!meta || !meta.skipPersist) {
      persistPlacedStickerRecord(record);
    }
    this.openStickerPopup(record.placedId);
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return record;
  },
  placeStickerAt(options = {}, { openPopup = true, immediate = false, skipPersist = false } = {}) {
    if (!this.holographicStickers) return null;
    const record = this.holographicStickers.placeStickerAt(options);
    if (record && !skipPersist && !options.skipPersist) {
      persistPlacedStickerRecord(record);
    }
    if (record && openPopup) {
      this.openStickerPopup(record.placedId, { immediate });
    } else {
      syncStickerToolHUDInputs();
      syncStickerHoloPopupDOM({ populateInputs: true });
    }
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return record;
  },
  openStickerPopup(placedId = null, { immediate = false } = {}) {
    if (!this.holographicStickers) return null;
    if (this.isDoomChatOpen) {
      this.exitDoomChatMode({ immediate: true });
    }
    if (this.isPopupFocused) {
      this.exitMathPodPopupFocus({ immediate: true });
    }
    if (this.mode === 'mount-focus') {
      this.exitMountFocusMode({ immediate: true });
    }
    if (this.radialMenu && this.radialMenu.isOpen()) {
      this.radialMenu.cancelDeadzone();
    }
    if (this.director && this.director.cameraPanState && this.director.cameraPanState.mode === 'playing') {
      this.director.stopStartupPan(true);
    }

    const targetRecord = placedId
      ? this.holographicStickers.selectPlacedSticker(placedId)
      : getActiveOrSelectedStickerRecord();
    if (!targetRecord) return null;
    this.holographicStickers.selectPlacedSticker(targetRecord.placedId);

    if (stickerPopupState.igniteTimer) {
      clearTimeout(stickerPopupState.igniteTimer);
      stickerPopupState.igniteTimer = null;
    }
    if (stickerPopupState.collapseTimer) {
      clearTimeout(stickerPopupState.collapseTimer);
      stickerPopupState.collapseTimer = null;
    }

    stickerPopupState.isOpen = true;
    stickerPopupState.activePlacedId = targetRecord.placedId;
    stickerPopupState.animState = immediate ? 'active' : 'igniting';
    stickerPopupState.animStartedAtMs =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.isStickerPopupOpen = true;

    syncStickerHoloPopupDOM({ populateInputs: true });
    syncStickerToolHUDInputs();

    const destPose = computeStickerPopupCameraPose(targetRecord);
    if (destPose) {
      stickerPopupCameraState.active = true;
      stickerPopupCameraState.returningToOrbit = false;
      stickerPopupCameraState.fromPos.copy(camera.position);
      stickerPopupCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      stickerPopupCameraState.toPos.copy(destPose.camPos);
      stickerPopupCameraState.toLookAt.copy(destPose.lookAtPos);
      stickerPopupCameraState.transitionProgress = immediate ? 1.0 : 0.0;
      if (immediate) {
        camera.position.copy(destPose.camPos);
        mountFocusCameraState.currentLookAt.copy(destPose.lookAtPos);
        camera.lookAt(destPose.lookAtPos);
        camera.updateMatrixWorld(true);
      }
    }

    if (!immediate) {
      stickerPopupState.igniteTimer = setTimeout(() => {
        stickerPopupState.igniteTimer = null;
        if (stickerPopupState.isOpen) {
          stickerPopupState.animState = 'active';
          syncStickerHoloPopupDOM();
        }
      }, STICKER_POPUP_IGNITE_MS);
    }

    if (this.audio) {
      this.audio.trigger('onActivate', { target: targetRecord.stickerId, source: 'sticker-popup-open' });
    }

    updateStickerHoloPopupTether();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return targetRecord;
  },
  closeStickerPopup({ immediate = false, silent = false } = {}) {
    if (stickerPopupState.igniteTimer) {
      clearTimeout(stickerPopupState.igniteTimer);
      stickerPopupState.igniteTimer = null;
    }
    if (stickerPopupState.collapseTimer) {
      clearTimeout(stickerPopupState.collapseTimer);
      stickerPopupState.collapseTimer = null;
    }

    const wasOpen = Boolean(
      stickerPopupState.isOpen ||
        stickerPopupState.animState === 'igniting' ||
        stickerPopupState.animState === 'active'
    );

    stickerPopupState.isOpen = false;
    this.isStickerPopupOpen = false;

    if (typeof document !== 'undefined') {
      const taggerEl = document.getElementById('sticker-tagger-input');
      const msgEl = document.getElementById('sticker-message-input');
      if (taggerEl && document.activeElement === taggerEl) taggerEl.blur();
      if (msgEl && document.activeElement === msgEl) msgEl.blur();
    }

    if (wasOpen && !immediate) {
      stickerPopupState.animState = 'collapsing';
      stickerPopupState.animStartedAtMs =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      stickerPopupState.collapseTimer = setTimeout(() => {
        stickerPopupState.collapseTimer = null;
        if (!stickerPopupState.isOpen) {
          stickerPopupState.animState = 'dormant';
          syncStickerHoloPopupDOM();
        }
      }, STICKER_POPUP_COLLAPSE_MS);
    } else {
      stickerPopupState.animState = 'dormant';
    }

    if (stickerPopupCameraState.active || stickerPopupCameraState.returningToOrbit) {
      stickerPopupCameraState.active = false;
      if (immediate) {
        stickerPopupCameraState.returningToOrbit = false;
        stickerPopupCameraState.transitionProgress = 1.0;
        const activeChar = this.getActiveCharacter ? this.getActiveCharacter() : null;
        if (activeChar) {
          const orbitPose = computeThirdPersonCameraPose(activeChar);
          camera.position.copy(orbitPose.cameraPos);
          mountFocusCameraState.currentLookAt.copy(orbitPose.pivotPos);
          camera.lookAt(orbitPose.pivotPos);
          camera.updateMatrixWorld(true);
        }
      } else {
        stickerPopupCameraState.returningToOrbit = true;
        stickerPopupCameraState.fromPos.copy(camera.position);
        stickerPopupCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
        stickerPopupCameraState.transitionProgress = 0.0;
      }
    }

    if (wasOpen && !silent && this.audio) {
      this.audio.trigger('onUpdate', { source: 'sticker-popup-close' });
    }

    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    updateStickerHoloPopupTether();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return true;
  },
  saveStickerTagAndMessage(placedId = null, tagger = '', message = '') {
    if (!this.holographicStickers) return null;
    const targetId =
      placedId ||
      stickerPopupState.activePlacedId ||
      this.holographicStickers.selectedPlacedId ||
      (this.holographicStickers.placedStickers.length > 0
        ? this.holographicStickers.placedStickers[this.holographicStickers.placedStickers.length - 1].placedId
        : null);
    if (!targetId) return null;
    const record = this.holographicStickers.setStickerTagAndMessage(targetId, { tagger, message }, true);
    if (!record) return null;
    stickerPopupState.lastSavedAt = record.updatedAt;
    persistPlacedStickerRecord(record);
    if (this.audio) {
      this.audio.trigger('onDataStream', { target: record.stickerId, source: 'sticker-tag-saved' });
    }
    syncStickerHoloPopupDOM({ populateInputs: true });
    syncStickerToolHUDInputs();
    updateStickerHoloPopupTether();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return record;
  },
  rotateStickerToDeg(rotationDeg) {
    if (!this.holographicStickers) return 0;
    const rad = THREE.MathUtils.degToRad(Number(rotationDeg) || 0);
    const nextRad = this.holographicStickers.rotateActiveOrPlacedSticker(rad, false);
    const activeRec = getActiveOrSelectedStickerRecord();
    if (activeRec && !this.holographicStickers.isPlacementActive()) {
      persistPlacedStickerRecord(activeRec);
    }
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return THREE.MathUtils.radToDeg(nextRad);
  },
  rotateStickerByDeg(deltaDeg) {
    if (!this.holographicStickers) return 0;
    const deltaRad = THREE.MathUtils.degToRad(Number(deltaDeg) || 0);
    const nextRad = this.holographicStickers.rotateActiveOrPlacedSticker(deltaRad, true);
    const activeRec = getActiveOrSelectedStickerRecord();
    if (activeRec && !this.holographicStickers.isPlacementActive()) {
      persistPlacedStickerRecord(activeRec);
    }
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return THREE.MathUtils.radToDeg(nextRad);
  },
  resizeStickerToMeters(sizeMeters) {
    if (!this.holographicStickers) return 0;
    const nextSize = this.holographicStickers.resizeActiveOrPlacedSticker(Number(sizeMeters) || 0.72, false);
    const activeRec = getActiveOrSelectedStickerRecord();
    if (activeRec && !this.holographicStickers.isPlacementActive()) {
      persistPlacedStickerRecord(activeRec);
    }
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return nextSize;
  },
  resizeStickerByStep(deltaMeters) {
    if (!this.holographicStickers) return 0;
    const nextSize = this.holographicStickers.resizeActiveOrPlacedSticker(Number(deltaMeters) || 0, true);
    const activeRec = getActiveOrSelectedStickerRecord();
    if (activeRec && !this.holographicStickers.isPlacementActive()) {
      persistPlacedStickerRecord(activeRec);
    }
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return nextSize;
  },
  setStickerSizeBounds(partialBounds = {}, persist = true) {
    if (!this.holographicStickers) return null;
    const bounds = this.holographicStickers.setSizeBounds(partialBounds, persist);
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return bounds;
  },
  captureCurrentStickerAsMinSize(persist = true) {
    if (!this.holographicStickers) return null;
    const bounds = this.holographicStickers.captureCurrentAsMinSize(persist);
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return bounds;
  },
  captureCurrentStickerAsMaxSize(persist = true) {
    if (!this.holographicStickers) return null;
    const bounds = this.holographicStickers.captureCurrentAsMaxSize(persist);
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return bounds;
  },
  toggleStickerCalibrationTool(forceState = undefined) {
    if (!this.holographicStickers) return false;
    const active = this.holographicStickers.toggleCalibrationTool(forceState);
    syncStickerHoloPopupDOM();
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return active;
  },
  deleteSelectedSticker(placedId = null) {
    if (!this.holographicStickers) return false;
    const targetId = placedId || stickerPopupState.activePlacedId || this.holographicStickers.selectedPlacedId;
    if (!targetId) return false;
    const ok = this.holographicStickers.deletePlacedSticker(targetId);
    if (ok) {
      deletePersistedStickerRecord(targetId);
    }
    if (stickerPopupState.activePlacedId === targetId) {
      stickerPopupState.activePlacedId = this.holographicStickers.selectedPlacedId;
      if (!stickerPopupState.activePlacedId) {
        this.closeStickerPopup();
      }
    }
    syncStickerHoloPopupDOM({ populateInputs: true });
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return ok;
  },
  repositionSelectedSticker(placedId = null) {
    if (!this.holographicStickers) return null;
    const targetId = placedId || stickerPopupState.activePlacedId || this.holographicStickers.selectedPlacedId;
    if (!targetId) return null;
    this.closeStickerPopup();
    const pState = this.holographicStickers.beginRepositionPlacedSticker(targetId);
    syncStickerToolHUDInputs();
    updateTelemetryHUD();
    if (this.ready) {
      renderer.render(scene, camera);
    }
    return pState;
  },
  getStickerSystemState() {
    if (!this.holographicStickers) return null;
    const sys = this.holographicStickers;
    const activeRec = getActiveOrSelectedStickerRecord();
    return {
      sizeBounds: sys.getSizeBounds(),
      calibrationToolActive: Boolean(sys.calibrationState.active),
      placementActive: Boolean(sys.placementState.active),
      placementState: {
        active: Boolean(sys.placementState.active),
        stickerId: sys.placementState.stickerId,
        sizeMeters: sys.placementState.sizeMeters,
        rotationRad: sys.placementState.rotationRad,
        rotationDeg: Number(THREE.MathUtils.radToDeg(sys.placementState.rotationRad).toFixed(2)),
        lastHit: sys.placementState.lastHit,
      },
      popupOpen: Boolean(stickerPopupState.isOpen && activeRec),
      popupAnimState: stickerPopupState.animState,
      cameraTransitionProgress: stickerPopupCameraState.transitionProgress,
      activePlacedId: activeRec ? activeRec.placedId : null,
      placedCount: sys.placedStickers.length,
      persistence: { ...stickerPersistenceState },
      placedStickers: sys.placedStickers.map((r) => ({
        placedId: r.placedId,
        stickerId: r.stickerId,
        label: r.label,
        surfaceId: r.surfaceId,
        surfaceLabel: r.surfaceLabel,
        surfaceCategory: r.surfaceCategory,
        wallSide: r.wallSide,
        position: { ...r.position },
        normal: { ...r.normal },
        sizeMeters: r.sizeMeters,
        rotationRad: r.rotationRad,
        rotationDeg: r.rotationDeg,
        tagger: r.tagger,
        message: r.message,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
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
  wallCollisionEnabled: true,
  cameraWallClampEnabled: true,
  setWallCollisionEnabled(enabled = true) {
    this.wallCollisionEnabled = Boolean(enabled);
    return this.wallCollisionEnabled;
  },
  setCameraWallClampEnabled(enabled = true) {
    this.cameraWallClampEnabled = Boolean(enabled);
    return this.cameraWallClampEnabled;
  },
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
    activeChar.isGrounded = true;
    activeChar.root.position.copy(activeChar.position);
    activeChar.setYawImmediate(Number(yawRad) || 0.0);
    cameraOrbit.userLookOverride = false;
    cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar.yaw);
    cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveInputSig = '0:0';
    updateCameraController(0.0);
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return true;
  },
  director: null,
  toggleCameraPOVMode(forceState = undefined) {
    return this.director ? this.director.toggleCameraPOVMode(forceState) : false;
  },
  getSpawnCoordinates() {
    return this.director ? this.director.getSpawnTransform() : DEFAULT_PLAYER_SPAWN;
  },
  setSpawnCoordinates(coords, persist = true) {
    return this.director ? this.director.setSpawnTransform(coords, persist) : null;
  },
  placeSpawnAtCameraGroundCrosshair() {
    return this.director ? this.director.placeSpawnAtCameraGroundCrosshair() : null;
  },
  getStartupCameraPan() {
    return this.director ? this.director.getCameraPan() : DEFAULT_STARTUP_PAN;
  },
  setStartupCameraPan(panConfig, persist = true) {
    return this.director ? this.director.setCameraPan(panConfig, persist) : null;
  },
  captureCurrentCameraAsPanStart() {
    return this.director ? this.director.captureCurrentViewAsPanStart() : null;
  },
  captureCurrentCameraAsPanMid() {
    return this.director ? this.director.captureCurrentViewAsPanMid() : null;
  },
  captureCurrentCameraAsPanEnd() {
    return this.director ? this.director.captureCurrentViewAsPanEnd() : null;
  },
  straightenCameraPanTrajectory(persist = true) {
    return this.director ? this.director.straightenTrajectory(persist) : null;
  },
  previewPanStartPose() {
    return this.director ? this.director.previewPanStartPose() : false;
  },
  previewPanMidPose() {
    return this.director ? this.director.previewPanMidPose() : false;
  },
  previewPanEndPose() {
    return this.director ? this.director.previewPanEndPose() : false;
  },
  playStartupCameraPan() {
    return this.director ? this.director.playStartupPan() : false;
  },
  stopStartupCameraPan() {
    return this.director ? this.director.stopStartupPan() : false;
  },
  isScrollLocked() {
    return this.director ? this.director.isScrollLocked() : false;
  },
  getIntroSequenceState() {
    return this.director ? this.director.getIntroSequenceState() : null;
  },
  startIntroTalkingSequence() {
    return this.director ? this.director.startIntroTalkingSequence() : null;
  },
  advanceIntroDialogueBox() {
    return this.director ? this.director.advanceDialogueBox() : null;
  },
  setIntroDialogueBoxCount(count, persist = true) {
    return this.director ? this.director.setDialogueBoxCount(count, persist) : null;
  },
  setIntroDialogueBoxes(boxes, persist = true) {
    return this.director ? this.director.setDialogueBoxes(boxes, persist) : null;
  },
  toggleDirectorGizmos(forceState = undefined) {
    return this.director ? this.director.toggleEditMode(forceState) : false;
  },
  selectDirectorHandle(handleId) {
    return this.director ? this.director.selectHandle(handleId) : null;
  },
  setDirectorGizmoMode(mode) {
    return this.director ? this.director.setGizmoMode(mode) : false;
  },
  exportDirectorJSON() {
    return this.director ? this.director.exportJSON() : '{}';
  },
  resetDirectorDefaults(persist = true) {
    return this.director ? this.director.resetDefaults(persist) : null;
  },
  wallMounts: [],
  wallMountsByName: {},
  wallMountRaycastTargets: [],
  setStationPreviewAtlas(mountName, atlasUrl, options = {}) {
    const m = this.wallMountsByName ? this.wallMountsByName[mountName] : null;
    if (!m || !m.station || !atlasUrl) return false;
    m.station.previewAtlasUrl = atlasUrl;
    m.previewAtlasUrl = atlasUrl;
    if (options.previewSourceLabel) {
      m.station.previewSourceLabel = options.previewSourceLabel;
    }
    if (Array.isArray(options.previewFrameCaptions) && options.previewFrameCaptions.length === 4) {
      m.station.previewFrameCaptions = options.previewFrameCaptions.slice(0, 4);
    }
    ensureStationPreviewAtlasLoaded(m.station, (atlasImg, atlasTex) => {
      if (m.screenTexture && m.screenTexture.userData && m.screenTexture.userData.refreshWithAtlas) {
        m.screenTexture.userData.refreshWithAtlas(atlasImg, atlasTex);
      }
      m.previewAtlasLoaded = true;
      if (this.ready) {
        renderer.render(scene, camera);
      }
    });
    return true;
  },
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
  isDevMode: IS_DEV_MODE,
  introGenerationTelemetry,
  prefetchGenerativeIntroDeck,
  glbVariantCatalog: GLB_VARIANT_CATALOG,
  currentVariantKey: 'luis_color',
  soloCharacterMode: true,
  sidebarCollapsed: !IS_DEV_MODE,
  toggleSidebar(forceCollapsed) {
    if (!IS_DEV_MODE) {
      this.sidebarCollapsed = true;
      const hudEl = typeof document !== 'undefined' ? document.getElementById('sandbox-hud') : null;
      if (hudEl) {
        hudEl.classList.add('collapsed');
        hudEl.style.display = 'none';
        hudEl.setAttribute('aria-hidden', 'true');
      }
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('sidebar-collapsed');
      }
      return true;
    }
    const nextState = typeof forceCollapsed === 'boolean' ? forceCollapsed : !this.sidebarCollapsed;
    this.sidebarCollapsed = nextState;
    const hudEl = typeof document !== 'undefined' ? document.getElementById('sandbox-hud') : null;
    const btnEl = typeof document !== 'undefined' ? document.getElementById('sidebar-collapse-btn') : null;
    const iconEl = typeof document !== 'undefined' ? document.getElementById('sidebar-collapse-icon') : null;
    const labelEl = typeof document !== 'undefined' ? document.getElementById('sidebar-collapse-label') : null;
    if (hudEl) {
      hudEl.classList.toggle('collapsed', nextState);
    }
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('sidebar-collapsed', nextState);
    }
    if (btnEl) {
      btnEl.setAttribute('aria-expanded', String(!nextState));
      btnEl.setAttribute(
        'title',
        nextState ? 'Expand Sidebar Controls (Key B)' : 'Collapse Sidebar Controls (Key B)'
      );
    }
    if (iconEl) {
      iconEl.textContent = nextState ? '▶' : '◀';
    }
    if (labelEl) {
      labelEl.textContent = nextState ? 'Expand' : 'Collapse';
    }
    if (this.audio) {
      this.audio.trigger('onUpdate', { action: 'toggle-sidebar', collapsed: nextState });
    }
    return this.sidebarCollapsed;
  },
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
  mobileTouch,
  setMobileTouchEnabled(enabled) {
    return mobileTouch.setEnabled(enabled);
  },
  setThumbpadVector(lx, ly, opts = {}) {
    return mobileTouch.setVector(lx, ly, opts);
  },
  setLookThumbpadVector(lx, ly, opts = {}) {
    return mobileTouch.setLookVector(lx, ly, opts);
  },
  resetThumbpad() {
    return mobileTouch.resetMove();
  },
  resetLookThumbpad() {
    return mobileTouch.resetLook();
  },
  computeThirdPersonCameraPose(dt = 1 / 60) {
    return computeThirdPersonCameraPose(dt);
  },
  clampCameraCircleAgainstWalls,
  computeMinimumSignedWallClearance,
  mountFocusCameraState,
  popupFocusCameraState,
  doomChatCameraState,
  doomChatState,
  isDoomChatOpen: false,
  hoveredDoomCompanion: false,
  getDoomChatCharacter() {
    const active = this.getActiveCharacter ? this.getActiveCharacter() : null;
    if (active && active.companionMesh) return active;
    if (this.characters && this.characters.hoodie && this.characters.hoodie.companionMesh) {
      return this.characters.hoodie;
    }
    return active || (this.characters ? this.characters.hoodie : null);
  },
  getDoomCompanionRaycastTargets() {
    const targets = [];
    if (!this.characters) return targets;
    for (const char of Object.values(this.characters)) {
      if (!char || !char.root || !char.root.visible) continue;
      if (char.companionHitProxy) {
        targets.push(char.companionHitProxy);
      }
      if (Array.isArray(char.companionMeshes)) {
        for (const m of char.companionMeshes) {
          if (m) targets.push(m);
        }
      }
    }
    return targets;
  },
  enterDoomChatMode({ immediate = false, resetToStarters = false } = {}) {
    if (!this.ready) return null;

    if (this.activeCharacterId !== 'hoodie' && this.characters && this.characters.hoodie) {
      this.swapCharacter();
    }
    const targetChar = this.getDoomChatCharacter();
    if (!targetChar) return null;

    if (this.isStickerPopupOpen) {
      this.closeStickerPopup({ immediate: true, silent: true });
    }
    if (this.isPopupFocused) {
      this.exitMathPodPopupFocus({ immediate: true });
    }
    if (this.mode === 'mount-focus') {
      this.exitMountFocusMode({ immediate: true });
    }
    if (this.director && this.director.cameraPanState && this.director.cameraPanState.mode === 'playing') {
      this.director.stopStartupPan(true);
    }

    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    jumpRequested = false;
    cameraOrbit.isDragging = false;
    cameraOrbit.pointerId = null;
    cameraOrbit.userLookOverride = false;
    mobileTouch.reset();

    if (!this.sidebarCollapsed) {
      this._autoCollapsedForDoomChat = true;
      this.toggleSidebar(true);
    }

    // Hide the intro dialogue overlay pill while DOOM_HEAD hologram chat is active so there is zero visual clutter
    const introOverlayEl = typeof document !== 'undefined' ? document.getElementById('intro-dialogue-overlay') : null;
    if (introOverlayEl) {
      introOverlayEl.style.opacity = '0';
      introOverlayEl.style.pointerEvents = 'none';
    }

    targetChar.velocity.set(0, 0, 0);
    targetChar.companionChatTargetWeight = 1.0;
    if (immediate) {
      targetChar.companionChatWeight = 1.0;
    }
    targetChar.startDialogue('TALK_EXPLAIN');
    targetChar.mixer.update(0.0);
    targetChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value, immediate ? 1.0 : 1 / 60);
    targetChar.applyConversationalHeadLook();

    this.isDoomChatOpen = true;
    doomChatState.isOpen = true;
    if (resetToStarters || doomChatState.messages.length === 0) {
      doomChatState.stage = 'starters';
    }
    syncDoomHoloChatDOM();

    const destPose = computeDoomChatCameraPose(targetChar);

    doomChatCameraState.active = true;
    doomChatCameraState.returningToOrbit = false;
    doomChatCameraState.fromPos.copy(camera.position);
    doomChatCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
    doomChatCameraState.toPos.copy(destPose.cameraPos);
    doomChatCameraState.toLookAt.copy(destPose.lookAtPos);
    doomChatCameraState.transitionProgress = immediate ? 1.0 : 0.0;

    if (!doomChatState.startersLoadedFromHF && !doomChatState.startersLoading) {
      fetchDoomStartersFromHF({ silentFallback: true }).catch(() => {});
    }

    if (this.audio) {
      this.audio.trigger('onActivate', { target: 'DOOM_Companion', source: 'doom-chat-open' });
    }

    updateCameraController(immediate ? 1.0 : 1 / 60);
    updateDoomHoloChatTether();
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return this.getDoomChatState();
  },
  exitDoomChatMode({ immediate = false } = {}) {
    if (!this.ready) return false;
    if (!this.isDoomChatOpen && !doomChatState.isOpen && !doomChatCameraState.active) {
      return false;
    }

    this.isDoomChatOpen = false;
    doomChatState.isOpen = false;
    doomChatCameraState.active = false;

    const targetChar = this.getDoomChatCharacter();
    if (targetChar) {
      targetChar.companionChatTargetWeight = 0.0;
      targetChar.companionSpeakingPulse = 0.0;
      if (immediate) {
        targetChar.companionChatWeight = 0.0;
      }
      const isIntroTalkingLock =
        this.mode === 'scroll' &&
        this.scrollProgress <= 0.002 &&
        this.director &&
        this.director.introSequenceState &&
        this.director.introSequenceState.phase === 'dialogue-active';
      if (!isIntroTalkingLock) {
        targetChar.stopDialogue();
      }
      targetChar.mixer.update(0.0);
      targetChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value, immediate ? 1.0 : 1 / 60);
      targetChar.applyConversationalHeadLook();
    }

    if (this._autoCollapsedForDoomChat) {
      this._autoCollapsedForDoomChat = false;
      this.toggleSidebar(false);
    }

    const introOverlayEl = typeof document !== 'undefined' ? document.getElementById('intro-dialogue-overlay') : null;
    if (introOverlayEl) {
      introOverlayEl.style.opacity = '';
      introOverlayEl.style.pointerEvents = 'none';
      syncIntroDialogueOverlayUI();
    }

    const inputEl = typeof document !== 'undefined' ? document.getElementById('doom-chat-input') : null;
    if (inputEl && typeof document !== 'undefined' && document.activeElement === inputEl) {
      inputEl.blur();
    }

    const returnTargetPose = resolveScrollRestOrOrbitCameraPose();
    if (immediate) {
      doomChatCameraState.returningToOrbit = false;
      doomChatCameraState.transitionProgress = 1.0;
      camera.position.copy(returnTargetPose.cameraPos);
      camera.lookAt(returnTargetPose.pivotPos);
      camera.updateMatrixWorld(true);
      mountFocusCameraState.currentLookAt.copy(returnTargetPose.pivotPos);
    } else {
      doomChatCameraState.returningToOrbit = true;
      doomChatCameraState.fromPos.copy(camera.position);
      doomChatCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      doomChatCameraState.toPos.copy(returnTargetPose.cameraPos);
      doomChatCameraState.toLookAt.copy(returnTargetPose.pivotPos);
      doomChatCameraState.transitionProgress = 0.0;
    }

    if (this.audio) {
      this.audio.trigger('onHover', { target: 'DOOM_Companion', source: 'doom-chat-close' });
    }

    syncDoomHoloChatDOM();
    updateCameraController(immediate ? 1.0 : 1 / 60);
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return true;
  },
  toggleDoomChatMode(opts = {}) {
    if (this.isDoomChatOpen || doomChatState.isOpen) {
      return this.exitDoomChatMode(opts);
    }
    return this.enterDoomChatMode(opts);
  },
  resetDoomChatToStarters({ refreshStarters = false } = {}) {
    doomChatState.stage = 'starters';
    doomChatState.messages = [];
    doomChatState.lastError = null;
    syncDoomHoloChatDOM();
    updateTelemetryHUD();
    if (refreshStarters) {
      fetchDoomStartersFromHF().catch(() => {});
    }
    return this.getDoomChatState();
  },
  async refreshDoomStarters() {
    return fetchDoomStartersFromHF();
  },
  async selectDoomStarter(index = 0) {
    const idx = Number(index) === 1 ? 1 : 0;
    const starterText = doomChatState.starters[idx] || doomChatState.starters[0];
    if (!starterText) return null;
    return sendDoomChatMessageToHF(starterText);
  },
  async sendDoomChatMessage(text) {
    return sendDoomChatMessageToHF(text);
  },
  setDoomChatConfig(partial = {}) {
    if (!partial || typeof partial !== 'object') return this.getDoomChatState();
    if (typeof partial.personaPrompt === 'string') {
      doomChatState.personaPrompt = partial.personaPrompt;
    }
    if (typeof partial.starterTopicPrompt === 'string') {
      doomChatState.starterTopicPrompt = partial.starterTopicPrompt;
    }
    if (typeof partial.chatModelId === 'string' && partial.chatModelId.trim()) {
      doomChatState.chatModelId = partial.chatModelId.trim();
    }
    if (typeof partial.startersModelId === 'string' && partial.startersModelId.trim()) {
      doomChatState.startersModelId = partial.startersModelId.trim();
    }
    syncDoomHoloChatDOM();
    return this.getDoomChatState();
  },
  getDoomChatState() {
    const char = this.getDoomChatCharacter();
    return {
      isOpen: Boolean(this.isDoomChatOpen && doomChatState.isOpen),
      stage: doomChatState.stage,
      chatModelId: doomChatState.chatModelId,
      startersModelId: doomChatState.startersModelId,
      activeChatModelResolved: doomChatState.activeChatModelResolved,
      activeStartersModelResolved: doomChatState.activeStartersModelResolved,
      personaPrompt: doomChatState.personaPrompt,
      starterTopicPrompt: doomChatState.starterTopicPrompt,
      starters: [...doomChatState.starters],
      startersLoading: Boolean(doomChatState.startersLoading),
      startersLoadedFromHF: Boolean(doomChatState.startersLoadedFromHF),
      startersLatencyMs: doomChatState.startersLatencyMs,
      chatLoading: Boolean(doomChatState.chatLoading),
      lastChatLatencyMs: doomChatState.lastChatLatencyMs,
      messages: doomChatState.messages.map((m) => ({ ...m })),
      lastGraphRag: doomChatState.lastGraphRag || null,
      lastError: doomChatState.lastError,
      cameraTransitionProgress: doomChatCameraState.transitionProgress,
      companionChatWeight: char ? Number(char.companionChatWeight.toFixed(4)) : 0.0,
      mutualFacingDotProduct: char ? char.mutualFacingDotProduct : 1.0,
      luisDialogueActive: Boolean(char && char.dialogueActive),
      luisState: char ? char.state : 'Idle',
      luisCurrentClip: char ? char.currentClipName : null,
      companionLocalPos: char && char.companionMesh
        ? {
            x: Number(char.companionMesh.position.x.toFixed(4)),
            y: Number(char.companionMesh.position.y.toFixed(4)),
            z: Number(char.companionMesh.position.z.toFixed(4)),
          }
        : null,
    };
  },
  focusMathPodPopup(podOrCalloutId, { immediate = false } = {}) {
    if (!this.ready || !this.mathPodPopups) return null;
    const callout = this.mathPodPopups.getCallout(podOrCalloutId);
    if (!callout) return null;

    if (this.isPopupFocused && this.focusedMathPodPopupId === callout.id) {
      this.exitMathPodPopupFocus({ immediate });
      return null;
    }

    if (this.mode === 'mount-focus') {
      this.exitMountFocusMode({ immediate: true });
    }

    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    jumpRequested = false;
    cameraOrbit.isDragging = false;
    cameraOrbit.pointerId = null;
    cameraOrbit.userLookOverride = false;
    mobileTouch.reset();

    for (const c of this.mathPodPopups.callouts) {
      c.isCameraFocused = c === callout;
    }
    callout.open();

    if (this.mathPods) {
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }

    const calloutCenter = callout.rootGroup.position.clone();
    calloutCenter.y += callout.billboardGroup ? callout.billboardGroup.position.y : 0.0;

    // Approach from the corridor side so the camera never clips into left/right brick walls
    const signZ = camera.position.z >= calloutCenter.z ? 1.0 : -1.0;
    const clampedCamX = Math.max(-1.05, Math.min(1.05, calloutCenter.x * 0.65));
    const dx = clampedCamX - calloutCenter.x;
    const dzMag = Math.sqrt(Math.max(0.25, POPUP_FOCUS_CAM_DISTANCE * POPUP_FOCUS_CAM_DISTANCE - dx * dx));
    const dz = signZ * dzMag;

    popupFocusCameraState.viewOffset.set(dx, 0.0, dz);
    const destCamPos = calloutCenter.clone().add(popupFocusCameraState.viewOffset);

    // Offset lookAt ~0.18m to camera-left so the focused pop-up centers in the open 3D viewport to the right of #sandbox-hud
    const horizDist = Math.hypot(dx, dz) || 1.0;
    const fwdX = -dx / horizDist;
    const fwdZ = -dz / horizDist;
    const camRightX = -fwdZ;
    const camRightZ = fwdX;
    const hudClearanceOffset = !IS_DEV_MODE || this.sidebarCollapsed ? 0.0 : 0.18;
    const destLookAt = calloutCenter.clone();
    destLookAt.x -= camRightX * hudClearanceOffset;
    destLookAt.z -= camRightZ * hudClearanceOffset;

    this.isPopupFocused = true;
    this.focusedMathPodPopupId = callout.id;
    popupFocusCameraState.active = true;
    popupFocusCameraState.returningToOrbit = false;
    popupFocusCameraState.calloutId = callout.id;
    popupFocusCameraState.fromPos.copy(camera.position);
    popupFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
    popupFocusCameraState.toPos.copy(destCamPos);
    popupFocusCameraState.toLookAt.copy(destLookAt);
    popupFocusCameraState.transitionProgress = immediate ? 1.0 : 0.0;

    if (this.audio) {
      this.audio.trigger('onActivate', { target: callout.id, source: 'mathpod-popup-focus' });
    }

    updateCameraController(immediate ? 1.0 : 1 / 60);
    if (this.mathPods) {
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return callout;
  },
  exitMathPodPopupFocus({ immediate = false } = {}) {
    if (!this.ready) return false;
    if (!this.isPopupFocused && !popupFocusCameraState.active) return false;

    if (this.mathPodPopups) {
      for (const c of this.mathPodPopups.callouts) {
        c.isCameraFocused = false;
      }
    }

    const prevId = this.focusedMathPodPopupId;
    this.isPopupFocused = false;
    this.focusedMathPodPopupId = null;
    popupFocusCameraState.active = false;
    popupFocusCameraState.calloutId = null;

    const orbitState = computeThirdPersonCameraPose();
    if (immediate) {
      popupFocusCameraState.returningToOrbit = false;
      popupFocusCameraState.transitionProgress = 1.0;
      camera.position.copy(orbitState.cameraPos);
      camera.lookAt(orbitState.pivotPos);
      camera.updateMatrixWorld(true);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
    } else {
      popupFocusCameraState.returningToOrbit = true;
      popupFocusCameraState.fromPos.copy(camera.position);
      popupFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      popupFocusCameraState.toPos.copy(orbitState.cameraPos);
      popupFocusCameraState.toLookAt.copy(orbitState.pivotPos);
      popupFocusCameraState.transitionProgress = 0.0;
    }

    if (this.audio && prevId) {
      this.audio.trigger('onHover', { target: prevId, source: 'mathpod-popup-unfocus' });
    }

    updateCameraController(immediate ? 1.0 : 1 / 60);
    if (this.mathPods) {
      this.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return true;
  },
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
  resolveActiveSkateRoomCharId() {
    return 'luis';
  },
  resolveSkateRoomPortalUrl(opts = {}) {
    if (opts && typeof opts.targetUrl === 'string' && opts.targetUrl.trim()) {
      return opts.targetUrl.trim();
    }
    const rawCharId = (opts && opts.charId) || this.resolveActiveSkateRoomCharId();
    const charId = rawCharId === 'luis_holo' ? 'luis_holo' : 'luis';
    return `./skate3_cleanroom/?char=${encodeURIComponent(charId)}`;
  },
  teleportToSkateRoom(opts = {}) {
    const resolvedUrl = this.resolveSkateRoomPortalUrl(opts);
    const mergedOpts = { ...opts, targetUrl: resolvedUrl };
    if (this.waterColor && typeof this.waterColor.teleportToSkateRoom === 'function') {
      return this.waterColor.teleportToSkateRoom(mergedOpts);
    }
    if (typeof window !== 'undefined' && window.location && mergedOpts.navigate !== false) {
      window.location.assign(resolvedUrl);
    }
    return true;
  },
  openPortalGameSelectorPopup(opts = {}) {
    if (!this.ready || !this.waterColor) return false;
    if (this.mode === 'mount-focus' || this.isMountFocused) {
      this.exitMountFocusMode({ immediate: true });
    }
    if (this.radialMenu && this.radialMenu.isOpen()) {
      this.radialMenu.cancelDeadzone();
    }
    if (this.isStickerPopupOpen) {
      this.closeStickerPopup({ silent: true });
    }
    if (this.isDoomChatOpen) {
      this.exitDoomChatMode({ silent: true });
    }
    if (this.whitepaperColumnOpen) {
      this.closeWhitepaperHologramColumn({ immediate: true });
    }
    if (this.isStickerPopupOpen) {
      this.closeStickerPopup({ immediate: true, silent: true });
    }
    if (this.isPopupFocused) {
      this.exitMathPodPopupFocus({ immediate: true });
    }
    if (this.mode === 'scroll') {
      enterFreeRoamMode();
    }
    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    jumpRequested = false;
    cameraOrbit.isDragging = false;
    cameraOrbit.pointerId = null;
    mobileTouch.reset();

    const activeChar = this.getActiveCharacter();
    if (activeChar) {
      activeChar.velocity.set(0, 0, 0);
      if (!activeChar.dialogueActive) {
        activeChar.freezeToIdle();
      }
      activeChar.mixer.update(0.0);
      activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
      activeChar.root.updateMatrixWorld(true);
    }
    if (this.runningEffects) {
      this.runningEffects.quiesceImmediately();
    }

    const wasAlreadyOpen = Boolean(this.isPortalPopupOpen && this.waterColor && this.waterColor.isPopupOpen);
    this.isPortalPopupOpen = true;
    this.portalGlitchBoostRemainingSec = 0.24;
    if (this.waterColor && (!this.waterColor.isPopupOpen || opts.force)) {
      this.waterColor.openPortalPopup({ ...opts, _fromSandbox: true });
    } else {
      if (this.waterColor && opts && opts.gameId) {
        this.waterColor.selectGame(opts.gameId);
      }
      startPortalPopupOpenAnimation({
        immediate: Boolean(opts.immediate || (wasAlreadyOpen && !opts.replayAnimation)),
      });
    }

    syncPortalGamePopupDOM();
    updatePortalGameHoloPopupUI(0.0);
    updateTelemetryHUD();
    if (this.audio && !(opts && opts.silent)) {
      this.audio.trigger('onActivate', {
        source: (opts && opts.source) || 'portalGameSelectorOpen',
        selectedGameId: this.waterColor ? this.waterColor.selectedGameId : 'skate3',
      });
    }
    return true;
  },
  closePortalGameSelectorPopup(opts = {}) {
    if (!this.waterColor) return false;
    const wasVisible = Boolean(
      this.isPortalPopupOpen ||
        this.waterColor.isPopupOpen ||
        this.portalPopupAnimState === 'opening' ||
        this.portalPopupAnimState === 'open'
    );
    this.isPortalPopupOpen = false;
    this.portalGlitchBoostRemainingSec = 0.16;
    if (this.waterColor.isPopupOpen) {
      this.waterColor.closePortalPopup({ ...opts, _fromSandbox: true });
    } else if (wasVisible) {
      startPortalPopupCloseAnimation({ immediate: Boolean(opts && opts.immediate) });
    } else {
      startPortalPopupCloseAnimation({ immediate: true });
    }
    syncPortalGamePopupDOM();
    updatePortalGameHoloPopupUI(0.0);
    updateTelemetryHUD();
    if (this.audio && !(opts && opts.silent)) {
      this.audio.trigger('onHover', {
        source: (opts && opts.source) || 'portalGameSelectorClose',
      });
    }
    return true;
  },
  selectPortalGame(gameIdOrSlot, opts = {}) {
    if (!this.waterColor) return null;
    const spec = this.waterColor.selectGame(gameIdOrSlot);
    if (!spec) return null;
    this.portalGlitchBoostRemainingSec = Math.max(this.portalGlitchBoostRemainingSec, 0.14);
    syncPortalGamePopupDOM();
    updatePortalGameHoloPopupUI(0.0);
    updateTelemetryHUD();
    if (this.audio && !(opts && opts.silent)) {
      this.audio.trigger('onUpdate', {
        source: 'portalGameSelect',
        gameId: spec.id,
        slot: spec.slot,
      });
    }
    return spec;
  },
  launchPortalGame(gameIdOrSlot = null, opts = {}) {
    if (!this.waterColor) return false;
    const catalog = getActivePortalGameCatalog();
    const spec =
      resolvePortalGameSpec(
        gameIdOrSlot || (this.waterColor && this.waterColor.selectedGameId) || catalog[0]?.id || 'skate3',
        catalog
      ) ||
      catalog[0] ||
      PORTAL_GAME_CATALOG[0];
    this.selectPortalGame(spec.id, { silent: true });
    const targetUrl =
      opts && typeof opts.targetUrl === 'string' && opts.targetUrl.trim()
        ? opts.targetUrl.trim()
        : spec.id === 'skate3'
        ? this.resolveSkateRoomPortalUrl(opts)
        : spec.targetUrl;
    return this.waterColor.launchGame(spec.id, {
      ...opts,
      targetUrl,
    });
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
    cameraOrbit.pointerId = null;
    cameraOrbit.userLookOverride = false;
    mobileTouch.reset();
    document.body.classList.remove('mount-pointer-hover');

    const activeChar = this.getActiveCharacter();
    if (activeChar) {
      activeChar.freezeToIdle();
      activeChar.mixer.update(0.0);
      activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
      activeChar.root.updateMatrixWorld(true);
    }

    if (this.whitepaperColumnOpen && targetMount.mountName !== 'SCREEN_MOUNT_03') {
      this.whitepaperColumnOpen = false;
      if (this.whitepaperHoloColumn) {
        this.whitepaperHoloColumn.lifecycleState = 'inactive';
        this.whitepaperHoloColumn.rootGroup.visible = false;
      }
    }

    this.mode = 'mount-focus';
    this.isMountFocused = true;
    this.focusedMount = targetMount;
    this.hoveredMount = null;
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('mount-focus-mode');
    }
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

    if (this.whitepaperColumnOpen) {
      this.whitepaperColumnOpen = false;
      if (this.whitepaperHoloColumn) {
        this.whitepaperHoloColumn.lifecycleState = 'inactive';
        this.whitepaperHoloColumn.rootGroup.visible = false;
      }
    }

    if (this.focusedMount) {
      this.focusedMount.triggerGlitchSpike(0.18);
    }
    this.mode = 'freeroam';
    this.isMountFocused = false;
    this.focusedMount = null;
    document.body.classList.add('freeroam-mode');
    document.body.classList.remove('mount-focus-mode');
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
  openWorksShowcase(identifier = 'SCREEN_MOUNT_01', opts = {}) {
    if (!this.ready) return null;
    if (this.director) {
      if (this.director.cameraPanState && this.director.cameraPanState.mode === 'playing') {
        this.director.stopStartupPan(true);
      }
      if (
        this.director.introSequenceState &&
        (this.director.introSequenceState.phase === 'pan-playing' ||
          this.director.introSequenceState.phase === 'dialogue-active')
      ) {
        if (typeof this.director.completeIntroDialogue === 'function') {
          this.director.completeIntroDialogue({ openDoomChat: false });
        } else {
          this.director.introSequenceState.scrollLocked = false;
          this.director.introSequenceState.phase = 'scrolling-alley';
        }
      }
    }
    if (this.radialMenu && typeof this.radialMenu.isOpen === 'function' && this.radialMenu.isOpen()) {
      this.radialMenu.close();
    }
    if (this.isDoomChatOpen && typeof this.exitDoomChatMode === 'function') {
      this.exitDoomChatMode();
    }
    if (this.isStickerPopupOpen && typeof this.closeStickerPopup === 'function') {
      this.closeStickerPopup();
    }
    if (this.whitepaperColumnOpen && typeof this.closeWhitepaperHologramColumn === 'function') {
      this.closeWhitepaperHologramColumn();
    }
    if (this.isPortalPopupOpen && typeof this.closePortalGameSelectorPopup === 'function') {
      this.closePortalGameSelectorPopup({ source: 'works-showcase' });
    }
    return this.focusWallMount(identifier || 'SCREEN_MOUNT_01', opts);
  },
  toggleWorksShowcase(opts = {}) {
    if (!this.ready) return null;
    if (this.mode === 'mount-focus') {
      return this.exitMountFocusMode(opts);
    }
    return this.openWorksShowcase('SCREEN_MOUNT_01', opts);
  },
  interactNearestWallMount() {
    if (!this.ready) return null;
    if (this.isPortalPopupOpen) {
      this.closePortalGameSelectorPopup({ source: 'key-e' });
      return null;
    }
    if (this.whitepaperColumnOpen) {
      this.closeWhitepaperHologramColumn();
      return null;
    }
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
  openWhitepaperHologramColumn({ immediate = false } = {}) {
    if (!this.ready || !this.whitepaperHoloColumn) return null;
    const m3 = this.wallMountsByName['SCREEN_MOUNT_03'];
    if (!m3) return null;

    if (this.mode !== 'mount-focus' || this.focusedMount !== m3) {
      this.focusWallMount('SCREEN_MOUNT_03', { immediate: true });
    }

    this.whitepaperColumnOpen = true;
    const col = this.whitepaperHoloColumn;
    const colX = Number((m3.locatorPosition.x + 0.50).toFixed(4));
    const colY = Number((m3.locatorPosition.y + 0.01).toFixed(4));
    const colZ = Number(m3.locatorPosition.z.toFixed(4));

    col.rootGroup.position.set(colX, colY, colZ);
    col.rootGroup.rotation.set(0.0, Math.PI / 2, 0.0);
    col.rootGroup.scale.set(0.78, 0.78, 1.0);
    col.rootGroup.updateMatrixWorld(true);

    if (immediate) {
      col.lifecycleState = 'active';
      col.lifecycleProgress = 1.0;
      col.rootGroup.visible = true;
    } else {
      col.materialize({ durationSec: 0.42, axis: 'vertical' });
    }
    col.triggerGlitchBurst({ intensity: 0.55, durationSec: 0.18 });
    if (col.documentController) {
      col.documentController.renderViewport();
    }

    const destLookAt = new THREE.Vector3(colX, colY, colZ);
    const destCamPos = new THREE.Vector3(colX + 1.44, colY, colZ);

    mountFocusCameraState.active = true;
    mountFocusCameraState.returningToOrbit = false;
    mountFocusCameraState.fromPos.copy(camera.position);
    mountFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
    mountFocusCameraState.toPos.copy(destCamPos);
    mountFocusCameraState.toLookAt.copy(destLookAt);
    mountFocusCameraState.transitionProgress = immediate ? 1.0 : 0.0;

    if (this.audio) {
      this.audio.trigger('onActivate', { stationId: 'proj-03', source: 'ssm-whitepaper-column' });
    }

    updateWallScreenMounts();
    updateCameraController(immediate ? 1.0 : 1 / 60);
    updateHolographicPopupUI();
    if (this.hologramColumns) {
      this.hologramColumns.update(1 / 60, holoShaderUniforms.uHoloTime.value, this.getActiveCharacter(), camera);
    }
    updateTelemetryHUD();
    renderer.render(scene, camera);
    return col;
  },
  closeWhitepaperHologramColumn({ immediate = false } = {}) {
    if (!this.ready || !this.whitepaperColumnOpen) return false;
    this.whitepaperColumnOpen = false;
    if (this.whitepaperHoloColumn) {
      this.whitepaperHoloColumn.lifecycleState = 'inactive';
      this.whitepaperHoloColumn.lifecycleProgress = 0.0;
      this.whitepaperHoloColumn.rootGroup.visible = false;
    }
    if (this.mode === 'mount-focus' && this.focusedMount) {
      this.focusWallMount(this.focusedMount.mountName, { immediate });
    } else {
      updateWallScreenMounts();
      updateHolographicPopupUI();
      if (this.hologramColumns) {
        this.hologramColumns.update(1 / 60, holoShaderUniforms.uHoloTime.value, this.getActiveCharacter(), camera);
      }
      renderer.render(scene, camera);
    }
    return true;
  },
  scrollWhitepaperHologramColumn(deltaY, { immediate = false } = {}) {
    if (!this.whitepaperHoloColumn) return 0.0;
    const nextScroll = this.whitepaperHoloColumn.scrollDocumentByPixels(deltaY, immediate);
    if (immediate) {
      renderer.render(scene, camera);
    }
    return nextScroll;
  },
  evaluateScrollCorridorPath(progress) {
    return evaluateScrollCorridorPath(progress);
  },
  scrollToProjectStation(stationIndex) {
    if (!this.ready) return null;
    const st = HOLO_PROJECT_STATIONS.find((s) => s.index === Number(stationIndex));
    if (!st) return null;
    const midCorridorProgress = 0.5 * (st.startProgress + st.endProgress);
    this.setScrollProgress(mapCorridorToRawScrollProgress(midCorridorProgress));
    return st;
  },
  setScrollProgress(fraction, { smooth = false } = {}) {
    if (!this.ready) return;
    const clamped = Math.max(0.0, Math.min(1.0, Number(fraction) || 0.0));
    const env = this.environment;
    const activeChar = this.getActiveCharacter();

    // Cleanly disengage Mount Focus Mode if active (§6.3)
    if (this.mode === 'mount-focus' || this.isMountFocused || this.whitepaperColumnOpen) {
      this.isMountFocused = false;
      this.focusedMount = null;
      this.whitepaperColumnOpen = false;
      if (this.whitepaperHoloColumn) {
        this.whitepaperHoloColumn.lifecycleState = 'inactive';
        this.whitepaperHoloColumn.rootGroup.visible = false;
      }
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
      cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar ? activeChar.yaw : null);
      cameraOrbit.pitch = characterCameraState.pitchRad;
      cameraOrbit.desiredDistance = characterCameraState.distance;
      cameraOrbit.isDragging = false;
      cameraOrbit.pointerId = null;
      cameraOrbit.userLookOverride = false;
      mobileTouch.reset();
    }

    if (clamped > 0.002 && this.director) {
      if (this.director.cameraPanState && this.director.cameraPanState.playing) {
        this.director.stopStartupPan(true);
      }
      if (this.director.introSequenceState) {
        this.director.introSequenceState.scrollLocked = false;
        this.director.introSequenceState.phase = 'scrolling-alley';
      }
      syncIntroDialogueOverlayUI();
      syncDirectorHUDInputs();
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
      cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar.yaw);
      cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
      cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
      cameraOrbit.freeRoamMoveInputSig = '0:0';
      const jumpDist = Math.hypot(pose.x - prevCharX, pose.z - prevCharZ);
      if (jumpDist >= 0.45 && this.audio) {
        this.audio.triggerFootstep('Walk', 1.0);
      }
      activeChar.freezeToIdle();
      activeChar.root.position.copy(activeChar.position);
      activeChar.setYawImmediate(activeChar.yaw);
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
    updateCameraController(smooth ? 1 / 60 : 0.0);
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
    cameraOrbit.pointerId = null;
    cameraOrbit.userLookOverride = false;
    mobileTouch.reset();

    document.body.classList.remove('freeroam-mode');
    document.body.classList.remove('mount-focus-mode');
    document.body.classList.remove('mount-pointer-hover');
    this.mode = 'scroll';
    this.scrollVelocity = 0.0;

    let destProgress;
    if (typeof targetFraction === 'number' && !Number.isNaN(targetFraction)) {
      destProgress = Math.max(0.0, Math.min(0.99, targetFraction));
    } else if (activeChar.position.z < 2.95 && getCurrentScrollEntranceProgressWindow() > 0.0) {
      destProgress = 0.0;
    } else {
      destProgress = Math.max(
        0.0,
        Math.min(
          0.98,
          mapCorridorToRawScrollProgress(interpolateProgressFromCorridorZ(activeChar.position.z))
        )
      );
    }

    this.scrollProgress = destProgress;
    this.targetScrollProgress = destProgress;
    syncWindowScrollToFraction(destProgress);

    const pose = evaluateScrollCorridorPath(destProgress);
    activeChar.position.set(pose.x, env.floorY, pose.z);
    activeChar.yaw = destProgress <= 0.001 ? env.spawnPlayerYaw : pose.forwardYaw;
    activeChar.freezeToIdle();
    activeChar.setYawImmediate(activeChar.yaw);
    activeChar.mixer.update(0.0);
    activeChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
    activeChar.root.updateMatrixWorld(true);

    if (idleChar) {
      idleChar.position.set(env.spawnNpcPos.x, env.floorY, env.spawnNpcPos.z);
      idleChar.yaw = env.spawnNpcYaw;
      idleChar.freezeToIdle();
      idleChar.setYawImmediate(idleChar.yaw);
      idleChar.mixer.update(0.0);
      idleChar.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value);
      idleChar.root.updateMatrixWorld(true);
    }

    cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar.yaw);
    cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveInputSig = '0:0';
    cameraOrbit.pitch = characterCameraState.pitchRad;
    cameraOrbit.desiredDistance = characterCameraState.distance;
    if (
      destProgress <= 0.001 &&
      this.director &&
      !this.director.editMode &&
      !characterCameraState.panelOpen &&
      !characterCameraState.positioningMode &&
      this.director.cameraPanState.mode === 'orbit'
    ) {
      this.director.cameraPanState.mode = 'settled';
    }

    if (this.runningEffects) {
      this.runningEffects.quiesceImmediately();
    }
    if (this.characterShadows) {
      this.characterShadows.update(0.0, holoShaderUniforms.uHoloTime.value, this);
    }

    updateWallScreenMounts();
    updateProximityAndHoverWallMounts();
    updateCameraController(0.0);
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
    if (!nextChar) return prevChar;

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
      this.currentVariantKey =
        nextChar.rigProfile === 'SKATE3_RX2_RIG'
          ? 'platodoom_skate3'
          : nextChar.isHoloShaderActive
          ? 'platodoom_holo'
          : 'platodoom_color';
      this.activeVariantKey = this.currentVariantKey;
    } else if (
      this.activeCharacterId === 'hoodie' &&
      String(this.currentVariantKey).startsWith('platodoom_')
    ) {
      this.currentVariantKey =
        nextChar.rigProfile === 'SKATE3_RX2_RIG'
          ? 'luis_skate3'
          : nextChar.isHoloShaderActive
          ? 'luis_holo'
          : 'luis_color';
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
      const assetUrl = spec.url || spec.path;
      const gltf = await loadGLB(this.variantLoader, assetUrl);
      if (gltf.animations && gltf.animations.length > 0) {
        raiseFatalError(
          `Character variant '${assetUrl}' contains ${gltf.animations.length} prohibited embedded legacy animation clips.`
        );
      }
      if (
        spec.characterSlot === 'hoodie' &&
        !gltf.scene.getObjectByName('DOOM_Companion') &&
        this.variantCache.luis_holo &&
        this.variantCache.luis_holo.companionMesh
      ) {
        const srcComp = this.variantCache.luis_holo.companionMesh;
        const clonedComp = srcComp.clone();
        clonedComp.name = 'DOOM_Companion';
        clonedComp.geometry = srcComp.geometry.clone();
        clonedComp.position.copy(this.variantCache.luis_holo.companionAnchor);
        clonedComp.rotation.set(0, 0, 0);
        // Remove any cloned hitProxy child before CharacterController constructor creates a fresh one
        const staleProxies = [];
        clonedComp.traverse((child) => {
          if (child !== clonedComp && child.name && child.name.startsWith('DOOM_Companion_HitProxy')) {
            staleProxies.push(child);
          }
        });
        for (const sp of staleProxies) {
          if (sp.parent) sp.parent.remove(sp);
        }
        gltf.scene.add(clonedComp);
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
      controller.root.animations = controller.adaptedClips || this.sharedClips;
      this.variantCache[variantKey] = controller;
    }

    if (currentChar !== controller) {
      scene.remove(currentChar.root);
      scene.add(controller.root);
      if (this.sceneMaterialization) {
        this.sceneMaterialization.registerSceneMaterials(controller.root);
      }
      this.characters[spec.characterSlot] = controller;
      window.__THREE_ANIMATION_MIXERS__ = [
        this.characters.hoodie.mixer,
        ...(this.characters.tunic ? [this.characters.tunic.mixer] : []),
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
  window.sandbox = sandbox;
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

  if (sandbox.mode === 'mount-focus' || sandbox.isPortalPopupOpen) {
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
  const idleChar = sandbox.getIdleCharacter();
  const env = sandbox.environment;
  const spawnPos = sandbox.director ? sandbox.director.spawnState : (env ? env.spawnPlayerPos : { x: 0.0, z: 3.0 });
  const spawnYaw = sandbox.director ? sandbox.director.spawnState.yawRad : (env ? env.spawnPlayerYaw : 0.0);
  const approachLen = spawnPos.z < 3.0 ? Math.hypot(spawnPos.x, 3.0 - spawnPos.z) : 0.0;
  const pathLength = Math.max(1.0, (SCROLL_TERMINAL_Z - Math.max(3.0, spawnPos.z)) + approachLen);

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
  const posXZ = { x: pose.x, z: pose.z };
  const rawVelX = dt > 1e-6 && Math.abs(sandbox.scrollVelocity) > 1e-4 ? (pose.x - prevX) / dt : 0.0;
  const rawVelZ = dt > 1e-6 && Math.abs(sandbox.scrollVelocity) > 1e-4 ? (pose.z - prevZ) / dt : 0.0;
  const velXZ = { x: rawVelX, z: rawVelZ };

  if (env && env.wallSegments) {
    if (idleChar && sandbox.scrollProgress > 0.002 && !sandbox.soloCharacterMode) {
      const idleXZ = { x: idleChar.position.x, z: idleChar.position.z };
      resolveCharacterSeparation(posXZ, velXZ, idleXZ, CHAR_SEPARATION_DIST);
    }
    resolveCircleAgainstWalls(posXZ, velXZ, CHAR_COLLISION_RADIUS, env.wallSegments);
  }

  const yStart = sandbox.director ? sandbox.director.spawnState.y : env.floorY;
  const surf = env
    ? sampleSurfaceHeightAndNormal(posXZ.x, posXZ.z, env.floorTriangles, activeChar.position.y)
    : { onFloor: false, height: 0.0 };
  const targetFloorY = surf.onFloor ? surf.height : env.floorY;
  const uY = Math.min(1.0, sandbox.scrollProgress / 0.05);
  const charY = yStart + (targetFloorY - yStart) * uY;
  activeChar.position.set(posXZ.x, charY, posXZ.z);
  activeChar.isGrounded = true;

  const frameStepDist = Math.hypot(posXZ.x - prevX, posXZ.z - prevZ);
  if (dt > 1e-6 && Math.abs(sandbox.scrollVelocity) > 1e-4) {
    activeChar.velocity.set(
      (posXZ.x - prevX) / dt,
      0.0,
      (posXZ.z - prevZ) / dt
    );
  } else {
    activeChar.velocity.set(0.0, 0.0, 0.0);
  }

  let targetYaw = activeChar.yaw;
  if (sandbox.scrollVelocity > 0.02) {
    targetYaw = pose.forwardYaw;
  } else if (sandbox.scrollVelocity < -0.18) {
    targetYaw = pose.backwardYaw;
  } else if (sandbox.scrollProgress <= 0.001) {
    targetYaw = spawnYaw;
  } else if (sandbox.scrollProgress >= 0.999) {
    targetYaw = 0.0;
  } else {
    targetYaw = pose.forwardYaw;
  }

  activeChar.root.position.copy(activeChar.position);
  if (
    Math.abs(sandbox.scrollVelocity) <= 0.02 &&
    (sandbox.scrollProgress <= 0.0005 || sandbox.scrollProgress >= 0.9995)
  ) {
    activeChar.setYawImmediate(targetYaw);
  } else {
    activeChar.slerpYawToward(targetYaw, dt, 10.5);
  }

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

  if (Math.abs(sandbox.scrollVelocity) > 0.01 && !cameraOrbit.isDragging) {
    cameraOrbit.userLookOverride = false;
  }

  if (!(sandbox.director && sandbox.director.editMode) && !cameraOrbit.userLookOverride && !cameraOrbit.isDragging) {
    cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar.yaw);
    cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveInputSig = '0:0';
    cameraOrbit.pitch = characterCameraState.pitchRad;
    cameraOrbit.desiredDistance = characterCameraState.distance;
  }

  if (sandbox.targetScrollProgress >= 0.999 && sandbox.scrollProgress >= 0.9995) {
    const endPose = evaluateScrollCorridorPath(1.0);
    activeChar.position.set(endPose.x, env.floorY, endPose.z);
    activeChar.velocity.set(0.0, 0.0, 0.0);
    activeChar.yaw = 0.0;
    activeChar.root.position.copy(activeChar.position);
    activeChar.root.rotation.set(0.0, activeChar.yaw, 0.0);
    cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(activeChar.yaw);
    cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveBasisYaw = activeChar.yaw;
    cameraOrbit.freeRoamMoveInputSig = '0:0';
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

    const kbFwd = forwardPos - forwardNeg;
    const kbRight = rightPos - rightNeg;
    const hasKbFly = kbFwd !== 0.0 || kbRight !== 0.0;
    const padFlyActive = Boolean(mobileTouch && mobileTouch.magnitude >= THUMBPAD_DEADZONE);

    const forwardInput = hasKbFly ? kbFwd : padFlyActive ? mobileTouch.ly : 0.0;
    const rightInput = hasKbFly ? kbRight : padFlyActive ? mobileTouch.lx : 0.0;
    const verticalInput = upPos - downNeg;
    const isBoost = Boolean(
      keysPressed.ShiftLeft ||
        keysPressed.ShiftRight ||
        (padFlyActive && !hasKbFly && mobileTouch.isSprinting)
    );
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

  // In Mount Focus Mode or Portal Game Selector Mode, Character "X" remains quiescent in Idle or Talking (§5.1)
  if (sandbox.mode === 'mount-focus' || sandbox.isPortalPopupOpen) {
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

  const forwardPos = keysPressed.KeyW || keysPressed.ArrowUp ? 1.0 : 0.0;
  const forwardNeg = keysPressed.KeyS || keysPressed.ArrowDown ? 1.0 : 0.0;
  const rightPos = keysPressed.KeyD || keysPressed.ArrowRight ? 1.0 : 0.0;
  const rightNeg = keysPressed.KeyA || keysPressed.ArrowLeft ? 1.0 : 0.0;

  const kbForwardInput = forwardPos - forwardNeg;
  const kbRightInput = rightPos - rightNeg;
  const hasKeyboardMove = kbForwardInput !== 0.0 || kbRightInput !== 0.0;
  const padActive = Boolean(mobileTouch && mobileTouch.magnitude >= THUMBPAD_DEADZONE);

  const forwardInput = hasKeyboardMove ? kbForwardInput : padActive ? mobileTouch.ly : 0.0;
  const rightInput = hasKeyboardMove ? kbRightInput : padActive ? mobileTouch.lx : 0.0;
  const hasMovementInput = Math.hypot(forwardInput, rightInput) > 1e-4;
  const inputSig = hasMovementInput
    ? hasKeyboardMove
      ? `${Math.sign(kbForwardInput)}:${Math.sign(kbRightInput)}`
      : 'pad'
    : '0:0';

  cameraOrbit.freeRoamMoveInputSig = inputSig;
  const moveBasisYaw = Number.isFinite(cameraOrbit.yaw) ? cameraOrbit.yaw : activeChar.yaw;
  cameraOrbit.freeRoamMoveBasisYaw = moveBasisYaw;

  tempCamForward.set(Math.sin(moveBasisYaw), 0.0, Math.cos(moveBasisYaw)).normalize();
  tempCamRight.crossVectors(tempCamForward, WORLD_UP).normalize();

  const isSprinting = Boolean(
    keysPressed.ShiftLeft ||
      keysPressed.ShiftRight ||
      (padActive && !hasKeyboardMove && mobileTouch.isSprinting)
  );
  const walkSpeedScale =
    padActive && !hasKeyboardMove && !isSprinting ? mobileTouch.walkSpeedFactor : 1.0;

  if (hasMovementInput || jumpRequested || keysPressed.Space) {
    if (activeChar.customEmoteActive) activeChar.customEmoteActive = false;
    if (activeChar.dialogueActive) activeChar.stopDialogue();
  }

  const moveDirX = tempCamForward.x * forwardInput + tempCamRight.x * rightInput;
  const moveDirZ = tempCamForward.z * forwardInput + tempCamRight.z * rightInput;
  const moveLen = Math.hypot(moveDirX, moveDirZ);
  const normDirX = moveLen > 1e-6 ? moveDirX / moveLen : 0.0;
  const normDirZ = moveLen > 1e-6 ? moveDirZ / moveLen : 0.0;

  const targetSpeed = hasMovementInput
    ? isSprinting
      ? RUN_SPEED
      : WALK_SPEED * walkSpeedScale
    : 0.0;
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
    activeChar.slerpYawToward(targetYaw, dt, TURN_SPEED);
    if (!(sandbox.director && sandbox.director.editMode) && !cameraOrbit.isDragging) {
      cameraOrbit._lastSyncedCharYaw = activeChar.yaw;
    }
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
  const idleXZ = idleChar ? { x: idleChar.position.x, z: idleChar.position.z } : null;

  for (let s = 0; s < subSteps; s++) {
    posXZ.x += velXZ.x * subDt;
    posXZ.z += velXZ.z * subDt;
    if (idleXZ) {
      resolveCharacterSeparation(posXZ, velXZ, idleXZ, CHAR_SEPARATION_DIST);
    }
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
  if (!hasMovementInput) {
    activeChar.setYawImmediate(activeChar.yaw);
  }

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
      if (isSprinting && (hasMovementInput || currentPlanarSpeed > WALK_SPEED * 1.1)) {
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
function computeThirdPersonCameraPose(dt = 1 / 60) {
  const tStartMs = typeof performance !== 'undefined' ? performance.now() : 0.0;
  const activeChar = sandbox.getActiveCharacter();
  const env = sandbox.environment;

  const isDirectorOrFly = Boolean(
    (sandbox.director && (sandbox.director.editMode || sandbox.director.cameraPOVMode)) ||
      sandbox.freeRoamFlyMode
  );

  const bypassWallClamp = Boolean(
    sandbox.freeRoamFlyMode ||
      !sandbox.cameraWallClampEnabled ||
      !characterCameraState.wallClampEnabled ||
      (sandbox.director && sandbox.director.cameraPOVMode)
  );

  const psi = Number.isFinite(cameraOrbit.yaw) ? cameraOrbit.yaw : characterCameraState.yawOffsetRad;
  const theta = Number.isFinite(cameraOrbit.pitch) ? cameraOrbit.pitch : characterCameraState.pitchRad;

  // Keep activeChar's local camera socket hierarchy synchronized with the decoupled world camera yaw
  if (activeChar && typeof activeChar.syncCameraSocketRig === 'function') {
    const extraYawRad = wrapAngleRad(psi - resolveCharacterAlignedCameraYaw(activeChar.yaw));
    activeChar.syncCameraSocketRig(
      characterCameraState,
      extraYawRad,
      theta,
      cameraOrbit.desiredDistance
    );
  }

  // ==========================================================================
  // Aspect-Ratio Dynamic Follow-Offset Scaling (Spec 070 §7 / dynamic_cam.md)
  // ==========================================================================
  const currentViewportAspect =
    typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0
      ? window.innerWidth / window.innerHeight
      : Number.isFinite(camera.aspect) && camera.aspect > 0.05
        ? camera.aspect
        : 16 / 9;
  if (Math.abs(camera.aspect - currentViewportAspect) > 1e-4) {
    camera.aspect = currentViewportAspect;
    camera.updateProjectionMatrix();
  }
  const dynFollowOffsets = evaluateDynamicCameraFollowOffsets(
    currentViewportAspect,
    cameraOrbit.desiredDistance,
    characterCameraState.pivotHeightY,
    characterCameraState.shoulderOffsetX
  );
  cameraOrbit.viewportAspect = dynFollowOffsets.aspectRatio;
  cameraOrbit.portraitFactor = dynFollowOffsets.portraitFactor;
  cameraOrbit.effectiveDesiredDistance = dynFollowOffsets.effectiveDesiredDistance;
  cameraOrbit.effectivePivotHeightY = dynFollowOffsets.effectivePivotHeightY;
  cameraOrbit.effectiveShoulderOffsetX = dynFollowOffsets.effectiveShoulderOffsetX;

  // ==========================================================================
  // Spring Arm Stage 1: Spine-to-Shoulder Socket Sweep (Spec 068 §4 & §5.3)
  // ==========================================================================
  const charX = activeChar ? activeChar.position.x : 0.0;
  const charY = activeChar ? activeChar.position.y : 0.0;
  const charZ = activeChar ? activeChar.position.z : 3.0;
  const pivotHeightY = dynFollowOffsets.effectivePivotHeightY;
  const shoulderOffsetX = dynFollowOffsets.effectiveShoulderOffsetX;
  const forwardOffsetZ = characterCameraState.forwardOffsetZ;
  const effectiveDesiredDist = dynFollowOffsets.effectiveDesiredDistance;

  const spinePos = cameraOrbit._tempSpinePos.set(charX, charY + pivotHeightY, charZ);
  const fCamX = Math.sin(psi);
  const fCamZ = Math.cos(psi);
  const rCamX = -Math.cos(psi);
  const rCamZ = Math.sin(psi);

  const dSocketX = rCamX * shoulderOffsetX + fCamX * forwardOffsetZ;
  const dSocketZ = rCamZ * shoulderOffsetX + fCamZ * forwardOffsetZ;
  const socketLen = Math.hypot(dSocketX, dSocketZ);
  const safeSocketPos = cameraOrbit._tempSafeSocketPos.copy(spinePos);

  if (socketLen > 1e-5) {
    const sockDirX = dSocketX / socketLen;
    const sockDirZ = dSocketZ / socketLen;
    let safeSocketLen = socketLen;

    if (!bypassWallClamp && env) {
      const maxSockCast = socketLen + CAM_SPRING_ARM_PROBE_RADIUS;
      if (env.wallSegments) {
        for (let i = 0; i < env.wallSegments.length; i++) {
          const seg = env.wallSegments[i];
          if (seg.colliderName === 'COLLIDER_BOUND_START') continue;
          const hitDist = intersectRay2DSegment(
            spinePos.x,
            spinePos.z,
            sockDirX,
            sockDirZ,
            maxSockCast,
            seg.ax,
            seg.az,
            seg.bx,
            seg.bz
          );
          if (hitDist !== null) {
            safeSocketLen = Math.min(safeSocketLen, Math.max(0.0, hitDist - CAM_SPRING_ARM_PROBE_RADIUS));
          }
        }
      }

      if (env.colliderMeshList && env.colliderMeshList.length > 0) {
        cameraOrbit._tempSocketDir.set(sockDirX, 0.0, sockDirZ);
        raycaster.set(spinePos, cameraOrbit._tempSocketDir);
        raycaster.near = 0.02;
        raycaster.far = maxSockCast;
        const sockHits = [];
        for (const mesh of env.colliderMeshList) {
          if (mesh.name === 'COLLIDER_BOUND_START') continue;
          mesh.raycast(raycaster, sockHits);
        }
        if (sockHits.length > 0) {
          sockHits.sort((a, b) => a.distance - b.distance);
          safeSocketLen = Math.min(
            safeSocketLen,
            Math.max(0.0, sockHits[0].distance - CAM_SPRING_ARM_PROBE_RADIUS)
          );
        }
      }
    }

    safeSocketPos.x = spinePos.x + sockDirX * safeSocketLen;
    safeSocketPos.z = spinePos.z + sockDirZ * safeSocketLen;
  }

  if (!bypassWallClamp && env && env.wallSegments) {
    clampCameraCircleAgainstWalls(safeSocketPos, CAM_SPRING_ARM_PROBE_RADIUS, env.wallSegments);
  }

  cameraOrbit.pivotTarget.copy(safeSocketPos);
  cameraOrbit._tempEuler.set(theta, psi + Math.PI, 0.0, 'YXZ');
  cameraOrbit.targetQuat.setFromEuler(cameraOrbit._tempEuler);

  const shouldSnapImmediate = Boolean(
    !(dt > 0.0) ||
      !cameraOrbit.rigInitialized ||
      cameraOrbit.isDragging ||
      (mobileTouch && mobileTouch.lookThumbpadActive) ||
      characterCameraState.positioningMode ||
      isDirectorOrFly
  );

  if (shouldSnapImmediate) {
    cameraOrbit.pivotCurrent.copy(cameraOrbit.pivotTarget);
    cameraOrbit.currentQuat.copy(cameraOrbit.targetQuat);
    cameraOrbit.rigInitialized = true;
  } else {
    const pivotAlpha = 1.0 - Math.exp(-18.0 * dt);
    const rotAlpha = 1.0 - Math.exp(-14.0 * dt);
    cameraOrbit.pivotCurrent.lerp(cameraOrbit.pivotTarget, pivotAlpha);
    cameraOrbit.currentQuat.slerp(cameraOrbit.targetQuat, rotAlpha);
  }

  if (!bypassWallClamp && env && env.wallSegments) {
    clampCameraCircleAgainstWalls(
      cameraOrbit.pivotCurrent,
      CAM_SPRING_ARM_PROBE_RADIUS,
      env.wallSegments
    );
  }

  // ==========================================================================
  // Spring Arm Stage 2: Shoulder-to-Eye Longitudinal Boom Sweep (Spec 068 §5.3)
  // ==========================================================================
  cameraOrbit._tempBackDir.set(0.0, 0.0, 1.0).applyQuaternion(cameraOrbit.currentQuat).normalize();
  const dirX = cameraOrbit._tempBackDir.x;
  const dirY = cameraOrbit._tempBackDir.y;
  const dirZ = cameraOrbit._tempBackDir.z;

  let clampedDist = effectiveDesiredDist;

  if (!bypassWallClamp && env) {
    const horizLen = Math.hypot(dirX, dirZ);
    if (horizLen > 1e-5 && env.wallSegments) {
      const hdx = dirX / horizLen;
      const hdz = dirZ / horizLen;
      const maxHorizDist = effectiveDesiredDist * horizLen + CAM_SPRING_ARM_PROBE_RADIUS;

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
          const hit3DDist = (hitHoriz - CAM_SPRING_ARM_PROBE_RADIUS) / horizLen;
          if (hit3DDist < clampedDist) {
            clampedDist = Math.max(CAM_MIN_BOOM_DISTANCE, hit3DDist);
          }
        }
      }
    }

    if (env.colliderMeshList && env.colliderMeshList.length > 0) {
      tempRayDir.set(dirX, dirY, dirZ).normalize();
      raycaster.set(cameraOrbit.pivotCurrent, tempRayDir);
      raycaster.near = 0.02;
      raycaster.far = effectiveDesiredDist + CAM_SPRING_ARM_PROBE_RADIUS;

      const hits = [];
      for (const mesh of env.colliderMeshList) {
        if (mesh.name === 'COLLIDER_BOUND_START') continue;
        mesh.raycast(raycaster, hits);
      }
      if (hits.length > 0) {
        hits.sort((a, b) => a.distance - b.distance);
        const hitDist = hits[0].distance - CAM_SPRING_ARM_PROBE_RADIUS;
        if (hitDist < clampedDist) {
          clampedDist = Math.max(CAM_MIN_BOOM_DISTANCE, hitDist);
        }
      }
    }
  }

  if (shouldSnapImmediate) {
    cameraOrbit.effectiveDistance = clampedDist;
  } else {
    const distLambda =
      clampedDist < cameraOrbit.effectiveDistance
        ? CAM_SPRING_ARM_LAMBDA_IN
        : CAM_SPRING_ARM_LAMBDA_OUT;
    cameraOrbit.effectiveDistance = THREE.MathUtils.damp(
      cameraOrbit.effectiveDistance,
      clampedDist,
      distLambda,
      dt
    );
    if (!bypassWallClamp && clampedDist < cameraOrbit.effectiveDistance) {
      cameraOrbit.effectiveDistance = Math.min(cameraOrbit.effectiveDistance, clampedDist + 0.015);
    }
  }

  const minCamY =
    sandbox.freeRoamFlyMode || (sandbox.director && (sandbox.director.cameraPOVMode || sandbox.director.editMode))
      ? -50.0
      : charY - 0.50;
  tempDesiredCamPos.set(
    cameraOrbit.pivotCurrent.x + dirX * cameraOrbit.effectiveDistance,
    Math.max(minCamY, cameraOrbit.pivotCurrent.y + dirY * cameraOrbit.effectiveDistance),
    cameraOrbit.pivotCurrent.z + dirZ * cameraOrbit.effectiveDistance
  );

  // ==========================================================================
  // Post-Boom Frustum Circle Clamp & Character Head-Clearance Guard (Spec 068 §5.3)
  // ==========================================================================
  if (!bypassWallClamp && env && env.wallSegments) {
    const preClampEyeX = tempDesiredCamPos.x;
    const preClampEyeZ = tempDesiredCamPos.z;
    clampCameraCircleAgainstWalls(
      tempDesiredCamPos,
      CAM_SPRING_ARM_PROBE_RADIUS,
      env.wallSegments
    );

    const headCenterY = charY + 1.65;
    if (Math.abs(tempDesiredCamPos.y - headCenterY) < 0.65) {
      let dxHead = tempDesiredCamPos.x - charX;
      let dzHead = tempDesiredCamPos.z - charZ;
      let distHead = Math.hypot(dxHead, dzHead);

      if (distHead < CAM_HEAD_CLEARANCE_RADIUS) {
        const wallPushX = tempDesiredCamPos.x - preClampEyeX;
        const wallPushZ = tempDesiredCamPos.z - preClampEyeZ;
        const wallPushLen = Math.hypot(wallPushX, wallPushZ);

        // First try radial push along camera offset/boom direction
        const prefDirX = dSocketX + dirX * cameraOrbit.effectiveDistance;
        const prefDirZ = dSocketZ + dirZ * cameraOrbit.effectiveDistance;
        const prefLen = Math.hypot(prefDirX, prefDirZ);
        const radUnitX = distHead > 1e-4 ? dxHead / distHead : prefLen > 1e-4 ? prefDirX / prefLen : rCamX;
        const radUnitZ = distHead > 1e-4 ? dzHead / distHead : prefLen > 1e-4 ? prefDirZ / prefLen : rCamZ;

        tempDesiredCamPos.x = charX + radUnitX * CAM_HEAD_CLEARANCE_RADIUS;
        tempDesiredCamPos.z = charZ + radUnitZ * CAM_HEAD_CLEARANCE_RADIUS;
        clampCameraCircleAgainstWalls(
          tempDesiredCamPos,
          CAM_SPRING_ARM_PROBE_RADIUS,
          env.wallSegments
        );

        dxHead = tempDesiredCamPos.x - charX;
        dzHead = tempDesiredCamPos.z - charZ;
        distHead = Math.hypot(dxHead, dzHead);

        // If wall clamp compressed the radial push back inside r_head, slide tangentially along the wall interior
        if (distHead < CAM_HEAD_CLEARANCE_RADIUS) {
          let nWallX = wallPushLen > 1e-4 ? wallPushX / wallPushLen : 0.0;
          let nWallZ = wallPushLen > 1e-4 ? wallPushZ / wallPushLen : 0.0;
          if (Math.hypot(nWallX, nWallZ) < 1e-4) {
            nWallX = charX >= 0.0 ? -1.0 : 1.0;
            nWallZ = 0.0;
          }
          let tangX = -nWallZ;
          let tangZ = nWallX;
          if (tangX * prefDirX + tangZ * prefDirZ < 0.0) {
            tangX = -tangX;
            tangZ = -tangZ;
          }
          const projNorm = dxHead * nWallX + dzHead * nWallZ;
          const remSq = Math.max(0.0, CAM_HEAD_CLEARANCE_RADIUS * CAM_HEAD_CLEARANCE_RADIUS - projNorm * projNorm);
          const tangDist = Math.sqrt(remSq) + 0.004;
          tempDesiredCamPos.x = charX + nWallX * projNorm + tangX * tangDist;
          tempDesiredCamPos.z = charZ + nWallZ * projNorm + tangZ * tangDist;
          clampCameraCircleAgainstWalls(
            tempDesiredCamPos,
            CAM_SPRING_ARM_PROBE_RADIUS,
            env.wallSegments
          );
        }
      }
    }

    cameraOrbit.lastPivotWallClearance = computeMinimumSignedWallClearance(
      cameraOrbit.pivotCurrent,
      env.wallSegments
    );
    cameraOrbit.lastEyeWallClearance = computeMinimumSignedWallClearance(
      tempDesiredCamPos,
      env.wallSegments
    );
    cameraOrbit.lastHeadClearance = Math.hypot(
      tempDesiredCamPos.x - charX,
      tempDesiredCamPos.z - charZ
    );
    cameraOrbit.pivotWallClearanceM = cameraOrbit.lastPivotWallClearance;
    cameraOrbit.eyeWallClearanceM = cameraOrbit.lastEyeWallClearance;
  }

  const lookForwardDist = Math.max(1.0, cameraOrbit.effectiveDistance);
  cameraOrbit._tempLookAtPos.set(
    tempDesiredCamPos.x - dirX * lookForwardDist,
    tempDesiredCamPos.y - dirY * lookForwardDist,
    tempDesiredCamPos.z - dirZ * lookForwardDist
  );

  if (typeof performance !== 'undefined') {
    cameraOrbit.lastSpringArmSolveMs = Number((performance.now() - tStartMs).toFixed(4));
  }

  return {
    cameraPos: tempDesiredCamPos,
    pivotPos: cameraOrbit.pivotCurrent,
    lookAtPos: cameraOrbit._tempLookAtPos,
    cameraQuat: cameraOrbit.currentQuat,
  };
}

function resolveScrollRestOrOrbitCameraPose(orbitState = computeThirdPersonCameraPose()) {
  if (
    sandbox.mode === 'scroll' &&
    !characterCameraState.panelOpen &&
    !characterCameraState.positioningMode &&
    sandbox.director &&
    sandbox.director.cameraPanState &&
    sandbox.director.cameraPanState.mode === 'settled' &&
    sandbox.scrollProgress <= 0.0005
  ) {
    return {
      cameraPos: sandbox.director.cameraPanState.endPos,
      pivotPos: sandbox.director.cameraPanState.endLookAt,
    };
  }
  return orbitState;
}

function updateCameraController(dt = 1 / 60) {
  const activeChar = sandbox.getActiveCharacter();
  const orbitState = computeThirdPersonCameraPose(dt);

  if (doomChatCameraState.active && sandbox.isDoomChatOpen) {
    const targetChar = sandbox.getDoomChatCharacter() || activeChar;
    const destPose = computeDoomChatCameraPose(targetChar);
    doomChatCameraState.toPos.copy(destPose.cameraPos);
    doomChatCameraState.toLookAt.copy(destPose.lookAtPos);

    if (doomChatCameraState.transitionProgress < 1.0) {
      doomChatCameraState.transitionProgress = Math.min(
        1.0,
        doomChatCameraState.transitionProgress + dt / DOOM_CHAT_TRANSITION_DURATION
      );
    }
    const t = doomChatCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      doomChatCameraState.fromPos,
      doomChatCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      doomChatCameraState.fromLookAt,
      doomChatCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);
    camera.updateMatrixWorld(true);
  } else if (doomChatCameraState.returningToOrbit) {
    const returnTargetPose = resolveScrollRestOrOrbitCameraPose(orbitState);
    doomChatCameraState.toPos.copy(returnTargetPose.cameraPos);
    doomChatCameraState.toLookAt.copy(returnTargetPose.pivotPos);
    doomChatCameraState.transitionProgress = Math.min(
      1.0,
      doomChatCameraState.transitionProgress + dt / DOOM_CHAT_TRANSITION_DURATION
    );
    const t = doomChatCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      doomChatCameraState.fromPos,
      doomChatCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      doomChatCameraState.fromLookAt,
      doomChatCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);

    if (doomChatCameraState.transitionProgress >= 1.0) {
      doomChatCameraState.returningToOrbit = false;
    }
  } else if (stickerPopupCameraState.active && sandbox.isStickerPopupOpen) {
    const activeStickerRec = getActiveOrSelectedStickerRecord();
    if (!activeStickerRec) {
      stickerPopupCameraState.active = false;
      stickerPopupCameraState.returningToOrbit = true;
      stickerPopupCameraState.fromPos.copy(camera.position);
      stickerPopupCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      stickerPopupCameraState.toPos.copy(orbitState.cameraPos);
      stickerPopupCameraState.toLookAt.copy(orbitState.pivotPos);
      stickerPopupCameraState.transitionProgress = 0.0;
    } else {
      const destPose = computeStickerPopupCameraPose(activeStickerRec);
      if (destPose) {
        stickerPopupCameraState.toPos.copy(destPose.camPos);
        stickerPopupCameraState.toLookAt.copy(destPose.lookAtPos);
      }
      if (stickerPopupCameraState.transitionProgress < 1.0) {
        stickerPopupCameraState.transitionProgress = Math.min(
          1.0,
          stickerPopupCameraState.transitionProgress + dt / STICKER_POPUP_CAM_TRANSITION_DURATION
        );
      }
      const t = stickerPopupCameraState.transitionProgress;
      const ease = 1.0 - Math.pow(1.0 - t, 3);

      camera.position.lerpVectors(
        stickerPopupCameraState.fromPos,
        stickerPopupCameraState.toPos,
        ease
      );
      mountFocusCameraState.currentLookAt.lerpVectors(
        stickerPopupCameraState.fromLookAt,
        stickerPopupCameraState.toLookAt,
        ease
      );
      camera.lookAt(mountFocusCameraState.currentLookAt);
      camera.updateMatrixWorld(true);
    }
  } else if (stickerPopupCameraState.returningToOrbit) {
    stickerPopupCameraState.toPos.copy(orbitState.cameraPos);
    stickerPopupCameraState.toLookAt.copy(orbitState.pivotPos);
    stickerPopupCameraState.transitionProgress = Math.min(
      1.0,
      stickerPopupCameraState.transitionProgress + dt / STICKER_POPUP_CAM_TRANSITION_DURATION
    );
    const t = stickerPopupCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      stickerPopupCameraState.fromPos,
      stickerPopupCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      stickerPopupCameraState.fromLookAt,
      stickerPopupCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);

    if (stickerPopupCameraState.transitionProgress >= 1.0) {
      stickerPopupCameraState.returningToOrbit = false;
    }
  } else if (popupFocusCameraState.active && sandbox.isPopupFocused && sandbox.mathPodPopups) {
    const callout = sandbox.mathPodPopups.getCallout(sandbox.focusedMathPodPopupId);
    if (!callout || (!callout.isVisible && callout.state === 'DORMANT')) {
      sandbox.isPopupFocused = false;
      sandbox.focusedMathPodPopupId = null;
      popupFocusCameraState.active = false;
      popupFocusCameraState.returningToOrbit = true;
      popupFocusCameraState.fromPos.copy(camera.position);
      popupFocusCameraState.fromLookAt.copy(mountFocusCameraState.currentLookAt);
      popupFocusCameraState.toPos.copy(orbitState.cameraPos);
      popupFocusCameraState.toLookAt.copy(orbitState.pivotPos);
      popupFocusCameraState.transitionProgress = 0.0;
    } else {
      const calloutCenterX = callout.rootGroup.position.x;
      const calloutCenterY =
        callout.rootGroup.position.y + (callout.billboardGroup ? callout.billboardGroup.position.y : 0.0);
      const calloutCenterZ = callout.rootGroup.position.z;
      const dx = popupFocusCameraState.viewOffset.x;
      const dz = popupFocusCameraState.viewOffset.z;
      const horizDist = Math.hypot(dx, dz) || 1.0;
      const fwdX = -dx / horizDist;
      const fwdZ = -dz / horizDist;
      const camRightX = -fwdZ;
      const camRightZ = fwdX;
      const hudClearanceOffset = !IS_DEV_MODE || sandbox.sidebarCollapsed ? 0.0 : 0.18;

      popupFocusCameraState.toPos.set(
        calloutCenterX + dx,
        calloutCenterY + popupFocusCameraState.viewOffset.y,
        calloutCenterZ + dz
      );
      popupFocusCameraState.toLookAt.set(
        calloutCenterX - camRightX * hudClearanceOffset,
        calloutCenterY,
        calloutCenterZ - camRightZ * hudClearanceOffset
      );

      if (popupFocusCameraState.transitionProgress < 1.0) {
        popupFocusCameraState.transitionProgress = Math.min(
          1.0,
          popupFocusCameraState.transitionProgress + dt / FOCUS_TRANSITION_DURATION
        );
      }
      const t = popupFocusCameraState.transitionProgress;
      const ease = 1.0 - Math.pow(1.0 - t, 3);

      camera.position.lerpVectors(
        popupFocusCameraState.fromPos,
        popupFocusCameraState.toPos,
        ease
      );
      mountFocusCameraState.currentLookAt.lerpVectors(
        popupFocusCameraState.fromLookAt,
        popupFocusCameraState.toLookAt,
        ease
      );
      camera.lookAt(mountFocusCameraState.currentLookAt);
    }
  } else if (popupFocusCameraState.returningToOrbit) {
    popupFocusCameraState.toPos.copy(orbitState.cameraPos);
    popupFocusCameraState.toLookAt.copy(orbitState.pivotPos);
    popupFocusCameraState.transitionProgress = Math.min(
      1.0,
      popupFocusCameraState.transitionProgress + dt / FOCUS_TRANSITION_DURATION
    );
    const t = popupFocusCameraState.transitionProgress;
    const ease = 1.0 - Math.pow(1.0 - t, 3);

    camera.position.lerpVectors(
      popupFocusCameraState.fromPos,
      popupFocusCameraState.toPos,
      ease
    );
    mountFocusCameraState.currentLookAt.lerpVectors(
      popupFocusCameraState.fromLookAt,
      popupFocusCameraState.toLookAt,
      ease
    );
    camera.lookAt(mountFocusCameraState.currentLookAt);

    if (popupFocusCameraState.transitionProgress >= 1.0) {
      popupFocusCameraState.returningToOrbit = false;
    }
  } else if (sandbox.mode === 'mount-focus' && sandbox.focusedMount) {
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
  } else if (sandbox.director && sandbox.director.cameraPanState.mode === 'playing') {
    if (sandbox.mode === 'scroll' && sandbox.scrollProgress > 0.002) {
      sandbox.director.cameraPanState.mode = 'settled';
      sandbox.director.cameraPanState.playing = false;
      const u = Math.min(1.0, sandbox.scrollProgress / 0.08);
      const ease = u * u * (3.0 - 2.0 * u);
      camera.position.lerpVectors(sandbox.director.cameraPanState.endPos, orbitState.cameraPos, ease);
      mountFocusCameraState.currentLookAt.lerpVectors(sandbox.director.cameraPanState.endLookAt, orbitState.pivotPos, ease);
      camera.lookAt(mountFocusCameraState.currentLookAt);
    } else {
      sandbox.director.updateCameraPan(dt);
    }
  } else if (sandbox.director && sandbox.director.cameraPOVMode) {
    sandbox.director.applyCameraPOVPose();
  } else if (sandbox.director && sandbox.director.cameraPanState.mode === 'preview-start') {
    if (cameraOrbit.isDragging) {
      sandbox.director.cameraPanState.mode = 'orbit';
      syncDirectorHUDInputs();
      camera.position.copy(orbitState.cameraPos);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
      camera.lookAt(orbitState.pivotPos);
    } else {
      camera.position.copy(sandbox.director.cameraPanState.startPos);
      mountFocusCameraState.currentLookAt.copy(sandbox.director.cameraPanState.startLookAt);
      camera.lookAt(sandbox.director.cameraPanState.startLookAt);
    }
  } else if (sandbox.director && sandbox.director.cameraPanState.mode === 'preview-mid') {
    if (cameraOrbit.isDragging) {
      sandbox.director.cameraPanState.mode = 'orbit';
      syncDirectorHUDInputs();
      camera.position.copy(orbitState.cameraPos);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
      camera.lookAt(orbitState.pivotPos);
    } else {
      camera.position.copy(sandbox.director.cameraPanState.midPos);
      const midLook = new THREE.Vector3().lerpVectors(
        sandbox.director.cameraPanState.startLookAt,
        sandbox.director.cameraPanState.endLookAt,
        0.5
      );
      mountFocusCameraState.currentLookAt.copy(midLook);
      camera.lookAt(midLook);
    }
  } else if (sandbox.director && sandbox.director.cameraPanState.mode === 'preview-end') {
    if (cameraOrbit.isDragging) {
      sandbox.director.cameraPanState.mode = 'orbit';
      syncDirectorHUDInputs();
      camera.position.copy(orbitState.cameraPos);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
      camera.lookAt(orbitState.pivotPos);
    } else {
      camera.position.copy(sandbox.director.cameraPanState.endPos);
      mountFocusCameraState.currentLookAt.copy(sandbox.director.cameraPanState.endLookAt);
      camera.lookAt(sandbox.director.cameraPanState.endLookAt);
    }
  } else if (
    sandbox.director &&
    sandbox.director.cameraPanState.mode === 'settled' &&
    sandbox.mode === 'scroll' &&
    sandbox.scrollProgress <= 0.0005 &&
    !characterCameraState.panelOpen &&
    !characterCameraState.positioningMode
  ) {
    if (sandbox.director.editMode && cameraOrbit.isDragging) {
      sandbox.director.cameraPanState.mode = 'orbit';
      syncDirectorHUDInputs();
      camera.position.copy(orbitState.cameraPos);
      camera.quaternion.copy(orbitState.cameraQuat);
      mountFocusCameraState.currentLookAt.copy(orbitState.pivotPos);
    } else {
      const pan = sandbox.director.cameraPanState;
      camera.position.copy(pan.endPos);
      mountFocusCameraState.currentLookAt.copy(pan.endLookAt);
      camera.lookAt(pan.endLookAt);
      cameraOrbit.pivotCurrent.copy(pan.endLookAt);
      cameraOrbit.currentQuat.copy(camera.quaternion);
    }
  } else {
    camera.position.copy(orbitState.cameraPos);
    camera.quaternion.copy(orbitState.cameraQuat);
    mountFocusCameraState.currentLookAt.copy(orbitState.lookAtPos || orbitState.pivotPos);
  }

  camera.updateMatrixWorld(true);

  if (sandbox.isPopupFocused && sandbox.mathPodPopups && sandbox.focusedMathPodPopupId) {
    const focusedCallout = sandbox.mathPodPopups.getCallout(sandbox.focusedMathPodPopupId);
    if (focusedCallout && focusedCallout.billboardGroup) {
      focusedCallout.billboardGroup.quaternion.copy(camera.quaternion);
      focusedCallout.rootGroup.updateMatrixWorld(true);
    }
  }

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

  const activeDecodeJobs =
    sandbox && sandbox.portfolioHUD && sandbox.portfolioHUD.decodeController
      ? sandbox.portfolioHUD.decodeController.activeJobs
      : null;

  const elMobileModeBtn = document.getElementById('mobile-action-mode-btn');
  if (elMobileModeBtn) {
    const isRadialOpen = Boolean(sandbox.radialMenu && sandbox.radialMenu.isOpen());
    if (!activeDecodeJobs || !activeDecodeJobs.has(elMobileModeBtn)) {
      if (elMobileModeBtn.textContent !== 'MENU') {
        elMobileModeBtn.textContent = 'MENU';
      }
      elMobileModeBtn.setAttribute('data-hud-canonical-text', 'MENU');
    }
    elMobileModeBtn.classList.toggle('active', isRadialOpen);
    elMobileModeBtn.setAttribute('aria-expanded', isRadialOpen ? 'true' : 'false');
  }
  const elMobileInteractBtn = document.getElementById('mobile-action-interact-btn');
  if (elMobileInteractBtn) {
    const nextInteractLabel = 'WORKS';
    if (!activeDecodeJobs || !activeDecodeJobs.has(elMobileInteractBtn)) {
      if (elMobileInteractBtn.textContent !== nextInteractLabel) {
        elMobileInteractBtn.textContent = nextInteractLabel;
      }
      elMobileInteractBtn.setAttribute('data-hud-canonical-text', nextInteractLabel);
    }
    elMobileInteractBtn.classList.toggle('highlight-mount', isMountFocus || Boolean(sandbox.proximityMount));
    elMobileInteractBtn.classList.toggle('active', isMountFocus);
    elMobileInteractBtn.classList.toggle('active-pill', isMountFocus);
    elMobileInteractBtn.setAttribute('aria-expanded', isMountFocus ? 'true' : 'false');
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
    if (sandbox.waterColor.isTeleporting) {
      const launchedId = (sandbox.waterColor.lastLaunchedGameId || sandbox.waterColor.selectedGameId || 'skate3').toUpperCase();
      elTelWaterColor.textContent = `LAUNCHING PORTAL GAME [${launchedId}]...`;
    } else if (sandbox.isPortalPopupOpen || sandbox.waterColor.isPopupOpen) {
      const selId = (sandbox.waterColor.selectedGameId || 'skate3').toUpperCase();
      elTelWaterColor.textContent = `PORTAL POPUP OPEN [SELECT GAME: ${selId}]`;
    } else if (typeof sandbox.waterColor.isNearPortal === 'function' && sandbox.waterColor.isNearPortal()) {
      elTelWaterColor.textContent = `GALLERY [WALK THROUGH TO OPEN GAME PORTAL]`;
    } else {
      elTelWaterColor.textContent = `GALLERY (DIV:${sandbox.waterColor.division} SCALE:${sandbox.waterColor.scale})`;
    }
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
  const elTelPipes = document.getElementById('tel-pipes');
  if (elTelPipes && sandbox.alleyPipes) {
    const pt = sandbox.alleyPipes.getTelemetry();
    const steamTag =
      typeof pt.activeSteamEmitterCount === 'number'
        ? ` | Steam: ${pt.activeSteamEmitterCount} Venting`
        : '';
    elTelPipes.textContent = `${pt.totalCount} / 15 Active (${pt.variationCount} Vars: ${pt.leftWallCount}L + ${pt.rightWallCount}R + ${pt.crossWallCount} Cross${steamTag})`;
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
  const elTelSpawn = document.getElementById('tel-spawn');
  const elTelPan = document.getElementById('tel-pan');
  if (sandbox.director) {
    const sp = sandbox.director.spawnState;
    const cp = sandbox.director.cameraPanState;
    if (elTelSpawn) {
      elTelSpawn.textContent = `${sp.x.toFixed(2)}, ${sp.z.toFixed(2)} (${sp.yawDeg}°)`;
    }
    if (elTelPan) {
      elTelPan.textContent =
        cp.mode === 'playing'
          ? `Playing (${Math.round(cp.progress * 100)}%)`
          : cp.mode === 'preview-start'
          ? 'Preview Start'
          : cp.mode === 'preview-end'
          ? 'Preview End'
          : cp.mode === 'orbit'
          ? 'Orbit Cam'
          : `Settled (${cp.durationSec.toFixed(1)}s)`;
    }
  }
  const elTelDoomChat = document.getElementById('tel-doom-chat');
  if (elTelDoomChat) {
    if (sandbox.isDoomChatOpen && doomChatState.isOpen) {
      const char = sandbox.getDoomChatCharacter();
      const dotVal = char ? char.mutualFacingDotProduct.toFixed(2) : '-1.00';
      const stageTag =
        doomChatState.stage === 'chatbox'
          ? `STAGE 2: CHATBOX (${doomChatState.messages.length} msgs)`
          : 'STAGE 1: STARTERS';
      elTelDoomChat.textContent = `ACTIVE // ${stageTag} • Facing dot=${dotVal}`;
    } else {
      elTelDoomChat.textContent = doomChatState.startersLoadedFromHF
        ? 'Dormant (Qwen 2.5 Starters Ready)'
        : 'Dormant (Click DOOM_HEAD)';
    }
  }
  const elTelStickers = document.getElementById('tel-stickers');
  if (elTelStickers && sandbox.holographicStickers) {
    const sys = sandbox.holographicStickers;
    const bounds = sys.getSizeBounds();
    const pState = sys.placementState;
    if (pState.active) {
      const surf = pState.lastHit ? pState.lastHit.surfaceLabel : 'Aiming';
      elTelStickers.textContent = `PLACING [${pState.stickerId}] on ${surf} (${pState.sizeMeters.toFixed(2)}m)`;
    } else if (sandbox.isStickerPopupOpen) {
      const rec = getActiveOrSelectedStickerRecord();
      elTelStickers.textContent = `POPUP OPEN [${rec ? rec.stickerId : 'sticker'}] • ${sys.placedStickers.length} Placed`;
    } else {
      elTelStickers.textContent = `${sys.placedStickers.length} Placed | 6 Radial [${bounds.minSize.toFixed(2)}m..${bounds.maxSize.toFixed(2)}m]`;
    }
  }
  syncCharacterCameraHUDInputs();
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
    if (col.params.colorAndLuminance.colorRemapWeight === 0) {
      elTintSelect.value = 'none';
    } else {
      const tint = col.params.colorAndLuminance.primaryTintHex;
      for (const [presetKey, presetVal] of Object.entries(HOLO_SPECTRAL_TINT_PRESETS)) {
        if (presetVal.primaryHex.toLowerCase() === tint.toLowerCase()) {
          elTintSelect.value = presetKey;
          break;
        }
      }
    }
  }

  const elDims = document.getElementById('holo-edit-dims-label');
  if (elDims) {
    elDims.textContent = `${t.planeWidthMeters.toFixed(3)}m × ${t.planeHeightMeters.toFixed(3)}m (${t.scaleX.toFixed(2)}x)`;
  }

  const elCarouselDeckPanel = document.getElementById('holo-carousel-deck-panel');
  const elCarouselSlideLabel = document.getElementById('holo-carousel-slide-label');
  if (elCarouselDeckPanel) {
    elCarouselDeckPanel.style.opacity = col.isCarousel ? '1' : '0.68';
  }
  if (elCarouselSlideLabel) {
    if (col.isCarousel && col.slides && col.slides.length > 0) {
      const curIdx = col.slideTransitionState === 'settling-commit' ? col.nextSlideIndex : col.activeSlideIndex;
      const curSlide = col.slides[curIdx] || col.slides[0];
      const slideTitle = curSlide.label || curSlide.title || curSlide.id || `Slide ${curIdx + 1}`;
      const slideTypeBadge = (curSlide.type || curSlide.mediaType || 'image').toUpperCase();
      elCarouselSlideLabel.textContent = `Slide ${curIdx + 1} / ${col.slides.length} — ${slideTitle} [${slideTypeBadge}]`;
    } else {
      elCarouselSlideLabel.textContent = `Single Asset (${(col.assetSpec?.mediaType || 'image').toUpperCase()}) — Click "+ Upload Media" to Add Slides`;
    }
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

function syncCharacterCameraHUDInputs() {
  if (typeof document === 'undefined') return;
  const widgetEl = document.getElementById('char-cam-hud-widget');
  const toggleBtnEl = document.getElementById('char-cam-hud-toggle-btn');
  const badgeEl = document.getElementById('char-cam-status-badge');
  const panelEl = document.getElementById('char-cam-hud-panel');
  const posModeBtnEl = document.getElementById('char-cam-pos-mode-btn');
  const wallClampBtnEl = document.getElementById('char-cam-wall-clamp-btn');
  const readoutRelEl = document.getElementById('char-cam-readout-rel');
  const readoutSyncEl = document.getElementById('char-cam-readout-sync');

  if (widgetEl) {
    widgetEl.classList.toggle('positioning-active', Boolean(characterCameraState.positioningMode));
  }
  if (toggleBtnEl) {
    toggleBtnEl.classList.toggle('active', Boolean(characterCameraState.panelOpen));
    toggleBtnEl.setAttribute('aria-expanded', characterCameraState.panelOpen ? 'true' : 'false');
  }
  if (panelEl) {
    panelEl.classList.toggle('open', Boolean(characterCameraState.panelOpen));
  }
  if (badgeEl) {
    badgeEl.textContent = characterCameraState.positioningMode
      ? `EDITING ${characterCameraState.distance.toFixed(2)}m`
      : `OTS ${characterCameraState.distance.toFixed(2)}m`;
  }
  if (posModeBtnEl) {
    posModeBtnEl.classList.toggle('active', Boolean(characterCameraState.positioningMode));
    posModeBtnEl.textContent = characterCameraState.positioningMode
      ? '🎯 Position in Viewport: ON (Drag / Wheel / WASD)'
      : '🎯 Position in Viewport: OFF (Click to Enable)';
  }
  if (wallClampBtnEl) {
    wallClampBtnEl.textContent = characterCameraState.wallClampEnabled
      ? '🧱 Wall Clamp: ON'
      : '🧱 Wall Clamp: OFF';
    wallClampBtnEl.classList.toggle('secondary', !characterCameraState.wallClampEnabled);
  }

  const pitchDeg = (characterCameraState.pitchRad * 180.0) / Math.PI;
  const yawDeg = (characterCameraState.yawOffsetRad * 180.0) / Math.PI;
  const scrollPct = Math.round((sandbox.scrollProgress || 0.0) * 100);

  const pairs = [
    ['char-cam-dist-slider', 'char-cam-dist-input', characterCameraState.distance.toFixed(2)],
    ['char-cam-height-slider', 'char-cam-height-input', characterCameraState.pivotHeightY.toFixed(2)],
    ['char-cam-shoulder-slider', 'char-cam-shoulder-input', characterCameraState.shoulderOffsetX.toFixed(2)],
    ['char-cam-forward-slider', 'char-cam-forward-input', characterCameraState.forwardOffsetZ.toFixed(2)],
    ['char-cam-pitch-slider', 'char-cam-pitch-input', pitchDeg.toFixed(1)],
    ['char-cam-yaw-slider', 'char-cam-yaw-input', yawDeg.toFixed(0)],
    ['char-cam-fov-slider', 'char-cam-fov-input', characterCameraState.fovDeg.toFixed(0)],
    ['char-cam-scroll-slider', 'char-cam-scroll-input', String(scrollPct)],
  ];
  for (const [sliderId, inputId, valStr] of pairs) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    if (sEl && document.activeElement !== sEl) sEl.value = valStr;
    if (iEl && document.activeElement !== iEl) iEl.value = valStr;
  }

  if (readoutRelEl) {
    const signX = characterCameraState.shoulderOffsetX >= 0 ? '+' : '';
    readoutRelEl.textContent = `Dist ${characterCameraState.distance.toFixed(2)}m | X ${signX}${characterCameraState.shoulderOffsetX.toFixed(2)} | Y ${characterCameraState.pivotHeightY.toFixed(2)} | P ${pitchDeg.toFixed(0)}°`;
  }
  if (readoutSyncEl) {
    readoutSyncEl.textContent = characterCameraState.lastSyncLabel || 'SYNCED';
  }
}

let _lastCharCamKeyboardNudgeSaveMs = 0;
function updateCharacterCameraKeyboardNudge(dt) {
  if (!characterCameraState.positioningMode) return false;
  const dollyIn = keysPressed.KeyW || keysPressed.ArrowUp ? 1.0 : 0.0;
  const dollyOut = keysPressed.KeyS || keysPressed.ArrowDown ? 1.0 : 0.0;
  const truckRight = keysPressed.KeyD || keysPressed.ArrowRight ? 1.0 : 0.0;
  const truckLeft = keysPressed.KeyA || keysPressed.ArrowLeft ? 1.0 : 0.0;
  const pedUp = keysPressed.KeyE || keysPressed.Space ? 1.0 : 0.0;
  const pedDown = keysPressed.KeyQ || keysPressed.KeyC ? 1.0 : 0.0;

  const dDist = (dollyOut - dollyIn) * 1.35 * dt;
  const dShoulderX = (truckRight - truckLeft) * 0.90 * dt;
  const dHeightY = (pedUp - pedDown) * 0.90 * dt;
  if (Math.abs(dDist) < 1e-5 && Math.abs(dShoulderX) < 1e-5 && Math.abs(dHeightY) < 1e-5) {
    return false;
  }

  const now = Date.now();
  const shouldSave = now - _lastCharCamKeyboardNudgeSaveMs > 350;
  if (shouldSave) {
    _lastCharCamKeyboardNudgeSaveMs = now;
  }
  sandbox.setCharacterCameraState(
    {
      distance: characterCameraState.distance + dDist,
      shoulderOffsetX: characterCameraState.shoulderOffsetX + dShoulderX,
      pivotHeightY: characterCameraState.pivotHeightY + dHeightY,
    },
    { persist: shouldSave, persistLocal: true, persistBackend: shouldSave, syncHUD: true }
  );
  return true;
}

function stepSimulation(dt) {
  if (!sandbox.ready) return;
  const clampedDt = Math.min(Math.max(dt, 0.0), 0.1);
  holoShaderUniforms.uHoloTime.value += clampedDt;
  updateAlleyAlarmLightFixtures(holoShaderUniforms.uHoloTime.value);
  updateEntranceLamppostLight(holoShaderUniforms.uHoloTime.value);

  const nudgedCharCam = updateCharacterCameraKeyboardNudge(clampedDt);

  if (
    mobileTouch.lookMagnitude >= THUMBPAD_DEADZONE &&
    (Math.abs(mobileTouch.yawRateRadPerSec) > 1e-6 ||
      Math.abs(mobileTouch.pitchRateRadPerSec) > 1e-6)
  ) {
    if (sandbox.director && sandbox.director.cameraPOVMode) {
      sandbox.director.povState.yaw = wrapAngleRad(
        sandbox.director.povState.yaw + mobileTouch.yawRateRadPerSec * clampedDt
      );
      sandbox.director.povState.pitch = Math.max(
        -1.45,
        Math.min(1.45, sandbox.director.povState.pitch - mobileTouch.pitchRateRadPerSec * clampedDt)
      );
      syncDirectorHUDInputs();
    } else {
      cameraOrbit.userLookOverride = true;
      if (
        sandbox.mode === 'scroll' &&
        sandbox.director &&
        sandbox.director.cameraPanState.mode === 'settled'
      ) {
        sandbox.director.cameraPanState.mode = 'orbit';
      }
      cameraOrbit.yaw = wrapAngleRad(
        cameraOrbit.yaw + mobileTouch.yawRateRadPerSec * clampedDt
      );
      cameraOrbit.pitch = Math.max(
        CAM_MIN_PITCH,
        Math.min(CAM_MAX_PITCH, cameraOrbit.pitch + mobileTouch.pitchRateRadPerSec * clampedDt)
      );
    }
  }

  if (sandbox.director && sandbox.director.cameraPOVMode) {
    sandbox.director.updateCameraPOV(clampedDt);
  } else if (sandbox.mode === 'scroll' || nudgedCharCam) {
    updateScrollWalkLocomotion(clampedDt);
  } else {
    updateFreeRoamCharacterLocomotion(clampedDt);
  }

  // Dynamically open up fog visibility when in 3D Fly Free-Roam or Director Camera POV Mode
  if (scene.fog) {
    const targetFogDensity =
      sandbox.freeRoamFlyMode || (sandbox.director && sandbox.director.cameraPOVMode)
        ? 0.0055
        : DEPTH_FOG_DENSITY;
    scene.fog.density += (targetFogDensity - scene.fog.density) * Math.min(1.0, 4.0 * clampedDt);
  }

  if (doomChatState.speakingTimerSec > 0.0) {
    doomChatState.speakingTimerSec = Math.max(0.0, doomChatState.speakingTimerSec - clampedDt);
  }
  const doomTargetChar = sandbox.getDoomChatCharacter();
  if (doomTargetChar) {
    doomTargetChar.companionSpeakingPulse =
      doomChatState.chatLoading || doomChatState.speakingTimerSec > 0.0
        ? Math.min(1.0, (doomTargetChar.companionSpeakingPulse || 0.0) + clampedDt * 5.0)
        : Math.max(0.0, (doomTargetChar.companionSpeakingPulse || 0.0) - clampedDt * 3.0);
  }

  if (sandbox.characters.hoodie && sandbox.characters.hoodie.root.visible) {
    sandbox.characters.hoodie.updateDialogueState(clampedDt);
    sandbox.characters.hoodie.mixer.update(clampedDt);
    sandbox.characters.hoodie.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value, clampedDt);
    sandbox.characters.hoodie.applyConversationalHeadLook();
    sandbox.characters.hoodie.root.updateMatrixWorld(true);
  }
  if (sandbox.characters.tunic && sandbox.characters.tunic.root.visible) {
    sandbox.characters.tunic.updateDialogueState(clampedDt);
    sandbox.characters.tunic.mixer.update(clampedDt);
    sandbox.characters.tunic.updateCompanionLevitation(holoShaderUniforms.uHoloTime.value, clampedDt);
    sandbox.characters.tunic.applyConversationalHeadLook();
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
  updateDoomHoloChatTether();
  updateStickerHoloPopupTether();
  updateHolographicPopupUI();
  updateSFXAndAudioSubsystems(clampedDt, holoShaderUniforms.uHoloTime.value);
  const isMp3FullTakeover = Boolean(
    sandbox.mp3Player && sandbox.mp3Player.mounted3D && sandbox.mp3Player.morphProgress >= 0.98
  );
  if (!isMp3FullTakeover) {
    if (sandbox.mathPods) {
      updateMathPodsCorridorLOD();
      if (sandbox.mathPods.rootGroup.visible) {
        sandbox.mathPods.update(clampedDt, holoShaderUniforms.uHoloTime.value);
      }
    }
    if (sandbox.waterColor) {
      sandbox.waterColor.update(clampedDt, holoShaderUniforms.uHoloTime.value, activeChar);
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
    if (sandbox.holographicStickers) {
      sandbox.holographicStickers.update(clampedDt, holoShaderUniforms.uHoloTime.value, camera);
    }
  }
  if (sandbox.mp3Player) {
    sandbox.mp3Player.update(performance.now());
  }
  if (sandbox.sceneMaterialization) {
    sandbox.sceneMaterialization.update(clampedDt);
  }
  if (sandbox.portfolioHUD) {
    sandbox.portfolioHUD.update(clampedDt);
  }
  updateTelemetryHUD();
  if (crtOpticalPassSystem && crtOpticalPassSystem.state.enabled) {
    crtOpticalPassSystem.render(
      clampedDt,
      holoShaderUniforms.uHoloTime.value,
      sandbox.mp3Player && typeof sandbox.mp3Player.renderInMainRenderer === 'function'
        ? (r) => sandbox.mp3Player.renderInMainRenderer(r)
        : null
    );
  } else {
    renderer.render(scene, camera);
    if (sandbox.mp3Player && typeof sandbox.mp3Player.renderInMainRenderer === 'function') {
      sandbox.mp3Player.renderInMainRenderer(renderer);
    }
  }
}

// ============================================================================
// DOM & Input Event Listeners
// ============================================================================
let lastHovered3DRegion = null;

function bindSidebarCollapseControls() {
  if (sandbox._sidebarControlsBound) return;
  sandbox._sidebarControlsBound = true;

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('dev-mode', IS_DEV_MODE);
  }

  if (!IS_DEV_MODE) {
    sandbox.toggleSidebar(true);
    if (typeof document !== 'undefined') {
      for (const suppressedId of ['sandbox-hud', 'scene-cutter-overlay', 'director-pov-overlay']) {
        const el = document.getElementById(suppressedId);
        if (el) {
          el.style.display = 'none';
          el.setAttribute('aria-hidden', 'true');
        }
      }
    }
    if (detectInitialMobileTouchMode()) {
      mobileTouch.setEnabled(true);
    }
    return;
  }

  if (detectInitialMobileTouchMode()) {
    sandbox.toggleSidebar(true);
    mobileTouch.setEnabled(true);
  }

  const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox._userManuallyToggledSidebar = true;
      sandbox.toggleSidebar();
    });
  }

  const hudHeaderTitle = document.getElementById('hud-header-title');
  if (hudHeaderTitle) {
    hudHeaderTitle.addEventListener('click', () => {
      if (sandbox.sidebarCollapsed) {
        sandbox._userManuallyToggledSidebar = true;
        sandbox.toggleSidebar(false);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') {
      return;
    }
    if (IS_DEV_MODE && e.code === 'KeyB' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      sandbox._userManuallyToggledSidebar = true;
      sandbox.toggleSidebar();
    }
  });
}

function bindMobileTouchControls() {
  if (sandbox._mobileTouchControlsBound) return;
  sandbox._mobileTouchControlsBound = true;

  if (typeof document === 'undefined') return;
  document.body.classList.toggle('mobile-touch-enabled', Boolean(mobileTouch.enabled));
  mobileTouch.syncDOM();

  const thumbpadEl = document.getElementById('mobile-left-thumbpad');
  if (thumbpadEl) {
    thumbpadEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.unlock();
      }
      if (!mobileTouch.enabled && !isMobileTouchForceDisabled()) {
        mobileTouch.setEnabled(true);
      }
      mobileTouch.pointerId = e.pointerId;
      try {
        if (typeof thumbpadEl.setPointerCapture === 'function') {
          thumbpadEl.setPointerCapture(e.pointerId);
        }
      } catch {
        // ignore synthetic pointer capture errors
      }
      mobileTouch.updateFromClientPoint(e.clientX, e.clientY);
    });

    thumbpadEl.addEventListener('pointermove', (e) => {
      if (mobileTouch.pointerId === null || e.pointerId !== mobileTouch.pointerId) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      mobileTouch.updateFromClientPoint(e.clientX, e.clientY);
    });

    const endThumbpadPointer = (e) => {
      if (mobileTouch.pointerId === null || e.pointerId !== mobileTouch.pointerId) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      try {
        if (typeof thumbpadEl.releasePointerCapture === 'function') {
          thumbpadEl.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      mobileTouch.resetMove();
    };

    thumbpadEl.addEventListener('pointerup', endThumbpadPointer);
    thumbpadEl.addEventListener('pointercancel', endThumbpadPointer);
    thumbpadEl.addEventListener('lostpointercapture', (e) => {
      if (mobileTouch.pointerId !== null && e.pointerId === mobileTouch.pointerId) {
        mobileTouch.resetMove();
      }
    });
  }

  const rightThumbpadEl = document.getElementById('mobile-right-thumbpad');
  if (rightThumbpadEl) {
    rightThumbpadEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.unlock();
      }
      if (!mobileTouch.enabled && !isMobileTouchForceDisabled()) {
        mobileTouch.setEnabled(true);
      }
      mobileTouch.lookThumbpadPointerId = e.pointerId;
      mobileTouch.lookActive = true;
      try {
        if (typeof rightThumbpadEl.setPointerCapture === 'function') {
          rightThumbpadEl.setPointerCapture(e.pointerId);
        }
      } catch {
        // ignore synthetic pointer capture errors
      }
      mobileTouch.updateLookFromClientPoint(e.clientX, e.clientY);
    });

    rightThumbpadEl.addEventListener('pointermove', (e) => {
      if (
        mobileTouch.lookThumbpadPointerId === null ||
        e.pointerId !== mobileTouch.lookThumbpadPointerId
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      mobileTouch.updateLookFromClientPoint(e.clientX, e.clientY);
    });

    const endRightThumbpadPointer = (e) => {
      if (
        mobileTouch.lookThumbpadPointerId === null ||
        e.pointerId !== mobileTouch.lookThumbpadPointerId
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      try {
        if (typeof rightThumbpadEl.releasePointerCapture === 'function') {
          rightThumbpadEl.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      mobileTouch.resetLook();
    };

    rightThumbpadEl.addEventListener('pointerup', endRightThumbpadPointer);
    rightThumbpadEl.addEventListener('pointercancel', endRightThumbpadPointer);
    rightThumbpadEl.addEventListener('lostpointercapture', (e) => {
      if (
        mobileTouch.lookThumbpadPointerId !== null &&
        e.pointerId === mobileTouch.lookThumbpadPointerId
      ) {
        mobileTouch.resetLook();
      }
    });
  }
}

function bindInputListeners() {
  bindSidebarCollapseControls();
  bindMobileTouchControls();
  window.addEventListener(
    'scroll',
    () => {
      if (suppressScrollEventSync || !sandbox.ready) return;
      if (sandbox.director && sandbox.director.cameraPOVMode) return;
      if (sandbox.mode === 'scroll') {
        if (sandbox.director && sandbox.director.isScrollLocked()) {
          sandbox.targetScrollProgress = 0.0;
          sandbox.scrollProgress = 0.0;
          sandbox.scrollVelocity = 0.0;
          syncWindowScrollToFraction(0.0);
          return;
        }
        sandbox.targetScrollProgress = getWindowScrollFraction();
        if (
          sandbox.director &&
          sandbox.targetScrollProgress > 0.002 &&
          sandbox.director.introSequenceState.phase !== 'scrolling-alley'
        ) {
          sandbox.director.introSequenceState.phase = 'scrolling-alley';
          syncIntroDialogueOverlayUI();
          syncDirectorHUDInputs();
        }
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    if (!sandbox.ready) return;
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') {
      if (e.code === 'Escape') {
        if (sandbox.isStickerPopupOpen) {
          e.preventDefault();
          sandbox.closeStickerPopup();
          return;
        }
        if (sandbox.isDoomChatOpen) {
          e.preventDefault();
          sandbox.exitDoomChatMode();
          return;
        }
      }
      return;
    }
    if (sandbox.audio) {
      sandbox.audio.unlock();
    }

    if (IS_DEV_MODE && e.code === 'KeyK') {
      e.preventDefault();
      sandbox.toggleDirectorGizmos();
      return;
    }

    if (
      IS_DEV_MODE &&
      e.code === 'KeyC' &&
      !(sandbox.freeRoamFlyMode && (keysPressed.KeyW || keysPressed.KeyS || keysPressed.KeyA || keysPressed.KeyD))
    ) {
      e.preventDefault();
      sandbox.toggleCameraPOVMode();
      return;
    }

    // When in First-Person Camera POV Mode (dev only), '[' captures Pan Start, ']' captures Pan End, and WASD/Space/E/Q/Z fly the camera
    if (IS_DEV_MODE && sandbox.director && sandbox.director.cameraPOVMode) {
      if (e.code === 'Escape') {
        e.preventDefault();
        sandbox.toggleCameraPOVMode(false);
        return;
      }
      if (e.code === 'BracketLeft') {
        e.preventDefault();
        sandbox.director.captureCurrentViewAsPanStart();
        return;
      }
      if (e.code === 'BracketRight') {
        e.preventDefault();
        sandbox.director.captureCurrentViewAsPanEnd();
        return;
      }
      if (e.code in keysPressed) {
        if (
          e.code === 'Space' ||
          e.code === 'ArrowUp' ||
          e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight' ||
          e.code === 'KeyQ' ||
          e.code === 'KeyE' ||
          e.code === 'KeyZ'
        ) {
          e.preventDefault();
        }
        keysPressed[e.code] = true;
        return;
      }
    }

    if (IS_DEV_MODE && e.code === 'KeyG') {
      e.preventDefault();
      sandbox.toggleHoloEditMode();
      return;
    }

    if (IS_DEV_MODE && e.code === 'KeyL') {
      e.preventDefault();
      sandbox.toggleLamppostEditMode();
      return;
    }

    if (e.code === 'KeyU') {
      if (sandbox.mp3Player) {
        e.preventDefault();
        sandbox.mp3Player.toggleVisible();
        return;
      }
    }

    if (IS_DEV_MODE && e.code === 'KeyX') {
      if (sandbox.sceneCutter) {
        e.preventDefault();
        sandbox.sceneCutter.toggleActive();
        return;
      }
    }

    if (IS_DEV_MODE && sandbox.sceneCutter && sandbox.sceneCutter.active) {
      if (e.code === 'Tab') {
        e.preventDefault();
        sandbox.sceneCutter.flipCutSide();
        return;
      }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        sandbox.sceneCutter.executeCut();
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        const tel = sandbox.sceneCutter.getTelemetry();
        if (tel && tel.p1) {
          sandbox.sceneCutter.clearLine();
        } else {
          sandbox.sceneCutter.toggleActive(false);
        }
        return;
      }
    }

    // Rotate selected / hovered sticker or hologram via ',' / '<' (Left) and '.' / '>' (Right)
    const isRotateLeftKey = e.code === 'Comma' || e.key === '<' || e.key === ',';
    const isRotateRightKey = e.code === 'Period' || e.key === '>' || e.key === '.';
    if (
      (isRotateLeftKey || isRotateRightKey) &&
      sandbox.holographicStickers &&
      (sandbox.holographicStickers.isPlacementActive() ||
        sandbox.isStickerPopupOpen ||
        sandbox.hoveredPlacedStickerId)
    ) {
      e.preventDefault();
      if (
        !sandbox.holographicStickers.isPlacementActive() &&
        sandbox.hoveredPlacedStickerId &&
        !sandbox.isStickerPopupOpen
      ) {
        sandbox.holographicStickers.selectPlacedSticker(sandbox.hoveredPlacedStickerId);
      }
      sandbox.rotateStickerByDeg(isRotateRightKey ? 5 : -5);
      return;
    }
    if (IS_DEV_MODE && (isRotateLeftKey || isRotateRightKey) && sandbox.hologramColumns) {
      e.preventDefault();
      let targetColId = sandbox.hologramColumns.activeDragColumnId || null;
      if (!targetColId && pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0 && pointerNDC.y >= -1.0 && pointerNDC.y <= 1.0) {
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const rawHoloHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        const holoHits = sandbox.holoEditMode
          ? rawHoloHits
          : rawHoloHits.filter((h) => h.object?.userData?.holoColumnId !== 'watercolor_gallery');
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

    // Resize selected / hovered sticker or hologram via '+' / '=' or '-' / '_' (or '[' / ']')
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

    if (
      (isScaleUpKey || isScaleDownKey) &&
      sandbox.holographicStickers &&
      (sandbox.holographicStickers.isPlacementActive() ||
        sandbox.isStickerPopupOpen ||
        sandbox.hoveredPlacedStickerId)
    ) {
      e.preventDefault();
      if (
        !sandbox.holographicStickers.isPlacementActive() &&
        sandbox.hoveredPlacedStickerId &&
        !sandbox.isStickerPopupOpen
      ) {
        sandbox.holographicStickers.selectPlacedSticker(sandbox.hoveredPlacedStickerId);
      }
      sandbox.resizeStickerByStep(isScaleUpKey ? 0.05 : -0.05);
      return;
    }

    if (IS_DEV_MODE && (isScaleUpKey || isScaleDownKey) && sandbox.hologramColumns) {
      e.preventDefault();
      // If hovering over a hologram in the 3D scene, select it automatically before scaling
      let targetColId = sandbox.hologramColumns.activeDragColumnId || null;
      if (!targetColId && pointerNDC.x >= -1.0 && pointerNDC.x <= 1.0 && pointerNDC.y >= -1.0 && pointerNDC.y <= 1.0) {
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const rawHoloHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        const holoHits = sandbox.holoEditMode
          ? rawHoloHits
          : rawHoloHits.filter((h) => h.object?.userData?.holoColumnId !== 'watercolor_gallery');
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

    if (sandbox.isPortalPopupOpen) {
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        sandbox.closePortalGameSelectorPopup({ source: 'escape' });
        return;
      }
      const catalog = getActivePortalGameCatalog();
      const digitMatch = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '');
      if (digitMatch) {
        const slotIdx = Number(digitMatch[1]) - 1;
        if (slotIdx >= 0 && slotIdx < catalog.length) {
          e.preventDefault();
          e.stopPropagation();
          sandbox.launchPortalGame(catalog[slotIdx].id, { source: `hotkey-${slotIdx + 1}` });
          return;
        }
      }
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const curId = (sandbox.waterColor && sandbox.waterColor.selectedGameId) || catalog[0]?.id || 'skate3';
        const curIdx = Math.max(0, catalog.findIndex((g) => g.id === curId));
        const cols = (sandbox.portalGridLayout && sandbox.portalGridLayout.columns) || 1;
        const step = e.code === 'ArrowDown' && cols > 1 && catalog.length > cols ? cols : 1;
        const nextIdx = (curIdx + step) % catalog.length;
        sandbox.selectPortalGame(catalog[nextIdx].id);
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const curId = (sandbox.waterColor && sandbox.waterColor.selectedGameId) || catalog[0]?.id || 'skate3';
        const curIdx = Math.max(0, catalog.findIndex((g) => g.id === curId));
        const cols = (sandbox.portalGridLayout && sandbox.portalGridLayout.columns) || 1;
        const step = e.code === 'ArrowUp' && cols > 1 && catalog.length > cols ? cols : 1;
        const prevIdx = (curIdx - step + catalog.length * 4) % catalog.length;
        sandbox.selectPortalGame(catalog[prevIdx].id);
        return;
      }
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        const curId = (sandbox.waterColor && sandbox.waterColor.selectedGameId) || catalog[0]?.id || 'skate3';
        sandbox.launchPortalGame(curId, { source: 'hotkey-enter' });
        return;
      }
      return;
    }

    if (e.code === 'Backquote' || e.code === 'KeyQ') {
      if (characterCameraState.positioningMode && e.code === 'KeyQ') {
        e.preventDefault();
        keysPressed.KeyQ = true;
        return;
      }
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
      if (e.code === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        if (
          typeof sandbox.radialMenu.navigateBack === 'function' &&
          sandbox.radialMenu.getState().menuDepth > 0
        ) {
          sandbox.radialMenu.navigateBack();
        } else {
          sandbox.radialMenu.cancelDeadzone();
        }
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

    if (IS_DEV_MODE && e.code === 'Tab') {
      e.preventDefault();
      sandbox.swapCharacter();
      return;
    }

    if (e.code === 'Escape') {
      if (characterCameraState.positioningMode) {
        e.preventDefault();
        sandbox.toggleCharacterCameraPositioningMode(false);
        return;
      }
      if (characterCameraState.panelOpen) {
        e.preventDefault();
        sandbox.toggleCharacterCameraPanel(false);
        return;
      }
      if (sandbox.holographicStickers && sandbox.holographicStickers.isPlacementActive()) {
        e.preventDefault();
        sandbox.cancelStickerPlacement();
        return;
      }
      if (sandbox.isStickerPopupOpen) {
        e.preventDefault();
        sandbox.closeStickerPopup();
        return;
      }
      if (sandbox.isDoomChatOpen) {
        e.preventDefault();
        sandbox.exitDoomChatMode();
        return;
      }
      if (sandbox.whitepaperColumnOpen) {
        e.preventDefault();
        sandbox.closeWhitepaperHologramColumn();
        return;
      }
      if (sandbox.isPopupFocused) {
        e.preventDefault();
        sandbox.exitMathPodPopupFocus();
        return;
      }
      if (sandbox.mode === 'mount-focus') {
        e.preventDefault();
        sandbox.exitMountFocusMode();
      }
      return;
    }

    if (sandbox.whitepaperColumnOpen && sandbox.whitepaperHoloColumn) {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentByPixels(180);
        return;
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentByPixels(-180);
        return;
      }
      if (e.code === 'PageDown' || e.code === 'Space') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentPage(1);
        return;
      }
      if (e.code === 'PageUp') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentPage(-1);
        return;
      }
      if (e.code === 'Home') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentToProgress(0.0);
        return;
      }
      if (e.code === 'End') {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentToProgress(1.0);
        return;
      }
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

    if (IS_DEV_MODE && e.code === 'KeyH') {
      e.preventDefault();
      sandbox.toggleHolographicShader();
      return;
    }

    if (IS_DEV_MODE && e.code === 'KeyF') {
      e.preventDefault();
      sandbox.toggleFreeRoamFlyMode();
      return;
    }

    if (IS_DEV_MODE && e.code === 'KeyP') {
      e.preventDefault();
      if (sandbox.replaySprayPaintIntro) {
        sandbox.replaySprayPaintIntro();
      }
      return;
    }

    if (IS_DEV_MODE && e.code === 'KeyT') {
      e.preventDefault();
      sandbox.toggleDialogue();
      return;
    }

    if (e.code === 'KeyE') {
      if (characterCameraState.positioningMode) {
        e.preventDefault();
        keysPressed.KeyE = true;
        return;
      }
      if (IS_DEV_MODE && sandbox.freeRoamFlyMode) {
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

    if (IS_DEV_MODE && e.code in HOTKEY_CLIPS) {
      e.preventDefault();
      sandbox.playAnimation(HOTKEY_CLIPS[e.code]);
      return;
    }

    // Pressing Space or Enter while Intro Dialogue Cards 01..06 are active advances to the next card (Card 07 requires explicit Yes / No choice)
    if (
      sandbox.mode === 'scroll' &&
      sandbox.director &&
      sandbox.director.introSequenceState.phase === 'dialogue-active' &&
      (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')
    ) {
      e.preventDefault();
      const intro = sandbox.director.introSequenceState;
      const curBox = intro && intro.boxes ? intro.boxes[intro.currentBoxIndex] : null;
      const isQuestionCard = Boolean(
        (curBox && curBox.requires_question_prompt) ||
          (intro && intro.currentBoxIndex + 1 >= intro.boxes.length)
      );
      if (!isQuestionCard) {
        sandbox.director.advanceDialogueBox();
      }
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

      if (characterCameraState.positioningMode) {
        keysPressed[e.code] = true;
        return;
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

      // Pressing any movement key exits DOOM_HEAD Dialogue Mode, Sticker Popup Mode, Popup Focus Mode, Mount Focus Mode, or hands off Scroll-Walk Mode to Free-Roam Mode (§5.2 & §5.3)
      if (sandbox.isDoomChatOpen && isMoveKey) {
        sandbox.exitDoomChatMode();
      }
      if (sandbox.isStickerPopupOpen && isMoveKey) {
        sandbox.closeStickerPopup();
      }
      if (sandbox.isPopupFocused && isMoveKey) {
        sandbox.exitMathPodPopupFocus();
      }
      if (sandbox.mode === 'mount-focus' && isMoveKey) {
        if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'KeyD') {
          e.preventDefault();
          sandbox.stepFocusedWallMount(1);
          return;
        }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || e.code === 'KeyA') {
          e.preventDefault();
          sandbox.stepFocusedWallMount(-1);
          return;
        }
        sandbox.exitMountFocusMode();
      } else if (sandbox.mode === 'scroll' && isMoveKey) {
        if (sandbox.director && sandbox.director.isScrollLocked()) {
          return;
        }
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

  const resetAllPointerAndTouchStates = () => {
    for (const k of Object.keys(keysPressed)) {
      keysPressed[k] = false;
    }
    cameraOrbit.isDragging = false;
    cameraOrbit.pointerId = null;
    mobileTouch.lookActive = false;
    mobileTouch.lookPointerId = null;
    mobileTouch.reset();
    if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
      sandbox.mathPods.endDrag();
      sandbox.draggedMathPod = null;
    }
    if (sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId) {
      sandbox.hologramColumns.endDrag();
    }
    if (sandbox.hologramColumns && sandbox.hologramColumns.activeSwipeColumnId) {
      sandbox.hologramColumns.endSlideSwipe(0, 0);
    }
    if (sandbox.lamppostLight && sandbox.lamppostLight.isDraggingTarget) {
      sandbox.lamppostLight.endTargetDrag();
    }
  };

  window.addEventListener('blur', resetAllPointerAndTouchStates);
  window.addEventListener('orientationchange', resetAllPointerAndTouchStates);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        resetAllPointerAndTouchStates();
      }
    });
  }

  let podPointerDownState = null;
  let popupPointerDownState = null;
  let doomPointerDownState = null;
  let stickerPlacementDownState = null;
  let placedStickerPointerDownState = null;
  let activeSceneObjectPointerId = null;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !mobileTouch.enabled && !isMobileTouchForceDisabled()) {
      mobileTouch.setEnabled(true);
    }
    if (
      (mobileTouch.pointerId !== null && e.pointerId === mobileTouch.pointerId) ||
      (mobileTouch.lookThumbpadPointerId !== null && e.pointerId === mobileTouch.lookThumbpadPointerId)
    ) {
      return;
    }
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (sandbox.audio) {
      sandbox.audio.unlock();
    }
    const tcAxis = sandbox.transformControls ? sandbox.transformControls.axis : null;
    const isExplicitGizmoHandle =
      Boolean(sandbox.transformControls && sandbox.transformControls.enabled) &&
      (sandbox.holoGizmoMode === 'rotate' || sandbox.holoGizmoMode === 'scale'
        ? tcAxis !== null
        : tcAxis === 'X' || tcAxis === 'Y' || tcAxis === 'Z');
    if (sandbox.transformControls && (sandbox.transformControls.dragging || isExplicitGizmoHandle)) {
      return;
    }
    const isPrimaryOrTouch = e.button === 0 || e.button === undefined || e.pointerType === 'touch';
    if (
      sandbox.ready &&
      isPrimaryOrTouch &&
      activeSceneObjectPointerId === null &&
      !characterCameraState.positioningMode
    ) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
      }
      pointerRaycaster.setFromCamera(pointerNDC, camera);

      // Interactive Sticker Placement Mode: record down state so clean click commits sticker on surface while drag still orbits camera
      if (sandbox.holographicStickers && sandbox.holographicStickers.isPlacementActive()) {
        sandbox.holographicStickers.updatePlacementPreviewFromRay(pointerRaycaster);
        syncStickerToolHUDInputs();
        stickerPlacementDownState = {
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
        };
      } else if (sandbox.holographicStickers) {
        const stickerHits = sandbox.holographicStickers.raycastPlacedStickers(pointerRaycaster);
        if (stickerHits.length > 0 && stickerHits[0].placedSticker) {
          placedStickerPointerDownState = {
            pointerId: e.pointerId,
            placedId: stickerHits[0].placedSticker.placedId,
            clientX: e.clientX,
            clientY: e.clientY,
          };
          if (e.pointerType !== 'touch') {
            activeSceneObjectPointerId = e.pointerId;
            return;
          }
        }
      }

      if (!stickerPlacementDownState) {
        // Click on DOOM_HEAD (DOOM_Companion) -> Open Two-Stage Hologram Dialogue & Close-Up Two-Shot Camera Pan (Spec 041)
        const doomTargets = sandbox.getDoomCompanionRaycastTargets();
        if (doomTargets.length > 0) {
          const doomHits = pointerRaycaster.intersectObjects(doomTargets, false);
          if (doomHits.length > 0) {
            doomPointerDownState = {
              pointerId: e.pointerId,
              clientX: e.clientX,
              clientY: e.clientY,
            };
            if (e.pointerType !== 'touch') {
              activeSceneObjectPointerId = e.pointerId;
              return;
            }
          }
        }

        // Click-to-select Director 3D Handles (Spawn Marker, Camera Start/End, LookAt Start/End)
        if (sandbox.director && sandbox.director.editMode && sandbox.director.rootGroup.visible) {
          const dirHits = pointerRaycaster.intersectObjects(sandbox.director.raycastTargets, false);
          if (dirHits.length > 0 && dirHits[0].object.userData.handleId) {
            const hitHandleId = dirHits[0].object.userData.handleId;
            sandbox.director.selectHandle(hitHandleId);
            return;
          }
        }

        // Click-and-drag the Lamppost Cone Landing Target directly in the 3D scene
        if (sandbox.lamppostLight && sandbox.lamppostLight.targetMarkerGroup && sandbox.lamppostLight.targetMarkerGroup.visible) {
          const lampHits = pointerRaycaster.intersectObjects(sandbox.lamppostLight.raycastTargets, false);
          if (lampHits.length > 0 && (!sandbox.transformControls || sandbox.transformControls.axis === null)) {
            activeSceneObjectPointerId = e.pointerId;
            sandbox.lamppostLight.beginTargetDrag(pointerRaycaster.ray, camera);
            return;
          }
        }

        // Stage 2 Click: Click an active MathPod Holographic Pop-Up -> Camera Focuses on Pop-Up
        if (sandbox.mathPodPopups) {
          const popupHits = sandbox.mathPodPopups.raycastCallouts(pointerRaycaster);
          if (popupHits.length > 0 && popupHits[0].object.userData.calloutId) {
            popupPointerDownState = {
              pointerId: e.pointerId,
              calloutId: popupHits[0].object.userData.calloutId,
              clientX: e.clientX,
              clientY: e.clientY,
            };
            if (e.pointerType !== 'touch') {
              activeSceneObjectPointerId = e.pointerId;
              return;
            }
          }
        }

        const rawHoloHits = sandbox.hologramColumns
          ? pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false)
          : [];
        const holoHits = sandbox.holoEditMode
          ? rawHoloHits
          : rawHoloHits.filter((h) => h.object?.userData?.holoColumnId !== 'watercolor_gallery');
        const podHits = sandbox.mathPods
          ? pointerRaycaster.intersectObjects(sandbox.mathPods.raycastTargets, false)
          : [];

        const hasPodHit = Boolean(podHits.length > 0 && podHits[0].object.userData.podId);
        const hasHoloHit = Boolean(holoHits.length > 0 && holoHits[0].object.userData.holoColumnId);
        const podIsCloser =
          hasPodHit &&
          (!hasHoloHit || podHits[0].distance <= holoHits[0].distance);

        // Stage 1 Click: Click a MathPod -> Reveal/Toggle its Holographic Pop-Up (or drag pod in dev authoring mode)
        if (podIsCloser) {
          const podId = podHits[0].object.userData.podId;
          podPointerDownState = { pointerId: e.pointerId, podId, clientX: e.clientX, clientY: e.clientY };
          if (IS_DEV_MODE && (e.pointerType !== 'touch' || sandbox.holoEditMode)) {
            activeSceneObjectPointerId = e.pointerId;
            const pod = sandbox.mathPods.beginDrag(podId, pointerRaycaster.ray, camera);
            sandbox.draggedMathPod = pod;
            if (sandbox.audio) {
              sandbox.audio.trigger('onUpdate', { target: pod.id, source: 'math-pod-grab' });
            }
            return;
          }
        }

        // Click-and-swipe Carousel Hologram Columns (or 3D placement drag in dev authoring mode)
        if (hasHoloHit) {
          const hitId = holoHits[0].object.userData.holoColumnId;
          const hitCol = sandbox.hologramColumns.getColumn(hitId);
          if (IS_DEV_MODE) {
            sandbox.selectHologramColumnForEdit(hitId);
          }
          if (!sandbox.holoEditMode && hitCol && hitCol.isScrollableDocument) {
            activeSceneObjectPointerId = e.pointerId;
            hitCol.beginDocumentDrag(e.clientX, e.clientY, holoHits[0].uv || null);
            return;
          }
          if (!sandbox.holoEditMode && hitCol && hitCol.isCarousel && holoHits[0].distance <= 6.5) {
            activeSceneObjectPointerId = e.pointerId;
            sandbox.hologramColumns.beginSlideSwipe(hitId, e.clientX, e.clientY, holoHits[0].uv || null);
            if (sandbox.audio) {
              sandbox.audio.trigger('onUpdate', { target: hitId, source: 'holo-carousel-swipe-start' });
            }
            return;
          }
          if (IS_DEV_MODE && (sandbox.holoEditMode || (hitCol && hitCol.allowDirectDrag))) {
            activeSceneObjectPointerId = e.pointerId;
            // Start direct coplanar 3D placement drag when Holo Edit Mode is ON (or direct drag is enabled) unless gizmo is in 'rotate' or 'scale'
            const isGizmoRotateOrScale =
              sandbox.holoEditMode && (sandbox.holoGizmoMode === 'rotate' || sandbox.holoGizmoMode === 'scale');
            if (!isGizmoRotateOrScale) {
              if (sandbox.transformControls && sandbox.transformControls.enabled) {
                sandbox.transformControls.enabled = false;
              }
              sandbox.hologramColumns.beginDrag(hitId, pointerRaycaster.ray, camera);
            }
            if (sandbox.audio) {
              sandbox.audio.trigger('onUpdate', { target: hitId, source: 'holo-column-grab' });
            }
            return;
          }
          if (sandbox.audio) {
            sandbox.audio.trigger('onUpdate', { target: hitId, source: 'holo-column-select' });
          }
        }
      }
    }

    const canLookAround =
      sandbox.mode === 'freeroam' ||
      sandbox.mode === 'scroll' ||
      Boolean(sandbox.director && (sandbox.director.editMode || sandbox.director.cameraPOVMode));
    if (!canLookAround) {
      return;
    }
    if (cameraOrbit.isDragging && cameraOrbit.pointerId !== null && cameraOrbit.pointerId !== e.pointerId) {
      return;
    }
    if (isPrimaryOrTouch || e.button === 2) {
      cameraOrbit.isDragging = true;
      cameraOrbit.pointerId = e.pointerId;
      cameraOrbit.downClientX = e.clientX;
      cameraOrbit.downClientY = e.clientY;
      cameraOrbit.maxDragTravel = 0;
      cameraOrbit.lastPointerX = e.clientX;
      cameraOrbit.lastPointerY = e.clientY;
      characterCameraState.isPanningOffset = Boolean(
        characterCameraState.positioningMode && (e.button === 2 || e.shiftKey)
      );
      mobileTouch.lookActive = true;
      mobileTouch.lookPointerId = e.pointerId;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (mobileTouch.pointerId !== null && e.pointerId === mobileTouch.pointerId) {
      mobileTouch.updateFromClientPoint(e.clientX, e.clientY);
      return;
    }
    if (
      mobileTouch.lookThumbpadPointerId !== null &&
      e.pointerId === mobileTouch.lookThumbpadPointerId
    ) {
      mobileTouch.updateLookFromClientPoint(e.clientX, e.clientY);
      return;
    }
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (sandbox.transformControls && sandbox.transformControls.dragging) {
      cameraOrbit.isDragging = false;
      cameraOrbit.pointerId = null;
      mobileTouch.lookPointerId = null;
      if (mobileTouch.lookThumbpadPointerId === null) {
        mobileTouch.lookActive = false;
      }
      return;
    }

    if (activeSceneObjectPointerId !== null && e.pointerId === activeSceneObjectPointerId) {
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

      if (
        sandbox.ready &&
        sandbox.whitepaperHoloColumn &&
        sandbox.whitepaperHoloColumn.docDragGesture &&
        sandbox.whitepaperHoloColumn.docDragGesture.active
      ) {
        sandbox.whitepaperHoloColumn.updateDocumentDrag(e.clientX, e.clientY, Math.max(300, rect.height));
        return;
      }

      if (sandbox.ready && sandbox.hologramColumns && sandbox.hologramColumns.activeSwipeColumnId) {
        sandbox.hologramColumns.updateSlideSwipe(e.clientX, e.clientY, Math.max(200, rect.width * 0.28));
        syncHoloEditorHUDInputs();
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
    }

    // Check pointer intersection with 3D wall mounts for onHover telemetry audio (SFX.md §4.3)
    if (sandbox.ready && !cameraOrbit.isDragging && e.target === canvas) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
      }
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      let hoveredHoloColumn = false;
      if (sandbox.hologramColumns) {
        const rawHoloHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
        const holoHits = sandbox.holoEditMode
          ? rawHoloHits
          : rawHoloHits.filter((h) => h.object?.userData?.holoColumnId !== 'watercolor_gallery');
        hoveredHoloColumn = holoHits.length > 0;
        const hoveredId = hoveredHoloColumn ? holoHits[0].object.userData.holoColumnId : null;
        sandbox.hoveredHoloColumnId = hoveredId;
        sandbox.hologramColumns.setHoveredColumn(hoveredId);
        for (let i = 0; i < sandbox.hologramColumns.columns.length; i++) {
          const c = sandbox.hologramColumns.columns[i];
          if (c.isCarousel) {
            c.setHoverUv(c.id === hoveredId ? holoHits[0].uv : null);
          }
        }
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

      if (sandbox.mathPodPopups) {
        const popupHits = sandbox.mathPodPopups.raycastCallouts(pointerRaycaster);
        sandbox.hoveredMathPodPopupId =
          popupHits.length > 0 && popupHits[0].object.userData.calloutId
            ? popupHits[0].object.userData.calloutId
            : null;
      } else {
        sandbox.hoveredMathPodPopupId = null;
      }

      if (sandbox.mathPods) {
        const podHits = pointerRaycaster.intersectObjects(sandbox.mathPods.raycastTargets, false);
        if (podHits.length > 0 && podHits[0].object.userData.podId) {
          sandbox.hoveredMathPod = sandbox.mathPods.getPod(podHits[0].object.userData.podId);
        } else {
          sandbox.hoveredMathPod = null;
        }
      }

      const doomTargets = sandbox.getDoomCompanionRaycastTargets();
      const doomHits = doomTargets.length > 0 ? pointerRaycaster.intersectObjects(doomTargets, false) : [];
      const isHoveringDoom = doomHits.length > 0;
      if (isHoveringDoom && !sandbox.hoveredDoomCompanion && sandbox.audio) {
        sandbox.audio.trigger('onHover', { target: 'DOOM_Companion', source: 'doom-head-3d' });
      }
      sandbox.hoveredDoomCompanion = isHoveringDoom;

      let isStickerInteractiveHover = false;
      if (sandbox.holographicStickers) {
        if (sandbox.holographicStickers.isPlacementActive()) {
          const hit = sandbox.holographicStickers.updatePlacementPreviewFromRay(pointerRaycaster);
          isStickerInteractiveHover = Boolean(hit);
          syncStickerToolHUDInputs();
        } else {
          const stickerHits = sandbox.holographicStickers.raycastPlacedStickers(pointerRaycaster);
          sandbox.hoveredPlacedStickerId =
            stickerHits.length > 0 && stickerHits[0].placedSticker
              ? stickerHits[0].placedSticker.placedId
              : null;
          isStickerInteractiveHover = Boolean(sandbox.hoveredPlacedStickerId);
        }
      }

      document.body.classList.toggle(
        'mount-pointer-hover',
        Boolean(
          sandbox.hoveredMount ||
            sandbox.hoveredMathPod ||
            sandbox.hoveredMathPodPopupId ||
            hoveredHoloColumn ||
            sandbox.hoveredDoomCompanion ||
            isStickerInteractiveHover
        )
      );
    }

    if (!cameraOrbit.isDragging) {
      return;
    }
    if (cameraOrbit.pointerId !== null && e.pointerId !== cameraOrbit.pointerId) {
      return;
    }

    const canLookAround =
      sandbox.mode === 'freeroam' ||
      sandbox.mode === 'scroll' ||
      Boolean(sandbox.director && (sandbox.director.editMode || sandbox.director.cameraPOVMode));
    if (!canLookAround) {
      return;
    }

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

    if (sandbox.director && sandbox.director.cameraPOVMode) {
      sandbox.director.povState.yaw -= dx * 0.0055;
      sandbox.director.povState.pitch = Math.max(
        -1.45,
        Math.min(1.45, sandbox.director.povState.pitch + dy * 0.0050)
      );
      syncDirectorHUDInputs();
      return;
    }

    if (characterCameraState.positioningMode && (characterCameraState.isPanningOffset || e.shiftKey)) {
      const nextShoulderX = Math.max(
        -2.0,
        Math.min(2.0, characterCameraState.shoulderOffsetX + dx * 0.0045)
      );
      const nextHeightY = Math.max(
        0.20,
        Math.min(3.20, characterCameraState.pivotHeightY - dy * 0.0045)
      );
      characterCameraState.shoulderOffsetX = Number(nextShoulderX.toFixed(3));
      characterCameraState.pivotHeightY = Number(nextHeightY.toFixed(3));
      syncCharacterCameraHUDInputs();
      return;
    }

    if (cameraOrbit.maxDragTravel > 2.0) {
      cameraOrbit.userLookOverride = true;
      if (sandbox.mode === 'scroll' && sandbox.director && sandbox.director.cameraPanState.mode === 'settled') {
        sandbox.director.cameraPanState.mode = 'orbit';
      }
    }

    cameraOrbit.yaw -= dx * 0.0065;
    cameraOrbit.yaw = Math.atan2(Math.sin(cameraOrbit.yaw), Math.cos(cameraOrbit.yaw));
    cameraOrbit.pitch = Math.max(
      CAM_MIN_PITCH,
      Math.min(CAM_MAX_PITCH, cameraOrbit.pitch + dy * 0.0055)
    );

    if (characterCameraState.positioningMode || characterCameraState.panelOpen) {
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      const baseYaw = activeChar && Number.isFinite(activeChar.yaw) ? activeChar.yaw : 0.0;
      characterCameraState.yawOffsetRad = Number(wrapAngleRad(cameraOrbit.yaw - baseYaw).toFixed(4));
      characterCameraState.pitchRad = Number(cameraOrbit.pitch.toFixed(4));
      cameraOrbit.userLookOverride = false;
      syncCharacterCameraHUDInputs();
    }
  });

  const handleWindowPointerEnd = (e, isCancel = false) => {
    if (mobileTouch.pointerId !== null && e.pointerId === mobileTouch.pointerId) {
      mobileTouch.resetMove();
      return;
    }
    if (
      mobileTouch.lookThumbpadPointerId !== null &&
      e.pointerId === mobileTouch.lookThumbpadPointerId
    ) {
      mobileTouch.resetLook();
      return;
    }
    if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
      return;
    }
    if (activeSceneObjectPointerId !== null && e.pointerId === activeSceneObjectPointerId) {
      activeSceneObjectPointerId = null;
      if (sandbox.lamppostLight && sandbox.lamppostLight.isDraggingTarget) {
        sandbox.lamppostLight.endTargetDrag();
        syncLamppostEditorHUDInputs();
        return;
      }
      if (
        sandbox.whitepaperHoloColumn &&
        sandbox.whitepaperHoloColumn.docDragGesture &&
        sandbox.whitepaperHoloColumn.docDragGesture.active
      ) {
        const docAction = sandbox.whitepaperHoloColumn.endDocumentDrag(e.clientX, e.clientY);
        if (docAction === 'close') {
          sandbox.closeWhitepaperHologramColumn();
        } else if (docAction === 'page-up') {
          sandbox.whitepaperHoloColumn.scrollDocumentPage(-1);
        } else if (docAction === 'page-down') {
          sandbox.whitepaperHoloColumn.scrollDocumentPage(1);
        } else if (docAction === 'open-pdf') {
          window.open('./SSMWhitePaper.pdf', '_blank', 'noopener,noreferrer');
        }
        return;
      }
      if (sandbox.hologramColumns && sandbox.hologramColumns.activeSwipeColumnId) {
        const swipedCol = sandbox.hologramColumns.endSlideSwipe(e.clientX, e.clientY);
        syncHoloEditorHUDInputs();
        if (sandbox.audio && swipedCol) {
          sandbox.audio.trigger('onUpdate', { target: swipedCol.id, source: 'holo-carousel-slide-commit' });
        }
        return;
      }
      if (sandbox.hologramColumns && sandbox.hologramColumns.activeDragColumnId) {
        const releasedCol = sandbox.hologramColumns.endDrag();
        if (sandbox.holoEditMode && sandbox.transformControls) {
          sandbox.transformControls.enabled = true;
          if (sandbox.transformControlsHelper) {
            sandbox.transformControlsHelper.updateMatrixWorld(true);
          }
        }
        syncHoloEditorHUDInputs();
        if (sandbox.audio && releasedCol) {
          sandbox.audio.trigger('onHover', { target: releasedCol.id, source: 'holo-column-release' });
        }
        return;
      }
      if (placedStickerPointerDownState && placedStickerPointerDownState.pointerId === e.pointerId) {
        const dx = e.clientX - placedStickerPointerDownState.clientX;
        const dy = e.clientY - placedStickerPointerDownState.clientY;
        const clickedPlacedId = placedStickerPointerDownState.placedId;
        placedStickerPointerDownState = null;
        if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
          sandbox.openStickerPopup(clickedPlacedId);
        }
        return;
      }
      if (doomPointerDownState && doomPointerDownState.pointerId === e.pointerId) {
        const dx = e.clientX - doomPointerDownState.clientX;
        const dy = e.clientY - doomPointerDownState.clientY;
        doomPointerDownState = null;
        if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
          sandbox.enterDoomChatMode();
        }
        return;
      }
      if (popupPointerDownState && popupPointerDownState.calloutId) {
        const dx = e.clientX - popupPointerDownState.clientX;
        const dy = e.clientY - popupPointerDownState.clientY;
        const clickedCalloutId = popupPointerDownState.calloutId;
        popupPointerDownState = null;
        if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
          sandbox.focusMathPodPopup(clickedCalloutId);
        }
        return;
      }
      if (sandbox.mathPods && sandbox.mathPods.activeDragPodId) {
        const releasedPod = sandbox.mathPods.endDrag();
        sandbox.draggedMathPod = null;
        if (podPointerDownState && podPointerDownState.podId) {
          const dx = e.clientX - podPointerDownState.clientX;
          const dy = e.clientY - podPointerDownState.clientY;
          if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS && sandbox.mathPodPopups) {
            const isNowOpen = sandbox.mathPodPopups.togglePinForPod(podPointerDownState.podId);
            if (!isNowOpen && sandbox.focusedMathPodPopupId === podPointerDownState.podId) {
              sandbox.exitMathPodPopupFocus();
            }
            if (sandbox.mathPods) {
              sandbox.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
            }
            renderer.render(scene, camera);
          }
          podPointerDownState = null;
        }
        if (sandbox.audio && releasedPod) {
          sandbox.audio.trigger('onHover', { target: releasedPod.id, source: 'math-pod-release' });
        }
        return;
      }
    }

    if (cameraOrbit.isDragging && cameraOrbit.pointerId !== null && e.pointerId !== cameraOrbit.pointerId) {
      return;
    }

    const wasDragging = cameraOrbit.isDragging;
    const dragDistance = cameraOrbit.maxDragTravel;
    cameraOrbit.isDragging = false;
    cameraOrbit.pointerId = null;
    characterCameraState.isPanningOffset = false;
    mobileTouch.lookPointerId = null;
    if (mobileTouch.lookThumbpadPointerId === null) {
      mobileTouch.lookActive = false;
    }

    if (
      wasDragging &&
      dragDistance > 1.5 &&
      (characterCameraState.positioningMode || characterCameraState.panelOpen)
    ) {
      sandbox.saveCharacterCameraState(true);
      if (characterCameraState.positioningMode) {
        return;
      }
    }

    if (stickerPlacementDownState && stickerPlacementDownState.pointerId === e.pointerId) {
      const dx = e.clientX - stickerPlacementDownState.clientX;
      const dy = e.clientY - stickerPlacementDownState.clientY;
      stickerPlacementDownState = null;
      if (
        !isCancel &&
        Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS &&
        sandbox.holographicStickers &&
        sandbox.holographicStickers.isPlacementActive()
      ) {
        sandbox.commitStickerPlacementAtClientPoint(e.clientX, e.clientY);
        return;
      }
    }

    if (placedStickerPointerDownState && placedStickerPointerDownState.pointerId === e.pointerId) {
      const dx = e.clientX - placedStickerPointerDownState.clientX;
      const dy = e.clientY - placedStickerPointerDownState.clientY;
      const clickedPlacedId = placedStickerPointerDownState.placedId;
      placedStickerPointerDownState = null;
      if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
        sandbox.openStickerPopup(clickedPlacedId);
        return;
      }
    }

    if (doomPointerDownState && doomPointerDownState.pointerId === e.pointerId) {
      const dx = e.clientX - doomPointerDownState.clientX;
      const dy = e.clientY - doomPointerDownState.clientY;
      doomPointerDownState = null;
      if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
        sandbox.enterDoomChatMode();
        return;
      }
    }

    if (popupPointerDownState && popupPointerDownState.pointerId === e.pointerId) {
      const dx = e.clientX - popupPointerDownState.clientX;
      const dy = e.clientY - popupPointerDownState.clientY;
      const clickedCalloutId = popupPointerDownState.calloutId;
      popupPointerDownState = null;
      if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS) {
        sandbox.focusMathPodPopup(clickedCalloutId);
        return;
      }
    }

    if (podPointerDownState && podPointerDownState.pointerId === e.pointerId) {
      const dx = e.clientX - podPointerDownState.clientX;
      const dy = e.clientY - podPointerDownState.clientY;
      const clickedPodId = podPointerDownState.podId;
      podPointerDownState = null;
      if (!isCancel && Math.hypot(dx, dy) <= CLICK_MAX_DRAG_PIXELS && sandbox.mathPodPopups) {
        const isNowOpen = sandbox.mathPodPopups.togglePinForPod(clickedPodId);
        if (!isNowOpen && sandbox.focusedMathPodPopupId === clickedPodId) {
          sandbox.exitMathPodPopupFocus();
        }
        if (sandbox.mathPods) {
          sandbox.mathPods.update(1 / 60, holoShaderUniforms.uHoloTime.value);
        }
        renderer.render(scene, camera);
        return;
      }
    }

    if (isCancel) {
      return;
    }

    const isPrimaryOrTouch = e.button === 0 || e.button === undefined || e.pointerType === 'touch';
    const isCanvasTarget = e.target === canvas || e.target === window || e.target === document.body;

    if (
      sandbox.isDoomChatOpen &&
      isPrimaryOrTouch &&
      dragDistance <= CLICK_MAX_DRAG_PIXELS &&
      isCanvasTarget
    ) {
      sandbox.exitDoomChatMode();
      return;
    }

    if (
      sandbox.isStickerPopupOpen &&
      isPrimaryOrTouch &&
      dragDistance <= CLICK_MAX_DRAG_PIXELS &&
      isCanvasTarget
    ) {
      sandbox.closeStickerPopup();
      return;
    }

    if (
      sandbox.isPopupFocused &&
      isPrimaryOrTouch &&
      dragDistance <= CLICK_MAX_DRAG_PIXELS &&
      isCanvasTarget
    ) {
      sandbox.exitMathPodPopupFocus();
      return;
    }

    // Distinguish clean tap/click on 3D wall mount from camera orbit drag (§4.2, §6.1 & Spec 040 §5.3)
    if (
      isPrimaryOrTouch &&
      dragDistance <= CLICK_MAX_DRAG_PIXELS &&
      isCanvasTarget &&
      (wasDragging || sandbox.mode === 'mount-focus')
    ) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
        pointerRaycaster.setFromCamera(pointerNDC, camera);
        const hits = pointerRaycaster.intersectObjects(sandbox.wallMountRaycastTargets, false);
        if (hits.length > 0 && hits[0].object.userData.mountName) {
          const hitMount = sandbox.wallMountsByName[hits[0].object.userData.mountName];
          if (hitMount) {
            const hitUv = hits[0].uv;
            const st = hitMount.station;
            if (hitUv && st) {
              // Top-right ✕ EXIT button on 3D screen mount canvas (exitBtnX=1084..1232, exitBtnY=38..80 -> u in [0.84, 0.97], v in [0.88, 0.96])
              if (
                sandbox.mode === 'mount-focus' &&
                hitUv.x >= 0.84 &&
                hitUv.x <= 0.97 &&
                hitUv.y >= 0.88 &&
                hitUv.y <= 0.96
              ) {
                sandbox.exitMountFocusMode();
                return;
              }
              if (hitUv.x >= 0.56 && hitUv.x <= 0.965) {
                // Secondary CTA Button on 3D screen mount canvas (cta2Y = 540, cta2H = 48 -> v in [0.18, 0.255])
                if (hitUv.y >= 0.175 && hitUv.y <= 0.26 && st.secondaryLink) {
                  if (
                    st.secondaryLink.action === 'open-whitepaper-column' ||
                    st.secondaryLink.url === '#ssm-whitepaper-column'
                  ) {
                    sandbox.openWhitepaperHologramColumn();
                    return;
                  }
                  if (st.secondaryLink.url && sandbox.mode === 'mount-focus') {
                    window.open(st.secondaryLink.url, '_blank', 'noopener,noreferrer');
                    return;
                  }
                }
                // Primary CTA Button on 3D screen mount canvas (cta1Y = 472, cta1H = 54 -> v in [0.265, 0.35])
                if (hitUv.y >= 0.265 && hitUv.y <= 0.355 && st.primaryLink && sandbox.mode === 'mount-focus') {
                  window.open(st.primaryLink.url, '_blank', 'noopener,noreferrer');
                  return;
                }
              }
            }
            if (sandbox.mode === 'freeroam' || sandbox.mode === 'scroll') {
              sandbox.focusWallMount(hitMount.mountName);
            }
          }
        }
      }
    }
  };

  window.addEventListener('pointerup', (e) => handleWindowPointerEnd(e, false));
  window.addEventListener('pointercancel', (e) => handleWindowPointerEnd(e, true));

  window.addEventListener(
    'wheel',
    (e) => {
      if (!sandbox.ready) return;
      if (sandbox.radialMenu && sandbox.radialMenu.isOpen()) {
        return;
      }
      if (
        e.target &&
        e.target.closest &&
        (e.target.closest('#sandbox-hud') ||
          e.target.closest('#char-cam-hud-widget') ||
          e.target.closest('#sticker-holo-popup-panel') ||
          e.target.closest('#doom-holo-chat-panel') ||
          e.target.closest('#intro-dialogue-card') ||
          (sandbox.mode === 'mount-focus' && e.target.closest('#holo-popup-window')))
      ) {
        return;
      }

      if (characterCameraState.positioningMode && !e.altKey) {
        e.preventDefault();
        const nextDist = Math.max(
          CAM_MIN_DISTANCE,
          Math.min(CAM_MAX_DISTANCE, characterCameraState.distance + e.deltaY * 0.0022)
        );
        sandbox.setCharacterCameraState(
          { distance: Number(nextDist.toFixed(3)) },
          { persist: true, persistLocal: true, persistBackend: true, syncHUD: true }
        );
        return;
      }

      if (
        sandbox.holographicStickers &&
        (sandbox.holographicStickers.isPlacementActive() ||
          (e.shiftKey && (sandbox.isStickerPopupOpen || sandbox.hoveredPlacedStickerId)))
      ) {
        e.preventDefault();
        if (
          !sandbox.holographicStickers.isPlacementActive() &&
          sandbox.hoveredPlacedStickerId &&
          !sandbox.isStickerPopupOpen
        ) {
          sandbox.holographicStickers.selectPlacedSticker(sandbox.hoveredPlacedStickerId);
        }
        sandbox.resizeStickerByStep(-e.deltaY * 0.0012);
        return;
      }

      if (sandbox.whitepaperColumnOpen && sandbox.whitepaperHoloColumn) {
        e.preventDefault();
        sandbox.whitepaperHoloColumn.scrollDocumentByPixels(e.deltaY * 1.45);
        return;
      }

      // Shift + Scroll (or Scroll while dragging a hologram / in Edit Mode over a hologram) resizes the hologram directly in-scene (dev mode only)!
      if (IS_DEV_MODE && sandbox.hologramColumns && (e.shiftKey || sandbox.hologramColumns.activeDragColumnId || sandbox.holoEditMode)) {
        let targetColId = sandbox.hologramColumns.activeDragColumnId || (e.shiftKey ? sandbox.selectedHoloColumnId : null);
        if (!targetColId) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2.0 - 1.0;
            pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2.0 + 1.0;
            pointerRaycaster.setFromCamera(pointerNDC, camera);
            const rawHoloHits = pointerRaycaster.intersectObjects(sandbox.hologramColumns.raycastTargets, false);
            const holoHits = sandbox.holoEditMode
              ? rawHoloHits
              : rawHoloHits.filter((h) => h.object?.userData?.holoColumnId !== 'watercolor_gallery');
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

      // In First-Person Camera POV Mode, mouse wheel dollies the camera forward/backward along its look ray
      if (sandbox.director && sandbox.director.cameraPOVMode) {
        e.preventDefault();
        const lookDir = camera.getWorldDirection(new THREE.Vector3()).normalize();
        const dollyStep = -e.deltaY * 0.004;
        sandbox.director.povState.position.addScaledVector(lookDir, dollyStep);
        syncDirectorHUDInputs();
        return;
      }

      if (sandbox.isPopupFocused) {
        sandbox.exitMathPodPopupFocus();
      }

      if (sandbox.mode === 'scroll') {
        e.preventDefault();
        if (sandbox.director && sandbox.director.isScrollLocked()) {
          sandbox.targetScrollProgress = 0.0;
          sandbox.scrollProgress = 0.0;
          sandbox.scrollVelocity = 0.0;
          syncWindowScrollToFraction(0.0);
          return;
        }
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
        if (
          sandbox.director &&
          sandbox.targetScrollProgress > 0.002 &&
          sandbox.director.introSequenceState.phase !== 'scrolling-alley'
        ) {
          sandbox.director.introSequenceState.phase = 'scrolling-alley';
          syncIntroDialogueOverlayUI();
          syncDirectorHUDInputs();
        }
      } else {
        e.preventDefault();
        if (sandbox.mode === 'freeroam') {
          cameraOrbit.desiredDistance = Math.max(
            CAM_MIN_DISTANCE,
            Math.min(CAM_MAX_DISTANCE, cameraOrbit.desiredDistance + e.deltaY * 0.0025)
          );
          characterCameraState.distance = Number(cameraOrbit.desiredDistance.toFixed(3));
          if (characterCameraState.panelOpen) {
            syncCharacterCameraHUDInputs();
          }
        }
      }
    },
    { passive: false }
  );

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (crtOpticalPassSystem) {
      crtOpticalPassSystem.onResize(window.innerWidth, window.innerHeight);
    }
    if (!isMobileTouchForceDisabled()) {
      const shouldBeMobile = detectInitialMobileTouchMode();
      if (shouldBeMobile && !mobileTouch.enabled) {
        mobileTouch.setEnabled(true);
      }
      if (shouldBeMobile && !sandbox._userManuallyToggledSidebar && !sandbox.sidebarCollapsed) {
        sandbox.toggleSidebar(true);
      }
    }
    mobileTouch.syncDOM();
    syncPortalGamePopupDOM();
    syncHoloCustomScrollbar();
    if (sandbox.mode === 'scroll') {
      syncWindowScrollToFraction(sandbox.targetScrollProgress);
    }
    if (sandbox.ready) {
      updateCameraController(0.0);
      updateDoomHoloChatTether();
      updateStickerHoloPopupTether();
      if (crtOpticalPassSystem && crtOpticalPassSystem.state.enabled) {
        crtOpticalPassSystem.render(0.0, holoShaderUniforms.uHoloTime.value);
      } else {
        renderer.render(scene, camera);
      }
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

  const hudToggleMp3Btn = document.getElementById('hud-toggle-mp3-btn');
  if (hudToggleMp3Btn) {
    hudToggleMp3Btn.addEventListener('click', () => {
      if (sandbox.mp3Player) {
        sandbox.mp3Player.toggleVisible();
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
    if (characterCameraState.positioningMode) {
      e.preventDefault();
      return;
    }
    if (cameraOrbit.maxDragTravel <= CLICK_MAX_DRAG_PIXELS && sandbox.radialMenu) {
      e.preventDefault();
      sandbox.radialMenu.toggle();
    }
  });

  const exitFocusBtn = document.getElementById('exit-mount-focus-btn');
  if (exitFocusBtn) {
    exitFocusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { source: 'exit-mount-focus-btn' });
      }
      if (sandbox.mode === 'mount-focus') {
        sandbox.exitMountFocusMode();
      } else if (sandbox.mode === 'scroll') {
        enterFreeRoamMode();
      }
    });
  }

  const holoTagPopupCloseBtn = document.getElementById('holo-tag-popup-close-btn');
  if (holoTagPopupCloseBtn) {
    holoTagPopupCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sandbox.audio) {
        sandbox.audio.trigger('onUpdate', { source: 'holo-tag-popup-close' });
      }
      const activeSt =
        sandbox.activeHoloProject ||
        (sandbox.focusedMount ? sandbox.focusedMount.station : null) ||
        getActiveHoloStationForProgress(sandbox.scrollProgress, sandbox.mode);
      setActiveHoloTagPopup(activeSt, null, { playAudio: false });
    });
  }

  const holoScrollViewportEl =
    document.getElementById('holo-works-horizontal-track') ||
    document.getElementById('holo-body-scroll-viewport');
  const holoCustomScrollbarEl = document.getElementById('holo-custom-scrollbar');
  const holoCustomThumbEl = document.getElementById('holo-custom-scrollbar-thumb');
  if (holoScrollViewportEl) {
    holoScrollViewportEl.addEventListener(
      'scroll',
      () => {
        syncHoloCustomScrollbar();
      },
      { passive: true }
    );
  }
  if (holoCustomScrollbarEl && holoCustomThumbEl && holoScrollViewportEl) {
    let isDraggingScrollbarThumb = false;
    let dragStartClientY = 0;
    let dragStartScrollTop = 0;

    holoCustomThumbEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const maxScroll = Math.max(
        0,
        holoScrollViewportEl.scrollHeight - holoScrollViewportEl.clientHeight
      );
      if (maxScroll <= 1) return;
      isDraggingScrollbarThumb = true;
      dragStartClientY = e.clientY;
      dragStartScrollTop = holoScrollViewportEl.scrollTop;
      holoCustomThumbEl.classList.add('is-dragging');
      if (holoCustomThumbEl.setPointerCapture) {
        try {
          holoCustomThumbEl.setPointerCapture(e.pointerId);
        } catch (_err) {
          // ignore pointer capture edge cases
        }
      }
    });

    holoCustomThumbEl.addEventListener('pointermove', (e) => {
      if (!isDraggingScrollbarThumb) return;
      e.stopPropagation();
      e.preventDefault();
      const maxScroll = Math.max(
        0,
        holoScrollViewportEl.scrollHeight - holoScrollViewportEl.clientHeight
      );
      if (maxScroll <= 1) return;
      const trackH = Math.max(24, holoCustomScrollbarEl.clientHeight || 160);
      const thumbH = Math.max(24, holoCustomThumbEl.offsetHeight || 40);
      const availableTravel = Math.max(1, trackH - thumbH);
      const deltaY = e.clientY - dragStartClientY;
      const nextScrollTop = Math.max(
        0,
        Math.min(maxScroll, dragStartScrollTop + (deltaY / availableTravel) * maxScroll)
      );
      holoScrollViewportEl.scrollTop = nextScrollTop;
      syncHoloCustomScrollbar();
    });

    const endThumbDrag = (e) => {
      if (!isDraggingScrollbarThumb) return;
      isDraggingScrollbarThumb = false;
      holoCustomThumbEl.classList.remove('is-dragging');
      if (e && holoCustomThumbEl.releasePointerCapture) {
        try {
          holoCustomThumbEl.releasePointerCapture(e.pointerId);
        } catch (_err) {
          // ignore
        }
      }
    };
    holoCustomThumbEl.addEventListener('pointerup', endThumbDrag);
    holoCustomThumbEl.addEventListener('pointercancel', endThumbDrag);

    holoCustomScrollbarEl.addEventListener('pointerdown', (e) => {
      if (e.target === holoCustomThumbEl) return;
      e.stopPropagation();
      const maxScroll = Math.max(
        0,
        holoScrollViewportEl.scrollHeight - holoScrollViewportEl.clientHeight
      );
      if (maxScroll <= 1) return;
      const rect = holoCustomScrollbarEl.getBoundingClientRect();
      if (rect.height <= 0) return;
      const clickRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      holoScrollViewportEl.scrollTop = clickRatio * maxScroll;
      syncHoloCustomScrollbar();
    });
  }

  const holoPopupWinEl = document.getElementById('holo-popup-window');
  if (holoPopupWinEl) {
    holoPopupWinEl.addEventListener(
      'wheel',
      (e) => {
        if (sandbox.mode === 'mount-focus') {
          e.stopPropagation();
        }
      },
      { passive: true }
    );
    holoPopupWinEl.addEventListener(
      'touchmove',
      (e) => {
        if (sandbox.mode === 'mount-focus') {
          e.stopPropagation();
        }
      },
      { passive: true }
    );
  }

  const holoSecondaryLinkEl = document.getElementById('holo-secondary-link');
  if (holoSecondaryLinkEl) {
    holoSecondaryLinkEl.addEventListener('click', (e) => {
      const activeSt =
        sandbox.activeHoloProject ||
        (sandbox.focusedMount ? sandbox.focusedMount.station : null) ||
        getActiveHoloStationForProgress(sandbox.scrollProgress, sandbox.mode);
      if (
        activeSt &&
        activeSt.secondaryLink &&
        (activeSt.secondaryLink.action === 'open-whitepaper-column' ||
          activeSt.secondaryLink.url === '#ssm-whitepaper-column')
      ) {
        e.preventDefault();
        e.stopPropagation();
        sandbox.openWhitepaperHologramColumn();
      }
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

  const hudOpenDoomChatBtn = document.getElementById('hud-open-doom-chat-btn');
  if (hudOpenDoomChatBtn) {
    hudOpenDoomChatBtn.addEventListener('click', () => {
      sandbox.toggleDoomChatMode();
    });
  }

  const doomCloseChatBtn = document.getElementById('doom-close-chat-btn');
  if (doomCloseChatBtn) {
    doomCloseChatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.exitDoomChatMode();
    });
  }

  const doomBackToStartersBtn = document.getElementById('doom-back-to-starters-btn');
  if (doomBackToStartersBtn) {
    doomBackToStartersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.resetDoomChatToStarters({ refreshStarters: false });
    });
  }

  const doomRefreshStartersBtn = document.getElementById('doom-refresh-starters-btn');
  if (doomRefreshStartersBtn) {
    doomRefreshStartersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.refreshDoomStarters().catch(() => {});
    });
  }

  const doomStarterBtn0 = document.getElementById('doom-starter-btn-0');
  if (doomStarterBtn0) {
    doomStarterBtn0.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.selectDoomStarter(0).catch(() => {});
    });
  }

  const doomStarterBtn1 = document.getElementById('doom-starter-btn-1');
  if (doomStarterBtn1) {
    doomStarterBtn1.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.selectDoomStarter(1).catch(() => {});
    });
  }

  const doomChatInputForm = document.getElementById('doom-chat-input-form');
  const doomChatInputEl = document.getElementById('doom-chat-input');
  if (doomChatInputForm && doomChatInputEl) {
    doomChatInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = doomChatInputEl.value;
      if (val && val.trim()) {
        sandbox.sendDoomChatMessage(val).catch(() => {});
      }
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

  const elHoloCarouselPrevBtn = document.getElementById('holo-carousel-prev-btn');
  if (elHoloCarouselPrevBtn) {
    elHoloCarouselPrevBtn.addEventListener('click', () => {
      sandbox.prevHoloSlide(sandbox.selectedHoloColumnId);
    });
  }

  const elHoloCarouselNextBtn = document.getElementById('holo-carousel-next-btn');
  if (elHoloCarouselNextBtn) {
    elHoloCarouselNextBtn.addEventListener('click', () => {
      sandbox.nextHoloSlide(sandbox.selectedHoloColumnId);
    });
  }

  const elHoloCarouselUploadBtn = document.getElementById('holo-carousel-upload-btn');
  const elHoloCarouselFileInput = document.getElementById('holo-carousel-file-input');
  if (elHoloCarouselUploadBtn && elHoloCarouselFileInput) {
    elHoloCarouselUploadBtn.addEventListener('click', () => {
      elHoloCarouselFileInput.click();
    });
    elHoloCarouselFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        sandbox.uploadHoloCarouselSlides(e.target.files, sandbox.selectedHoloColumnId);
        e.target.value = '';
      }
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
        const col = sandbox.hologramColumns.getColumn(colId);
        const defaultRemap = col && col.isCarousel ? 0.32 : 0.72;
        const nextRemapWeight = typeof preset.colorRemapWeight === 'number' ? preset.colorRemapWeight : defaultRemap;
        sandbox.hologramColumns.setParams(colId, {
          colorAndLuminance: {
            primaryTintHex: preset.primaryHex,
            secondaryTintHex: preset.secondaryHex,
            colorRemapWeight: nextRemapWeight,
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

  bindDirectorHUDListeners();
  bindStickerToolAndPopupListeners();
  bindPortalGamePopupListeners();
}

function bindPortalGamePopupListeners() {
  if (typeof document === 'undefined') return;
  const stageEl = document.getElementById('portal-game-holo-stage');
  const winEl = document.getElementById('portal-game-holo-window');
  const exitBtn = document.getElementById('portal-holo-exit-btn');
  const gridEl = document.getElementById('portal-game-cards-grid');

  if (stageEl) {
    stageEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    stageEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === stageEl && sandbox.isPortalPopupOpen) {
        sandbox.closePortalGameSelectorPopup({ source: 'backdrop-click' });
      }
    });
  }

  if (winEl) {
    winEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    winEl.addEventListener('click', (e) => e.stopPropagation());
  }

  if (exitBtn) {
    exitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.closePortalGameSelectorPopup({ source: 'exit-button' });
    });
  }

  if (gridEl) {
    gridEl.addEventListener('pointerover', (e) => {
      const card = e.target && e.target.closest ? e.target.closest('.portal-game-card') : null;
      if (!card || !gridEl.contains(card)) return;
      const gameId = card.getAttribute('data-game-id');
      if (!gameId) return;
      if (sandbox.waterColor && sandbox.waterColor.hoveredGameId !== gameId) {
        sandbox.waterColor.setHoveredGame(gameId);
        sandbox.selectPortalGame(gameId, { silent: false });
      }
    });

    gridEl.addEventListener('pointerleave', () => {
      if (sandbox.waterColor) {
        sandbox.waterColor.setHoveredGame(null);
      }
    });

    gridEl.addEventListener('click', (e) => {
      const card = e.target && e.target.closest ? e.target.closest('.portal-game-card') : null;
      if (!card || !gridEl.contains(card)) return;
      const gameId = card.getAttribute('data-game-id');
      if (!gameId) return;
      e.stopPropagation();
      sandbox.launchPortalGame(gameId, { source: 'card-click' });
    });
  }

  syncPortalGamePopupDOM();
}

function bindStickerToolAndPopupListeners() {
  if (typeof document === 'undefined') return;

  const stopProp = (e) => e.stopPropagation();
  const popupPanelEl = document.getElementById('sticker-holo-popup-panel');
  if (popupPanelEl) {
    popupPanelEl.addEventListener('pointerdown', stopProp);
    popupPanelEl.addEventListener('click', stopProp);
  }

  const openRadialBtn = document.getElementById('hud-open-sticker-radial-btn');
  if (openRadialBtn) {
    openRadialBtn.addEventListener('click', () => {
      if (sandbox.radialMenu) {
        sandbox.radialMenu.toggle();
      }
    });
  }

  const openRadialHudBtn = document.getElementById('hud-open-sticker-radial-btn');
  if (openRadialHudBtn) {
    openRadialHudBtn.addEventListener('click', () => {
      if (sandbox.radialMenu) {
        sandbox.radialMenu.toggle();
      }
    });
  }

  const startPlaceBtn = document.getElementById('sticker-start-place-btn');
  if (startPlaceBtn) {
    startPlaceBtn.addEventListener('click', () => {
      if (sandbox.holographicStickers && sandbox.holographicStickers.isPlacementActive()) {
        sandbox.cancelStickerPlacement();
      } else {
        const selectEl = document.getElementById('sticker-asset-select');
        const stickerId = selectEl ? selectEl.value : sandbox.selectedHoloStickerId;
        sandbox.startStickerPlacement(stickerId);
      }
    });
  }

  const cancelPlaceBannerBtn = document.getElementById('sticker-placement-cancel-btn');
  if (cancelPlaceBannerBtn) {
    cancelPlaceBannerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.cancelStickerPlacement();
    });
  }

  const assetSelectEl = document.getElementById('sticker-asset-select');
  if (assetSelectEl) {
    assetSelectEl.addEventListener('change', (e) => {
      const nextId = e.target.value;
      sandbox.selectedHoloStickerId = nextId;
      if (sandbox.holographicStickers && sandbox.holographicStickers.isPlacementActive()) {
        sandbox.startStickerPlacement(nextId);
      } else {
        syncStickerToolHUDInputs();
      }
    });
  }

  const calibToggleBtn = document.getElementById('sticker-calib-toggle-btn');
  if (calibToggleBtn) {
    calibToggleBtn.addEventListener('click', () => {
      sandbox.toggleStickerCalibrationTool();
    });
  }

  function bindMinMaxPair(sliderId, inputId, boundKey) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    const applyVal = (raw) => {
      const val = parseFloat(raw);
      if (Number.isFinite(val)) {
        sandbox.setStickerSizeBounds({ [boundKey]: val }, true);
      }
    };
    if (sEl) {
      sEl.addEventListener('input', (e) => applyVal(e.target.value));
    }
    if (iEl) {
      iEl.addEventListener('input', (e) => applyVal(e.target.value));
      iEl.addEventListener('change', (e) => applyVal(e.target.value));
    }
  }
  bindMinMaxPair('sticker-min-size-slider', 'sticker-min-size-input', 'minSize');
  bindMinMaxPair('sticker-max-size-slider', 'sticker-max-size-input', 'maxSize');

  const capMinBtn = document.getElementById('sticker-capture-min-btn');
  if (capMinBtn) {
    capMinBtn.addEventListener('click', () => {
      sandbox.captureCurrentStickerAsMinSize(true);
    });
  }
  const capMaxBtn = document.getElementById('sticker-capture-max-btn');
  if (capMaxBtn) {
    capMaxBtn.addEventListener('click', () => {
      sandbox.captureCurrentStickerAsMaxSize(true);
    });
  }

  function bindSizeControlPair(sliderId, inputId) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    const applyVal = (raw) => {
      const val = parseFloat(raw);
      if (Number.isFinite(val)) {
        sandbox.resizeStickerToMeters(val);
      }
    };
    if (sEl) sEl.addEventListener('input', (e) => applyVal(e.target.value));
    if (iEl) {
      iEl.addEventListener('input', (e) => applyVal(e.target.value));
      iEl.addEventListener('change', (e) => applyVal(e.target.value));
    }
  }
  bindSizeControlPair('sticker-cur-size-slider', 'sticker-cur-size-input');

  function bindRotControlPair(sliderId, inputId) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    const applyVal = (raw) => {
      const val = parseFloat(raw);
      if (Number.isFinite(val)) {
        sandbox.rotateStickerToDeg(val);
      }
    };
    if (sEl) sEl.addEventListener('input', (e) => applyVal(e.target.value));
    if (iEl) {
      iEl.addEventListener('input', (e) => applyVal(e.target.value));
      iEl.addEventListener('change', (e) => applyVal(e.target.value));
    }
  }
  bindRotControlPair('sticker-rot-deg-slider', 'sticker-rot-deg-input');

  const openPopupHudBtn = document.getElementById('sticker-open-popup-btn');
  if (openPopupHudBtn) {
    openPopupHudBtn.addEventListener('click', () => {
      if (sandbox.isStickerPopupOpen) {
        sandbox.closeStickerPopup();
      } else {
        const rec = sandbox.openStickerPopup();
        if (!rec && sandbox.holographicStickers) {
          // If no sticker has been placed yet, place one on the left wall at SPAWN_PLAYER so the popup can be inspected immediately
          const placed = sandbox.placeStickerAt(
            {
              stickerId: sandbox.selectedHoloStickerId || 'doom_tag',
              surfaceId: 'COLLIDER_STICKER_WALL_L',
              surfaceLabel: 'Left Alley Wall (Interior)',
              surfaceCategory: 'interior-wall',
              wallSide: 'L',
              position: { x: resolveStickerWallProfileX('L', 3.5) + 0.015, y: 1.55, z: 3.5 },
              normal: { x: 1, y: 0, z: 0 },
            },
            { openPopup: true }
          );
          if (placed) {
            sandbox.openStickerPopup(placed.placedId);
          }
        }
      }
    });
  }

  const closePopupBtn = document.getElementById('sticker-close-popup-btn') || document.getElementById('sticker-holo-close-btn');
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
      sandbox.closeStickerPopup();
    });
  }

  const repositionBtn = document.getElementById('sticker-reposition-btn');
  if (repositionBtn) {
    repositionBtn.addEventListener('click', () => {
      sandbox.repositionSelectedSticker();
    });
  }

  const deleteBtn = document.getElementById('sticker-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      sandbox.deleteSelectedSticker();
    });
  }

  const tagFormEl = document.getElementById('sticker-tag-form');
  if (tagFormEl) {
    tagFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const taggerEl = document.getElementById('sticker-tagger-input');
      const msgEl = document.getElementById('sticker-message-input');
      const tagger = taggerEl ? taggerEl.value : '';
      const message = msgEl ? msgEl.value : '';
      sandbox.saveStickerTagAndMessage(null, tagger, message);
      const saveBtn = document.getElementById('sticker-save-message-btn') || document.getElementById('sticker-save-tag-btn');
      if (saveBtn) {
        const orig = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        setTimeout(() => {
          saveBtn.textContent = orig;
        }, 1200);
      }
    });
  }

  const copyJsonBtn = document.getElementById('sticker-copy-json-btn');
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', async () => {
      if (!sandbox.holographicStickers) return;
      const jsonStr = sandbox.holographicStickers.exportSizeConfigJSON();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        }
        const origText = copyJsonBtn.textContent;
        copyJsonBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyJsonBtn.textContent = origText;
        }, 1400);
      } catch (err) {
        console.log('Sticker Size Config JSON:\n', jsonStr);
      }
    });
  }

  // On-Screen Third-Person Character Follow Camera HUD Widget & Panel Controls
  const charCamToggleBtn = document.getElementById('char-cam-hud-toggle-btn');
  if (charCamToggleBtn) {
    charCamToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.toggleCharacterCameraPanel();
    });
  }

  const charCamCloseBtn = document.getElementById('char-cam-close-btn');
  if (charCamCloseBtn) {
    charCamCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.toggleCharacterCameraPanel(false);
    });
  }

  const charCamPosModeBtn = document.getElementById('char-cam-pos-mode-btn');
  if (charCamPosModeBtn) {
    charCamPosModeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.toggleCharacterCameraPositioningMode();
    });
  }

  document.querySelectorAll('[data-cam-preset]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetKey = btn.getAttribute('data-cam-preset');
      if (presetKey) {
        sandbox.applyCharacterCameraPreset(presetKey, true);
      }
    });
  });

  function bindCharCamControlPair(sliderId, inputId, applyFn) {
    const sEl = document.getElementById(sliderId);
    const iEl = document.getElementById(inputId);
    const onInput = (raw, commit = false) => {
      const val = parseFloat(raw);
      if (Number.isFinite(val)) {
        applyFn(val, commit);
      }
    };
    if (sEl) {
      sEl.addEventListener('input', (e) => onInput(e.target.value, false));
      sEl.addEventListener('change', (e) => onInput(e.target.value, true));
    }
    if (iEl) {
      iEl.addEventListener('input', (e) => onInput(e.target.value, false));
      iEl.addEventListener('change', (e) => onInput(e.target.value, true));
    }
  }

  bindCharCamControlPair('char-cam-dist-slider', 'char-cam-dist-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { distance: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-height-slider', 'char-cam-height-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { pivotHeightY: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-shoulder-slider', 'char-cam-shoulder-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { shoulderOffsetX: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-forward-slider', 'char-cam-forward-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { forwardOffsetZ: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-pitch-slider', 'char-cam-pitch-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { pitchDeg: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-yaw-slider', 'char-cam-yaw-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { yawOffsetDeg: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-fov-slider', 'char-cam-fov-input', (val, commit) => {
    sandbox.ensureCharacterFollowCameraPreviewActive();
    sandbox.setCharacterCameraState(
      { fovDeg: val },
      { persist: commit, persistLocal: true, persistBackend: commit, syncHUD: true }
    );
  });
  bindCharCamControlPair('char-cam-scroll-slider', 'char-cam-scroll-input', (val) => {
    if (sandbox.director) {
      if (sandbox.director.cameraPanState && sandbox.director.cameraPanState.playing) {
        sandbox.director.stopStartupPan(true);
      }
      if (sandbox.director.cameraPanState && sandbox.director.cameraPanState.mode === 'settled') {
        sandbox.director.cameraPanState.mode = 'orbit';
      }
      if (sandbox.director.introSequenceState && sandbox.director.introSequenceState.scrollLocked) {
        sandbox.director.introSequenceState.scrollLocked = false;
        sandbox.director.introSequenceState.phase = 'scrolling-alley';
        syncIntroDialogueOverlayUI();
      }
    }
    const frac = Math.max(0.0, Math.min(1.0, val / 100.0));
    sandbox.setScrollProgress(frac, { smooth: false });
    syncCharacterCameraHUDInputs();
  });

  const charCamWallClampBtn = document.getElementById('char-cam-wall-clamp-btn');
  if (charCamWallClampBtn) {
    charCamWallClampBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.setCharacterCameraState(
        { wallClampEnabled: !characterCameraState.wallClampEnabled },
        { persist: true, persistLocal: true, persistBackend: true, syncHUD: true }
      );
    });
  }

  const charCamCaptureBtn = document.getElementById('char-cam-capture-btn');
  if (charCamCaptureBtn) {
    charCamCaptureBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.captureCharacterCameraFromCurrentOrbit(true);
      const orig = charCamCaptureBtn.textContent;
      charCamCaptureBtn.textContent = '✓ Captured!';
      setTimeout(() => {
        charCamCaptureBtn.textContent = orig;
      }, 1100);
    });
  }

  const charCamSaveBtn = document.getElementById('char-cam-save-btn');
  if (charCamSaveBtn) {
    charCamSaveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.saveCharacterCameraState(true);
      const orig = charCamSaveBtn.textContent;
      charCamSaveBtn.textContent = '✓ Saved!';
      setTimeout(() => {
        charCamSaveBtn.textContent = orig;
      }, 1200);
    });
  }

  const charCamResetBtn = document.getElementById('char-cam-reset-btn');
  if (charCamResetBtn) {
    charCamResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sandbox.resetCharacterCameraToDefault(true);
    });
  }

  const charCamCopyBtn = document.getElementById('char-cam-copy-btn');
  if (charCamCopyBtn) {
    charCamCopyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const jsonStr = sandbox.exportCharacterCameraJSON();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        }
        const orig = charCamCopyBtn.textContent;
        charCamCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          charCamCopyBtn.textContent = orig;
        }, 1200);
      } catch (_err) {
        console.log('Character Camera JSON:\n', jsonStr);
      }
    });
  }
}

// ============================================================================
// Asset Ingestion & Scene Staging
// ============================================================================
async function fetchRangeChunkedArrayBuffer(url, { chunkSize = 1048576, maxChunkAttempts = 4 } = {}) {
  let offset = 0;
  let totalBytes = null;
  let fullBytes = null;

  while (totalBytes === null || offset < totalBytes) {
    const endByte =
      totalBytes !== null
        ? Math.min(totalBytes - 1, offset + chunkSize - 1)
        : offset + chunkSize - 1;
    let chunkSucceeded = false;
    let lastErr = null;

    for (let attempt = 1; attempt <= maxChunkAttempts; attempt++) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 12000) : null;
      try {
        const resp = await fetch(url, {
          headers: { Range: `bytes=${offset}-${endByte}` },
          signal: controller ? controller.signal : undefined,
        });
        if (resp.status === 200 && offset === 0) {
          return await resp.arrayBuffer();
        }
        if (resp.status !== 206) {
          throw new Error(`HTTP ${resp.status} for '${url}' (range ${offset}-${endByte})`);
        }
        const cr = resp.headers.get('Content-Range') || '';
        const match = /bytes\s+(\d+)-(\d+)\/(\d+)/i.exec(cr);
        if (!match) {
          throw new Error(`Invalid Content-Range '${cr}' for '${url}'`);
        }
        const respStart = Number(match[1]);
        const respEnd = Number(match[2]);
        const respTotal = Number(match[3]);
        const expectedLen = respEnd - respStart + 1;
        const part = new Uint8Array(await resp.arrayBuffer());
        if (respStart !== offset || part.byteLength !== expectedLen || respTotal <= 0) {
          throw new Error(
            `Range mismatch for '${url}': got ${part.byteLength}B [${respStart}-${respEnd}/${respTotal}], expected ${expectedLen}B at ${offset}`
          );
        }
        if (offset === 0 && part.byteLength === respTotal) {
          return part.buffer;
        }
        if (fullBytes === null) {
          totalBytes = respTotal;
          fullBytes = new Uint8Array(respTotal);
        }
        fullBytes.set(part, offset);
        offset += part.byteLength;
        chunkSucceeded = true;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < maxChunkAttempts) {
          const waitMs = 450 * attempt;
          console.warn(
            `[Sandbox] Transient chunk error for '${url}' at byte ${offset} (attempt ${attempt}/${maxChunkAttempts}), retrying in ${waitMs}ms:`,
            err?.message || err
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    if (!chunkSucceeded) {
      throw new Error(
        `Failed to load GLB asset '${url}' at byte ${offset} after ${maxChunkAttempts} attempts: ${lastErr?.message || lastErr}`
      );
    }
  }

  return fullBytes ? fullBytes.buffer : new ArrayBuffer(0);
}

async function runBoundedTaskPool(taskFns, concurrency = 4) {
  const results = new Array(taskFns.length);
  let nextIdx = 0;
  const workerCount = Math.max(1, Math.min(concurrency, taskFns.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= taskFns.length) break;
      results[idx] = await taskFns[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

async function loadGLB(loader, url, onAssetDone = null) {
  const arrayBuffer = await fetchRangeChunkedArrayBuffer(url);
  const resourcePath =
    loader.resourcePath !== ''
      ? loader.resourcePath
      : loader.path !== ''
        ? THREE.LoaderUtils.resolveURL(THREE.LoaderUtils.extractUrlBase(url), loader.path)
        : THREE.LoaderUtils.extractUrlBase(url);
  const gltf = await new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      resourcePath,
      (loaded) => resolve(loaded),
      (err) => reject(new Error(`Failed to parse GLB asset '${url}': ${err?.message || err}`))
    );
  });
  if (typeof onAssetDone === 'function') {
    onAssetDone();
  }
  return gltf;
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
          sprayLoader.teardownContext();
        }
        if (
          sandbox.director &&
          sandbox.mode === 'scroll' &&
          sandbox.scrollProgress <= 0.01 &&
          sandbox.director.introSequenceState &&
          sandbox.director.introSequenceState.phase === 'pan-playing' &&
          !sandbox.director.cameraPanState.playing
        ) {
          sandbox.director.playStartupPan();
        }
      }, holdDelay);
    },
  });

  sprayLoader.play();

  sandbox.sprayLoader = sprayLoader;
  window.sprayPaintLoader = sprayLoader;

  sandbox.skipSprayPaintIntro = () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    sprayLoader.isSkipped = true;
    sprayLoader.setProgress(1.0, { immediate: true });
    sprayLoader.pause();
    updateSprayDOMLabels(sprayLoader);
    if (overlayEl) {
      overlayEl.classList.add('hidden');
    }
    if (!sprayLoader.keepVisibleForTest) {
      sprayLoader.teardownContext();
    }
    if (sandbox.director && sandbox.mode === 'scroll' && sandbox.scrollProgress <= 0.01) {
      sandbox.director.playStartupPan();
    }
  };

  sandbox.replaySprayPaintIntro = (mode = 'autoplay') => {
    if (dismissTimer) clearTimeout(dismissTimer);
    sprayLoader.isSkipped = false;
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

function buildVillainyNeonSignSubsystem(villainySignGLTF, floorY = 0.0) {
  villainySignRootGroup.clear();
  if (!villainySignGLTF || !villainySignGLTF.scene) {
    raiseFatalError("Missing 'villainy_inc_textured.glb' scene payload.");
  }

  // Entrance overhead placement spanning across the alley throat (Z = 5.15m, just ahead of SPAWN_PLAYER Z = 3.00m)
  const defaultSignZ = 5.15;
  const defaultSignRelY = 2.82;
  const defaultSignScale = 1.32;
  const defaultYawRad = Math.PI;
  const defaultXL = resolveAlleyWallProfileX('left', defaultSignZ);
  const defaultXR = resolveAlleyWallProfileX('right', defaultSignZ);
  const defaultSignX = Number(((defaultXL + defaultXR) * 0.5).toFixed(3));
  const defaultSignY = floorY + defaultSignRelY;

  const basePlaneWidthMeters = 1.6606;
  const basePlaneHeightMeters = 1.1516;
  const signAspectRatio = Number((basePlaneWidthMeters / basePlaneHeightMeters).toFixed(4));

  const assemblyGroup = new THREE.Group();
  assemblyGroup.name = 'VILLAINY_INC_OVERHEAD_SIGN';
  assemblyGroup.position.set(defaultSignX, defaultSignY, defaultSignZ);
  // Rotate 180 deg around Y so the front (+Z in glTF) faces -Z toward the alley entrance camera
  assemblyGroup.rotation.set(0.0, defaultYawRad, 0.0);
  assemblyGroup.scale.setScalar(defaultSignScale);

  const modelClone = villainySignGLTF.scene.clone(true);
  modelClone.name = 'VillainyIncSignMeshRoot';
  modelClone.position.set(0.0, 0.0, 0.0);
  modelClone.rotation.set(0.0, 0.0, 0.0);
  modelClone.scale.setScalar(1.0);

  const signMeshes = [];
  const signMaterials = [];
  modelClone.traverse((child) => {
    if (child.isMesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.holoColumnId = 'villainy_inc_sign';
      signMeshes.push(child);
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (!m) continue;
        m.emissiveIntensity = 3.10;
        m.needsUpdate = true;
        if (!signMaterials.includes(m)) {
          signMaterials.push(m);
        }
      }
    }
  });
  if (signMeshes.length === 0) {
    raiseFatalError("Zero mesh primitives found inside 'villainy_inc_textured.glb'.");
  }
  assemblyGroup.add(modelClone);

  // Invisible bounding-box hit proxy so clicking anywhere on the sign face, letters, or iron frame raycasts cleanly
  const hitProxyGeom = new THREE.BoxGeometry(basePlaneWidthMeters + 0.14, basePlaneHeightMeters + 0.14, 0.24);
  const hitProxyMat = new THREE.MeshBasicMaterial({
    name: 'VillainySignHitProxyMat',
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
  const hitProxyMesh = new THREE.Mesh(hitProxyGeom, hitProxyMat);
  hitProxyMesh.name = 'VillainySignHitProxy';
  hitProxyMesh.userData.holoColumnId = 'villainy_inc_sign';
  assemblyGroup.add(hitProxyMesh);

  // Selection wireframe highlight matching Hologram Column assets when in 3D Gizmo Edit Mode, hovering, or dragging
  const selectionEdgesGeom = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(basePlaneWidthMeters + 0.06, basePlaneHeightMeters + 0.06, 0.16)
  );
  const selectionFrameMat = new THREE.LineBasicMaterial({
    name: 'VillainySignSelectionFrameMat',
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.92,
    fog: false,
    toneMapped: false,
    depthTest: false,
  });
  const selectionFrame = new THREE.LineSegments(selectionEdgesGeom, selectionFrameMat);
  selectionFrame.name = 'VillainySignSelectionFrame';
  selectionFrame.renderOrder = 999;
  selectionFrame.visible = false;
  assemblyGroup.add(selectionFrame);

  // Subtle local neon fill light in front of the sign (+Z local = -Z world at yaw = Math.PI)
  const signNeonLight = new THREE.PointLight(0xff4224, 2.4, 6.5, 1.6);
  signNeonLight.name = 'VillainySignNeonFillLight';
  signNeonLight.position.set(0.0, 0.05 / defaultSignScale, 0.48 / defaultSignScale);
  assemblyGroup.add(signNeonLight);

  // Structural weathered steel tension cables & wall anchor plates suspending the sign across the alley
  const hardwareGroup = new THREE.Group();
  hardwareGroup.name = 'VillainySignSuspensionHardwareGroup';
  const hardwareMat = new THREE.MeshStandardMaterial({
    name: 'VillainySignSuspensionSteelMat',
    color: 0x3b3632,
    roughness: 0.78,
    metalness: 0.65,
  });

  const unitRodCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
  const unitRodGeom = new THREE.TubeGeometry(unitRodCurve, 4, 0.014, 6, false);
  const plateGeom = new THREE.BoxGeometry(0.04, 0.14, 0.14);
  const rodMeshes = [];
  const plateMeshes = [];

  for (let i = 0; i < 4; i++) {
    const rodMesh = new THREE.Mesh(unitRodGeom, hardwareMat);
    rodMesh.name = `VillainySignSupportCable_${i + 1}`;
    rodMesh.userData.holoColumnId = 'villainy_inc_sign';
    hardwareGroup.add(rodMesh);
    rodMeshes.push(rodMesh);

    const plateMesh = new THREE.Mesh(plateGeom, hardwareMat);
    plateMesh.name = `VillainySignWallAnchor_${i + 1}`;
    plateMesh.userData.holoColumnId = 'villainy_inc_sign';
    hardwareGroup.add(plateMesh);
    plateMeshes.push(plateMesh);
  }

  villainySignRootGroup.add(assemblyGroup);
  villainySignRootGroup.add(hardwareGroup);

  const localMountLugs = [
    new THREE.Vector3(-0.76, 0.44, 0.0),
    new THREE.Vector3(0.76, 0.44, 0.0),
    new THREE.Vector3(-0.76, 0.16, 0.0),
    new THREE.Vector3(0.76, 0.16, 0.0),
  ];
  const _lugWorldA = new THREE.Vector3();
  const _lugWorldB = new THREE.Vector3();
  const _wallAnchorA = new THREE.Vector3();
  const _wallAnchorB = new THREE.Vector3();
  const _rodDir = new THREE.Vector3();
  const _upAxis = new THREE.Vector3(0, 1, 0);

  function updateSingleCableAndPlate(idx, pStart, pEnd) {
    const rodMesh = rodMeshes[idx];
    const plateMesh = plateMeshes[idx];
    if (!rodMesh || !plateMesh) return;
    _rodDir.subVectors(pEnd, pStart);
    const len = _rodDir.length();
    rodMesh.position.copy(pStart);
    if (len > 1e-4) {
      _rodDir.multiplyScalar(1.0 / len);
      rodMesh.quaternion.setFromUnitVectors(_upAxis, _rodDir);
      rodMesh.scale.set(1.0, len, 1.0);
    } else {
      rodMesh.scale.set(1.0, 0.001, 1.0);
    }
    plateMesh.position.copy(pEnd);
  }

  function syncSuspensionHardware() {
    assemblyGroup.updateMatrixWorld(true);
    // Pair 0 & 1: Upper diagonal suspension cables to left & right brick walls
    _lugWorldA.copy(localMountLugs[0]).applyMatrix4(assemblyGroup.matrixWorld);
    _lugWorldB.copy(localMountLugs[1]).applyMatrix4(assemblyGroup.matrixWorld);
    const upperLeftLug = _lugWorldA.x <= _lugWorldB.x ? _lugWorldA : _lugWorldB;
    const upperRightLug = _lugWorldA.x <= _lugWorldB.x ? _lugWorldB : _lugWorldA;
    const xLUpper = resolveAlleyWallProfileX('left', upperLeftLug.z) + 0.04;
    const xRUpper = resolveAlleyWallProfileX('right', upperRightLug.z) - 0.04;
    _wallAnchorA.set(xLUpper, upperLeftLug.y + 0.52, upperLeftLug.z);
    _wallAnchorB.set(xRUpper, upperRightLug.y + 0.52, upperRightLug.z);
    updateSingleCableAndPlate(0, upperLeftLug, _wallAnchorA);
    updateSingleCableAndPlate(1, upperRightLug, _wallAnchorB);

    // Pair 2 & 3: Lateral horizontal stabilizer struts to left & right brick walls
    _lugWorldA.copy(localMountLugs[2]).applyMatrix4(assemblyGroup.matrixWorld);
    _lugWorldB.copy(localMountLugs[3]).applyMatrix4(assemblyGroup.matrixWorld);
    const lowerLeftLug = _lugWorldA.x <= _lugWorldB.x ? _lugWorldA : _lugWorldB;
    const lowerRightLug = _lugWorldA.x <= _lugWorldB.x ? _lugWorldB : _lugWorldA;
    const xLLower = resolveAlleyWallProfileX('left', lowerLeftLug.z) + 0.04;
    const xRLower = resolveAlleyWallProfileX('right', lowerRightLug.z) - 0.04;
    _wallAnchorA.set(xLLower, lowerLeftLug.y + 0.05, lowerLeftLug.z);
    _wallAnchorB.set(xRLower, lowerRightLug.y + 0.05, lowerRightLug.z);
    updateSingleCableAndPlate(2, lowerLeftLug, _wallAnchorA);
    updateSingleCableAndPlate(3, lowerRightLug, _wallAnchorB);
  }

  const subsystem = {
    rootGroup: villainySignRootGroup,
    assemblyGroup,
    hardwareGroup,
    model: modelClone,
    selectionFrame,
    hitProxyMesh,
    signNeonLight,
    raycastTargets: [hitProxyMesh, ...signMeshes, ...rodMeshes, ...plateMeshes],
    position: { x: defaultSignX, y: defaultSignY, z: defaultSignZ, relY: defaultSignRelY },
    scale: defaultSignScale,
    yawRad: defaultYawRad,
    pitchRad: 0.0,
    rollRad: 0.0,

    syncStateFromAssembly() {
      const p = assemblyGroup.position;
      const r = assemblyGroup.rotation;
      const s = assemblyGroup.scale;
      this.position.x = Number(p.x.toFixed(4));
      this.position.y = Number(p.y.toFixed(4));
      this.position.z = Number(p.z.toFixed(4));
      this.position.relY = Number((p.y - floorY).toFixed(4));
      this.scale = Number(s.x.toFixed(4));
      this.yawRad = Math.abs(r.y - Math.PI) < 1e-4 ? Math.PI : Number(r.y.toFixed(4));
      this.pitchRad = Number(r.x.toFixed(4));
      this.rollRad = Number(r.z.toFixed(4));
      syncSuspensionHardware();
    },

    getTransformState() {
      this.syncStateFromAssembly();
      const p = assemblyGroup.position;
      const r = assemblyGroup.rotation;
      const s = assemblyGroup.scale;
      const scaleX = Number(s.x.toFixed(4));
      const scaleY = Number(s.y.toFixed(4));
      const scaleZ = Number(s.z.toFixed(4));
      return {
        id: 'villainy_inc_sign',
        code: 'VILLAINY_INC_SIGN',
        index: 20,
        wallSide: p.x < 0 ? 'L' : 'R',
        x: Number(p.x.toFixed(4)),
        y: Number(p.y.toFixed(4)),
        yRel: Number((p.y - floorY).toFixed(4)),
        z: Number(p.z.toFixed(4)),
        pitchRad: Number(r.x.toFixed(4)),
        yawRad: Number(r.y.toFixed(4)),
        rollRad: Number(r.z.toFixed(4)),
        scale: scaleX,
        scaleX,
        scaleY,
        scaleZ,
        planeWidthMeters: Number((basePlaneWidthMeters * scaleX).toFixed(4)),
        planeHeightMeters: Number((basePlaneHeightMeters * scaleY).toFixed(4)),
        basePlaneWidthMeters,
        basePlaneHeightMeters,
        aspectRatio: signAspectRatio,
      };
    },

    setTransformState(partial = {}) {
      if (!partial || typeof partial !== 'object') return this.getTransformState();
      if (typeof partial.x === 'number' && Number.isFinite(partial.x)) {
        assemblyGroup.position.x = partial.x;
      }
      if (typeof partial.yRel === 'number' && Number.isFinite(partial.yRel)) {
        assemblyGroup.position.y = floorY + partial.yRel;
      } else if (typeof partial.y === 'number' && Number.isFinite(partial.y)) {
        assemblyGroup.position.y = partial.y;
      }
      if (typeof partial.z === 'number' && Number.isFinite(partial.z)) {
        assemblyGroup.position.z = partial.z;
      }
      if (typeof partial.pitchRad === 'number' && Number.isFinite(partial.pitchRad)) {
        assemblyGroup.rotation.x = partial.pitchRad;
      }
      if (typeof partial.yawRad === 'number' && Number.isFinite(partial.yawRad)) {
        assemblyGroup.rotation.y = partial.yawRad;
      }
      if (typeof partial.rollRad === 'number' && Number.isFinite(partial.rollRad)) {
        assemblyGroup.rotation.z = partial.rollRad;
      }
      if (typeof partial.scale === 'number' && Number.isFinite(partial.scale)) {
        const sc = Math.max(0.1, Math.min(10.0, partial.scale));
        assemblyGroup.scale.set(sc, sc, sc);
      } else {
        if (typeof partial.scaleX === 'number' && Number.isFinite(partial.scaleX)) {
          const sx = Math.max(0.1, Math.min(10.0, partial.scaleX));
          assemblyGroup.scale.x = sx;
          if (typeof partial.scaleY !== 'number') assemblyGroup.scale.y = sx;
          if (typeof partial.scaleZ !== 'number') assemblyGroup.scale.z = sx;
        }
        if (typeof partial.scaleY === 'number' && Number.isFinite(partial.scaleY)) {
          assemblyGroup.scale.y = Math.max(0.1, Math.min(10.0, partial.scaleY));
        }
        if (typeof partial.scaleZ === 'number' && Number.isFinite(partial.scaleZ)) {
          assemblyGroup.scale.z = Math.max(0.1, Math.min(10.0, partial.scaleZ));
        }
      }
      assemblyGroup.updateMatrixWorld(true);
      this.syncStateFromAssembly();
      return this.getTransformState();
    },

    resetTransformToDefault() {
      assemblyGroup.position.set(defaultSignX, defaultSignY, defaultSignZ);
      assemblyGroup.rotation.set(0.0, defaultYawRad, 0.0);
      assemblyGroup.scale.setScalar(defaultSignScale);
      assemblyGroup.updateMatrixWorld(true);
      this.syncStateFromAssembly();
      return this.getTransformState();
    },

    createHoloColumnAdapter() {
      let lifecycleState = 'active';
      const adapterParams = {
        colorAndLuminance: {
          primaryTintHex: '#ff4224',
          secondaryTintHex: '#fbbf24',
          colorRemapWeight: 0,
        },
      };
      const colAdapter = {
        id: 'villainy_inc_sign',
        code: 'VILLAINY_INC_SIGN',
        index: 20,
        mediaType: 'mesh3d',
        isCarousel: false,
        is3DMesh: true,
        allowDirectDrag: true,
        get lifecycleState() {
          return lifecycleState;
        },
        set lifecycleState(val) {
          lifecycleState = val;
          const isVisible = val !== 'inactive';
          assemblyGroup.visible = isVisible;
          hardwareGroup.visible = isVisible;
        },
        rootGroup: assemblyGroup,
        primaryMesh: signMeshes[0] || hitProxyMesh,
        selectionFrame,
        raycastTargets: [hitProxyMesh, ...signMeshes, ...rodMeshes, ...plateMeshes],
        assetSpec: {
          id: 'villainy_inc_sign',
          code: 'VILLAINY_INC_SIGN',
          index: 20,
          repoPath: ASSET_PATHS.villainySign,
          mediaType: 'mesh3d',
          label: 'Villainy Inc. 3D Neon Sign',
          aspectRatio: signAspectRatio,
        },
        geoSpec: {
          planeWidth: basePlaneWidthMeters,
          planeHeight: basePlaneHeightMeters,
        },
        params: adapterParams,
        getTransformState() {
          return subsystem.getTransformState();
        },
        setTransformState(partial) {
          return subsystem.setTransformState(partial);
        },
        resetTransformToDefault() {
          return subsystem.resetTransformToDefault();
        },
        onTransformMutated() {
          subsystem.syncStateFromAssembly();
        },
        getStateSummary() {
          return {
            id: 'villainy_inc_sign',
            code: 'VILLAINY_INC_SIGN',
            index: 20,
            mediaType: 'mesh3d',
            lifecycleState,
            isCarousel: false,
            isVisible: assemblyGroup.visible,
            aspectRatio: signAspectRatio,
            transform: subsystem.getTransformState(),
            params: adapterParams,
          };
        },
        setSelectionHighlight(selected) {
          if (selectionFrame && selectionFrame.material) {
            selectionFrame.material.color.setHex(selected ? 0x38bdf8 : 0xff4224);
            selectionFrame.material.opacity = selected ? 0.95 : 0.65;
          }
        },
        triggerGlitchBurst() {},
        setParams(partial = {}) {
          if (partial && partial.colorAndLuminance) {
            Object.assign(adapterParams.colorAndLuminance, partial.colorAndLuminance);
            const weight = Number(adapterParams.colorAndLuminance.colorRemapWeight ?? 0);
            const hex = adapterParams.colorAndLuminance.primaryTintHex || '#ff4224';
            for (const m of signMaterials) {
              if (m && m.emissive) {
                if (weight <= 0.01) {
                  m.emissive.setHex(0xffffff);
                } else {
                  m.emissive.set(hex);
                }
                m.needsUpdate = true;
              }
            }
            if (signNeonLight) {
              signNeonLight.color.set(weight <= 0.01 ? '#ff4224' : hex);
            }
          }
        },
        getParams() {
          return adapterParams;
        },
        materialize() {
          lifecycleState = 'active';
          assemblyGroup.visible = true;
          hardwareGroup.visible = true;
        },
        dematerialize() {
          lifecycleState = 'inactive';
          assemblyGroup.visible = false;
          hardwareGroup.visible = false;
        },
        setAgitatedState(agitated) {
          lifecycleState = agitated ? 'agitated' : 'active';
          assemblyGroup.visible = true;
          hardwareGroup.visible = true;
          const targetEmissive = agitated ? 4.2 : 3.10;
          for (const m of signMaterials) {
            if (m) m.emissiveIntensity = targetEmissive;
          }
          if (signNeonLight) {
            signNeonLight.intensity = agitated ? 3.4 : 2.4;
          }
        },
        swapMediaSource() {},
        play() {},
        pause() {},
        togglePlay() {},
        setLoop() {},
        setPlaybackRate() {},
        scrubToTime() {},
        scrubToFrame() {},
        resetFrameZero() {},
        update() {
          const isCulled = Boolean(
            (villainySignRootGroup.userData && villainySignRootGroup.userData.culledBySceneCutter) ||
              (assemblyGroup.userData && assemblyGroup.userData.culledBySceneCutter)
          );
          const isVisible = lifecycleState !== 'inactive' && !isCulled;
          assemblyGroup.visible = isVisible;
          hardwareGroup.visible = isVisible;
          for (const mesh of signMeshes) {
            mesh.visible = isVisible;
          }
        },
        dispose() {},
      };
      return colAdapter;
    },
  };

  subsystem.syncStateFromAssembly();
  return subsystem;
}

async function initSandbox() {
  bindSidebarCollapseControls();
  // Spec 065 §5.3 & §6: Dispatch 7-card generative intro pre-fetch at t = 0ms in parallel with GLTF loading & spray-paint intro
  prefetchGenerativeIntroDeck();
  const sprayLoader = initSprayPaintLoadingScreen();
  const loader = new GLTFLoader();
  sandbox.variantLoader = loader;

  const totalAssets = 5 + RPM_ANIMATION_CATALOG.length;
  let loadedAssets = 0;
  const handleAssetProgress = () => {
    loadedAssets++;
    if (sprayLoader && sprayLoader.mode === 'deterministic' && !sprayLoader.isSkipped && sprayLoader.targetProgress < 0.999) {
      const frac = Math.min(0.92, (loadedAssets / totalAssets) * 0.92);
      sprayLoader.setProgress(frac);
    }
  };

  const [
    alleyGLTF,
    hoodieGLTF,
    alarmLightGLTF,
    alleyPipesGLTF,
    villainySignGLTF,
    ...rpmAnimGLTFs
  ] = await runBoundedTaskPool(
    [
      () => loadGLB(loader, ASSET_PATHS.alley, handleAssetProgress),
      () => loadGLB(loader, ASSET_PATHS.hoodie, handleAssetProgress),
      () => loadGLB(loader, ASSET_PATHS.alarmLight, handleAssetProgress),
      () => loadGLB(loader, ASSET_PATHS.alleyPipes, handleAssetProgress),
      () => loadGLB(loader, ASSET_PATHS.villainySign, handleAssetProgress),
      ...RPM_ANIMATION_CATALOG.map((spec) => () => loadGLB(loader, spec.url, handleAssetProgress)),
    ],
    4
  );

  // Complete critical-path 3D "DOOM TRACKS" MP3 HUD assets ahead of non-blocking hologram column texture bursts
  const earlyMp3Player = createDoomTracksMp3HUD({
    audio: null,
    renderer,
    assetSrc: 'assets/mp3.jpeg',
    glbSrc: 'assets/audiodevice_decimated.glb?v=088',
    manifestUrl: 'assets/tracks/manifest.json',
    initiallyVisible: true,
  });
  await earlyMp3Player.initPromise;

  if (hoodieGLTF.animations && hoodieGLTF.animations.length > 0) {
    raiseFatalError(
      `Character '${ASSET_PATHS.hoodie}' contains ${hoodieGLTF.animations.length} prohibited embedded legacy animation clips.`
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

  // Build and validate all 6 wall screen mounts (SCREEN_MOUNT_01..06)
  const { wallMounts, wallMountsByName, raycastTargets } = buildWallScreenMounts(markers, null);
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
    onTransformsMutated: (payload, meta = {}) => {
      if (sandbox._hydratingSceneLayouts) return;
      if (meta && meta.deleted) {
        sandbox.deletePersistedSceneLayout('math_pods');
      } else if (payload) {
        sandbox.persistSceneLayout('math_pods', payload, meta && meta.updatedAtMs);
      }
    },
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

  // Build and integrate "Water Color" Gallery Rectangular Showcase & Portal Holographic Game Selector (Spec 048)
  watercolorRootGroup.clear();
  const waterColorGallerySystem = buildWaterColorGallerySystem({
    rootGroup: watercolorRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
    portalTargetUrl: './skate3_cleanroom/?char=luis',
    resolvePortalTargetUrl: (opts = {}) => sandbox.resolveSkateRoomPortalUrl(opts),
    shouldIgnorePortal: () =>
      Boolean(
        (sandbox.transformControls && sandbox.transformControls.dragging) ||
        sandbox.activeHoloTransformDrag
      ),
    onOpenPortalPopup: (info = {}) => {
      sandbox.isPortalPopupOpen = true;
      sandbox.portalGlitchBoostRemainingSec = 0.24;
      for (const k of Object.keys(keysPressed)) {
        keysPressed[k] = false;
      }
      jumpRequested = false;
      const activeChar = sandbox.getActiveCharacter ? sandbox.getActiveCharacter() : null;
      if (activeChar) {
        activeChar.velocity.set(0, 0, 0);
        if (!activeChar.dialogueActive) {
          activeChar.freezeToIdle();
        }
      }
      if (sandbox.runningEffects) {
        sandbox.runningEffects.quiesceImmediately();
      }
      startPortalPopupOpenAnimation({
        immediate: Boolean(info.immediate || (info.wasAlreadyOpen && !info.replayAnimation)),
      });
      syncPortalGamePopupDOM();
      updatePortalGameHoloPopupUI(0.0);
      if (sandbox.audio && typeof sandbox.audio.trigger === 'function' && info.source === 'walk-through') {
        sandbox.audio.trigger('onActivate', {
          source: 'portalGameSelectorWalkThrough',
          selectedGameId: info.selectedGameId || 'skate3',
          intensity: 1.0,
        });
      }
      updateTelemetryHUD();
    },
    onClosePortalPopup: (info = {}) => {
      sandbox.isPortalPopupOpen = false;
      sandbox.portalGlitchBoostRemainingSec = Math.max(sandbox.portalGlitchBoostRemainingSec, 0.16);
      startPortalPopupCloseAnimation({
        immediate: Boolean(info && info.immediate),
      });
      syncPortalGamePopupDOM();
      updatePortalGameHoloPopupUI(0.0);
      updateTelemetryHUD();
    },
    onSelectPortalGame: () => {
      syncPortalGamePopupDOM();
      updateTelemetryHUD();
    },
    onTeleport: (info = {}) => {
      if (sandbox.audio && typeof sandbox.audio.trigger === 'function') {
        sandbox.audio.trigger('onActivate', {
          source: 'shaderPortalTeleport',
          gameId: info.gameId || 'skate3',
          targetUrl: info.targetUrl,
          intensity: 1.0,
        });
      }
      updateTelemetryHUD();
    },
  });
  sandbox.waterColor = waterColorGallerySystem;
  sandbox.skybox = waterColorGallerySystem;

  // Build and integrate 17 2D Holographic Media Columns (anim/hologram_columns.md §1–§7)
  hologramColumnsRootGroup.clear();
  const hologramColumnsSystem = buildHologramColumnsSystem({
    rootGroup: hologramColumnsRootGroup,
    floorY,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
    onTransformsMutated: (payload, meta = {}) => {
      if (sandbox._hydratingSceneLayouts) return;
      if (meta && meta.deleted) {
        sandbox.deletePersistedSceneLayout('holo_columns');
      } else if (payload) {
        sandbox.persistSceneLayout('holo_columns', payload, meta && meta.updatedAtMs);
      }
    },
  });
  sandbox.hologramColumns = hologramColumnsSystem;

  // Build and integrate Overhead "VILLAINY INC." PBR Neon Sign across the alley entrance
  sandbox.villainySign = buildVillainyNeonSignSubsystem(villainySignGLTF, floorY);

  // Register Water Color Gallery and Villainy Inc. Neon Sign into Hologram Columns editor so they can be tweaked via "G", HUD sliders, 3D gizmo, and direct drag
  if (sandbox.hologramColumns && typeof waterColorGallerySystem.createHoloColumnAdapter === 'function') {
    const wcAdapter = waterColorGallerySystem.createHoloColumnAdapter(floorY);
    sandbox.hologramColumns.registerCustomColumn(wcAdapter);
  }
  if (sandbox.hologramColumns && sandbox.villainySign && typeof sandbox.villainySign.createHoloColumnAdapter === 'function') {
    const villainyAdapter = sandbox.villainySign.createHoloColumnAdapter(floorY);
    sandbox.hologramColumns.registerCustomColumn(villainyAdapter);
  }
  if (sandbox.hologramColumns) {
    const ssmWhitepaperCol = new HologramColumnInstance(SSM_WHITEPAPER_HOLO_SPEC, {
      floorY,
      uTimeUniform: holoShaderUniforms.uHoloTime,
      applyStencilReject: applyCharacterOcclusionStencilReject,
      initialState: 'inactive',
    });
    hologramColumnsRootGroup.add(ssmWhitepaperCol.rootGroup);
    sandbox.hologramColumns.registerCustomColumn(ssmWhitepaperCol);
    sandbox.whitepaperHoloColumn = ssmWhitepaperCol;
  }

  // Build and integrate 3D Spawn Coordinates & Startup Camera Pan Director System
  sandbox.director = buildSpawnAndCameraDirectorSystem(floorY);

  // Initialize Three.js TransformControls for interactive in-scene resizing & positioning of the 17 Hologram Media Columns
  if (sandbox.transformControlsHelper) {
    scene.remove(sandbox.transformControlsHelper);
  }
  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSize(0.85);
  transformControls.setMode(sandbox.holoGizmoMode || 'translate');
  transformControls.showXY = false;
  transformControls.showYZ = false;
  transformControls.showXZ = false;
  transformControls.enabled = false;
  if (typeof transformControls._getPointer === 'function') {
    const origGetPointer = transformControls._getPointer;
    transformControls._getPointer = function (event) {
      const ptr = origGetPointer.call(this, event);
      if (event && event.type === 'pointermove' && ptr) {
        ptr.button = -1;
      }
      return ptr;
    };
  }
  if (typeof transformControls.pointerHover === 'function') {
    const origPointerHover = transformControls.pointerHover.bind(transformControls);
    transformControls.pointerHover = function (pointer) {
      if (this._root) {
        this._root.updateMatrixWorld(true);
      }
      origPointerHover(pointer);
      if (this._plane) {
        this._plane.updateMatrixWorld(true);
      }
    };
  }
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
      if (sandbox.director && sandbox.director.isTransformControlsAttachedToDirector()) {
        sandbox.director.saveToStorage();
        syncDirectorHUDInputs();
      } else if (sandbox.lamppostEditMode && sandbox.lamppostLight) {
        sandbox.lamppostLight.syncConeGeometry();
        sandbox.lamppostLight.saveToStorage();
        syncLamppostEditorHUDInputs();
      } else if (sandbox.hologramColumns) {
        const col = sandbox.hologramColumns.getColumn(sandbox.selectedHoloColumnId);
        if (col && typeof col.onTransformMutated === 'function') {
          col.onTransformMutated();
        }
        sandbox.hologramColumns.saveTransformsToStorage();
        syncHoloEditorHUDInputs();
      }
    }
  });

  transformControls.addEventListener('objectChange', () => {
    if (sandbox.director && sandbox.director.isTransformControlsAttachedToDirector()) {
      sandbox.director.onTransformControlsObjectChange();
      return;
    }
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
      const isUniform3D = Boolean(col.is3DMesh);
      if (axis === 'X') {
        col.rootGroup.scale.set(sx, sx, isUniform3D ? sx : 1.0);
      } else if (axis === 'Y') {
        col.rootGroup.scale.set(sy, sy, isUniform3D ? sy : 1.0);
      } else {
        const s = Math.max(0.1, Math.min(10.0, (sx + sy) * 0.5));
        col.rootGroup.scale.set(s, s, isUniform3D ? s : 1.0);
      }
    }
    if (col && typeof col.onTransformMutated === 'function') {
      col.onTransformMutated();
    }
    syncHoloEditorHUDInputs();
  });

  syncHoloEditorHUDInputs();
  syncLamppostEditorHUDInputs();
  syncDirectorHUDInputs();

  // Build and integrate Interactive Holographic Die-Cut Stickers, Aligned Interior/Exterior Wall & Floor Bounding Surfaces, and 3D Min/Max Size Calibration Tool (Spec 047)
  holographicStickersRootGroup.clear();
  if (!holographicStickersRootGroup.parent) {
    scene.add(holographicStickersRootGroup);
  }
  sandbox.holographicStickers = buildHolographicStickersSystem({
    rootGroup: holographicStickersRootGroup,
    spawnDefaultCatalog: false,
    floorY,
    visualMesh: visualAlleyMesh,
    uTimeUniform: holoShaderUniforms.uHoloTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });

  if (holographicSignRootGroup.parent) {
    holographicSignRootGroup.parent.remove(holographicSignRootGroup);
  }
  holographicSignRootGroup.clear();
  sandbox.holographicSign = null;

  // Build and integrate 20 Full-Alleyway Sagging Overhead Hanging Cables (OVERHEAD_CABLE_01..OVERHEAD_CABLE_20, Spec 023 §6)
  sandbox._visualAlleyMesh = visualAlleyMesh;
  sandbox.overheadCables = buildOverheadHangingCables(wallSegments, floorY);

  // Build and integrate 15 Freeman Alley Metal Pipework Assemblies across 8 Sketchfab Variations + Intermittent Steam (Spec 034 & Spec 036)
  sandbox.alleyPipes = buildAlleyMetalPipesSubsystem({
    pipeGLTF: alleyPipesGLTF,
    rootGroup: scene,
    floorY,
    uTimeUniform: sfxSharedUniforms.uTime,
    applyStencilReject: applyCharacterOcclusionStencilReject,
  });

  // Build and integrate Running Mode Speed Effects & Cyber-Techno Binary Trail (Spec 023 §3)
  sandbox.runningEffects = buildRunningEffectsSystem(floorY);

  // Build and integrate Dynamic Light-Responsive Character & Floating Head Shadows (Spec 023 §5)
  sandbox.characterShadows = buildCharacterLightResponsiveShadows(floorY);

  // Build Environmental Effects, Surface Optics, and Audio Subsystems (SFX.md §2, §3, §4 + Spec 036 Pipe Steam Audio)
  sfxRootGroup.clear();
  const groundFog = buildLowAltitudeGroundFog(floorY);
  const spotlightCones = buildVolumetricSpotlightCones(sandbox.alarmLights);
  const ambientParticulates = buildSuspendedAmbientParticulates(floorY);
  const precipitation = buildPrecipitationEmitter(floorY);
  const floorReflections = buildPlanarFloorReflectionSubsystem(floorY);
  if (sandbox.holographicStickers && typeof sandbox.holographicStickers.syncVisualEnvelope === 'function') {
    sandbox.holographicStickers.syncVisualEnvelope(visualAlleyMesh, floorReflections ? floorReflections.mesh : null);
  }
  const audioSubsystem = buildAudioSubsystem(null, sandbox.alarmLights, sandbox.alleyPipes);

  // Build and integrate Interactive Straight-Line Scene Cutter & Half-Space Deletion Subsystem (Spec 036)
  sandbox.sceneCutter = buildSceneCutterSubsystem({
    scene,
    camera,
    renderer,
    sandbox,
    floorY,
  });

  sandbox.sfx = {
    rootGroup: sfxRootGroup,
    centralTerminal: null,
    depthFog: {
      fog: scene.fog,
      type: 'FogExp2',
      formula: 'exponential_squared_d2',
      colorHex: '#000000',
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
    pipeSteam: sandbox.alleyPipes ? sandbox.alleyPipes.steamSystem : null,
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

  if (sandbox.director && sandbox.director.spawnState) {
    spawnPlayerPos.set(
      sandbox.director.spawnState.x,
      floorY,
      sandbox.director.spawnState.z
    );
    spawnPlayerEuler.y = sandbox.director.spawnState.yawRad;
  }

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
    stickerBoundingSurfaces: sandbox.holographicStickers
      ? sandbox.holographicStickers.boundingSurfaces
      : null,
  };
  if (sandbox.director) {
    sandbox.director.syncHandleGeometries();
  }

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

  // 3. Stage Colored LUIS + Floating DOOM_Companion Character at SPAWN_PLAYER
  const hoodieController = new CharacterController({
    id: 'hoodie',
    label: 'character_hoodie.glb (Full Color + DOOM Head)',
    gltfScene: hoodieGLTF.scene,
    sharedClips,
    spawnPos: spawnPlayerPos,
    spawnYaw: spawnPlayerEuler.y,
    floorY,
    baseColor: 0xe2e8f0,
  });
  hoodieController.setHolographicShader(false);
  scene.add(hoodieGLTF.scene);

  sandbox.characters = {
    hoodie: hoodieController,
  };
  if (sandbox.mathPodPopups) {
    sandbox.mathPodPopups.registerSceneAssetPresets(scene);
  }
  sandbox.variantCache = {
    luis_color: hoodieController,
  };
  sandbox.activeVariantKey = 'luis_color';
  sandbox.currentVariantKey = 'luis_color';
  sandbox.activeCharacterId = 'hoodie';

  hoodieController.root.animations = sharedClips;
  window.__THREE_ANIMATION_MIXERS__ = [
    hoodieController.mixer,
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

  cameraOrbit.yaw = resolveCharacterAlignedCameraYaw(spawnPlayerEuler.y);
  cameraOrbit._lastSyncedCharYaw = spawnPlayerEuler.y;
  cameraOrbit.freeRoamMoveBasisYaw = spawnPlayerEuler.y;
  cameraOrbit.freeRoamMoveInputSig = '0:0';
  cameraOrbit.pitch = characterCameraState.pitchRad;
  cameraOrbit.desiredDistance = characterCameraState.distance;
  if (Math.abs(camera.fov - characterCameraState.fovDeg) > 1e-3) {
    camera.fov = characterCameraState.fovDeg;
    camera.updateProjectionMatrix();
  }
  cameraOrbit.pivotCurrent.set(
    hoodieController.position.x,
    hoodieController.position.y + characterCameraState.pivotHeightY,
    hoodieController.position.z
  );
  cameraOrbit.pivotTarget.copy(cameraOrbit.pivotCurrent);
  mountFocusCameraState.currentLookAt.copy(cameraOrbit.pivotCurrent);

  // Initialize Cyber-Tactical 2D HUD Radial Menu (anim/radial_menu.md §1, §5)
  const radialOverlay = document.getElementById('cyber-radial-menu-overlay');
  const radialController = createCyberRadialMenuHUD({
    container: radialOverlay,
    size: 680,
    iconSize: 94,
    bandWidth: 198,
    innerGap: 18,
    outerGap: 6,
    outerRingWidth: 10,
    linearGapPx: 8,
    onOpenChange: (isOpen) => {
      if (typeof document !== 'undefined') {
        const elMobileModeBtn = document.getElementById('mobile-action-mode-btn');
        if (elMobileModeBtn) {
          elMobileModeBtn.textContent = 'MENU';
          elMobileModeBtn.classList.toggle('active', Boolean(isOpen));
          elMobileModeBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      }
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
        if (sandbox.audio && typeof sandbox.audio.trigger === 'function') {
          sandbox.audio.trigger('onActivate', {
            target: 'cyber-radial-menu',
            source: 'radial-menu-open',
          });
        }
      } else if (sandbox.audio && typeof sandbox.audio.trigger === 'function') {
        sandbox.audio.trigger('onHover', {
          target: 'cyber-radial-menu',
          source: 'radial-menu-close',
        });
      }
    },
    onHoverChange: (item, index) => {
      if (item && sandbox.audio && typeof sandbox.audio.trigger === 'function') {
        sandbox.audio.trigger('onHover', {
          target: item.key || `slice-${index}`,
          source: 'radial-menu-hover',
          index,
        });
      }
    },
    onSubmenuChange: (item, index) => {
      if (item) {
        sandbox.lastRadialAction = item.label;
        const telEl = document.getElementById('tel-radial');
        if (telEl) {
          telEl.textContent = item.label;
        }
      }
      if (sandbox.audio && typeof sandbox.audio.trigger === 'function') {
        sandbox.audio.trigger('onActivate', {
          target: (item && item.key) || `slice-${index}`,
          source: 'radial-menu-submenu-open',
          index,
        });
      }
    },
    onSelect: (item, index) => {
      sandbox.lastRadialAction = item.label;
      const telEl = document.getElementById('tel-radial');
      if (telEl) {
        telEl.textContent = item.label;
      }
      if (sandbox.audio && typeof sandbox.audio.trigger === 'function') {
        sandbox.audio.trigger('onActivate', {
          target: (item && item.key) || `slice-${index}`,
          source: 'radial-menu-select',
          index,
        });
      }
      const candidateStickerId = item && (item.stickerId || item.key);
      if (candidateStickerId && STICKER_ASSET_BY_ID[candidateStickerId]) {
        sandbox.startStickerPlacement(candidateStickerId);
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

  // Finalize Interactive 3D "DOOM TRACKS" (SYS-990-AMBER) MP3 HUD Deck (functional_specification_035.md & 038.md)
  const mp3Player = earlyMp3Player;
  if (typeof mp3Player.setAudioSubsystem === 'function') {
    mp3Player.setAudioSubsystem(sandbox.audio);
  }
  await mp3Player.initPromise;
  sandbox.mp3Player = mp3Player;
  if (typeof window !== 'undefined') {
    window.mp3Player = mp3Player;
  }

  bindInputListeners();
  syncDoomHoloChatDOM();
  syncStickerToolHUDInputs();
  syncStickerHoloPopupDOM();
  syncPortalGamePopupDOM();
  syncCharacterCameraHUDInputs();
  fetchDoomStartersFromHF({ silentFallback: true }).catch(() => {});

  // Discovery of Server Mac HTTPS Quick Tunnel (functional_specification_037.md) & PostgreSQL Sticker Hydration (functional_specification_056.md)
  if (!sandbox.tunnelConfig) {
    sandbox.tunnelConfig = null;
  }
  if (typeof fetch === 'function') {
    const tData = await ensureTunnelConfigDiscovered();
    if (tData && typeof tData === 'object') {
      if (!doomChatState.startersLoadedFromHF && !doomChatState.startersLoading) {
        fetchDoomStartersFromHF({ silentFallback: true }).catch(() => {});
      }
      if (introGenerationTelemetry.status === 'fallback') {
        _introPrefetchPromise = null;
        prefetchGenerativeIntroDeck();
      }
    }
    await sandbox.loadPersistedStickers().catch(() => {});
    await sandbox.loadPersistedSceneLayouts().catch(() => {});
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    let lastVisibilityLayoutSyncMs = 0;
    const triggerBackgroundLayoutRefresh = () => {
      const now = Date.now();
      if (now - lastVisibilityLayoutSyncMs < 3000) return;
      lastVisibilityLayoutSyncMs = now;
      sandbox.loadPersistedSceneLayouts({ isBackgroundRefresh: true }).catch(() => {});
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        triggerBackgroundLayoutRefresh();
      }
    });
    window.addEventListener('focus', triggerBackgroundLayoutRefresh);
  }

  // Initialize Scene-Wide Boot-Up 3D Materialization & Glowing Bloom-Edge Dissolve System (Spec 070 §4)
  // and Screen-Agnostic Portfolio Perimeter HUD & Glyph Cipher Decode System (Spec 070 §5 / hud.md)
  sandbox.sceneMaterialization = createSceneBootMaterializationSystem({
    scene,
    sandbox,
    defaultDurationSec: 2.8,
    edgeColorHex: '#eb5a13',
    edgeThickness: 0.085,
    edgeIntensity: 6.8,
  });
  sandbox.sceneMaterialization.registerSceneMaterials(scene);
  sandbox.portfolioHUD = createPortfolioPerimeterHUD({ sandbox });
  sandbox.portfolioHUD.bindInteractions();

  sandbox.ready = true;
  if (sandbox.director) {
    sandbox.director.introSequenceState.phase = 'pan-playing';
    sandbox.director.introSequenceState.scrollLocked = true;
    sandbox.director.introSequenceState.currentBoxIndex = 0;
    sandbox.director.previewPanStartPose();
    if (!sprayLoader) {
      sandbox.director.playStartupPan();
    } else {
      sandbox.sceneMaterialization.stageForBoot();
    }
  }
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
  ASSET_PATHS,
  GLB_VARIANT_CATALOG,
  RPM_REQUIRED_HUMANOID_BONES,
  SKATE3_REQUIRED_MASTER_RIG_BONES,
  RPM_TO_SKATE3_BONE_MAP,
  adaptSharedClipsForSkate3Rig,
  LOOPING_CLIP_NAMES,
  ONCE_STATES,
  sampleSurfaceHeightAndNormal,
  resolveCircleAgainstWalls,
  extractFloorTriangles,
  createCyberRadialMenuHUD,
  PRIMARY_CYBER_MENU_ITEMS,
  STICKER_RADIAL_MENU_ITEMS,
  LEGACY_CYBER_MENU_ITEMS,
  DEFAULT_CYBER_MENU_ITEMS,
  CENTRAL_HUB_EMBLEM,
  FULL_CIRCLE,
  START_ANGLE,
  SUBMENU_FAN_IN_DURATION_MS,
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
  HOLO_CAROUSEL_DEFAULT_SLIDES,
  HOLO_SPECTRAL_TINT_PRESETS,
  HOLO_LIFECYCLE_STATES,
  HOLO_GLITCH_MODES,
  HOLO_DEFAULT_RUNTIME_PARAMS,
  resolveHoloMediaSpec,
  computeHologramColumnGeometrySpec,
  createProceduralSlideCardTexture,
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
  STICKER_DEFAULT_SIZE_BOUNDS,
  normalizeStickerSizeBounds,
  clampStickerSize,
  normalizeStickerRotationRad,
  resolveStickerWallProfileX,
  resolveStickerExteriorWallProfileZ,
  resolveStickerFloorContourY,
  computeStickerSurfaceBasis,
  computeStickerPopupCameraPose,
  STICKER_POPUP_IGNITE_MS,
  STICKER_POPUP_COLLAPSE_MS,
  STICKER_POPUP_CAM_TRANSITION_DURATION,
  buildStickerBoundingSurfaces,
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
  ALLEY_METAL_PIPES_ASSET_URL,
  PIPE_VARIATION_SPECS,
  ALLEY_PIPE_PLACEMENT_SCHEDULE,
  PIPE_STEAM_NOZZLE_SPECS,
  PIPE_STEAM_INTERVAL_SCHEDULE,
  resolvePipeNozzleWorldTransform,
  evaluatePipeSteamEnvelope,
  resolveAlleyWallProfileX,
  buildAlleyMetalPipesSubsystem,
  createDoomTracksMp3HUD,
  DOOM_TRACKS_DEFAULT_CATALOG,
  MP3_CONTROL_HIT_ZONES,
  MP3_SCREEN_HIT_ZONES,
  MP3_PALETTE,
  MP3_CHASSIS_CROP,
  MP3_SCREEN_ONLY_CROP,
  MP3_NATIVE_WIDTH,
  MP3_NATIVE_HEIGHT,
  processMp3ChassisBitmap,
  drawTechnoVectorText,
  measureTechnoVectorText,
  PORTAL_HEADER_LOGO_SPEC,
  PORTAL_GAME_CATALOG,
  PORTAL_GAME_BY_ID,
  normalizePortalGameEntry,
  resolvePortalGameSpec,
  solvePortalGameGridLayout,
  createSceneBootMaterializationSystem,
  createPortfolioPerimeterHUD,
  GlyphDecodeController,
  CIPHER_GLYPH_POOL,
  computePortraitAspectFactor,
  evaluateDynamicCameraFollowOffsets,
  DYNAMIC_CAM_ASPECT_LANDSCAPE,
  DYNAMIC_CAM_ASPECT_PORTRAIT,
  DYNAMIC_CAM_BOOM_PULLBACK_FACTOR,
  DYNAMIC_CAM_LOOKAT_Y_ELEVATION_M,
};
