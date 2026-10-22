import * as THREE from 'three';

// ============================================================================
// 1. Authoritative 17-Asset Manifest & Lookup Tables (anim/hologram_columns.md §2.2)
// ============================================================================
export const HOLO_MEDIA_MANIFEST = Object.freeze([
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
      "wallSide": "R",
      "x": 1.7683,
      "yRel": 3.8346,
      "z": 24.3563,
      "pitchRad": 0,
      "yawRad": 1.5604,
      "rollRad": 0,
      "scale": 3.565,
      "scaleX": 3.565,
      "scaleY": 3.565,
      "scaleZ": 1
    },
    "subjectSummary": "Close-up array of pink monogrammed French fry cartons filled with golden fries, with each carton branded with the burgundy 'PLATO DOOM' throw-up and white 'PLATO' / 'O' interior lettering.",
    "width": 1888,
    "height": 2228,
    "aspectRatio": 0.847,
    "exactAspectRatio": 0.8473967684021544,
    "planeWidthMeters": 4.8723,
    "planeHeightMeters": 5.7496,
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
      "x": 1.18,
      "yRel": 1.56,
      "z": 10.8,
      "pitchRad": 0,
      "yawRad": -0.38,
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
      "x": -1.732,
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
    "index": 7,
    "id": "screen_tag",
    "code": "HOLO-COL-07",
    "mediaType": "image",
    "repoPath": "anim/screentag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/screentag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.28,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "emerald",
    "corridorPlacement": {
      "wallSide": "R",
      "x": 0.1829,
      "yRel": 5.5,
      "z": 36.1684,
      "pitchRad": 0,
      "yawRad": 2.5947,
      "rollRad": 0,
      "scale": 1.266,
      "scaleX": 1.266,
      "scaleY": 1.266,
      "scaleZ": 1
    },
    "subjectSummary": "Close-up of a Eurorack modular synthesizer (Mutable Instruments Clouds) next to a custom Nintendo Game Boy panel displaying the burgundy 'PLATO DOOM' throw-up on its dark screen with patch cables draped across the controls.",
    "width": 2094,
    "height": 2016,
    "aspectRatio": 1.039,
    "exactAspectRatio": 1.0386904761904763,
    "planeWidthMeters": 1.8936,
    "planeHeightMeters": 1.823,
    "fileSizeBytes": 2281959,
    "sha256": "bd1f5eb8362bd10340641adcc9e4d93364147a038664a64b4473add0d75d0b53",
    "meanLuminance": 0.2569,
    "darkPixelRatioBelow30": 0.3522,
    "brightPixelRatioAbove200": 0.0012
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
    "index": 9,
    "id": "thigh_tag",
    "code": "HOLO-COL-09",
    "mediaType": "image",
    "repoPath": "anim/ThighTag.jpeg",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/ThighTag.jpeg",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": false,
    "darkSubjectFloorMinAlpha": 0.14,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "amber",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -1.5962,
      "yRel": 2.383,
      "z": 32.6527,
      "pitchRad": 0,
      "yawRad": 1.5877,
      "rollRad": 0,
      "scale": 1.589,
      "scaleX": 1.589,
      "scaleY": 1.589,
      "scaleZ": 1
    },
    "subjectSummary": "Western portrait of a dark-haired woman in a cream corset and thigh-high stockings holding dual revolvers, with the burgundy 'PLATO DOOM' throw-up across her left thigh.",
    "width": 1888,
    "height": 2256,
    "aspectRatio": 0.837,
    "exactAspectRatio": 0.8368794326241135,
    "planeWidthMeters": 2.1447,
    "planeHeightMeters": 2.5627,
    "fileSizeBytes": 2463585,
    "sha256": "924021b2d4465ad1faa6c9f108eb2b97dd09d35793251f132366d39d993a0576",
    "meanLuminance": 0.4255,
    "darkPixelRatioBelow30": 0.0012,
    "brightPixelRatioAbove200": 0.1397
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
    "index": 12,
    "id": "doomnuns_vid",
    "code": "HOLO-COL-12",
    "mediaType": "video",
    "repoPath": "anim/DOOMNUNS.mp4",
    "canonicalPath": "/Users/diesel/desktop/SkateAlley/anim/DOOMNUNS.mp4",
    "framingMode": "full_frame_rectangular",
    "bypassExteriorCutout": true,
    "hasDarkSubjectFloor": true,
    "darkSubjectFloorMinAlpha": 0.28,
    "isHighKeyStudioBackdrop": false,
    "studioBackdropMode": "none",
    "defaultTintPreset": "amber",
    "corridorPlacement": {
      "wallSide": "L",
      "x": -1.7584,
      "yRel": 3.8148,
      "z": 9.6905,
      "pitchRad": 0.0226,
      "yawRad": 1.5777,
      "rollRad": -0.048,
      "scale": 2.854,
      "scaleX": 2.854,
      "scaleY": 2.854,
      "scaleZ": 1
    },
    "subjectSummary": "Live-action footage of three nuns in cream habits and black veils\u2014each bearing the burgundy 'PLATO DOOM' throw-up across her chest\u2014smoking cigarettes and exhaling smoke in the woods.",
    "width": 640,
    "height": 464,
    "aspectRatio": 1.379,
    "exactAspectRatio": 1.3793103448275863,
    "planeWidthMeters": 5.6686,
    "planeHeightMeters": 4.1098,
    "codec": "h264",
    "pixFmt": "yuv420p",
    "fps": 24,
    "frameRateFraction": "24/1",
    "durationSec": 6.04,
    "exactDurationSec": 6.041667,
    "frameCount": 145,
    "fileSizeBytes": 2207518,
    "sha256": "83c917ae769af096af55fe472d7e94a4ea6a74dc3ff2c641ea505b680589809c",
    "meanLuminance": 0.4245,
    "darkPixelRatioBelow30": 0.182,
    "brightPixelRatioAbove200": 0.2292
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
      "x": 1.4235,
      "yRel": 2.2235,
      "z": 37.4361,
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
      "x": 1.7079,
      "yRel": 6.5791,
      "z": 41.0569,
      "pitchRad": 0,
      "yawRad": -1.5915,
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
  }
].map(a => Object.freeze({
  ...a,
  corridorPlacement: Object.freeze({ ...a.corridorPlacement })
})));

export const HOLO_MEDIA_BY_ID = Object.freeze((() => {
  const map = {};
  for (const asset of HOLO_MEDIA_MANIFEST) {
    map[asset.id] = asset;
    map[asset.code] = asset;
    map[asset.repoPath] = asset;
    map[String(asset.index)] = asset;
    map[asset.index] = asset;
  }
  return map;
})());

export function resolveHoloMediaSpec(identifier) {
  if (identifier == null) {
    throw new Error('[hologram_columns] Cannot resolve null or undefined hologram media spec identifier.');
  }
  const spec = HOLO_MEDIA_BY_ID[identifier];
  if (!spec) {
    throw new Error(`[hologram_columns] Unknown hologram media spec identifier: "${identifier}". Must match one of 17 canonical assets.`);
  }
  return spec;
}

// ============================================================================
// 2. Spectral Color Mapping Presets & Enums (§3, §5, §6)
// ============================================================================
export const HOLO_SPECTRAL_TINT_PRESETS = Object.freeze({
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
      v.src = './' + assetSpec.repoPath;
      v.loop = this.loop;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      v.playbackRate = this.playbackRate;
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

export function createHoloMediaTextureController(assetSpec, options = {}) {
  const spec = resolveHoloMediaSpec(assetSpec.id || assetSpec);
  if (spec.mediaType === 'video') {
    return new HoloVideoStreamController(spec, options);
  }
  let texture;
  if (typeof document !== 'undefined') {
    const loader = new THREE.TextureLoader();
    texture = loader.load('./' + spec.repoPath);
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
uniform float uTime;
uniform float uAspectRatio;
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

void main() {
  vec2 uv = vUv;
  float backFaceMult = 1.0;
  if (!gl_FrontFacing) {
    if (uBackFaceMode == 1) {
      discard;
    } else if (uBackFaceMode == 2) {
      uv.x = 1.0 - uv.x;
      backFaceMult = 0.85;
    } else {
      backFaceMult = 0.42;
    }
  }

  // Glitch: Horizontal Slice Tearing
  if (uGlitchIntensity > 0.001) {
    float sliceBand = floor(uv.y * uSliceCount);
    float sliceTime = floor(uTime * 24.0);
    float sliceHash = sin(sliceBand * 73.1 + sliceTime * 31.7);
    if (abs(sliceHash) > 0.45) {
      float shiftDir = sign(sliceHash);
      uv.x += shiftDir * uGlitchIntensity * uSliceDisplacementMax * abs(sliceHash);
    }
    // Block jitter
    if (uGlitchIntensity > 0.35 && uBlockJitterAmount > 0.001) {
      vec2 blockCoord = floor(uv * 12.0);
      float bHash = pseudoRandom(blockCoord + floor(uTime * 18.0));
      if (bHash < 0.22 * uGlitchIntensity) {
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
    float vx = smoothstep(0.0, uEdgeVignetteSoftness, uv.x) * smoothstep(0.0, uEdgeVignetteSoftness, 1.0 - uv.x);
    float vy = smoothstep(0.0, uEdgeVignetteSoftness, uv.y) * smoothstep(0.0, uEdgeVignetteSoftness, 1.0 - uv.y);
    vEdge = clamp(vx * vy, 0.0, 1.0);
  }

  // Chromatic Aberration Channel Splitting (§4.2)
  vec2 chromaDelta = vec2(0.0);
  if (uGlitchIntensity > 0.001 || uChromaSplitDist > 0.001) {
    float rEdge = smoothstep(0.25, 0.50, max(abs(uv.x - 0.5), abs(uv.y - 0.5))) * 0.0025;
    float cDist = rEdge + uGlitchIntensity * uChromaSplitDist;
    chromaDelta = cDist * vec2(cos(uChromaSplitAngle), sin(uChromaSplitAngle));
  }

  vec4 colR = texture2D(uMap, uv + chromaDelta);
  vec4 colG = texture2D(uMap, uv);
  vec4 colB = texture2D(uMap, uv - chromaDelta);
  vec3 srcRgb = vec3(colR.r, colG.g, colB.b);

  float srcLum = 0.2126 * srcRgb.r + 0.7152 * srcRgb.g + 0.0722 * srcRgb.b;
  float chroma = max(srcRgb.r, max(srcRgb.g, srcRgb.b)) - min(srcRgb.r, min(srcRgb.g, srcRgb.b));
  float redDom = srcRgb.r - 0.5 * (srcRgb.g + srcRgb.b);

  // Pre-processing & Cutout logic
  float cutoutMask = 1.0;
  float effLum = srcLum;
  float tagWeight = (redDom >= 0.12) ? 0.85 : 0.0;

  if (uIsHighKeyStudioBackdrop > 0.5) {
    if (uStudioBackdropMode == 1) {
      // Default Full-Frame Tonal Separation
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
      // Optional White-Scale-Preserved Backdrop Keying
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
  float targetAlpha = alphaLum + tagWeight * 0.25;

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

  // Glitch Static & White Noise Injection
  if (uGlitchIntensity > 0.001 && uStaticNoiseIntensity > 0.001) {
    float noise = pseudoRandom(uv + fract(uTime * 17.0));
    finalRgb = mix(finalRgb, vec3(noise), uGlitchIntensity * uStaticNoiseIntensity * 0.45);
  }

  // Glitch Posterization / Bit-depth reduction
  if (uGlitchIntensity > 0.30 && uPosterizeLevels < 63.0) {
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

  const uniforms = {
    uMap: { value: texture || createDeterministicPlaceholderTexture(spec) },
    uTime: uTimeUniform || { value: 0.0 },
    uAspectRatio: { value: spec.aspectRatio },
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

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: HOLO_COLUMN_VERTEX_SHADER,
    fragmentShader: HOLO_COLUMN_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: p.spatialAndEdge.backFaceVisibility === 'culled' ? THREE.FrontSide : THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
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
    }
    if (this.assetSpec.hasDarkSubjectFloor) {
      this.params.colorAndLuminance.darkSubjectFloorMinAlpha = this.assetSpec.darkSubjectFloorMinAlpha;
    }
    if (this.assetSpec.isHighKeyStudioBackdrop) {
      this.params.colorAndLuminance.studioBackdropMode = this.assetSpec.studioBackdropMode || 'full_frame_tonal_separation';
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

    // Media Texture Controller
    this.textureController = createHoloMediaTextureController(this.assetSpec, {
      playing: this.params.playback.playing,
      loop: this.params.playback.loop,
      playbackRate: this.params.playback.playbackRate,
    });
    this.videoController = this.mediaType === 'video' ? this.textureController : null;

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
        this.setParams({
          colorAndLuminance: {
            primaryTintHex: HOLO_SPECTRAL_TINT_PRESETS[defaultTint].primaryHex,
            secondaryTintHex: HOLO_SPECTRAL_TINT_PRESETS[defaultTint].secondaryHex,
          }
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
  }

  update(dt, timeSec, activeChar = null, camera = null) {
    if (this.manualBurstState.active) {
      this.manualBurstState.elapsedSec += dt;
      if (this.manualBurstState.elapsedSec >= this.manualBurstState.durationSec) {
        this.manualBurstState.active = false;
        this.manualBurstState.intensity = 0.0;
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

    if (this.videoController) {
      const clockState = this.videoController.stepVideoClock(dt, glitch.frameStutterState);
      this.params.playback.playing = this.videoController.playing;
      this.params.playback.currentTimeSec = clockState.currentTimeSec;
      this.params.playback.frameStutterActive = clockState.stutterActive;
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
    return {
      id: this.id,
      code: this.code,
      index: this.index,
      mediaType: this.mediaType,
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
  let selectedColumnId = columns[0] ? columns[0].id : 'frenchfry_tag';
  let activeDragColumnId = null;
  const dragPlane = new THREE.Plane();
  const dragGrabOffset = new THREE.Vector3();
  const tempPlaneNormal = new THREE.Vector3();
  const tempHitPoint = new THREE.Vector3();

  function updateSelectionHighlights() {
    for (const col of columns) {
      if (col.selectionFrame) {
        col.selectionFrame.visible = Boolean((editModeActive || activeDragColumnId) && col.id === selectedColumnId);
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
    totalCount: columns.length,
    staticCount: columns.filter((c) => c.mediaType === 'image').length,
    videoCount: columns.filter((c) => c.mediaType === 'video').length,

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
        const nextY = THREE.MathUtils.clamp(tempHitPoint.y + dragGrabOffset.y, floorY + 0.1, floorY + 5.5);
        const nextZ = THREE.MathUtils.clamp(tempHitPoint.z + dragGrabOffset.z, -2.0, 56.0);
        col.rootGroup.position.set(nextX, nextY, nextZ);
        col.rootGroup.updateMatrixWorld(true);
      }
      return col;
    },

    endDrag() {
      if (!activeDragColumnId) return null;
      const col = this.getColumn(activeDragColumnId);
      activeDragColumnId = null;
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
        const nextId = opts.targetAssetId || (col.index % 17 + 1);
        col.swapMediaSource(nextId, opts);
      } else if (targetState === 'inactive') {
        col.lifecycleState = 'inactive';
        col.rootGroup.visible = false;
        if (col.videoController) col.videoController.pause();
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

    update(dt, timeSec, activeChar = null, camera = null) {
      let centerZ = 0.0;
      if (camera && camera.position) {
        centerZ = camera.position.z;
      } else if (activeChar && activeChar.position) {
        centerZ = activeChar.position.z;
      }
      const windowDistance = options.activeVisibleWindowMeters ?? Infinity;

      for (const col of columns) {
        col.update(dt, timeSec, activeChar, camera);

        const isActiveLifecycle = col.lifecycleState !== 'inactive';
        const distZ = Math.abs(col.rootGroup.position.z - centerZ);
        const shouldRenderMeshes =
          isActiveLifecycle && (forceAllVisible || editModeActive || distZ <= windowDistance || col.id === selectedColumnId);

        col.primaryMesh.visible = shouldRenderMeshes;
        col.ghostMesh.visible = shouldRenderMeshes;
        if (col.auraMesh) {
          col.auraMesh.visible = shouldRenderMeshes;
        }
        if (col.selectionFrame) {
          col.selectionFrame.visible = Boolean(editModeActive && col.id === selectedColumnId && shouldRenderMeshes);
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
