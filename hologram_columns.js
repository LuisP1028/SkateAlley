import * as THREE from 'three';

// ============================================================================
// 1. Authoritative 17-Asset Manifest & Lookup Tables (anim/hologram_columns.md §2.2)
// ============================================================================
export const HOLO_CAROUSEL_DEFAULT_SLIDES = Object.freeze([
  Object.freeze({
    id: 'slide_01_deck_cover',
    label: '01 // HOLO SLIDE DECK (SWIPE ← →)',
    title: '01 // HOLO SLIDE DECK (SWIPE ← →)',
    kicker: 'INTERACTIVE MULTI-MEDIA COLUMN',
    subtitle: 'DRAG HORIZONTALLY OR CLICK EDGES TO SWIPE IMAGES & VIDEOS',
    mediaType: 'placeholder',
    type: 'procedural',
    repoPath: 'procedural://slide_01_deck_cover',
    width: 1200,
    height: 1500,
    aspectRatio: 0.8,
    defaultTintPreset: 'cyan',
    bypassExteriorCutout: true,
    hasDarkSubjectFloor: true,
    darkSubjectFloorMinAlpha: 0.24,
    isHighKeyStudioBackdrop: false,
    studioBackdropMode: 'none',
  }),
  Object.freeze({
    id: 'slide_02_doomlambo_vid',
    label: '02 // DOOM LAMBO (VID 24FPS)',
    title: '02 // DOOM LAMBO (VID 24FPS)',
    kicker: 'VIDEO STREAM SLIDE // H.264',
    subtitle: 'anim/DOOMLAMBO.mp4',
    mediaType: 'video',
    type: 'video',
    repoPath: 'anim/DOOMLAMBO.mp4',
    width: 860,
    height: 540,
    aspectRatio: 1.593,
    fps: 24,
    durationSec: 6.04,
    frameCount: 145,
    defaultTintPreset: 'cyan',
    bypassExteriorCutout: true,
    hasDarkSubjectFloor: false,
    darkSubjectFloorMinAlpha: 0.16,
    isHighKeyStudioBackdrop: false,
    studioBackdropMode: 'none',
  }),
  Object.freeze({
    id: 'slide_03_frenchfry_img',
    label: '03 // FRENCH FRY TAG (IMG)',
    title: '03 // FRENCH FRY TAG (IMG)',
    kicker: 'STATIC HIGH-RES IMAGE SLIDE',
    subtitle: 'anim/frenchfrytag.jpeg',
    mediaType: 'image',
    type: 'image',
    repoPath: 'anim/frenchfrytag.jpeg',
    width: 1888,
    height: 2228,
    aspectRatio: 0.847,
    defaultTintPreset: 'magenta',
    bypassExteriorCutout: true,
    hasDarkSubjectFloor: false,
    darkSubjectFloorMinAlpha: 0.14,
    isHighKeyStudioBackdrop: false,
    studioBackdropMode: 'none',
  }),
  Object.freeze({
    id: 'slide_04_pinkpanther_vid',
    label: '04 // PINK PANTHER (VID 24FPS)',
    title: '04 // PINK PANTHER (VID 24FPS)',
    kicker: 'VIDEO STREAM SLIDE // H.264',
    subtitle: 'anim/PINKPANTHER.mp4',
    mediaType: 'video',
    type: 'video',
    repoPath: 'anim/PINKPANTHER.mp4',
    width: 624,
    height: 480,
    aspectRatio: 1.3,
    fps: 24,
    durationSec: 6.04,
    frameCount: 145,
    defaultTintPreset: 'magenta',
    bypassExteriorCutout: true,
    hasDarkSubjectFloor: false,
    darkSubjectFloorMinAlpha: 0.16,
    isHighKeyStudioBackdrop: false,
    studioBackdropMode: 'none',
  }),
  Object.freeze({
    id: 'slide_05_custom_slot',
    label: '05 // CUSTOM MEDIA SLOT (READY)',
    title: '05 // CUSTOM MEDIA SLOT (READY)',
    kicker: 'DROP-IN IMAGE / VIDEO SLOT',
    subtitle: 'USE HUD "UPLOAD SLIDES" TO DROP IN YOUR OWN IMAGES OR MP4 VIDEOS',
    mediaType: 'placeholder',
    type: 'procedural',
    repoPath: 'procedural://slide_05_custom_slot',
    width: 1200,
    height: 1500,
    aspectRatio: 0.8,
    defaultTintPreset: 'amber',
    bypassExteriorCutout: true,
    hasDarkSubjectFloor: true,
    darkSubjectFloorMinAlpha: 0.24,
    isHighKeyStudioBackdrop: false,
    studioBackdropMode: 'none',
  }),
]);

export const HOLO_MEDIA_MANIFEST = Object.freeze([
  {
    "index": 1,
    "id": "holo_slide_carousel",
    "code": "HOLO-COL-SLIDE",
    "mediaType": "carousel",
    "isCarousel": true,
    "slides": HOLO_CAROUSEL_DEFAULT_SLIDES,
    "repoPath": "anim/frenchfrytag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/frenchfrytag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.22,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "cyan",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -0.68,
      "yRel": 1.62,
      "z": 4.35,
      "pitchRad": 0,
      "yawRad": 2.92,
      "rollRad": 0,
      "scale": 0.2,
      "scaleX": 0.2,
      "scaleY": 0.2,
      "scaleZ": 1
    },
    "subjectSummary": "Interactive multi-slide Hologram Carousel Column supporting horizontal pointer/touch swipe gestures and chevron/keyboard navigation across mixed image, video, and placeholder slides.",
    "width": 1280,
    "height": 1600,
    "aspectRatio": 0.8,
    "exactAspectRatio": 0.8,
    "planeWidthMeters": 0.258,
    "planeHeightMeters": 0.3226,
    "fileSizeBytes": 2456687,
    "sha256": "6e08970ab2303fe8139863b2cf1b1825125d100c4d2e056acedcceb2b0e6c01b",
    "meanLuminance": 0.50,
    "darkPixelRatioBelow30": 0.05,
    "brightPixelRatioAbove200": 0.12
  },
  {
    "index": 3,
    "id": "frenchfry_tag",
    "code": "HOLO-COL-03",
    "mediaType": "image",
    "repoPath": "anim/frenchfrytag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/frenchfrytag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.14,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "magenta",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -2.2735,
      "yRel": 4.787,
      "z": 24.3562,
      "pitchRad": 0,
      "yawRad": 1.5172,
      "rollRad": 0,
      "scale": 4.152,
      "scaleX": 4.152,
      "scaleY": 4.152,
      "scaleZ": 1
    },
    "subjectSummary": "Close-up array of pink monogrammed French fry cartons filled with golden fries, with each carton branded with the burgundy 'PLATO DOOM' throw-up and white 'PLATO' / 'O' interior lettering.",
    "width": 1888,
    "height": 2228,
    "aspectRatio": 0.847,
    "exactAspectRatio": 0.8473967684021544,
    "planeWidthMeters": 5.6745,
    "planeHeightMeters": 6.6963,
    "fileSizeBytes": 2456687,
    "sha256": "6e08970ab2303fe8139863b2cf1b1825125d100c4d2e056acedcceb2b0e6c01b",
    "meanLuminance": 0.5411,
    "darkPixelRatioBelow30": 0.0315,
    "brightPixelRatioAbove200": 0.1057
  },
  {
    "index": 4,
    "id": "gun_tag",
    "code": "HOLO-COL-04",
    "mediaType": "image",
    "repoPath": "anim/guntag2.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/guntag2.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.28,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "amber",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 0.3991,
      "yRel": 1.56,
      "z": 11.1,
      "pitchRad": 0,
      "yawRad": -0.5325,
      "rollRad": 0,
      "scale": 0.486,
      "scaleX": 0.486,
      "scaleY": 0.486,
      "scaleZ": 1
    },
    "subjectSummary": "Macro photograph of the rear slide and grip of a black pistol featuring a custom engraved rear slide plate and a tan/brown 'PLATO DOOM' throw-up along the textured polymer grip.",
    "width": 2112,
    "height": 2048,
    "aspectRatio": 1.031,
    "exactAspectRatio": 1.03125,
    "planeWidthMeters": 0.7217,
    "planeHeightMeters": 0.6998,
    "fileSizeBytes": 2281917,
    "sha256": "8785f87085f04a828dffd201617a2ee4271952f5c6c1ff4895002fe3b34fb623",
    "meanLuminance": 0.2337,
    "darkPixelRatioBelow30": 0.4212,
    "brightPixelRatioAbove200": 0.0519
  },
  {
    "index": 5,
    "id": "movie_tag",
    "code": "HOLO-COL-05",
    "mediaType": "image",
    "repoPath": "anim/movietag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/movietag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.26,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "magenta",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -2.1224,
      "yRel": 2.4071,
      "z": 18.0769,
      "pitchRad": 0.0535,
      "yawRad": 1.6002,
      "rollRad": 0.0017,
      "scale": 2.22,
      "scaleX": 2.22,
      "scaleY": 2.22,
      "scaleZ": 1
    },
    "subjectSummary": "Vintage movie poster (Ruthless People) showing Danny DeVito on a phone beside a briefcase of cash and Bette Midler pouring champagne, topped by a hot-pink 'PLATO DOOM' throw-up over a black header band.",
    "width": 1952,
    "height": 2152,
    "aspectRatio": 0.907,
    "exactAspectRatio": 0.9070631970260223,
    "planeWidthMeters": 3.2476,
    "planeHeightMeters": 3.5804,
    "fileSizeBytes": 2357750,
    "sha256": "cb0d62aab7effd1e5ab78ed584039c84dece27b9e46535580bfbe2fab05bb6a8",
    "meanLuminance": 0.4242,
    "darkPixelRatioBelow30": 0.0524,
    "brightPixelRatioAbove200": 0.0501
  },
  {
    "index": 8,
    "id": "soulja_tag",
    "code": "HOLO-COL-08",
    "mediaType": "image",
    "repoPath": "anim/souljatag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/souljatag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.14,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "amber",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.5511,
      "yRel": 3.374,
      "z": 19.9312,
      "pitchRad": 0,
      "yawRad": -1.552,
      "rollRad": 0,
      "scale": 1,
      "scaleX": 1,
      "scaleY": 1,
      "scaleZ": 1
    },
    "subjectSummary": "Still frame of a young man in an orange-and-black jersey holding a stack of cash in front of backlit curtains with yellow caption text: 'IM NOT INTO COMPUTERS, IM INTO MONEY, AND PLATODOOM'S WISDOM'.",
    "width": 2110,
    "height": 2048,
    "aspectRatio": 1.03,
    "exactAspectRatio": 1.0302734375,
    "planeWidthMeters": 1.4836,
    "planeHeightMeters": 1.44,
    "fileSizeBytes": 2098264,
    "sha256": "a44b68a644e0b2a6b83b049133b4cb0d5fa8cec9787562a2668527b8e7767bbb",
    "meanLuminance": 0.5692,
    "darkPixelRatioBelow30": 0.0354,
    "brightPixelRatioAbove200": 0.3644
  },
  {
    "index": 10,
    "id": "daffy_vid",
    "code": "HOLO-COL-10",
    "mediaType": "video",
    "repoPath": "anim/DAFFY.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/DAFFY.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.28,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "emerald",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -1.3349,
      "yRel": 4.4685,
      "z": 40.1005,
      "pitchRad": 0,
      "yawRad": 1.5966,
      "rollRad": 0,
      "scale": 3.027,
      "scaleX": 3.027,
      "scaleY": 3.027,
      "scaleZ": 1
    },
    "subjectSummary": "2D animation of Daffy Duck tossing and hugging stacks of green cash behind a table in front of a spotlighted wall bearing the burgundy 'PLATO DOOM' throw-up.",
    "width": 544,
    "height": 544,
    "aspectRatio": 1.0,
    "exactAspectRatio": 1.0,
    "planeWidthMeters": 4.3589,
    "planeHeightMeters": 4.3589,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 2832442,
    "sha256": "f74dd3798f92c7fd4b8249a42ea509dc1d46f00ee511895b1611de07161c705c",
    "meanLuminance": 0.4299,
    "darkPixelRatioBelow30": 0.1233,
    "brightPixelRatioAbove200": 0.0734
  },
  {
    "index": 11,
    "id": "doomlambo_vid",
    "code": "HOLO-COL-11",
    "mediaType": "video",
    "repoPath": "anim/DOOMLAMBO.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/DOOMLAMBO.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "cyan",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.5902,
      "yRel": 6.6695,
      "z": 13.5014,
      "pitchRad": -0.0038,
      "yawRad": -1.531,
      "rollRad": -0.0463,
      "scale": 3.71,
      "scaleX": 3.71,
      "scaleY": 3.71,
      "scaleZ": 1
    },
    "subjectSummary": "Live-action footage of a white Lamborghini Gallardo with the burgundy 'PLATO DOOM' throw-up on its right side driving slowly through a dense flock of sheep on a forest road.",
    "width": 688,
    "height": 432,
    "aspectRatio": 1.593,
    "exactAspectRatio": 1.5925925925925926,
    "planeWidthMeters": 8.5081,
    "planeHeightMeters": 5.3424,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 6290414,
    "sha256": "d28d216b7a4cb5a54bd22117e7ec6e39a78718d2be4964abbb1ceab6feb61696",
    "meanLuminance": 0.332,
    "darkPixelRatioBelow30": 0.1874,
    "brightPixelRatioAbove200": 0.0564
  },
  {
    "index": 13,
    "id": "doomsnake_vid",
    "code": "HOLO-COL-13",
    "mediaType": "video",
    "repoPath": "anim/doomsnake.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/doomsnake.mp4",
    "framingMode": "full_frame_or_studio_keyed",
    "bypassExteriorCutout": false,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": true,
    "studioBackdropMode": "full_frame_tonal_separation",
    "supportedStudioBackdropModes": [
      "full_frame_tonal_separation",
      "backdrop_keyed_white_scale_preserved"
    ],
    "defaultTintPreset": "amber",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.9483,
      "yRel": 2.1031,
      "z": 4.8246,
      "pitchRad": 0,
      "yawRad": -1.5806,
      "rollRad": 0,
      "scale": 2.576,
      "scaleX": 2.576,
      "scaleY": 2.576,
      "scaleZ": 1
    },
    "subjectSummary": "Portrait video of a white leucistic snake coiled around a raised human forearm/hand against a light/off-white studio backdrop; the burgundy 'PLATO DOOM' throw-up wraps across the snake's scales as its head moves and tongue flicks.",
    "width": 496,
    "height": 592,
    "aspectRatio": 0.838,
    "exactAspectRatio": 0.8378378378378378,
    "planeWidthMeters": 3.4809,
    "planeHeightMeters": 4.1546,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 942925,
    "sha256": "e58f9eca207b2aae1f92f47bf190ca8a35c43c60d46d0fa8bd992dffaca7ca69",
    "meanLuminance": 0.7236,
    "darkPixelRatioBelow30": 0.0359,
    "brightPixelRatioAbove200": 0.5568
  },
  {
    "index": 14,
    "id": "eyedoom_vid",
    "code": "HOLO-COL-14",
    "mediaType": "video",
    "repoPath": "anim/EYEDOOM.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/EYEDOOM.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "magenta",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.4835,
      "yRel": 6.0786,
      "z": 27.5987,
      "pitchRad": 0,
      "yawRad": -1.5667,
      "rollRad": 0,
      "scale": 3.95,
      "scaleX": 3.95,
      "scaleY": 3.95,
      "scaleZ": 1
    },
    "subjectSummary": "Split-screen animation: pulsing red/purple vascular veins spreading across white marble on the left half, and an extreme close-up of a blinking human eye with 'PLATO DOOM' across the sclera on the right half.",
    "width": 544,
    "height": 544,
    "aspectRatio": 1.0,
    "exactAspectRatio": 1.0,
    "planeWidthMeters": 5.688,
    "planeHeightMeters": 5.688,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 2760268,
    "sha256": "af956d069580e95becd1cfddd53b1f4d9b48e8bcff45453daf7fbc2ce583e76f",
    "meanLuminance": 0.5361,
    "darkPixelRatioBelow30": 0.1707,
    "brightPixelRatioAbove200": 0.396
  },
  {
    "index": 15,
    "id": "nokia_vid",
    "code": "HOLO-COL-15",
    "mediaType": "video",
    "repoPath": "anim/NOKIA.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/NOKIA.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "emerald",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.4285,
      "yRel": 3.9782,
      "z": 34.175,
      "pitchRad": 0,
      "yawRad": -1.5766,
      "rollRad": 0,
      "scale": 0.828,
      "scaleX": 0.828,
      "scaleY": 0.828,
      "scaleZ": 1
    },
    "subjectSummary": "Close-up of a classic silver Nokia phone whose backlit green monochrome LCD shows a pixel-art rose dissolving into pixels above the 'PLATO DOOM' throw-up and Cyrillic softkey labels.",
    "width": 560,
    "height": 544,
    "aspectRatio": 1.029,
    "exactAspectRatio": 1.0294117647058822,
    "planeWidthMeters": 1.2274,
    "planeHeightMeters": 1.1923,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 2421224,
    "sha256": "ab67089fdf5cc6f7d5dd2acfa953c41a3883270e1c6dcdba5e7a205b82cf9939",
    "meanLuminance": 0.4837,
    "darkPixelRatioBelow30": 0.0183,
    "brightPixelRatioAbove200": 0.0392
  },
  {
    "index": 16,
    "id": "pinkpanther_vid",
    "code": "HOLO-COL-16",
    "mediaType": "video",
    "repoPath": "anim/PINKPANTHER.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/PINKPANTHER.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "magenta",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.4504,
      "yRel": 1.9448,
      "z": 37.4467,
      "pitchRad": 0,
      "yawRad": -1.5639,
      "rollRad": 0,
      "scale": 2.367,
      "scaleX": 2.367,
      "scaleY": 2.367,
      "scaleZ": 1
    },
    "subjectSummary": "2D animation of the Pink Panther in a blue wizard robe and hat casting a sparkling magic ring over an enchanted broomstick while the 'PLATO DOOM' throw-up floats and dissolves beside the broom.",
    "width": 624,
    "height": 480,
    "aspectRatio": 1.3,
    "exactAspectRatio": 1.3,
    "planeWidthMeters": 4.431,
    "planeHeightMeters": 3.4085,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 2187632,
    "sha256": "a3ce20a1503a86b0ca7292a8d02a5b3f2eb84b16ab85ee451651c18c2253ce31",
    "meanLuminance": 0.4448,
    "darkPixelRatioBelow30": 0.0002,
    "brightPixelRatioAbove200": 0.0264
  },
  {
    "index": 17,
    "id": "tiger_vid",
    "code": "HOLO-COL-17",
    "mediaType": "video",
    "repoPath": "anim/TIGER.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/TIGER.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.16,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "cyan",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 1.5818,
      "yRel": 6.5791,
      "z": 38.3629,
      "pitchRad": 0,
      "yawRad": -1.5834,
      "rollRad": 0,
      "scale": 3.308,
      "scaleX": 3.308,
      "scaleY": 3.308,
      "scaleZ": 1
    },
    "subjectSummary": "Footage of a white Bengal tiger with brown stripes and the 'PLATO DOOM' throw-up integrated into its flank coat wading forward through shallow water in front of a jungle waterfall and ferns.",
    "width": 560,
    "height": 528,
    "aspectRatio": 1.061,
    "exactAspectRatio": 1.0606060606060606,
    "planeWidthMeters": 5.0523,
    "planeHeightMeters": 4.7635,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 5072308,
    "sha256": "6fbd4c57d066b4695bf42938744ebbf42480b020c7fee628ca41225a2adf47ce",
    "meanLuminance": 0.3693,
    "darkPixelRatioBelow30": 0.2274,
    "brightPixelRatioAbove200": 0.0909
  },
  {
    "index": 19,
    "id": "e_acc_logo",
    "code": "HOLO-COL-19",
    "mediaType": "image",
    "repoPath": "e-acc.png",
    "canonicalPath": "/Users/diesel/Desktop/SkateAlley/e-acc.png",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.96,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "none",
    "colorRemapWeight": 0.0,
    "emissiveIntensity": 1.0,
    "baseOpacityMultiplier": 1.0,
    "blendMode": "normal",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -1.18,
      "yRel": 2.15,
      "z": 8.80,
      "pitchRad": 0,
      "yawRad": 0.55,
      "rollRad": 0,
      "scale": 1.35,
      "scaleX": 1.35,
      "scaleY": 1.35,
      "scaleZ": 1
    },
    "subjectSummary": "Monochrome e/acc exponential curve emblem (white frame and hyperbolic curve on solid black square background) rendered with native untinted colors.",
    "width": 300,
    "height": 312,
    "aspectRatio": 0.9615,
    "exactAspectRatio": 0.9615384615384616,
    "planeWidthMeters": 2.0936,
    "planeHeightMeters": 2.1773,
    "fileSizeBytes": 1633,
    "sha256": "fff7130d30924feea208f0cef2742278e3a117796b586bdf6fa327e808b6e356",
    "meanLuminance": 0.1236,
    "darkPixelRatioBelow30": 0.864,
    "brightPixelRatioAbove200": 0.1154
  }
].map(a => Object.freeze({
  ...a,
  corridorPlacement: Object.freeze({ ...a.corridorPlacement })
})));

export const SSM_WHITEPAPER_HOLO_SPEC = Object.freeze({
  id: 'ssm_whitepaper_column',
  code: 'HOLO-COL-SSM-WP',
  index: 18,
  label: 'STATE SPACE MODEL WHITEPAPER (SCROLLABLE 5-PAGE PDF)',
  title: 'STATE SPACE MODEL WITH BAYESIAN INFERENCE // WHITEPAPER',
  kicker: 'HOLO-DOC // OBJ-01 WHITEPAPER',
  subtitle: 'SSMWhitePaper.pdf',
  mediaType: 'scrollable_document',
  type: 'scrollable_document',
  repoPath: 'SSMWhitePaper.pdf',
  pdfUrl: './SSMWhitePaper.pdf',
  pageImagePaths: Object.freeze([
    'assets/ssm_whitepaper/holo_page_01.png',
    'assets/ssm_whitepaper/holo_page_02.png',
    'assets/ssm_whitepaper/holo_page_03.png',
    'assets/ssm_whitepaper/holo_page_04.png',
    'assets/ssm_whitepaper/holo_page_05.png',
  ]),
  pageHeights: Object.freeze([1791, 1860, 1860, 1860, 511]),
  width: 1200,
  height: 1560,
  aspectRatio: Number((1200 / 1560).toFixed(4)),
  defaultTintPreset: 'cyan',
  blendMode: 'normal',
  colorRemapWeight: 0.14,
  emissiveIntensity: 1.48,
  baseOpacityMultiplier: 0.98,
  bypassExteriorCutout: true,
  hasDarkSubjectFloor: true,
  darkSubjectFloorMinAlpha: 0.92,
  isHighKeyStudioBackdrop: false,
  studioBackdropMode: 'none',
  corridorPlacement: Object.freeze({
    wallSide: 'L',
    x: -1.08,
    yRel: 1.76,
    z: 15.00,
    pitchRad: 0.0,
    yawRad: Number((Math.PI / 2).toFixed(4)),
    rollRad: 0.0,
    scale: 0.78,
    scaleX: 0.78,
    scaleY: 0.78,
    scaleZ: 1.0,
  }),
});

export const HOLO_MEDIA_BY_ID = Object.freeze((() => {
  const map = {};
  for (const asset of HOLO_MEDIA_MANIFEST) {
    map[asset.id] = asset;
    map[asset.code] = asset;
    map[asset.repoPath] = asset;
    map[String(asset.index)] = asset;
    map[asset.index] = asset;
    if (Array.isArray(asset.slides)) {
      for (const slide of asset.slides) {
        if (slide && slide.id) {
          map[slide.id] = slide;
        }
      }
    }
  }
  map[SSM_WHITEPAPER_HOLO_SPEC.id] = SSM_WHITEPAPER_HOLO_SPEC;
  map[SSM_WHITEPAPER_HOLO_SPEC.code] = SSM_WHITEPAPER_HOLO_SPEC;
  map[SSM_WHITEPAPER_HOLO_SPEC.repoPath] = SSM_WHITEPAPER_HOLO_SPEC;
  return map;
})());

export function resolveHoloMediaSpec(identifier) {
  if (identifier == null) {
    throw new Error('[hologram_columns] Cannot resolve null or undefined hologram media spec identifier.');
  }
  if (typeof identifier === 'object') {
    if (identifier.id && HOLO_MEDIA_BY_ID[identifier.id] && !identifier.isCustomSlide) {
      return HOLO_MEDIA_BY_ID[identifier.id];
    }
    if (identifier.mediaType || identifier.type || identifier.repoPath || identifier.url) {
      const w = identifier.width || 1200;
      const h = identifier.height || 1500;
      const rawType = identifier.mediaType || identifier.type || 'image';
      const normMediaType =
        rawType === 'video'
          ? 'video'
          : rawType === 'scrollable_document'
          ? 'scrollable_document'
          : rawType === 'placeholder' || rawType === 'procedural'
          ? 'placeholder'
          : 'image';
      const label = identifier.label || identifier.title || identifier.id || 'HOLO SLIDE';
      const repoPath = identifier.repoPath || identifier.url || 'procedural://custom_slide';
      return {
        id: identifier.id || `slide_${Date.now()}`,
        code: identifier.code || 'HOLO-SLIDE',
        index: identifier.index || 1,
        label,
        title: label,
        kicker: identifier.kicker || 'INTERACTIVE HOLOGRAM SLIDE',
        subtitle: identifier.subtitle || repoPath || '',
        mediaType: normMediaType,
        type: normMediaType,
        repoPath,
        url: repoPath,
        pdfUrl: identifier.pdfUrl || repoPath,
        pageImagePaths: identifier.pageImagePaths || null,
        pageHeights: identifier.pageHeights || null,
        blendMode: identifier.blendMode,
        width: w,
        height: h,
        aspectRatio: identifier.aspectRatio || Number((w / h).toFixed(4)),
        defaultTintPreset: identifier.defaultTintPreset || 'cyan',
        colorRemapWeight: identifier.colorRemapWeight,
        emissiveIntensity: identifier.emissiveIntensity,
        baseOpacityMultiplier: identifier.baseOpacityMultiplier,
        bypassExteriorCutout: identifier.bypassExteriorCutout !== false,
        hasDarkSubjectFloor: Boolean(identifier.hasDarkSubjectFloor),
        darkSubjectFloorMinAlpha: identifier.darkSubjectFloorMinAlpha ?? 0.22,
        isHighKeyStudioBackdrop: Boolean(identifier.isHighKeyStudioBackdrop),
        studioBackdropMode: identifier.studioBackdropMode || 'none',
        fps: identifier.fps || 24,
        durationSec: identifier.durationSec || 6.04,
        frameCount: identifier.frameCount || 145,
        corridorPlacement: identifier.corridorPlacement || {
          wallSide: 'L',
          x: -1.05,
          yRel: 1.76,
          z: 6.40,
          pitchRad: 0,
          yawRad: 0.42,
          rollRad: 0,
          scale: 1.35,
          scaleX: 1.35,
          scaleY: 1.35,
          scaleZ: 1,
        },
        slides: identifier.slides || null,
        isCarousel: Boolean(identifier.isCarousel || (Array.isArray(identifier.slides) && identifier.slides.length > 1)),
      };
    }
  }
  const spec = HOLO_MEDIA_BY_ID[identifier];
  if (!spec) {
    throw new Error(`[hologram_columns] Unknown hologram media spec identifier: "${identifier}". Must match one of canonical assets.`);
  }
  return spec;
}

// ============================================================================
// 2. Spectral Color Mapping Presets & Enums (§3, §5, §6)
// ============================================================================
export const HOLO_SPECTRAL_TINT_PRESETS = Object.freeze({
  none: Object.freeze({
    primaryHex: '#ffffff',
    secondaryHex: '#000000',
    highlightHex: '#ffffff',
    primaryInt: 0xffffff,
    secondaryInt: 0x000000,
    highlightInt: 0xffffff,
    colorRemapWeight: 0.0,
  }),
  cyan: Object.freeze({
    primaryHex: '#00d5ff',
    secondaryHex: '#083344',
    highlightHex: '#a5f3fc',
    primaryInt: 0x00d5ff,
    secondaryInt: 0x083344,
    highlightInt: 0xa5f3fc,
  }),
  amber: Object.freeze({
    primaryHex: '#f59e0b',
    secondaryHex: '#3b1502',
    highlightHex: '#fef08a',
    primaryInt: 0xf59e0b,
    secondaryInt: 0x3b1502,
    highlightInt: 0xfef08a,
  }),
  emerald: Object.freeze({
    primaryHex: '#10b981',
    secondaryHex: '#063324',
    highlightHex: '#a7f3d0',
    primaryInt: 0x10b981,
    secondaryInt: 0x063324,
    highlightInt: 0xa7f3d0,
  }),
  magenta: Object.freeze({
    primaryHex: '#ec4899',
    secondaryHex: '#3b0726',
    highlightHex: '#fbcfe8',
    primaryInt: 0xec4899,
    secondaryInt: 0x3b0726,
    highlightInt: 0xfbcfe8,
  }),
  crimson_alert: Object.freeze({
    primaryHex: '#ef4444',
    secondaryHex: '#450a0a',
    highlightHex: '#fecaca',
    primaryInt: 0xef4444,
    secondaryInt: 0x450a0a,
    highlightInt: 0xfecaca,
  }),
});

export const HOLO_LIFECYCLE_STATES = Object.freeze([
  'inactive',
  'materializing',
  'active',
  'agitated',
  'swapping',
  'dematerializing',
]);

export const HOLO_GLITCH_MODES = Object.freeze([
  'off',
  'ambient',
  'agitated',
  'manual',
]);

export const HOLO_DEFAULT_RUNTIME_PARAMS = Object.freeze({
  colorAndLuminance: Object.freeze({
    primaryTintHex: '#00d5ff',
    secondaryTintHex: '#083344',
    colorRemapWeight: 0.72,
    baseOpacityMultiplier: 0.92,
    emissiveIntensity: 1.35,
    blackLevelThreshold: 0.06,
    darkSubjectFloorMinAlpha: 0.28,
    studioBackdropMode: 'full_frame_tonal_separation',
  }),
  scanlineAndGrid: Object.freeze({
    scanlineDensity: 220.0,
    scanlineContrast: 0.18,
    rollingBandWidth: 0.14,
    rollingBandSpeed: 0.38,
    rollingBandDirection: -1,
    pixelGridVisibility: 0.15,
  }),
  spatialAndEdge: Object.freeze({
    edgeVignetteSoftness: 0.12,
    fresnelFadeIntensity: 0.65,
    ghostPlaneDepthOffset: 0.055,
    ghostPlaneOpacity: 0.22,
    backFaceVisibility: 'dimmed',
  }),
  glitchCadence: Object.freeze({
    glitchMode: 'ambient',
    averageBurstIntervalSec: 3.4,
    burstDurationMinSec: 0.16,
    burstDurationMaxSec: 0.42,
    microTwitchProbability: 0.14,
  }),
  glitchSeverity: Object.freeze({
    maxSliceDisplacement: 0.065,
    sliceDensityCount: 8,
    chromaticAberrationDistance: 0.014,
    chromaticAberrationAngleRad: 0.18,
    staticNoiseIntensity: 0.38,
    posterizationLevels: 6.0,
    dropoutFrequency: 0.25,
  }),
  playback: Object.freeze({
    playing: true,
    loop: true,
    playbackRate: 1.0,
    currentTimeSec: 0.0,
    frameStutterActive: false,
  }),
});

function deepCloneParams(source = {}) {
  const p = HOLO_DEFAULT_RUNTIME_PARAMS;
  return {
    colorAndLuminance: { ...p.colorAndLuminance, ...(source.colorAndLuminance || {}) },
    scanlineAndGrid: { ...p.scanlineAndGrid, ...(source.scanlineAndGrid || {}) },
    spatialAndEdge: { ...p.spatialAndEdge, ...(source.spatialAndEdge || {}) },
    glitchCadence: { ...p.glitchCadence, ...(source.glitchCadence || {}) },
    glitchSeverity: { ...p.glitchSeverity, ...(source.glitchSeverity || {}) },
    playback: { ...p.playback, ...(source.playback || {}) },
  };
}

function resolveBackFaceModeCode(backFaceVisibility) {
  if (backFaceVisibility === 'culled') return 1;
  if (backFaceVisibility === 'mirrored') return 2;
  return 0;
}

function resolveBackFaceOpacityMultiplier(backFaceVisibility) {
  if (backFaceVisibility === 'culled') return 0.0;
  if (backFaceVisibility === 'mirrored') return 0.85;
  return 0.42;
}

// ============================================================================
// 3. Native Aspect-Ratio Column Geometry Computation (Ticket-001 §3.2)
// ============================================================================
export function computeHologramColumnGeometrySpec(assetSpec, baseHeightMeters = 1.44) {
  const exactAspect = assetSpec.width / assetSpec.height;
  let planeHeight, planeWidth;
  if (exactAspect >= 1.0) {
    planeHeight = baseHeightMeters;
    planeWidth = Number((planeHeight * exactAspect).toFixed(4));
  } else {
    planeHeight = Number((baseHeightMeters * 1.12).toFixed(4));
    planeWidth = Number((planeHeight * exactAspect).toFixed(4));
  }
  const primaryGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 32);
  const ghostGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 16);
  return {
    planeWidth,
    planeHeight,
    aspectRatio: exactAspect,
    baseHeightMeters,
    primaryGeometry,
    ghostGeometry,
  };
}

// ============================================================================
// 4. Deterministic Texture Pipeline & Video Controller (Ticket-001 §3.3)
// ============================================================================
function createDeterministicPlaceholderTexture(assetSpec) {
  const width = 64;
  const height = 64;
  const size = width * height * 4;
  const data = new Uint8Array(size);
  const tint = HOLO_SPECTRAL_TINT_PRESETS[assetSpec.defaultTintPreset] || HOLO_SPECTRAL_TINT_PRESETS.cyan;
  const color = new THREE.Color(tint.primaryHex);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  for (let i = 0; i < size; i += 4) {
    const px = (i / 4) % width;
    const py = Math.floor((i / 4) / width);
    const lum = 0.5 + 0.4 * Math.sin(px * 0.2 + py * 0.15);
    data[i] = Math.floor(r * lum);
    data[i + 1] = Math.floor(g * lum);
    data[i + 2] = Math.floor(b * lum);
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function resolveMediaUrl(repoPath) {
  if (!repoPath) return '';
  if (
    repoPath.startsWith('blob:') ||
    repoPath.startsWith('data:') ||
    repoPath.startsWith('http://') ||
    repoPath.startsWith('https://') ||
    repoPath.startsWith('/') ||
    repoPath.startsWith('./')
  ) {
    return repoPath;
  }
  return './' + repoPath;
}

export function createProceduralSlideCardTexture(slideSpec, slideIndex = 0, totalSlides = 5) {
  if (typeof document === 'undefined') {
    return createDeterministicPlaceholderTexture(slideSpec);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  const tint = HOLO_SPECTRAL_TINT_PRESETS[slideSpec.defaultTintPreset] || HOLO_SPECTRAL_TINT_PRESETS.cyan;

  // Luminous holographic gradient backdrop so AdditiveBlending projects a vivid, high-contrast panel
  const grad = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.46,
    60,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.65
  );
  grad.addColorStop(0, 'rgba(0, 195, 255, 0.52)');
  grad.addColorStop(0.55, 'rgba(8, 85, 125, 0.36)');
  grad.addColorStop(1, 'rgba(4, 24, 42, 0.24)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle holographic coordinate grid
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.28)';
  ctx.lineWidth = 2.0;
  for (let x = 60; x < canvas.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 60; y < canvas.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Outer tactical frame
  ctx.strokeStyle = tint.primaryHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);

  // Inner corner brackets
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  const bLen = 58;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(68, 68 + bLen);
  ctx.lineTo(68, 68);
  ctx.lineTo(68 + bLen, 68);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(canvas.width - 68 - bLen, 68);
  ctx.lineTo(canvas.width - 68, 68);
  ctx.lineTo(canvas.width - 68, 68 + bLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(68, canvas.height - 68 - bLen);
  ctx.lineTo(68, canvas.height - 68);
  ctx.lineTo(68 + bLen, canvas.height - 68);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(canvas.width - 68 - bLen, canvas.height - 68);
  ctx.lineTo(canvas.width - 68, canvas.height - 68);
  ctx.lineTo(canvas.width - 68, canvas.height - 68 - bLen);
  ctx.stroke();

  // Header badge
  ctx.fillStyle = tint.primaryHex;
  ctx.font = 'bold 30px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  const badgeText = slideSpec.kicker || `HOLO-COLUMN CAROUSEL // SLIDE 0${slideIndex + 1} OF 0${totalSlides}`;
  ctx.fillText(badgeText, canvas.width * 0.5, 165);

  // Center holographic reticle emblem
  const cx = canvas.width * 0.5;
  const cy = canvas.height * 0.45;
  ctx.strokeStyle = tint.primaryHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 155, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  // Swipe arrows inside emblem
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`◄  0${slideIndex + 1}  ►`, cx, cy + 24);

  // Main slide title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const title = slideSpec.label || `SLIDE 0${slideIndex + 1} // INTERACTIVE DECK`;
  ctx.fillText(title, cx, cy + 250);

  // Subtitle / instructions wrapped
  ctx.fillStyle = tint.highlightHex || '#a5f3fc';
  ctx.font = 'bold 25px ui-monospace, SFMono-Regular, Menlo, monospace';
  const sub = slideSpec.subtitle || 'DRAG HORIZONTALLY TO SWIPE ACROSS IMAGES & VIDEOS';
  const words = sub.split(' ');
  let line = '';
  let yCursor = cy + 315;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > 740 && i > 0) {
      ctx.fillText(line.trim(), cx, yCursor);
      line = words[i] + ' ';
      yCursor += 38;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), cx, yCursor);
  }

  // Bottom status bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('SWIPE LEFT / RIGHT  •  CLICK EDGES  •  UPLOAD CUSTOM MEDIA IN HUD', cx, canvas.height - 125);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export class HoloVideoStreamController {
  constructor(assetSpec, options = {}) {
    this.assetSpec = assetSpec;
    this.durationSec = assetSpec.durationSec || 6.041667;
    this.fps = assetSpec.fps || 24;
    this.totalFrames = assetSpec.frameCount || 145;
    this.playing = options.playing !== undefined ? Boolean(options.playing) : true;
    this.loop = options.loop !== undefined ? Boolean(options.loop) : true;
    this.playbackRate = options.playbackRate !== undefined ? Math.max(0.1, Math.min(4.0, options.playbackRate)) : 1.0;
    this.currentTimeSec = 0.0;
    this.currentFrame = 0;
    this.displayedFrameIndex = 0;
    this.stutterActive = false;
    this.stutterMode = 'none';

    this.video = null;
    this.texture = null;

    if (typeof document !== 'undefined') {
      const v = document.createElement('video');
      v.src = resolveMediaUrl(assetSpec.repoPath);
      v.loop = this.loop;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      v.playbackRate = this.playbackRate;
      v.addEventListener('loadedmetadata', () => {
        if (v.duration && Number.isFinite(v.duration) && v.duration > 0) {
          this.durationSec = v.duration;
          this.totalFrames = Math.max(1, Math.round(this.durationSec * this.fps));
        }
        if (v.videoWidth > 0 && v.videoHeight > 0 && !Object.isFrozen(this.assetSpec)) {
          this.assetSpec.width = v.videoWidth;
          this.assetSpec.height = v.videoHeight;
          this.assetSpec.aspectRatio = Number((v.videoWidth / v.videoHeight).toFixed(4));
        }
      });
      v.addEventListener('error', (e) => {
        console.warn(`[hologram_columns] Video load error for ${assetSpec.id}:`, e);
      });
      if (this.playing) {
        v.play().catch(() => {});
      }
      this.video = v;
      this.texture = new THREE.VideoTexture(v);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
    } else {
      this.texture = createDeterministicPlaceholderTexture(assetSpec);
    }
  }

  play() {
    this.playing = true;
    if (this.video) {
      this.video.play().catch(() => {});
    }
  }

  pause() {
    this.playing = false;
    if (this.video) {
      this.video.pause();
    }
  }

  togglePlay() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
    return this.playing;
  }

  setLoop(loopBool) {
    this.loop = Boolean(loopBool);
    if (this.video) {
      this.video.loop = this.loop;
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.1, Math.min(4.0, Number(rate) || 1.0));
    if (this.video) {
      this.video.playbackRate = this.playbackRate;
    }
  }

  scrubToTime(timeSec) {
    const clamped = Math.max(0.0, Math.min(this.durationSec, Number(timeSec) || 0.0));
    this.currentTimeSec = clamped;
    this.currentFrame = Math.round(this.currentTimeSec * this.fps) % this.totalFrames;
    this.displayedFrameIndex = this.currentFrame;
    if (this.video) {
      this.video.currentTime = clamped;
    }
  }

  scrubToFrame(frameIndex) {
    const frame = ((Math.round(frameIndex) % this.totalFrames) + this.totalFrames) % this.totalFrames;
    const timeSec = frame / this.fps;
    this.scrubToTime(timeSec);
  }

  resetFrameZero() {
    this.scrubToTime(0.0);
  }

  stepVideoClock(dt, glitchFrameStutterState = null) {
    if (this.playing) {
      this.currentTimeSec += dt * this.playbackRate;
      if (this.currentTimeSec >= this.durationSec) {
        if (this.loop) {
          this.currentTimeSec = this.currentTimeSec % this.durationSec;
        } else {
          this.currentTimeSec = this.durationSec;
          this.playing = false;
        }
      }
      this.currentFrame = Math.floor(this.currentTimeSec * this.fps) % this.totalFrames;
    }

    if (glitchFrameStutterState && glitchFrameStutterState.active) {
      this.stutterActive = true;
      this.stutterMode = glitchFrameStutterState.mode || 'freeze';
      if (this.stutterMode === 'freeze') {
        this.displayedFrameIndex = glitchFrameStutterState.anchorFrame ?? this.currentFrame;
      } else {
        const anchor = glitchFrameStutterState.anchorFrame ?? this.currentFrame;
        const jitter = glitchFrameStutterState.jitterOffset ?? 0;
        this.displayedFrameIndex = ((anchor + jitter) % this.totalFrames + this.totalFrames) % this.totalFrames;
      }
    } else {
      this.stutterActive = false;
      this.stutterMode = 'none';
      this.displayedFrameIndex = this.currentFrame;
    }

    return {
      currentTimeSec: this.currentTimeSec,
      currentFrame: this.currentFrame,
      displayedFrameIndex: this.displayedFrameIndex,
      stutterActive: this.stutterActive,
      stutterMode: this.stutterMode,
    };
  }

  dispose() {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video.load();
      this.video = null;
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
  }
}

export class HoloScrollableDocumentController {
  constructor(assetSpec, options = {}) {
    this.assetSpec = assetSpec;
    this.type = 'scrollable_document';
    this.viewportWidth = assetSpec.width || 1200;
    this.viewportHeight = assetSpec.height || 1560;
    this.headerHeight = 84;
    this.footerHeight = 68;
    this.bodyTop = this.headerHeight;
    this.bodyHeight = this.viewportHeight - this.headerHeight - this.footerHeight; // 1408
    this.pageDrawX = 16;
    this.pageDrawWidth = 1120;
    this.dividerHeight = 36;

    const rawPaths = Array.isArray(assetSpec.pageImagePaths) && assetSpec.pageImagePaths.length > 0
      ? assetSpec.pageImagePaths
      : [
          'assets/ssm_whitepaper/holo_page_01.png',
          'assets/ssm_whitepaper/holo_page_02.png',
          'assets/ssm_whitepaper/holo_page_03.png',
          'assets/ssm_whitepaper/holo_page_04.png',
          'assets/ssm_whitepaper/holo_page_05.png',
        ];
    const rawHeights = Array.isArray(assetSpec.pageHeights) && assetSpec.pageHeights.length === rawPaths.length
      ? assetSpec.pageHeights
      : [1791, 1860, 1860, 1860, 511];

    this.pages = rawPaths.map((p, idx) => {
      const scaledH = Math.round((rawHeights[idx] || 1800) * (this.pageDrawWidth / 1200));
      return {
        index: idx + 1,
        path: p,
        scaledHeight: scaledH,
        topY: 0,
        bottomY: 0,
        image: null,
        loaded: false,
      };
    });

    this.recomputeLayout();
    this.scrollY = 0.0;
    this.targetScrollY = 0.0;
    this.currentPage = 1;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.viewportWidth;
      this.canvas.height = this.viewportHeight;
      this.ctx = this.canvas.getContext('2d');
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.wrapS = THREE.ClampToEdgeWrapping;
      this.texture.wrapT = THREE.ClampToEdgeWrapping;
      this.texture.anisotropy = 4;

      for (const page of this.pages) {
        if (typeof Image !== 'undefined') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            page.image = img;
            page.loaded = true;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              page.scaledHeight = Math.round(img.naturalHeight * (this.pageDrawWidth / img.naturalWidth));
              this.recomputeLayout();
            }
            this.renderViewport();
          };
          img.src = resolveMediaUrl(page.path);
        }
      }
      this.renderViewport();
    } else {
      this.canvas = null;
      this.ctx = null;
      this.texture = createDeterministicPlaceholderTexture(assetSpec);
    }
  }

  recomputeLayout() {
    let cursorY = 0;
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      page.topY = cursorY;
      page.bottomY = cursorY + page.scaledHeight;
      cursorY = page.bottomY + (i < this.pages.length - 1 ? this.dividerHeight : 0);
    }
    this.totalContentHeight = Math.max(this.bodyHeight, cursorY);
    this.maxScrollY = Math.max(1, this.totalContentHeight - this.bodyHeight);
  }

  get scrollProgress() {
    return Math.max(0.0, Math.min(1.0, this.scrollY / this.maxScrollY));
  }

  scrollByPixels(deltaY, immediate = false) {
    this.targetScrollY = Math.max(0.0, Math.min(this.maxScrollY, this.targetScrollY + deltaY));
    if (immediate) {
      this.scrollY = this.targetScrollY;
      this.renderViewport();
    }
    return this.targetScrollY;
  }

  scrollToProgress(progress, immediate = false) {
    const clamped = Math.max(0.0, Math.min(1.0, Number(progress) || 0.0));
    this.targetScrollY = clamped * this.maxScrollY;
    if (immediate) {
      this.scrollY = this.targetScrollY;
      this.renderViewport();
    }
    return this.targetScrollY;
  }

  scrollPage(deltaPages = 1, immediate = false) {
    const step = (this.bodyHeight - 96) * deltaPages;
    return this.scrollByPixels(step, immediate);
  }

  update(dt = 1 / 60) {
    if (Math.abs(this.targetScrollY - this.scrollY) > 0.25) {
      const alpha = Math.min(1.0, Math.max(0.05, dt * 16.0));
      this.scrollY += (this.targetScrollY - this.scrollY) * alpha;
      if (Math.abs(this.targetScrollY - this.scrollY) <= 0.4) {
        this.scrollY = this.targetScrollY;
      }
      this.renderViewport();
      return true;
    }
    return false;
  }

  drawFallbackPage(ctx, page, drawX, drawY, drawW, drawH) {
    ctx.fillStyle = '#081422';
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX + 12, drawY + 12, drawW - 24, drawH - 24);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`BAYESIAN LINEAR GAUSSIAN SSM // PAGE 0${page.index} OF 0${this.pages.length}`, drawX + 48, drawY + 76);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 22px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('LOADING HIGH-DPI LATEX WHITEPAPER TEXTURE...', drawX + 48, drawY + 128);
  }

  renderViewport() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    ctx.clearRect(0, 0, w, h);

    // 1. Deep holographic obsidian backing
    ctx.fillStyle = '#07121e';
    ctx.fillRect(0, 0, w, h);

    // Determine active page at viewport center
    const centerDocY = this.scrollY + this.bodyHeight * 0.45;
    let activePageIdx = 1;
    for (const p of this.pages) {
      if (centerDocY >= p.topY) {
        activePageIdx = p.index;
      }
    }
    this.currentPage = activePageIdx;

    // 2. Clipped Document Body Region (y = 84 .. 1492)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.bodyTop, w - 52, this.bodyHeight);
    ctx.clip();

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const screenTopY = this.bodyTop + (page.topY - this.scrollY);
      const screenBottomY = screenTopY + page.scaledHeight;

      if (screenBottomY >= this.bodyTop && screenTopY <= this.bodyTop + this.bodyHeight) {
        if (page.loaded && page.image) {
          ctx.drawImage(
            page.image,
            this.pageDrawX,
            Math.round(screenTopY),
            this.pageDrawWidth,
            page.scaledHeight
          );
        } else {
          this.drawFallbackPage(
            ctx,
            page,
            this.pageDrawX,
            Math.round(screenTopY),
            this.pageDrawWidth,
            page.scaledHeight
          );
        }

        // Subtle luminous cyan page border
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
          this.pageDrawX,
          Math.round(screenTopY),
          this.pageDrawWidth,
          page.scaledHeight
        );
      }

      // Page-break divider bar between pages
      if (i < this.pages.length - 1) {
        const divTopY = screenBottomY;
        if (divTopY + this.dividerHeight >= this.bodyTop && divTopY <= this.bodyTop + this.bodyHeight) {
          ctx.fillStyle = 'rgba(6, 28, 46, 0.92)';
          ctx.fillRect(this.pageDrawX, Math.round(divTopY), this.pageDrawWidth, this.dividerHeight);

          ctx.strokeStyle = 'rgba(0, 213, 255, 0.48)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(this.pageDrawX + 24, Math.round(divTopY + this.dividerHeight * 0.5));
          ctx.lineTo(this.pageDrawX + this.pageDrawWidth - 24, Math.round(divTopY + this.dividerHeight * 0.5));
          ctx.stroke();

          ctx.fillStyle = '#07121e';
          ctx.fillRect(this.pageDrawX + 410, Math.round(divTopY + 4), 300, this.dividerHeight - 8);
          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `PAGE 0${page.index} END  //  PAGE 0${page.index + 1}`,
            this.pageDrawX + this.pageDrawWidth * 0.5,
            Math.round(divTopY + this.dividerHeight * 0.5)
          );
        }
      }
    }
    ctx.restore();

    // 3. Right-Edge Vertical Scrollbar Track (x = 1148 .. 1188, y = 94 .. 1482)
    const trackX = 1152;
    const trackW = 28;
    const trackY = this.bodyTop + 12;
    const trackH = this.bodyHeight - 24;

    ctx.fillStyle = 'rgba(8, 36, 58, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.58)';
    ctx.lineWidth = 2;
    ctx.fillRect(trackX, trackY, trackW, trackH);
    ctx.strokeRect(trackX, trackY, trackW, trackH);

    const visibleRatio = Math.min(1.0, this.bodyHeight / this.totalContentHeight);
    const thumbH = Math.max(64, Math.round(trackH * visibleRatio));
    const maxThumbTravel = Math.max(1, trackH - thumbH);
    const thumbY = Math.round(trackY + this.scrollProgress * maxThumbTravel);

    ctx.fillStyle = '#00d5ff';
    ctx.fillRect(trackX + 3, thumbY, trackW - 6, thumbH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trackX + 3, thumbY, trackW - 6, thumbH);

    // 4. Top Holographic Document Header Bar (y = 0 .. 84)
    ctx.fillStyle = 'rgba(5, 18, 32, 0.96)';
    ctx.fillRect(0, 0, w, this.headerHeight);
    ctx.strokeStyle = '#00d5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, this.headerHeight);
    ctx.lineTo(w, this.headerHeight);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('HOLO-DOC // OBJ-01 WHITEPAPER COLUMN (3D SCROLLABLE)', 24, 30);

    ctx.fillStyle = '#f0f9ff';
    ctx.font = 'bold 23px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Bayesian Linear Gaussian State Space Model (SSM)', 24, 64);

    // Top-Right Close / Back to Mount Button (x = 876 .. 1180, y = 16 .. 68)
    const closeX = 876;
    const closeY = 16;
    const closeW = 304;
    const closeH = 52;
    ctx.fillStyle = 'rgba(185, 28, 28, 0.42)';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.fillRect(closeX, closeY, closeW, closeH);
    ctx.strokeRect(closeX, closeY, closeW, closeH);
    ctx.fillStyle = '#fef2f2';
    ctx.font = 'bold 17px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕ CLOSE / BACK (ESC)', closeX + closeW * 0.5, closeY + closeH * 0.5 + 1);

    // 5. Bottom Holographic Navigation & Telemetry Footer Bar (y = 1492 .. 1560)
    ctx.fillStyle = 'rgba(5, 18, 32, 0.96)';
    ctx.fillRect(0, this.bodyTop + this.bodyHeight, w, this.footerHeight);
    ctx.strokeStyle = 'rgba(0, 213, 255, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.bodyTop + this.bodyHeight);
    ctx.lineTo(w, this.bodyTop + this.bodyHeight);
    ctx.stroke();

    const pct = Math.round(this.scrollProgress * 100);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 17px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `PAGE 0${this.currentPage} OF 0${this.pages.length}  •  SCROLL: ${pct}%  •  WHEEL OR DRAG COLUMN`,
      24,
      this.bodyTop + this.bodyHeight + this.footerHeight * 0.5
    );

    // Footer Interactive Buttons: [ ▲ PG UP ]  [ ▼ PG DN ]  [ PDF ↗ ]
    const btns = [
      { label: '▲ PG UP', x: 642, w: 164 },
      { label: '▼ PG DN', x: 818, w: 164 },
      { label: 'PDF ↗', x: 994, w: 184 },
    ];
    const btnY = this.bodyTop + this.bodyHeight + 12;
    const btnH = 44;
    ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    for (const b of btns) {
      ctx.fillStyle = 'rgba(8, 47, 73, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.fillRect(b.x, btnY, b.w, btnH);
      ctx.strokeRect(b.x, btnY, b.w, btnH);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(b.label, b.x + b.w * 0.5, btnY + btnH * 0.5 + 1);
    }

    // Outer Hologram Column Frame
    ctx.strokeStyle = '#00d5ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  dispose() {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    this.canvas = null;
    this.ctx = null;
  }
}

export function createHoloMediaTextureController(assetSpec, options = {}) {
  const spec = resolveHoloMediaSpec(assetSpec.id || assetSpec);
  if (spec.mediaType === 'video') {
    return new HoloVideoStreamController(spec, options);
  }
  if (spec.mediaType === 'scrollable_document') {
    return new HoloScrollableDocumentController(spec, options);
  }
  if (spec.mediaType === 'placeholder' || String(spec.repoPath || '').startsWith('procedural://')) {
    const texture = createProceduralSlideCardTexture(
      spec,
      options.slideIndex ?? 0,
      options.totalSlides ?? 5
    );
    return {
      assetSpec: spec,
      type: 'placeholder',
      texture,
      dispose() {
        if (texture) texture.dispose();
      },
    };
  }
  let texture;
  if (typeof document !== 'undefined') {
    const loader = new THREE.TextureLoader();
    texture = loader.load(resolveMediaUrl(spec.repoPath), (loadedTex) => {
      if (loadedTex.image && loadedTex.image.width > 0 && loadedTex.image.height > 0 && !Object.isFrozen(spec)) {
        spec.width = loadedTex.image.width;
        spec.height = loadedTex.image.height;
        spec.aspectRatio = Number((loadedTex.image.width / loadedTex.image.height).toFixed(4));
      }
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    texture = createDeterministicPlaceholderTexture(spec);
  }
  return {
    assetSpec: spec,
    type: 'image',
    texture,
    dispose() {
      if (texture) texture.dispose();
    },
  };
}

// ============================================================================
// 5. Per-Asset Pre-Processing & Luminance-to-Opacity Model (Ticket-002)
// ============================================================================
function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
  return t * t * (3.0 - 2.0 * t);
}

export function evaluateHologramPixelPreProcessing(rgb, uv, assetSpec, params = {}) {
  const spec = resolveHoloMediaSpec(assetSpec.id || assetSpec);
  let r = 0, g = 0, b = 0;
  if (Array.isArray(rgb)) {
    r = rgb[0]; g = rgb[1]; b = rgb[2];
  } else if (rgb) {
    r = rgb.r ?? 0; g = rgb.g ?? 0; b = rgb.b ?? 0;
  }
  if (r > 1.0 || g > 1.0 || b > 1.0) {
    r /= 255.0; g /= 255.0; b /= 255.0;
  }
  let u = 0.5, v = 0.5;
  if (Array.isArray(uv)) {
    u = uv[0]; v = uv[1];
  } else if (uv) {
    u = uv.u ?? uv.x ?? 0.5; v = uv.v ?? uv.y ?? 0.5;
  }

  const srcLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const redDom = r - 0.5 * (g + b);

  let cutoutMask = 1.0;
  let effLum = srcLum;
  let isStudioBackdropAttenuated = false;
  let isSnakeScaleOrCounter = false;
  let borderRetained = true;
  const tagWeight = (redDom >= 0.12) ? 0.85 : 0.0;

  if (spec.isHighKeyStudioBackdrop) {
    const mode = params?.colorAndLuminance?.studioBackdropMode || spec.studioBackdropMode || 'full_frame_tonal_separation';
    if (mode === 'full_frame_tonal_separation') {
      cutoutMask = 1.0;
      borderRetained = true;
      const isWall = (srcLum >= 0.72 && srcLum <= 0.885 && chroma < 0.045 && redDom < 0.06);
      const isSnake = (srcLum >= 0.88);
      const isCounter = (srcLum >= 0.82 && !isWall);
      if (isWall) {
        const t = (srcLum - 0.72) / (0.885 - 0.72);
        effLum = 0.34 + t * (0.44 - 0.34);
      } else if (isSnake || isCounter) {
        const t = Math.min(Math.max((srcLum - 0.82) / (1.0 - 0.82), 0.0), 1.0);
        effLum = 0.86 + t * (0.98 - 0.86);
      }
      isSnakeScaleOrCounter = (isSnake || isCounter);
    } else if (mode === 'backdrop_keyed_white_scale_preserved') {
      const ex = (u - 0.50) / 0.31;
      const ey = (v - 0.52) / 0.43;
      const outside = (ex * ex + ey * ey) > 1.0;
      const achromatic = (chroma < 0.042 && redDom < 0.05);
      const wallLum = (srcLum >= 0.72 && srcLum <= 0.885);
      const notTag = (redDom < 0.08);
      const isExteriorWall = outside && achromatic && wallLum && notTag;
      if (isExteriorWall) {
        cutoutMask = 0.08;
        isStudioBackdropAttenuated = true;
        borderRetained = false;
      } else {
        cutoutMask = 1.0;
        isStudioBackdropAttenuated = false;
        borderRetained = true;
      }
      const isSnake = (srcLum >= 0.88);
      const isCounter = (srcLum >= 0.82 && !isExteriorWall);
      isSnakeScaleOrCounter = (isSnake || isCounter);
      effLum = srcLum;
    }
  }

  const T_black = params?.colorAndLuminance?.blackLevelThreshold ?? 0.06;
  const baseOpacityMult = params?.colorAndLuminance?.baseOpacityMultiplier ?? 0.92;
  const specMinAlpha = spec.darkSubjectFloorMinAlpha ?? 0.14;
  const paramMinAlpha = params?.colorAndLuminance?.darkSubjectFloorMinAlpha ?? specMinAlpha;
  const F_dark = spec.hasDarkSubjectFloor ? Math.max(paramMinAlpha, specMinAlpha) : paramMinAlpha;

  const alphaLum = smoothstep(T_black, 0.92, effLum);
  let targetAlpha = alphaLum + tagWeight * 0.25;
  let isDarkSubjectFloorLifted = false;

  if (spec.hasDarkSubjectFloor) {
    if (targetAlpha < F_dark) {
      targetAlpha = F_dark;
      isDarkSubjectFloorLifted = true;
    }
    const isInterior = (u >= 0.08 && u <= 0.92 && v >= 0.08 && v <= 0.92);
    if (isInterior && effLum < 0.15) {
      targetAlpha += 0.04;
      isDarkSubjectFloorLifted = true;
    }
  }

  const w_vig = params?.spatialAndEdge?.edgeVignetteSoftness ?? 0.12;
  let vEdge = 1.0;
  if (w_vig > 0.0) {
    vEdge = smoothstep(0.0, w_vig, u) * smoothstep(0.0, w_vig, 1.0 - u) * smoothstep(0.0, w_vig, v) * smoothstep(0.0, w_vig, 1.0 - v);
  }

  let unvignettedAlpha = targetAlpha * cutoutMask * baseOpacityMult;
  if (spec.hasDarkSubjectFloor && isDarkSubjectFloorLifted && unvignettedAlpha < F_dark) {
    unvignettedAlpha = F_dark;
  }
  const finalAlpha = Math.min(Math.max(unvignettedAlpha * vEdge, 0.0), 1.0);

  return {
    cutoutMask,
    effectiveLuminance: effLum,
    sourceLuminance: srcLum,
    alpha: finalAlpha,
    unvignettedAlpha: Math.min(Math.max(unvignettedAlpha, 0.0), 1.0),
    vignetteFactor: vEdge,
    isStudioBackdropAttenuated,
    isSnakeScaleOrCounter,
    isDarkSubjectFloorLifted,
    borderRetained,
    redDominance: redDom,
    chroma,
    tagWeight,
  };
}

// ============================================================================
// 6. Steady-State Holographic Shader Engine (Ticket-003)
// ============================================================================
export function evaluateSteadyStateHologramOptics(timeSec, columnIndex = 1, params = {}, viewCosine = 1.0, uv = { u: 0.5, v: 0.5 }) {
  const p = deepCloneParams(params);
  const u = uv.u ?? uv.x ?? 0.5;
  const v = uv.v ?? uv.y ?? 0.5;

  const D_scan = p.scanlineAndGrid.scanlineDensity;
  const C_scan = p.scanlineAndGrid.scanlineContrast;
  const scanlineMod = 1.0 - C_scan * (0.5 - 0.5 * Math.cos(2.0 * Math.PI * v * D_scan - timeSec * 12.0));

  const W_band = p.scanlineAndGrid.rollingBandWidth;
  const V_band = p.scanlineAndGrid.rollingBandSpeed;
  const d_band = p.scanlineAndGrid.rollingBandDirection;
  const yb1 = ((v - d_band * timeSec * V_band) % 1.0 + 1.0) % 1.0;
  const yb2 = ((v - d_band * timeSec * V_band * 0.57 + 0.43) % 1.0 + 1.0) % 1.0;
  const rollBand = 1.0 + 0.22 * Math.exp(-Math.pow((yb1 - 0.5) / W_band, 2.0))
                       + 0.12 * Math.exp(-Math.pow((yb2 - 0.5) / (W_band * 1.35), 2.0));

  const phi = (columnIndex || 1) * 1.6180339;
  const microFlicker = 1.0 + 0.032 * Math.sin(2.0 * Math.PI * 9.4 * timeSec + phi)
                           + 0.021 * Math.cos(2.0 * Math.PI * 17.8 * timeSec + 2.1 * phi)
                           + 0.014 * Math.sin(2.0 * Math.PI * 29.3 * timeSec + 0.7 * phi);

  const I_fresnel = p.spatialAndEdge.fresnelFadeIntensity;
  const mu = Math.min(Math.max(Math.abs(viewCosine), 0.0), 1.0);
  const fresnelEdgeGlow = Math.pow(1.0 - mu, 2.2) * I_fresnel;
  const fresnelAngleFade = (1.0 - 0.45 * I_fresnel) + 0.45 * I_fresnel * smoothstep(0.04, 0.35, mu);

  const G_grid = p.scanlineAndGrid.pixelGridVisibility;
  const sx = Math.sin(Math.PI * u * 160.0);
  const sy = Math.sin(Math.PI * v * 160.0);
  const pixelGridFactor = 1.0 - G_grid * 0.25 * (1.0 - sx * sx * sy * sy);

  const backFaceMode = p.spatialAndEdge.backFaceVisibility || 'dimmed';
  const backFaceOpacityMultiplier = resolveBackFaceOpacityMultiplier(backFaceMode);

  return {
    scanlineModulation: scanlineMod,
    rollingBandGain: rollBand,
    microFlickerGain: microFlicker,
    fresnelEdgeGlow,
    fresnelAngleFade,
    emissiveBloomFactor: p.colorAndLuminance.emissiveIntensity,
    pixelGridFactor,
    ghostPlaneDepthOffset: p.spatialAndEdge.ghostPlaneDepthOffset,
    ghostPlaneOpacity: p.spatialAndEdge.ghostPlaneOpacity,
    backFaceOpacityMultiplier,
    backFaceMode,
  };
}

// ============================================================================
// 7. Glitch & Signal Degradation Dynamics Engine (Ticket-004)
// ============================================================================
export function evaluateHologramGlitchDynamics(timeSec, columnIndex = 1, params = {}, lifecycleState = 'active', manualBurstState = null) {
  const p = deepCloneParams(params);
  let glitchMode = p.glitchCadence.glitchMode;
  if (lifecycleState === 'agitated') {
    glitchMode = 'agitated';
  }

  let glitchIntensity = 0.0;
  let isMacroBurst = false;
  let isMicroTwitch = false;

  if (glitchMode === 'off' && lifecycleState === 'active') {
    glitchIntensity = 0.0;
  } else if (glitchMode === 'manual') {
    if (manualBurstState && manualBurstState.active) {
      glitchIntensity = manualBurstState.intensity ?? 0.95;
      isMacroBurst = true;
    }
  } else if (glitchMode === 'agitated') {
    isMacroBurst = true;
    glitchIntensity = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(timeSec * 7.3 + columnIndex));
  } else {
    // Ambient mode
    const avgInterval = p.glitchCadence.averageBurstIntervalSec || 3.4;
    const durMin = p.glitchCadence.burstDurationMinSec || 0.16;
    const durMax = p.glitchCadence.burstDurationMaxSec || 0.42;
    const dur = 0.5 * (durMin + durMax);
    const cycle = ((timeSec + columnIndex * 1.73) % avgInterval + avgInterval) % avgInterval;
    if (cycle < dur) {
      isMacroBurst = true;
      const progress = cycle / dur;
      glitchIntensity = 0.70 + 0.30 * Math.sin(Math.PI * progress);
    } else {
      const tick = Math.floor(timeSec * 12.0);
      const hash = ((Math.sin(tick * 127.1 + columnIndex * 311.7) * 43758.5453) % 1.0 + 1.0) % 1.0;
      if (hash < (p.glitchCadence.microTwitchProbability || 0.14)) {
        isMicroTwitch = true;
        glitchIntensity = 0.15 + 0.17 * ((hash * 100.0) % 1.0);
      }
    }
  }

  if (lifecycleState === 'swapping') {
    isMacroBurst = true;
    glitchIntensity = Math.max(glitchIntensity, 0.92);
  }

  const G = glitchIntensity;
  let sliceDisplacementUvX = 0.0;
  let blockJitterUv = { x: 0.0, y: 0.0 };
  let vsyncSlipUvY = 0.0;
  let vsyncEdgeFade = 1.0;
  let chromaOffsetUv = { x: 0.0, y: 0.0 };
  let staticNoiseFactor = 0.0;
  let posterizeLevels = 64.0;
  let dropoutFactor = 1.0;
  let frameStutterState = { active: false, mode: 'none', anchorFrame: 0, jitterOffset: 0, displayedFrame: 0 };

  if (G > 0.001) {
    const maxSlice = p.glitchSeverity.maxSliceDisplacement;
    const sliceCount = p.glitchSeverity.sliceDensityCount;
    const sliceHash = Math.sin(Math.floor(0.5 * sliceCount) * 73.1 + Math.floor(timeSec * 28.0) * 31.7);
    sliceDisplacementUvX = G * maxSlice * Math.sign(sliceHash || 1.0);

    if (G > 0.35) {
      blockJitterUv = {
        x: G * 0.035 * Math.sin(timeSec * 37.0),
        y: G * 0.025 * Math.cos(timeSec * 41.0),
      };
    }

    if (G > 0.45) {
      vsyncSlipUvY = G * 0.14 * Math.sin(19.0 * timeSec);
      vsyncEdgeFade = Math.max(1.0 - Math.abs(vsyncSlipUvY) * 4.0, 0.15);
    }

    const d_chroma = p.glitchSeverity.chromaticAberrationDistance;
    const theta_chroma = p.glitchSeverity.chromaticAberrationAngleRad;
    const dist = G * d_chroma;
    chromaOffsetUv = {
      x: dist * Math.cos(theta_chroma),
      y: dist * Math.sin(theta_chroma),
    };

    staticNoiseFactor = G * p.glitchSeverity.staticNoiseIntensity;

    const Q_min = p.glitchSeverity.posterizationLevels;
    posterizeLevels = 64.0 - G * (64.0 - Q_min);

    if (G > 0.65) {
      const dropWindow = (timeSec * 30.0) % 45;
      if (dropWindow < 1.8 && p.glitchSeverity.dropoutFrequency > 0.1) {
        dropoutFactor = 0.05;
      }
    }

    if (G >= 0.55) {
      const anchor = Math.floor(timeSec * 24.0) % 145;
      const jitterSteps = [-2, -1, 0, 1, 2];
      const jIdx = Math.floor(timeSec * 12.0) % 5;
      frameStutterState = {
        active: true,
        mode: G > 0.8 ? 'window_jitter' : 'freeze',
        anchorFrame: anchor,
        jitterOffset: jitterSteps[jIdx],
        displayedFrame: (anchor + jitterSteps[jIdx] + 145) % 145,
      };
    }
  }

  return {
    glitchIntensity: G,
    isMacroBurst,
    isMicroTwitch,
    sliceDisplacementUvX,
    blockJitterUv,
    vsyncSlipUvY,
    vsyncEdgeFade,
    chromaOffsetUv,
    staticNoiseFactor,
    posterizeLevels,
    dropoutFactor,
    frameStutterState,
  };
}

// ============================================================================
// 8. Lifecycle State Machine & Envelope Evaluator (Ticket-005)
// ============================================================================
export function evaluateLifecycleStateEnvelope(lifecycleState, stateProgress = 1.0, params = {}) {
  const p = Math.min(Math.max(stateProgress, 0.0), 1.0);
  switch (lifecycleState) {
    case 'inactive':
      return {
        opacityMultiplier: 0.0,
        materializeLineExpansion: 0.0,
        materializeSurge: 1.0,
        glitchBoost: 0.0,
        isVisible: false,
        stage: 'inactive',
      };
    case 'materializing': {
      if (p <= 0.22) {
        const t = p / 0.22;
        return {
          opacityMultiplier: 0.85 * t,
          materializeLineExpansion: 0.01 + 0.02 * t,
          materializeSurge: 1.65,
          glitchBoost: 0.40,
          isVisible: true,
          stage: 'line_snap',
        };
      } else if (p <= 0.76) {
        const t = (p - 0.22) / (0.76 - 0.22);
        return {
          opacityMultiplier: 0.85 + 0.15 * t,
          materializeLineExpansion: 0.03 + 0.97 * (t * t * (3.0 - 2.0 * t)),
          materializeSurge: 1.65 + 0.20 * t,
          glitchBoost: 0.88,
          isVisible: true,
          stage: 'rapid_expansion',
        };
      } else {
        const t = (p - 0.76) / (1.00 - 0.76);
        return {
          opacityMultiplier: 1.0,
          materializeLineExpansion: 1.0,
          materializeSurge: 1.85 - 0.85 * t,
          glitchBoost: 0.88 * (1.0 - t),
          isVisible: true,
          stage: 'surge_stabilization',
        };
      }
    }
    case 'active':
      return {
        opacityMultiplier: 1.0,
        materializeLineExpansion: 1.0,
        materializeSurge: 1.0,
        glitchBoost: 0.0,
        isVisible: true,
        stage: 'active',
      };
    case 'agitated':
      return {
        opacityMultiplier: 1.0,
        materializeLineExpansion: 1.0,
        materializeSurge: 1.15,
        glitchBoost: 0.75,
        isVisible: true,
        stage: 'agitated',
      };
    case 'swapping': {
      if (p < 0.50) {
        const t = p / 0.50;
        return {
          opacityMultiplier: 1.0,
          materializeLineExpansion: 1.0,
          materializeSurge: 1.0 + 0.35 * t,
          glitchBoost: 0.50 + 0.50 * t,
          isVisible: true,
          stage: 'mask_pre',
        };
      } else {
        const t = (p - 0.50) / 0.50;
        return {
          opacityMultiplier: 1.0,
          materializeLineExpansion: 1.0,
          materializeSurge: 1.35 - 0.35 * t,
          glitchBoost: 1.0 * (1.0 - t),
          isVisible: true,
          stage: 'mask_post',
        };
      }
    }
    case 'dematerializing':
      return {
        opacityMultiplier: Math.max(1.0 - p, 0.0),
        materializeLineExpansion: Math.max(1.0 - p, 0.0),
        materializeSurge: 1.30 * (1.0 - p),
        glitchBoost: 0.85,
        isVisible: true,
        stage: 'collapse',
      };
    default:
      return {
        opacityMultiplier: 1.0,
        materializeLineExpansion: 1.0,
        materializeSurge: 1.0,
        glitchBoost: 0.0,
        isVisible: true,
        stage: 'nominal',
      };
  }
}

// ============================================================================
// 9. Custom GLSL Shader Material Construction (Tickets 002, 003, 004)
// ============================================================================
const HOLO_COLUMN_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const HOLO_COLUMN_FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform sampler2D uNextMap;
uniform float uTime;
uniform float uAspectRatio;
uniform float uNextAspectRatio;
uniform float uViewportAspect;
uniform float uSlideOffset;
uniform int uSlideCount;
uniform int uActiveSlideIndex;
uniform int uNextSlideIndex;
uniform int uHoverChevronSide;
uniform float uIsVideo;
uniform float uBypassExteriorCutout;
uniform float uHasDarkSubjectFloor;
uniform float uDarkSubjectFloorAlpha;
uniform float uIsHighKeyStudioBackdrop;
uniform int uStudioBackdropMode;
uniform vec3 uPrimaryTint;
uniform vec3 uSecondaryTint;
uniform float uColorRemapWeight;
uniform float uBaseOpacity;
uniform float uEmissiveIntensity;
uniform float uBlackLevelThreshold;
uniform float uScanlineDensity;
uniform float uScanlineContrast;
uniform float uRollingBandWidth;
uniform float uRollingBandSpeed;
uniform float uRollingBandDirection;
uniform float uPixelGridVisibility;
uniform float uEdgeVignetteSoftness;
uniform float uFresnelIntensity;
uniform int uBackFaceMode;
uniform float uIsGhostPlane;
uniform float uGhostOpacity;
uniform int uLifecycleState;
uniform float uLifecycleProgress;
uniform float uMaterializeLineExpansion;
uniform float uMaterializeSurge;
uniform float uGlitchIntensity;
uniform float uSliceDisplacementMax;
uniform float uSliceCount;
uniform float uBlockJitterAmount;
uniform float uVsyncSlipOffset;
uniform float uVsyncEdgeFade;
uniform float uChromaSplitDist;
uniform float uChromaSplitAngle;
uniform float uStaticNoiseIntensity;
uniform float uPosterizeLevels;
uniform float uDropoutFactor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

float pseudoRandom(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 containSlideUv(vec2 inUv, float slideAspect, float frameAspect, out float inBoundsMask) {
  if (uSlideCount <= 1 || abs(slideAspect - frameAspect) < 0.025) {
    inBoundsMask = 1.0;
    return clamp(inUv, 0.0, 1.0);
  }
  vec2 centered = inUv - 0.5;
  float ratio = slideAspect / max(frameAspect, 0.001);
  if (ratio > 1.0) {
    centered.y *= ratio;
  } else {
    centered.x /= max(ratio, 0.001);
  }
  vec2 outUv = centered + 0.5;
  float bx = smoothstep(0.0, 0.012, outUv.x) * smoothstep(0.0, 0.012, 1.0 - outUv.x);
  float by = smoothstep(0.0, 0.012, outUv.y) * smoothstep(0.0, 0.012, 1.0 - outUv.y);
  inBoundsMask = bx * by;
  return clamp(outUv, 0.0, 1.0);
}

void main() {
  vec2 baseUv = vUv;
  float backFaceMult = 1.0;
  if (!gl_FrontFacing) {
    if (uBackFaceMode == 1) {
      discard;
    } else if (uBackFaceMode == 2) {
      baseUv.x = 1.0 - baseUv.x;
      backFaceMult = 0.85;
    } else {
      baseUv.x = 1.0 - baseUv.x;
      backFaceMult = (uSlideCount > 1) ? 0.92 : 0.42;
    }
  }

  vec2 uv = baseUv;
  float swipeMotionAmt = abs(uSlideOffset);
  float effGlitch = clamp(uGlitchIntensity + swipeMotionAmt * (1.0 - swipeMotionAmt) * 0.85, 0.0, 1.0);

  // Glitch: Horizontal Slice Tearing
  if (effGlitch > 0.001) {
    float sliceBand = floor(uv.y * uSliceCount);
    float sliceTime = floor(uTime * 24.0);
    float sliceHash = sin(sliceBand * 73.1 + sliceTime * 31.7);
    if (abs(sliceHash) > 0.45) {
      float shiftDir = sign(sliceHash);
      uv.x += shiftDir * effGlitch * uSliceDisplacementMax * abs(sliceHash);
    }
    // Block jitter
    if (effGlitch > 0.35 && uBlockJitterAmount > 0.001) {
      vec2 blockCoord = floor(uv * 12.0);
      float bHash = pseudoRandom(blockCoord + floor(uTime * 18.0));
      if (bHash < 0.22 * effGlitch) {
        uv += (vec2(bHash, fract(bHash * 10.0)) - 0.5) * uBlockJitterAmount;
      }
    }
    // VSync slippage
    if (abs(uVsyncSlipOffset) > 0.0001) {
      uv.y = fract(uv.y + uVsyncSlipOffset);
    }
  }

  // Materialization Center-Line Expansion Mask (§5.2)
  if (uMaterializeLineExpansion < 0.999) {
    float distFromCenter = abs(uv.y - 0.5);
    if (distFromCenter > uMaterializeLineExpansion * 0.5) {
      discard;
    }
  }

  // Edge Vignetting (§2.5) on post-distortion UV
  float vEdge = 1.0;
  if (uEdgeVignetteSoftness > 0.001) {
    float vx = smoothstep(0.0, uEdgeVignetteSoftness, baseUv.x) * smoothstep(0.0, uEdgeVignetteSoftness, 1.0 - baseUv.x);
    float vy = smoothstep(0.0, uEdgeVignetteSoftness, baseUv.y) * smoothstep(0.0, uEdgeVignetteSoftness, 1.0 - baseUv.y);
    vEdge = clamp(vx * vy, 0.0, 1.0);
  }

  // Chromatic Aberration Channel Splitting (§4.2)
  vec2 chromaDelta = vec2(0.0);
  if (effGlitch > 0.001 || uChromaSplitDist > 0.001) {
    float rEdge = smoothstep(0.25, 0.50, max(abs(uv.x - 0.5), abs(uv.y - 0.5))) * 0.0025;
    float cDist = rEdge + effGlitch * uChromaSplitDist + swipeMotionAmt * 0.008;
    chromaDelta = cDist * vec2(cos(uChromaSplitAngle), sin(uChromaSplitAngle));
  }

  // Dual-Texture Horizontal Carousel Slide Sampling
  vec3 srcRgb = vec3(0.0);
  float slideBoundsMask = 1.0;
  float seamGlow = 0.0;

  if (abs(uSlideOffset) > 0.0005 && uSlideCount > 1) {
    if (uSlideOffset < 0.0) {
      // Swiping left -> advancing toward uNextMap entering from right
      float seamX = 1.0 + uSlideOffset;
      seamGlow = exp(-pow((uv.x - seamX) / 0.012, 2.0));
      if (uv.x < seamX) {
        vec2 curSlideUv = vec2(uv.x - uSlideOffset, uv.y);
        vec2 mappedUv = containSlideUv(curSlideUv, uAspectRatio, uViewportAspect, slideBoundsMask);
        vec4 colR = texture2D(uMap, mappedUv + chromaDelta);
        vec4 colG = texture2D(uMap, mappedUv);
        vec4 colB = texture2D(uMap, mappedUv - chromaDelta);
        srcRgb = vec3(colR.r, colG.g, colB.b);
      } else {
        vec2 nextSlideUv = vec2(uv.x - seamX, uv.y);
        vec2 mappedUv = containSlideUv(nextSlideUv, uNextAspectRatio, uViewportAspect, slideBoundsMask);
        vec4 colR = texture2D(uNextMap, mappedUv + chromaDelta);
        vec4 colG = texture2D(uNextMap, mappedUv);
        vec4 colB = texture2D(uNextMap, mappedUv - chromaDelta);
        srcRgb = vec3(colR.r, colG.g, colB.b);
      }
    } else {
      // Swiping right -> returning toward uNextMap entering from left
      float seamX = uSlideOffset;
      seamGlow = exp(-pow((uv.x - seamX) / 0.012, 2.0));
      if (uv.x >= seamX) {
        vec2 curSlideUv = vec2(uv.x - uSlideOffset, uv.y);
        vec2 mappedUv = containSlideUv(curSlideUv, uAspectRatio, uViewportAspect, slideBoundsMask);
        vec4 colR = texture2D(uMap, mappedUv + chromaDelta);
        vec4 colG = texture2D(uMap, mappedUv);
        vec4 colB = texture2D(uMap, mappedUv - chromaDelta);
        srcRgb = vec3(colR.r, colG.g, colB.b);
      } else {
        vec2 nextSlideUv = vec2(uv.x + (1.0 - seamX), uv.y);
        vec2 mappedUv = containSlideUv(nextSlideUv, uNextAspectRatio, uViewportAspect, slideBoundsMask);
        vec4 colR = texture2D(uNextMap, mappedUv + chromaDelta);
        vec4 colG = texture2D(uNextMap, mappedUv);
        vec4 colB = texture2D(uNextMap, mappedUv - chromaDelta);
        srcRgb = vec3(colR.r, colG.g, colB.b);
      }
    }
  } else {
    vec2 mappedUv = containSlideUv(uv, uAspectRatio, uViewportAspect, slideBoundsMask);
    vec4 colR = texture2D(uMap, mappedUv + chromaDelta);
    vec4 colG = texture2D(uMap, mappedUv);
    vec4 colB = texture2D(uMap, mappedUv - chromaDelta);
    srcRgb = vec3(colR.r, colG.g, colB.b);
  }

  // Faint holographic grid backing in letterbox/pillarbox margins of contained slides
  srcRgb = mix(uSecondaryTint * 0.35, srcRgb, slideBoundsMask);

  float srcLum = 0.2126 * srcRgb.r + 0.7152 * srcRgb.g + 0.0722 * srcRgb.b;
  float chroma = max(srcRgb.r, max(srcRgb.g, srcRgb.b)) - min(srcRgb.r, min(srcRgb.g, srcRgb.b));
  float redDom = srcRgb.r - 0.5 * (srcRgb.g + srcRgb.b);

  // Pre-processing & Cutout logic
  float cutoutMask = 1.0;
  float effLum = srcLum;
  float tagWeight = (redDom >= 0.12) ? 0.85 : 0.0;

  if (uIsHighKeyStudioBackdrop > 0.5) {
    if (uStudioBackdropMode == 1) {
      bool isWall = (srcLum >= 0.72 && srcLum <= 0.885 && chroma < 0.045 && redDom < 0.06);
      bool isSnake = (srcLum >= 0.88);
      if (isWall) {
        float t = (srcLum - 0.72) / (0.885 - 0.72);
        effLum = 0.34 + t * 0.10;
      } else if (isSnake) {
        float t = clamp((srcLum - 0.88) / 0.12, 0.0, 1.0);
        effLum = 0.86 + t * 0.12;
      }
    } else if (uStudioBackdropMode == 2) {
      vec2 elPos = (uv - vec2(0.50, 0.52)) / vec2(0.31, 0.43);
      bool outside = (dot(elPos, elPos) > 1.0);
      bool achromatic = (chroma < 0.042 && redDom < 0.05);
      bool wallLum = (srcLum >= 0.72 && srcLum <= 0.885);
      bool notTag = (redDom < 0.08);
      if (outside && achromatic && wallLum && notTag) {
        cutoutMask = 0.08;
      }
    }
  }

  // Luminance to Opacity Mapping & Dark-Subject Floor
  float alphaLum = smoothstep(uBlackLevelThreshold, 0.92, effLum);
  float targetAlpha = (alphaLum + tagWeight * 0.25) * mix(0.28, 1.0, slideBoundsMask);

  if (uHasDarkSubjectFloor > 0.5) {
    if (targetAlpha < uDarkSubjectFloorAlpha) {
      targetAlpha = uDarkSubjectFloorAlpha;
    }
    bool isInterior = (uv.x >= 0.08 && uv.x <= 0.92 && uv.y >= 0.08 && uv.y <= 0.92);
    if (isInterior && effLum < 0.15) {
      targetAlpha += 0.04;
    }
  }

  // Steady-state: Spectral Color Remapping
  vec3 holoCore = mix(uSecondaryTint, uPrimaryTint, smoothstep(0.05, 0.72, effLum));
  vec3 holoHi = vec3(1.0, 0.98, 0.88);
  vec3 holoColor = holoCore + holoHi * smoothstep(0.72, 1.0, effLum) * 0.45;
  vec3 mappedRgb = mix(srcRgb, holoColor, uColorRemapWeight);

  // Scanlines
  float scanlineMod = 1.0 - uScanlineContrast * (0.5 - 0.5 * cos(6.2831853 * uv.y * uScanlineDensity - uTime * 12.0));

  // Pixel grid / dot-matrix
  float gridMod = 1.0;
  if (uPixelGridVisibility > 0.001) {
    float sx = sin(3.14159265 * uv.x * 160.0);
    float sy = sin(3.14159265 * uv.y * 160.0);
    gridMod = 1.0 - uPixelGridVisibility * 0.25 * (1.0 - sx * sx * sy * sy);
  }

  // Rolling Interference Bands
  float yb1 = fract(uv.y - uRollingBandDirection * uTime * uRollingBandSpeed);
  float yb2 = fract(uv.y - uRollingBandDirection * uTime * uRollingBandSpeed * 0.57 + 0.43);
  float rollBand = 1.0 + 0.22 * exp(-pow((yb1 - 0.5) / uRollingBandWidth, 2.0))
                       + 0.12 * exp(-pow((yb2 - 0.5) / (uRollingBandWidth * 1.35), 2.0));

  // Micro-flicker
  float microFlicker = 1.0 + 0.032 * sin(6.2831853 * 9.4 * uTime)
                           + 0.021 * cos(6.2831853 * 17.8 * uTime)
                           + 0.014 * sin(6.2831853 * 29.3 * uTime);

  // Viewing-angle Fresnel sensitivity
  vec3 viewDir = normalize(vViewPosition);
  float mu = clamp(abs(dot(viewDir, normalize(vNormal))), 0.0, 1.0);
  float fresnelGlow = pow(1.0 - mu, 2.2) * uFresnelIntensity;
  float fresnelFade = mix(1.0, smoothstep(0.04, 0.35, mu), 0.45 * uFresnelIntensity);

  // Emissive Bloom
  vec3 emissiveRgb = mappedRgb * uEmissiveIntensity + uPrimaryTint * smoothstep(0.58, 0.95, effLum) * 0.38 * uEmissiveIntensity;
  vec3 finalRgb = emissiveRgb * scanlineMod * gridMod * rollBand * microFlicker + holoHi * fresnelGlow;

  // Add glowing vertical laser seam during horizontal slide transition
  if (seamGlow > 0.001) {
    finalRgb += mix(uPrimaryTint, vec3(1.0), 0.65) * seamGlow * 1.65;
    targetAlpha = max(targetAlpha, seamGlow * 0.95);
  }

  // Diegetic Carousel Pagination Pips & Left/Right Swipe Chevrons (for multi-slide columns)
  if (uSlideCount > 1 && uIsGhostPlane < 0.5) {
    // 1. Bottom Pagination Pips (up to 12 slides)
    float pipSpacing = min(0.068, 0.62 / float(uSlideCount));
    float totalSpan = pipSpacing * float(uSlideCount - 1);
    float pipY = 0.042;
    for (int k = 0; k < 12; k++) {
      if (k >= uSlideCount) break;
      float pipX = 0.5 - 0.5 * totalSpan + float(k) * pipSpacing;
      bool isCurrent = (k == uActiveSlideIndex);
      float halfW = isCurrent ? 0.019 : 0.0075;
      float halfH = isCurrent ? 0.0055 : 0.0042;
      vec2 dPip = abs(baseUv - vec2(pipX, pipY)) - vec2(halfW, halfH);
      float distPip = length(max(dPip, 0.0)) + min(max(dPip.x, dPip.y), 0.0);
      float pipMask = 1.0 - smoothstep(0.0, 0.0035, distPip);
      if (pipMask > 0.01) {
        vec3 pipCol = isCurrent ? mix(uPrimaryTint, vec3(1.0), 0.72) : uPrimaryTint * 0.55;
        finalRgb = mix(finalRgb, pipCol * 1.85, pipMask);
        targetAlpha = max(targetAlpha, pipMask * (isCurrent ? 0.98 : 0.65));
      }
    }

    // 2. Left (<) & Right (>) Swipe Chevrons near vertical midpoint
    float chevY = abs(baseUv.y - 0.5);
    if (chevY < 0.055) {
      // Left chevron '<' centered at x = 0.045
      float lx = baseUv.x - 0.032;
      if (lx >= 0.0 && lx <= 0.028) {
        float armDistL = abs(chevY - lx * 1.55);
        float lMask = 1.0 - smoothstep(0.0025, 0.0065, armDistL);
        if (lMask > 0.01) {
          float lBoost = (uHoverChevronSide == -1 || uSlideOffset > 0.02) ? 2.1 : 1.15;
          finalRgb = mix(finalRgb, mix(uPrimaryTint, vec3(1.0), 0.55) * lBoost, lMask * 0.85);
          targetAlpha = max(targetAlpha, lMask * 0.88);
        }
      }
      // Right chevron '>' centered at x = 0.955
      float rx = 0.968 - baseUv.x;
      if (rx >= 0.0 && rx <= 0.028) {
        float armDistR = abs(chevY - rx * 1.55);
        float rMask = 1.0 - smoothstep(0.0025, 0.0065, armDistR);
        if (rMask > 0.01) {
          float rBoost = (uHoverChevronSide == 1 || uSlideOffset < -0.02) ? 2.1 : 1.15;
          finalRgb = mix(finalRgb, mix(uPrimaryTint, vec3(1.0), 0.55) * rBoost, rMask * 0.85);
          targetAlpha = max(targetAlpha, rMask * 0.88);
        }
      }
    }
  }

  // Glitch Static & White Noise Injection
  if (effGlitch > 0.001 && uStaticNoiseIntensity > 0.001) {
    float noise = pseudoRandom(uv + fract(uTime * 17.0));
    finalRgb = mix(finalRgb, vec3(noise), effGlitch * uStaticNoiseIntensity * 0.45);
  }

  // Glitch Posterization / Bit-depth reduction
  if (effGlitch > 0.30 && uPosterizeLevels < 63.0) {
    finalRgb = floor(finalRgb * uPosterizeLevels + 0.5) / uPosterizeLevels;
  }

  // Alpha composition
  float finalAlpha = targetAlpha * cutoutMask * uBaseOpacity * vEdge * fresnelFade * uVsyncEdgeFade * backFaceMult;
  finalAlpha *= uDropoutFactor;

  if (uIsGhostPlane > 0.5) {
    finalAlpha *= uGhostOpacity;
  }

  // Materialization / Lifecycle Surge
  finalRgb *= uMaterializeSurge;

  gl_FragColor = vec4(clamp(finalRgb, 0.0, 2.0), clamp(finalAlpha, 0.0, 1.0));
}
`;

export function createHologramColumnShaderMaterial(assetSpec, texture, params = {}, uTimeUniform = null, applyStencilReject = null, isGhostPlane = false) {
  const spec = resolveHoloMediaSpec(assetSpec.id || assetSpec);
  const p = deepCloneParams(params);
  const tint = HOLO_SPECTRAL_TINT_PRESETS[spec.defaultTintPreset] || HOLO_SPECTRAL_TINT_PRESETS.cyan;
  const fallbackTex = texture || createDeterministicPlaceholderTexture(spec);
  const slideCount = Array.isArray(spec.slides) && spec.slides.length > 0 ? spec.slides.length : 1;

  const uniforms = {
    uMap: { value: fallbackTex },
    uNextMap: { value: fallbackTex },
    uTime: uTimeUniform || { value: 0.0 },
    uAspectRatio: { value: spec.aspectRatio },
    uNextAspectRatio: { value: spec.aspectRatio },
    uViewportAspect: { value: spec.aspectRatio },
    uSlideOffset: { value: 0.0 },
    uSlideCount: { value: slideCount },
    uActiveSlideIndex: { value: 0 },
    uNextSlideIndex: { value: 0 },
    uHoverChevronSide: { value: 0 },
    uIsVideo: { value: spec.mediaType === 'video' ? 1.0 : 0.0 },
    uBypassExteriorCutout: { value: spec.bypassExteriorCutout ? 1.0 : 0.0 },
    uHasDarkSubjectFloor: { value: spec.hasDarkSubjectFloor ? 1.0 : 0.0 },
    uDarkSubjectFloorAlpha: { value: spec.darkSubjectFloorMinAlpha || 0.28 },
    uIsHighKeyStudioBackdrop: { value: spec.isHighKeyStudioBackdrop ? 1.0 : 0.0 },
    uStudioBackdropMode: { value: spec.studioBackdropMode === 'backdrop_keyed_white_scale_preserved' ? 2 : 1 },
    uPrimaryTint: { value: new THREE.Color(tint.primaryHex) },
    uSecondaryTint: { value: new THREE.Color(tint.secondaryHex) },
    uColorRemapWeight: { value: p.colorAndLuminance.colorRemapWeight },
    uBaseOpacity: { value: p.colorAndLuminance.baseOpacityMultiplier },
    uEmissiveIntensity: { value: p.colorAndLuminance.emissiveIntensity },
    uBlackLevelThreshold: { value: p.colorAndLuminance.blackLevelThreshold },
    uScanlineDensity: { value: p.scanlineAndGrid.scanlineDensity },
    uScanlineContrast: { value: p.scanlineAndGrid.scanlineContrast },
    uRollingBandWidth: { value: p.scanlineAndGrid.rollingBandWidth },
    uRollingBandSpeed: { value: p.scanlineAndGrid.rollingBandSpeed },
    uRollingBandDirection: { value: p.scanlineAndGrid.rollingBandDirection },
    uPixelGridVisibility: { value: p.scanlineAndGrid.pixelGridVisibility },
    uEdgeVignetteSoftness: { value: p.spatialAndEdge.edgeVignetteSoftness },
    uFresnelIntensity: { value: p.spatialAndEdge.fresnelFadeIntensity },
    uBackFaceMode: { value: resolveBackFaceModeCode(p.spatialAndEdge.backFaceVisibility) },
    uIsGhostPlane: { value: isGhostPlane ? 1.0 : 0.0 },
    uGhostOpacity: { value: p.spatialAndEdge.ghostPlaneOpacity },
    uLifecycleState: { value: 2 },
    uLifecycleProgress: { value: 1.0 },
    uMaterializeLineExpansion: { value: 1.0 },
    uMaterializeSurge: { value: 1.0 },
    uGlitchIntensity: { value: 0.0 },
    uSliceDisplacementMax: { value: p.glitchSeverity.maxSliceDisplacement },
    uSliceCount: { value: p.glitchSeverity.sliceDensityCount },
    uBlockJitterAmount: { value: 0.0 },
    uVsyncSlipOffset: { value: 0.0 },
    uVsyncEdgeFade: { value: 1.0 },
    uChromaSplitDist: { value: p.glitchSeverity.chromaticAberrationDistance },
    uChromaSplitAngle: { value: p.glitchSeverity.chromaticAberrationAngleRad },
    uStaticNoiseIntensity: { value: p.glitchSeverity.staticNoiseIntensity },
    uPosterizeLevels: { value: p.glitchSeverity.posterizationLevels },
    uDropoutFactor: { value: 1.0 },
  };

  const useNormalBlend = spec.blendMode === 'normal' || (!isGhostPlane && p.colorAndLuminance.colorRemapWeight === 0.0);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: HOLO_COLUMN_VERTEX_SHADER,
    fragmentShader: HOLO_COLUMN_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: p.spatialAndEdge.backFaceVisibility === 'culled' ? THREE.FrontSide : THREE.DoubleSide,
    blending: useNormalBlend ? THREE.NormalBlending : THREE.AdditiveBlending,
  });

  if (typeof applyStencilReject === 'function') {
    applyStencilReject(mat);
  }

  return mat;
}

// ============================================================================
// 10. Hologram Column Instance Implementation (Ticket-005)
// ============================================================================
export class HologramColumnInstance {
  constructor(assetSpec, options = {}) {
    this.assetSpec = resolveHoloMediaSpec(assetSpec.id || assetSpec);
    this.spec = this.assetSpec;
    this.options = options;
    this.floorY = options.floorY ?? 0.0;
    this.uTimeUniform = options.uTimeUniform || { value: 0.0 };
    this.applyStencilReject = options.applyStencilReject || null;

    this.id = this.assetSpec.id;
    this.code = this.assetSpec.code;
    this.index = this.assetSpec.index;
    this.mediaType = this.assetSpec.mediaType;

    this.params = deepCloneParams(options.params || {});
    // apply asset's spec defaults
    if (this.assetSpec.defaultTintPreset && HOLO_SPECTRAL_TINT_PRESETS[this.assetSpec.defaultTintPreset]) {
      const t = HOLO_SPECTRAL_TINT_PRESETS[this.assetSpec.defaultTintPreset];
      this.params.colorAndLuminance.primaryTintHex = t.primaryHex;
      this.params.colorAndLuminance.secondaryTintHex = t.secondaryHex;
      if (typeof t.colorRemapWeight === 'number') {
        this.params.colorAndLuminance.colorRemapWeight = t.colorRemapWeight;
      }
    }
    if (typeof this.assetSpec.colorRemapWeight === 'number') {
      this.params.colorAndLuminance.colorRemapWeight = this.assetSpec.colorRemapWeight;
    }
    if (typeof this.assetSpec.emissiveIntensity === 'number') {
      this.params.colorAndLuminance.emissiveIntensity = this.assetSpec.emissiveIntensity;
    }
    if (typeof this.assetSpec.baseOpacityMultiplier === 'number') {
      this.params.colorAndLuminance.baseOpacityMultiplier = this.assetSpec.baseOpacityMultiplier;
    }
    if (this.assetSpec.hasDarkSubjectFloor) {
      this.params.colorAndLuminance.darkSubjectFloorMinAlpha = this.assetSpec.darkSubjectFloorMinAlpha;
    }
    if (this.assetSpec.isCarousel) {
      this.params.colorAndLuminance.colorRemapWeight = 0.32;
      this.params.colorAndLuminance.emissiveIntensity = 1.72;
      this.params.colorAndLuminance.baseOpacityMultiplier = 0.98;
    }

    this.lifecycleState = options.initialState || 'active';
    this.lifecycleProgress = (this.lifecycleState === 'active' || this.lifecycleState === 'agitated') ? 1.0 : 0.0;
    this.stateElapsedSec = 0.0;
    this.targetStateDuration = 1.0;
    this.pendingSwapSpec = null;
    this.swapExecuted = false;

    this.manualBurstState = {
      active: false,
      intensity: 0.0,
      durationSec: 0.0,
      elapsedSec: 0.0,
    };

    // Staging Group
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = `HoloColumnGroup_${this.id}`;
    this.rootGroup.userData = { id: this.id, code: this.code, index: this.index, assetSpec: this.assetSpec };
    const cp = this.assetSpec.corridorPlacement;
    const defaultScale = cp.scale ?? 1.0;
    this.defaultPlacement = Object.freeze({
      x: cp.x,
      yRel: cp.yRel,
      z: cp.z,
      yawRad: cp.yawRad ?? 0.0,
      pitchRad: cp.pitchRad ?? 0.0,
      rollRad: cp.rollRad ?? 0.0,
      scale: defaultScale,
      scaleX: cp.scaleX ?? defaultScale,
      scaleY: cp.scaleY ?? defaultScale,
      scaleZ: cp.scaleZ ?? 1.0,
    });
    this.rootGroup.position.set(
      this.defaultPlacement.x,
      this.floorY + this.defaultPlacement.yRel,
      this.defaultPlacement.z
    );
    this.rootGroup.rotation.order = 'YXZ';
    this.rootGroup.rotation.set(
      this.defaultPlacement.pitchRad,
      this.defaultPlacement.yawRad,
      this.defaultPlacement.rollRad
    );
    this.rootGroup.scale.set(
      this.defaultPlacement.scaleX,
      this.defaultPlacement.scaleY,
      this.defaultPlacement.scaleZ
    );

    // Geometry
    this.geoSpec = computeHologramColumnGeometrySpec(this.assetSpec);

    // Multi-Slide Carousel Deck Initialization
    this.slides = Array.isArray(this.assetSpec.slides) && this.assetSpec.slides.length > 0
      ? this.assetSpec.slides.map((s) => resolveHoloMediaSpec(s))
      : [this.assetSpec];
    this.isCarousel = Boolean(this.assetSpec.isCarousel || this.slides.length > 1);
    this.activeSlideIndex = 0;
    this.nextSlideIndex = 0;
    this.slideOffset = 0.0;
    this.slideTargetOffset = 0.0;
    this.slideTransitionState = 'idle'; // 'idle' | 'dragging' | 'settling-commit' | 'settling-cancel'
    this.swipeGesture = {
      active: false,
      startClientX: 0,
      startClientY: 0,
      lastClientX: 0,
      lastClientY: 0,
      lastTimestampMs: 0,
      velocityX: 0,
      maxTravelPx: 0,
      startUvX: 0.5,
      startUvY: 0.5,
    };
    this.slideControllers = new Map();

    // Media Texture Controller for Initial Active Slide (Slide 0)
    const initialSlideSpec = this.slides[0] || this.assetSpec;
    this.textureController = this.getOrCreateSlideController(0);
    this.videoController = this.textureController.type === 'video' || initialSlideSpec.mediaType === 'video'
      ? this.textureController
      : null;
    this.isScrollableDocument =
      this.textureController.type === 'scrollable_document' ||
      initialSlideSpec.mediaType === 'scrollable_document';
    this.allowDirectDrag = !this.isCarousel && !this.isScrollableDocument;
    this.documentController = this.isScrollableDocument ? this.textureController : null;
    this.docDragGesture = {
      active: false,
      startClientX: 0,
      startClientY: 0,
      lastClientY: 0,
      maxTravelPx: 0,
      startUvX: 0.5,
      startUvY: 0.5,
    };

    // Shader Materials
    this.primaryMaterial = createHologramColumnShaderMaterial(
      this.assetSpec,
      this.textureController.texture,
      this.params,
      this.uTimeUniform,
      this.applyStencilReject,
      false
    );
    this.ghostMaterial = createHologramColumnShaderMaterial(
      this.assetSpec,
      this.textureController.texture,
      this.params,
      this.uTimeUniform,
      this.applyStencilReject,
      true
    );
    this.material = this.primaryMaterial;
    this.syncCarouselUniforms();

    // Meshes
    this.primaryMesh = new THREE.Mesh(this.geoSpec.primaryGeometry, this.primaryMaterial);
    this.primaryMesh.name = `PrimaryPlane_${this.id}`;
    this.primaryMesh.userData = { holoColumnId: this.id, code: this.code, index: this.index };
    this.rootGroup.add(this.primaryMesh);

    this.ghostMesh = new THREE.Mesh(this.geoSpec.ghostGeometry, this.ghostMaterial);
    this.ghostMesh.name = `GhostPlane_${this.id}`;
    this.ghostMesh.position.z = -this.params.spatialAndEdge.ghostPlaneDepthOffset;
    this.ghostMesh.userData = { holoColumnId: this.id, code: this.code, index: this.index };
    this.rootGroup.add(this.ghostMesh);

    // Atmospheric Aura Mesh
    const auraGeom = new THREE.PlaneGeometry(this.geoSpec.planeWidth * 1.15, this.geoSpec.planeHeight * 1.15);
    const auraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.params.colorAndLuminance.primaryTintHex),
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.auraMesh = new THREE.Mesh(auraGeom, auraMat);
    this.auraMesh.name = `HoloColumnAuraMesh_${this.id}`;
    this.auraMesh.position.z = -0.08;
    this.auraMesh.userData = { holoColumnId: this.id, code: this.code, index: this.index };
    this.rootGroup.add(this.auraMesh);

    // Selection Outline Frame (visible when selected in Hologram Edit Mode)
    const borderEdges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(this.geoSpec.planeWidth, this.geoSpec.planeHeight));
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    this.selectionFrame = new THREE.LineSegments(borderEdges, borderMat);
    this.selectionFrame.name = `HoloColumnSelectionFrame_${this.id}`;
    this.selectionFrame.position.z = 0.012;
    this.selectionFrame.visible = false;
    this.selectionFrame.renderOrder = 999;
    this.rootGroup.add(this.selectionFrame);

    if (this.lifecycleState === 'inactive') {
      this.rootGroup.visible = false;
      if (this.videoController) this.videoController.pause();
    }
  }

  syncMaterialsUniform(uniformName, value) {
    for (const mat of [this.primaryMaterial, this.ghostMaterial]) {
      if (mat && mat.uniforms && mat.uniforms[uniformName]) {
        mat.uniforms[uniformName].value = value;
      }
    }
  }

  getOrCreateSlideController(slideIndex) {
    const count = this.slides.length;
    if (count === 0) return null;
    const normIdx = ((slideIndex % count) + count) % count;
    if (this.slideControllers.has(normIdx)) {
      return this.slideControllers.get(normIdx);
    }
    const slideSpec = this.slides[normIdx];
    const isCurrentlyActive = normIdx === this.activeSlideIndex || normIdx === this.nextSlideIndex;
    const ctrl = createHoloMediaTextureController(slideSpec, {
      playing: isCurrentlyActive && this.params.playback.playing,
      loop: this.params.playback.loop,
      playbackRate: this.params.playback.playbackRate,
      slideIndex: normIdx,
      totalSlides: count,
    });
    this.slideControllers.set(normIdx, ctrl);
    return ctrl;
  }

  enforceTwoSlotVideoWindow() {
    for (const [idx, ctrl] of this.slideControllers.entries()) {
      if (!ctrl || typeof ctrl.pause !== 'function') continue;
      const isSlotActive =
        idx === this.activeSlideIndex ||
        (this.slideTransitionState !== 'idle' && idx === this.nextSlideIndex);
      if (isSlotActive && this.lifecycleState !== 'inactive' && this.params.playback.playing) {
        if (!ctrl.playing) ctrl.play();
      } else {
        if (ctrl.playing) ctrl.pause();
      }
    }
  }

  syncCarouselUniforms() {
    const count = Math.max(1, this.slides.length);
    this.activeSlideIndex = ((this.activeSlideIndex % count) + count) % count;
    this.nextSlideIndex = ((this.nextSlideIndex % count) + count) % count;

    const curSlide = this.slides[this.activeSlideIndex] || this.assetSpec;
    const nextSlide = this.slides[this.nextSlideIndex] || curSlide;
    const curCtrl = this.getOrCreateSlideController(this.activeSlideIndex);
    const nextCtrl = this.getOrCreateSlideController(this.nextSlideIndex);

    this.textureController = curCtrl;
    this.videoController = curSlide.mediaType === 'video' ? curCtrl : null;

    if (curCtrl && curCtrl.texture) {
      this.syncMaterialsUniform('uMap', curCtrl.texture);
    }
    if (nextCtrl && nextCtrl.texture) {
      this.syncMaterialsUniform('uNextMap', nextCtrl.texture);
    }
    this.syncMaterialsUniform('uAspectRatio', curSlide.aspectRatio || this.assetSpec.aspectRatio || 1.0);
    this.syncMaterialsUniform('uNextAspectRatio', nextSlide.aspectRatio || curSlide.aspectRatio || 1.0);
    this.syncMaterialsUniform('uViewportAspect', this.geoSpec.aspectRatio || this.assetSpec.aspectRatio || 1.0);
    this.syncMaterialsUniform('uSlideCount', count);
    this.syncMaterialsUniform('uActiveSlideIndex', this.activeSlideIndex);
    this.syncMaterialsUniform('uNextSlideIndex', this.nextSlideIndex);
    this.syncMaterialsUniform('uSlideOffset', this.slideOffset);
    this.syncMaterialsUniform('uIsVideo', curSlide.mediaType === 'video' ? 1.0 : 0.0);

    if (curSlide.defaultTintPreset && HOLO_SPECTRAL_TINT_PRESETS[curSlide.defaultTintPreset]) {
      const tint = HOLO_SPECTRAL_TINT_PRESETS[curSlide.defaultTintPreset];
      const nextColorParams = {
        primaryTintHex: tint.primaryHex,
        secondaryTintHex: tint.secondaryHex,
      };
      if (typeof curSlide.colorRemapWeight === 'number') {
        nextColorParams.colorRemapWeight = curSlide.colorRemapWeight;
      } else if (typeof tint.colorRemapWeight === 'number') {
        nextColorParams.colorRemapWeight = tint.colorRemapWeight;
      }
      this.setParams({
        colorAndLuminance: nextColorParams,
      });
    }
    this.enforceTwoSlotVideoWindow();
  }

  prepareNeighborForOffset(offsetVal) {
    const count = this.slides.length;
    if (count <= 1) return;
    const targetNext =
      offsetVal < 0.0
        ? (this.activeSlideIndex + 1) % count
        : (this.activeSlideIndex - 1 + count) % count;
    if (targetNext !== this.nextSlideIndex) {
      this.nextSlideIndex = targetNext;
      const nextSlide = this.slides[this.nextSlideIndex];
      const nextCtrl = this.getOrCreateSlideController(this.nextSlideIndex);
      if (nextCtrl && nextCtrl.texture) {
        this.syncMaterialsUniform('uNextMap', nextCtrl.texture);
      }
      if (nextSlide) {
        this.syncMaterialsUniform('uNextAspectRatio', nextSlide.aspectRatio || 1.0);
      }
      this.syncMaterialsUniform('uNextSlideIndex', this.nextSlideIndex);
      this.enforceTwoSlotVideoWindow();
    }
  }

  setHoverUv(hitUv = null) {
    if (!hitUv || this.slides.length <= 1) {
      this.syncMaterialsUniform('uHoverChevronSide', 0);
      return 0;
    }
    let side = 0;
    if (hitUv.x < 0.22) side = -1;
    else if (hitUv.x > 0.78) side = 1;
    this.syncMaterialsUniform('uHoverChevronSide', side);
    return side;
  }

  beginSwipe(clientX, clientY, hitUv = null) {
    if (this.slides.length <= 1) return false;
    // If mid-settle, snap immediately before starting new drag
    if (this.slideTransitionState === 'settling-commit') {
      this.activeSlideIndex = this.nextSlideIndex;
      this.slideOffset = 0.0;
      this.slideTargetOffset = 0.0;
      this.slideTransitionState = 'idle';
      this.syncCarouselUniforms();
    } else if (this.slideTransitionState === 'settling-cancel') {
      this.slideOffset = 0.0;
      this.slideTargetOffset = 0.0;
      this.slideTransitionState = 'idle';
      this.syncCarouselUniforms();
    }

    this.slideTransitionState = 'dragging';
    this.swipeGesture.active = true;
    this.swipeGesture.startClientX = clientX;
    this.swipeGesture.startClientY = clientY;
    this.swipeGesture.lastClientX = clientX;
    this.swipeGesture.lastClientY = clientY;
    this.swipeGesture.lastTimestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.swipeGesture.velocityX = 0.0;
    this.swipeGesture.maxTravelPx = 0.0;
    this.swipeGesture.startUvX = hitUv ? hitUv.x : 0.5;
    this.swipeGesture.startUvY = hitUv ? hitUv.y : 0.5;
    this.triggerGlitchBurst({ intensity: 0.35, durationSec: 0.12 });
    return true;
  }

  updateSwipe(clientX, clientY, viewportWidthPx = 1280) {
    if (!this.swipeGesture.active || this.slides.length <= 1) return 0.0;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dtMs = Math.max(1.0, now - this.swipeGesture.lastTimestampMs);
    const stepDx = clientX - this.swipeGesture.lastClientX;
    this.swipeGesture.velocityX = stepDx / dtMs; // px/ms
    this.swipeGesture.lastClientX = clientX;
    this.swipeGesture.lastClientY = clientY;
    this.swipeGesture.lastTimestampMs = now;

    const totalDx = clientX - this.swipeGesture.startClientX;
    const totalDy = clientY - this.swipeGesture.startClientY;
    const travel = Math.hypot(totalDx, totalDy);
    if (travel > this.swipeGesture.maxTravelPx) {
      this.swipeGesture.maxTravelPx = travel;
    }

    const swipeSpanPx = Math.max(180.0, Math.min(420.0, viewportWidthPx * 0.28));
    const normOffset = Math.max(-0.98, Math.min(0.98, totalDx / swipeSpanPx));
    this.slideOffset = normOffset;
    if (Math.abs(normOffset) > 0.002) {
      this.prepareNeighborForOffset(normOffset);
    }
    this.syncMaterialsUniform('uSlideOffset', this.slideOffset);
    return this.slideOffset;
  }

  endSwipe(clientX, clientY) {
    if (!this.swipeGesture.active || this.slides.length <= 1) return false;
    this.swipeGesture.active = false;
    const totalDx = clientX - this.swipeGesture.startClientX;
    const travel = this.swipeGesture.maxTravelPx;
    const vx = this.swipeGesture.velocityX;

    // Clean click / tap on the hologram column:
    // Left 30% steps to prevSlide(), Right 70% steps to nextSlide()
    if (travel < 10.0) {
      if (this.swipeGesture.startUvX < 0.30) {
        return this.prevSlide();
      }
      return this.nextSlide();
    }

    const shouldCommit = Math.abs(this.slideOffset) >= 0.16 || Math.abs(vx) >= 0.38;
    if (shouldCommit && Math.abs(totalDx) > 6.0) {
      const dir = totalDx < 0 ? -1.0 : 1.0; // -1.0 = swipe left (next slide), +1.0 = swipe right (prev slide)
      this.prepareNeighborForOffset(dir);
      this.slideTargetOffset = dir;
      this.slideTransitionState = 'settling-commit';
      this.triggerGlitchBurst({ intensity: 0.72, durationSec: 0.22 });
      return true;
    } else {
      this.slideTargetOffset = 0.0;
      this.slideTransitionState = 'settling-cancel';
      return false;
    }
  }

  nextSlide() {
    const count = this.slides.length;
    if (count <= 1) return this.activeSlideIndex;
    if (this.slideTransitionState === 'settling-commit') {
      this.activeSlideIndex = this.nextSlideIndex;
    }
    this.nextSlideIndex = (this.activeSlideIndex + 1) % count;
    this.slideOffset = -0.04;
    this.prepareNeighborForOffset(-1.0);
    this.slideTargetOffset = -1.0;
    this.slideTransitionState = 'settling-commit';
    this.triggerGlitchBurst({ intensity: 0.72, durationSec: 0.22 });
    return this.nextSlideIndex;
  }

  prevSlide() {
    const count = this.slides.length;
    if (count <= 1) return this.activeSlideIndex;
    if (this.slideTransitionState === 'settling-commit') {
      this.activeSlideIndex = this.nextSlideIndex;
    }
    this.nextSlideIndex = (this.activeSlideIndex - 1 + count) % count;
    this.slideOffset = 0.04;
    this.prepareNeighborForOffset(1.0);
    this.slideTargetOffset = 1.0;
    this.slideTransitionState = 'settling-commit';
    this.triggerGlitchBurst({ intensity: 0.72, durationSec: 0.22 });
    return this.nextSlideIndex;
  }

  goToSlide(targetIdx, options = {}) {
    const count = this.slides.length;
    if (count <= 1) return 0;
    const normTarget = ((Math.round(targetIdx) % count) + count) % count;
    if (normTarget === this.activeSlideIndex && this.slideTransitionState === 'idle') {
      return this.activeSlideIndex;
    }
    if (options.immediate) {
      this.activeSlideIndex = normTarget;
      this.nextSlideIndex = normTarget;
      this.slideOffset = 0.0;
      this.slideTargetOffset = 0.0;
      this.slideTransitionState = 'idle';
      this.syncCarouselUniforms();
      return this.activeSlideIndex;
    }
    const dir = normTarget > this.activeSlideIndex ? -1.0 : 1.0;
    this.nextSlideIndex = normTarget;
    const nextSlide = this.slides[this.nextSlideIndex];
    const nextCtrl = this.getOrCreateSlideController(this.nextSlideIndex);
    if (nextCtrl && nextCtrl.texture) {
      this.syncMaterialsUniform('uNextMap', nextCtrl.texture);
    }
    if (nextSlide) {
      this.syncMaterialsUniform('uNextAspectRatio', nextSlide.aspectRatio || 1.0);
    }
    this.syncMaterialsUniform('uNextSlideIndex', this.nextSlideIndex);
    this.slideOffset = dir * 0.04;
    this.slideTargetOffset = dir;
    this.slideTransitionState = 'settling-commit';
    this.enforceTwoSlotVideoWindow();
    this.triggerGlitchBurst({ intensity: 0.72, durationSec: 0.22 });
    return this.nextSlideIndex;
  }

  addSlide(slideSpec, makeActive = true) {
    const resolved = resolveHoloMediaSpec({
      ...slideSpec,
      isCustomSlide: true,
    });
    this.slides.push(resolved);
    this.isCarousel = this.slides.length > 1;
    const addedIndex = this.slides.length - 1;
    this.getOrCreateSlideController(addedIndex);
    if (makeActive) {
      this.goToSlide(addedIndex);
    } else {
      this.syncCarouselUniforms();
    }
    return addedIndex;
  }

  setSlides(newSlides = []) {
    if (!Array.isArray(newSlides) || newSlides.length === 0) return false;
    for (const ctrl of this.slideControllers.values()) {
      if (ctrl && typeof ctrl.dispose === 'function') ctrl.dispose();
    }
    this.slideControllers.clear();
    this.slides = newSlides.map((s, idx) =>
      resolveHoloMediaSpec({
        ...s,
        index: idx + 1,
        isCustomSlide: true,
      })
    );
    this.isCarousel = this.slides.length > 1;
    this.activeSlideIndex = 0;
    this.nextSlideIndex = 0;
    this.slideOffset = 0.0;
    this.slideTargetOffset = 0.0;
    this.slideTransitionState = 'idle';
    this.syncCarouselUniforms();
    this.triggerGlitchBurst({ intensity: 0.85, durationSec: 0.28 });
    return true;
  }

  setParams(partialParams = {}) {
    if (!partialParams) return;
    if (partialParams.colorAndLuminance) {
      Object.assign(this.params.colorAndLuminance, partialParams.colorAndLuminance);
      const cl = partialParams.colorAndLuminance;
      if (cl.primaryTintHex) {
        this.primaryMaterial.uniforms.uPrimaryTint.value.set(cl.primaryTintHex);
        this.ghostMaterial.uniforms.uPrimaryTint.value.set(cl.primaryTintHex);
        if (this.auraMesh) {
          this.auraMesh.material.color.set(cl.primaryTintHex);
        }
      }
      if (cl.secondaryTintHex) {
        this.primaryMaterial.uniforms.uSecondaryTint.value.set(cl.secondaryTintHex);
        this.ghostMaterial.uniforms.uSecondaryTint.value.set(cl.secondaryTintHex);
      }
      if (cl.colorRemapWeight !== undefined) {
        this.syncMaterialsUniform('uColorRemapWeight', cl.colorRemapWeight);
        const useNormalBlend = this.assetSpec.blendMode === 'normal' || cl.colorRemapWeight === 0.0;
        const targetBlending = useNormalBlend ? THREE.NormalBlending : THREE.AdditiveBlending;
        if (this.primaryMaterial.blending !== targetBlending) {
          this.primaryMaterial.blending = targetBlending;
          this.primaryMaterial.needsUpdate = true;
        }
      }
      if (cl.baseOpacityMultiplier !== undefined) {
        this.syncMaterialsUniform('uBaseOpacity', cl.baseOpacityMultiplier);
      }
      if (cl.emissiveIntensity !== undefined) {
        this.syncMaterialsUniform('uEmissiveIntensity', cl.emissiveIntensity);
      }
      if (cl.blackLevelThreshold !== undefined) {
        this.syncMaterialsUniform('uBlackLevelThreshold', cl.blackLevelThreshold);
      }
      if (cl.darkSubjectFloorMinAlpha !== undefined) {
        this.syncMaterialsUniform('uDarkSubjectFloorAlpha', cl.darkSubjectFloorMinAlpha);
      }
      if (cl.studioBackdropMode !== undefined) {
        const modeVal = cl.studioBackdropMode === 'backdrop_keyed_white_scale_preserved' ? 2 : 1;
        this.syncMaterialsUniform('uStudioBackdropMode', modeVal);
      }
    }
    if (partialParams.scanlineAndGrid) {
      Object.assign(this.params.scanlineAndGrid, partialParams.scanlineAndGrid);
      const sg = this.params.scanlineAndGrid;
      this.syncMaterialsUniform('uScanlineDensity', sg.scanlineDensity);
      this.syncMaterialsUniform('uScanlineContrast', sg.scanlineContrast);
      this.syncMaterialsUniform('uRollingBandWidth', sg.rollingBandWidth);
      this.syncMaterialsUniform('uRollingBandSpeed', sg.rollingBandSpeed);
      this.syncMaterialsUniform('uRollingBandDirection', sg.rollingBandDirection);
      this.syncMaterialsUniform('uPixelGridVisibility', sg.pixelGridVisibility);
    }
    if (partialParams.spatialAndEdge) {
      Object.assign(this.params.spatialAndEdge, partialParams.spatialAndEdge);
      const se = this.params.spatialAndEdge;
      this.syncMaterialsUniform('uEdgeVignetteSoftness', se.edgeVignetteSoftness);
      this.syncMaterialsUniform('uFresnelIntensity', se.fresnelFadeIntensity);
      this.ghostMaterial.uniforms.uGhostOpacity.value = se.ghostPlaneOpacity;
      if (se.ghostPlaneDepthOffset !== undefined) {
        this.ghostMesh.position.z = -se.ghostPlaneDepthOffset;
      }
      if (se.backFaceVisibility !== undefined) {
        const modeVal = resolveBackFaceModeCode(se.backFaceVisibility);
        this.syncMaterialsUniform('uBackFaceMode', modeVal);
        const targetSide = se.backFaceVisibility === 'culled' ? THREE.FrontSide : THREE.DoubleSide;
        this.primaryMaterial.side = targetSide;
        this.ghostMaterial.side = targetSide;
      }
    }
    if (partialParams.glitchCadence) {
      Object.assign(this.params.glitchCadence, partialParams.glitchCadence);
    }
    if (partialParams.glitchSeverity) {
      Object.assign(this.params.glitchSeverity, partialParams.glitchSeverity);
      const gs = this.params.glitchSeverity;
      this.syncMaterialsUniform('uSliceDisplacementMax', gs.maxSliceDisplacement);
      this.syncMaterialsUniform('uSliceCount', gs.sliceDensityCount);
      this.syncMaterialsUniform('uChromaSplitDist', gs.chromaticAberrationDistance);
      this.syncMaterialsUniform('uChromaSplitAngle', gs.chromaticAberrationAngleRad);
      this.syncMaterialsUniform('uStaticNoiseIntensity', gs.staticNoiseIntensity);
      this.syncMaterialsUniform('uPosterizeLevels', gs.posterizationLevels);
    }
    if (partialParams.playback && this.videoController) {
      Object.assign(this.params.playback, partialParams.playback);
      if (partialParams.playback.playing !== undefined) {
        if (partialParams.playback.playing) this.videoController.play();
        else this.videoController.pause();
      }
      if (partialParams.playback.loop !== undefined) {
        this.videoController.setLoop(partialParams.playback.loop);
      }
      if (partialParams.playback.playbackRate !== undefined) {
        this.videoController.setPlaybackRate(partialParams.playback.playbackRate);
      }
      if (partialParams.playback.currentTimeSec !== undefined) {
        this.videoController.scrubToTime(partialParams.playback.currentTimeSec);
      }
    }
  }

  getParams() {
    return deepCloneParams(this.params);
  }

  materialize(options = {}) {
    this.lifecycleState = 'materializing';
    this.targetStateDuration = options.durationSec || 0.68;
    this.materializeAxis = options.axis === 'vertical' ? 'vertical' : 'horizontal';
    this.stateElapsedSec = 0.0;
    this.lifecycleProgress = 0.0;
    this.rootGroup.visible = true;
    if (this.videoController) {
      this.videoController.play();
      this.params.playback.playing = true;
    }
  }

  dematerialize(options = {}) {
    this.lifecycleState = 'dematerializing';
    this.targetStateDuration = options.durationSec || 0.60;
    this.stateElapsedSec = 0.0;
    this.lifecycleProgress = 0.0;
  }

  setAgitatedState(isAgitated, options = {}) {
    if (isAgitated) {
      this.lifecycleState = 'agitated';
      this.lifecycleProgress = 1.0;
      const tint = options.alertTint || 'crimson_alert';
      if (HOLO_SPECTRAL_TINT_PRESETS[tint]) {
        this.setParams({
          colorAndLuminance: {
            primaryTintHex: HOLO_SPECTRAL_TINT_PRESETS[tint].primaryHex,
            secondaryTintHex: HOLO_SPECTRAL_TINT_PRESETS[tint].secondaryHex,
          }
        });
      }
    } else {
      this.lifecycleState = 'active';
      this.lifecycleProgress = 1.0;
      const defaultTint = this.assetSpec.defaultTintPreset || 'cyan';
      if (HOLO_SPECTRAL_TINT_PRESETS[defaultTint]) {
        const preset = HOLO_SPECTRAL_TINT_PRESETS[defaultTint];
        const nextColorParams = {
          primaryTintHex: preset.primaryHex,
          secondaryTintHex: preset.secondaryHex,
        };
        if (typeof this.assetSpec.colorRemapWeight === 'number') {
          nextColorParams.colorRemapWeight = this.assetSpec.colorRemapWeight;
        } else if (typeof preset.colorRemapWeight === 'number') {
          nextColorParams.colorRemapWeight = preset.colorRemapWeight;
        }
        this.setParams({
          colorAndLuminance: nextColorParams,
        });
      }
    }
  }

  swapMediaSource(targetAssetIdOrSpec, options = {}) {
    this.pendingSwapSpec = resolveHoloMediaSpec(targetAssetIdOrSpec.id || targetAssetIdOrSpec);
    this.lifecycleState = 'swapping';
    this.targetStateDuration = options.durationSec || 0.44;
    this.stateElapsedSec = 0.0;
    this.lifecycleProgress = 0.0;
    this.swapExecuted = false;
  }

  executeAtomicSwap() {
    if (!this.pendingSwapSpec) return;
    const nextSpec = this.pendingSwapSpec;
    this.pendingSwapSpec = null;
    this.swapExecuted = true;

    if (this.textureController) {
      this.textureController.dispose();
    }

    this.assetSpec = nextSpec;
    this.id = nextSpec.id;
    this.code = nextSpec.code;
    this.index = nextSpec.index;
    this.mediaType = nextSpec.mediaType;

    this.geoSpec = computeHologramColumnGeometrySpec(nextSpec);
    this.primaryMesh.geometry.dispose();
    this.primaryMesh.geometry = this.geoSpec.primaryGeometry;
    this.ghostMesh.geometry.dispose();
    this.ghostMesh.geometry = this.geoSpec.ghostGeometry;

    this.textureController = createHoloMediaTextureController(nextSpec, {
      playing: this.params.playback.playing,
      loop: this.params.playback.loop,
      playbackRate: this.params.playback.playbackRate,
    });
    this.videoController = this.mediaType === 'video' ? this.textureController : null;

    const modeVal = nextSpec.studioBackdropMode === 'backdrop_keyed_white_scale_preserved' ? 2 : 1;
    this.syncMaterialsUniform('uMap', this.textureController.texture);
    this.syncMaterialsUniform('uAspectRatio', nextSpec.aspectRatio);
    this.syncMaterialsUniform('uIsVideo', nextSpec.mediaType === 'video' ? 1.0 : 0.0);
    this.syncMaterialsUniform('uBypassExteriorCutout', nextSpec.bypassExteriorCutout ? 1.0 : 0.0);
    this.syncMaterialsUniform('uHasDarkSubjectFloor', nextSpec.hasDarkSubjectFloor ? 1.0 : 0.0);
    this.syncMaterialsUniform('uDarkSubjectFloorAlpha', nextSpec.darkSubjectFloorMinAlpha || 0.28);
    this.syncMaterialsUniform('uIsHighKeyStudioBackdrop', nextSpec.isHighKeyStudioBackdrop ? 1.0 : 0.0);
    this.syncMaterialsUniform('uStudioBackdropMode', modeVal);
  }

  triggerGlitchBurst(options = {}) {
    this.manualBurstState.active = true;
    this.manualBurstState.intensity = options.intensity ?? 0.95;
    this.manualBurstState.durationSec = options.durationSec ?? 0.35;
    this.manualBurstState.elapsedSec = 0.0;
  }

  triggerManualGlitchBurst(options = {}) {
    this.triggerGlitchBurst(options);
  }

  play() {
    if (this.videoController) {
      this.videoController.play();
      this.params.playback.playing = true;
    }
  }
  pause() {
    if (this.videoController) {
      this.videoController.pause();
      this.params.playback.playing = false;
    }
  }
  togglePlay() {
    if (!this.videoController) return false;
    const isPlaying = this.videoController.togglePlay();
    this.params.playback.playing = isPlaying;
    return isPlaying;
  }
  setLoop(l) {
    if (this.videoController) {
      this.videoController.setLoop(l);
      this.params.playback.loop = this.videoController.loop;
    }
  }
  setPlaybackRate(r) {
    if (this.videoController) {
      this.videoController.setPlaybackRate(r);
      this.params.playback.playbackRate = this.videoController.playbackRate;
    }
  }
  scrubToTime(t) {
    if (this.videoController) {
      this.videoController.scrubToTime(t);
      this.params.playback.currentTimeSec = this.videoController.currentTimeSec;
    }
  }
  scrubToFrame(f) {
    if (this.videoController) {
      this.videoController.scrubToFrame(f);
      this.params.playback.currentTimeSec = this.videoController.currentTimeSec;
    }
  }
  resetFrameZero() {
    if (this.videoController) {
      this.videoController.resetFrameZero();
      this.params.playback.currentTimeSec = 0.0;
    }
    if (this.documentController) {
      this.documentController.scrollToProgress(0.0, true);
    }
  }

  scrollDocumentByPixels(deltaY, immediate = false) {
    if (!this.documentController) return 0.0;
    return this.documentController.scrollByPixels(deltaY, immediate);
  }

  scrollDocumentToProgress(progress, immediate = false) {
    if (!this.documentController) return 0.0;
    return this.documentController.scrollToProgress(progress, immediate);
  }

  scrollDocumentPage(deltaPages = 1, immediate = false) {
    if (!this.documentController) return 0.0;
    this.triggerGlitchBurst({ intensity: 0.42, durationSec: 0.14 });
    return this.documentController.scrollPage(deltaPages, immediate);
  }

  evaluateDocumentHitAction(hitUv) {
    if (!hitUv || !this.documentController) return null;
    const u = hitUv.x;
    const v = hitUv.y;
    // Top-Right Close / Back Button: canvas x in [876, 1180] (u in [0.73, 0.985]), y in [16, 68] (v in [0.95, 0.995])
    if (u >= 0.72 && v >= 0.935) {
      return 'close';
    }
    // Bottom Footer Buttons: y in [1492, 1560] (v <= 0.048)
    if (v <= 0.052) {
      if (u >= 0.52 && u <= 0.675) return 'page-up';
      if (u > 0.675 && u <= 0.822) return 'page-down';
      if (u > 0.822 && u <= 0.985) return 'open-pdf';
    }
    // Right-Edge Vertical Scrollbar Track: x >= 1144 (u >= 0.945), y in [96, 1480] (v in [0.052, 0.938])
    if (u >= 0.945 && v > 0.052 && v < 0.938) {
      const targetProgress = Math.max(0.0, Math.min(1.0, 1.0 - (v - 0.052) / (0.938 - 0.052)));
      this.documentController.scrollToProgress(targetProgress, false);
      return 'scrollbar-jump';
    }
    return null;
  }

  beginDocumentDrag(clientX, clientY, hitUv = null) {
    if (!this.documentController) return false;
    this.docDragGesture.active = true;
    this.docDragGesture.startClientX = clientX;
    this.docDragGesture.startClientY = clientY;
    this.docDragGesture.lastClientY = clientY;
    this.docDragGesture.maxTravelPx = 0.0;
    this.docDragGesture.startUvX = hitUv ? hitUv.x : 0.5;
    this.docDragGesture.startUvY = hitUv ? hitUv.y : 0.5;
    return true;
  }

  updateDocumentDrag(clientX, clientY, viewportHeightPx = 800) {
    if (!this.docDragGesture.active || !this.documentController) return 0.0;
    const dy = clientY - this.docDragGesture.lastClientY;
    this.docDragGesture.lastClientY = clientY;
    const totalTravel = Math.hypot(
      clientX - this.docDragGesture.startClientX,
      clientY - this.docDragGesture.startClientY
    );
    if (totalTravel > this.docDragGesture.maxTravelPx) {
      this.docDragGesture.maxTravelPx = totalTravel;
    }
    const scaleY = (this.documentController.bodyHeight * 1.45) / Math.max(240, viewportHeightPx * 0.72);
    return this.documentController.scrollByPixels(-dy * scaleY, true);
  }

  endDocumentDrag(clientX, clientY) {
    if (!this.docDragGesture.active || !this.documentController) return null;
    this.docDragGesture.active = false;
    const travel = this.docDragGesture.maxTravelPx;
    if (travel <= 10.0) {
      return this.evaluateDocumentHitAction({
        x: this.docDragGesture.startUvX,
        y: this.docDragGesture.startUvY,
      });
    }
    return 'drag-scroll';
  }

  update(dt, timeSec, activeChar = null, camera = null) {
    if (this.manualBurstState.active) {
      this.manualBurstState.elapsedSec += dt;
      if (this.manualBurstState.elapsedSec >= this.manualBurstState.durationSec) {
        this.manualBurstState.active = false;
        this.manualBurstState.intensity = 0.0;
      }
    }

    // Spring-settle horizontal carousel slide offset during commit or cancel
    if (this.slideTransitionState === 'settling-commit' || this.slideTransitionState === 'settling-cancel') {
      const springRate = this.slideTransitionState === 'settling-commit' ? 14.5 : 16.0;
      const alpha = Math.min(1.0, springRate * dt);
      this.slideOffset += (this.slideTargetOffset - this.slideOffset) * alpha;
      if (Math.abs(this.slideTargetOffset - this.slideOffset) < 0.008) {
        if (this.slideTransitionState === 'settling-commit') {
          this.activeSlideIndex = this.nextSlideIndex;
        } else {
          this.nextSlideIndex = this.activeSlideIndex;
        }
        this.slideOffset = 0.0;
        this.slideTargetOffset = 0.0;
        this.slideTransitionState = 'idle';
        this.syncCarouselUniforms();
      } else {
        this.syncMaterialsUniform('uSlideOffset', this.slideOffset);
      }
    }

    if (this.lifecycleState === 'materializing' || this.lifecycleState === 'swapping' || this.lifecycleState === 'dematerializing') {
      this.stateElapsedSec += dt;
      this.lifecycleProgress = Math.min(1.0, this.stateElapsedSec / this.targetStateDuration);

      if (this.lifecycleState === 'swapping' && this.lifecycleProgress >= 0.50 && !this.swapExecuted) {
        this.executeAtomicSwap();
      }

      if (this.lifecycleProgress >= 1.0) {
        if (this.lifecycleState === 'materializing' || this.lifecycleState === 'swapping') {
          this.lifecycleState = 'active';
          this.lifecycleProgress = 1.0;
        } else if (this.lifecycleState === 'dematerializing') {
          this.lifecycleState = 'inactive';
          this.lifecycleProgress = 0.0;
          this.rootGroup.visible = false;
          if (this.videoController) {
            this.videoController.pause();
            this.params.playback.playing = false;
          }
          this.enforceTwoSlotVideoWindow();
        }
      }
    }

    const glitch = evaluateHologramGlitchDynamics(
      timeSec,
      this.index,
      this.params,
      this.lifecycleState,
      this.manualBurstState.active ? this.manualBurstState : null
    );

    if (this.documentController && typeof this.documentController.update === 'function') {
      this.documentController.update(dt);
    }

    if (this.videoController && typeof this.videoController.stepVideoClock === 'function') {
      const clockState = this.videoController.stepVideoClock(dt, glitch.frameStutterState);
      this.params.playback.playing = this.videoController.playing;
      this.params.playback.currentTimeSec = clockState.currentTimeSec;
      this.params.playback.frameStutterActive = clockState.stutterActive;
    }
    if (this.slideTransitionState !== 'idle' && this.nextSlideIndex !== this.activeSlideIndex) {
      const nextCtrl = this.slideControllers.get(this.nextSlideIndex);
      if (nextCtrl && typeof nextCtrl.stepVideoClock === 'function') {
        nextCtrl.stepVideoClock(dt, null);
      }
    }

    const envelope = evaluateLifecycleStateEnvelope(this.lifecycleState, this.lifecycleProgress, this.params);
    const stateIntMap = { inactive: 0, materializing: 1, active: 2, agitated: 3, swapping: 4, dematerializing: 5 };
    const stateVal = stateIntMap[this.lifecycleState] ?? 2;
    const effGlitch = Math.min(1.0, glitch.glitchIntensity + envelope.glitchBoost);

    for (const m of [this.primaryMaterial, this.ghostMaterial]) {
      m.uniforms.uTime.value = timeSec;
      m.uniforms.uLifecycleState.value = stateVal;
      m.uniforms.uLifecycleProgress.value = this.lifecycleProgress;
      m.uniforms.uMaterializeLineExpansion.value = envelope.materializeLineExpansion;
      m.uniforms.uMaterializeSurge.value = envelope.materializeSurge;
      m.uniforms.uGlitchIntensity.value = effGlitch;
      m.uniforms.uBlockJitterAmount.value = glitch.blockJitterUv.x !== 0.0 ? 0.05 : 0.0;
      m.uniforms.uVsyncSlipOffset.value = glitch.vsyncSlipUvY;
      m.uniforms.uVsyncEdgeFade.value = glitch.vsyncEdgeFade;
      m.uniforms.uDropoutFactor.value = glitch.dropoutFactor;
    }
  }

  getTransformState() {
    const x = Number(this.rootGroup.position.x.toFixed(4));
    const y = Number(this.rootGroup.position.y.toFixed(4));
    const yRel = Number((this.rootGroup.position.y - this.floorY).toFixed(4));
    const z = Number(this.rootGroup.position.z.toFixed(4));
    const pitchRad = Number(this.rootGroup.rotation.x.toFixed(4));
    const yawRad = Number(this.rootGroup.rotation.y.toFixed(4));
    const rollRad = Number(this.rootGroup.rotation.z.toFixed(4));
    const scaleX = Number(this.rootGroup.scale.x.toFixed(4));
    const scaleY = Number(this.rootGroup.scale.y.toFixed(4));
    const scaleZ = Number(this.rootGroup.scale.z.toFixed(4));
    const planeWidthMeters = Number((this.geoSpec.planeWidth * scaleX).toFixed(4));
    const planeHeightMeters = Number((this.geoSpec.planeHeight * scaleY).toFixed(4));
    return {
      id: this.id,
      code: this.code,
      index: this.index,
      wallSide: x < 0 ? 'L' : 'R',
      x,
      y,
      yRel,
      z,
      pitchRad,
      yawRad,
      rollRad,
      scale: scaleX,
      scaleX,
      scaleY,
      scaleZ,
      planeWidthMeters,
      planeHeightMeters,
      basePlaneWidthMeters: this.geoSpec.planeWidth,
      basePlaneHeightMeters: this.geoSpec.planeHeight,
      aspectRatio: this.assetSpec.aspectRatio,
    };
  }

  setTransformState(partial = {}) {
    if (!partial || typeof partial !== 'object') return this.getTransformState();
    if (typeof partial.x === 'number' && Number.isFinite(partial.x)) {
      this.rootGroup.position.x = partial.x;
    }
    if (typeof partial.yRel === 'number' && Number.isFinite(partial.yRel)) {
      this.rootGroup.position.y = this.floorY + partial.yRel;
    } else if (typeof partial.y === 'number' && Number.isFinite(partial.y)) {
      this.rootGroup.position.y = partial.y;
    }
    if (typeof partial.z === 'number' && Number.isFinite(partial.z)) {
      this.rootGroup.position.z = partial.z;
    }
    if (typeof partial.pitchRad === 'number' && Number.isFinite(partial.pitchRad)) {
      this.rootGroup.rotation.x = partial.pitchRad;
    }
    if (typeof partial.yawRad === 'number' && Number.isFinite(partial.yawRad)) {
      this.rootGroup.rotation.y = partial.yawRad;
    }
    if (typeof partial.rollRad === 'number' && Number.isFinite(partial.rollRad)) {
      this.rootGroup.rotation.z = partial.rollRad;
    }
    if (typeof partial.scale === 'number' && Number.isFinite(partial.scale)) {
      const s = Math.max(0.1, Math.min(10.0, partial.scale));
      this.rootGroup.scale.set(s, s, 1.0);
    } else {
      if (typeof partial.scaleX === 'number' && Number.isFinite(partial.scaleX)) {
        this.rootGroup.scale.x = Math.max(0.1, Math.min(10.0, partial.scaleX));
      }
      if (typeof partial.scaleY === 'number' && Number.isFinite(partial.scaleY)) {
        this.rootGroup.scale.y = Math.max(0.1, Math.min(10.0, partial.scaleY));
      }
      if (typeof partial.scaleZ === 'number' && Number.isFinite(partial.scaleZ)) {
        this.rootGroup.scale.z = Math.max(0.1, Math.min(10.0, partial.scaleZ));
      }
    }
    this.rootGroup.updateMatrixWorld(true);
    return this.getTransformState();
  }

  resetTransformToDefault() {
    this.rootGroup.position.set(
      this.defaultPlacement.x,
      this.floorY + this.defaultPlacement.yRel,
      this.defaultPlacement.z
    );
    this.rootGroup.rotation.set(
      this.defaultPlacement.pitchRad,
      this.defaultPlacement.yawRad,
      this.defaultPlacement.rollRad
    );
    this.rootGroup.scale.set(
      this.defaultPlacement.scaleX,
      this.defaultPlacement.scaleY,
      this.defaultPlacement.scaleZ
    );
    this.rootGroup.updateMatrixWorld(true);
    return this.getTransformState();
  }

  getStateSummary() {
    const activeSlide = this.slides[this.activeSlideIndex] || this.assetSpec;
    return {
      id: this.id,
      code: this.code,
      index: this.index,
      mediaType: this.mediaType,
      isCarousel: this.isCarousel,
      isScrollableDocument: Boolean(this.isScrollableDocument),
      documentPage: this.documentController ? this.documentController.currentPage : null,
      documentTotalPages: this.documentController ? this.documentController.pages.length : null,
      documentScrollProgress: this.documentController ? Number(this.documentController.scrollProgress.toFixed(4)) : null,
      slideCount: this.slides.length,
      activeSlideIndex: this.activeSlideIndex,
      nextSlideIndex: this.nextSlideIndex,
      slideOffset: Number(this.slideOffset.toFixed(4)),
      slideTransitionState: this.slideTransitionState,
      activeSlideLabel: activeSlide.label || activeSlide.id,
      activeSlideMediaType: activeSlide.mediaType,
      lifecycleState: this.lifecycleState,
      lifecycleProgress: this.lifecycleProgress,
      isVisible: this.rootGroup.visible,
      currentFrame: this.videoController ? this.videoController.displayedFrameIndex : 0,
      playing: this.videoController ? this.videoController.playing : false,
      aspectRatio: this.assetSpec.aspectRatio,
      transform: this.getTransformState(),
      params: this.getParams(),
    };
  }

  dispose() {
    for (const ctrl of this.slideControllers.values()) {
      if (ctrl && typeof ctrl.dispose === 'function') {
        ctrl.dispose();
      }
    }
    this.slideControllers.clear();
    if (this.textureController) {
      this.textureController.dispose();
      this.textureController = null;
    }
    if (this.primaryMesh) {
      this.primaryMesh.geometry.dispose();
      this.primaryMaterial.dispose();
    }
    if (this.ghostMesh) {
      this.ghostMesh.geometry.dispose();
      this.ghostMaterial.dispose();
    }
    if (this.auraMesh) {
      this.auraMesh.geometry.dispose();
      this.auraMesh.material.dispose();
    }
    if (this.selectionFrame) {
      this.selectionFrame.geometry.dispose();
      this.selectionFrame.material.dispose();
    }
  }
}

export function createHologramColumnInstance(assetSpec, options = {}) {
  return new HologramColumnInstance(assetSpec, options);
}

// ============================================================================
// 11. Hologram Columns System Factory (Ticket-005)
// ============================================================================
export const HOLO_COLUMNS_STORAGE_KEY = 'skatealley_holo_columns_transforms_v1';

export function buildHologramColumnsSystem(options = {}) {
  const rootGroup = options.rootGroup || new THREE.Group();
  rootGroup.name = options.name || 'HologramMediaColumnsRootGroup';
  rootGroup.renderOrder = options.renderOrder ?? 11;

  const floorY = options.floorY ?? 0.0;
  const uTimeUniform = options.uTimeUniform || { value: 0.0 };
  const applyStencilReject = options.applyStencilReject || null;
  const storageKey = options.storageKey || HOLO_COLUMNS_STORAGE_KEY;

  const columns = [];
  const columnsById = {};
  const raycastTargets = [];

  for (const asset of HOLO_MEDIA_MANIFEST) {
    const colInstance = new HologramColumnInstance(asset, {
      floorY,
      uTimeUniform,
      applyStencilReject,
      initialState: options.initialState || 'active',
      params: options.params || null,
    });
    columns.push(colInstance);
    columnsById[asset.id] = colInstance;
    columnsById[asset.code] = colInstance;
    columnsById[asset.repoPath] = colInstance;
    columnsById[String(asset.index)] = colInstance;
    columnsById[asset.index] = colInstance;
    raycastTargets.push(colInstance.primaryMesh);
    rootGroup.add(colInstance.rootGroup);
  }

  let forceAllVisible = options.forceAllVisible ?? true;
  let editModeActive = false;
  let selectedColumnId = columns[0] ? columns[0].id : 'holo_slide_carousel';
  let activeDragColumnId = null;
  let activeSwipeColumnId = null;
  let hoveredColumnId = null;
  const dragPlane = new THREE.Plane();
  const dragGrabOffset = new THREE.Vector3();
  const tempPlaneNormal = new THREE.Vector3();
  const tempHitPoint = new THREE.Vector3();

  function updateSelectionHighlights() {
    for (const col of columns) {
      const isSelected = col.id === selectedColumnId;
      const isDragging = activeDragColumnId === col.id;
      const isHovered = Boolean(col.allowDirectDrag && hoveredColumnId === col.id);
      if (typeof col.setSelectionHighlight === 'function') {
        col.setSelectionHighlight(isSelected || isDragging || isHovered);
      }
      if (col.selectionFrame) {
        col.selectionFrame.visible = Boolean(
          (editModeActive && isSelected) || isDragging || isHovered
        );
      }
    }
  }

  function loadTransformsFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;
      for (const col of columns) {
        const saved = parsed[col.id];
        if (saved && typeof saved === 'object') {
          col.setTransformState(saved);
        }
      }
      return true;
    } catch (err) {
      console.warn('[hologram_columns] Failed to load saved transforms:', err);
      return false;
    }
  }

  function saveTransformsToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const payload = {};
      for (const col of columns) {
        payload[col.id] = col.getTransformState();
      }
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('[hologram_columns] Failed to save transforms:', err);
      return false;
    }
  }

  if (options.loadSavedTransforms !== false) {
    loadTransformsFromStorage();
  }

  return {
    rootGroup,
    columns,
    columnsById,
    raycastTargets,
    count: columns.length,
    totalCount: columns.length,
    staticCount: columns.filter((c) => c.mediaType === 'image').length,
    videoCount: columns.filter((c) => c.mediaType === 'video').length,
    carouselCount: columns.filter((c) => c.isCarousel).length,

    getColumn(idOrIndex) {
      if (idOrIndex === undefined || idOrIndex === null) {
        return columnsById[selectedColumnId] || columns[0];
      }
      return columnsById[idOrIndex] || null;
    },

    getSelectedColumn() {
      return columnsById[selectedColumnId] || columns[0];
    },

    setEditModeActive(active) {
      editModeActive = Boolean(active);
      updateSelectionHighlights();
      return editModeActive;
    },

    isEditModeActive() {
      return editModeActive;
    },

    get activeDragColumnId() {
      return activeDragColumnId;
    },

    get activeSwipeColumnId() {
      return activeSwipeColumnId;
    },

    get hoveredColumnId() {
      return hoveredColumnId;
    },

    setHoveredColumn(idOrIndex) {
      const col = idOrIndex ? columnsById[idOrIndex] : null;
      const nextId = col ? col.id : null;
      if (hoveredColumnId !== nextId) {
        hoveredColumnId = nextId;
        updateSelectionHighlights();
      }
      return hoveredColumnId;
    },

    beginSlideSwipe(idOrIndex, clientX, clientY, hitUv = null) {
      const col = this.getColumn(idOrIndex);
      if (!col || !col.isCarousel) return null;
      selectedColumnId = col.id;
      activeSwipeColumnId = col.id;
      col.beginSwipe(clientX, clientY, hitUv);
      return col;
    },

    updateSlideSwipe(clientX, clientY, viewportWidthPx = 1280) {
      if (!activeSwipeColumnId) return null;
      const col = this.getColumn(activeSwipeColumnId);
      if (!col) return null;
      col.updateSwipe(clientX, clientY, viewportWidthPx);
      return col;
    },

    endSlideSwipe(clientX, clientY) {
      if (!activeSwipeColumnId) return null;
      const col = this.getColumn(activeSwipeColumnId);
      activeSwipeColumnId = null;
      if (!col) return null;
      col.endSwipe(clientX, clientY);
      return col;
    },

    nextSlide(idOrIndex) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      col.nextSlide();
      return col;
    },

    prevSlide(idOrIndex) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      col.prevSlide();
      return col;
    },

    goToSlide(idOrIndex, slideIndex, opts = {}) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      col.goToSlide(slideIndex, opts);
      return col;
    },

    addSlideToColumn(idOrIndex, slideSpec, makeActive = true) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      col.addSlide(slideSpec, makeActive);
      return col;
    },

    setColumnSlides(idOrIndex, slidesArray) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      col.setSlides(slidesArray);
      return col;
    },

    beginDrag(idOrIndex, worldRay, camera) {
      const col = this.getColumn(idOrIndex);
      if (!col || !camera) return null;
      selectedColumnId = col.id;
      activeDragColumnId = col.id;

      camera.getWorldDirection(tempPlaneNormal).negate();
      dragPlane.setFromNormalAndCoplanarPoint(tempPlaneNormal, col.rootGroup.position);

      if (worldRay && worldRay.intersectPlane(dragPlane, tempHitPoint)) {
        dragGrabOffset.subVectors(col.rootGroup.position, tempHitPoint);
      } else {
        dragGrabOffset.set(0, 0, 0);
      }

      col.triggerGlitchBurst({ intensity: 0.45, durationSec: 0.16 });
      updateSelectionHighlights();
      return col;
    },

    updateDrag(worldRay) {
      if (!activeDragColumnId || !worldRay) return null;
      const col = this.getColumn(activeDragColumnId);
      if (!col) return null;

      if (worldRay.intersectPlane(dragPlane, tempHitPoint)) {
        const nextX = THREE.MathUtils.clamp(tempHitPoint.x + dragGrabOffset.x, -3.5, 3.5);
        const nextY = THREE.MathUtils.clamp(tempHitPoint.y + dragGrabOffset.y, floorY + 0.1, floorY + 7.5);
        const nextZ = THREE.MathUtils.clamp(tempHitPoint.z + dragGrabOffset.z, -2.0, 56.0);
        col.rootGroup.position.set(nextX, nextY, nextZ);
        col.rootGroup.updateMatrixWorld(true);
        if (typeof col.onTransformMutated === 'function') {
          col.onTransformMutated();
        }
      }
      return col;
    },

    endDrag() {
      if (!activeDragColumnId) return null;
      const col = this.getColumn(activeDragColumnId);
      activeDragColumnId = null;
      if (col && typeof col.onTransformMutated === 'function') {
        col.onTransformMutated();
      }
      saveTransformsToStorage();
      updateSelectionHighlights();
      return col;
    },

    getColumnTransform(idOrIndex) {
      const col = this.getColumn(idOrIndex);
      return col ? col.getTransformState() : null;
    },

    setColumnTransform(idOrIndex, partialTransform, persist = true) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      const updated = col.setTransformState(partialTransform);
      if (persist) {
        saveTransformsToStorage();
      }
      return updated;
    },

    resetColumnTransform(idOrIndex, persist = true) {
      const col = this.getColumn(idOrIndex);
      if (!col) return null;
      const updated = col.resetTransformToDefault();
      if (persist) {
        saveTransformsToStorage();
      }
      return updated;
    },

    resetAllColumnTransforms(persist = true) {
      for (const col of columns) {
        col.resetTransformToDefault();
      }
      if (persist && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(storageKey);
      }
      return this.exportTransformManifest();
    },

    saveTransformsToStorage,
    loadTransformsFromStorage,

    exportTransformManifest() {
      return columns.map((col) => {
        const t = col.getTransformState();
        return {
          index: col.index,
          id: col.id,
          code: col.code,
          repoPath: col.assetSpec.repoPath,
          corridorPlacement: {
            wallSide: t.wallSide,
            x: t.x,
            yRel: t.yRel,
            z: t.z,
            yawRad: t.yawRad,
            pitchRad: t.pitchRad,
            rollRad: t.rollRad,
          },
          scale: {
            x: t.scaleX,
            y: t.scaleY,
            z: t.scaleZ,
          },
          planeWidthMeters: t.planeWidthMeters,
          planeHeightMeters: t.planeHeightMeters,
        };
      });
    },

    setColumnState(idOrIndex, targetState, opts = {}) {
      const col = this.getColumn(idOrIndex);
      if (!col) return false;
      if (targetState === 'materializing') col.materialize(opts);
      else if (targetState === 'dematerializing') col.dematerialize(opts);
      else if (targetState === 'agitated') col.setAgitatedState(true, opts);
      else if (targetState === 'active') col.setAgitatedState(false, opts);
      else if (targetState === 'swapping') {
        if (col.isCarousel) {
          col.nextSlide();
        } else {
          const nextId = opts.targetAssetId || (col.index % 17 + 1);
          col.swapMediaSource(nextId, opts);
        }
      } else if (targetState === 'inactive') {
        col.lifecycleState = 'inactive';
        col.rootGroup.visible = false;
        if (col.videoController) col.videoController.pause();
        col.enforceTwoSlotVideoWindow();
      }
      return true;
    },

    swapColumnMedia(idOrIndex, targetAssetId, opts = {}) {
      const col = this.getColumn(idOrIndex);
      if (!col) return false;
      col.swapMediaSource(targetAssetId, opts);
      return true;
    },

    setParams(idOrIndex, partialParams) {
      const col = this.getColumn(idOrIndex);
      if (!col) return false;
      col.setParams(partialParams);
      return true;
    },

    setGlobalParams(partialParams) {
      for (const col of columns) {
        col.setParams(partialParams);
      }
      return true;
    },

    setAllColumnsForceVisible(force) {
      forceAllVisible = Boolean(force);
    },

    setSelectedColumn(idOrIndex) {
      const col = columnsById[idOrIndex];
      if (col) {
        selectedColumnId = col.id;
      } else if (typeof idOrIndex === 'string') {
        selectedColumnId = idOrIndex;
      }
      updateSelectionHighlights();
      return selectedColumnId;
    },

    registerCustomColumn(customCol) {
      if (!customCol || !customCol.id) return null;
      if (!columnsById[customCol.id]) {
        columns.push(customCol);
      }
      columnsById[customCol.id] = customCol;
      if (customCol.code) columnsById[customCol.code] = customCol;
      if (customCol.index !== undefined) {
        columnsById[String(customCol.index)] = customCol;
        columnsById[customCol.index] = customCol;
      }
      if (customCol.primaryMesh) {
        customCol.primaryMesh.userData.holoColumnId = customCol.id;
        if (!raycastTargets.includes(customCol.primaryMesh)) {
          raycastTargets.push(customCol.primaryMesh);
        }
      }
      if (Array.isArray(customCol.raycastTargets)) {
        for (const t of customCol.raycastTargets) {
          t.userData.holoColumnId = customCol.id;
          if (!raycastTargets.includes(t)) {
            raycastTargets.push(t);
          }
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed[customCol.id]) {
              const saved = parsed[customCol.id];
              const isLegacyWaterColorDefault =
                customCol.id === 'watercolor_gallery' &&
                ((Math.abs((saved.z ?? 0) - 42.2) < 1e-2 && Math.abs((saved.scale ?? 1) - 1.0) < 1e-2) ||
                  (Math.abs((saved.z ?? 0) - 42.786) < 1e-2 && Math.abs((saved.scale ?? 1) - 1.875) < 1e-2) ||
                  (Math.abs((saved.z ?? 0) - 42.6182) < 1e-3 && Math.abs((saved.scale ?? 1) - 1.875) < 1e-2));
              if (!isLegacyWaterColorDefault) {
                customCol.setTransformState(saved);
              } else {
                parsed[customCol.id] = customCol.getTransformState();
                window.localStorage.setItem(storageKey, JSON.stringify(parsed));
              }
            }
          }
        } catch (_) {}
      }
      return customCol;
    },

    update(dt, timeSec, activeChar = null, camera = null) {
      let centerZ = 0.0;
      if (camera && camera.position) {
        centerZ = camera.position.z;
      } else if (activeChar && activeChar.position) {
        centerZ = activeChar.position.z;
      }
      const windowDistance = options.activeVisibleWindowMeters ?? Infinity;

      for (const col of columns) {
        if (col.rootGroup && col.rootGroup.userData && col.rootGroup.userData.culledBySceneCutter) {
          col.rootGroup.visible = false;
          if (col.primaryMesh) col.primaryMesh.visible = false;
          if (col.ghostMesh) col.ghostMesh.visible = false;
          if (col.auraMesh) col.auraMesh.visible = false;
          if (col.selectionFrame) col.selectionFrame.visible = false;
          continue;
        }
        const isActiveLifecycle = col.lifecycleState !== 'inactive';
        if (col.rootGroup) col.rootGroup.visible = isActiveLifecycle;
        if (typeof col.update === 'function') {
          col.update(dt, timeSec, activeChar, camera);
        }

        const distZ = col.rootGroup ? Math.abs(col.rootGroup.position.z - centerZ) : 0;
        const shouldRenderMeshes =
          isActiveLifecycle && (forceAllVisible || editModeActive || distZ <= windowDistance || col.id === selectedColumnId);

        if (col.primaryMesh) col.primaryMesh.visible = shouldRenderMeshes;
        if (col.ghostMesh) col.ghostMesh.visible = shouldRenderMeshes;
        if (col.auraMesh) {
          col.auraMesh.visible = shouldRenderMeshes;
        }
        if (col.selectionFrame) {
          const isSelected = col.id === selectedColumnId;
          const isDragging = activeDragColumnId === col.id;
          const isHovered = Boolean(col.allowDirectDrag && hoveredColumnId === col.id);
          col.selectionFrame.visible = Boolean(
            ((editModeActive && isSelected) || isDragging || isHovered) && shouldRenderMeshes
          );
        }
      }
    },

    getTelemetry() {
      const counts = { inactive: 0, materializing: 0, active: 0, agitated: 0, swapping: 0, dematerializing: 0 };
      const summaries = [];
      const summariesById = {};
      for (const col of columns) {
        const s = col.getStateSummary();
        summaries.push(s);
        summariesById[col.id] = s;
        if (counts[col.lifecycleState] !== undefined) {
          counts[col.lifecycleState]++;
        }
      }
      return {
        totalCount: columns.length,
        staticCount: columns.filter((c) => c.mediaType === 'image').length,
        videoCount: columns.filter((c) => c.mediaType === 'video').length,
        carouselCount: columns.filter((c) => c.isCarousel).length,
        columns: summaries,
        columnsById: summariesById,
        activeStateCounts: counts,
        selectedColumnId,
        editModeActive,
      };
    },

    dispose() {
      for (const col of columns) {
        col.dispose();
      }
      rootGroup.clear();
    },
  };
}
