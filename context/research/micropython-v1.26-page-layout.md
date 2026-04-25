# MicroPython v1.26.0 — Interactive Release Notes Page Layout

Section-by-section design for the proposed first build on the new shared infrastructure
(`_layouts/release-notes.html` + `_includes/release-notes/*` + `assets/css/release-notes.css`
+ `assets/js/release-notes.js`).

Source: `/tmp/mpy-tags/v1.26.0.txt` (annotated tag), and the cross-release digest at
`context/research/micropython-releases-v1.24-v1.28-digest.md`.

**Probe results that constrain this page**:
- ❌ `marshal` not in pyscript variant (FULL_FEATURES, not EVERYTHING).
- ❌ no `dis` module anywhere in MicroPython.
- ✅ `function.__code__` available (FULL_FEATURES gates it).

---

## Page metadata (front-matter shape)

Goes at the top of `micropython-v1.26/index.html`. Drives the shared layout.

```yaml
---
layout: release-notes
title: MicroPython v1.26.0 Release Notes
version: v1.26.0
pyscript: true

hero:
  badge: "Past Release"        # v1.28 says "New Release"; older releases get a different label
  version: "v1.26"
  tagline: "I2CTarget, the float-accuracy overhaul, native emitter wins, plus STM32N6 and ESP32-C2."
  date: "August 9, 2025"

summary_cards:
  - { icon: "🔌", title: "machine.I2CTarget", desc: "Python responds on I2C", target: "i2ctarget" }
  - { icon: "🎯", title: "Float accuracy", desc: "98.5% repr-reversibility", target: "floats" }
  - { icon: "⚡", title: "Native emitter", desc: "Tighter code on every arch", target: "native" }
  - { icon: "📡", title: "Counter / Encoder", desc: "Hardware pulse counting (esp32)", target: "counter" }

stats:
  - { value: 46, label: "Contributors" }
  - { value: 13, label: "Timezones" }
  - { value: 10, label: "New Boards" }

mpy_banner:
  headline: "Float and language demos on this page run real MicroPython in your browser."
  body: "MicroPython is compiled to WebAssembly via PyScript and executes live as the page loads."

toc:
  - { id: "i2ctarget",   label: "machine.I2CTarget" }
  - { id: "floats",      label: "Float Accuracy" }
  - { id: "native",      label: "Native Emitter" }
  - { id: "counter",     label: "Counter / Encoder" }
  - { id: "language",    label: "Language Tweaks" }
  - { id: "n6c2",        label: "STM32N6 + ESP32-C2" }
  - { id: "highlights",  label: "Highlights" }

boards:
  summary: "10 new board definitions across 4 ports."
  groups:
    - port: "esp32"
      boards: ["GARATRONIC_PYBSTICK26_ESP32C3", "SPARKFUN_IOT_REDBOARD_ESP32"]
    - port: "samd"
      boards: ["SPARKFUN_REDBOARD_TURBO", "SPARKFUN_SAMD21_DEV_BREAKOUT"]
    - port: "stm32"
      boards: ["NUCLEO_N657X0", "OPENMV_N6"]
    - port: "zephyr"
      boards: ["beagleplay_cc1352p7", "nrf5340dk", "nrf9151dk", "rpi_pico"]

numbers:
  summary: "v1.26 in numbers — esp32 grew most, driven by ESP-IDF v5.4.2."
  cards:
    - { value: 46, label: "Contributors" }
    - { value: 13, label: "Timezones" }
    - { value: 10, label: "New Boards" }
  code_size:
    title: "Code size delta vs v1.25 (text section)"
    rows:
      - { port: "esp32",      delta_kb: 19,  bar_pct: 100, tooltip: "+1.12% — IDF 5.4.2 + I2CTarget" }
      - { port: "stm32",      delta_kb: 4,   bar_pct: 21,  tooltip: "+0.97% — I2CTarget, float accuracy, native emitter" }
      - { port: "esp8266",    delta_kb: 3,   bar_pct: 18,  tooltip: "+0.50% — LX3 opcodes, LittleFS v2.11" }
      - { port: "samd",       delta_kb: 3,   bar_pct: 17,  tooltip: "+1.23% — I2CTarget, float accuracy" }
      - { port: "mimxrt",     delta_kb: 4,   bar_pct: 19,  tooltip: "+0.97% — I2CTarget, float accuracy" }
      - { port: "rp2",        delta_kb: 1,   bar_pct: 5,   tooltip: "+0.25% — compressed error messages saved 3kB" }
      - { port: "unix",       delta_kb: 0,   bar_pct: 2,   tooltip: "-0.05% — bss reduction, DTLS additions" }
      - { port: "bare-arm",   delta_kb: -0.1,bar_pct: 1,   tooltip: "-0.17% — int var-arg handling" }
  contributors: |
    Alessandro Gatti, Andrea Giammarchi, Andrew Leech, Angus Gratton, Anson Mansfield,
    Anton Blanchard, Ayush Singh, Chris Webb, Christian Lang, Damien George,
    Daniel Campora, Daniël van de Giessen, David Schneider, David Yang, Detlev Zundel,
    Dryw Wade, dubiousjim, Elvis Pfutzenreuter, ennyKey, Garatronic, Herwin Grobben,
    iabdalkader, IhorNehrutsa, Jeff Epler, Jim Mussared, Jonathan Hogg, Jos Verlinde,
    Koudai Aono, Malcolm McKellips, Matt Trentini, Maureen Helm, Meir Armon,
    Patrick Joy, Peter Harper, Phil Howard, purewack, Rick Sorensen, robert-hh, root,
    SiZiOUS, stijn, TianShuang Ke, Vdragon, Yanfeng Liu, Yoctopuce dev, Yuuki NAGAO.
---
```

(Front-matter aliases: numbers + stats overlap — keep one; stats ribbon is at top of page,
numbers section is at bottom with chart. Likely drop the duplicate `numbers.cards` and
just reference the same block, or keep both with different framings.)

---

## Section 1 — `#i2ctarget` (Tier A — bespoke)

**Heading**: "machine.I2CTarget — Your MCU answers, not just asks"
**Badge**: NEW
**Description**: One paragraph framing the inversion of the usual relationship: an
MCU running MicroPython that *responds* to I2C transactions instead of initiating them.
Available on **alif, esp32, mimxrt, rp2, samd, stm32, zephyr**.

### Demo concept

Two-MCU SVG diagram on a horizontal I2C bus.
- Left MCU labelled "Controller" (running CPython on a host, hypothetically).
- Right MCU labelled "Target — your MicroPython board".
- Below the target: a `bytearray(16)` rendered as a 16-cell grid, each cell labelled by index.
- Controls:
  - "Address (hex)" input (default `0x10`).
  - "Write" button: pops up "Write byte 0x42 to register 0x05?" and animates a packet flying
    along the bus from controller to target; the target's `bytearray[5]` cell flashes and
    updates to `0x42`.
  - "Read" button: animates a packet flying back, output area shows `b'\x42'`.
- A "Toggle: Buffer Mode / IRQ Mode" switch at the top.
  - In **Buffer Mode**, the bytearray + `mem_offset=` API is shown.
  - In **IRQ Mode**, an event log appears showing `IRQ_WRITE_REQ`, `IRQ_READ_REQ`, etc., and
    a small Python snippet showing how a callback is registered.

### Code panel (live, syntax-highlighted, copy button)

```python
from machine import I2C, I2CTarget, Pin

# Buffer mode — register/memory device backed by a bytearray
buf = bytearray(16)
target = I2CTarget(0, scl=Pin(1), sda=Pin(0), addr=0x10, mem=buf)

# Controller (on another board / host)
i2c = I2C(0, scl=Pin(3), sda=Pin(2))
i2c.writeto_mem(0x10, 0x05, b'\x42')   # buf[5] becomes 0x42
print(i2c.readfrom_mem(0x10, 0x05, 1)) # b'\x42'
```

### Port matrix

`port-matrix` component, with `alif`, `esp32`, `mimxrt`, `rp2`, `samd`, `stm32`, `zephyr`
each marked `new-in-release`. Other `machine.*`-supporting ports shown in grey for context.

### Bespoke CSS expected

`.i2c-bus-svg`, `.i2c-bytearray-grid`, `.i2c-bytearray-cell`, `.i2c-controls`, `.i2c-irq-log`.
~80 lines. Pattern: bus is a fixed-height SVG; bytearray grid is a CSS grid.

### Bespoke JS expected

Animation primitives copied from v1.28's CAN demo (`requestAnimationFrame` packet flyer,
log append). One mode switch, two action buttons. ~120 lines. **Listens for `themechange`**
to redraw SVG strokes.

### Open question

Should the "controller" side be drawn as another MicroPython board, or as a generic
"host" to keep focus on the target? — leaning generic host so the asymmetry is obvious.

---

## Section 2 — `#floats` (Tier B — PyScript live, with Tier-A infographic)

**Heading**: "Float Accuracy — repr round-trips for real"
**Badge**: IMPROVED
**Description**: Short explanation of repr-reversibility in user-visible terms (not
"OBJ_REPR_C heuristic"). Frame: "before v1.26, ~28% of single-precision floats lost
information when printed and re-parsed. Now it's 98.5%."

### Tier-A infographic (no live code)

Two horizontal bars side by side:
- "v1.25 and earlier: ████░░░░░░░░░░░ 28% (single) / 38% (double)"
- "v1.26+:           ███████████████ 98.5% (single) / 99.8% (double)"

Pure CSS bars with tabular-num counters animating from 0% → target on scroll-in.
Reuses `.numbers-grid` styling but with horizontal bars.

### Tier-B PyScript playground

Editable code panel with this default content:

```python
# Try a tricky float — this is real MicroPython running in your browser.
x = 0.1 + 0.2
print(repr(x))                  # 0.30000000000000004 (CPython-equivalent)
print(float(repr(x)) == x)      # True — repr round-trips

# Some classic offenders:
for v in [1/3, 1e-300, 2**-1074, 1.5e308]:
    s = repr(v)
    print(f"{v!r:30}  -> {s!r:30}  round-trips: {float(s) == v}")
```

Output panel below shows the live results.

### Tier-A "before" pane (static)

Beside the playground, a non-editable code panel labelled **"What v1.25 would have shown"**
with hand-crafted output that uses MicroPython's pre-v1.26 truncation rules — clearly marked
as a historical reproduction. ~6–8 lines.

### Bespoke CSS expected

`.float-bars`, `.float-bar-row`, `.float-comparison-grid` (2-col grid for live vs historical).
~40 lines.

### Bespoke JS expected

Bar-fill animation triggered on scroll-in (IntersectionObserver, ~30 lines).
PyScript wiring is shared (lives in the layout's `pyscript_block`).

### Open question

How explicit do we get about "this would have printed differently in v1.25"? Risk: someone
copy-pastes our hand-crafted "before" output thinking it's authoritative. Mitigation: tag it
with a clear "historical reconstruction" label and a tooltip linking to the upstream PR/commit.

---

## Section 3 — `#native` (Tier C — port matrix + size chart)

**Heading**: "Native & Viper Emitter — every architecture got a tune-up"
**Badge**: IMPROVED
**Description**: One paragraph: more compact loads/stores on **ARM, Thumb, Xtensa, RISC-V 32,
x86, x64**. Thumb v1 (RP2040) gets long jumps >12 bits, allowing larger Python functions to
compile native. Xtensa inline assembler now implements most of LX3 (addx2, subx2, ssl, ssr…).

### Demo concept — Tier C only

Static info panels:
1. **Architecture grid** — 6 chips (ARM, Thumb, Thumb-v1, Xtensa, RV32, x86, x64), each
   showing what changed (mini-list of 2–3 bullets). Reuses `.port-matrix` styling with
   architecture names instead of port names.
2. **Long-jump callout**: a short `.callout` block with the RP2040-specific implication —
   "Functions over a few hundred lines of Python can now compile to `@micropython.native`
   on RP2040."
3. **Code-size impact** mini-chart: just the relevant rows from the by-the-numbers chart,
   filtered to architectures where the emitter actually got bigger/smaller. Probably skip if
   the dedicated by-the-numbers section already shows it.

### Why Tier C, not Tier B

In principle this *could* be Tier B (write a native-emitted function in PyScript and time it).
But: (i) `@micropython.native` exists in the webassembly variant only as the WASM-targeted
emitter, so timing wouldn't reflect the LX3/Thumb-v1 wins anyway; (ii) microbenchmarks in a
browser are noisy and would mislead. Skip the live demo.

### Bespoke CSS expected

None — uses `.port-matrix`, `.callout`, `.highlight-card` from shared CSS.

### Bespoke JS expected

None.

---

## Section 4 — `#counter` (Tier A — bespoke, esp32-only)

**Heading**: "machine.Counter & machine.Encoder — Hardware pulse counting"
**Badge**: NEW
**Description**: New on **esp32** only (via `esp32.PCNT`). `Counter` counts edges; `Encoder`
decodes quadrature for motor rotation. Important caveat: API lives under `machine.*` but is
currently only implemented on esp32.

### Demo concept

Interactive virtual quadrature encoder.
- Left: an SVG circular dial with a tick mark, draggable by mouse/touch.
- Centre: as user drags, two square-wave traces (channel A, channel B) are drawn below,
  90° out of phase. Coloured boxes flash as edges occur.
- Right: a live `count: 0` display that increments/decrements based on rotation direction.
- A "Direction: ↻" indicator that flips based on whether B leads A or A leads B.
- Mode toggle at top: "Counter (single channel)" / "Encoder (quadrature)" — collapses
  channel B trace away when in single-channel mode.

### Code panel

```python
from machine import Pin, Encoder

enc = Encoder(0, phase_a=Pin(4), phase_b=Pin(5))
print(enc.value())   # rotation count, sign indicates direction
```

### Caveat callout

`.callout` block: **"esp32 only in v1.26"** — API lives under `machine.*` but other ports
hadn't picked it up at this release. Useful expectation-setting, since the v1.28 release later
adds standardised cross-port `machine.PWM`/`CAN`.

### Bespoke CSS expected

`.encoder-dial`, `.encoder-traces`, `.encoder-controls`. ~50 lines.

### Bespoke JS expected

Drag handler on dial, draws two-channel waveform on canvas. Tracks angle and decodes
quadrature in JS (mirroring what PCNT does in hardware). Listens for `themechange`. ~150 lines.

---

## Section 5 — `#language` (Tier B — combined PyScript playground)

**Heading**: "Python language tweaks"
**Badge**: NEW
**Description**: Several small additions, easier to digest as one playground with an
example-picker than five tiny demos.

### Demo concept

One PyScript editor with a dropdown of pre-baked examples:

1. **`__all__` in star imports** — small module + `from x import *` semantics.
2. **PEP 487 `__set_name__`** — descriptor whose name is captured at class body time.
3. **`str.format` digit grouping** — `f"{0xdeadbeef:_x}"` and friends.
4. **`array` from any iterable** — `array('i', range(5))` now works.
5. **Slice on stack** — show `bytearray_obj[a:b] = c` working under
   `micropython.heap_lock()` (gc lock). Educational; demonstrates the v1.26 VM win.

Selecting an item swaps the editor contents to the matching example. Run button executes.

### PyScript script (shared, lives in layout's `pyscript_block` for v1.26)

Standard PyScript wiring used by the v1.28 page, lifted as-is, with `mpy-code-editor` /
`mpy-output` element pairs.

### Bespoke CSS expected

`.example-picker` (a styled `<select>`). ~20 lines.

### Bespoke JS expected

`<select>` change handler swaps editor contents from a JS-side dictionary of examples.
~40 lines. **Reusable pattern** — should be extracted to shared JS once we use it on a
second page.

### Open question

Slice-on-stack under `heap_lock` is the cleverest one — but `heap_lock`/`heap_unlock` exist
on `micropython` module at FULL_FEATURES level. Worth verifying via the PyScript playground
once the page is live.

---

## Section 6 — `#n6c2` (Tier C — spec cards)

**Heading**: "STM32N6 & ESP32-C2 — two new MCUs"
**Badge**: NEW PORT MEMBER
**Description**: Two side-by-side spec cards.

- **STM32N6**: 800 MHz, ML accelerators, USB, XSPI memory-mapped flash, deepsleep. Boards:
  `NUCLEO_N657X0`, `OPENMV_N6`.
- **ESP32-C2 (ESP8684)**: low-cost RISC-V, WiFi + BLE, GPIO, I2C, ADC, PWM, timers.

### Demo concept

Two `.highlight-card`-style panels with:
- MCU name (header)
- Key spec strip (clock, RAM, ML accel y/n, radios)
- Supported peripheral list
- Boards-using-it tag list
- "Released in v1.26" badge

The STM32N6 panel could include a small ML-accelerator icon or a callout linking to OpenMV's
N6 board for context, since OpenMV is the target use case.

### Bespoke CSS expected

`.mcu-spec-card`, `.mcu-spec-strip`. ~30 lines. Could be promoted to shared CSS if every
release page uses it (likely yes — spec cards for new MCUs is a recurring pattern).

### Bespoke JS expected

None.

---

## Section 7 — `#highlights` (Tier C — highlights grid)

Reuses the shared `.highlights-grid` / `.highlight-card` components. Brief cards for items
that don't warrant a full section:

- **DTLS server support** (mbedTLS HelloVerify + Anti Replay)
- **lwIP UDP queue** — multiple incoming UDP packets queued
- **`framebuf` ROM blits** — store fonts in ROM
- **`time` module date range standardised** — 1970–2099 across all platforms
- **Compressed error messages on rp2** (-3 kB)
- **mpremote `fs tree`** + better `df`
- **Standard time-function range** across platforms
- **`sys.implementation._thread`** — tells you the threading model (GIL vs unsafe)
- **nrf `enable_irq()` signature change** — *breaking* on nrf only; lead with the warning
- **Zephyr v4.0.0** + PWM/UART/SPI/I2C improvements
- **Webassembly FFI**: `JsProxy` equality, `has`/`get` proxying, self-binding

10–12 cards. Each has icon, h3, 1–2 sentence description, optional port-tag chips.

---

## Section 8 — Sections that already come from the layout

These come "for free" via shared includes — **no per-page work**:

- Hero (front-matter `hero:`)
- Summary cards (front-matter `summary_cards:`)
- Stats ribbon (front-matter `stats:`)
- mpy-banner (front-matter `mpy_banner:`)
- New Boards grid (front-matter `boards:`)
- By the Numbers + code-size chart (front-matter `numbers:`)
- Footer

---

## Estimated effort

Layout + content scaffolding: ~half day (front-matter + Tier C sections).

Bespoke demos:
- I2CTarget (Tier A): ~1 day. SVG bus + bytearray grid + 2 modes is the most ambitious.
- Float accuracy (Tier B + infographic): ~half day.
- Counter/Encoder (Tier A): ~half day. Quadrature canvas is well-bounded.
- Language tweaks (Tier B): ~2 hours.

**Total: ~2.5 days** for v1.26 once shared infra is in place.

Compared to v1.28's ~3 days from scratch, this is the win we're chasing — shared infra
removes the ~half-day of boilerplate per release.

---

## What this build will prove (or break)

1. The shared CSS / layout / includes work end-to-end.
2. The `themechange` event pattern works for bespoke canvas demos.
3. The PyScript playground pattern can be reused outside v1.28.
4. The front-matter schema is rich enough for real content (or what gaps it has).
5. Whether `marshal`/`heap_lock`/etc. behave in the pyscript variant as we predicted from
   the static config inspection.

If anything in 1–4 cracks, we fix it in the shared infra rather than working around it
per-page. That's the whole point of building v1.26 first.

---

## Open questions to resolve before code

1. Does the v1.26 page need a **"jump to v1.27/v1.28"** nav widget at the top, or do we
   defer until the `/releases/` index exists?
2. Hero badge wording for older releases — "Past Release" feels awkward. Alternatives:
   "Released August 2025", or just a date stamp without a badge.
3. Code-size chart: keep both the stats ribbon (top) and the numbers section (bottom), or
   consolidate? They overlap.
4. How aggressive should the Tier-B "before-and-after" framing be on the float section?
   Showing fake historical output has accuracy risks even with disclaimers.
