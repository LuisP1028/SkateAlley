# Functional Specification: Screen-Agnostic Portfolio HUD & Glyph Materialization System

## 1. System Overview & Aesthetic Direction

The objective is to build a screen-agnostic Heads-Up Display (HUD) overlay designed to sit on top of an interactive portfolio viewport (such as a 3D/WebGL canvas or dark media background).

The visual direction combines Swiss neo-grotesque minimalism with retro-industrial telemetry. The HUD must feel engineered, tactile, and lightweight—framing the viewport along its outer perimeter without obstructing the central interactive area. Upon initialization (and during select user interactions), all textual elements must enter the viewport through a synchronized **Glyph Materialization (Cipher Decode)** sequence.

---

## 2. Screen-Agnostic Spatial Architecture

The HUD acts as a persistent, fixed viewport frame that adapts fluidly from compact laptop screens up to ultrawide and 4K displays, as well as mobile/tablet viewports.

* **Perimeter Anchoring:** UI modules are anchored to the extreme corners and edges of the viewport using fluid safe-area inset margins that scale proportionally with screen dimensions.


* **Pointer-Event Passthrough:** The overarching HUD container must remain transparent to pointer/mouse events so the underlying canvas or background remains fully interactive. Only discrete interactive child nodes (e.g., navigation triggers, audio controls, interactive links) may capture pointer events.
* **Fluid Proportional Scaling:** Typography, spacing, and widget dimensions must scale smoothly between minimum and maximum thresholds based on viewport width, preventing elements from becoming illegible on small screens or oversized on ultrawide monitors.
* **Regional Allocation:**
* **Top-Left Region:** Primary identity/branding header, copyright/year stamp, bilingual sub-header (optional Katakana/Kanji accent), and brief role descriptors.


* **Top-Center Region:** Primary navigation bar featuring a high-contrast active state (solid pill container with inverted text) alongside minimalist text links.


* **Top-Right Region:** Single-line real-time system telemetry readout (e.g., connection state, rendering engine, frame time in milliseconds, and live FPS).


* **Bottom-Right Region (Optional/Contextual):** Compact hardware-inspired utility or media status module featuring compartmentalized borders, playback/state indicators, elapsed time, and bitrate/format micro-labels.





---

## 3. Typography & Visual Hierarchy

The typographic system relies on the **Geist** font family to balance editorial clarity with technical precision.

* **Primary Display & Navigation (`Geist Sans`):**
* **Brand Header:** Bold weight, tightly tracked (negative letter-spacing), high-impact scale.


* **Role Descriptors & Sub-labels:** Medium/SemiBold weight, uppercase, tightly stacked line height, slightly muted opacity relative to the main header.


* **Navigation Links:** SemiBold weight, uppercase, clean geometric alignment.




* **Telemetry & Dynamic Counters (`Geist Mono`):**
* Used for all system diagnostics, FPS counters, frame timers, and numerical readouts.


* **Tabular Numerals:** All numeric readouts must enforce fixed-width tabular spacing so rapidly updating values (such as frame times or elapsed seconds) never cause horizontal layout shifts.




* **Color & Luminescence:**
* High-contrast monochromatic signal palette (e.g., vivid CRT crimson/red or amber phosphor over deep void black).


* Subtle ambient text glow (phosphor bleed) applied to foreground typography so characters remain crisp and luminous against dark, high-contrast backgrounds.





---

## 4. Glyph Materialization (Text Decode) Behavior

Rather than fading or sliding in, text elements materialize character-by-character through a controlled digital cipher/glitch sequence.

### 4.1 Lifecycle of a Single Character

Each character in a text string progresses through three distinct states during materialization:

1. **Dormant (Pre-Materialization):** The character slot is invisible, yet its physical layout footprint is already accounted for so the surrounding UI never shifts.
2. **Active Scramble (Materializing):** The character slot rapidly cycles through a curated pool of technical/block glyphs (e.g., `█`, `▓`, `▒`, `░`, `/`, `\`, `|`, `_`, `+`, `#`, `0`, `1`, `<`, `>`). During this transient phase, the character exhibits a visual "hot" state—such as a brighter highlight color or subtle background block tint—to simulate an active CRT/LCD write cycle.
3. **Resolved (Locked-In):** The scrambling ceases, the temporary highlight clears, and the character settles permanently into its final `Geist Sans` or `Geist Mono` glyph.

### 4.2 Temporal & Cadence Rules

* **Directional Wave Progression:** Within any given text string, characters begin their scramble phase in a staggered wave from left to right, with a slight randomized variance on when each individual character locks into its final state. This prevents the animation from looking overly mechanical.
* **Frame-Stepped Scramble Rate:** Glyph swapping during the active scramble state must not occur on every single display refresh tick (which creates an unreadable blur on 60Hz–120Hz+ monitors). Instead, glyph swaps must be throttled to a deliberate, perceptible cadence (updating roughly every 2 to 4 frames) so individual technical symbols register cleanly to the human eye.
* **Duration Scaling:** Short strings (like a 5-letter nav link) resolve briskly (~300ms–450ms), while longer strings (like the telemetry readout) scale their total duration slightly (~600ms–900ms) so the wave sweeps across the line at a consistent visual velocity.
* **Whitespace Preservation:** Spaces and line breaks are ignored by the scramble engine and never display random glyphs.

### 4.3 Layout Stability Requirement (Zero-Jitter Rule)

Because `Geist Sans` is a proportional typeface (where characters like `I` and `W` have vastly different widths), cycling random symbols during the scramble phase can cause words to violently expand and contract horizontally.

* **Requirement:** The bounding box and character flow of every text element must remain 100% locked at its final resolved dimensions throughout the entire animation. Scrambling glyphs must never push adjacent words, wrap lines prematurely, or cause container reflows.

---

## 5. Choreography, Triggers & Interactive States

### 5.1 Boot / Initial Load Sequence

When the portfolio initializes, the HUD executes a staggered boot choreography controlled by per-element start delays:

1. **Beat 1 (0ms – 100ms):** Primary top-left brand identity and top-right telemetry readout begin materializing simultaneously.
2. **Beat 2 (150ms – 250ms):** Primary navigation links stagger in sequentially from left to right.
3. **Beat 3 (200ms – 400ms):** Secondary role descriptors, subtitles, and bottom-corner utility widgets materialize last.

### 5.2 Micro-Interaction Re-Triggers

* **Navigation Hover State:** Hovering over an inactive navigation item (e.g., `WORKS` or `ABOUT`) triggers a rapid, localized re-materialization of that specific label (at ~2x the boot speed) without affecting adjacent layout elements.


* **Dynamic Telemetry Updates:** Once the initial boot sequence completes, the live telemetry string (`Frame: X ms, Y FPS`) transitions from the materialization state into a live data binding where only the numeric values update in place.



---

## 6. Accessibility & Performance Constraints

* **`prefers-reduced-motion` Compliance:** If the user's operating system requests reduced motion, the glyph scramble sequence must be bypassed entirely, rendering all HUD text immediately in its resolved state (or via a simple, fast opacity crossfade).
* **Screen Reader Integrity:** Assistive technologies must only ever read the final, semantic text string (e.g., `"CREATIVE DEVELOPMENT & EXPERIENCE DESIGNER"`). Intermediate scrambled glyphs (`█▓/01`) must be completely hidden from the accessibility tree so screen readers do not announce gibberish during load or hover states.


* **DOM Cleanliness:** Once a text element finishes its materialization sequence, any temporary wrapper nodes or styling artifacts used during the scramble phase must be cleaned up, leaving pure, lightweight text in the DOM.